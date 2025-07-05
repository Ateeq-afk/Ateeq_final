# Testing the Organization-Based Authentication System

## Current Status

1. **Frontend**: Running at http://localhost:5173/
2. **Mock Backend**: Running at http://localhost:3000/
3. **Production Backend**: Available but needs Supabase service key configuration

## How to Test the System

### Option 1: Test with Legacy Login (Currently Working)

1. Go to http://localhost:5173/
2. Click "Sign In" 
3. You'll see the new organization-based login screen
4. For now, click "Back to Organization" or navigate to http://localhost:5173/signin-legacy
5. Use the existing credentials:
   - Email: admin@example.com
   - Password: password123

### Option 2: Test Organization-Based Login (Requires Setup)

Since we need to run the database migrations and create test users, here's what needs to be done:

1. **Run Database Migrations**:
   - Execute the SQL files in `/backend/migrations/` in your Supabase dashboard
   - Particularly `002_organization_auth.sql` and `003_enhanced_rls_policies.sql`

2. **Create Test Organizations**:
   - Run `004_seed_k2k_organization.sql` to create K2K Logistics and Acme Logistics

3. **Create Test Users**:
   After migrations, you can test with:
   
   **K2K Logistics:**
   - Organization Code: `k2k`
   - Username: `admin`
   - Password: `Admin@123`
   
   **Acme Logistics:**
   - Organization Code: `acme`
   - Username: `admin`
   - Password: `Admin@123`

## Key Features to Test

### 1. Organization-First Login
- Enter organization code first
- System validates organization exists
- Then enter username/password

### 2. Multi-Tenant Data Isolation
- Users only see data from their branch
- Admins can see all branches in their organization
- No cross-organization data access

### 3. Organization Management (Admin Only)
- Navigate to Dashboard > Organizations
- Create new organizations
- Manage existing organizations
- View organization statistics

## System Architecture

```
User Login Flow:
1. Enter Organization Code (e.g., "k2k")
2. System validates organization
3. Enter Username & Password
4. Authenticated within organization context
5. Data filtered by organization/branch
```

## Database Structure

- **organizations**: Stores organization data
- **organization_codes**: Maps codes to organizations
- **branches**: Stores branch data per organization
- **users**: Enhanced with organization_id and username

## Notes

- The system shows "K2K Logistics" in the UI as branding
- Actual organization data needs to be created in the database
- The mock server doesn't have the new auth endpoints
- Full functionality requires the production backend with Supabase