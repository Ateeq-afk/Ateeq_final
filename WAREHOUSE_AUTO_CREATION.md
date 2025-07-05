# Automatic Warehouse Creation for Branches

## Overview
Each branch in DesiCargo now automatically gets a default warehouse with pre-configured storage locations. This ensures that every branch has the necessary infrastructure for logistics operations.

## Features

### 1. Automatic Warehouse Creation
- When a new branch is created, a main warehouse is automatically created
- The warehouse is named "[Branch Name] Main Warehouse"
- It includes 4 default storage locations:
  - **RECEIVING** - Receiving Area
  - **STORAGE-A** - Storage Area A  
  - **STORAGE-B** - Storage Area B
  - **DISPATCH** - Dispatch Area

### 2. Migration for Existing Branches
A migration script has been created to add warehouses to existing branches that don't have one.

## Running the Migration

### Option 1: Using the Migration Script
```bash
npm run migrate:warehouses
```

If this script doesn't exist, add it to package.json:
```json
"scripts": {
  "migrate:warehouses": "node scripts/run-warehouse-migration.js"
}
```

### Option 2: Manual Migration in Supabase
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `/backend/migrations/011_create_default_warehouses.sql`
4. Execute the query

## How It Works

### Database Trigger
A PostgreSQL trigger automatically creates a warehouse whenever a new branch is inserted:
- Trigger Name: `create_warehouse_on_branch_insert_trigger`
- Function: `create_default_warehouse_for_branch()`

### API Integration
When creating a branch via the API:
1. The branch is created
2. The database trigger automatically creates the warehouse
3. The API returns both branch and warehouse data

### UI Updates
- The Warehouse Management page now shows which warehouse is the "Main" warehouse
- Branch context is used to filter warehouses
- Empty states provide clear guidance about automatic warehouse creation

## Additional Warehouses
While each branch gets one default warehouse automatically, you can still:
- Create additional warehouses for a branch
- Add custom storage locations
- Manage multiple warehouse types (main, secondary, temporary, etc.)

## Troubleshooting

### No Warehouse Appearing
1. Check if the migration has been run
2. Verify the branch exists in the database
3. Check for any errors in the branch creation process

### Manual Warehouse Creation
If automatic creation fails, you can manually create a warehouse:
1. Go to Warehouse Management
2. Click "Add Warehouse"
3. Fill in the details and save

## Benefits
- **Consistency**: Every branch has standardized warehouse infrastructure
- **Efficiency**: No manual setup required for basic warehouse operations
- **Scalability**: Easy to add new branches with full logistics capabilities
- **Flexibility**: Can still customize and add additional warehouses as needed