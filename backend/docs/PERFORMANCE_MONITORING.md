# Performance Monitoring Guide for DesiCargo

## Quick Start

### 1. Apply Performance Indexes
Run the migration file `027_performance_indexes_simple.sql` in Supabase SQL Editor.

### 2. Monitor Query Performance

#### Find Slow Queries
```sql
-- Enable pg_stat_statements extension first
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find top 10 slowest queries
SELECT 
    round(total_exec_time::numeric, 2) AS total_time_ms,
    round(mean_exec_time::numeric, 2) AS mean_time_ms,
    calls,
    query
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### Check Index Usage
```sql
-- See which indexes are being used
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

#### Find Missing Indexes
```sql
-- Tables with high sequential scans (need indexes)
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    n_tup_ins + n_tup_upd + n_tup_del as total_writes,
    pg_size_pretty(pg_relation_size(relid)) as table_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND seq_scan > idx_scan
    AND n_live_tup > 10000
ORDER BY seq_scan DESC;
```

## Key Performance Metrics to Monitor

### 1. Response Time Targets
- API endpoints: < 200ms (p95)
- Dashboard queries: < 500ms (p95)
- Search operations: < 100ms (p95)
- Booking creation: < 300ms (p95)

### 2. Database Health Indicators
```sql
-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Long running queries (> 5 seconds)
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
AND state != 'idle';

-- Table bloat check
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS indexes_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;
```

### 3. Cache Hit Ratio
```sql
-- Should be > 99% for good performance
SELECT 
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))::float as cache_hit_ratio
FROM pg_statio_user_tables;
```

## Performance Optimization Checklist

### Daily Tasks
- [ ] Check slow query log
- [ ] Monitor connection count (should be < 80% of max)
- [ ] Review error logs for timeout errors

### Weekly Tasks
- [ ] Analyze index usage and remove unused indexes
- [ ] Run VACUUM ANALYZE on large tables
- [ ] Review query performance trends
- [ ] Check for table bloat

### Monthly Tasks
- [ ] Review and optimize slow queries
- [ ] Update table statistics
- [ ] Evaluate need for new indexes
- [ ] Archive old data if needed

## Common Performance Issues and Solutions

### 1. Slow Dashboard Loading
**Symptom**: Dashboard takes > 2 seconds to load
**Solution**: 
- Ensure `idx_bookings_branch_status_count` index exists
- Check if booking counts are being cached
- Consider materialized views for summary data

### 2. Customer Search Timeout
**Symptom**: Customer search times out or is very slow
**Solution**:
- Ensure `idx_customers_name_mobile` index exists
- Use full-text search for better performance
- Implement search result caching

### 3. High Database CPU
**Symptom**: Database CPU consistently > 80%
**Solution**:
- Identify and optimize expensive queries
- Add missing indexes
- Consider read replicas for reporting

### 4. Booking Creation Slowness
**Symptom**: Creating bookings takes > 1 second
**Solution**:
- Check for lock contention
- Ensure credit check queries are optimized
- Review trigger performance

## Monitoring Tools Setup

### 1. Application Performance Monitoring
Add these metrics to your monitoring dashboard:
- API response time (p50, p95, p99)
- Database query time
- Error rate
- Active database connections

### 2. Database Monitoring Queries
Create these views for easy monitoring:

```sql
-- Create performance monitoring schema
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Slow queries view
CREATE OR REPLACE VIEW monitoring.slow_queries AS
SELECT 
    round(total_exec_time::numeric, 2) AS total_time_ms,
    round(mean_exec_time::numeric, 2) AS mean_time_ms,
    calls,
    query
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- Index efficiency view
CREATE OR REPLACE VIEW monitoring.index_efficiency AS
SELECT 
    schemaname,
    tablename,
    100 * idx_scan / (seq_scan + idx_scan) AS index_usage_percent,
    n_live_tup AS row_count,
    pg_size_pretty(pg_relation_size(relid)) AS table_size
FROM pg_stat_user_tables
WHERE seq_scan + idx_scan > 0
ORDER BY index_usage_percent ASC;
```

### 3. Alerting Thresholds
Set up alerts for:
- Query time > 5 seconds
- Database CPU > 85%
- Connection count > 80% of max
- Cache hit ratio < 95%
- Disk usage > 80%

## Performance Best Practices

1. **Always use indexes for**:
   - Foreign key columns
   - Columns in WHERE clauses
   - Columns in ORDER BY clauses
   - Columns used in JOINs

2. **Avoid**:
   - SELECT * queries
   - N+1 query problems
   - Large OFFSET values in pagination
   - Unnecessary JOINs

3. **Use**:
   - Connection pooling
   - Query result caching
   - Batch operations where possible
   - EXPLAIN ANALYZE for query optimization

## Useful Resources
- [Postgres Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Supabase Performance Guide](https://supabase.com/docs/guides/platform/performance)
- [pg_stat_statements Documentation](https://www.postgresql.org/docs/current/pgstatstatements.html)