# Script PowerShell pour copier la structure de la DB principale vers la DB de test
# Usage: .\setup-test-db.ps1

param(
    [string]$SourceDB = "clubmanager",
    [string]$TargetDB = "clubmanager_test",
    [string]$DBHost = "localhost",
    [string]$User = "root",
    [string]$Password = "root"
)

Write-Host "Configuration de la base de donnees de test..." -ForegroundColor Cyan
Write-Host ""

# 1. Supprimer et recreer la DB de test
Write-Host "Recreation de la base $TargetDB..." -ForegroundColor Yellow
$dropCreate = "DROP DATABASE IF EXISTS $TargetDB; CREATE DATABASE $TargetDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -h$DBHost -u$User -p$Password -e $dropCreate 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la creation de la DB de test" -ForegroundColor Red
    exit 1
}

# 2. Copier la structure (sans les donnees)
Write-Host "Copie de la structure de '$SourceDB' vers '$TargetDB'..." -ForegroundColor Yellow
$tempFile = "temp_structure.sql"

# Dump de la structure
mysqldump -h$DBHost -u$User -p$Password --no-data --skip-add-drop-table --skip-comments $SourceDB > $tempFile 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de l'extraction de la structure" -ForegroundColor Red
    Remove-Item -Path $tempFile -ErrorAction SilentlyContinue
    exit 1
}

# Import dans la DB de test
Get-Content $tempFile | mysql -h$DBHost -u$User -p$Password $TargetDB 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de l'import de la structure" -ForegroundColor Red
    Remove-Item -Path $tempFile -ErrorAction SilentlyContinue
    exit 1
}

# Nettoyer le fichier temporaire
Remove-Item -Path $tempFile -ErrorAction SilentlyContinue

# 3. Copier les donnees de reference (types d'alertes, categories, etc.)
Write-Host "Copie des donnees de reference..." -ForegroundColor Yellow

$referenceTables = @(
    "alertes_types",
    "categories",
    "roles",
    "status"
)

foreach ($table in $referenceTables) {
    Write-Host "   Copie de $table..." -ForegroundColor Gray
    
    # Dump des donnees
    mysqldump -h$DBHost -u$User -p$Password --no-create-info --skip-add-locks --skip-comments $SourceDB $table 2>$null | mysql -h$DBHost -u$User -p$Password $TargetDB 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK $table copie" -ForegroundColor Green
    } else {
        Write-Host "   ATTENTION $table non trouve ou erreur (on continue...)" -ForegroundColor DarkYellow
    }
}

Write-Host ""
Write-Host "Base de donnees de test prete!" -ForegroundColor Green
Write-Host "   Source: $SourceDB" -ForegroundColor Gray
Write-Host "   Cible: $TargetDB" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour lancer les tests d'integration:" -ForegroundColor Cyan
Write-Host 'npm test -- --testPathPattern=integration' -ForegroundColor White
