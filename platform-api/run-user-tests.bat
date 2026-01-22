@echo off
REM ============================================================================
REM User Service Test Suite Runner - Windows Batch Script
REM
REM Executes all User Service tests in a structured manner
REM Part of Platform API Test Suite - Phase 1 (Services Critiques)
REM ============================================================================

SETLOCAL EnableDelayedExpansion

echo.
echo ============================================================
echo    User Service Test Suite Runner
echo    Phase 1: Services Critiques - User Management
echo ============================================================
echo.

REM Set environment variables
set NODE_ENV=test
set NODE_OPTIONS=--experimental-vm-modules

REM Colors for output (using echo)
set SUCCESS=[92m
set ERROR=[91m
set INFO=[94m
set WARNING=[93m
set RESET=[0m

REM Test counters
set TOTAL_TESTS=0
set PASSED_TESTS=0
set FAILED_TESTS=0

echo.
echo %INFO%[INFO]%RESET% Environment: NODE_ENV=%NODE_ENV%
echo %INFO%[INFO]%RESET% Node Options: %NODE_OPTIONS%
echo.

REM ============================================================================
REM Menu Selection
REM ============================================================================

echo Choose test suite to run:
echo.
echo 1. All User Service Tests (~120 tests, ~30s)
echo 2. Unit Tests Only (UserService + UserManagerService, ~105 tests)
echo 3. Integration Tests Only (Routes, ~65 tests)
echo 4. UserService Tests Only (~55 tests)
echo 5. UserManagerService Tests Only (~50 tests)
echo 6. User Routes Tests Only (~65 tests)
echo 7. Coverage Report (all tests)
echo 8. Watch Mode (development)
echo 9. Verbose Output (all tests)
echo 0. Exit
echo.

set /p CHOICE="Enter your choice (0-9): "

if "%CHOICE%"=="0" goto :EXIT
if "%CHOICE%"=="1" goto :ALL_TESTS
if "%CHOICE%"=="2" goto :UNIT_TESTS
if "%CHOICE%"=="3" goto :INTEGRATION_TESTS
if "%CHOICE%"=="4" goto :USER_SERVICE
if "%CHOICE%"=="5" goto :USER_MANAGER
if "%CHOICE%"=="6" goto :USER_ROUTES
if "%CHOICE%"=="7" goto :COVERAGE
if "%CHOICE%"=="8" goto :WATCH
if "%CHOICE%"=="9" goto :VERBOSE

echo %ERROR%[ERROR]%RESET% Invalid choice. Please select 0-9.
goto :EXIT

REM ============================================================================
REM Test Execution Functions
REM ============================================================================

:ALL_TESTS
echo.
echo %INFO%[RUNNING]%RESET% All User Service Tests...
echo ============================================================
echo.
call npm run test:user
if %ERRORLEVEL% EQU 0 (
    echo.
    echo %SUCCESS%[SUCCESS]%RESET% All tests passed!
) else (
    echo.
    echo %ERROR%[FAILED]%RESET% Some tests failed. Exit code: %ERRORLEVEL%
)
goto :SUMMARY

:UNIT_TESTS
echo.
echo %INFO%[RUNNING]%RESET% Unit Tests (Services)...
echo ============================================================
echo.
call npm run test:user:unit
if %ERRORLEVEL% EQU 0 (
    echo.
    echo %SUCCESS%[SUCCESS]%RESET% All unit tests passed!
) else (
    echo.
    echo %ERROR%[FAILED]%RESET% Some unit tests failed. Exit code: %ERRORLEVEL%
)
goto :SUMMARY

:INTEGRATION_TESTS
echo.
echo %INFO%[RUNNING]%RESET% Integration Tests (Routes)...
echo ============================================================
echo.
call npm run test:user:integration
if %ERRORLEVEL% EQU 0 (
    echo.
    echo %SUCCESS%[SUCCESS]%RESET% All integration tests passed!
) else (
    echo.
    echo %ERROR%[FAILED]%RESET% Some integration tests failed. Exit code: %ERRORLEVEL%
)
goto :SUMMARY

:USER_SERVICE
echo.
echo %INFO%[RUNNING]%RESET% UserService Tests (~55 tests)...
echo ============================================================
echo.
call npm run test:user-service
if %ERRORLEVEL% EQU 0 (
    echo.
    echo %SUCCESS%[SUCCESS]%RESET% UserService tests passed!
) else (
    echo.
    echo %ERROR%[FAILED]%RESET% UserService tests failed. Exit code: %ERRORLEVEL%
)
goto :SUMMARY

:USER_MANAGER
echo.
echo %INFO%[RUNNING]%RESET% UserManagerService Tests (~50 tests)...
echo ============================================================
echo.
call npm run test:user-manager
if %ERRORLEVEL% EQU 0 (
    echo.
    echo %SUCCESS%[SUCCESS]%RESET% UserManagerService tests passed!
) else (
    echo.
    echo %ERROR%[FAILED]%RESET% UserManagerService tests failed. Exit code: %ERRORLEVEL%
)
goto :SUMMARY

:USER_ROUTES
echo.
echo %INFO%[RUNNING]%RESET% User Routes Tests (~65 tests)...
echo ============================================================
echo.
call npm run test:user-routes
if %ERRORLEVEL% EQU 0 (
    echo.
    echo %SUCCESS%[SUCCESS]%RESET% User routes tests passed!
) else (
    echo.
    echo %ERROR%[FAILED]%RESET% User routes tests failed. Exit code: %ERRORLEVEL%
)
goto :SUMMARY

:COVERAGE
echo.
echo %INFO%[RUNNING]%RESET% User Service Tests with Coverage Report...
echo ============================================================
echo.
call npm run test:user:coverage
if %ERRORLEVEL% EQU 0 (
    echo.
    echo %SUCCESS%[SUCCESS]%RESET% Tests passed! Coverage report generated.
    echo.
    echo %INFO%[INFO]%RESET% Coverage report location: coverage/lcov-report/index.html
) else (
    echo.
    echo %ERROR%[FAILED]%RESET% Some tests failed. Exit code: %ERRORLEVEL%
)
goto :SUMMARY

:WATCH
echo.
echo %INFO%[RUNNING]%RESET% User Service Tests in Watch Mode...
echo ============================================================
echo.
echo %WARNING%[NOTE]%RESET% Press 'q' to quit watch mode
echo.
call npm run test:user:watch
goto :SUMMARY

:VERBOSE
echo.
echo %INFO%[RUNNING]%RESET% User Service Tests (Verbose Output)...
echo ============================================================
echo.
call npm run test:user:verbose
if %ERRORLEVEL% EQU 0 (
    echo.
    echo %SUCCESS%[SUCCESS]%RESET% All tests passed!
) else (
    echo.
    echo %ERROR%[FAILED]%RESET% Some tests failed. Exit code: %ERRORLEVEL%
)
goto :SUMMARY

REM ============================================================================
REM Summary and Exit
REM ============================================================================

:SUMMARY
echo.
echo ============================================================
echo    Test Execution Complete
echo ============================================================
echo.
echo %INFO%[INFO]%RESET% Test Files:
echo   - user.service.test.ts (55 tests)
echo   - user-manager.service.test.ts (50 tests)
echo   - management.routes.test.ts (65 tests)
echo.
echo %INFO%[INFO]%RESET% Documentation: USER_SERVICE_TESTS.md
echo.

if %ERRORLEVEL% EQU 0 (
    echo %SUCCESS%[RESULT]%RESET% All tests completed successfully!
) else (
    echo %ERROR%[RESULT]%RESET% Some tests failed. Review output above.
    echo.
    echo %WARNING%[TIP]%RESET% Run with verbose flag for more details:
    echo   npm run test:user:verbose
)

echo.
pause
goto :EOF

:EXIT
echo.
echo %INFO%[INFO]%RESET% Exiting...
echo.
goto :EOF

ENDLOCAL
