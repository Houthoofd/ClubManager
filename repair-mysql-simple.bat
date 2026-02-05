@echo off
REM Script de réparation MySQL XAMPP - Version Simple
REM Pour résoudre les fichiers corrompus

echo ================================================
echo   Reparation MySQL XAMPP - Fichiers corrompus
echo ================================================
echo.

REM Configuration
set XAMPP_PATH=C:\xampp
set MYSQL_DATA=%XAMPP_PATH%\mysql\data
set BACKUP_DIR=%XAMPP_PATH%\mysql\backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%

echo [1/6] Arret de MySQL...
taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo     OK - MySQL arrete

echo.
echo [2/6] Creation de la sauvegarde...
if not exist "%XAMPP_PATH%\mysql\backup" mkdir "%XAMPP_PATH%\mysql\backup"
mkdir "%BACKUP_DIR%" >nul 2>&1

REM Sauvegarder les bases importantes
if exist "%MYSQL_DATA%\clubmanager" xcopy "%MYSQL_DATA%\clubmanager" "%BACKUP_DIR%\clubmanager\" /E /I /Q >nul 2>&1
if exist "%MYSQL_DATA%\clubmanager_test" xcopy "%MYSQL_DATA%\clubmanager_test" "%BACKUP_DIR%\clubmanager_test\" /E /I /Q >nul 2>&1

echo     OK - Sauvegarde creee dans: %BACKUP_DIR%

echo.
echo [3/6] Suppression des fichiers corrompus...

REM Supprimer les fichiers InnoDB corrompus
if exist "%MYSQL_DATA%\ibdata1" (
    del /F /Q "%MYSQL_DATA%\ibdata1" >nul 2>&1
    echo     - ibdata1 supprime
)

if exist "%MYSQL_DATA%\ib_logfile0" (
    del /F /Q "%MYSQL_DATA%\ib_logfile0" >nul 2>&1
    echo     - ib_logfile0 supprime
)

if exist "%MYSQL_DATA%\ib_logfile1" (
    del /F /Q "%MYSQL_DATA%\ib_logfile1" >nul 2>&1
    echo     - ib_logfile1 supprime
)

REM Supprimer les fichiers PID
del /F /Q "%MYSQL_DATA%\*.pid" >nul 2>&1

REM Supprimer les fichiers temporaires
del /F /Q "%MYSQL_DATA%\*.tmp" >nul 2>&1

echo     OK - Fichiers corrompus supprimes

echo.
echo [4/6] Nettoyage des logs volumineux...
for %%F in ("%MYSQL_DATA%\*.err") do (
    if %%~zF GTR 52428800 (
        echo. > "%%F"
        echo     - Log nettoye: %%~nxF
    )
)
echo     OK - Logs nettoyes

echo.
echo [5/6] Regeneration des fichiers InnoDB...
echo     Demarrage temporaire de MySQL...

start /MIN "" "%XAMPP_PATH%\mysql\bin\mysqld.exe" --console
timeout /t 5 /nobreak >nul

taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 2 /nobreak >nul

if exist "%MYSQL_DATA%\ibdata1" (
    echo     OK - Fichiers InnoDB regeneres
) else (
    echo     ATTENTION - Verifiez les logs si MySQL ne demarre pas
)

echo.
echo [6/6] Verification finale...
if exist "%XAMPP_PATH%\mysql\bin\my.ini" (
    echo     OK - Configuration presente
) else (
    echo     ATTENTION - Fichier my.ini manquant
)

echo.
echo ================================================
echo   Reparation terminee !
echo ================================================
echo.
echo Prochaines etapes :
echo   1. Ouvrez le panneau de controle XAMPP
echo   2. Cliquez sur "Start" pour MySQL
echo   3. Verifiez que MySQL demarre correctement
echo.
echo Si MySQL demarre :
echo   - Recreez vos bases de donnees si necessaire
echo   - Restaurez depuis : %BACKUP_DIR%
echo.
echo Si MySQL ne demarre toujours pas :
echo   - Verifiez les logs dans : %MYSQL_DATA%
echo   - Fichier log principal : mysql_error.log
echo   - Executez : %XAMPP_PATH%\mysql\bin\mysqld.exe --console
echo.

REM Proposer de recréer la base de test
echo Voulez-vous recreer la base clubmanager_test maintenant ? (O/N)
set /p RESPONSE=

if /I "%RESPONSE%"=="O" (
    echo.
    echo Creation de la base de donnees de test...

    REM Démarrer MySQL
    start /MIN "" "%XAMPP_PATH%\mysql_start.bat"
    echo     Attente du demarrage de MySQL...
    timeout /t 8 /nobreak >nul

    REM Créer la base
    echo CREATE DATABASE IF NOT EXISTS clubmanager_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; | "%XAMPP_PATH%\mysql\bin\mysql.exe" -u root

    if %ERRORLEVEL% EQU 0 (
        echo     OK - Base clubmanager_test creee
        echo.
        echo Pour executer les tests :
        echo   cd ClubManager
        echo   npm run test:api -- messages
    ) else (
        echo     ERREUR - Impossible de creer la base
        echo     Verifiez que MySQL est demarre
    )
)

echo.
echo Script termine !
echo.
pause
