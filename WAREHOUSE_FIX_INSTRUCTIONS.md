# Warehouse Management Page Fix Instructions

## Issue
The warehouse management page is not rendering data correctly due to a missing view in the database. The `warehouse_inventory_summary` view was missing the `organization_id` and `branch_id` columns that the backend API expects for multi-tenant filtering.

## What Was Fixed

1. **Database View**: Updated the `warehouse_inventory_summary` view to include `organization_id` and `branch_id` columns
2. **Type Mismatch**: Fixed warehouse ID type from `number` to `string` (UUID) in the React component
3. **Warehouse Creation**: Added `organization_id` and `branch_id` to warehouse creation data

## How to Apply the Fix

### Option 1: Run the Migration SQL (Recommended)

1. Go to your Supabase SQL Editor
2. Copy and run the contents of `/FIX_WAREHOUSE_VIEW.sql` or `/backend/migrations/009_fix_warehouse_view.sql`

### Option 2: Manual SQL Execution

Run this SQL in your Supabase SQL editor:

```sql
DROP VIEW IF EXISTS warehouse_inventory_summary CASCADE;

CREATE OR REPLACE VIEW warehouse_inventory_summary AS
SELECT 
    w.id as warehouse_id,
    w.name as warehouse_name,
    w.organization_id,
    w.branch_id,
    w.city,
    w.status as warehouse_status,
    COUNT(DISTINCT wl.id) as total_locations,
    COUNT(DISTINCT ir.id) as total_inventory_records,
    COALESCE(SUM(ir.quantity), 0) as total_quantity,
    COALESCE(SUM(ir.available_quantity), 0) as total_available_quantity,
    COALESCE(SUM(ir.reserved_quantity), 0) as total_reserved_quantity,
    COUNT(DISTINCT ir.article_id) as unique_articles
FROM warehouses w
LEFT JOIN warehouse_locations wl ON w.id = wl.warehouse_id
LEFT JOIN inventory_records ir ON wl.id = ir.warehouse_location_id AND ir.status = 'available'
GROUP BY w.id, w.name, w.organization_id, w.branch_id, w.city, w.status;
```

## Verification

After applying the fix:

1. Restart your backend server: `cd backend && npm run dev`
2. Reload the warehouse management page in your browser
3. You should now see warehouses properly scoped to your organization/branch
4. Creating new warehouses will automatically include the correct organization and branch IDs

## Troubleshooting

If you still see errors:
1. Check that your user has the correct `organization_id` and `branch_id` in their metadata
2. Ensure you're logged in with a user that has appropriate permissions
3. Check the browser console and network tab for any remaining errors