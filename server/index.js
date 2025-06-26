const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
const bookings = [];

function pad(num, size) {
  return num.toString().padStart(size, '0');
}

function generateUserCode(branchCode) {
  const count = users.filter(u => u.code.startsWith(branchCode)).length + 1;
  return `${branchCode}-USR${pad(count, 3)}`;
}

app.post('/api/signup', async (req, res) => {
  const { fullName, desiredUsername, password, branchId } = req.body;
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
    role: 'staff'
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
    details: req.body.details || ''
  };
  bookings.push(booking);
  res.status(201).json(booking);
});

app.listen(3000, () => {
  console.log('API server running on http://localhost:3000');
});
