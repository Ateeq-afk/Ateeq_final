const assert = require('assert');
const { spawn } = require('child_process');

const server = spawn('node', ['server/index.js']);

function waitForServer() {
  return new Promise((resolve, reject) => {
    server.stdout.on('data', data => {
      if (data.toString().includes('API server running')) {
        resolve();
      }
    });
    server.on('error', reject);
    server.on('exit', code => {
      reject(new Error(`Server exited with code ${code}`));
    });
  });
}

async function main() {
  try {
    await waitForServer();
    const base = 'http://localhost:3000';

    let res = await fetch(`${base}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'tabateeq@gmail.com', password: 'superadmin' })
    });
    let body = await res.json();
    const superToken = body.token;
    assert.ok(superToken);

    res = await fetch(`${base}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Branch User', desiredUsername: 'branchuser', email: 'branchuser@example.com', password: 'pass' })
    });
    body = await res.json();
    assert.strictEqual(res.status, 201);
    const branchUsername = body.username;

    res = await fetch(`${base}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId: 1, username: branchUsername, password: 'pass' })
    });
    body = await res.json();
    const branchToken = body.token;
    assert.ok(branchToken);

    res = await fetch(`${base}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${branchToken}` },
      body: JSON.stringify({ details: 'branch booking' })
    });
    body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.branchId, 1);
    const branchBookingId = body.id;

    res = await fetch(`${base}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superToken}` },
      body: JSON.stringify({ orgId: 1, branchId: 2, details: 'super booking' })
    });
    body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.branchId, 2);

    res = await fetch(`${base}/api/bookings`, {
      headers: { Authorization: `Bearer ${superToken}` }
    });
    body = await res.json();
    assert.strictEqual(body.length, 2);

    res = await fetch(`${base}/api/bookings`, {
      headers: { Authorization: `Bearer ${branchToken}` }
    });
    const branchBookings = await res.json();
    assert.strictEqual(branchBookings.length, 1);
    assert.strictEqual(branchBookings[0].id, branchBookingId);

    console.log('API bookings access control works');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    server.kill();
  }
}

main();
