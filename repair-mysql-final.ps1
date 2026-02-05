# Script de réparation finale MySQL XAMPP
# Résolution des fichiers corrompus et tables système
# Version: 1.0

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  REPARATION FINALE MYSQL XAMPP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$xamppPath = "C:\xampp"
$mysqlData = "$xamppPath\mysql\data"
$mysqlBin = "$xamppPath\mysql\bin"

# Vérifier XAMPP
if (-not (Test-Path $xamppPath)) {
    Write-Host "ERREUR: XAMPP introuvable" -ForegroundColor Red
    exit 1
}

Write-Host "[1/6] Arret de MySQL..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.Name -like "*mysql*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "  OK" -ForegroundColor Green

Write-Host "[2/6] Sauvegarde des bases utilisateur..." -ForegroundColor Yellow
$backup = "$xamppPath\mysql\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -Path $backup -ItemType Directory -Force | Out-Null
if (Test-Path "$mysqlData\clubmanager") {
    Copy-Item "$mysqlData\clubmanager" "$backup\clubmanager" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  clubmanager sauvegarde" -ForegroundColor Gray
}
if (Test-Path "$mysqlData\clubmanager_test") {
    Copy-Item "$mysqlData\clubmanager_test" "$backup\clubmanager_test" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  clubmanager_test sauvegarde" -ForegroundColor Gray
}
Write-Host "  OK - Sauvegarde: $backup" -ForegroundColor Green

Write-Host "[3/6] Suppression des fichiers corrompus..." -ForegroundColor Yellow
Remove-Item "$mysqlData\mysql" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$mysqlData\performance_schema" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$mysqlData\ibdata1" -Force -ErrorAction SilentlyContinue
Remove-Item "$mysqlData\ib_logfile*" -Force -ErrorAction SilentlyContinue
Remove-Item "$mysqlData\*.pid" -Force -ErrorAction SilentlyContinue
Write-Host "  OK" -ForegroundColor Green

Write-Host "[4/6] Nettoyage complet..." -ForegroundColor Yellow
Get-ChildItem $mysqlData | Where-Object {
    $_.Name -notlike "clubmanager*" -and $_.Name -ne "test"
} | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  OK" -ForegroundColor Green

Write-Host "[5/6] Reinstallation des tables systeme..." -ForegroundColor Yellow
Write-Host "  Cela peut prendre 30-60 secondes..." -ForegroundColor Gray
$installDb = "$mysqlBin\mysql_install_db.exe"
if (Test-Path $installDb) {
    & $installDb --datadir="$mysqlData" --default-user 2>&1 | Out-Null
    Start-Sleep -Seconds 5
    if (Test-Path "$mysqlData\mysql") {
        Write-Host "  OK - Tables systeme creees" -ForegroundColor Green
    } else {
        Write-Host "  Tentative methode alternative..." -ForegroundColor Yellow
        $mysqld = "$mysqlBin\mysqld.exe"
        $proc = Start-Process $mysqld -ArgumentList "--console","--initialize-insecure" -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 10
        if ($proc -and !$proc.HasExited) {
            Stop-Process -Id $proc.Id -Force
        }
        if (Test-Path "$mysqlData\mysql") {
            Write-Host "  OK - Tables creees (methode alternative)" -ForegroundColor Green
        } else {
            Write-Host "  ERREUR - Impossible de creer les tables" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "  ERREUR - mysql_install_db.exe introuvable" -ForegroundColor Red
    exit 1
}

Write-Host "[6/6] Test de demarrage..." -ForegroundColor Yellow
$mysqld = "$mysqlBin\mysqld.exe"
$proc = Start-Process $mysqld -ArgumentList "--console" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 8
if (Get-Process -Name mysqld -ErrorAction SilentlyContinue) {
    Write-Host "  OK - MySQL demarre" -ForegroundColor Green
    $mysqlExe = "$mysqlBin\mysql.exe"
    $test = "SELECT 'OK';" | & $mysqlExe -u root --skip-password 2>&1
    if ($test -match "OK") {
        Write-Host "  OK - Connexion fonctionnelle" -ForegroundColor Green
    }
    Stop-Process -Name mysqld -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} else {
    Write-Host "  ATTENTION - MySQL n'a pas demarre" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  REPARATION TERMINEE !" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor White
Write-Host "1. Ouvrez XAMPP Control Panel" -ForegroundColor White
Write-Host "2. Demarrez MySQL" -ForegroundColor White
Write-Host "3. Recreez la base de test:" -ForegroundColor White
Write-Host "   mysql -u root -e 'CREATE DATABASE clubmanager_test;'" -ForegroundColor Gray
Write-Host "4. Lancez les tests:" -ForegroundColor White
Write-Host "   npm run test:api -- messages" -ForegroundColor Gray
Write-Host ""
Write-Host "Sauvegarde: $backup" -ForegroundColor Cyan
Write-Host ""
