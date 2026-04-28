# Redis Caching Implementation for Property Data API

## Overview

This implementation adds Redis caching layer to the PropChain frontend property data API to improve performance by reducing blockchain data fetch requests.

## Features Implemented

### ✅ Core Caching Features
- **Redis Connection Setup**: Configurable Redis client with connection pooling and retry logic
- **Property Listings Cache**: 5-minute TTL for property search results and listings
- **Property Details Cache**: 1-minute TTL for individual property details
- **Cache Hit Rate Monitoring**: Real-time tracking of cache performance metrics
- **Cache Invalidation**: Automatic invalidation on blockchain events

### ✅ API Endpoints
- `/api/properties` - Property listings with Redis caching
- `/api/properties/[id]` - Individual property details with Redis caching
- `/api/cache/stats` - Cache statistics and health monitoring

### ✅ Cache Strategies
- **Cache-First**: Serve from cache when available
- **Network-First**: Always fetch from network, cache result
- **Stale-While-Revalidate**: Serve stale cache while refreshing in background

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│   Next.js API    │───▶│   Redis Cache   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Property Service │───▶│ Blockchain Data │
                       └──────────────────┘    └─────────────────┘
```

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# Redis Cache Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Blockchain Configuration (for cache invalidation)
PROPERTY_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
```

### Cache TTL Settings

- **Property Listings**: 5 minutes (300 seconds)
- **Property Details**: 1 minute (60 seconds)
- **Search Results**: 5 minutes (300 seconds)
- **Autocomplete**: 10 minutes (600 seconds)

## Usage

### Basic Property Search with Caching

```typescript
// API automatically uses Redis caching
const response = await fetch('/api/properties?query=New York&sortBy=price-asc');
const data = await response.json();
```

### Individual Property with Caching

```typescript
// API automatically uses Redis caching
const response = await fetch('/api/properties/property-123');
const data = await response.json();
```

### Cache Statistics

```typescript
// Get cache performance metrics
const response = await fetch('/api/cache/stats');
const stats = await response.json();
```

## Cache Invalidation

### Automatic Invalidation

The system automatically invalidates cache when:

1. **Blockchain Events Detected**: Property creation, updates, sales, etc.
2. **API Mutations**: POST/PUT/DELETE operations
3. **TTL Expiration**: Cache entries expire automatically

### Manual Invalidation

```typescript
import { redisCacheService } from '@/lib/redisCache';

// Invalidate specific property
await redisCacheService.invalidateProperty('property-123');

// Invalidate all property cache
await redisCacheService.invalidateAllProperties();
```

## Monitoring

### Cache Health Check

```typescript
import { redisCacheService } from '@/lib/redisCache';

const health = await redisCacheService.healthCheck();
console.log(`Healthy: ${health.healthy}, Latency: ${health.latency}ms`);
```

### Cache Statistics

```typescript
const stats = await redisCacheService.getStats();
console.log(`Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`Total Requests: ${stats.total}`);
```

## Performance Impact

### Before Redis Caching
- Every property request hits blockchain
- High latency (500ms-2s per request)
- Limited scalability
- High blockchain RPC costs

### After Redis Caching
- Cache hits serve in <10ms
- 80-95% cache hit rate expected
- Reduced blockchain load
- Improved user experience

## Implementation Details

### Files Created/Modified

1. **`src/lib/redis.ts`** - Redis client configuration and connection management
2. **`src/lib/redisCache.ts`** - Redis cache service with TTL management
3. **`src/lib/blockchainCacheInvalidator.ts`** - Blockchain event listener for cache invalidation
4. **`src/lib/initRedisCache.ts`** - Initialization and shutdown logic
5. **`src/middleware.ts`** - Next.js middleware for Redis initialization
6. **`src/app/api/properties/route.ts`** - Property listings API with Redis caching
7. **`src/app/api/properties/[id]/route.ts`** - Property details API with Redis caching
8. **`src/app/api/cache/stats/route.ts`** - Cache statistics API endpoint
9. **`src/lib/propertyService.ts`** - Updated to use Redis as primary cache
10. **`.env.example`** - Added Redis configuration variables

### Cache Key Strategy

```
propchain:property:{propertyId}           # Individual property
propchain:listing:{filters}:{page}       # Property listings
propchain:search:{filters}               # Search results
propchain:autocomplete:{query}            # Autocomplete suggestions
propchain:cache:stats                    # Cache statistics
propchain:cache:hit_rate                 # Hit rate counter
```

### Fallback Strategy

1. **Redis Cache** (Primary)
2. **Local IndexedDB Cache** (Fallback)
3. **Network Request** (Last resort)

## Testing

### Unit Tests

```bash
npm test -- --testPathPattern=redis
```

### Integration Tests

```bash
npm run test:e2e
```

### Cache Performance Testing

```bash
# Test cache hit rates
curl "http://localhost:3000/api/cache/stats"

# Test property caching
curl "http://localhost:3000/api/properties?limit=10"
```

## Deployment Considerations

### Production Setup

1. **Redis Server**: Deploy Redis cluster or managed service
2. **Environment Variables**: Configure production Redis settings
3. **Monitoring**: Set up cache performance monitoring
4. **Backup**: Configure Redis persistence and backup

### Redis Configuration Recommendations

```conf
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server status
   - Verify environment variables
   - Check network connectivity

2. **Cache Not Working**
   - Verify Redis client initialization
   - Check cache TTL settings
   - Monitor cache hit rates

3. **High Memory Usage**
   - Adjust maxmemory policy
   - Monitor cache size
   - Implement cache cleanup

### Debug Logging

Enable debug logging:

```env
LOG_LEVEL=debug
```

## Future Enhancements

### Planned Features

1. **Cache Warming**: Pre-populate cache with popular properties
2. **Multi-Region Caching**: Redis cluster for global distribution
3. **Advanced Analytics**: Detailed cache performance metrics
4. **Smart Invalidation**: Predictive cache invalidation based on usage patterns

### Performance Optimizations

1. **Pipeline Operations**: Batch Redis operations for better performance
2. **Compression**: Enable Redis compression for large objects
3. **Connection Pooling**: Optimize Redis connection management

## Security Considerations

1. **Redis Authentication**: Use strong passwords
2. **Network Security**: Restrict Redis network access
3. **Data Encryption**: Enable Redis TLS in production
4. **Access Control**: Implement proper Redis ACLs

## Support

For issues related to Redis caching:

1. Check Redis server logs
2. Review application logs
3. Monitor cache statistics
4. Test Redis connectivity

---

**Implementation Date**: April 28, 2026  
**Version**: 1.0.0  
**Status**: ✅ Complete
