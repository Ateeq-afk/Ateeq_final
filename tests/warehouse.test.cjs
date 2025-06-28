const assert = require('assert');
const {
  createWarehouse,
  createLocation,
  inbound,
  outbound,
  transfer,
  getInventory,
  reset
} = require('../server/warehouseService.cjs');
const { bookings } = require('../server/ogplService.cjs');

reset();

bookings.push({ id: 1, status: 'booked' });

const w = createWarehouse('Main Warehouse');
const loc = createLocation(w.id, 'A1');

inbound({ locationId: loc.id, itemId: 'ITEM1', quantity: 10, bookingId: 1 });
assert.strictEqual(getInventory(loc.id, 'ITEM1'), 10);
assert.strictEqual(bookings[0].current_warehouse_location_id, loc.id);
assert.strictEqual(bookings[0].warehouse_status, 'in_warehouse');

outbound({ locationId: loc.id, itemId: 'ITEM1', quantity: 4, bookingId: 1 });
assert.strictEqual(getInventory(loc.id, 'ITEM1'), 6);
assert.strictEqual(bookings[0].current_warehouse_location_id, null);
assert.strictEqual(bookings[0].warehouse_status, 'in_transit');

const loc2 = createLocation(w.id, 'B1');

transfer({ fromLocationId: loc.id, toLocationId: loc2.id, itemId: 'ITEM1', quantity: 2 });

assert.strictEqual(getInventory(loc.id, 'ITEM1'), 4);
assert.strictEqual(getInventory(loc2.id, 'ITEM1'), 2);

console.log('Warehouse inbound, outbound and transfer operations updated inventory correctly');
