@echo off
echo ================================================================================
echo   TESTS UNITAIRES MODULE PROFESSEURS (Sans connexion DB)
echo ================================================================================
echo.

cd /d "%~dp0"

echo 📋 Ces tests utilisent des mocks et ne necessitent PAS de connexion MySQL
echo.

echo 🧪 Lancement des tests unitaires...
echo.

set NODE_ENV=test
set NODE_OPTIONS=--experimental-vm-modules

npx jest --config jest.config.cjs ^
  src/routes/professeurs/__tests__/professeurs.schema.test.ts ^
  src/routes/professeurs/__tests__/professeurs.validators-advanced.test.ts ^
  src/routes/professeurs/__tests__/professeurs.service-branches.test.ts ^
  src/routes/professeurs/__tests__/professeurs.stats-advanced.test.ts ^
  src/routes/professeurs/__tests__/professeurs.performance.test.ts ^
  src/routes/professeurs/__tests__/professeurs.health-advanced.test.ts ^
  --verbose

echo.
echo ================================================================================
echo   RESUME : ~256 tests unitaires executes
echo ================================================================================
echo.

pause
