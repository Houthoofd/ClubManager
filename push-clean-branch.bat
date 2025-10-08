@echo off
chcp 65001 >nul
echo ================================================
echo    PUSH BRANCHE SECURISEE VERS GITHUB
echo ================================================
echo.

echo Verification de la branche actuelle...
git branch --show-current

echo.
echo Status Git:
git status --short

echo.
echo Fichiers .env encore trackes par Git:
git ls-files | findstr .env
if errorlevel 1 (
    echo ✅ Aucun fichier .env tracke - SECURISE !
) else (
    echo ❌ ATTENTION: Des fichiers .env sont encore trackes !
    echo Executez d'abord: create-clean-branch.bat
    pause
    exit /b 1
)

echo.
echo Verification que vos fichiers .env locaux existent:
if exist "api\.env.development" (
    echo ✅ api\.env.development presente
) else (
    echo ⚠️ api\.env.development manquante
)

if exist "api\.env.production" (
    echo ✅ api\.env.production presente
) else (
    echo ⚠️ api\.env.production manquante
)

echo.
echo ================================================
echo    PUSH VERS GITHUB
echo ================================================
echo.

set /p confirm="Pusher la branche securisee ? (O/N): "
if /i not "%confirm%"=="O" (
    echo Push annule
    goto :end
)

echo Push en cours...
git push origin HEAD

if errorlevel 1 (
    echo ❌ Erreur lors du push
    pause
    exit /b 1
)

echo.
echo ✅ Branche poussee avec succes !
echo.
echo Prochaines etapes:
echo 1. Allez sur GitHub
echo 2. Creez une Pull Request depuis votre branche
echo 3. Fusionnez apres review
echo 4. Supprimez l'ancienne branche avec .env
echo.

:end
pause
