# API GraphQL - ClubManager

## 🚀 Démarrage

### Développement
```bash
npm run dev
```

### Production
```bash
npm run start:graphql
```

Le serveur GraphQL sera disponible à : `http://localhost:4000/graphql`

## 📊 GraphiQL

L'interface GraphiQL est disponible automatiquement sur `/graphql` pour tester vos queries et mutations.

## 🔧 Queries Disponibles

### Health Check
```graphql
query {
  health
}
```

### Utilisateurs
```graphql
# Lister les utilisateurs
query {
  users(take: 10, skip: 0) {
    id
    nom
    prenom
    email
    genre {
      genre_name
    }
    grade {
      grade_id
    }
  }
}

# Un utilisateur spécifique
query {
  user(id: 1) {
    id
    nom
    prenom
    email
    inscriptions {
      id
      date_inscription
      cours {
        date_cours
        type_cours
      }
    }
  }
}
```

### Cours
```graphql
# Lister les cours
query {
  courses(take: 10) {
    id
    date_cours
    type_cours
    heure_debut
    heure_fin
    cours_recurrent {
      jour_semaine
    }
  }
}

# Un cours spécifique
query {
  course(id: 1) {
    id
    type_cours
    inscriptions {
      user {
        nom
        prenom
      }
    }
  }
}
```

### Articles (Magasin)
```graphql
# Lister les articles
query {
  articles(take: 10) {
    id
    nom
    description
    prix
    categorie {
      nom
    }
    stocks {
      quantite_disponible
      taille {
        taille
      }
    }
  }
}

# Un article spécifique
query {
  article(id: 1) {
    id
    nom
    prix
    stocks {
      quantite_disponible
      taille {
        taille
      }
    }
  }
}
```

## 🔐 Mutations (À venir)

```graphql
# Inscription
mutation {
  register(input: {
    nom: "Doe"
    prenom: "John"
    email: "john@example.com"
    password: "SecurePassword123"
  }) {
    token
    user {
      id
      email
    }
  }
}

# Connexion
mutation {
  login(email: "john@example.com", password: "SecurePassword123") {
    token
    user {
      id
      email
    }
  }
}
```

## 📝 Structure

```
src/
├── graphql/
│   └── schema.ts          # Schéma GraphQL (types + resolvers)
├── infrastructure/
│   └── database/
│       └── prisma-client.ts  # Client Prisma singleton
└── graphql-server.ts      # Serveur Express + GraphQL Yoga
```

## 🎯 Prochaines Étapes

- [ ] Implémenter authentification JWT
- [ ] Ajouter mutations CRUD pour chaque module
- [ ] Ajouter subscriptions WebSocket
- [ ] Implémenter DataLoader pour optimiser N+1 queries
- [ ] Ajouter pagination Relay-style
- [ ] Tests unitaires des resolvers
- [ ] Rate limiting et query complexity

## 🔗 Technologies

- **GraphQL Yoga** - Serveur GraphQL moderne
- **Prisma** - ORM type-safe
- **TypeScript** - Type safety
- **Express** - Framework web
