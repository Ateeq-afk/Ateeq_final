const assert = require('assert');
const {
  createOGPL,
  completeUnloading,
  initiateDelivery,
  bookings,
  ogpls,
  reset,
  STATUS_WAREHOUSE,
} = require('../server/ogplService.cjs');

reset();

bookings.push({ id: 1, status: 'booked' }, { id: 2, status: 'booked' });

const ogpl = createOGPL({ lrIds: [1, 2], vehicleId: 'V1' });

assert.strictEqual(bookings[0].status, 'in_transit');
assert.strictEqual(bookings[1].status, 'in_transit');
assert.strictEqual(ogpl.lrIds.length, 2);
assert.strictEqual(ogpls.length, 1);

completeUnloading(ogpl.id);

assert.strictEqual(bookings[0].status, STATUS_WAREHOUSE);
assert.strictEqual(bookings[1].status, STATUS_WAREHOUSE);
assert.strictEqual(ogpl.status, 'unloaded');

initiateDelivery(1);
initiateDelivery(2);

assert.strictEqual(bookings[0].status, 'delivered');
assert.strictEqual(bookings[1].status, 'delivered');

console.log('OGPL unloading updated LR statuses to warehouse successfully');

