# Database Connection Pooling Implementation Guide

This guide explains the comprehensive database connection pooling implementation for the DesiCargo backend API.

## Overview

The database connection pooling system provides:
- **High Performance**: Efficient connection reuse and management
- **Scalability**: Support for concurrent requests with optimized connection allocation
- **Reliability**: Automatic reconnection, health monitoring, and graceful degradation
- **Monitoring**: Comprehensive metrics and health checks
- **Production Ready**: Environment-specific configurations and error handling

## Architecture

### Core Components

1. **DatabaseConnectionPool** (`src/config/database.ts`)
   - Singleton pattern for global connection management
   - PostgreSQL-based connection pooling using `pg` library
   - Environment-specific configuration
   - Automatic reconnection with retry logic

2. **Database Middleware** (`src/middleware/database.ts`)
   - Express middleware for database access
   - Request-scoped database operations
   - Performance monitoring and logging
   - Error handling and mapping

3. **Supabase Pool Manager** (`src/utils/supabasePool.ts`)
   - Integration between Supabase client and connection pool
   - Enhanced query builder with pool support
   - Hybrid approach for optimal performance

4. **Health Monitoring** (`src/routes/health.ts`)
   - Real-time pool statistics
   - Connection health checks
   - Performance metrics

## Configuration

### Environment Variables

```bash
# Required for connection pooling
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_PASSWORD=your_database_password

# Optional database configuration
DATABASE_URL=postgresql://user:password@host:port/database
```

### Pool Settings by Environment

#### Development
```typescript
{
  min: 2,                    // Minimum connections
  max: 20,                   // Maximum connections
  idleTimeoutMillis: 30000,  // 30 seconds idle timeout
  connectionTimeoutMillis: 10000, // 10 seconds connection timeout
  acquireTimeoutMillis: 60000,    // 60 seconds acquire timeout
}
```

#### Production
```typescript
{
  min: 5,                    // Higher minimum for production load
  max: 50,                   // Higher maximum for scalability
  idleTimeoutMillis: 120000, // 2 minutes idle timeout
  connectionTimeoutMillis: 15000, // 15 seconds connection timeout
  acquireTimeoutMillis: 90000,    // 90 seconds acquire timeout
}
```

#### Test
```typescript
{
  min: 1,                    // Minimal for testing
  max: 5,                    // Lower limit for test isolation
  idleTimeoutMillis: 10000,  // 10 seconds
  connectionTimeoutMillis: 5000,  // 5 seconds
  acquireTimeoutMillis: 15000,    // 15 seconds
}
```

## Usage Patterns

### 1. Direct Pool Access (Recommended for Complex Operations)

```typescript
import DatabaseConnectionPool from '../config/database';

const dbPool = DatabaseConnectionPool.getInstance();

// Simple query
const result = await dbPool.query(
  'SELECT * FROM bookings WHERE organization_id = $1',
  [organizationId]
);

// Transaction
await dbPool.transaction(async (client) => {
  await client.query('INSERT INTO bookings (...) VALUES (...)', values);
  await client.query('UPDATE inventory SET quantity = quantity - $1', [quantity]);
  return { success: true };
});
```

### 2. Middleware-Based Access (Recommended for Route Handlers)

```typescript
// Route handler with database middleware
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await req.db.query(
      'SELECT * FROM bookings WHERE branch_id = $1',
      [req.branchId]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    // Error is automatically handled by database error middleware
    throw error;
  }
});

// Transaction example
app.post('/api/bookings', async (req, res) => {
  try {
    const booking = await req.db.transaction(async (client) => {
      const bookingResult = await client.query(
        'INSERT INTO bookings (...) VALUES (...) RETURNING *',
        bookingData
      );
      
      await client.query(
        'INSERT INTO booking_articles (...) VALUES (...)',
        articleData
      );
      
      return bookingResult.rows[0];
    });
    
    res.json({ success: true, data: booking });
  } catch (error) {
    throw error;
  }
});
```

### 3. Enhanced Query Builder

```typescript
import SupabasePoolManager from '../utils/supabasePool';

const supabaseManager = SupabasePoolManager.getInstance();

// Using pool-based query builder
const bookings = await supabaseManager
  .createQueryBuilder('bookings', true) // usePool = true
  .select('id, lr_number, status, total_amount')
  .eq('organization_id', orgId)
  .eq('branch_id', branchId)
  .order('created_at', false)
  .limit(50)
  .execute();

// Insert with pool
const newBooking = await supabaseManager
  .createQueryBuilder('bookings', true)
  .insert({
    lr_number: 'LR001',
    sender_id: senderId,
    receiver_id: receiverId,
    total_amount: 1500,
    organization_id: orgId,
    branch_id: branchId
  });
```

## Monitoring and Health Checks

### Health Endpoints

1. **Basic Pool Health**: `GET /health/pool`
   ```json
   {
     "service": "connection_pool",
     "status": "healthy",
     "stats": {
       "totalCount": 8,
       "idleCount": 5,
       "waitingCount": 0,
       "settings": {
         "min": 2,
         "max": 20
       }
     }
   }
   ```

2. **Performance Metrics**: `GET /health/performance`
   ```json
   {
     "metrics": {
       "database_response_time": 45,
       "memory_usage": { "heapUsed": 125, "heapTotal": 200 },
       "uptime": 3600,
       "cpu_usage": { "user": 1000000, "system": 500000 }
     },
     "pool_stats": {
       "totalCount": 8,
       "idleCount": 5,
       "waitingCount": 0
     }
   }
   ```

3. **Detailed Health**: `GET /health/detailed`
   - Includes database pool health
   - Connection statistics
   - Performance metrics
   - Overall system status

### Performance Monitoring

The system automatically logs:
- Slow queries (> 1 second)
- Connection pool statistics
- Failed connection attempts
- Transaction rollbacks
- Pool exhaustion warnings

## Error Handling

### Automatic Error Mapping

The database error middleware automatically maps PostgreSQL errors to appropriate HTTP responses:

| PostgreSQL Error | HTTP Status | Response |
|------------------|-------------|----------|
| `23505` (unique_violation) | 409 | Resource already exists |
| `23503` (foreign_key_violation) | 400 | Invalid reference |
| `23502` (not_null_violation) | 400 | Required field missing |
| `57014` (query_canceled) | 408 | Query timeout |
| `53300` (too_many_connections) | 503 | Service unavailable |

### Error Recovery

- **Connection failures**: Automatic retry with exponential backoff
- **Pool exhaustion**: Graceful degradation with proper error responses
- **Query timeouts**: Automatic cancellation and cleanup
- **Transaction failures**: Automatic rollback and resource cleanup

## Performance Optimization

### Best Practices

1. **Connection Reuse**
   ```typescript
   // Good: Use pool for multiple operations
   const client = await dbPool.getClient();
   try {
     await client.query('SELECT ...');
     await client.query('UPDATE ...');
   } finally {
     client.release(); // Always release
   }
   
   // Better: Use transactions for related operations
   await dbPool.transaction(async (client) => {
     await client.query('SELECT ...');
     await client.query('UPDATE ...');
   });
   ```

2. **Query Optimization**
   ```typescript
   // Use prepared statements for repeated queries
   const result = await dbPool.query(
     'SELECT * FROM bookings WHERE organization_id = $1 AND status = $2',
     [orgId, status]
   );
   
   // Use appropriate timeouts
   await client.query(`SET statement_timeout = ${30000}`);
   ```

3. **Resource Management**
   ```typescript
   // Always handle cleanup in middleware
   app.use(async (req, res, next) => {
     const client = await dbPool.getClient();
     req.dbClient = client;
     
     res.on('finish', () => {
       client.release();
     });
     
     next();
   });
   ```

### Performance Tuning

#### Pool Size Optimization
- **Development**: Start with min=2, max=20
- **Production**: Scale based on concurrent users (typically min=5, max=50)
- **High Load**: Consider min=10, max=100 with monitoring

#### Timeout Configuration
- **Connection timeout**: 10-15 seconds (network dependent)
- **Query timeout**: 30-60 seconds (query complexity dependent)
- **Idle timeout**: 30-120 seconds (based on usage patterns)

## Production Deployment

### Environment Setup

1. **Database Configuration**
   ```bash
   # Production environment variables
   SUPABASE_URL=https://your-prod-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_prod_service_key
   SUPABASE_DB_PASSWORD=your_secure_password
   NODE_ENV=production
   ```

2. **Connection Pool Settings**
   - Monitor actual usage patterns
   - Adjust pool sizes based on metrics
   - Set appropriate timeouts for your infrastructure

3. **Monitoring Setup**
   ```typescript
   // Enable detailed logging in production
   log.info('Pool statistics', {
     totalConnections: pool.totalCount,
     idleConnections: pool.idleCount,
     waitingRequests: pool.waitingCount
   });
   ```

### Security Considerations

1. **Connection Security**
   - Use SSL/TLS for database connections
   - Rotate database passwords regularly
   - Limit connection permissions to required schemas

2. **Query Security**
   - Always use parameterized queries
   - Implement proper input validation
   - Log security-relevant operations

3. **Access Control**
   - Implement Row Level Security (RLS) policies
   - Use principle of least privilege
   - Monitor unauthorized access attempts

## Troubleshooting

### Common Issues

1. **Pool Exhaustion**
   ```
   Error: Pool exhausted
   ```
   - **Solution**: Increase max pool size or optimize query performance
   - **Prevention**: Monitor pool usage and implement request queuing

2. **Connection Timeouts**
   ```
   Error: Connection timeout
   ```
   - **Solution**: Increase connection timeout or check network connectivity
   - **Prevention**: Use health checks and connection retry logic

3. **Long-Running Queries**
   ```
   Warning: Slow query detected (1500ms)
   ```
   - **Solution**: Optimize query or add appropriate indexes
   - **Prevention**: Set query timeouts and monitor performance

### Debugging

1. **Enable Debug Logging**
   ```typescript
   log.debug('Database operation', {
     query: query.substring(0, 100),
     duration: endTime - startTime,
     poolStats: dbPool.getPoolStats()
   });
   ```

2. **Monitor Pool Health**
   ```bash
   curl http://localhost:4000/health/pool
   curl http://localhost:4000/health/performance
   ```

3. **Check Application Metrics**
   - Monitor memory usage for connection leaks
   - Track response times for performance degradation
   - Watch error rates for connection issues

This comprehensive connection pooling implementation ensures optimal database performance, reliability, and scalability for the DesiCargo application in production environments.