# Module Vérification - GraphQL

Module refactorisé pour la gestion des vérifications d'existence via GraphQL.

## Structure

verification/
├── index.ts                          # Export principal
├── core/
│   ├── resolvers/                    # Resolvers GraphQL
│   │   ├── index.ts
│   │   ├── verification.resolvers.ts
│   │   └── verification.typeDefs.ts
│   ├── services/                     # Logique métier
│   │   └── verification.service.ts
│   └── validators/                   # Schémas de validation
│       └── verification.schema.ts
├── __tests__/                        # Tests
│   ├── verification.test.ts          # Tests unitaires
│   └── verification.graphql.test.ts  # Tests GraphQL
└── INTEGRATION.example.ts            # Exemple d'intégration

## Utilisation

### 1. Intégration dans le schéma GraphQL

```typescript
import { createSchema } from "graphql-yoga";
import { prisma } from "../infrastructure/database/prisma-client.js";
import {
  verificationResolvers,
  verificationTypeDefs
} from "./routes/verification";

const schema = createSchema({
  typeDefs: [
    baseTypeDefs,
    verificationTypeDefs,
    // ... autres typeDefs
  ],
  resolvers: {
    Query: {
      ...verificationResolvers(prisma).Query,
      // ... autres resolvers
    },
    Mutation: {
      ...verificationResolvers(prisma).Mutation,
      // ... autres resolvers
    }
  }
});
```

### 2. Queries disponibles

- verificationHealth: VerificationHealthResult!
- verifierEmail(email: String!): VerificationResult!
- verifierNomUtilisateur(nom_utilisateur: String!): VerificationResult!
- verifierPrenom(prenom: String!): VerificationResult!
- verifierNom(nom: String!): VerificationResult!
- verifierPrenomNom(input: VerifierPrenomNomInput!): VerificationResult!
- verifierEmailPrenomNom(input: VerifierEmailPrenomNomInput!): VerificationResult!
- verifierPlanning(input: VerifierPlanningInput!): VerificationResult!
- verifierArticle(nom: String!): VerificationResult!
- verifierArticleCategorie(input: VerifierArticleCategorieInput!): VerificationResult!
- verifierProfesseurs(input: VerifierProfesseursInput!): VerifierProfesseursResult!

### 3. Exemple de query

```graphql
query {
  verifierEmail(email: "test@example.com") {
    exists
    message
  }
}
```

## Fonctionnalités

- Vérification Utilisateurs (email, nom, prénom, combinaisons)
- Vérification Planning (cours récurrents)
- Vérification Articles Magasin (nom, catégorie)
- Vérification Professeurs
- Health Check

## Tests

```bash
npm test verification.test.ts          # Tests unitaires
npm test verification.graphql.test.ts  # Tests GraphQL
```

## Architecture

- Services : Logique métier avec Prisma
- Resolvers : Couche GraphQL
- Validators : Schémas de validation
- Tests : Couverture >90%

## Base de données

Utilise Prisma ORM avec les tables :
- utilisateurs
- cours_recurrent
- articles
- professeurs

Voir INTEGRATION.example.ts pour plus de détails.
