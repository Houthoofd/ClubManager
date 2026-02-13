# 🧪 Tests HTTP - ClubManager API

Fichiers de tests HTTP pour l'API ClubManager (GraphQL + Stripe REST).

## 📁 Structure

```
http/
├── README.md           # Ce fichier
├── dev/                # Tests pour environnement de développement
│   ├── README.md       # Documentation détaillée
│   ├── 00-config.http  # Configuration et variables globales
│   ├── auth.http       # Authentification
│   ├── compte.http     # Gestion du compte utilisateur
│   ├── commandes.http  # Commandes/achats
│   ├── confirmation.http # Inscriptions et réservations
│   ├── cours.http      # Gestion des cours
│   ├── informations.http # Actualités et annonces
│   ├── alertes.http    # Système d'alertes
│   ├── magasin.http    # Articles et stock
│   ├── paiements.http  # Historique des paiements
│   ├── professeurs.http # Gestion des professeurs
│   ├── statistiques.http # Statistiques et rapports
│   ├── utilisateurs.http # Gestion des utilisateurs
│   ├── verification.http # Vérification de comptes
│   ├── participants.http # Participants aux cours
│   └── stripe.http     # Webhooks et paiements Stripe
└── prod/               # Tests pour production (à configurer)
```

## 🚀 Démarrage Rapide

### 1. Prérequis

- **VS Code** avec l'extension **REST Client** installée
- **API démarrée** : `cd api && npm run dev`
- API accessible sur `http://localhost:4000`

### 2. Premiers pas

1. **Ouvrir** `dev/auth.http`
2. **Exécuter** la requête de login (clic sur "Send Request")
3. **Copier** le token JWT retourné
4. **Mettre à jour** le token dans `dev/00-config.http`
5. **Tester** les autres fichiers !

### 3. Ordre recommandé

```
1. dev/00-config.http   → Voir la configuration
2. dev/auth.http        → S'authentifier
3. dev/compte.http      → Tester son profil
4. dev/*                → Tester les autres modules
```

## 📖 Documentation

Pour la documentation complète, consultez :
- **[dev/README.md](dev/README.md)** - Documentation détaillée des tests

## 🎯 Modules Disponibles

| Module | Fichier | Type | Description |
|--------|---------|------|-------------|
| Configuration | `00-config.http` | N/A | Variables globales |
| Authentification | `auth.http` | GraphQL | Login, Register, Reset Password |
| Compte | `compte.http` | GraphQL | Profil utilisateur |
| Commandes | `commandes.http` | GraphQL | Gestion des commandes |
| Inscriptions | `confirmation.http` | GraphQL | Inscriptions aux cours |
| Cours | `cours.http` | GraphQL | Catalogue et planning |
| Informations | `informations.http` | GraphQL | Actualités du club |
| Alertes | `alertes.http` | GraphQL | Système d'alertes |
| Magasin | `magasin.http` | GraphQL | Boutique en ligne |
| Paiements | `paiements.http` | GraphQL | Historique paiements |
| Professeurs | `professeurs.http` | GraphQL | Gestion professeurs |
| Statistiques | `statistiques.http` | GraphQL | Rapports et stats |
| Utilisateurs | `utilisateurs.http` | GraphQL | Admin utilisateurs |
| Vérification | `verification.http` | GraphQL | Vérification comptes |
| Participants | `participants.http` | GraphQL | Participants cours |
| Stripe | `stripe.http` | REST + GraphQL | Paiements Stripe |

## 💡 Exemples

### Login et première requête

```http
### 1. Login (auth.http)
POST http://localhost:4000/graphql
Content-Type: application/json

{
  "query": "mutation { login(email: \"user@test.com\", password: \"pass123\") { token } }"
}

### 2. Utiliser le token (compte.http)
POST http://localhost:4000/graphql
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "query": "query { monCompte { id email nom prenom } }"
}
```

## 🔑 Variables

Les variables sont définies dans `dev/00-config.http` :

```http
@graphqlEndpoint = http://localhost:4000/graphql
@token = YOUR_TOKEN_HERE
@adminToken = YOUR_ADMIN_TOKEN_HERE
@userId = 1
```

## 🛠️ Technologies

- **GraphQL** - Pour toutes les opérations de l'API
- **REST** - Uniquement pour les webhooks Stripe
- **REST Client** - Extension VS Code pour exécuter les requêtes

## 📚 Ressources

- [Documentation complète](dev/README.md)
- [GraphQL API](http://localhost:4000/graphql)
- [REST Client Extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

## 🔐 Sécurité

⚠️ **IMPORTANT** : Ne commitez JAMAIS :
- Tokens JWT réels
- Clés API Stripe
- Mots de passe réels
- Données personnelles

Utilisez des placeholders comme `YOUR_TOKEN_HERE` dans les fichiers versionnés.

## 🤝 Contribution

Pour ajouter de nouveaux tests :
1. Créer un fichier `module.http` dans `dev/`
2. Suivre la structure des fichiers existants
3. Documenter dans les README
4. Tester toutes les requêtes

## 📞 Support

- Consulter [dev/README.md](dev/README.md) pour la documentation détaillée
- Vérifier que l'API est démarrée : `cd api && npm run dev`
- Consulter les logs de l'API en cas d'erreur

---

**Happy Testing! 🚀**

*Environnement : Development*  
*API Endpoint : http://localhost:4000/graphql*  
*Version : 1.0.0*