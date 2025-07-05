# POD Migration Guide

## Error Resolution

You're encountering the error:
```
ERROR: 42P07: relation "idx_pod_records_booking_id" already exists
```

This means the POD migration was partially applied. Here's how to fix it:

## Step 1: Check Current Status

Run this SQL query to see what exists:
```sql
-- Run the check-pod-migration-status.sql file
-- It will show you exactly what's missing
```

## Step 2: Apply the Fix

### Option A: Use the Fix Script (Recommended)
```bash
# This script checks for existing objects before creating them
psql -U your_user -d your_database -f FIX_POD_MIGRATION.sql
```

### Option B: Manual Fix
If you prefer to fix manually:

1. **Drop the existing index** (if you want to recreate it):
```sql
DROP INDEX IF EXISTS idx_pod_records_booking_id;
```

2. **Then run the original migration**:
```sql
-- Run your original 005_proof_of_delivery.sql
```

### Option C: Skip existing objects
Modify the original migration to check existence:
```sql
-- Replace this:
CREATE INDEX idx_pod_records_booking_id ON pod_records(booking_id);

-- With this:
CREATE INDEX IF NOT EXISTS idx_pod_records_booking_id ON pod_records(booking_id);
```

## Step 3: Verify Migration

After applying the fix, verify everything is in place:
```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('pod_records', 'pod_attempts', 'pod_templates');

-- Check columns in bookings
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('pod_status', 'pod_record_id', 'delivery_attempted_at', 'pod_required');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE indexname LIKE 'idx_pod_%';
```

## Expected Schema After Migration

### 1. **pod_records** table
- Stores actual delivery records
- One record per delivered booking
- Contains receiver info, signatures, photos

### 2. **pod_attempts** table
- Tracks failed delivery attempts
- Helps manage redelivery

### 3. **pod_templates** table
- Configurable POD requirements per branch
- Define what evidence is required

### 4. **bookings** table additions
- `pod_status`: Track POD progress
- `pod_record_id`: Link to POD record
- `delivery_attempted_at`: Last attempt timestamp
- `pod_required`: Whether POD is needed

## Testing After Migration

Use the test script to verify:
```bash
# For production API (requires migrations)
node test-booking-lifecycle-complete.cjs

# The script will test:
# 1. Booking creation
# 2. OGPL loading
# 3. Unloading
# 4. POD creation
# 5. Print functionality
```

## Common Issues and Solutions

### Issue 1: Partial Migration
**Symptom**: Some objects exist, others don't
**Solution**: Use `FIX_POD_MIGRATION.sql` - it's idempotent

### Issue 2: Permission Errors
**Symptom**: Can't create POD records
**Solution**: Check RLS policies and grants:
```sql
-- Enable RLS
ALTER TABLE pod_records ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON pod_records TO authenticated;
```

### Issue 3: Foreign Key Violations
**Symptom**: Can't insert POD records
**Solution**: Ensure booking exists and has correct branch_id/organization_id

## Production Deployment Checklist

- [ ] Run `check-pod-migration-status.sql` to assess current state
- [ ] Apply `FIX_POD_MIGRATION.sql` to complete migration
- [ ] Verify all objects created successfully
- [ ] Test POD creation via API
- [ ] Test print functionality in UI
- [ ] Monitor for any errors in logs

## Quick Commands

```bash
# Check what's missing
psql -d your_db -f check-pod-migration-status.sql

# Apply idempotent fix
psql -d your_db -f FIX_POD_MIGRATION.sql

# Test the system
node test-booking-lifecycle-complete.cjs
```

## Notes

- The `FIX_POD_MIGRATION.sql` script is **idempotent** - safe to run multiple times
- It uses `IF NOT EXISTS` checks for all objects
- Includes proper error handling with `DO` blocks
- Adds organization_id for multi-tenant support
- Sets up all required RLS policies