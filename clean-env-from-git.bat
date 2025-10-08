@echo off
chcp 65001 >nul
echo ================================================
echo    NETTOYAGE FICHIERS .ENV DE GIT
echo ================================================
echo.

echo ATTENTION: Cette operation va modifier l'historique Git !
echo Assurez-vous d'avoir une sauvegarde !
echo.
set /p confirm="Continuer ? (O/N): "
if /i not "%confirm%"=="O" (
    echo Operation annulee
    pause
    exit /b 0
)

echo.
echo Etape 1: Suppression des fichiers .env du tracking Git...

REM Supprimer du cache Git (garder localement)
git rm --cached api/.env 2>nul
git rm --cached api/.env.development 2>nul
git rm --cached api/.env.production 2>nul
git rm --cached api/.env.test 2>nul
git rm --cached front-end/.env 2>nul
git rm --cached front-end/.env.local 2>nul
git rm --cached front-end/.env.development 2>nul
git rm --cached front-end/.env.production 2>nul
git rm --cached .env 2>nul

echo.
echo Etape 2: Ajout du .gitignore...
git add .gitignore

echo.
echo Etape 3: Commit des changements...
git commit -m "🔒 Remove .env files from tracking and add to .gitignore

- Remove all .env files from Git tracking
- Add comprehensive .gitignore for environment files
- Protect sensitive API keys and credentials"

echo.
echo Etape 4: Nettoyage de l'historique avec filter-branch...
echo (Ceci peut prendre du temps...)

REM Nettoyer l'historique pour supprimer les .env
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch api/.env api/.env.development api/.env.production front-end/.env" --prune-empty --tag-name-filter cat -- --all

echo.
echo Etape 5: Nettoyage des references...
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo.
echo ================================================
echo    NETTOYAGE TERMINE !
echo ================================================
echo.
echo Verification finale:
git ls-files | findstr .env
if errorlevel 1 (
    echo ✅ Aucun fichier .env trouve dans Git
) else (
    echo ⚠️ Des fichiers .env sont encore present
)

echo.
echo IMPORTANT: Forcez le push pour mettre a jour le repository distant:
echo    git push origin --force --all
echo.
pause
