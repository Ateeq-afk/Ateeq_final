const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ogplService = require('./ogplService.cjs');
const warehouseService = require('./warehouseService.cjs');

const billingService = require('./billingService.cjs');
const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json());

const SECRET = process.env.JWT_SECRET || 'secret';

// In-memory data stores
const organizations = [
  { id: 1, code: 'DC001', name: 'Default Org' }
];

const branches = [
  { id: 1, orgId: 1, code: 'DC001-BR01', name: 'Main Branch' },
  { id: 2, orgId: 1, code: 'DC001-BR02', name: 'Second Branch' }
];

const users = [
  {
    id: 1,
    code: 'SA-000',
    orgId: null,
    branchId: null,
    username: 'tabateeq@gmail.com',
    fullName: 'Super Admin',
    passwordHash: bcrypt.hashSync('superadmin', 10),
    role: 'superadmin'
  }
];
// Share the same bookings array with the OGPL service so that status updates
// performed there are reflected in API responses
const bookings = ogplService.bookings;
const lrSequences = {};

function generateLRNumber(branchCode = 'DC') {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const key = `${branchCode}-${year}${month}`;
  lrSequences[key] = (lrSequences[key] || 0) + 1;
  const sequence = lrSequences[key];
  return `${branchCode}${year}${month}-${String(sequence).padStart(4, '0')}`;
}

function pad(num, size) {
  return num.toString().padStart(size, '0');
}

function generateOrgCode(num) {
  return `ORG${pad(num, 3)}`;
}

function generateBranchCode(org, num) {
  return `${org.code}-BR${pad(num, 2)}`;
}

function generateUserCode(branchCode) {
  const count = users.filter(u => u.code.startsWith(branchCode)).length + 1;
  return `${branchCode}-USR${pad(count, 3)}`;
}

app.post('/api/signup', async (req, res) => {
  const { fullName, desiredUsername, password, branchId, role } = req.body;
  const branch = branches.find(b => b.code === branchId);
  if (!branch) return res.status(400).json({ error: 'Invalid branch' });

  const orgId = branch.orgId;
  let username = desiredUsername;
  let suffix = 1;
  while (users.some(u => u.orgId === orgId && u.username === username)) {
    username = `${desiredUsername}${suffix}`;
    suffix += 1;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userCode = generateUserCode(branch.code);
  const user = {
    id: users.length + 1,
    code: userCode,
    orgId,
    branchId: branch.id,
    username,
    fullName,
    passwordHash,
    // default to operator if no role provided
    role: role || 'operator'
  };
  users.push(user);
  res.status(201).json({ userId: user.code, username: user.username });
});

app.post('/api/login', async (req, res) => {
  const { orgId, username, password } = req.body;
  const user = users.find(
    u =>
      (u.role === 'superadmin' && u.username === username) ||
      (u.orgId === orgId && u.username === username)
  );
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: user.code, orgId: user.orgId, branchId: user.branchId, role: user.role },
    SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token });
});

app.get('/api/organizations', (req, res) => {
  res.json(organizations);
});

app.post('/api/organizations', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = organizations.length + 1;
  const org = { id, code: generateOrgCode(id), name };
  organizations.push(org);
  res.status(201).json(org);
});

app.get('/api/branches', (req, res) => {
  const { orgId } = req.query;
  const result = orgId ? branches.filter(b => b.orgId == orgId) : branches;
  res.json(result);
});

app.post('/api/branches', (req, res) => {
  const { orgId, name } = req.body;
  const org = organizations.find(o => o.id == orgId);
  if (!org) return res.status(400).json({ error: 'Invalid organization' });
  const num = branches.filter(b => b.orgId == org.id).length + 1;
  const id = branches.length + 1;
  const branch = { id, orgId: org.id, code: generateBranchCode(org, num), name };
  branches.push(branch);
  res.status(201).json(branch);
});

app.put('/api/branches/:id', (req, res) => {
  const branchId = parseInt(req.params.id);
  const branchIndex = branches.findIndex(b => b.id === branchId);
  if (branchIndex === -1) return res.status(404).json({ error: 'Branch not found' });
  
  const { name, city, state } = req.body;
  if (name) branches[branchIndex].name = name;
  if (city) branches[branchIndex].city = city;
  if (state) branches[branchIndex].state = state;
  
  res.json(branches[branchIndex]);
});

app.delete('/api/branches/:id', (req, res) => {
  const branchId = parseInt(req.params.id);
  const branchIndex = branches.findIndex(b => b.id === branchId);
  if (branchIndex === -1) return res.status(404).json({ error: 'Branch not found' });
  
  // Check for associated bookings
  const hasBookings = bookings.some(b => b.branchId === branchId);
  if (hasBookings) {
    return res.status(400).json({ error: 'Cannot delete branch with existing bookings' });
  }
  
  branches.splice(branchIndex, 1);
  res.status(204).send();
});

function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/bookings', auth, (req, res) => {
  const { orgId, branchId, role } = req.user;
  const filtered = role === 'superadmin'
    ? bookings
    : role === 'admin'
    ? bookings.filter(b => b.orgId === orgId)
    : bookings.filter(b => b.orgId === orgId && b.branchId === branchId);
  res.json(filtered);
});

app.post('/api/bookings', auth, (req, res) => {
  const { orgId, branchId, userId, role } = req.user;
  const bookingOrgId = role === 'superadmin' ? req.body.orgId ?? orgId : orgId;
  const bookingBranchId =
    role === 'superadmin' || role === 'admin'
      ? req.body.branchId ?? branchId
      : branchId;
  const booking = {
    id: bookings.length + 1,
    orgId: bookingOrgId,
    branchId: bookingBranchId,
    userId,
    details: req.body.details || '',
    // Newly created bookings start in the 'booked' status. The OGPL service
    // will automatically transition them through subsequent statuses.
    status: 'booked',
    current_warehouse_location_id: null,
    warehouse_status: null
  };
  bookings.push(booking);
  res.status(201).json(booking);
});

// ----- Warehouse & Inventory Management -----
// Legacy routes
app.get('/api/warehouses', auth, (req, res) => {
  res.json(warehouseService.warehouses);
});

app.post('/api/warehouses', auth, (req, res) => {
  try {
    const warehouse = warehouseService.createWarehouse(req.body.name);
    res.status(201).json(warehouse);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/locations', auth, (req, res) => {
  res.json(warehouseService.locations);
});

app.post('/api/locations', auth, (req, res) => {
  try {
    const location = warehouseService.createLocation(req.body.warehouseId, req.body.name);
    res.status(201).json(location);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/inbound', auth, (req, res) => {
  try {
    const qty = warehouseService.inbound(req.body);
    res.json({ quantity: qty });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/outbound', auth, (req, res) => {
  try {
    const qty = warehouseService.outbound(req.body);
    res.json({ quantity: qty });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/inventory', auth, (req, res) => {
  try {
    const { locationId, itemId } = req.query;
    const qty = warehouseService.getInventory(Number(locationId), itemId);
    res.json({ quantity: qty });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// New CRUD style routes
app.get('/warehouses', auth, (req, res) => {
  res.json(warehouseService.warehouses);
});

app.post('/warehouses', auth, (req, res) => {
  try {
    const w = warehouseService.createWarehouse(
      req.body.name,
      req.body.branch_id,
      req.body.address,
      req.body.city,
      req.body.status
    );
    res.status(201).json(w);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/warehouses/:id', auth, (req, res) => {
  const warehouse = warehouseService.warehouses.find(w => w.id == req.params.id);
  if (!warehouse) {
    return res.status(404).json({ error: 'Warehouse not found' });
  }
  res.json(warehouse);
});

app.put('/warehouses/:id', auth, (req, res) => {
  const warehouse = warehouseService.warehouses.find(w => w.id == req.params.id);
  if (!warehouse) {
    return res.status(404).json({ error: 'Warehouse not found' });
  }
  
  if (req.body.name) warehouse.name = req.body.name;
  if (req.body.address) warehouse.address = req.body.address;
  if (req.body.city) warehouse.city = req.body.city;
  if (req.body.status) warehouse.status = req.body.status;
  if (req.body.branch_id) warehouse.branchId = req.body.branch_id;
  
  res.json(warehouse);
});

app.delete('/warehouses/:id', auth, (req, res) => {
  const index = warehouseService.warehouses.findIndex(w => w.id == req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Warehouse not found' });
  }
  
  warehouseService.warehouses.splice(index, 1);
  res.status(204).send();
});

app.get('/warehouse-locations', auth, (req, res) => {
  res.json(warehouseService.locations);
});

app.post('/warehouse-locations', auth, (req, res) => {
  try {
    const l = warehouseService.createLocation(
      req.body.warehouse_id,
      req.body.name,
      req.body.type,
      req.body.capacity
    );
    res.status(201).json(l);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/warehouse-locations/:id', auth, (req, res) => {
  const location = warehouseService.locations.find(l => l.id == req.params.id);
  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }
  res.json(location);
});

app.put('/warehouse-locations/:id', auth, (req, res) => {
  const location = warehouseService.locations.find(l => l.id == req.params.id);
  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }
  
  if (req.body.name) location.name = req.body.name;
  if (req.body.type) location.type = req.body.type;
  if (req.body.capacity !== undefined) location.capacity = req.body.capacity;
  if (req.body.warehouse_id) location.warehouseId = req.body.warehouse_id;
  
  res.json(location);
});

app.delete('/warehouse-locations/:id', auth, (req, res) => {
  const index = warehouseService.locations.findIndex(l => l.id == req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Location not found' });
  }
  
  warehouseService.locations.splice(index, 1);
  res.status(204).send();
});

app.get('/inventory', auth, (req, res) => {
  const { location_id, article_id } = req.query;
  const qty = warehouseService.getInventory(location_id, article_id);
  res.json({ quantity: qty });
});

app.post('/inventory/receive', auth, (req, res) => {
  try {
    const qty = warehouseService.inbound(req.body);
    res.json({ quantity: qty });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/inventory/dispatch', auth, (req, res) => {
  try {
    const qty = warehouseService.outbound(req.body);
    res.json({ quantity: qty });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/inventory/transfer', auth, (req, res) => {
  try {
    warehouseService.transfer(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----- Edge Function Equivalents -----

app.post('/edge/lr-number', auth, (req, res) => {
  const { branchCode } = req.body;
  const code = branchCode || 'DC';
  const lrNumber = generateLRNumber(code.slice(0, 2).toUpperCase());
  res.json({ lrNumber });
});

// OGPL Management endpoints
app.get('/api/loading/ogpls', auth, (req, res) => {
  const { status } = req.query;
  let filteredOgpls = ogplService.ogpls;
  
  if (status) {
    filteredOgpls = filteredOgpls.filter(ogpl => ogpl.status === status);
  }
  
  // Add mock vehicle and branch data
  const ogplsWithDetails = filteredOgpls.map(ogpl => ({
    ...ogpl,
    vehicle: { id: 1, vehicle_number: 'MH12AB1234', type: 'truck' },
    from_station: { id: 1, name: 'Main Branch', city: 'Mumbai' },
    to_station: { id: 2, name: 'Second Branch', city: 'Delhi' },
    loading_records: ogpl.lrIds.map(lrId => ({
      id: lrId,
      booking_id: lrId,
      booking: bookings.find(b => b.id === lrId)
    }))
  }));
  
  res.json(ogplsWithDetails);
});

app.get('/api/loading/ogpls/:id', auth, (req, res) => {
  const ogpl = ogplService.ogpls.find(o => o.id == req.params.id);
  if (!ogpl) return res.status(404).json({ error: 'OGPL not found' });
  
  const ogplWithDetails = {
    ...ogpl,
    vehicle: { id: 1, vehicle_number: 'MH12AB1234', type: 'truck' },
    from_station: { id: 1, name: 'Main Branch', city: 'Mumbai' },
    to_station: { id: 2, name: 'Second Branch', city: 'Delhi' },
    loading_records: ogpl.lrIds.map(lrId => ({
      id: lrId,
      booking_id: lrId,
      booking: bookings.find(b => b.id === lrId)
    }))
  };
  
  res.json(ogplWithDetails);
});

app.post('/api/loading/ogpls', auth, (req, res) => {
  try {
    const ogplData = {
      ...req.body,
      lrIds: []
    };
    const ogpl = ogplService.createOGPL(ogplData);
    res.status(201).json(ogpl);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/loading/ogpls/:id', auth, (req, res) => {
  const ogpl = ogplService.ogpls.find(o => o.id == req.params.id);
  if (!ogpl) return res.status(404).json({ error: 'OGPL not found' });
  
  // Update OGPL fields
  Object.assign(ogpl, req.body);
  res.json(ogpl);
});

app.patch('/api/loading/ogpls/:id/status', auth, (req, res) => {
  const ogpl = ogplService.ogpls.find(o => o.id == req.params.id);
  if (!ogpl) return res.status(404).json({ error: 'OGPL not found' });
  
  ogpl.status = req.body.status;
  res.json(ogpl);
});

app.post('/api/loading/ogpls/:id/bookings', auth, (req, res) => {
  const ogpl = ogplService.ogpls.find(o => o.id == req.params.id);
  if (!ogpl) return res.status(404).json({ error: 'OGPL not found' });
  
  const { booking_ids } = req.body;
  
  // Add bookings to OGPL
  booking_ids.forEach(bookingId => {
    if (!ogpl.lrIds.includes(bookingId)) {
      ogpl.lrIds.push(bookingId);
      // Update booking status
      const booking = bookings.find(b => b.id == bookingId);
      if (booking) {
        booking.status = 'in_transit';
        booking.loading_status = 'loaded';
      }
    }
  });
  
  res.status(201).json({ success: true });
});

app.delete('/api/loading/ogpls/:id/bookings', auth, (req, res) => {
  const ogpl = ogplService.ogpls.find(o => o.id == req.params.id);
  if (!ogpl) return res.status(404).json({ error: 'OGPL not found' });
  
  const { booking_ids } = req.body;
  
  // Remove bookings from OGPL
  ogpl.lrIds = ogpl.lrIds.filter(id => !booking_ids.includes(id));
  
  // Update booking statuses
  booking_ids.forEach(bookingId => {
    const booking = bookings.find(b => b.id == bookingId);
    if (booking) {
      booking.status = 'booked';
      booking.loading_status = 'pending';
    }
  });
  
  res.status(204).send();
});

app.get('/api/loading/loading-sessions', auth, (req, res) => {
  // Mock loading sessions
  const sessions = ogplService.ogpls.map(ogpl => ({
    id: ogpl.id,
    ogpl_id: ogpl.id,
    loaded_by: 'Admin User',
    vehicle_id: 1,
    from_branch_id: 1,
    to_branch_id: 2,
    total_items: ogpl.lrIds.length,
    loaded_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ogpl: {
      ...ogpl,
      loading_records: ogpl.lrIds.map(lrId => ({
        id: lrId,
        booking_id: lrId,
        booking: bookings.find(b => b.id === lrId)
      }))
    },
    vehicle: { id: 1, vehicle_number: 'MH12AB1234', type: 'truck' },
    from_branch: { id: 1, name: 'Main Branch', city: 'Mumbai' },
    to_branch: { id: 2, name: 'Second Branch', city: 'Delhi' }
  }));
  
  res.json(sessions);
});

app.post('/api/loading/loading-sessions', auth, (req, res) => {
  try {
    const { ogpl_id, booking_ids } = req.body;
    
    // Add bookings to OGPL
    const ogpl = ogplService.ogpls.find(o => o.id == ogpl_id);
    if (!ogpl) return res.status(404).json({ error: 'OGPL not found' });
    
    booking_ids.forEach(bookingId => {
      if (!ogpl.lrIds.includes(bookingId)) {
        ogpl.lrIds.push(bookingId);
        // Update booking status
        const booking = bookings.find(b => b.id == bookingId);
        if (booking) {
          booking.status = 'in_transit';
          booking.loading_status = 'loaded';
        }
      }
    });
    
    // Update OGPL status
    ogpl.status = 'in_transit';
    
    const session = {
      id: Date.now(),
      ...req.body,
      loaded_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Legacy endpoints
app.post('/edge/ogpl', auth, (req, res) => {
  try {
    const ogpl = ogplService.createOGPL(req.body);
    res.status(201).json(ogpl);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/edge/unload-ogpl', auth, (req, res) => {
  try {
    const ogpl = ogplService.completeUnloading(req.body.ogplId);
    res.json(ogpl);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/edge/submit-pod', auth, (req, res) => {
  try {
    const booking = ogplService.markDelivered(req.body.lrId);
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/edge/generate-invoice', auth, (req, res) => {
  try {
    const booking = ogplService.bookings.find(b => b.id == req.body.lrId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const invoice = billingService.generateInvoiceForBooking(booking);
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/edge/recurring-invoices/:customerId', auth, (req, res) => {
  try {
    const invoices = billingService.generateRecurringInvoices(req.params.customerId);
    res.json(invoices);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/edge/reports/bookings', auth, (req, res) => {
  const summary = ogplService.bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});
  res.json(summary);
});

// Sample articles data
const articles = [
  {
    id: '1',
    branch_id: '1',
    name: 'Cotton Fabric',
    description: 'High-quality cotton fabric for textile manufacturing',
    base_rate: 450.00,
    hsn_code: '5208',
    tax_rate: 12,
    unit_of_measure: 'meter',
    min_quantity: 50,
    is_fragile: false,
    requires_special_handling: false,
    notes: 'Store in dry place',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    branch_name: 'Main Branch'
  },
  {
    id: '2',
    branch_id: '1',
    name: 'Silk Saree Bundle',
    description: 'Traditional silk sarees in assorted colors',
    base_rate: 2500.00,
    hsn_code: '5007',
    tax_rate: 5,
    unit_of_measure: 'bundle',
    min_quantity: 10,
    is_fragile: true,
    requires_special_handling: true,
    notes: 'Handle with care, avoid moisture',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    branch_name: 'Main Branch'
  },
  {
    id: '3',
    branch_id: '2',
    name: 'Electronics Components',
    description: 'Various electronic components and parts',
    base_rate: 800.00,
    hsn_code: '8517',
    tax_rate: 18,
    unit_of_measure: 'kg',
    min_quantity: 5,
    is_fragile: true,
    requires_special_handling: false,
    notes: 'Anti-static packaging required',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    branch_name: 'Second Branch'
  }
];

// Articles API endpoints
app.get('/api/articles', auth, (req, res) => {
  res.json(articles);
});

app.get('/api/articles/:id', auth, (req, res) => {
  const article = articles.find(a => a.id === req.params.id);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json(article);
});

app.post('/api/articles', auth, (req, res) => {
  const newArticle = {
    id: String(articles.length + 1),
    branch_id: req.body.branch_id || '1',
    name: req.body.name,
    description: req.body.description || '',
    base_rate: req.body.base_rate,
    hsn_code: req.body.hsn_code || '',
    tax_rate: req.body.tax_rate || 0,
    unit_of_measure: req.body.unit_of_measure || '',
    min_quantity: req.body.min_quantity || 1,
    is_fragile: req.body.is_fragile || false,
    requires_special_handling: req.body.requires_special_handling || false,
    notes: req.body.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    branch_name: 'Main Branch'
  };
  articles.push(newArticle);
  res.status(201).json(newArticle);
});

app.put('/api/articles/:id', auth, (req, res) => {
  const articleIndex = articles.findIndex(a => a.id === req.params.id);
  if (articleIndex === -1) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  const updatedArticle = {
    ...articles[articleIndex],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  articles[articleIndex] = updatedArticle;
  res.json(updatedArticle);
});

app.delete('/api/articles/:id', auth, (req, res) => {
  const articleIndex = articles.findIndex(a => a.id === req.params.id);
  if (articleIndex === -1) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  articles.splice(articleIndex, 1);
  res.status(204).send();
});

// Customer rates (mock data)
app.get('/api/articles/:id/rates', auth, (req, res) => {
  // Mock customer rates data
  const mockRates = [
    {
      customer_id: '1',
      article_id: req.params.id,
      rate: 400.00,
      customer: {
        id: '1',
        name: 'ABC Textiles',
        mobile: '9876543210'
      }
    }
  ];
  res.json(mockRates);
});

// Backwards compatibility routes (without /api prefix)
app.get('/loading/ogpls', auth, (req, res) => {
  const { status } = req.query;
  let filteredOgpls = ogplService.ogpls;
  
  if (status) {
    filteredOgpls = filteredOgpls.filter(ogpl => ogpl.status === status);
  }
  
  // Add mock vehicle and branch data
  const ogplsWithDetails = filteredOgpls.map(ogpl => ({
    ...ogpl,
    vehicle: { id: 1, vehicle_number: 'MH12AB1234', type: 'truck' },
    from_station: { id: 1, name: 'Main Branch', city: 'Mumbai' },
    to_station: { id: 2, name: 'Second Branch', city: 'Delhi' },
    loading_records: ogpl.lrIds.map(lrId => ({
      id: lrId,
      booking_id: lrId,
      loaded_at: new Date().toISOString(),
      loaded_by: 'system',
      booking: bookings.find(b => b.id == lrId)
    }))
  }));
  
  res.json(ogplsWithDetails);
});

app.post('/loading/ogpls', auth, (req, res) => {
  try {
    const ogplData = {
      ...req.body,
      status: 'created'
    };
    const ogpl = ogplService.createOGPL(ogplData);
    res.status(201).json(ogpl);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/loading/loading-sessions', auth, (req, res) => {
  // Mock loading sessions
  const sessions = ogplService.ogpls.map(ogpl => ({
    id: ogpl.id,
    ogpl_id: ogpl.id,
    loaded_by: 'system',
    vehicle_id: '1',
    from_branch_id: '1',
    to_branch_id: '2',
    total_items: ogpl.lrIds.length,
    loaded_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ogpl: {
      ...ogpl,
      loading_records: ogpl.lrIds.map(lrId => ({
        id: lrId,
        booking_id: lrId,
        loaded_at: new Date().toISOString(),
        loaded_by: 'system',
        booking: bookings.find(b => b.id == lrId)
      }))
    },
    vehicle: { id: 1, vehicle_number: 'MH12AB1234', type: 'truck' },
    from_branch: { id: 1, name: 'Main Branch' },
    to_branch: { id: 2, name: 'Second Branch' }
  }));
  
  res.json(sessions);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
