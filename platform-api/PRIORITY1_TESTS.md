# Priority 1 Tests - Redis Cache Implementation

## 📋 Overview

This document covers the **Priority 1 (Critical)** tests that have been implemented for the Redis cache system. These tests are essential for production readiness and must pass before deploying to production.

## 🎯 Priority 1 Test Suites

### 1. Redis Initialization Tests
**File:** `src/utils/__tests__/redis-init.test.ts`
**Purpose:** Verify Redis connection startup, health checks, warmup, and graceful shutdown

#### Coverage:
- ✅ **Connection Initialization**
  - Successful Redis connection with health checks
  - Connection timeout handling
  - Degraded status detection
  - Connection info display (host, port, DB, latency)

- ✅ **Connection Health Checks**
  - Redis readiness verification
  - Health status validation
  - Unhealthy state detection

- ✅ **Cache Warmup**
  - Successful warmup completion
  - Error handling (non-critical)
  - Graceful failure handling

- ✅ **Operations Testing**
  - SET operation validation
  - GET operation validation
  - DELETE operation validation
  - Data integrity verification
  - JSON serialization/deserialization
  - Data corruption detection

- ✅ **Full Initialization Flow**
  - Complete startup sequence
  - Partial failure handling
  - Performance measurement

- ✅ **Graceful Shutdown**
  - Redis disconnection
  - Error handling during shutdown
  - Signal handlers (SIGTERM, SIGINT)
  - Uncaught exception handling
  - Unhandled rejection handling

#### Run Commands:
```bash
# Run redis-init tests only
npm run test:redis-init

# Run with verbose output
npm run test:redis-init -- --verbose
```

---

### 2. Health Routes Tests
**File:** `src/routes/__tests__/health.routes.test.ts`
**Purpose:** Comprehensive testing of all health check endpoints including Redis cache

#### Coverage:
- ✅ **GET /health** - Basic health status
  - 200 OK response
  - Valid timestamp in ISO format
  - Positive uptime
  - Environment detection
  - Error handling

- ✅ **GET /health/detailed** - Detailed health with all services
  - All services healthy (200)
  - Database unhealthy (503)
  - Redis unhealthy (503)
  - System information
  - Cache statistics
  - Hit rate reporting
  - Exception handling

- ✅ **GET /health/database** - Database health
  - Healthy database (200)
  - Unhealthy database (503)
  - Connection timeout handling

- ✅ **GET /health/cache** - Redis/Cache health
  - Healthy cache with stats (200)
  - Unhealthy cache (503)
  - Connection info
  - Performance metrics
  - Hit rate analysis
  - High latency detection

- ✅ **GET /health/cache/stats** - Cache statistics
  - Stats retrieval
  - Hit rate calculation
  - Total requests calculation
  - Zero hit rate handling
  - Error handling

- ✅ **POST /health/cache/stats/reset** - Reset stats
  - Successful reset
  - Error handling

- ✅ **GET /health/ready** - Kubernetes readiness probe
  - Ready when all services healthy (200)
  - Not ready when database down (503)
  - Not ready when Redis down (503)
  - Error handling

- ✅ **GET /health/live** - Kubernetes liveness probe
  - Always returns 200 if process running
  - Valid uptime
  - Fast response time (<100ms)

- ✅ **Performance Tests**
  - Response time <100ms for basic health
  - Concurrent request handling
  - Memory leak prevention

- ✅ **Edge Cases**
  - Missing environment variables
  - Very high cache error counts
  - NaN hit rate handling

#### Run Commands:
```bash
# Run health routes tests only
npm run test:health-routes

# Run with verbose output
npm run test:health-routes -- --verbose
```

---

### 3. Cache Backup/Restore Tests
**File:** `src/cache/__tests__/services/backup.service.test.ts`
**Purpose:** Validate cache backup, restore, warmup, and recovery capabilities

#### Coverage:
- ✅ **Backup Operations**
  - Full cache backup
  - TTL preservation in backup
  - Multiple Redis data types (string, hash, list, set, zset)
  - Empty cache handling
  - Pattern-based backup
  - Metadata inclusion
  - Error handling

- ✅ **Restore Operations**
  - Full restore from backup
  - Skip existing keys option
  - Overwrite existing keys option
  - TTL preservation during restore
  - Multiple data types restoration
  - Error handling during restore

- ✅ **Cache Warmup**
  - Tenant cache warmup from database
  - Error handling during warmup
  - Disabled options handling

- ✅ **Cache Management**
  - Clear all cache data
  - Pattern-based clearing
  - No-match scenarios

- ✅ **Backup Statistics**
  - Total key count
  - Memory usage reporting
  - Keys by type breakdown

- ✅ **Serialization**
  - Backup to JSON
  - JSON to backup restoration

- ✅ **Backup Verification**
  - Valid backup validation
  - Missing metadata detection
  - Key count mismatch detection
  - Invalid key detection

- ✅ **Incremental Backup**
  - Changed keys only backup
  - Timestamp-based filtering

- ✅ **Integration Tests**
  - Complete backup-restore cycle
  - Concurrent backup operations
  - Data integrity verification

#### Run Commands:
```bash
# Run backup service tests only
npm run test:cache:backup

# Run with verbose output
npm run test:cache:backup -- --verbose
```

---

### 4. Cache-Database Consistency Tests
**File:** `src/cache/__tests__/integration/cache-db-consistency.test.ts`
**Purpose:** Ensure data coherence between Redis cache and PostgreSQL database

#### Coverage:
- ✅ **Data Consistency**
  - Tenant data consistency (cache ↔ DB)
  - User data consistency (cache ↔ DB)
  - Stale cache data detection
  - Cache invalidation after DB updates
  - Read-through consistency
  - Write-through consistency
  - Concurrent update handling

- ✅ **Backup and Restore**
  - Cache data backup
  - Cache restore from backup
  - Rebuild cache from database
  - Partial backup/restore
  - TTL preservation in backup

- ✅ **Cache Warming**
  - Tenant cache warmup from DB
  - User cache warmup for active sessions
  - Error handling during warmup

- ✅ **Data Integrity**
  - Data validation after cache operations
  - Data corruption detection
  - Large dataset handling (1000+ items)

- ✅ **Consistency Recovery**
  - Recovery from cache failure
  - Inconsistent state resolution
  - Fallback to database
  - Cache re-population

#### Run Commands:
```bash
# Run consistency tests only
npm run test:cache:consistency

# Run with verbose output
npm run test:cache:consistency -- --verbose
```

---

## 🚀 Running All Priority 1 Tests

### Single Command
Run all Priority 1 tests at once:

```bash
npm run test:priority1
```

### With Verbose Output
```bash
npm run test:priority1:verbose
```

### With Coverage Report
```bash
npm run test:priority1 -- --coverage
```

### Individual Test Suites
```bash
# Redis initialization
npm run test:redis-init

# Health routes
npm run test:health-routes

# Backup/Restore
npm run test:cache:backup

# Cache-DB consistency
npm run test:cache:consistency
```

---

## 📊 Expected Results

### Pass Criteria
All Priority 1 tests MUST pass with:
- ✅ 0 test failures
- ✅ No uncaught exceptions
- ✅ No unhandled promise rejections
- ✅ Coverage > 80% for critical paths

### Test Counts
- **Redis Init Tests:** ~40+ test cases
- **Health Routes Tests:** ~50+ test cases
- **Backup Service Tests:** ~40+ test cases
- **Consistency Tests:** ~25+ test cases
- **TOTAL:** ~155+ critical test cases

---

## 🔧 Prerequisites

### Environment Setup
1. **Redis Server Running**
   ```bash
   docker-compose up -d redis
   # or
   redis-server
   ```

2. **PostgreSQL Database**
   ```bash
   docker-compose up -d postgres
   ```

3. **Environment Variables**
   ```env
   NODE_ENV=test
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_password
   DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
   ```

4. **Database Migrations**
   ```bash
   npx prisma migrate dev
   ```

---

## ⚠️ Common Issues and Solutions

### Issue 1: Redis Connection Failed
**Symptom:** Tests fail with "Connection refused"
**Solution:**
```bash
# Check Redis is running
docker ps | grep redis

# Start Redis if not running
docker-compose up -d redis

# Verify connection
redis-cli ping
```

### Issue 2: Database Connection Failed
**Symptom:** Tests fail with "Cannot connect to database"
**Solution:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Start PostgreSQL if not running
docker-compose up -d postgres

# Run migrations
npx prisma migrate dev
```

### Issue 3: Tests Timeout
**Symptom:** Tests hang or timeout
**Solution:**
- Increase Jest timeout in `jest.config.cjs`:
  ```js
  testTimeout: 30000  // 30 seconds
  ```
- Check Redis/DB connections are not blocked
- Verify no infinite loops in cache warmup

### Issue 4: Flaky Tests
**Symptom:** Tests pass/fail intermittently
**Solution:**
- Clear Redis before each test
- Use proper test isolation
- Wait for async operations to complete
- Check for race conditions

---

## 📈 Coverage Goals

### Priority 1 Components Coverage Target: 90%+

| Component | Target | Current Status |
|-----------|--------|----------------|
| redis-init.ts | 90% | ✅ Implemented |
| health.routes.ts | 90% | ✅ Implemented |
| backup.service.ts | 90% | ✅ Implemented |
| cache-db consistency | 85% | ✅ Implemented |

---

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Priority 1 Tests

on: [push, pull_request]

jobs:
  test-priority1:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npx prisma migrate deploy
      
      - name: Run Priority 1 Tests
        run: npm run test:priority1
        env:
          NODE_ENV: test
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()
```

---

## ✅ Checklist Before Production

- [ ] All Priority 1 tests pass consistently
- [ ] Coverage > 90% for critical components
- [ ] No flaky tests (run 10 times successfully)
- [ ] Performance benchmarks met (<100ms for health checks)
- [ ] Redis connection pool optimized
- [ ] Database connection pool optimized
- [ ] Error handling verified for all failure scenarios
- [ ] Logging configured for monitoring
- [ ] Metrics/observability configured
- [ ] Load testing completed
- [ ] Failover testing completed
- [ ] Backup/restore tested with production-like data volume
- [ ] Security audit completed

---

## 📚 Related Documentation

- [Redis Implementation Guide](./REDIS_IMPLEMENTATION.txt)
- [Test Checklist](./src/cache/__tests__/TEST_CHECKLIST.md)
- [Test Execution Guide](./src/cache/__tests__/TESTS_REDIS.md)
- [Additional Tests Recommendations](./src/cache/__tests__/ADDITIONAL_TESTS.md)
- [Cache Service README](./src/cache/__tests__/README.md)

---

## 🎓 Next Steps (Priority 2+)

After Priority 1 tests pass:

1. **Priority 2: Advanced Features**
   - Cluster mode tests
   - Multi-region replication
   - Advanced monitoring/alerting
   - Rate limiter edge cases
   - Distributed locks advanced scenarios

2. **Priority 3: Performance & Scale**
   - Load testing (10k+ req/s)
   - Memory pressure tests
   - Connection pool exhaustion
   - Cache stampede scenarios
   - Large dataset operations

3. **Priority 4: Production Hardening**
   - Chaos engineering
   - Disaster recovery drills
   - Multi-tenant isolation advanced tests
   - Compliance/security audits
   - Documentation completion

---

## 🤝 Contributing

When adding new Priority 1 tests:

1. Follow existing test structure
2. Use descriptive test names
3. Add console.log for progress tracking
4. Handle async operations properly
5. Clean up resources (beforeEach/afterEach)
6. Update this documentation
7. Ensure tests are deterministic (not flaky)

---

## 📞 Support

For issues or questions:
- Check existing test output for error messages
- Review common issues section above
- Check Redis/DB logs
- Verify environment configuration
- Review test implementation for examples

---

**Last Updated:** 2024
**Test Suite Version:** 1.0.0
**Status:** ✅ All Priority 1 Tests Implemented