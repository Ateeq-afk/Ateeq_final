# Redis Caching Setup

## Overview

The DesiCargo backend now includes comprehensive Redis caching for improved performance. The system gracefully degrades when Redis is unavailable, ensuring the application continues to function normally.

## Features Implemented

### 1. Caching Middleware
- **Branch Cache**: Caches branch-scoped data (15 minutes default)
- **User Cache**: Caches user-specific data (1 hour default)
- **Dashboard Cache**: Caches dashboard statistics (5 minutes default)
- **Search Cache**: Caches search results (10 minutes default)

### 2. Cache Invalidation
- Automatic cache invalidation on data modifications
- Pattern-based cache clearing
- Targeted invalidation for bookings, customers, branches

### 3. Integrated Routes
- **Bookings**: List caching (15 min) + invalidation on create/update
- **Customers**: Search result caching (20 min)
- **Dashboard**: Stats caching (5 min)
- **Health**: Cache statistics monitoring

### 4. Performance Monitoring
- Cache hit/miss statistics
- Response time tracking
- Memory usage monitoring
- Redis health checks in `/health/detailed`

## Environment Setup

### Development (Local Redis)
```bash
# Install Redis
brew install redis  # macOS
sudo apt-get install redis-server  # Ubuntu

# Start Redis
redis-server

# Or use Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Production (Docker Compose)
Redis is already configured in `docker-compose.yml`:
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
```

### Environment Variables
```bash
# Backend .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
CACHE_PREFIX=desicargo

# For cloud services:
# REDIS_URL=redis://localhost:6379
```

## Cache TTL Settings

| Data Type | TTL | Use Case |
|-----------|-----|----------|
| User Session | 24 hours | Authentication |
| User Data | 1 hour | Profile, preferences |
| Booking Data | 30 minutes | Booking lists |
| Customer Data | 1 hour | Customer information |
| Vehicle Data | 2 hours | Fleet information |
| Dashboard Stats | 5 minutes | Real-time metrics |
| Search Results | 10 minutes | Search performance |
| Rate Calculations | 30 minutes | Pricing data |

## Monitoring

### Health Endpoints
- `/health` - Basic health check
- `/health/detailed` - Includes Redis status and cache statistics

### Cache Statistics
```json
{
  "cache": {
    "hits": 150,
    "misses": 45,
    "hitRate": 76.92,
    "totalKeys": 234,
    "memoryUsage": "2.3M"
  }
}
```

## Performance Benefits

### Expected Improvements
- **Dashboard loads**: 60-80% faster (5-second cache)
- **Customer searches**: 50-70% faster (10-minute cache)
- **Booking lists**: 40-60% faster (15-minute cache)
- **Database load**: 30-50% reduction during peak hours

### Cache Patterns
1. **Read-through**: Automatically populate cache on miss
2. **Write-through**: Invalidate cache on data modification
3. **Time-based**: Automatic expiration for fresh data

## Graceful Degradation

The system is designed to work seamlessly without Redis:
- Cache misses fall back to database queries
- No functionality is lost when Redis is unavailable
- Automatic reconnection when Redis becomes available
- Detailed logging for troubleshooting

## Troubleshooting

### Common Issues

1. **Redis Connection Refused**
   - Ensure Redis is running on configured port
   - Check firewall/network settings
   - Verify environment variables

2. **High Memory Usage**
   - Monitor cache statistics
   - Adjust TTL values if needed
   - Implement cache size limits

3. **Cache Invalidation Issues**
   - Check invalidation patterns
   - Verify middleware order
   - Monitor cache hit rates

### Debug Commands
```bash
# Check Redis status
redis-cli ping

# Monitor cache activity
redis-cli monitor

# Check memory usage
redis-cli info memory

# List all keys
redis-cli keys "desicargo:*"
```

## Next Steps

1. **Monitor Performance**: Track cache hit rates and response times
2. **Fine-tune TTL**: Adjust cache durations based on usage patterns
3. **Add More Routes**: Implement caching for additional API endpoints
4. **Cache Warming**: Pre-populate frequently accessed data
5. **Horizontal Scaling**: Configure Redis cluster for high availability