# Script complet pour gerer MySQL et la DB de test
# Usage: .\manage-test-db.ps1 [setup|start|stop|reset|run-tests]

param(
    [Parameter(Position=0)]
    [ValidateSet('setup', 'start', 'stop', 'reset', 'run-tests', 'all')]
    [string]$Action = "all",
    
    [string]$SourceDB = "clubmanager",
    [string]$TargetDB = "clubmanager_test",
    [string]$DBHost = "localhost",
    [string]$User = "root",
    [string]$Password = ""
)

# Couleurs
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$Gray = "Gray"
$White = "White"

# Chemins possibles pour MySQL
$mysqlPaths = @(
    "C:\xampp\mysql\bin",
    "C:\wamp64\bin\mysql\mysql*\bin",
    "C:\Program Files\MySQL\MySQL Server *\bin",
    "C:\Program Files (x86)\MySQL\MySQL Server *\bin"
)

# Variables globales
$script:mysqlPath = $null
$script:mysqlService = $null

# ========================================
# FONCTIONS UTILITAIRES
# ========================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor $Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "    OK $Message" -ForegroundColor $Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "    ERREUR $Message" -ForegroundColor $Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "    ATTENTION $Message" -ForegroundColor $Yellow
}

# ========================================
# DETECTION DE MYSQL
# ========================================

function Find-MySQL {
    Write-Step "Detection de MySQL..."
    
    foreach ($path in $mysqlPaths) {
        $resolvedPaths = Resolve-Path $path -ErrorAction SilentlyContinue
        if ($resolvedPaths) {
            foreach ($resolvedPath in $resolvedPaths) {
                $mysqlExe = Join-Path $resolvedPath "mysql.exe"
                if (Test-Path $mysqlExe) {
                    $script:mysqlPath = $resolvedPath
                    Write-Success "MySQL trouve dans: $resolvedPath"
                    
                    # Ajouter au PATH si necessaire
                    if ($env:PATH -notlike "*$resolvedPath*") {
                        $env:PATH += ";$resolvedPath"
                    }
                    return $true
                }
            }
        }
    }
    
    Write-Error-Custom "MySQL introuvable. Installez XAMPP, WAMP ou MySQL Server"
    return $false
}

# ========================================
# GESTION DU SERVICE MYSQL
# ========================================

function Get-MySQLService {
    # Chercher le service MySQL (XAMPP, WAMP, ou MySQL natif)
    $services = @("MySQL", "MySQL80", "MySQL57", "wampmysqld", "wampmysqld64")
    
    foreach ($serviceName in $services) {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            $script:mysqlService = $service
            return $service
        }
    }
    
    return $null
}

function Start-MySQLService {
    Write-Step "Demarrage de MySQL..."
    
    $service = Get-MySQLService
    
    if ($service) {
        # Service Windows trouve
        Write-Host "    Service trouve: $($service.Name) - Statut: $($service.Status)" -ForegroundColor $Gray
        
        if ($service.Status -eq "Running") {
            Write-Success "MySQL deja demarre"
            if (Test-MySQLConnection) {
                Write-Success "Connexion MySQL OK"
                return $true
            } else {
                Write-Warning-Custom "Service demarre mais connexion impossible"
            }
        } else {
            Write-Host "    Tentative de demarrage du service..." -ForegroundColor $Gray
            try {
                Start-Service $service.Name -ErrorAction Stop
                Start-Sleep -Seconds 5
                
                # Verifier le statut apres demarrage
                $service.Refresh()
                Write-Host "    Nouveau statut: $($service.Status)" -ForegroundColor $Gray
                
                if (Test-MySQLConnection) {
                    Write-Success "Service MySQL demarre et connexion OK"
                    return $true
                } else {
                    Write-Warning-Custom "Service demarre mais connexion impossible"
                }
            } catch {
                Write-Error-Custom "Impossible de demarrer le service: $_"
            }
        }
    } else {
        Write-Host "    Aucun service Windows MySQL trouve" -ForegroundColor $Gray
    }
    
    # Essayer via XAMPP
    Write-Host "    Recherche de XAMPP..." -ForegroundColor $Gray
    if (Test-Path "C:\xampp\mysql_start.bat") {
        Write-Host "    Demarrage via XAMPP..." -ForegroundColor $Gray
        Start-Process -FilePath "C:\xampp\mysql_start.bat" -WindowStyle Hidden -Wait
        Start-Sleep -Seconds 5
        
        # Verifier si MySQL repond
        if (Test-MySQLConnection) {
            Write-Success "MySQL demarre via XAMPP et connexion OK"
            return $true
        } else {
            Write-Warning-Custom "Commande XAMPP executee mais connexion impossible"
        }
    }
    
    # Tester la connexion une derniere fois
    Write-Host "    Test final de connexion..." -ForegroundColor $Gray
    if (Test-MySQLConnection) {
        Write-Success "MySQL est accessible!"
        return $true
    }
    
    Write-Host ""
    Write-Host "    ============================================" -ForegroundColor $Red
    Write-Host "    MYSQL N'EST PAS ACCESSIBLE" -ForegroundColor $Red
    Write-Host "    ============================================" -ForegroundColor $Red
    Write-Host "    Actions possibles:" -ForegroundColor $Yellow
    Write-Host "      1. Ouvrez XAMPP Control Panel" -ForegroundColor $White
    Write-Host "      2. Cliquez sur 'Start' pour MySQL" -ForegroundColor $White
    Write-Host "      3. Attendez le voyant vert" -ForegroundColor $White
    Write-Host "      4. Relancez ce script" -ForegroundColor $White
    Write-Host ""
    return $false
}

function Stop-MySQLService {
    Write-Step "Arret de MySQL..."
    
    $service = Get-MySQLService
    
    if ($service -and $service.Status -eq "Running") {
        try {
            Stop-Service $service.Name -ErrorAction Stop
            Write-Success "Service MySQL arrete: $($service.Name)"
            return $true
        } catch {
            Write-Error-Custom "Impossible d'arreter le service: $_"
        }
    }
    
    # Essayer via XAMPP
    if (Test-Path "C:\xampp\mysql_stop.bat") {
        Start-Process -FilePath "C:\xampp\mysql_stop.bat" -WindowStyle Hidden -Wait
        Write-Success "MySQL arrete via XAMPP"
        return $true
    }
    
    Write-Warning-Custom "MySQL n'etait pas demarre ou deja arrete"
    return $true
}

function Test-MySQLConnection {
    try {
        # Construire le chemin complet vers mysql.exe
        $mysqlCmd = if ($script:mysqlPath) { 
            Join-Path $script:mysqlPath "mysql.exe" 
        } else { 
            "mysql" 
        }
        
        $result = & $mysqlCmd -h $DBHost -u $User $(if($Password){"-p$Password"}) -e "SELECT 1;" 2>&1
        $success = $LASTEXITCODE -eq 0
        
        if ($success) {
            Write-Host "    -> Connexion MySQL reussie" -ForegroundColor $Green
        } else {
            Write-Host "    -> Connexion MySQL echouee (code: $LASTEXITCODE)" -ForegroundColor $Red
            if ($result) {
                Write-Host "    -> Erreur: $result" -ForegroundColor $Red
            }
        }
        
        return $success
    } catch {
        Write-Host "    -> Exception lors du test de connexion: $_" -ForegroundColor $Red
        return $false
    }
}

# ========================================
# CONFIGURATION DE LA DB DE TEST
# ========================================

function Setup-TestDatabase {
    Write-Step "Configuration de la base de donnees de test..."
    
    # Verifier la connexion
    if (-not (Test-MySQLConnection)) {
        Write-Error-Custom "Impossible de se connecter a MySQL"
        return $false
    }
    
    # Chemins complets
    $mysqlCmd = Join-Path $script:mysqlPath "mysql.exe"
    $mysqldumpCmd = Join-Path $script:mysqlPath "mysqldump.exe"
    
    # 1. Supprimer et recreer la DB
    Write-Host "    Suppression et recreation de $TargetDB..." -ForegroundColor $Gray
    $dropCreate = "DROP DATABASE IF EXISTS $TargetDB; CREATE DATABASE $TargetDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    $result = & $mysqlCmd -h $DBHost -u $User $(if($Password){"-p$Password"}) -e $dropCreate 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Impossible de creer la DB de test"
        Write-Host "    Erreur: $result" -ForegroundColor $Red
        return $false
    }
    
    # 2. Copier la structure
    Write-Host "    Copie de la structure de '$SourceDB' vers '$TargetDB'..." -ForegroundColor $Gray
    $tempFile = "temp_structure.sql"
    
    $result = & $mysqldumpCmd -h $DBHost -u $User $(if($Password){"-p$Password"}) --no-data --skip-add-drop-table --skip-comments $SourceDB 2>&1
    $result | Out-File -FilePath $tempFile -Encoding utf8
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Impossible d'exporter la structure de $SourceDB"
        Write-Warning-Custom "Verifiez que la base $SourceDB existe"
        Remove-Item -Path $tempFile -ErrorAction SilentlyContinue
        return $false
    }
    
    Write-Host "    Import de la structure dans $TargetDB..." -ForegroundColor $Gray
    $result = Get-Content $tempFile | & $mysqlCmd -h $DBHost -u $User $(if($Password){"-p$Password"}) $TargetDB 2>&1
    Remove-Item -Path $tempFile -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Impossible d'importer la structure"
        Write-Host "    Erreur: $result" -ForegroundColor $Red
        return $false
    }
    
    # 3. Copier les donnees de reference
    Write-Host "    Copie des donnees de reference..." -ForegroundColor $Gray
    $referenceTables = @("alertes_types", "categories", "roles", "status")
    
    foreach ($table in $referenceTables) {
        $tempTable = "temp_$table.sql"
        $dumpResult = & $mysqldumpCmd -h $DBHost -u $User $(if($Password){"-p$Password"}) --no-create-info --skip-add-locks --skip-comments $SourceDB $table 2>&1
        $dumpResult | Out-File -FilePath $tempTable -Encoding utf8
        
        if ($LASTEXITCODE -eq 0) {
            Get-Content $tempTable | & $mysqlCmd -h $DBHost -u $User $(if($Password){"-p$Password"}) $TargetDB 2>&1 | Out-Null
            Write-Host "        - $table copie" -ForegroundColor $Gray
        }
        Remove-Item -Path $tempTable -ErrorAction SilentlyContinue
    }
    
    Write-Success "Base de donnees de test prete!"
    Write-Host "        Source: $SourceDB" -ForegroundColor $Gray
    Write-Host "        Cible: $TargetDB" -ForegroundColor $Gray
    return $true
}

# ========================================
# TESTS
# ========================================

function Run-IntegrationTests {
    Write-Step "Lancement des tests d'integration..."
    
    $env:NODE_OPTIONS = "--experimental-vm-modules"
    npm test -- --testPathPattern=integration --verbose
    
    return $LASTEXITCODE -eq 0
}

# ========================================
# ORCHESTRATION PRINCIPALE
# ========================================

Write-Host "`n================================================" -ForegroundColor $Cyan
Write-Host "   GESTIONNAIRE DB DE TEST - ClubManager" -ForegroundColor $Cyan
Write-Host "================================================" -ForegroundColor $Cyan

# Detection de MySQL
if (-not (Find-MySQL)) {
    Write-Host "`nInstallation requise:" -ForegroundColor $Yellow
    Write-Host "  1. Installez XAMPP: https://www.apachefriends.org/" -ForegroundColor $White
    Write-Host "  2. Ou MySQL Server: https://dev.mysql.com/downloads/" -ForegroundColor $White
    exit 1
}

# Execution selon l'action
switch ($Action) {
    "start" {
        Start-MySQLService
    }
    "stop" {
        Stop-MySQLService
    }
    "setup" {
        if (-not (Test-MySQLConnection)) {
            Start-MySQLService
        }
        Setup-TestDatabase
    }
    "reset" {
        if (-not (Test-MySQLConnection)) {
            Start-MySQLService
        }
        Setup-TestDatabase
    }
    "run-tests" {
        if (-not (Test-MySQLConnection)) {
            Start-MySQLService
        }
        Run-IntegrationTests
    }
    "all" {
        # Workflow complet
        if (-not (Test-MySQLConnection)) {
            if (-not (Start-MySQLService)) {
                Write-Host "`nMySQL n'a pas pu etre demarre automatiquement." -ForegroundColor $Yellow
                Write-Host "Veuillez demarrer MySQL manuellement et relancer ce script." -ForegroundColor $Yellow
                exit 1
            }
        }
        
        if (Setup-TestDatabase) {
            Write-Host "`n" -NoNewline
            $response = Read-Host "Lancer les tests d'integration maintenant? (O/n)"
            if ($response -ne "n" -and $response -ne "N") {
                Run-IntegrationTests
            }
        }
    }
}

Write-Host "`n================================================" -ForegroundColor $Cyan
Write-Host "Commandes disponibles:" -ForegroundColor $Gray
Write-Host "  .\manage-test-db.ps1 start       # Demarrer MySQL" -ForegroundColor $White
Write-Host "  .\manage-test-db.ps1 stop        # Arreter MySQL" -ForegroundColor $White
Write-Host "  .\manage-test-db.ps1 setup       # Configurer la DB de test" -ForegroundColor $White
Write-Host "  .\manage-test-db.ps1 reset       # Reinitialiser la DB de test" -ForegroundColor $White
Write-Host "  .\manage-test-db.ps1 run-tests   # Lancer les tests" -ForegroundColor $White
Write-Host "  .\manage-test-db.ps1 all         # Tout faire (par defaut)" -ForegroundColor $White
Write-Host "================================================`n" -ForegroundColor $Cyan
