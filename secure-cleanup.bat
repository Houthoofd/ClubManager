@echo off
chcp 65001 >nul
echo ================================================
echo    NETTOYAGE SECURISE DES FICHIERS .ENV
echo ================================================
echo.

echo Etat actuel detecte:
echo - api/.env.development (TRACKE)
echo - api/.env.production (TRACKE)
echo - front-end/.env.development (TRACKE)
echo - front-end/.env.production (TRACKE)
echo.

echo ⚠️ CES FICHIERS CONTIENNENT DES SECRETS SENSIBLES !
echo   - Cles API SendGrid
echo   - Mots de passe base de donnees
echo   - Secrets JWT
echo   - Cles Stripe
echo.

echo Options de nettoyage:
echo   1. Nettoyage simple (recommande pour commencer)
echo   2. Nettoyage complet avec historique
echo   3. Sauvegarder d'abord puis nettoyer
echo   4. Annuler
echo.
set /p choice="Votre choix (1/2/3/4): "

if "%choice%"=="1" goto :simple_cleanup
if "%choice%"=="2" goto :full_cleanup
if "%choice%"=="3" goto :backup_then_clean
if "%choice%"=="4" goto :cancel
goto :cancel

:backup_then_clean
echo.
echo === SAUVEGARDE PUIS NETTOYAGE ===
echo Creation d'une branche de sauvegarde...
git branch backup-env-files-$(date /t | tr -d '/')
git checkout backup-env-files-$(date /t | tr -d '/')
git add api/.env.development api/.env.production front-end/.env.development front-end/.env.production
git commit -m "🔒 Backup: Save .env files before removal"
git checkout back-up/hosting
echo ✅ Sauvegarde creee
goto :simple_cleanup

:simple_cleanup
echo.
echo === NETTOYAGE SIMPLE ET SECURISE ===
echo.

echo Etape 1: Suppression du tracking Git (fichiers gardes localement)...
git rm --cached api/.env.development
git rm --cached api/.env.production
git rm --cached front-end/.env.development
git rm --cached front-end/.env.production

echo.
echo Etape 2: Verification que les fichiers locaux existent toujours...
if exist "api\.env.development" (
    echo ✅ api\.env.development conserve localement
) else (
    echo ❌ ATTENTION: api\.env.development supprime !
)

if exist "api\.env.production" (
    echo ✅ api\.env.production conserve localement
) else (
    echo ❌ ATTENTION: api\.env.production supprime !
)

echo.
echo Etape 3: Ajout des fichiers de securite...
git add .gitignore
git add SECURITY.md
git add api/.gitignore

echo.
echo Etape 4: Commit des changements...
git commit -m "🔒 Security: Remove .env files from Git tracking

BREAKING CHANGE: Environment files removed from version control

- Remove api/.env.development and api/.env.production from tracking
- Remove front-end/.env.development and front-end/.env.production from tracking  
- Add comprehensive .gitignore for all environment files
- Add security documentation
- Protect sensitive API keys, database passwords, and secrets

Files are preserved locally but will no longer be tracked by Git.
Team members need to create their own .env files from .env.example templates."

echo ✅ Nettoyage simple termine
goto :verification

:full_cleanup
echo.
echo === NETTOYAGE COMPLET AVEC HISTORIQUE ===
echo ⚠️ ATTENTION: Ceci va reecrire l'historique Git !
echo.
set /p confirm="Confirmer le nettoyage complet ? (O/N): "
if /i not "%confirm%"=="O" goto :cancel

echo Creation d'une sauvegarde complete...
git branch backup-before-history-rewrite

echo Nettoyage simple d'abord...
git rm --cached api/.env.development 2>nul
git rm --cached api/.env.production 2>nul
git rm --cached front-end/.env.development 2>nul
git rm --cached front-end/.env.production 2>nul

git add .gitignore SECURITY.md api/.gitignore
git commit -m "🔒 Remove .env files from tracking before history cleanup"

echo.
echo Nettoyage de l'historique Git...
echo (Ceci peut prendre plusieurs minutes...)
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch api/.env.development api/.env.production front-end/.env.development front-end/.env.production" --prune-empty -- --all

echo Nettoyage des references...
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ✅ Nettoyage complet termine
echo 📦 Sauvegarde disponible: backup-before-history-rewrite
goto :verification

:cancel
echo Operation annulee par l'utilisateur
goto :end

:verification
echo.
echo ================================================
echo    VERIFICATION FINALE
echo ================================================
echo.

echo 1. Fichiers .env encore traces par Git:
git ls-files | findstr .env
if errorlevel 1 (
    echo ✅ Aucun fichier .env sensible tracke
) else (
    echo ⚠️ Certains fichiers .env sont encore present
)

echo.
echo 2. Fichiers .env locaux (doivent encore exister):
if exist "api\.env.development" (
    echo ✅ api\.env.development presente localement
) else (
    echo ❌ api\.env.development MANQUANTE !
)

if exist "api\.env.production" (
    echo ✅ api\.env.production presente localement  
) else (
    echo ❌ api\.env.production MANQUANTE !
)

echo.
echo 3. Test .gitignore:
echo "test_secret=123" > test.env
git add test.env 2>nul
git status --porcelain | findstr test.env >nul
if errorlevel 1 (
    echo ✅ .gitignore fonctionne (test.env ignore)
) else (
    echo ❌ .gitignore ne fonctionne pas !
)
del test.env 2>nul

:end
echo.
echo ================================================
echo    ACTIONS SUIVANTES
echo ================================================
echo.
echo 1. Verifiez vos fichiers .env locaux
echo 2. Testez votre application localement
echo.
if "%choice%"=="2" (
    echo 3. Poussez avec force (historique modifie):
    echo    git push origin back-up/hosting --force
) else (
    echo 3. Poussez normalement:
    echo    git push origin back-up/hosting
)
echo.
echo 4. Informez votre equipe du changement
echo 5. Creez des fichiers .env.example pour l'equipe
echo.

echo IMPORTANT: Vos secrets ne seront plus dans Git !
pause
