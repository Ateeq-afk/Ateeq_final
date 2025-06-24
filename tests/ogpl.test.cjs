const assert = require('assert');
const { createOGPL, bookings, ogpls, reset } = require('../server/ogplService.cjs');

reset();

bookings.push({ id: 1, status: 'booked' }, { id: 2, status: 'booked' });

const ogpl = createOGPL({ lrIds: [1, 2], vehicleId: 'V1' });

assert.strictEqual(bookings[0].status, 'in_transit');
assert.strictEqual(bookings[1].status, 'in_transit');
assert.strictEqual(ogpl.lrIds.length, 2);
assert.strictEqual(ogpls.length, 1);
console.log('OGPL creation updated LR statuses successfully');
