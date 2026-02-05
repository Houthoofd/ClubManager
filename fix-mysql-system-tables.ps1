# Script de réinitialisation complète des tables système MySQL
# Résout l'erreur : "Can't open and lock privilege tables: Incorrect file format 'db'"
# À exécuter en tant qu'Administrateur

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Réinitialisation des Tables Système MySQL/MariaDB" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$xamppPath = "C:\xampp"
$mysqlDataPath = "$xamppPath\mysql\data"
$mysqlBinPath = "$xamppPath\mysql\bin"
$backupPath = "$xamppPath\mysql\backup_system_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Vérifier les privilèges administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Ce script nécessite les droits administrateur" -ForegroundColor Red
    Write-Host "   Relancez PowerShell en tant qu'Administrateur" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host "✅ Droits administrateur confirmés" -ForegroundColor Green
Write-Host ""

# Vérifier que XAMPP existe
if (-not (Test-Path $xamppPath)) {
    Write-Host "❌ XAMPP introuvable dans $xamppPath" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host "📍 Installation XAMPP détectée : $xamppPath" -ForegroundColor Green
Write-Host ""

# Étape 1 : Arrêter MySQL complètement
Write-Host "[1/7] Arrêt complet de MySQL/MariaDB..." -ForegroundColor Yellow
try {
    Get-Process | Where-Object {$_.Name -like "*mysql*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    Write-Host "      ✓ Tous les processus MySQL arrêtés" -ForegroundColor Green
} catch {
    Write-Host "      ℹ️  Aucun processus MySQL en cours" -ForegroundColor Gray
}

# Étape 2 : Sauvegarder les données utilisateur
Write-Host ""
Write-Host "[2/7] Sauvegarde des bases de données utilisateur..." -ForegroundColor Yellow

if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
}

# Sauvegarder uniquement les bases utilisateur (pas les bases système)
$systemDatabases = @('mysql', 'performance_schema', 'phpmyadmin', 'test', 'information_schema')
$userDatabases = Get-ChildItem -Path $mysqlDataPath -Directory |
    Where-Object { $systemDatabases -notcontains $_.Name }

$savedCount = 0
foreach ($db in $userDatabases) {
    try {
        $destPath = Join-Path $backupPath $db.Name
        Copy-Item -Path $db.FullName -Destination $destPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "      ✓ Sauvegardé : $($db.Name)" -ForegroundColor Gray
        $savedCount++
    } catch {
        Write-Host "      ⚠️  Erreur sauvegarde : $($db.Name)" -ForegroundColor Yellow
    }
}

if ($savedCount -gt 0) {
    Write-Host "      ✓ $savedCount base(s) de données sauvegardée(s)" -ForegroundColor Green
    Write-Host "      📁 Emplacement : $backupPath" -ForegroundColor Cyan
} else {
    Write-Host "      ℹ️  Aucune base utilisateur à sauvegarder" -ForegroundColor Gray
}

# Étape 3 : Supprimer les tables système corrompues
Write-Host ""
Write-Host "[3/7] Suppression des tables système corrompues..." -ForegroundColor Yellow

$mysqlSystemPath = Join-Path $mysqlDataPath "mysql"
if (Test-Path $mysqlSystemPath) {
    try {
        # Sauvegarder le dossier mysql système avant de le supprimer
        $mysqlBackup = Join-Path $backupPath "mysql_system_backup"
        Copy-Item -Path $mysqlSystemPath -Destination $mysqlBackup -Recurse -Force -ErrorAction SilentlyContinue

        # Supprimer le dossier mysql système
        Remove-Item -Path $mysqlSystemPath -Recurse -Force -ErrorAction Stop
        Write-Host "      ✓ Dossier 'mysql' système supprimé" -ForegroundColor Green
        Write-Host "      ✓ Sauvegarde dans : $mysqlBackup" -ForegroundColor Gray
    } catch {
        Write-Host "      ⚠️  Erreur lors de la suppression : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Supprimer aussi performance_schema si corrompu
$perfSchemaPath = Join-Path $mysqlDataPath "performance_schema"
if (Test-Path $perfSchemaPath) {
    Remove-Item -Path $perfSchemaPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "      ✓ Dossier 'performance_schema' supprimé" -ForegroundColor Gray
}

# Étape 4 : Supprimer les fichiers InnoDB
Write-Host ""
Write-Host "[4/7] Nettoyage des fichiers InnoDB..." -ForegroundColor Yellow

$innodbFiles = @(
    "ibdata1",
    "ib_logfile0",
    "ib_logfile1",
    "ib_logfile*",
    "ibtmp*",
    "*.pid"
)

foreach ($pattern in $innodbFiles) {
    $files = Get-ChildItem -Path $mysqlDataPath -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
        Write-Host "      ✓ Supprimé : $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "      ✓ Fichiers InnoDB nettoyés" -ForegroundColor Green

# Étape 5 : Réinitialiser MySQL/MariaDB
Write-Host ""
Write-Host "[5/7] Réinitialisation de MySQL/MariaDB..." -ForegroundColor Yellow
Write-Host "      ⏳ Cela peut prendre 30-60 secondes..." -ForegroundColor Gray

$mysqldExe = Join-Path $mysqlBinPath "mysqld.exe"
$installDbScript = Join-Path $mysqlBinPath "mysql_install_db.exe"

# Méthode 1 : Utiliser mysql_install_db (recommandé pour MariaDB)
if (Test-Path $installDbScript) {
    Write-Host "      Utilisation de mysql_install_db..." -ForegroundColor Gray
    try {
        $process = Start-Process -FilePath $installDbScript -ArgumentList "--datadir=$mysqlDataPath", "--default-user" -Wait -PassThru -NoNewWindow
        if ($process.ExitCode -eq 0) {
            Write-Host "      ✓ Tables système réinitialisées avec mysql_install_db" -ForegroundColor Green
        } else {
            Write-Host "      ⚠️  mysql_install_db a retourné le code : $($process.ExitCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "      ⚠️  Erreur avec mysql_install_db : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Méthode 2 : Bootstrap MySQL
Write-Host "      Démarrage Bootstrap de MySQL..." -ForegroundColor Gray
try {
    $process = Start-Process -FilePath $mysqldExe -ArgumentList "--console", "--initialize-insecure" -PassThru -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 10

    if ($process -and !$process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }

    # Vérifier que les tables ont été créées
    if (Test-Path (Join-Path $mysqlDataPath "mysql")) {
        Write-Host "      ✓ Tables système créées avec succès" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  Les tables système n'ont pas été créées" -ForegroundColor Yellow
    }
} catch {
    Write-Host "      ⚠️  Erreur Bootstrap : $($_.Exception.Message)" -ForegroundColor Yellow
}

# Étape 6 : Démarrer MySQL pour finaliser
Write-Host ""
Write-Host "[6/7] Démarrage de MySQL pour vérification..." -ForegroundColor Yellow

try {
    $process = Start-Process -FilePath $mysqldExe -ArgumentList "--console" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 5

    # Vérifier que MySQL tourne
    $mysqlProcess = Get-Process | Where-Object {$_.Name -eq "mysqld"}
    if ($mysqlProcess) {
        Write-Host "      ✓ MySQL démarré avec succès (PID: $($mysqlProcess.Id))" -ForegroundColor Green

        # Tester la connexion
        Start-Sleep -Seconds 2
        $mysqlExe = Join-Path $mysqlBinPath "mysql.exe"
        $testQuery = "SELECT 'OK' AS status;"
        $testResult = $testQuery | & $mysqlExe -u root --skip-password 2>&1

        if ($testResult -match "OK") {
            Write-Host "      ✓ Connexion MySQL fonctionnelle" -ForegroundColor Green
        } else {
            Write-Host "      ⚠️  Connexion MySQL non testée" -ForegroundColor Yellow
        }
    } else {
        Write-Host "      ⚠️  MySQL n'a pas démarré automatiquement" -ForegroundColor Yellow
    }
} catch {
    Write-Host "      ⚠️  Erreur démarrage : $($_.Exception.Message)" -ForegroundColor Yellow
}

# Étape 7 : Restaurer les bases utilisateur
Write-Host ""
Write-Host "[7/7] Restauration des bases de données utilisateur..." -ForegroundColor Yellow

if ($savedCount -gt 0) {
    $restoredCount = 0
    foreach ($db in $userDatabases) {
        $sourcePath = Join-Path $backupPath $db.Name
        $destPath = Join-Path $mysqlDataPath $db.Name

        if ((Test-Path $sourcePath) -and (-not (Test-Path $destPath))) {
            try {
                Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
                Write-Host "      ✓ Restauré : $($db.Name)" -ForegroundColor Gray
                $restoredCount++
            } catch {
                Write-Host "      ⚠️  Erreur restauration : $($db.Name)" -ForegroundColor Yellow
            }
        }
    }

    if ($restoredCount -gt 0) {
        Write-Host "      ✓ $restoredCount base(s) restaurée(s)" -ForegroundColor Green
    }
} else {
    Write-Host "      ℹ️  Aucune base à restaurer" -ForegroundColor Gray
}

# Résumé final
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Réinitialisation terminée !" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Arrêter MySQL pour permettre le redémarrage via XAMPP
Write-Host "🛑 Arrêt de MySQL pour le contrôle XAMPP..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.Name -like "*mysql*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✓ MySQL arrêté" -ForegroundColor Green

Write-Host ""
Write-Host "📋 PROCHAINES ÉTAPES :" -ForegroundColor White
Write-Host ""
Write-Host "1. Ouvrez le Panneau de Contrôle XAMPP" -ForegroundColor White
Write-Host "2. Cliquez sur 'Start' pour MySQL" -ForegroundColor White
Write-Host "3. MySQL devrait démarrer normalement maintenant ✅" -ForegroundColor Green
Write-Host ""
Write-Host "4. Recréez la base de données de test :" -ForegroundColor White
Write-Host "   • Ouvrez phpMyAdmin (http://localhost/phpmyadmin)" -ForegroundColor Gray
Write-Host "   • Créez une base 'clubmanager_test'" -ForegroundColor Gray
Write-Host "   • Ou utilisez : mysql -u root -e 'CREATE DATABASE clubmanager_test;'" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Lancez les tests :" -ForegroundColor White
Write-Host "   cd ClubManager" -ForegroundColor Gray
Write-Host "   npm run test:api -- messages" -ForegroundColor Gray
Write-Host ""
Write-Host "💾 Sauvegarde disponible : $backupPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT : Mot de passe root réinitialisé (vide par défaut)" -ForegroundColor Yellow
Write-Host "   Pensez à sécuriser votre installation MySQL après les tests" -ForegroundColor Yellow
Write-Host ""
Write-Host "✨ Script terminé avec succès !" -ForegroundColor Green
Write-Host ""

Read-Host "Appuyez sur Entrée pour terminer"
