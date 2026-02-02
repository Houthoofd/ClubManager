@echo off
REM =====================================================
REM Script de recréation de la base de données ClubManager
REM Version Windows (Batch)
REM =====================================================
REM
REM Usage:
REM   recreate-db.bat [nom_base]
REM
REM Exemples:
REM   recreate-db.bat
REM   recreate-db.bat clubmanager_test
REM
REM =====================================================

setlocal enabledelayedexpansion

set MYSQL_BIN=C:\xampp\mysql\bin\mysql.exe
set SCRIPT_DIR=%~dp0
set SQL_FILE=%SCRIPT_DIR%recreate-database.sql
set DB_NAME=%1
if "%DB_NAME%"=="" set DB_NAME=clubmanager
set DB_USER=root
set DB_PASS=

echo.
echo ========================================
echo   Recréation de la base de données
echo ========================================
echo.

REM Vérifier que MySQL est démarré
echo [1/4] Vérification de MySQL...
"%MYSQL_BIN%" -u%DB_USER% -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] MySQL n'est pas démarré
    echo Veuillez démarrer MySQL via XAMPP Control Panel
    exit /b 1
)
echo [OK] MySQL est opérationnel
echo.

REM Vérifier que le fichier SQL existe
echo [2/4] Vérification du script SQL...
if not exist "%SQL_FILE%" (
    echo [ERREUR] Fichier SQL introuvable: %SQL_FILE%
    exit /b 1
)
echo [OK] Script SQL trouvé
echo.

REM Vérifier si la base existe déjà
echo [3/4] Vérification de la base existante...
for /f %%i in ('"%MYSQL_BIN%" -u%DB_USER% -sNe "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='%DB_NAME%';" 2^>nul') do set DB_EXISTS=%%i

if "%DB_EXISTS%"=="1" (
    echo [ATTENTION] La base '%DB_NAME%' existe déjà

    for /f %%i in ('"%MYSQL_BIN%" -u%DB_USER% -sNe "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='%DB_NAME%';" 2^>nul') do set TABLE_COUNT=%%i
    echo   - %TABLE_COUNT% tables présentes
    echo.

    set /p CONFIRM="Voulez-vous supprimer et recréer cette base? (o/N): "
    if /i not "!CONFIRM!"=="o" (
        echo [ANNULE] Opération annulée
        exit /b 0
    )
)
echo.

REM Exécuter le script SQL
echo [4/4] Création de la base de données...

if "%DB_NAME%"=="clubmanager" (
    REM Exécuter directement le fichier SQL
    "%MYSQL_BIN%" -u%DB_USER% < "%SQL_FILE%" 2>&1
) else (
    REM Adapter le nom de la base dans le SQL
    powershell -Command "(Get-Content '%SQL_FILE%') -replace 'clubmanager', '%DB_NAME%' | & '%MYSQL_BIN%' -u%DB_USER%" 2>&1
)

if errorlevel 1 (
    echo [ERREUR] Erreur lors de la création de la base
    exit /b 1
)

REM Vérifier le résultat
for /f %%i in ('"%MYSQL_BIN%" -u%DB_USER% -sNe "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='%DB_NAME%';" 2^>nul') do set FINAL_COUNT=%%i

echo.
echo [OK] Base '%DB_NAME%' créée avec succès!
echo   - %FINAL_COUNT% tables créées
echo.

REM Afficher les prochaines étapes
echo ========================================
echo   Prochaines étapes
echo ========================================
echo.

if "%DB_NAME%"=="clubmanager" (
    echo Pour créer la base de test:
    echo   recreate-db.bat clubmanager_test
    echo.
)

echo Pour vérifier la base:
echo   mysql -u root %DB_NAME% -e "SHOW TABLES;"
echo.

echo Pour lancer les tests:
echo   npm run test:confirmation:unit
echo.

echo [OK] Terminé!
echo.

endlocal
