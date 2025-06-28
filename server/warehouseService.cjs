// Simple warehouse and inventory management
const warehouses = [];
const locations = [];
// Inventory is stored as an array of records with explicit IDs so tests can
// inspect individual items when needed.
const inventory = [];
// Access bookings so inventory actions can update booking warehouse information
const { bookings } = require('./ogplService.cjs');

function createWarehouse(name, branchId = null, address = '', city = '', status = 'active') {
  if (!name) throw new Error('Name required');
  const warehouse = { id: warehouses.length + 1, name, branchId, address, city, status };
  warehouses.push(warehouse);
  return warehouse;
}

function createLocation(warehouseId, name, type = 'bin', capacity = null) {
  const warehouse = warehouses.find(w => w.id == warehouseId);
  if (!warehouse) throw new Error(`Warehouse ${warehouseId} not found`);
  if (!name) throw new Error('Name required');
  const location = { id: locations.length + 1, warehouseId, name, type, capacity };
  locations.push(location);
  return location;
}

function findInventoryRecord(locationId, itemId) {
  return inventory.find(i => i.warehouseLocationId == locationId && i.articleId === itemId);
}

function inbound({ locationId, itemId, quantity, status = 'available', bookingId = null }) {
  if (quantity <= 0) throw new Error('Quantity must be positive');
  if (!locations.find(l => l.id == locationId)) {
    throw new Error(`Location ${locationId} not found`);
  }
  let record = findInventoryRecord(locationId, itemId);
  if (!record) {
    record = { id: inventory.length + 1, articleId: itemId, warehouseLocationId: locationId, quantity: 0, lastMovedAt: new Date().toISOString(), status };
    inventory.push(record);
  }
  record.quantity += quantity;
  record.lastMovedAt = new Date().toISOString();
  record.status = status;
  if (bookingId) {
    const booking = bookings.find(b => b.id == bookingId);
    if (booking) {
      booking.current_warehouse_location_id = locationId;
      booking.warehouse_status = 'in_warehouse';
    }
  }
  return record.quantity;
}

function outbound({ locationId, itemId, quantity, bookingId = null }) {
  if (quantity <= 0) throw new Error('Quantity must be positive');
  if (!locations.find(l => l.id == locationId)) {
    throw new Error(`Location ${locationId} not found`);
  }
  const record = findInventoryRecord(locationId, itemId);
  if (!record || record.quantity < quantity) throw new Error('Insufficient inventory');
  record.quantity -= quantity;
  record.lastMovedAt = new Date().toISOString();
  if (bookingId) {
    const booking = bookings.find(b => b.id == bookingId);
    if (booking) {
      booking.current_warehouse_location_id = null;
      booking.warehouse_status = 'in_transit';
    }
  }
  return record.quantity;
}

function transfer({ fromLocationId, toLocationId, itemId, quantity }) {
  outbound({ locationId: fromLocationId, itemId, quantity });
  inbound({ locationId: toLocationId, itemId, quantity });
}

function getInventory(locationId, itemId) {
  const record = findInventoryRecord(locationId, itemId);
  return record ? record.quantity : 0;
}

function reset() {
  warehouses.length = 0;
  locations.length = 0;
  inventory.length = 0;
}

module.exports = {
  createWarehouse,
  createLocation,
  inbound,
  outbound,
  transfer,
  getInventory,
  warehouses,
  locations,
  inventory,
  reset,
};
