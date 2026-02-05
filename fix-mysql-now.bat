@echo off
REM Script de reinitialisation complete MySQL/MariaDB XAMPP
REM Resout l'erreur: Can't open and lock privilege tables: Incorrect file format 'db'
REM A executer en tant qu'Administrateur

echo ========================================================
echo   Reinitialisation Tables Systeme MySQL/MariaDB
echo ========================================================
echo.

REM Configuration
set XAMPP_PATH=C:\xampp
set MYSQL_DATA=%XAMPP_PATH%\mysql\data
set MYSQL_BIN=%XAMPP_PATH%\mysql\bin
set BACKUP_DIR=%XAMPP_PATH%\mysql\backup_system_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%

echo [1/8] Verification de l'installation...
if not exist "%XAMPP_PATH%" (
    echo ERREUR: XAMPP introuvable dans %XAMPP_PATH%
    pause
    exit /b 1
)
echo     OK - XAMPP detecte
echo.

echo [2/8] Arret complet de MySQL...
taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo     OK - MySQL arrete
echo.

echo [3/8] Sauvegarde des bases utilisateur...
if not exist "%XAMPP_PATH%\mysql\backup" mkdir "%XAMPP_PATH%\mysql\backup"
mkdir "%BACKUP_DIR%" >nul 2>&1

REM Sauvegarder clubmanager et clubmanager_test si elles existent
if exist "%MYSQL_DATA%\clubmanager" (
    xcopy "%MYSQL_DATA%\clubmanager" "%BACKUP_DIR%\clubmanager\" /E /I /Q >nul 2>&1
    echo     - clubmanager sauvegardee
)
if exist "%MYSQL_DATA%\clubmanager_test" (
    xcopy "%MYSQL_DATA%\clubmanager_test" "%BACKUP_DIR%\clubmanager_test\" /E /I /Q >nul 2>&1
    echo     - clubmanager_test sauvegardee
)
echo     OK - Sauvegarde creee: %BACKUP_DIR%
echo.

echo [4/8] Suppression des tables systeme corrompues...
if exist "%MYSQL_DATA%\mysql" (
    xcopy "%MYSQL_DATA%\mysql" "%BACKUP_DIR%\mysql_old\" /E /I /Q >nul 2>&1
    rmdir /S /Q "%MYSQL_DATA%\mysql" >nul 2>&1
    echo     - Dossier mysql systeme supprime
)
if exist "%MYSQL_DATA%\performance_schema" (
    rmdir /S /Q "%MYSQL_DATA%\performance_schema" >nul 2>&1
    echo     - Dossier performance_schema supprime
)
echo     OK - Tables systeme supprimees
echo.

echo [5/8] Nettoyage des fichiers InnoDB...
if exist "%MYSQL_DATA%\ibdata1" del /F /Q "%MYSQL_DATA%\ibdata1" >nul 2>&1
if exist "%MYSQL_DATA%\ib_logfile0" del /F /Q "%MYSQL_DATA%\ib_logfile0" >nul 2>&1
if exist "%MYSQL_DATA%\ib_logfile1" del /F /Q "%MYSQL_DATA%\ib_logfile1" >nul 2>&1
del /F /Q "%MYSQL_DATA%\*.pid" >nul 2>&1
del /F /Q "%MYSQL_DATA%\*.tmp" >nul 2>&1
echo     OK - Fichiers InnoDB nettoyes
echo.

echo [6/8] Reinitialisation de MySQL/MariaDB...
echo     Cela peut prendre 30-60 secondes...
echo.

REM Methode 1: mysql_install_db (recommande pour MariaDB)
if exist "%MYSQL_BIN%\mysql_install_db.exe" (
    echo     Utilisation de mysql_install_db...
    "%MYSQL_BIN%\mysql_install_db.exe" --datadir="%MYSQL_DATA%" --default-user >nul 2>&1
    if exist "%MYSQL_DATA%\mysql" (
        echo     OK - Tables systeme creees avec mysql_install_db
    ) else (
        echo     ATTENTION - mysql_install_db n'a pas cree les tables
    )
) else (
    echo     mysql_install_db.exe introuvable, utilisation de la methode bootstrap...
)

REM Methode 2: Bootstrap MySQL si necessaire
if not exist "%MYSQL_DATA%\mysql" (
    echo     Demarrage Bootstrap...
    start /MIN "" "%MYSQL_BIN%\mysqld.exe" --console --initialize-insecure
    timeout /t 10 /nobreak >nul
    taskkill /F /IM mysqld.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
)

if exist "%MYSQL_DATA%\mysql" (
    echo     OK - Tables systeme creees avec succes
) else (
    echo     ERREUR - Les tables systeme n'ont pas ete creees
    echo     Verifiez les logs dans %MYSQL_DATA%
    pause
    exit /b 1
)
echo.

echo [7/8] Test de demarrage MySQL...
start /MIN "" "%MYSQL_BIN%\mysqld.exe" --console
echo     Attente du demarrage...
timeout /t 8 /nobreak >nul

REM Verifier que MySQL tourne
tasklist | findstr mysqld >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo     OK - MySQL demarre avec succes

    REM Tester la connexion
    echo SELECT 'OK' AS status; | "%MYSQL_BIN%\mysql.exe" -u root --skip-password >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo     OK - Connexion MySQL fonctionnelle
    ) else (
        echo     ATTENTION - Connexion non testee
    )
) else (
    echo     ATTENTION - MySQL n'a pas demarre automatiquement
)
echo.

echo [8/8] Restauration des bases utilisateur...
if exist "%BACKUP_DIR%\clubmanager" (
    if not exist "%MYSQL_DATA%\clubmanager" (
        xcopy "%BACKUP_DIR%\clubmanager" "%MYSQL_DATA%\clubmanager\" /E /I /Q >nul 2>&1
        echo     - clubmanager restauree
    )
)
if exist "%BACKUP_DIR%\clubmanager_test" (
    if not exist "%MYSQL_DATA%\clubmanager_test" (
        xcopy "%BACKUP_DIR%\clubmanager_test" "%MYSQL_DATA%\clubmanager_test\" /E /I /Q >nul 2>&1
        echo     - clubmanager_test restauree
    )
)
echo     OK - Restauration terminee
echo.

REM Arreter MySQL pour permettre le controle via XAMPP
echo Arret de MySQL pour le controle XAMPP...
taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo     OK - MySQL arrete

echo.
echo ========================================================
echo   Reinitialisation terminee avec succes !
echo ========================================================
echo.
echo PROCHAINES ETAPES:
echo.
echo 1. Ouvrez le Panneau de Controle XAMPP
echo 2. Cliquez sur 'Start' pour MySQL
echo 3. MySQL devrait demarrer normalement maintenant
echo.
echo 4. Recreez la base de test si necessaire:
echo    mysql -u root -e "CREATE DATABASE clubmanager_test;"
echo.
echo 5. Lancez les tests:
echo    cd ClubManager
echo    npm run test:api -- messages
echo.
echo Sauvegarde disponible: %BACKUP_DIR%
echo.
echo IMPORTANT: Mot de passe root reinitialise (vide par defaut)
echo Pensez a securiser votre installation MySQL apres les tests
echo.
echo Script termine !
echo.
pause
