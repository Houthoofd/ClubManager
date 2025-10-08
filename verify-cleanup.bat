@echo off
chcp 65001 >nul
echo ================================================
echo    VERIFICATION POST-NETTOYAGE
echo ================================================
echo.

echo 1. Fichiers .env dans Git (devrait être vide):
git ls-files | findstr .env
if errorlevel 1 (
    echo ✅ Aucun fichier .env tracke par Git
) else (
    echo ❌ Des fichiers .env sont encore traces !
)

echo.
echo 2. Fichiers .env locaux (doivent exister):
if exist "api\.env.development" (
    echo ✅ api\.env.development existe
) else (
    echo ⚠️ api\.env.development manquant
)

if exist "api\.env.production" (
    echo ✅ api\.env.production existe
) else (
    echo ⚠️ api\.env.production manquant
)

if exist "front-end\.env" (
    echo ✅ front-end\.env existe
) else (
    echo ⚠️ front-end\.env manquant
)

echo.
echo 3. Verification .gitignore:
findstr /C:".env" .gitignore >nul
if errorlevel 1 (
    echo ❌ .env pas dans .gitignore
) else (
    echo ✅ .env presente dans .gitignore
)

echo.
echo 4. Test d'ajout d'un fichier .env:
echo "TEST=test" > test.env
git add test.env 2>nul
git status --porcelain | findstr test.env >nul
if errorlevel 1 (
    echo ✅ .gitignore fonctionne (test.env ignore)
) else (
    echo ❌ .gitignore ne fonctionne pas !
)
del test.env 2>nul

echo.
echo ================================================
echo    RESULTATS
echo ================================================

pause
