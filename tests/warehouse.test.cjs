const assert = require('assert');
const {
  createWarehouse,
  createLocation,
  inbound,
  outbound,
  getInventory,
  reset
} = require('../server/warehouseService.cjs');

reset();

const w = createWarehouse('Main Warehouse');
const loc = createLocation(w.id, 'A1');

inbound({ locationId: loc.id, itemId: 'ITEM1', quantity: 10 });
assert.strictEqual(getInventory(loc.id, 'ITEM1'), 10);

outbound({ locationId: loc.id, itemId: 'ITEM1', quantity: 4 });
assert.strictEqual(getInventory(loc.id, 'ITEM1'), 6);

console.log('Warehouse inbound and outbound operations updated inventory correctly');
