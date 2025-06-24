const bookings = [];
const ogpls = [];

function createOGPL({ lrIds = [], ...data }) {
  const ogpl = { id: ogpls.length + 1, lrIds, ...data };
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

function reset() {
  bookings.length = 0;
  ogpls.length = 0;
}

module.exports = { createOGPL, bookings, ogpls, reset };
