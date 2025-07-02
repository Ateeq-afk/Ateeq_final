# DesiCargo Multi-Tenant SaaS Design Guide

## 1. ID Structure Explanation

DesiCargo uses a hierarchical identifier scheme:

- **Organization ID** (`orgId`): a unique code for the top-level organization, e.g. `DC001`.
- **Branch ID** (`branchId`): a child of an organization. The branch ID includes the organization code, e.g. `DC001-BR02`.
- **User ID** (`userId`): a child of a branch. Follows the pattern `DC001-BR02-USR005`.

This hierarchy makes it easy to filter data by organization and branch, supports security boundaries, and helps with reporting and scalability.

## 2. Database Schema

Example tables using SQL-style notation. Use integer primary keys under the hood but store the hierarchical codes as well.

```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  org_code VARCHAR(10) UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE branches (
  id SERIAL PRIMARY KEY,
  branch_code VARCHAR(15) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  org_id INTEGER NOT NULL REFERENCES organizations(id)
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_code VARCHAR(20) UNIQUE NOT NULL,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  username VARCHAR(50) NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  UNIQUE(org_id, username)
);

CREATE INDEX idx_users_org_username ON users(org_id, username);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  branch_id INTEGER REFERENCES branches(id),
  org_id INTEGER REFERENCES organizations(id),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 3. Signup & Username Management

Endpoint: `POST /api/signup`

User accounts are provisioned by a DesiCargo Account Manager. A basic signup
request only contains the user's name, desired username and password.

Request body:
```json
{
  "fullName": "Rama Devi",
  "desiredUsername": "rama123",
  "password": "secret"
}
```

Pseudo backend logic (Node.js/Express):

```js
app.post('/api/signup', async (req, res) => {
  const { fullName, desiredUsername, password } = req.body;

  // Branch and role are assigned internally by the account manager
  const branch = await chooseBranchForNewUser();
  const orgId = branch.org_id;
  let username = desiredUsername;
  let exists = await db.users.findOne({ org_id: orgId, username });
  let suffix = 1;
  while (exists) {
    username = `${desiredUsername}${suffix}`;
    exists = await db.users.findOne({ org_id: orgId, username });
    suffix++;
  }

  const passwordHash = await hashPassword(password);
  const userCode = generateUserCode(branch.branch_code); // e.g. DC001-BR02-USR005

  const user = await db.users.insert({
    user_code: userCode,
    org_id: orgId,
    branch_id: branch.id,
    username,
    full_name: fullName,
    password_hash: passwordHash
  });

  res.status(201).json({ userId: user.user_code, username: user.username });
});
```

## 4. Login API

Endpoint: `POST /api/login`

```js
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // optionally include org context in request headers or subdomain
  const orgId = req.headers['x-org-id'];
  const user = await db.users.findOne({ org_id: orgId, username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({
    userId: user.user_code,
    orgId: user.org_id,
    branchId: user.branch_id,
    roles: []
  }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});
```

## 5. JWT & Middleware

JWT payload example:
```json
{
  "userId": "DC001-BR02-USR005",
  "orgId": 1,
  "branchId": 2,
  "roles": ["admin"],
  "iat": 0,
  "exp": 0
}
```

Middleware skeleton:
```js
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).end();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).end();
  }
}

function scopedQuery(query, user) {
  return query.where({ org_id: user.orgId, branch_id: user.branchId });
}
```

## 6. API Endpoints with Scoped Access

Example fetching bookings for the logged-in branch:
```js
app.get('/api/bookings', authMiddleware, async (req, res) => {
  const bookings = await scopedQuery(db.bookings, req.user)
    .findMany();
  res.json(bookings);
});

app.post('/api/bookings', authMiddleware, async (req, res) => {
  const booking = await db.bookings.insert({
    ...req.body,
    org_id: req.user.orgId,
    branch_id: req.user.branchId,
    user_id: req.user.userId
  });
  res.status(201).json(booking);
});
```

## 7. Front-End Login Flow

React example for a login page:
```jsx
import { useState } from 'react';
import axios from 'axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data } = await axios.post('/api/login', { username, password });
    localStorage.setItem('token', data.token);
    // redirect to dashboard
  };

  return (
    <form onSubmit={handleLogin}>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

## 8. Example Workflows

- **Signup**: accounts are provisioned by a DesiCargo Account Manager who ensures unique usernames and assigns branches internally.
- **Login**: user logs in with chosen username. JWT is issued containing full hierarchical IDs.
- **Data requests**: every API uses middleware that injects `orgId` and `branchId` from the JWT so queries are automatically scoped.

## 9. Best Practices & Caveats

- **Username collisions**: uniqueness enforced per organization so different orgs can use the same username. Always query by `(org_id, username)`.
- **Username rules**: restrict to alphanumeric and underscores, 3-30 characters, to avoid confusion.
- **Audit trails**: store both `username` and full codes in logs to trace actions.
- **Security**: hash passwords with a strong algorithm (bcrypt, argon2) and use HTTPS for API calls.

