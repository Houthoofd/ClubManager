# Script de Nettoyage ClubManager → SaaS Multitenant
# Supprime tous les fichiers/dossiers obsolètes pour la migration

Write-Host "DEBUT DU NETTOYAGE CLUBMANAGER → SAAS MULTITENANT" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Chemin du projet
$projectPath = "c:\Users\guillaumehouthoofd\Documents\Benoit\Epreuve_intégrée\ClubManager"
Set-Location $projectPath

Write-Host "Repertoire de travail: $projectPath" -ForegroundColor Yellow

# Liste des fichiers/dossiers à supprimer
$itemsToRemove = @(
    # Applications redondantes
    "mobile",
    "web", 
    "site-vitrine",
    
    # Code legacy/obsolète
    "shared",
    "tables",
    "db",
    ".expo",
    "rapport",
    
    # Fichiers API legacy
    "api\app.js",
    "api\bin",
    "api\views",
    
    # Fichiers spécifiques/temporaires
    "carte_stripe.txt",
    "presentation.txt",
    "jwt-token-explication.txt",
    "test-deploy.txt",
    "worflow-test.txt",
    "packages-a-installer.txt",
    "jest-output.txt",
    
    # Configurations racine non utilisées
    "babel.config.js",
    "jest.config.js",
    "tsconfig.json",
    
    # Documentation temporaire/académique
    "README-debug-multi-test.md",
    "ANALYSE_ACTUELLE_ET_AMELIORATIONS.md",
    "CHANGELOG_TESTS.md",
    "GRAPHQL_PRISMA_SETUP.md",
    "TESTS_SUMMARY.md"
)

$removedItems = @()
$notFoundItems = @()
$errors = @()

Write-Host "SUPPRESSION DES ELEMENTS OBSOLETES" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

foreach ($item in $itemsToRemove) {
    $fullPath = Join-Path $projectPath $item
    
    try {
        if (Test-Path $fullPath) {
            # Calculer la taille avant suppression
            $size = if (Test-Path $fullPath -PathType Container) {
                (Get-ChildItem $fullPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
            } else {
                (Get-Item $fullPath).Length
            }
            
            $sizeText = if ($size -gt 1MB) { "{0:N2} MB" -f ($size / 1MB) } 
                       elseif ($size -gt 1KB) { "{0:N2} KB" -f ($size / 1KB) } 
                       else { "$size bytes" }
            
            Remove-Item $fullPath -Recurse -Force -ErrorAction Stop
    Write-Host "Supprime: $item ($sizeText)" -ForegroundColor Green
            $removedItems += $item
        } else {
        Write-Host "Non trouve: $item" -ForegroundColor Yellow
            $notFoundItems += $item
        }
    }
    catch {
        Write-Host "Erreur: $item - $($_.Exception.Message)" -ForegroundColor Red
        $errors += @{ Item = $item; Error = $_.Exception.Message }
    }
}

Write-Host "RESUME DU NETTOYAGE" -ForegroundColor Magenta
Write-Host "======================" -ForegroundColor Magenta
Write-Host "Elements supprimes: $($removedItems.Count)" -ForegroundColor Green
Write-Host "Elements non trouves: $($notFoundItems.Count)" -ForegroundColor Yellow
Write-Host "Erreurs: $($errors.Count)" -ForegroundColor Red

if ($removedItems.Count -gt 0) {
    Write-Host "ELEMENTS SUPPRIMES:" -ForegroundColor Green
    $removedItems | ForEach-Object { Write-Host "    - $_" -ForegroundColor White }
}

if ($notFoundItems.Count -gt 0) {
    Write-Host "ELEMENTS NON TROUVES:" -ForegroundColor Yellow
    $notFoundItems | ForEach-Object { Write-Host "    - $_" -ForegroundColor White }
}

if ($errors.Count -gt 0) {
    Write-Host "ERREURS RENCONTREES:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "    - $($_.Item): $($_.Error)" -ForegroundColor White }
}

# Nettoyer les node_modules si présent à la racine
if (Test-Path "node_modules") {
    try {
        Write-Host "Nettoyage node_modules racine..." -ForegroundColor Cyan
        Remove-Item "node_modules" -Recurse -Force
        Write-Host "node_modules racine supprime" -ForegroundColor Green
    }
    catch {
        Write-Host "Erreur lors de la suppression de node_modules: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Nettoyer package-lock.json racine si présent
if (Test-Path "package-lock.json") {
    try {
        Remove-Item "package-lock.json" -Force
        Write-Host "package-lock.json racine supprime" -ForegroundColor Green
    }
    catch {
        Write-Host "Erreur lors de la suppression de package-lock.json: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "STRUCTURE SAAS CIBLE" -ForegroundColor Blue
Write-Host "=======================" -ForegroundColor Blue
Write-Host "Votre projet est maintenant prêt pour la transformation en architecture SaaS multitenant."
Write-Host ""
Write-Host "Prochaines etapes recommandees:" -ForegroundColor Yellow
Write-Host "1. Renommer 'api' → 'platform-api'" -ForegroundColor White
Write-Host "2. Renommer 'front-end' → 'platform-webapp'" -ForegroundColor White
Write-Host "3. Renommer 'packages' → 'platform-packages'" -ForegroundColor White
Write-Host "4. Creer 'infrastructure/', 'docs/', 'e2e-tests/'" -ForegroundColor White
Write-Host "5. Implementer le tenant management" -ForegroundColor White

Write-Host "NETTOYAGE TERMINE AVEC SUCCES!" -ForegroundColor Green
Write-Host "Projet pret pour la migration SaaS multitenant!" -ForegroundColor Green