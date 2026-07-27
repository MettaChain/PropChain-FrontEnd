# Cache Manager TTL Rationale

This document explains the rationale behind the default TTL (Time-To-Live) values used in `src/lib/cacheManager.ts`.

## Overview

The cache manager uses TTL values to determine how long cached data should remain valid. Different types of data have different freshness requirements, which is why we use different TTL values for different cache categories.

## Default TTL Values

| Cache Category | Default TTL | Rationale |
|----------------|-------------|-----------|
| Property Data | 5 minutes | Property data changes infrequently but needs to stay reasonably fresh for pricing updates |
| Transaction History | 1 minute | Transaction data should be relatively fresh to show recent activity |
| User Profile | 10 minutes | User profile data rarely changes and can be cached longer |
| Token Balances | 30 seconds | Token balances change frequently with transactions and need near-real-time accuracy |
| Gas Estimates | 15 seconds | Gas prices fluctuate rapidly and should be updated frequently |
| Network Status | 30 seconds | Network status can change quickly and affects transaction decisions |
| Static Config | 1 hour | Configuration data rarely changes and can be cached for extended periods |
| Exchange Rates | 2 minutes | Exchange rates fluctuate but not as rapidly as gas prices |

## TTL Selection Criteria

When choosing a TTL value, consider:

1. **Data Volatility**: How often does this data change?
   - High volatility (gas prices, balances) → Short TTL (15-30 seconds)
   - Medium volatility (transactions, exchange rates) → Medium TTL (1-2 minutes)
   - Low volatility (profiles, config) → Long TTL (5-60 minutes)

2. **Freshness Requirements**: How critical is it that users see the latest data?
   - Critical (token balances) → Short TTL
   - Important (transactions) → Medium TTL
   - Nice-to-have (config) → Long TTL

3. **Performance Impact**: What's the cost of stale data?
   - High cost (wrong balance shown) → Short TTL
   - Medium cost (slightly outdated transactions) → Medium TTL
   - Low cost (old config) → Long TTL

4. **API Rate Limits**: Are there external API rate limits to consider?
   - Aggressive caching reduces API calls
   - Balance freshness needs vs. rate limits

## Cache Invalidation

In addition to TTL-based expiration, the cache manager supports:

- **Manual invalidation**: Force refresh specific cache entries
- **Version-based invalidation**: Invalidate all caches when data schema changes
- **Event-based invalidation**: Invalidate related caches when actions occur

## Best Practices

1. **Use the shortest TTL that's acceptable** for the use case
2. **Consider cascading invalidation** when related data changes
3. **Monitor cache hit rates** to tune TTL values
4. **Document any custom TTL values** you introduce
5. **Test with TTL=0** to ensure your code works without caching

## Configuration

TTL values can be overridden per-cache entry:

```typescript
cacheManager.set('key', data, { ttl: 60 }); // Custom TTL in seconds
```

Or via the cache configuration:

```typescript
const cacheConfig: CacheConfig = {
  ttl: 300, // 5 minutes default
  maxEntries: 1000,
  version: '1.0.0',
};
```
