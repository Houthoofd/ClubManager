@echo off
chcp 65001 >nul
echo ================================================
echo    VERIFICATION FICHIERS .ENV DANS GIT
echo ================================================
echo.

echo 1. Fichiers .env actuellement trackes par Git:
git ls-files | findstr .env
echo.

echo 2. Status Git actuel:
git status
echo.

echo 3. Fichiers .env dans le working directory:
dir /s /b *.env 2>nul
echo.

echo 4. Verification .gitignore:
if exist ".gitignore" (
    echo .gitignore existe
    findstr /C:".env" .gitignore
) else (
    echo .gitignore n'existe pas !
)

pause
