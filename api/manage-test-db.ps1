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
            # Essayer localhost puis 127.0.0.1
            if (Test-MySQLConnection -HostAddress "localhost") {
                Write-Success "Connexion MySQL OK"
                return $true
            } elseif (Test-MySQLConnection -HostAddress "127.0.0.1") {
                Write-Success "Connexion MySQL OK"
                return $true
            } else {
                Write-Warning-Custom "Service demarre mais connexion impossible"
                Write-Host "    Tentative de correction des permissions..." -ForegroundColor $Yellow
                if (Fix-MySQLPermissions) {
                    if (Test-MySQLConnection -HostAddress "localhost") {
                        Write-Success "Connexion MySQL OK apres correction"
                        return $true
                    } elseif (Test-MySQLConnection -HostAddress "127.0.0.1") {
                        Write-Success "Connexion MySQL OK apres correction"
                        return $true
                    }
                }
            }
        } else {
            Write-Host "    Tentative de demarrage du service..." -ForegroundColor $Gray
            try {
                Start-Service $service.Name -ErrorAction Stop
                Start-Sleep -Seconds 5

                # Verifier le statut apres demarrage
                $service.Refresh()
                Write-Host "    Nouveau statut: $($service.Status)" -ForegroundColor $Gray

                # Essayer localhost puis 127.0.0.1
                if (Test-MySQLConnection -HostAddress "localhost") {
                    Write-Success "Service MySQL demarre et connexion OK"
                    return $true
                } elseif (Test-MySQLConnection -HostAddress "127.0.0.1") {
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

    # Essayer via mysqld.exe directement
    Write-Host "    Recherche de XAMPP..." -ForegroundColor $Gray
    if ($script:mysqlPath) {
        $mysqldExe = Join-Path $script:mysqlPath "mysqld.exe"
        $myIniPath = Join-Path (Split-Path $script:mysqlPath -Parent) "bin\my.ini"

        if (Test-Path $mysqldExe) {
            Write-Host "    Demarrage de MySQL via mysqld.exe..." -ForegroundColor $Gray

            # Démarrer mysqld en arrière-plan
            if (Test-Path $myIniPath) {
                Start-Process -FilePath $mysqldExe -ArgumentList "--defaults-file=`"$myIniPath`"" -WindowStyle Hidden
            } else {
                Start-Process -FilePath $mysqldExe -WindowStyle Hidden
            }

            # Attendre que MySQL démarre
            Write-Host "    Attente du demarrage de MySQL..." -ForegroundColor $Gray
            for ($i = 1; $i -le 15; $i++) {
                Start-Sleep -Seconds 1
                Write-Host "    Tentative $i/15..." -ForegroundColor $Gray

                # Essayer d'abord localhost
                if (Test-MySQLConnection -HostAddress "localhost") {
                    Write-Success "MySQL demarre avec succes!"
                    return $true
                }

                # Essayer aussi 127.0.0.1
                if (Test-MySQLConnection -HostAddress "127.0.0.1") {
                    Write-Success "MySQL demarre avec succes!"
                    return $true
                }
            }

            Write-Warning-Custom "MySQL demarre mais ne repond pas encore"
        }
    }

    # Tester la connexion une derniere fois
    Write-Host "    Test final de connexion..." -ForegroundColor $Gray
    if (Test-MySQLConnection -HostAddress "localhost") {
        Write-Success "MySQL est accessible!"
        return $true
    }
    if (Test-MySQLConnection -HostAddress "127.0.0.1") {
        Write-Success "MySQL est accessible!"
        return $true
    }

    Write-Host ""
    Write-Host "    ============================================" -ForegroundColor $Red
    Write-Host "    MYSQL N'EST PAS ACCESSIBLE" -ForegroundColor $Red
    Write-Host "    ============================================" -ForegroundColor $Red

    # Afficher le guide de correction
    Fix-MySQLPermissions
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

    # Tuer tous les processus mysqld
    Write-Host "    Recherche de processus mysqld..." -ForegroundColor $Gray
    $mysqldProcesses = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
    if ($mysqldProcesses) {
        foreach ($proc in $mysqldProcesses) {
            Write-Host "    Arret du processus mysqld (PID: $($proc.Id))..." -ForegroundColor $Gray
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
        Write-Success "Processus mysqld arretes"
        return $true
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
    param([string]$HostAddress = $DBHost)

    try {
        # Construire le chemin complet vers mysql.exe
        $mysqlCmd = if ($script:mysqlPath) {
            Join-Path $script:mysqlPath "mysql.exe"
        } else {
            "mysql"
        }

        # Essayer d'abord avec l'hôte fourni
        $result = & $mysqlCmd -h $HostAddress -u $User $(if($Password){"-p$Password"}) -e "SELECT 1;" 2>&1
        $success = $LASTEXITCODE -eq 0

        if ($success) {
            Write-Host "    -> Connexion MySQL reussie sur $HostAddress" -ForegroundColor $Green
            # Mettre à jour $DBHost si une alternative a fonctionné
            if ($HostAddress -ne $DBHost) {
                $script:DBHost = $HostAddress
                Write-Host "    -> Utilisation de $HostAddress pour les connexions" -ForegroundColor $Yellow
            }
            return $true
        }

        # Si échec et que c'est "localhost", essayer 127.0.0.1
        if (-not $success -and $HostAddress -eq "localhost") {
            Write-Host "    -> Tentative avec 127.0.0.1..." -ForegroundColor $Gray
            $result = & $mysqlCmd -h "127.0.0.1" -u $User $(if($Password){"-p$Password"}) -e "SELECT 1;" 2>&1
            $success = $LASTEXITCODE -eq 0

            if ($success) {
                Write-Host "    -> Connexion MySQL reussie sur 127.0.0.1" -ForegroundColor $Green
                $script:DBHost = "127.0.0.1"
                Write-Host "    -> Utilisation de 127.0.0.1 pour les connexions" -ForegroundColor $Yellow
                return $true
            }
        }

        Write-Host "    -> Connexion MySQL echouee (code: $LASTEXITCODE)" -ForegroundColor $Red
        if ($result) {
            Write-Host "    -> Erreur: $result" -ForegroundColor $Red
        }

        return $false
    } catch {
        Write-Host "    -> Exception lors du test de connexion: $_" -ForegroundColor $Red
        return $false
    }
}

function Fix-MySQLPermissions {
    Write-Step "Guide de correction des permissions MySQL..."

    Write-Host ""
    Write-Host "    MySQL est demarre mais refuse les connexions." -ForegroundColor $Yellow
    Write-Host "    Utilisez phpMyAdmin pour corriger les permissions:" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "    METHODE 1 - Via phpMyAdmin (RECOMMANDE):" -ForegroundColor $Cyan
    Write-Host "    =========================================" -ForegroundColor $Cyan
    Write-Host "    1. Ouvrez XAMPP Control Panel" -ForegroundColor $White
    Write-Host "    2. Cliquez sur 'Admin' a cote de MySQL" -ForegroundColor $White
    Write-Host "       (Cela ouvre phpMyAdmin dans votre navigateur)" -ForegroundColor $Gray
    Write-Host "    3. Cliquez sur l'onglet 'SQL' en haut" -ForegroundColor $White
    Write-Host "    4. Copiez-collez ces commandes:" -ForegroundColor $White
    Write-Host ""
    Write-Host "       GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;" -ForegroundColor $Green
    Write-Host "       GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;" -ForegroundColor $Green
    Write-Host "       FLUSH PRIVILEGES;" -ForegroundColor $Green
    Write-Host ""
    Write-Host "    5. Cliquez sur 'Executer'" -ForegroundColor $White
    Write-Host "    6. Fermez phpMyAdmin" -ForegroundColor $White
    Write-Host "    7. Dans XAMPP: Stop puis Start MySQL" -ForegroundColor $White
    Write-Host "    8. Relancez ce script" -ForegroundColor $White
    Write-Host ""
    Write-Host "    METHODE 2 - Via Shell XAMPP:" -ForegroundColor $Cyan
    Write-Host "    ============================" -ForegroundColor $Cyan
    Write-Host "    1. Ouvrez XAMPP Control Panel" -ForegroundColor $White
    Write-Host "    2. Cliquez sur 'Shell' en bas" -ForegroundColor $White
    Write-Host "    3. Tapez: mysql -u root" -ForegroundColor $White
    Write-Host "    4. Si ca marche, tapez:" -ForegroundColor $White
    Write-Host "       GRANT ALL ON *.* TO 'root'@'localhost' WITH GRANT OPTION;" -ForegroundColor $Green
    Write-Host "       GRANT ALL ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;" -ForegroundColor $Green
    Write-Host "       FLUSH PRIVILEGES;" -ForegroundColor $Green
    Write-Host "       exit;" -ForegroundColor $Green
    Write-Host ""
    Write-Host "    METHODE 3 - Reinstaller XAMPP (derniere option):" -ForegroundColor $Cyan
    Write-Host "    ===============================================" -ForegroundColor $Cyan
    Write-Host "    Si rien ne fonctionne, sauvegardez vos bases et reinstallez XAMPP" -ForegroundColor $White
    Write-Host ""

    # Ouvrir phpMyAdmin automatiquement
    Write-Host "    Voulez-vous ouvrir phpMyAdmin maintenant? (O/n): " -ForegroundColor $Yellow -NoNewline
    $response = Read-Host

    if ($response -ne "n" -and $response -ne "N") {
        Write-Host "    Ouverture de phpMyAdmin..." -ForegroundColor $Gray
        Start-Process "http://localhost/phpmyadmin"
        Start-Sleep -Seconds 2
    }

    return $false
}

# ========================================
# CONFIGURATION DE LA DB DE TEST
# ========================================

function Setup-TestDatabase {
    Write-Step "Configuration de la base de donnees de test..."

    # Verifier la connexion avec localhost puis 127.0.0.1
    $connected = $false
    if (Test-MySQLConnection -HostAddress "localhost") {
        $connected = $true
    } elseif (Test-MySQLConnection -HostAddress "127.0.0.1") {
        $connected = $true
    }

    if (-not $connected) {
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
        $connected = (Test-MySQLConnection -HostAddress "localhost") -or (Test-MySQLConnection -HostAddress "127.0.0.1")
        if (-not $connected) {
            Start-MySQLService
        }
        Setup-TestDatabase
    }
    "reset" {
        $connected = (Test-MySQLConnection -HostAddress "localhost") -or (Test-MySQLConnection -HostAddress "127.0.0.1")
        if (-not $connected) {
            Start-MySQLService
        }
        Setup-TestDatabase
    }
    "run-tests" {
        $connected = (Test-MySQLConnection -HostAddress "localhost") -or (Test-MySQLConnection -HostAddress "127.0.0.1")
        if (-not $connected) {
            Start-MySQLService
        }
        Run-IntegrationTests
    }
    "all" {
        # Workflow complet
        $connected = (Test-MySQLConnection -HostAddress "localhost") -or (Test-MySQLConnection -HostAddress "127.0.0.1")
        if (-not $connected) {
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
