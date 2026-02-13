# 📁 Tests HTTP pour ClubManager API

Ce dossier contient tous les fichiers de tests HTTP pour l'API ClubManager (GraphQL + Stripe REST).

## 📋 Table des Matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Démarrage Rapide](#démarrage-rapide)
- [Fichiers Disponibles](#fichiers-disponibles)
- [Structure des Tests](#structure-des-tests)
- [Variables](#variables)
- [Exemples d'Usage](#exemples-dusage)
- [Bonnes Pratiques](#bonnes-pratiques)

---

## 🔧 Prérequis

### Extension VS Code
- **REST Client** par Huachao Mao
  - [Installer depuis le Marketplace](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

### API en cours d'exécution
```bash
cd api
npm run dev
```

L'API doit être accessible sur `http://localhost:4000`

---

## 📦 Installation

1. **Ouvrir le projet dans VS Code**
   ```bash
   code ClubManager
   ```

2. **Installer l'extension REST Client**
   - Ouvrir les Extensions (Ctrl+Shift+X)
   - Rechercher "REST Client"
   - Installer

3. **Démarrer l'API**
   ```bash
   cd api
   npm run dev
   ```

---

## 🚀 Démarrage Rapide

### 1. Configurer les variables (00-config.http)

Ouvrir `00-config.http` et vérifier les variables :
```http
@graphqlEndpoint = http://localhost:4000/graphql
@token = YOUR_TOKEN_HERE
@adminToken = YOUR_ADMIN_TOKEN_HERE
```

### 2. S'authentifier (auth.http)

Ouvrir `auth.http` et exécuter la requête de login :
- Cliquer sur **"Send Request"** au-dessus de la requête
- Ou cliquer droit → **"Send Request"**
- Ou utiliser le raccourci `Ctrl+Alt+R` (Windows/Linux) ou `Cmd+Alt+R` (Mac)

### 3. Copier le token

Dans la réponse, copier le `token` :
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 4. Mettre à jour le token dans 00-config.http

Remplacer `YOUR_TOKEN_HERE` par le token copié :
```http
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Tester les autres routes

Maintenant vous pouvez tester n'importe quelle requête dans les autres fichiers !

---

## 📂 Fichiers Disponibles

| Fichier | Module | Type | Description |
|---------|--------|------|-------------|
| **00-config.http** | Configuration | N/A | Variables globales et configuration |
| **auth.http** | Authentification | GraphQL | Login, Register, Password Reset |
| **compte.http** | Compte | GraphQL | Gestion du profil utilisateur |
| **commandes.http** | Commandes | GraphQL | Gestion des commandes/achats |
| **confirmation.http** | Inscriptions | GraphQL | Inscriptions et réservations cours |
| **cours.http** | Cours | GraphQL | Gestion des cours et planning |
| **informations.http** | Informations | GraphQL | Actualités et annonces |
| **alertes.http** | Alertes | GraphQL | Système d'alertes et notifications |
| **magasin.http** | Magasin | GraphQL | Articles et stock boutique |
| **paiements.http** | Paiements | GraphQL | Historique des paiements |
| **professeurs.http** | Professeurs | GraphQL | Gestion des professeurs |
| **statistiques.http** | Statistiques | GraphQL | Statistiques et rapports |
| **utilisateurs.http** | Utilisateurs | GraphQL | Gestion des utilisateurs (Admin) |
| **verification.http** | Vérification | GraphQL | Vérification de comptes |
| **stripe.http** | Stripe | REST + GraphQL | Webhooks et paiements Stripe |
| **participants.http** | Participants | GraphQL | Gestion des participants aux cours |

---

## 🏗️ Structure des Tests

Chaque fichier suit cette structure :

```http
### ============================================
### NOM DU MODULE
### ============================================

### Variables locales
@variable = valeur

### ============================================
### QUERIES (lectures)
### ============================================

### 1. Nom de la query
POST {{graphqlEndpoint}}
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "query": "query { ... }"
}

### ============================================
### MUTATIONS (écritures)
### ============================================

### 2. Nom de la mutation
POST {{graphqlEndpoint}}
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "query": "mutation { ... }"
}

### ============================================
### TESTS D'ERREURS
### ============================================

### 3. Test d'erreur spécifique
# Description de l'erreur attendue

### ============================================
### SCÉNARIOS DE TEST
### ============================================

### 4. Workflow complet
# Étape par étape

### ============================================
### NOTES
### ============================================
# Documentation et informations utiles
```

---

## 🔑 Variables

### Variables Globales (00-config.http)

```http
# Endpoints
@baseUrl = http://localhost:4000
@graphqlEndpoint = {{baseUrl}}/graphql

# Authentification
@token = YOUR_TOKEN_HERE
@adminToken = YOUR_ADMIN_TOKEN_HERE
@userToken = YOUR_USER_TOKEN_HERE

# IDs de test
@userId = 1
@adminId = 1
@commandeId = 1
@coursId = 1
# ... etc
```

### Variables Locales (dans chaque fichier)

Les fichiers individuels peuvent définir leurs propres variables :

```http
### Variables
@email = user@clubmanager.com
@password = Password123!
```

### Utilisation des Variables

```http
# Définir une variable
@myVar = valeur

# Utiliser une variable
POST {{graphqlEndpoint}}
Authorization: Bearer {{token}}

{
  "variables": {
    "id": {{userId}}
  }
}
```

---

## 💡 Exemples d'Usage

### Exemple 1 : Login Simple

**Fichier : auth.http**

```http
### Login utilisateur normal
POST {{graphqlEndpoint}}
Content-Type: application/json

{
  "query": "mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id email nom prenom role } } }",
  "variables": {
    "email": "user@clubmanager.com",
    "password": "User123!"
  }
}
```

**Cliquer sur "Send Request"** → Copier le token

---

### Exemple 2 : Requête Authentifiée

**Fichier : compte.http**

```http
### Obtenir mon profil
POST {{graphqlEndpoint}}
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "query": "query MonCompte { monCompte { id email nom prenom telephone role } }"
}
```

---

### Exemple 3 : Mutation avec Variables

**Fichier : commandes.http**

```http
### Créer une commande
POST {{graphqlEndpoint}}
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "query": "mutation CreerCommande($input: CreerCommandeInput!) { creerCommande(input: $input) { id montant_total statut } }",
  "variables": {
    "input": {
      "articles": [
        {
          "article_id": 1,
          "quantite": 2,
          "prix_unitaire": 29.99
        }
      ],
      "adresse_livraison": "123 Rue Example"
    }
  }
}
```

---

### Exemple 4 : Webhook Stripe (REST)

**Fichier : stripe.http**

```http
### Simuler un paiement réussi
POST {{stripeWebhookEndpoint}}
Content-Type: application/json
Stripe-Signature: t=1234567890,v1=mock_signature

{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_test123",
      "amount": 2999,
      "status": "succeeded"
    }
  }
}
```

---

## ✅ Bonnes Pratiques

### 1. **Toujours commencer par auth.http**
- Obtenez un token valide avant de tester d'autres routes
- Mettez à jour le token dans `00-config.http`

### 2. **Utilisez les variables**
- Ne hardcodez pas les valeurs
- Définissez des variables réutilisables
- Mettez à jour les IDs après création

### 3. **Suivez les workflows**
- Les sections "SCÉNARIOS DE TEST" montrent des workflows complets
- Suivez l'ordre des étapes pour tester des processus complets

### 4. **Testez les erreurs**
- Utilisez les sections "TESTS D'ERREURS"
- Vérifiez que les permissions fonctionnent
- Testez les cas limites

### 5. **Organisez vos tokens**
- `@token` : utilisateur normal
- `@adminToken` : administrateur
- `@userToken` : autre utilisateur (pour tester les permissions)

### 6. **Commentez vos modifications**
- Ajoutez des commentaires pour vos tests personnalisés
- Documentez les valeurs de test spécifiques

### 7. **Créez des variables pour les IDs créés**
```http
### Créer un cours
# @name creerCours
POST {{graphqlEndpoint}}
...

### Utiliser l'ID du cours créé
@coursId = {{creerCours.response.body.data.creerCours.id}}
```

---

## 🐛 Dépannage

### L'API ne répond pas
```bash
# Vérifier que l'API est démarrée
cd api
npm run dev

# Vérifier que le port 4000 est libre
netstat -ano | findstr :4000  # Windows
lsof -i :4000                  # Mac/Linux
```

### Token expiré
```
Error: "Token expired" ou "Unauthorized"
```
**Solution** : Re-login dans `auth.http` et mettre à jour le token

### CORS Error
```
Error: Access to fetch blocked by CORS policy
```
**Solution** : Vérifier la configuration CORS dans l'API (normalement OK en dev)

### Erreur de syntaxe GraphQL
```
Error: Syntax Error
```
**Solution** : Vérifier :
- Les accolades sont bien fermées
- Les guillemets sont corrects
- Les virgules entre les champs

### Variable non définie
```
Error: Variable not defined
```
**Solution** : Vérifier que la variable est définie en haut du fichier ou dans `00-config.http`

---

## 📚 Ressources

### Documentation
- [GraphQL](https://graphql.org/learn/)
- [REST Client Extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- [Stripe API](https://stripe.com/docs/api)

### API ClubManager
- **Endpoint GraphQL** : `http://localhost:4000/graphql`
- **Introspection** : Utilisez `00-config.http` pour voir le schéma complet
- **Documentation** : Voir `/api/docs/` (si disponible)

---

## 🎯 Workflows Recommandés

### Workflow 1 : Nouvel Utilisateur
1. **auth.http** → Register
2. **verification.http** → Vérifier email (si activé)
3. **compte.http** → Compléter profil
4. **cours.http** → Voir cours disponibles
5. **confirmation.http** → S'inscrire à un cours

### Workflow 2 : Achat dans la Boutique
1. **auth.http** → Login
2. **magasin.http** → Parcourir articles
3. **commandes.http** → Créer commande
4. **stripe.http** → Créer payment intent
5. **stripe.http** → Simuler webhook de succès
6. **commandes.http** → Vérifier statut commande

### Workflow 3 : Admin - Gérer les Alertes
1. **auth.http** → Login admin
2. **alertes.http** → Voir dashboard
3. **alertes.http** → Détecter alertes
4. **alertes.http** → Résoudre alertes
5. **utilisateurs.http** → Contacter utilisateurs concernés

### Workflow 4 : Professeur - Gérer un Cours
1. **auth.http** → Login professeur
2. **cours.http** → Créer cours
3. **cours.http** → Publier cours
4. **confirmation.http** → Voir inscriptions
5. **participants.http** → Gérer participants

---

## 🔐 Sécurité

### ⚠️ IMPORTANT - Ne JAMAIS commiter :
- Tokens JWT réels
- Clés API Stripe
- Mots de passe réels
- Données personnelles réelles

### Variables sensibles à protéger :
```http
# ❌ NE PAS FAIRE
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSw...  # Token réel

# ✅ FAIRE
@token = YOUR_TOKEN_HERE  # Placeholder
```

### En production :
- Utilisez des fichiers `.env` pour les secrets
- Ajoutez `*.http` au `.gitignore` si nécessaire
- Utilisez des tokens de test uniquement

---

## 🤝 Contribution

Pour ajouter de nouveaux tests :

1. **Suivre la structure existante**
   - Sections claires (Queries / Mutations / Tests / Scénarios / Notes)
   - Commentaires descriptifs
   - Numérotation des requêtes

2. **Documenter les nouvelles routes**
   - Ajouter une ligne dans la table "Fichiers Disponibles"
   - Expliquer les paramètres requis
   - Donner des exemples de valeurs

3. **Tester avant de commiter**
   - Vérifier que toutes les requêtes fonctionnent
   - Tester les cas d'erreur
   - Vérifier les permissions

---

## 📞 Support

En cas de problème :

1. **Vérifier la console de l'API** : `cd api && npm run dev`
2. **Consulter les logs** : Voir les erreurs dans le terminal
3. **Relire la documentation** : Ce README + commentaires dans les fichiers
4. **Contacter l'équipe** : Créer une issue GitHub

---

**Happy Testing! 🚀**

---

*Dernière mise à jour : 2024-12-13*
*Version API : 1.0.0*
*GraphQL Endpoint : http://localhost:4000/graphql*