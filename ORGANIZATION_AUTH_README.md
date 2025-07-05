# Organization-Based Authentication System

## Overview

DesiCargo now implements a multi-tenant SaaS architecture with organization-based authentication. Users must first enter their organization code before signing in with their username and password.

## Key Features

### 1. Organization-First Login Flow
- Users enter organization code (e.g., "acme-logistics")
- Users authenticate with username (not email) scoped to their organization
- Multiple organizations can have users with the same username

### 2. Multi-Tenant Architecture
```
Organization
    └── Branches
            └── Users
```

### 3. Data Isolation
- **Branch-level isolation**: Users only see data from their assigned branch
- **Organization-level isolation**: Data is completely separated between organizations
- **Admin access**: Organization admins can access data across all branches

## Database Schema Changes

### New Tables
- `organization_codes`: Maps organization codes/subdomains to organizations
- `audit_logs`: Tracks all data access for security

### Updated Tables
- `users`: Added `organization_id` and `username` fields
- All data tables: Enhanced RLS policies for strict data isolation

## Authentication Flow

### Frontend
1. User navigates to `/signin`
2. Enters organization code
3. System validates organization exists
4. User enters username and password
5. System authenticates within organization context

### Backend
- Custom JWT tokens include organization context
- Dual authentication support (organization-based and legacy Supabase)
- All API endpoints filter data by organization/branch

## User Roles

### 1. Admin
- Full access to all data within their organization
- Can manage branches and users
- Can view audit logs

### 2. Branch Manager
- Access to their branch data
- Can manage users within their branch

### 3. Operator
- Access only to their assigned branch data
- Cannot modify system settings

## Creating New Organizations

### Via API (Admin Only)
```bash
POST /organizations/create
{
  "name": "ABC Logistics",
  "code": "abc-logistics",
  "adminUser": {
    "username": "admin",
    "password": "securepassword",
    "fullName": "Admin User"
  },
  "branches": [{
    "name": "Main Branch",
    "code": "MAIN",
    "city": "Mumbai"
  }]
}
```

### Via Frontend
- Navigate to Dashboard > Organizations (admin only)
- Click "Create Organization"
- Fill in organization details, admin user, and branches

## Security Features

### 1. Row-Level Security (RLS)
- Enforced at database level
- Cannot be bypassed by API
- Automatic filtering based on user context

### 2. Audit Logging
- All data modifications are logged
- Includes user, organization, branch context
- Admin-only access

### 3. Organization Isolation
- Complete data separation
- No cross-organization data leakage
- Organization enumeration protection

## Migration Notes

### For Existing Users
- Existing email-based login still works
- Users will be migrated to organization-based auth gradually
- Legacy route available at `/signin-legacy`

### For New Organizations
- All new organizations use username-based auth
- Organization code required for login
- No direct email registration

## Environment Variables

No changes required to environment variables. The system uses:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `JWT_SECRET` (backend)

## Testing

To test the multi-tenant isolation:
1. Create two organizations
2. Create users in each with same username
3. Verify data isolation between organizations
4. Test branch-level access controls

## Troubleshooting

### "Invalid organization code"
- Verify organization code is correct (lowercase, no spaces)
- Check if organization is active

### "Invalid username or password"
- Username is case-sensitive
- Ensure entering username, not email
- Verify user belongs to the organization

### Data not visible
- Check user's branch assignment
- Verify RLS policies are applied
- Check user role permissions