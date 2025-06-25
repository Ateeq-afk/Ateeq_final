const assert = require('assert');
const {
  createOGPL,
  completeUnloading,
  startDelivery,
  markDelivered,
  bookings,
  ogpls,
  reset,
  STATUS_UNLOADED,
  STATUS_OUT_FOR_DELIVERY,
} = require('../server/ogplService.cjs');

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

