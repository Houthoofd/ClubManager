# Script de réparation MySQL XAMPP - Exécution immédiate
# Résolution des fichiers corrompus

Write-Host "=== Réparation MySQL XAMPP ===" -ForegroundColor Cyan
Write-Host ""

# Arrêter MySQL
Write-Host "1. Arrêt de MySQL..." -ForegroundColor Yellow
Stop-Process -Name "mysqld" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   OK" -ForegroundColor Green

# Supprimer les fichiers corrompus
Write-Host "2. Suppression des fichiers corrompus..." -ForegroundColor Yellow
$files = @(
    "C:\xampp\mysql\data\ibdata1",
    "C:\xampp\mysql\data\ib_logfile0",
    "C:\xampp\mysql\data\ib_logfile1"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force -ErrorAction SilentlyContinue
        Write-Host "   Supprimé: $(Split-Path $file -Leaf)" -ForegroundColor Gray
    }
}
Write-Host "   OK" -ForegroundColor Green

# Supprimer les fichiers PID
Get-ChildItem "C:\xampp\mysql\data\*.pid" -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "   Fichiers PID nettoyés" -ForegroundColor Gray

# Régénérer les fichiers
Write-Host "3. Régénération des fichiers InnoDB..." -ForegroundColor Yellow
$process = Start-Process -FilePath "C:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--console" -PassThru -WindowStyle Hidden -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5
if ($process -and !$process.HasExited) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
}
Write-Host "   OK" -ForegroundColor Green

Write-Host ""
Write-Host "=== Réparation terminée ===" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor White
Write-Host "1. Ouvrez le panneau XAMPP" -ForegroundColor White
Write-Host "2. Démarrez MySQL" -ForegroundColor White
Write-Host "3. MySQL devrait démarrer normalement maintenant" -ForegroundColor Green
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
