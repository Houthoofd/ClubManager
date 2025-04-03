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

# Boucle pour générer les instructions d'insertion SQL
for ($i = 1; $i -le 152; $i++) {
    # Afficher un message pour indiquer quel utilisateur est en cours de traitement
    Write-Host "Traitement de l'utilisateur $i sur 152..."

    for ($j = 1; $j -le 417; $j++) {
        # Génère un utilisateur_id et cours_id
        $utilisateurId = $i
        $coursId = $j

        # Choisir un cours aléatoire parmi ceux récupérés
        $randomCours = $coursDates | Get-Random

        # Extraire et formater la date de cours
        $dateInscription = Format-Date -dateString $randomCours.date_cours

        # Ici on remplace la génération aléatoire du status_id par NULL
        $statusId = "NULL"

        # Générer l'instruction SQL
        $sql = "INSERT INTO inscriptions (utilisateur_id, cours_id, date_inscription, status_id) VALUES ($utilisateurId, $coursId, '$dateInscription', $statusId);`r`n"
        $sqlContent += $sql
    }
}

# Écrire le contenu dans le fichier SQL
try {
    Set-Content -Path $outputFile -Value $sqlContent -Force
    Write-Host "Le fichier SQL a été créé avec succès : $outputFile"
} catch {
    Write-Host "Erreur lors de la création du fichier SQL : $_"
}

# Ajouter une commande pour garder le terminal ouvert
Read-Host -Prompt "Appuyez sur Entrée pour fermer le terminal"
