@echo off
chcp 65001 >nul
echo ================================================
echo    CREATION BRANCHE PROPRE SANS FICHIERS .ENV
echo ================================================
echo.

echo Etape 1: Verification de l'etat actuel...
git status --short

echo.
echo Etape 2: Creation d'une nouvelle branche securisee...
set BRANCH_NAME=security/remove-env-files
git checkout -b %BRANCH_NAME%

echo.
echo Etape 3: Suppression des fichiers .env du tracking...
git rm --cached api/.env.development 2>nul
git rm --cached api/.env.production 2>nul
git rm --cached front-end/.env.development 2>nul
git rm --cached front-end/.env.production 2>nul

echo.
echo Etape 4: Ajout des fichiers de securite...
git add .gitignore
git add SECURITY.md 2>nul
git add api/.gitignore 2>nul
git add front-end/.gitignore 2>nul

echo.
echo Etape 5: Creation des fichiers .env.example...
if not exist "api\.env.example" (
    echo Creation api/.env.example...
    call :create_api_example
)

if not exist "front-end\.env.example" (
    echo Creation front-end/.env.example...
    call :create_frontend_example
)

git add api/.env.example 2>nul
git add front-end/.env.example 2>nul

echo.
echo Etape 6: Commit des changements de securite...
git commit -m "🔒 Security: Remove .env files and add security measures

BREAKING CHANGE: Environment files removed from version control

Changes:
- Remove sensitive .env files from Git tracking
- Add comprehensive .gitignore for environment files  
- Add .env.example templates for development setup
- Add security documentation
- Protect API keys, database credentials, and secrets

Setup for new developers:
1. Copy .env.example files to .env files
2. Fill in actual credentials
3. Never commit .env files

Files preserved locally but excluded from Git."

echo.
echo Etape 7: Verification finale...
echo Fichiers .env encore trackes:
git ls-files | findstr .env
if errorlevel 1 (
    echo ✅ Aucun fichier .env sensible tracke
) else (
    echo ⚠️ Certains fichiers .env encore present
)

echo.
echo ================================================
echo    BRANCHE PROPRE CREEE !
echo ================================================
echo.
echo Branche actuelle: %BRANCH_NAME%
echo.
echo Prochaines etapes:
echo 1. Verifiez vos fichiers .env locaux
echo 2. Testez votre application
echo 3. Poussez la nouvelle branche:
echo    git push origin %BRANCH_NAME%
echo 4. Creez une Pull Request
echo.
pause
goto :end

:create_api_example
(
echo # TEMPLATE - Configuration API ClubManager
echo # Copiez vers .env.development et .env.production
echo.
echo # Base de donnees
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_USER=your_db_user
echo DB_PASSWORD=your_db_password
echo DB_NAME=clubmanager
echo.
echo # SendGrid
echo SENDGRID_API_KEY=your_sendgrid_api_key_here
echo SENDGRID_FROM_EMAIL=your_verified_email@yourdomain.com
echo SENDGRID_SANDBOX=false
echo.
echo # Email SMTP
echo EMAIL_SERVICE=sendgrid
echo EMAIL_FROM_NAME=Club Manager
echo ADMIN_EMAIL=admin@yourdomain.com
echo EMAIL_HOST=smtp.sendgrid.net
echo EMAIL_PORT=587
echo EMAIL_SECURE=false
echo EMAIL_USER=apikey
echo EMAIL_PASS=your_sendgrid_api_key_here
echo.
echo # Frontend URL
echo FRONTEND_URL=http://localhost:5173
echo.
echo # JWT
echo JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
echo.
echo # Stripe
echo STRIPE_SECRET_KEY=your_stripe_secret_key_here
echo STRIPE_PUBLIC_KEY=your_stripe_public_key_here
echo.
echo # Environnement
echo NODE_ENV=development
) > api\.env.example
goto :eof

:create_frontend_example
(
echo # TEMPLATE - Configuration Frontend ClubManager
echo # Copiez vers .env
echo.
echo # Stripe
echo VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
echo.
echo # API URL
echo VITE_API_URL=http://localhost:3000
) > front-end\.env.example
goto :eof

:end
