import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:4000';

async function createDemoUsers() {
  console.log('Creating demo users for testing...\n');

  // Demo users to create
  const demoUsers = [
    {
      organizationCode: 'k2k',
      username: 'admin',
      password: 'Admin@123',
      email: '', // Will use synthetic email
      fullName: 'K2K Admin',
      branchId: 'b1b1b1b1-0000-0000-0000-000000000001', // Mumbai Head Office
      role: 'admin'
    },
    {
      organizationCode: 'k2k',
      username: 'operator',
      password: 'Operator@123',
      email: '',
      fullName: 'K2K Operator',
      branchId: 'b1b1b1b1-0000-0000-0000-000000000001', // Mumbai Head Office
      role: 'operator'
    },
    {
      organizationCode: 'acme',
      username: 'admin',
      password: 'Admin@123',
      email: '',
      fullName: 'Acme Admin',
      branchId: 'b2b2b2b2-0000-0000-0000-000000000001', // Bangalore Office
      role: 'admin'
    }
  ];

  for (const user of demoUsers) {
    try {
      console.log(`Creating user ${user.username} for organization ${user.organizationCode}...`);
      
      const response = await fetch(`${API_URL}/auth/org/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In production, this would require admin authentication
        },
        body: JSON.stringify(user)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✓ Created user: ${user.fullName} (${user.username}@${user.organizationCode})`);
      } else {
        console.error(`✗ Failed to create user ${user.username}: ${result.error}`);
      }
    } catch (error) {
      console.error(`✗ Error creating user ${user.username}:`, error.message);
    }
  }

  console.log('\n=== Demo Login Credentials ===\n');
  console.log('K2K Logistics:');
  console.log('- Organization Code: k2k');
  console.log('- Admin: username=admin, password=Admin@123');
  console.log('- Operator: username=operator, password=Operator@123');
  console.log('\nAcme Logistics:');
  console.log('- Organization Code: acme');
  console.log('- Admin: username=admin, password=Admin@123');
}

// Check if backend is running
fetch(`${API_URL}/auth/org/check-organization`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'test' })
})
.then(() => {
  createDemoUsers();
})
.catch(() => {
  console.error('Backend is not running. Please start it with: cd backend && npm run dev');
});