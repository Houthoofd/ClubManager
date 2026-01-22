@echo off
chcp 65001 > nul
color 0A
title Auth Service - Test Suite Runner

:menu
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                   AUTH SERVICE - TEST SUITE                    ║
echo ║                    Platform API Testing                        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo  📋 Tests disponibles:
echo.
echo  ┌─────────────────────────────────────────────────────────────┐
echo  │  TESTS COMPLETS                                             │
echo  └─────────────────────────────────────────────────────────────┘
echo    1. 🚀 Tous les tests Auth (~125 tests)
echo    2. 📊 Tous les tests avec couverture
echo    3. 🔍 Mode watch (développement)
echo.
echo  ┌─────────────────────────────────────────────────────────────┐
echo  │  TESTS PAR COMPOSANT                                        │
echo  └─────────────────────────────────────────────────────────────┘
echo    4. 🔐 AuthService Core (~50 tests)
echo    5. 🛡️  Auth Middlewares (~35 tests)
echo    6. 🌐 Auth Routes (~40 tests)
echo.
echo  ┌─────────────────────────────────────────────────────────────┐
echo  │  TESTS PAR TYPE                                             │
echo  └─────────────────────────────────────────────────────────────┘
echo    7. 🧪 Tests unitaires (Service + Middleware)
echo    8. 🔗 Tests d'intégration (Routes)
echo.
echo  ┌─────────────────────────────────────────────────────────────┐
echo  │  OPTIONS AVANCÉES                                           │
echo  └─────────────────────────────────────────────────────────────┘
echo    9. 📈 Mode verbeux (détails complets)
echo    0. ❌ Quitter
echo.
echo ════════════════════════════════════════════════════════════════
set /p choice="  Choisissez une option (0-9): "
echo ════════════════════════════════════════════════════════════════
echo.

if "%choice%"=="1" goto all_tests
if "%choice%"=="2" goto coverage
if "%choice%"=="3" goto watch
if "%choice%"=="4" goto service
if "%choice%"=="5" goto middleware
if "%choice%"=="6" goto routes
if "%choice%"=="7" goto unit
if "%choice%"=="8" goto integration
if "%choice%"=="9" goto verbose
if "%choice%"=="0" goto end

echo ⚠️  Choix invalide. Veuillez réessayer.
timeout /t 2 > nul
goto menu

:all_tests
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║           Exécution de tous les tests Auth (~125 tests)       ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
call npm run test:auth
goto results

:coverage
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              Tests Auth avec couverture de code               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
call npm run test:auth:coverage
goto results

:watch
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                   Mode Watch activé (Ctrl+C pour quitter)     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
call npm run test:auth:watch
goto results

:service
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          AuthService Core Logic Tests (~50 tests)             ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo  🔐 Tests inclus:
echo    - Password hashing (bcrypt)
echo    - Password verification
echo    - Token generation (JWT)
echo    - Token verification
echo    - Login logic
echo    - Register logic
echo    - Security & edge cases
echo.
call npm run test:auth:service
goto results

:middleware
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║            Auth Middleware Tests (~35 tests)                   ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo  🛡️  Tests inclus:
echo    - generateToken
echo    - verifyToken
echo    - optionalAuth
echo    - requireRole
echo    - Integration tests
echo.
call npm run test:auth:middleware
goto results

:routes
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              Auth Routes Tests (~40 tests)                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo  🌐 Tests inclus:
echo    - POST /login (17 tests)
echo    - POST /register (23 tests)
echo    - Validation & error handling
echo    - Cookie management
echo    - Audit logging
echo.
call npm run test:auth:routes
goto results

:unit
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         Tests unitaires (Service + Middleware)                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
call npm run test:auth:unit
goto results

:integration
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              Tests d'intégration (Routes)                      ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
call npm run test:auth:integration
goto results

:verbose
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    Mode verbeux activé                         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
call npm run test:auth:verbose
goto results

:results
echo.
echo ════════════════════════════════════════════════════════════════
if errorlevel 1 (
    color 0C
    echo  ❌ Tests échoués! Voir les détails ci-dessus.
) else (
    color 0A
    echo  ✅ Tous les tests sont passés avec succès!
)
echo ════════════════════════════════════════════════════════════════
echo.
echo  📚 Documentation: docs/tests/AUTH_SERVICE_TESTS.md
echo.
pause
color 0A
goto menu

:end
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                     Au revoir! 👋                              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
timeout /t 1 > nul
exit
