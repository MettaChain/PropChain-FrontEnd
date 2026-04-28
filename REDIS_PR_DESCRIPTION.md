# Pull Request: Performance - Add Redis caching for property data API

## Summary
Fixes #135 - Implements Redis caching layer for property data API to significantly improve performance by reducing blockchain data fetch requests.

## 🚀 Features Implemented

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

## 📊 Performance Impact

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

## 🏗️ Architecture

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

## 📁 Files Added/Modified

### New Files
- `src/lib/redis.ts` - Redis client configuration and connection management
- `src/lib/redisCache.ts` - Redis cache service with TTL management
- `src/lib/blockchainCacheInvalidator.ts` - Blockchain event listener for cache invalidation
- `src/lib/initRedisCache.ts` - Initialization and shutdown logic
- `src/middleware.ts` - Next.js middleware for Redis initialization
- `src/app/api/properties/route.ts` - Property listings API with Redis caching
- `src/app/api/properties/[id]/route.ts` - Property details API with Redis caching
- `src/app/api/cache/stats/route.ts` - Cache statistics API endpoint
- `REDIS_CACHING_IMPLEMENTATION.md` - Comprehensive documentation

### Modified Files
- `src/lib/propertyService.ts` - Updated to use Redis as primary cache layer
- `package.json` - Added Redis dependencies (ioredis, redis)
- `.env.example` - Added Redis configuration variables

## ⚙️ Configuration

### Environment Variables Required
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

## 🔄 Cache Invalidation

### Automatic Invalidation
- **Blockchain Events**: Property creation, updates, sales, etc.
- **API Mutations**: POST/PUT/DELETE operations
- **TTL Expiration**: Cache entries expire automatically

### Manual Invalidation
```typescript
import { redisCacheService } from '@/lib/redisCache';

// Invalidate specific property
await redisCacheService.invalidateProperty('property-123');

// Invalidate all property cache  
await redisCacheService.invalidateAllProperties();
```

## 📈 Monitoring

### Cache Health Check
```typescript
const health = await redisCacheService.healthCheck();
console.log(`Healthy: ${health.healthy}, Latency: ${health.latency}ms`);
```

### Cache Statistics
```typescript
const stats = await redisCacheService.getStats();
console.log(`Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
```

## 🧪 Testing

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

## 🚀 Deployment

### Production Setup
1. Deploy Redis server or use managed Redis service
2. Configure production Redis environment variables
3. Set up cache performance monitoring
4. Configure Redis persistence and backup

### Redis Configuration Recommendations
```conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 🔒 Security Considerations

1. **Redis Authentication**: Use strong passwords
2. **Network Security**: Restrict Redis network access  
3. **Data Encryption**: Enable Redis TLS in production
4. **Access Control**: Implement proper Redis ACLs

## 📋 Checklist

- [x] Redis connection setup with retry logic
- [x] Property listings caching (5-minute TTL)
- [x] Property details caching (1-minute TTL)
- [x] Cache hit rate monitoring
- [x] Cache invalidation on blockchain events
- [x] API endpoints with Redis integration
- [x] Fallback to local IndexedDB cache
- [x] Environment configuration
- [x] Comprehensive documentation
- [x] Error handling and logging
- [x] Health check endpoints

## 🔗 Related Issues

- Fixes #135 - Performance: Add Redis caching for property data API

## 📝 Additional Notes

- The implementation uses Redis as the primary cache layer with IndexedDB as fallback
- Cache invalidation automatically handles blockchain events when configured
- The system includes comprehensive monitoring and health checks
- All cache operations are non-blocking and won't affect API performance if Redis is unavailable

---

**Testing Instructions:**
1. Set up local Redis server
2. Copy `.env.example` to `.env.local` and configure Redis settings
3. Run `npm run dev`
4. Test property endpoints and monitor cache hit rates via `/api/cache/stats`

**Review Focus:**
- Security of Redis configuration
- Cache TTL values appropriateness
- Error handling and fallback mechanisms
- Performance impact measurement
