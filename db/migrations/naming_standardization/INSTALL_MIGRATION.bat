@echo off
REM ============================================================================
REM SCRIPT D'INSTALLATION AUTOMATIQUE - MIGRATION FR → EN
REM ============================================================================
REM Description: Automatise la migration complète de la base de données
REM Usage: INSTALL_MIGRATION.bat
REM Prérequis: MySQL et Node.js installés
REM ============================================================================

echo.
echo ========================================================================
echo   MIGRATION FR → EN - STANDARDISATION BASE DE DONNÉES
echo ========================================================================
echo.

REM Couleurs et symboles
set "CHECK=✓"
set "CROSS=✗"
set "ARROW=→"

REM Configuration
set DB_NAME=clubmanager_test
set DB_USER=root
set DB_PASS=

REM Chemins
set SCRIPT_DIR=%~dp0
set BACKUP_DIR=%SCRIPT_DIR%backups
set SQL_DIR=%SCRIPT_DIR%
set BACKUP_FILE=%BACKUP_DIR%\backup_pre_migration_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%

REM Vérifier que MySQL est accessible
echo [1/6] Vérification MySQL...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %CROSS% MySQL introuvable dans PATH!
    echo.
    echo Solutions:
    echo   - Ajouter MySQL à votre PATH
    echo   - Ou utiliser: C:\laragon\bin\mysql\mysql-X.X\bin\mysql.exe
    echo.
    pause
    exit /b 1
)
echo %CHECK% MySQL trouvé
echo.

REM Vérifier que Node.js est accessible
echo [2/6] Vérification Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %CROSS% Node.js introuvable!
    echo.
    echo Installation: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo %CHECK% Node.js trouvé
echo.

REM Créer le dossier de backup
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

REM ÉTAPE 1: BACKUP DE LA BASE DE DONNÉES
echo [3/6] Création du backup de sécurité...
echo Fichier: %BACKUP_FILE%
echo.

mysqldump -u %DB_USER% %DB_NAME% > "%BACKUP_FILE%" 2>nul
if %errorlevel% neq 0 (
    echo %CROSS% ERREUR lors du backup!
    echo.
    echo Vérifiez:
    echo   - Que MySQL est démarré
    echo   - Que la base "%DB_NAME%" existe
    echo   - Vos identifiants MySQL
    echo.
    pause
    exit /b 1
)

echo %CHECK% Backup créé avec succès!
echo Taille:
for %%A in ("%BACKUP_FILE%") do echo   %%~zA bytes
echo.

REM Demander confirmation
echo ========================================================================
echo   ATTENTION - MIGRATION MAJEURE
echo ========================================================================
echo.
echo Cette migration va:
echo   %ARROW% Renommer 30+ tables de FR vers EN
echo   %ARROW% Créer des vues de compatibilité
echo   %ARROW% Mettre à jour schema.prisma
echo.
echo Backup créé: %BACKUP_FILE%
echo.
set /p CONFIRM="Continuer la migration? (O/N): "
if /i not "%CONFIRM%"=="O" if /i not "%CONFIRM%"=="Oui" (
    echo.
    echo Migration annulée par l'utilisateur.
    echo Le backup est conservé dans: %BACKUP_DIR%
    pause
    exit /b 0
)

echo.

REM ÉTAPE 2: MIGRATION SQL
echo [4/6] Exécution de la migration SQL...
echo.

mysql -u %DB_USER% %DB_NAME% < "%SQL_DIR%01_rename_tables_fr_to_en.sql"
if %errorlevel% neq 0 (
    echo %CROSS% ERREUR lors de la migration SQL!
    echo.
    echo %ARROW% Restauration automatique du backup...
    mysql -u %DB_USER% %DB_NAME% < "%BACKUP_FILE%"
    echo %CHECK% Base de données restaurée
    echo.
    pause
    exit /b 1
)

echo %CHECK% Migration SQL terminée avec succès!
echo.

REM ÉTAPE 3: MISE À JOUR SCHEMA.PRISMA
echo [5/6] Mise à jour de schema.prisma...
echo.

cd /d "%SCRIPT_DIR%..\..\..\"
node "%SQL_DIR%04_update_prisma_schema.js"
if %errorlevel% neq 0 (
    echo %CROSS% ERREUR lors de la mise à jour du schema!
    echo.
    echo %ARROW% La base est migrée mais schema.prisma nécessite une correction manuelle
    echo.
    pause
    exit /b 1
)

echo %CHECK% Schema.prisma mis à jour!
echo.

REM ÉTAPE 4: GÉNÉRATION PRISMA CLIENT
echo [6/6] Génération du Prisma Client...
echo.

cd api
call npx prisma generate
if %errorlevel% neq 0 (
    echo %CROSS% ERREUR lors de la génération Prisma!
    echo.
    echo Exécutez manuellement:
    echo   cd api
    echo   npx prisma generate
    echo.
    pause
    exit /b 1
)

echo %CHECK% Prisma Client généré!
echo.

REM RÉSUMÉ FINAL
echo.
echo ========================================================================
echo   MIGRATION TERMINÉE AVEC SUCCÈS!
echo ========================================================================
echo.
echo %CHECK% Base de données migrée (30+ tables renommées)
echo %CHECK% Vues de compatibilité créées
echo %CHECK% Schema.prisma mis à jour
echo %CHECK% Prisma Client régénéré
echo %CHECK% Backup sauvegardé: %BACKUP_FILE%
echo.
echo ========================================================================
echo   PROCHAINES ÉTAPES
echo ========================================================================
echo.
echo 1. %ARROW% Redémarrer votre application
echo    cd api ^&^& npm run dev
echo.
echo 2. %ARROW% Tester toutes les fonctionnalités
echo    L'application fonctionne grâce aux vues de compatibilité
echo.
echo 3. %ARROW% Migrer progressivement le code applicatif
echo    Remplacer: prisma.articles par prisma.shopArticles
echo    Remplacer: prisma.commandes par prisma.orders
echo    etc.
echo.
echo 4. %ARROW% Une fois le code 100%% migré (dans quelques semaines):
echo    Exécuter: 03_remove_compatibility_views.sql
echo.
echo ========================================================================
echo   ROLLBACK (si problème)
echo ========================================================================
echo.
echo En cas de problème, restaurez le backup:
echo   mysql -u root clubmanager_test ^< "%BACKUP_FILE%"
echo.
echo Ou exécutez le script de rollback:
echo   mysql -u root clubmanager_test ^< 02_rollback_rename_tables.sql
echo.
echo ========================================================================
echo.
echo 📚 Documentation complète: README_MIGRATION.txt
echo.

pause
exit /b 0
