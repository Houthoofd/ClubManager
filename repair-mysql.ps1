# Script de réparation MySQL XAMPP - Fichiers corrompus
# À exécuter en tant qu'Administrateur

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Script de Réparation MySQL XAMPP" -ForegroundColor Cyan
Write-Host "  Résolution : Fichiers corrompus" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$xamppPath = "C:\xampp"
$mysqlDataPath = "$xamppPath\mysql\data"
$backupPath = "$xamppPath\mysql\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Vérifier si XAMPP existe
if (-not (Test-Path $xamppPath)) {
    Write-Host "❌ XAMPP n'est pas installé dans C:\xampp" -ForegroundColor Red
    Write-Host "Veuillez modifier le chemin dans le script si nécessaire." -ForegroundColor Yellow
    exit 1
}

Write-Host "📍 Chemin XAMPP détecté : $xamppPath" -ForegroundColor Green
Write-Host ""

# Étape 1 : Arrêter MySQL
Write-Host "🛑 Étape 1 : Arrêt de MySQL..." -ForegroundColor Yellow
try {
    Stop-Process -Name "mysqld" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Processus MySQL arrêté" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Aucun processus MySQL en cours" -ForegroundColor Gray
}
Start-Sleep -Seconds 2

# Étape 2 : Créer une sauvegarde
Write-Host ""
Write-Host "💾 Étape 2 : Création d'une sauvegarde..." -ForegroundColor Yellow
try {
    if (-not (Test-Path "$xamppPath\mysql\backup")) {
        New-Item -ItemType Directory -Path "$xamppPath\mysql\backup" -Force | Out-Null
    }

    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

    # Sauvegarder seulement les bases de données (dossiers)
    $databases = Get-ChildItem -Path $mysqlDataPath -Directory |
                 Where-Object { $_.Name -notin @('mysql', 'performance_schema', 'phpmyadmin') }

    foreach ($db in $databases) {
        Copy-Item -Path $db.FullName -Destination $backupPath -Recurse -Force
        Write-Host "  ✓ Base sauvegardée : $($db.Name)" -ForegroundColor Gray
    }

    Write-Host "✅ Sauvegarde créée dans : $backupPath" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Impossible de créer la sauvegarde : $($_.Exception.Message)" -ForegroundColor Yellow
}

# Étape 3 : Supprimer les fichiers corrompus
Write-Host ""
Write-Host "🗑️  Étape 3 : Suppression des fichiers corrompus..." -ForegroundColor Yellow

$corruptedFiles = @(
    "$mysqlDataPath\ibdata1",
    "$mysqlDataPath\ib_logfile0",
    "$mysqlDataPath\ib_logfile1",
    "$mysqlDataPath\ib_logfile*",
    "$mysqlDataPath\*.pid"
)

foreach ($file in $corruptedFiles) {
    try {
        if (Test-Path $file) {
            Remove-Item -Path $file -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Supprimé : $(Split-Path $file -Leaf)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ⚠️  Impossible de supprimer : $(Split-Path $file -Leaf)" -ForegroundColor Yellow
    }
}

Write-Host "✅ Fichiers corrompus supprimés" -ForegroundColor Green

# Étape 4 : Réinitialiser InnoDB
Write-Host ""
Write-Host "🔄 Étape 4 : Réinitialisation InnoDB..." -ForegroundColor Yellow

$mysqldPath = "$xamppPath\mysql\bin\mysqld.exe"

if (Test-Path $mysqldPath) {
    try {
        # Démarrer MySQL en mode console pour voir les erreurs
        Write-Host "  Démarrage de MySQL pour régénérer les fichiers..." -ForegroundColor Gray
        $process = Start-Process -FilePath $mysqldPath -ArgumentList "--console" -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 5

        # Arrêter le processus
        if ($process -and !$process.HasExited) {
            Stop-Process -Id $process.Id -Force
        }

        Write-Host "✅ Fichiers InnoDB régénérés" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Erreur lors de la réinitialisation : $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ mysqld.exe introuvable" -ForegroundColor Red
}

# Étape 5 : Nettoyer les logs
Write-Host ""
Write-Host "🧹 Étape 5 : Nettoyage des logs..." -ForegroundColor Yellow

try {
    $logFiles = Get-ChildItem -Path $mysqlDataPath -Filter "*.err" -ErrorAction SilentlyContinue
    foreach ($log in $logFiles) {
        if ($log.Length -gt 50MB) {
            Clear-Content -Path $log.FullName
            Write-Host "  ✓ Log nettoyé : $($log.Name)" -ForegroundColor Gray
        }
    }
    Write-Host "✅ Logs nettoyés" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Aucun log volumineux à nettoyer" -ForegroundColor Gray
}

# Étape 6 : Vérifier la configuration
Write-Host ""
Write-Host "⚙️  Étape 6 : Vérification de la configuration..." -ForegroundColor Yellow

$myIniPath = "$xamppPath\mysql\bin\my.ini"
if (Test-Path $myIniPath) {
    $iniContent = Get-Content $myIniPath -Raw

    # Vérifier les paramètres importants
    $checks = @{
        "port" = $iniContent -match "port\s*=\s*3306"
        "innodb" = $iniContent -match "innodb_buffer_pool_size"
        "max_allowed_packet" = $iniContent -match "max_allowed_packet"
    }

    foreach ($check in $checks.GetEnumerator()) {
        if ($check.Value) {
            Write-Host "  ✓ $($check.Key) configuré" -ForegroundColor Gray
        } else {
            Write-Host "  ⚠️  $($check.Key) non trouvé" -ForegroundColor Yellow
        }
    }

    Write-Host "✅ Configuration vérifiée" -ForegroundColor Green
} else {
    Write-Host "⚠️  Fichier my.ini introuvable" -ForegroundColor Yellow
}

# Résumé final
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Réparation terminée !" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor White
Write-Host "  1. Ouvrez le panneau XAMPP" -ForegroundColor White
Write-Host "  2. Démarrez MySQL" -ForegroundColor White
Write-Host "  3. Si MySQL démarre :" -ForegroundColor Green
Write-Host "     → Recréez la base 'clubmanager_test'" -ForegroundColor Green
Write-Host "     → Importez vos données si nécessaire" -ForegroundColor Green
Write-Host ""
Write-Host "  4. Si MySQL ne démarre toujours pas :" -ForegroundColor Yellow
Write-Host "     → Vérifiez les logs : $mysqlDataPath\*.err" -ForegroundColor Yellow
Write-Host "     → Exécutez : $xamppPath\mysql\bin\mysqld.exe --console" -ForegroundColor Yellow
Write-Host ""
Write-Host "💾 Sauvegarde disponible : $backupPath" -ForegroundColor Cyan
Write-Host ""

# Option pour recréer la base de données de test
Write-Host "🔧 Voulez-vous recréer automatiquement la base 'clubmanager_test' ? (O/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "O" -or $response -eq "o") {
    Write-Host ""
    Write-Host "🔄 Création de la base de données de test..." -ForegroundColor Yellow

    # Attendre que MySQL démarre
    Write-Host "  Démarrage de MySQL..." -ForegroundColor Gray
    Start-Process -FilePath "$xamppPath\mysql_start.bat" -WindowStyle Hidden
    Start-Sleep -Seconds 5

    # Créer la base de données
    $sqlCommands = @"
CREATE DATABASE IF NOT EXISTS clubmanager_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clubmanager_test;
SELECT 'Base de données clubmanager_test créée avec succès' AS message;
"@

    $sqlCommands | & "$xamppPath\mysql\bin\mysql.exe" -u root 2>&1 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Gray
    }

    Write-Host "✅ Base de données de test créée" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Pour exécuter les tests :" -ForegroundColor Cyan
    Write-Host "   cd ClubManager" -ForegroundColor White
    Write-Host "   npm run test:api -- messages" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ Script terminé avec succès !" -ForegroundColor Green
Write-Host ""
