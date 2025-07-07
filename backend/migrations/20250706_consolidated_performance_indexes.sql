-- Consolidated Performance Indexes Migration
-- Created: 2025-07-06
-- This migration combines all performance indexes into a single file for easy execution

-- Bookings table indexes
CREATE INDEX IF NOT EXISTS idx_bookings_branch_id__status__created_at_DESC ON bookings USING btree (branch_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_lr_number ON bookings USING btree (lr_number);
CREATE INDEX IF NOT EXISTS idx_bookings_sender_id__branch_id ON bookings USING btree (sender_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_receiver_id__branch_id ON bookings USING btree (receiver_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_from_branch__to_branch__status ON bookings USING btree (from_branch, to_branch, status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_type__branch_id__created_at_DESC ON bookings USING btree (payment_type, branch_id, created_at DESC);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_branch_id__name__mobile ON customers USING btree (branch_id, name, mobile);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers USING btree (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_organization_id__gstin ON customers USING btree (organization_id, gstin) WHERE gstin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_organization_id__is_credit_customer__credit_limit ON customers USING btree (organization_id, is_credit_customer, credit_limit) WHERE is_credit_customer = true;

-- Vehicles table indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_branch_id__status ON vehicles USING btree (branch_id, status) WHERE is_active = true AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_number ON vehicles USING btree (vehicle_number) WHERE is_deleted = false;

-- OGPL table indexes
CREATE INDEX IF NOT EXISTS idx_ogpl_branch_id__status__created_at_DESC ON ogpl USING btree (branch_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ogpl_from_station__to_station__status ON ogpl USING btree (from_station, to_station, status);

-- Loading records indexes
CREATE INDEX IF NOT EXISTS idx_loading_records_ogpl_id__booking_id ON loading_records USING btree (ogpl_id, booking_id);

-- Update table statistics
ANALYZE bookings;
ANALYZE customers;
ANALYZE vehicles;
ANALYZE ogpl;
ANALYZE loading_records;

-- Performance monitoring functions
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

-- Summary report
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count 
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PERFORMANCE INDEXES APPLIED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total performance indexes: %', v_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Run these queries to monitor performance:';
  RAISE NOTICE '- SELECT * FROM get_index_usage();';
  RAISE NOTICE '- SELECT * FROM find_missing_indexes();';
  RAISE NOTICE '========================================';
END $$;