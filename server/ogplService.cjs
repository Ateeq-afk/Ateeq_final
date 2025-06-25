const bookings = [];
const ogpls = [];

const STATUS_UNLOADED = 'unloaded';
const STATUS_OUT_FOR_DELIVERY = 'out_for_delivery';

function createOGPL({ lrIds = [], ...data }) {
  const ogpl = { id: ogpls.length + 1, lrIds, status: 'created', ...data };
  const previous = new Map();
  try {
    ogpls.push(ogpl);
    for (const id of lrIds) {
      const booking = bookings.find(b => b.id === id);
      if (!booking) throw new Error(`Booking ${id} not found`);
      previous.set(id, booking.status);
      booking.status = 'in_transit';
    }
    return ogpl;
  } catch (err) {
    const idx = ogpls.indexOf(ogpl);
    if (idx !== -1) ogpls.splice(idx, 1);
    for (const [id, status] of previous) {
      const booking = bookings.find(b => b.id === id);
      if (booking) booking.status = status;
    }
    throw err;
  }
}

function completeUnloading(ogplId) {

  const ogpl = ogpls.find(o => o.id == ogplId);
  if (!ogpl) throw new Error(`OGPL ${ogplId} not found`);

  const previous = new Map();
  try {
    for (const id of ogpl.lrIds) {
      const booking = bookings.find(b => b.id === id);
      if (!booking) throw new Error(`Booking ${id} not found`);
      previous.set(id, booking.status);
      booking.status = STATUS_UNLOADED;
    }

    ogpl.status = 'unloaded';
    return ogpl;
  } catch (err) {
    // rollback on error
    for (const [id, status] of previous) {
      const booking = bookings.find(b => b.id === id);
      if (booking) booking.status = status;
    }
    throw err;
  }
}

function startDelivery(lrId) {
  const booking = bookings.find(b => b.id == lrId);
  if (!booking) throw new Error(`Booking ${lrId} not found`);
  booking.status = STATUS_OUT_FOR_DELIVERY;
  return booking;
}

function markDelivered(lrId) {
  const booking = bookings.find(b => b.id == lrId);
  if (!booking) throw new Error(`Booking ${lrId} not found`);
  booking.status = 'delivered';
  return booking;
}

function reset() {
  bookings.length = 0;
  ogpls.length = 0;
}

module.exports = {
  createOGPL,
  completeUnloading,
  startDelivery,
  markDelivered,
  bookings,
  ogpls,
  reset,
  STATUS_UNLOADED,
  STATUS_OUT_FOR_DELIVERY,
};
