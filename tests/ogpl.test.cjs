const assert = require('assert');

// In-memory data structures and helper functions formerly provided by the
// removed Express backend.
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

reset();

bookings.push({ id: 1, status: 'booked' }, { id: 2, status: 'booked' });

const ogpl = createOGPL({ lrIds: [1, 2], vehicleId: 'V1' });

assert.strictEqual(bookings[0].status, 'in_transit');
assert.strictEqual(bookings[1].status, 'in_transit');
assert.strictEqual(ogpl.lrIds.length, 2);
assert.strictEqual(ogpls.length, 1);

completeUnloading(ogpl.id);

assert.strictEqual(bookings[0].status, STATUS_UNLOADED);
assert.strictEqual(bookings[1].status, STATUS_UNLOADED);
assert.strictEqual(ogpl.status, 'unloaded');

startDelivery(1);
startDelivery(2);

assert.strictEqual(bookings[0].status, STATUS_OUT_FOR_DELIVERY);
assert.strictEqual(bookings[1].status, STATUS_OUT_FOR_DELIVERY);

markDelivered(1);
markDelivered(2);

assert.strictEqual(bookings[0].status, 'delivered');
assert.strictEqual(bookings[1].status, 'delivered');

console.log('OGPL unloading updated LR statuses to unloaded, delivery initiated and completed successfully');

