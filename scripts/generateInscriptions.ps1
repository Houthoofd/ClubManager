# Remonter d'un niveau pour vérifier si le dossier 'tables' existe
$tablesPath = "../tables"

# Vérifier si le dossier 'tables' existe au niveau supérieur
if (Test-Path -Path $tablesPath) {
    # Dossier 'tables' existe, créer le fichier SQL dans ce dossier
    $outputFile = "../tables/fake-data-inscription.sql"
} else {
    # Dossier 'tables' n'existe pas, utiliser le fichier par défaut dans le répertoire courant
    $outputFile = "fake-data-inscription.sql"
}

# URL de l'API pour récupérer les dates de cours
$coursApiUrl = 'http://localhost:3000/cours'

# Nombre d'utilisateurs et de cours
$numUtilisateurs = 152
$numCours = 417

# Récupérer les dates de cours via une requête HTTP
function Get-CoursDates {
    $response = Invoke-RestMethod -Uri $coursApiUrl -Method Get
    return $response
}

# Fonction pour générer un nombre aléatoire dans une plage donnée
function Get-RandomInt {
    param ($min, $max)
    return Get-Random -Minimum $min -Maximum ($max + 1)
}

# Fonction pour formater la date au format 'yyyy/mm/dd'
function Format-Date {
    param ($dateString)

    # Convertir la chaîne de date en objet DateTime
    $date = [datetime]::Parse($dateString)

    # Formater la date au format 'yyyy/MM/dd'
    return $date.ToString('yyyy/MM/dd')
}

# Récupérer les dates de cours depuis l'API
$coursDates = Get-CoursDates

# Vérifier si on a bien des données
if ($coursDates -eq $null -or $coursDates.Count -eq 0) {
    Write-Host "Erreur : Aucune donnée de cours récupérée."
    exit
}

# Créer le contenu SQL
$sqlContent = ""

# Boucle pour générer les instructions d'insertion SQL pour tous les utilisateurs et tous les cours
for ($utilisateurId = 1; $utilisateurId -le $numUtilisateurs; $utilisateurId++) {
    for ($coursId = 1; $coursId -le $numCours; $coursId++) {
        $randomCours = $coursDates | Get-Random               # Choisir un cours aléatoire parmi ceux récupérés

        # Extraire et formater la date de cours
        $dateInscription = Format-Date -dateString $randomCours.date_cours

        $statusId = Get-RandomInt -min 0 -max 1              # Génère un status_id (0 ou 1)

        # Générer l'instruction SQL
        $sql = "INSERT INTO inscriptions (utilisateur_id, cours_id, date_inscription, status_id) VALUES ($utilisateurId, $coursId, '$dateInscription', $statusId);`r`n"
        $sqlContent += $sql
    }
}

# Créer le répertoire 'tables' si nécessaire (si le fichier sera enregistré dans 'tables')
# Pas besoin de créer le dossier, il existe déjà

# Écrire le contenu dans le fichier SQL
try {
    Set-Content -Path $outputFile -Value $sqlContent -Force
    Write-Host "Le fichier SQL a été créé avec succès : $outputFile"
} catch {
    Write-Host "Erreur lors de la création du fichier SQL : $_"
}

# Ajouter une commande pour garder le terminal ouvert
Read-Host -Prompt "Appuyez sur Entrée pour fermer le terminal"
