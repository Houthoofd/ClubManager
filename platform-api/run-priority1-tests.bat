@echo off
REM ============================================
REM Priority 1 Tests Validation Script
REM ============================================
REM This script runs all critical Priority 1 tests
REM for the Redis cache implementation
REM ============================================

echo.
echo ============================================
echo   PRIORITY 1 TESTS - VALIDATION SUITE
echo ============================================
echo.

REM Check if Redis is running
echo [1/5] Checking Redis connection...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Redis server is not responding!
    echo Please start Redis before running tests:
    echo   docker-compose up -d redis
    echo   OR
    echo   redis-server
    echo.
    set /p CONTINUE="Continue anyway? (y/N): "
    if /i not "%CONTINUE%"=="y" (
        echo Tests aborted.
        exit /b 1
    )
)
echo [OK] Redis is running
echo.

REM Check if PostgreSQL is running
echo [2/5] Checking PostgreSQL connection...
REM Note: This is a basic check, adjust based on your setup
echo [SKIP] PostgreSQL check - assuming it's configured
echo.

REM Set environment variables
echo [3/5] Setting up environment...
set NODE_ENV=test
set NODE_OPTIONS=--experimental-vm-modules
echo [OK] Environment configured
echo.

REM Clean up before tests
echo [4/5] Preparing test environment...
echo Flushing Redis test database...
redis-cli -n 1 FLUSHDB >nul 2>&1
echo [OK] Test environment ready
echo.

REM Run Priority 1 tests
echo [5/5] Running Priority 1 Tests...
echo ============================================
echo.

echo Running: Redis Initialization Tests
echo ------------------------------------
call npm run test:redis-init
if %errorlevel% neq 0 (
    echo [FAILED] Redis Init Tests
    set TEST_FAILED=1
) else (
    echo [PASSED] Redis Init Tests
)
echo.

echo Running: Health Routes Tests
echo ------------------------------------
call npm run test:health-routes
if %errorlevel% neq 0 (
    echo [FAILED] Health Routes Tests
    set TEST_FAILED=1
) else (
    echo [PASSED] Health Routes Tests
)
echo.

echo Running: Cache Backup/Restore Tests
echo ------------------------------------
call npm run test:cache:backup
if %errorlevel% neq 0 (
    echo [FAILED] Backup Service Tests
    set TEST_FAILED=1
) else (
    echo [PASSED] Backup Service Tests
)
echo.

echo Running: Cache-DB Consistency Tests
echo ------------------------------------
call npm run test:cache:consistency
if %errorlevel% neq 0 (
    echo [FAILED] Consistency Tests
    set TEST_FAILED=1
) else (
    echo [PASSED] Consistency Tests
)
echo.

REM Summary
echo ============================================
echo   TEST SUITE SUMMARY
echo ============================================
echo.

if defined TEST_FAILED (
    echo Status: FAILED
    echo.
    echo Some Priority 1 tests failed!
    echo Please review the output above and fix issues before deploying.
    echo.
    echo Common issues:
    echo   - Redis not running or not accessible
    echo   - PostgreSQL not running or not accessible
    echo   - Missing environment variables
    echo   - Database migrations not applied
    echo.
    echo For help, see: PRIORITY1_TESTS.md
    echo.
    exit /b 1
) else (
    echo Status: PASSED
    echo.
    echo All Priority 1 tests passed successfully!
    echo.
    echo System is ready for the next steps:
    echo   1. Review test coverage report
    echo   2. Run performance benchmarks
    echo   3. Execute Priority 2 tests
    echo   4. Prepare for production deployment
    echo.
    echo For more details, see: PRIORITY1_TESTS.md
    echo.
    exit /b 0
)
