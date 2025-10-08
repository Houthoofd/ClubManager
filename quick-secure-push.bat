@echo off
chcp 65001 >nul
echo ================================================
echo    CREATION ET PUSH RAPIDE BRANCHE SECURISEE
echo ================================================
echo.

echo ⚠️ ATTENTION: Cette operation va:
echo 1. Creer une nouvelle branche securisee
echo 2. Supprimer les .env du tracking Git
echo 3. Ajouter .gitignore et fichiers exemple
echo 4. Pusher vers GitHub
echo.
echo Vos fichiers .env locaux seront preserves !
echo.

set /p confirm="Continuer ? (O/N): "
if /i not "%confirm%"=="O" (
    echo Operation annulee
    exit /b 0
)

echo.
echo === CREATION BRANCHE SECURISEE ===
set BRANCH_NAME=security/clean-env-files-%date:~6,4%%date:~3,2%%date:~0,2%
git checkout -b %BRANCH_NAME%

echo.
echo === NETTOYAGE FICHIERS .ENV ===
git rm --cached api/.env.development 2>nul
git rm --cached api/.env.production 2>nul
git rm --cached front-end/.env.development 2>nul
git rm --cached front-end/.env.production 2>nul

echo.
echo === AJOUT FICHIERS SECURITE ===
git add .gitignore
git add SECURITY.md 2>nul
git add clean-env-from-git.bat
git add create-clean-branch.bat
git add push-clean-branch.bat
git add quick-secure-push.bat

echo.
echo === COMMIT ===
git commit -m "🔒 Security: Remove sensitive .env files from Git tracking

SECURITY UPDATE: Environment files removed from version control

✅ Changes:
- Remove api/.env.development and api/.env.production from tracking
- Remove front-end/.env.development and front-end/.env.production  
- Add comprehensive .gitignore for environment files
- Add security scripts for team
- Protect sensitive credentials and API keys

✅ Local files preserved:
- Your .env files remain on your local machine
- Application continues to work normally

⚠️ Breaking change for team:
- Team members need to create their own .env files
- Use .env.example templates (to be added)

🔐 Security improved:
- No more accidental credential commits
- API keys and secrets protected
- Clean Git history going forward"

echo.
echo === PUSH VERS GITHUB ===
git push origin %BRANCH_NAME%

if errorlevel 1 (
    echo ❌ Erreur push
    pause
    exit /b 1
)

echo.
echo ================================================
echo    ✅ BRANCHE SECURISEE CREEE ET POUSSEE !
echo ================================================
echo.
echo Branche: %BRANCH_NAME%
echo.
echo 📋 Prochaines etapes:
echo 1. ✅ Branche securisee sur GitHub
echo 2. 🔍 Verifiez sur GitHub que les .env ne sont plus visibles
echo 3. 🔄 Creez une Pull Request
echo 4. ✅ Fusionnez la branche
echo 5. 🗑️ Supprimez l'ancienne branche avec .env
echo.
echo 💡 Conseil: Creez des fichiers .env.example pour l'equipe
echo.
pause
