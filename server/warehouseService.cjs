// Simple warehouse and inventory management
const warehouses = [];
const locations = [];
const inventory = new Map();

function createWarehouse(name) {
  if (!name) throw new Error('Name required');
  const warehouse = { id: warehouses.length + 1, name };
  warehouses.push(warehouse);
  return warehouse;
}

function createLocation(warehouseId, name) {
  const warehouse = warehouses.find(w => w.id == warehouseId);
  if (!warehouse) throw new Error(`Warehouse ${warehouseId} not found`);
  if (!name) throw new Error('Name required');
  const location = { id: locations.length + 1, warehouseId, name };
  locations.push(location);
  return location;
}

function key(locationId, itemId) {
  return `${locationId}-${itemId}`;
}

function inbound({ locationId, itemId, quantity }) {
  if (quantity <= 0) throw new Error('Quantity must be positive');
  if (!locations.find(l => l.id == locationId)) {
    throw new Error(`Location ${locationId} not found`);
  }
  const k = key(locationId, itemId);
  const current = inventory.get(k) || 0;
  inventory.set(k, current + quantity);
  return inventory.get(k);
}

function outbound({ locationId, itemId, quantity }) {
  if (quantity <= 0) throw new Error('Quantity must be positive');
  if (!locations.find(l => l.id == locationId)) {
    throw new Error(`Location ${locationId} not found`);
  }
  const k = key(locationId, itemId);
  const current = inventory.get(k) || 0;
  if (current < quantity) throw new Error('Insufficient inventory');
  inventory.set(k, current - quantity);
  return inventory.get(k);
}

function getInventory(locationId, itemId) {
  const k = key(locationId, itemId);
  return inventory.get(k) || 0;
}

function reset() {
  warehouses.length = 0;
  locations.length = 0;
  inventory.clear();
}

module.exports = {
  createWarehouse,
  createLocation,
  inbound,
  outbound,
  getInventory,
  warehouses,
  locations,
  inventory,
  reset,
};
