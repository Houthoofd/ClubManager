# Quick Start Guide - Priority 1 Tests

## 🚀 5-Minute Quick Start

This guide gets you running Priority 1 tests in 5 minutes.

---

## Prerequisites Check (2 minutes)

### 1. Redis Running?
```bash
redis-cli ping
```
**Expected:** `PONG`

**If not running:**
```bash
docker-compose up -d redis
```

### 2. PostgreSQL Running?
```bash
docker ps | grep postgres
```

**If not running:**
```bash
docker-compose up -d postgres
```

### 3. Dependencies Installed?
```bash
npm install
```

### 4. Database Migrated?
```bash
npx prisma migrate dev
```

---

## Run Tests (3 minutes)

### Option 1: All Priority 1 Tests
```bash
npm run test:priority1
```

### Option 2: Windows Batch Script
```bash
.\run-priority1-tests.bat
```

### Option 3: Individual Tests
```bash
# Redis initialization (40+ tests, ~30s)
npm run test:redis-init

# Health routes (50+ tests, ~45s)
npm run test:health-routes

# Backup/restore (40+ tests, ~40s)
npm run test:cache:backup

# Cache-DB consistency (25+ tests, ~35s)
npm run test:cache:consistency
```

---

## Expected Results

### Success Looks Like:
```
✓ All tests passing (155+)
✓ No failures
✓ No errors
✓ Total time: ~2 minutes
```

### Output Example:
```
Test Suites: 4 passed, 4 total
Tests:       155 passed, 155 total
Snapshots:   0 total
Time:        120.5s
```

---

## With Coverage Report

```bash
npm run test:priority1 -- --coverage
```

**Review coverage:**
1. Open `coverage/lcov-report/index.html` in browser
2. Verify coverage > 90% for:
   - redis-init.ts
   - health.routes.ts
   - backup.service.ts
   - cache consistency

---

## Troubleshooting (Quick Fixes)

### ❌ Redis Connection Error
```bash
# Check Redis
redis-cli ping

# Restart Redis
docker-compose restart redis
```

### ❌ Database Connection Error
```bash
# Check PostgreSQL
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres

# Reapply migrations
npx prisma migrate dev
```

### ❌ Tests Timeout
Edit `jest.config.cjs`:
```js
testTimeout: 30000  // Increase to 30 seconds
```

### ❌ Port Already in Use
```bash
# Find process using port 6379 (Redis)
netstat -ano | findstr :6379

# Kill process
taskkill /PID <PID> /F
```

---

## Environment Variables

Create `.env.test` if needed:
```env
NODE_ENV=test
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
```

---

## Quick Validation Checklist

Before marking tests as complete:

- [ ] All 4 test suites run successfully
- [ ] 155+ tests pass (0 failures)
- [ ] Coverage report shows >90%
- [ ] No timeout errors
- [ ] No connection errors
- [ ] Tests complete in <3 minutes

---

## What Each Test Suite Does

### 1. Redis Init Tests (`test:redis-init`)
Tests Redis connection startup, health checks, and shutdown handlers.
**Run time:** ~30 seconds

### 2. Health Routes Tests (`test:health-routes`)
Tests all `/health/*` endpoints including cache and database health.
**Run time:** ~45 seconds

### 3. Backup/Restore Tests (`test:cache:backup`)
Tests cache backup, restore, warmup, and verification operations.
**Run time:** ~40 seconds

### 4. Consistency Tests (`test:cache:consistency`)
Tests data consistency between Redis cache and PostgreSQL database.
**Run time:** ~35 seconds

---

## Next Steps After Tests Pass

1. **Review Coverage**
   ```bash
   npm run test:priority1 -- --coverage
   # Open coverage/lcov-report/index.html
   ```

2. **Run Stability Tests**
   ```bash
   # Run tests 10 times to check for flakiness
   for /L %i in (1,1,10) do npm run test:priority1
   ```

3. **Review Documentation**
   - [PRIORITY1_TESTS.md](./PRIORITY1_TESTS.md) - Complete documentation
   - [PRIORITY1_VALIDATION.md](./PRIORITY1_VALIDATION.md) - Validation checklist
   - [PRIORITY1_IMPLEMENTATION_SUMMARY.md](../PRIORITY1_IMPLEMENTATION_SUMMARY.md) - Implementation summary

4. **CI/CD Integration** (Optional)
   - See `PRIORITY1_TESTS.md` for GitHub Actions example
   - Configure for your CI/CD platform

5. **Move to Priority 2**
   - Advanced monitoring tests
   - Cluster mode tests
   - Performance benchmarks
   - Load testing

---

## Common Commands Reference

```bash
# Run all Priority 1 tests
npm run test:priority1

# Run with verbose output
npm run test:priority1:verbose

# Run with coverage
npm run test:priority1 -- --coverage

# Run individual test suite
npm run test:redis-init
npm run test:health-routes
npm run test:cache:backup
npm run test:cache:consistency

# Run in watch mode
npm run test:priority1 -- --watch

# Run and bail on first failure
npm run test:priority1 -- --bail

# Clear cache and run
npm run test:priority1 -- --clearCache
```

---

## File Locations

```
platform-api/
├── src/
│   ├── utils/__tests__/
│   │   └── redis-init.test.ts          # Redis init tests
│   ├── routes/__tests__/
│   │   └── health.routes.test.ts       # Health routes tests
│   └── cache/
│       ├── backup.service.ts           # Backup service (production)
│       └── __tests__/
│           ├── services/
│           │   └── backup.service.test.ts        # Backup tests
│           └── integration/
│               └── cache-db-consistency.test.ts  # Consistency tests
├── PRIORITY1_TESTS.md              # Complete documentation
├── PRIORITY1_VALIDATION.md         # Validation checklist
├── QUICKSTART_PRIORITY1.md         # This file
└── run-priority1-tests.bat         # Windows test runner
```

---

## Success Indicators

✅ **All tests pass**
```
Test Suites: 4 passed, 4 total
Tests:       155 passed, 155 total
```

✅ **Good coverage**
```
Statements   : 92% ( 200/217 )
Branches     : 88% ( 150/170 )
Functions    : 95% ( 90/95 )
Lines        : 93% ( 195/210 )
```

✅ **Fast execution**
```
Time:        ~120 seconds (2 minutes)
```

✅ **No errors**
```
No console errors
No unhandled rejections
No timeout errors
```

---

## Support & Help

**Quick answers:**
1. Check [PRIORITY1_VALIDATION.md](./PRIORITY1_VALIDATION.md) Troubleshooting section
2. Review test output for specific error messages
3. Verify Redis and PostgreSQL are running
4. Check environment variables

**Detailed documentation:**
- [PRIORITY1_TESTS.md](./PRIORITY1_TESTS.md) - Full test documentation
- [PRIORITY1_VALIDATION.md](./PRIORITY1_VALIDATION.md) - Validation guide
- [PRIORITY1_IMPLEMENTATION_SUMMARY.md](../PRIORITY1_IMPLEMENTATION_SUMMARY.md) - Implementation details

---

## TL;DR

```bash
# 1. Start services
docker-compose up -d redis postgres

# 2. Run migrations
npx prisma migrate dev

# 3. Run tests
npm run test:priority1

# 4. Check results
# Expected: 155+ tests pass, 0 failures

# Done! ✅
```

---

**That's it! You're ready to run Priority 1 tests.**

If all tests pass, proceed to [PRIORITY1_VALIDATION.md](./PRIORITY1_VALIDATION.md) for complete validation.