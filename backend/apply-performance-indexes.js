import 'dotenv/config';
import helpers from './migration-helpers.js';

async function applyPerformanceIndexes() {
  
  try {
    // 1. Bookings table indexes
    
    await helpers.createIndex('bookings', ['branch_id', 'status', 'created_at DESC'], {
      where: null
    });
    
    await helpers.createIndex('bookings', 'lr_number');
    
    await helpers.createIndex('bookings', ['sender_id', 'branch_id']);
    
    await helpers.createIndex('bookings', ['receiver_id', 'branch_id']);
    
    await helpers.createIndex('bookings', ['from_branch', 'to_branch', 'status']);
    
    await helpers.createIndex('bookings', ['payment_type', 'branch_id', 'created_at DESC']);
    
    
    // 2. Customers table indexes
    
    await helpers.createIndex('customers', ['branch_id', 'name', 'mobile']);
    
    await helpers.createIndex('customers', 'email', {
      where: 'email IS NOT NULL'
    });
    
    await helpers.createIndex('customers', ['organization_id', 'gstin'], {
      where: 'gstin IS NOT NULL'
    });
    
    await helpers.createIndex('customers', ['organization_id', 'is_credit_customer', 'credit_limit'], {
      where: 'is_credit_customer = true'
    });
    
    
    // 3. Vehicles table indexes
    
    await helpers.createIndex('vehicles', ['branch_id', 'status'], {
      where: 'is_active = true AND is_deleted = false'
    });
    
    await helpers.createIndex('vehicles', 'vehicle_number', {
      where: 'is_deleted = false'
    });
    
    
    // 4. OGPL table indexes
    
    await helpers.createIndex('ogpl', ['branch_id', 'status', 'created_at DESC']);
    
    await helpers.createIndex('ogpl', ['from_station', 'to_station', 'status']);
    
    
    // 5. Loading records indexes
    
    await helpers.createIndex('loading_records', ['ogpl_id', 'booking_id']);
    
    
    // 6. Update table statistics
    
    const analyzeSQL = `
      ANALYZE bookings;
      ANALYZE customers;
      ANALYZE vehicles;
      ANALYZE ogpl;
      ANALYZE loading_records;
    `;
    
    await helpers.executeMigration('update_table_statistics', analyzeSQL);
    
    
    // 7. Create performance monitoring functions
    
    const monitoringSQL = `
-- Function to check index usage
CREATE OR REPLACE FUNCTION get_index_usage()
RETURNS TABLE(
  table_name text,
  index_name text,
  index_scans bigint,
  index_size text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tablename::text,
    indexname::text,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid))::text
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to find missing indexes
CREATE OR REPLACE FUNCTION find_missing_indexes()
RETURNS TABLE(
  table_name text,
  seq_scans bigint,
  seq_rows_read bigint,
  table_size text,
  recommendation text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tablename::text,
    seq_scan,
    seq_tup_read,
    pg_size_pretty(pg_total_relation_size(relid))::text,
    CASE 
      WHEN seq_scan > 1000 THEN 'High sequential scans - consider adding index'
      ELSE 'Monitor for increased activity'
    END::text
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  AND seq_scan > idx_scan
  AND n_live_tup > 1000
  ORDER BY seq_scan DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_index_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION find_missing_indexes() TO authenticated;
    `;
    
    await helpers.executeMigration('create_monitoring_functions', monitoringSQL);
    
    
    
  } catch (error) {
    console.error('❌ Error applying performance indexes:', error);
    process.exit(1);
  }
}

// Run the migration
applyPerformanceIndexes();