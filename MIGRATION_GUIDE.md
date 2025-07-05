# Step-by-Step Migration Guide

## 🚀 Quick Migration Steps (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://app.supabase.com/project/pgdssjfgfbvkgbzumtzm/editor
2. You should see the SQL Editor interface

### Step 2: Copy Migration SQL
1. Open the file `COMBINED_MIGRATIONS.sql` in your project
2. Select ALL the content (Cmd+A)
3. Copy it (Cmd+C)

### Step 3: Run Migration
1. In Supabase SQL Editor, paste the SQL (Cmd+V)
2. Click the "Run" button (or press Cmd+Enter)
3. Wait for "Success" message (~10-30 seconds)

### Step 4: Verify Migration
After running, you should see:
- ✅ "Success. No rows returned"
- At the bottom, you'll see results from verification queries showing:
  - K2K Logistics organization
  - Acme Logistics organization
  - Their branches

### Step 5: Create Your First User

#### Easy Way - Using Supabase Dashboard:
1. Go to Authentication > Users
2. Click "Add user" button
3. Create a user with:
   - Email: `admin@k2k.internal`
   - Password: `Admin@123`
   - Email confirmed: ✓ (check this)

#### After Creating User:
1. Go to Table Editor > users
2. Find the user you just created
3. Edit the row and add:
   - `organization_id`: `d0d0d0d0-0000-0000-0000-000000000001`
   - `branch_id`: `b1b1b1b1-0000-0000-0000-000000000001`
   - `username`: `admin`
   - `role`: `admin`
   - `full_name`: `K2K Admin`

### Step 6: Test Login
1. Go to: http://localhost:5173/signin
2. Enter:
   - Organization Code: `k2k`
   - Username: `admin`
   - Password: `Admin@123`

## 🎉 Success!

You now have a fully functional multi-tenant system with:
- ✅ K2K Logistics organization
- ✅ Branch-level data isolation
- ✅ Organization-based authentication
- ✅ Admin access across all branches

## Troubleshooting

### "Invalid organization code"
- Make sure migrations ran successfully
- Check organization_codes table has 'k2k' entry

### "Invalid username or password"
- Ensure user was created with email `admin@k2k.internal`
- Check users table has correct organization_id and username

### Can't see organization menu
- Make sure user role is set to 'admin' in users table

## Test Data Created

### Organizations:
1. **K2K Logistics** (code: `k2k`)
   - Mumbai Head Office
   - Delhi Branch
   - Surat Branch

2. **Acme Logistics** (code: `acme`)
   - Bangalore Office
   - Chennai Branch

### Ready to Create Users:
- Each organization can have unlimited users
- Users are scoped to their organization
- Same username can exist in different organizations