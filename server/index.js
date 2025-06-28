const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ogplService = require('./ogplService.cjs');

const billingService = require('./billingService.cjs');
const app = express();
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
    role: role || 'branch_user'
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
    : bookings.filter(b => b.orgId === orgId && b.branchId === branchId);
  res.json(filtered);
});

app.post('/api/bookings', auth, (req, res) => {
  const { orgId, branchId, userId, role } = req.user;
  const bookingOrgId = role === 'superadmin' ? req.body.orgId ?? orgId : orgId;
  const bookingBranchId = role === 'superadmin' ? req.body.branchId ?? branchId : branchId;
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

app.listen(3000, () => {
  console.log('API server running on http://localhost:3000');
});
