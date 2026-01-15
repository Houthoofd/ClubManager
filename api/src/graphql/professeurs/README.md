# Module GraphQL Professeurs

Documentation du module GraphQL pour la gestion des professeurs.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Installation](#installation)
- [Types GraphQL](#types-graphql)
- [Queries](#queries)
- [Mutations](#mutations)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Gestion des erreurs](#gestion-des-erreurs)

## Vue d'ensemble

Ce module expose une API GraphQL complète pour la gestion des professeurs, incluant :
- Consultation des professeurs et de leurs informations
- Promotion et rétrogradation d'utilisateurs
- Gestion des cours assignés aux professeurs
- Recherche et filtrage de professeurs
- Mise à jour des informations professeur/utilisateur

## Installation

### Intégration dans le serveur GraphQL

```typescript
import { professeursTypeDefs, professeursResolvers } from './graphql/professeurs';

// Ajouter les typeDefs
const typeDefs = [
  // ... autres typeDefs
  professeursTypeDefs,
];

// Merger les resolvers
const resolvers = mergeResolvers([
  // ... autres resolvers
  professeursResolvers,
]);
```

## Types GraphQL

### Types principaux

#### Professeur
```graphql
type Professeur {
  id: Int!
  nom: String!
  prenom: String!
  nom_utilisateur: String!
  email: String!
  genre_id: Int!
  date_naissance: String!
  grade_id: Int!
}
```

#### ProfesseurComplet
```graphql
type ProfesseurComplet {
  id: Int!
  nom: String!
  prenom: String!
  nom_utilisateur: String!
  email: String!
  genre_id: Int!
  date_naissance: String!
  grade_id: Int!
  first_name: String
  last_name: String
  date_of_birth: String
  status_id: Int!
  created_at: String
  updated_at: String
}
```

#### CoursRecurrent
```graphql
type CoursRecurrent {
  cours_recurrent_id: Int!
  type_cours: String!
  jour_semaine: Int!         # 0=Dimanche, 1=Lundi, ..., 6=Samedi
  heure_debut: String!
  heure_fin: String!
  est_recurrent_actif: Boolean!
  professeur_id: Int!
  professeur_nom: String!
  professeur_prenom: String!
}
```

#### PlanningCours
```graphql
type PlanningCours {
  cours: [CoursRecurrent!]!
  professeur: ProfesseurInfo
}
```

### Types de résultat

#### ConfirmationResult
```graphql
type ConfirmationResult {
  isConfirm: Boolean!
  message: String!
}
```

#### VerifyResultWithData
```graphql
type VerifyResultWithData {
  isFind: Boolean!
  message: String!
  data: [Professeur!]
}
```

#### ProfesseursSearchResult
```graphql
type ProfesseursSearchResult {
  professeurs: [Professeur!]!
  total: Int!
}
```

## Queries

### professeurs
Récupère tous les professeurs.

```graphql
query {
  professeurs {
    isFind
    message
    data {
      id
      nom
      prenom
      email
      genre_id
      grade_id
    }
  }
}
```

### professeur
Récupère un professeur par son ID.

```graphql
query {
  professeur(id: 123) {
    id
    nom
    prenom
    email
    status_id
    created_at
    updated_at
  }
}
```

### planningCoursProfesseur
Récupère le planning des cours d'un professeur.

```graphql
query {
  planningCoursProfesseur(id: 123) {
    isFind
    message
    data {
      cours_recurrent_id
      type_cours
      jour_semaine
      heure_debut
      heure_fin
      est_recurrent_actif
      professeur_nom
      professeur_prenom
    }
  }
}
```

### rechercherProfesseurs
Recherche des professeurs par terme de recherche.

```graphql
query {
  rechercherProfesseurs(
    searchTerm: "dupont"
    limit: 20
    offset: 0
  ) {
    professeurs {
      id
      nom
      prenom
      email
    }
    total
  }
}
```

### compterProfesseurs
Compte le nombre total de professeurs.

```graphql
query {
  compterProfesseurs
}
```

### estProfesseur
Vérifie si un utilisateur est professeur.

```graphql
query {
  estProfesseur(id: 456)
}
```

### professeurACoursActifs
Vérifie si un professeur a des cours actifs.

```graphql
query {
  professeurACoursActifs(id: 123)
}
```

### compterCoursProfesseur
Compte les cours d'un professeur.

```graphql
query {
  compterCoursProfesseur(id: 123)
}
```

### verifierDependancesProfesseur
Vérifie les dépendances d'un professeur (cours récurrents et ponctuels).

```graphql
query {
  verifierDependancesProfesseur(id: 123) {
    coursCount
    coursPonctuelsCount
    hasDependencies
  }
}
```

### obtenirStatutUtilisateur
Obtient le statut d'un utilisateur.

```graphql
query {
  obtenirStatutUtilisateur(id: 123)
}
```

## Mutations

### ajouterProfesseur
Ajoute/promeut un utilisateur en professeur.

```graphql
mutation {
  ajouterProfesseur(input: { id: 456 }) {
    isConfirm
    message
  }
}
```

### ajouterProfesseursBatch
Ajoute/promeut plusieurs utilisateurs en professeurs.

```graphql
mutation {
  ajouterProfesseursBatch(input: { 
    utilisateurs: [456, 789, 101] 
  }) {
    isConfirm
    message
  }
}
```

### modifierStatutProfesseur
Modifie le statut d'un professeur.

```graphql
mutation {
  modifierStatutProfesseur(input: { 
    id: 123
    status_id: 5 
  }) {
    isConfirm
    message
  }
}
```

### retirerPromotionProfesseur
Retire la promotion d'un professeur (le rétrograde en utilisateur régulier).

```graphql
mutation {
  retirerPromotionProfesseur(id: 123) {
    isConfirm
    message
  }
}
```

**Note :** Cette mutation échoue si le professeur a des cours actifs.

### assignerProfesseurACours
Assigne un professeur à un cours récurrent.

```graphql
mutation {
  assignerProfesseurACours(
    coursId: 10
    professeurId: 123
  ) {
    isConfirm
    message
  }
}
```

### retirerProfesseurDuCours
Retire un professeur d'un cours récurrent.

```graphql
mutation {
  retirerProfesseurDuCours(
    coursId: 10
    professeurId: 123
  ) {
    isConfirm
    message
  }
}
```

### retirerProfesseurDeTousLesCours
Retire un professeur de tous ses cours récurrents.

```graphql
mutation {
  retirerProfesseurDeTousLesCours(professeurId: 123) {
    isConfirm
    message
  }
}
```

### mettreAJourUtilisateur
Met à jour les informations complètes d'un utilisateur/professeur.

```graphql
mutation {
  mettreAJourUtilisateur(
    id: 123
    input: {
      firstName: "Jean"
      lastName: "Dupont"
      email: "jean.dupont@example.com"
      genreId: 1
      dateOfBirth: "1980-05-15"
      gradeId: 5
    }
  ) {
    isConfirm
    message
  }
}
```

### mettreAJourEmail
Met à jour uniquement l'email d'un utilisateur.

```graphql
mutation {
  mettreAJourEmail(
    id: 123
    email: "nouveau.email@example.com"
  ) {
    isConfirm
    message
  }
}
```

### mettreAJourGrade
Met à jour uniquement le grade d'un utilisateur.

```graphql
mutation {
  mettreAJourGrade(
    id: 123
    gradeId: 6
  ) {
    isConfirm
    message
  }
}
```

## Exemples d'utilisation

### Exemple 1 : Lister tous les professeurs et leur planning

```graphql
query ListeProfesseursAvecPlanning {
  professeurs {
    isFind
    message
    data {
      id
      nom
      prenom
      email
    }
  }
}

# Puis pour chaque professeur :
query PlanningProfesseur($id: Int!) {
  planningCoursProfesseur(id: $id) {
    isFind
    data {
      type_cours
      jour_semaine
      heure_debut
      heure_fin
      est_recurrent_actif
    }
  }
}
```

### Exemple 2 : Promouvoir un utilisateur et l'assigner à un cours

```graphql
# Étape 1 : Vérifier que l'utilisateur n'est pas déjà professeur
query VerifierStatut($id: Int!) {
  estProfesseur(id: $id)
}

# Étape 2 : Promouvoir l'utilisateur
mutation PromouvoirUtilisateur($id: Int!) {
  ajouterProfesseur(input: { id: $id }) {
    isConfirm
    message
  }
}

# Étape 3 : Assigner à un cours
mutation AssignerACours($coursId: Int!, $professeurId: Int!) {
  assignerProfesseurACours(
    coursId: $coursId
    professeurId: $professeurId
  ) {
    isConfirm
    message
  }
}
```

### Exemple 3 : Retirer un professeur avec vérification

```graphql
# Étape 1 : Vérifier les dépendances
query VerifierDependances($id: Int!) {
  verifierDependancesProfesseur(id: $id) {
    coursCount
    coursPonctuelsCount
    hasDependencies
  }
}

# Étape 2 : Si des cours existent, les retirer d'abord
mutation RetirerCours($professeurId: Int!) {
  retirerProfesseurDeTousLesCours(professeurId: $professeurId) {
    isConfirm
    message
  }
}

# Étape 3 : Retirer la promotion
mutation RetirerPromotion($id: Int!) {
  retirerPromotionProfesseur(id: $id) {
    isConfirm
    message
  }
}
```

### Exemple 4 : Recherche et filtrage

```graphql
query RechercheProfesseurs($searchTerm: String!, $limit: Int, $offset: Int) {
  rechercherProfesseurs(
    searchTerm: $searchTerm
    limit: $limit
    offset: $offset
  ) {
    professeurs {
      id
      nom
      prenom
      email
      grade_id
    }
    total
  }
}
```

Variables :
```json
{
  "searchTerm": "dupont",
  "limit": 10,
  "offset": 0
}
```

### Exemple 5 : Batch promotion

```graphql
mutation PromouvoirPlusieurs($utilisateurs: [Int!]!) {
  ajouterProfesseursBatch(input: { 
    utilisateurs: $utilisateurs 
  }) {
    isConfirm
    message
  }
}
```

Variables :
```json
{
  "utilisateurs": [456, 789, 101, 202]
}
```

## Gestion des erreurs

### Erreurs communes

#### Utilisateur non trouvé
```graphql
mutation {
  ajouterProfesseur(input: { id: 99999 }) {
    isConfirm  # false
    message    # "L'utilisateur avec l'ID 99999 n'existe pas."
  }
}
```

#### Professeur déjà promu
```graphql
mutation {
  ajouterProfesseur(input: { id: 123 }) {
    isConfirm  # true
    message    # "Tous les utilisateurs sont déjà professeurs."
  }
}
```

#### Professeur a des cours actifs
```graphql
mutation {
  retirerPromotionProfesseur(id: 123) {
    isConfirm  # false
    message    # "Impossible de retirer la promotion: Le professeur a 5 cours actifs"
  }
}
```

#### Email invalide ou déjà utilisé
```graphql
mutation {
  mettreAJourEmail(id: 123, email: "existing@example.com") {
    isConfirm  # false
    message    # "Cet email est déjà utilisé par un autre utilisateur."
  }
}
```

### Gestion des erreurs côté client

```typescript
const [promouvoir] = useMutation(PROMOUVOIR_PROFESSEUR);

try {
  const { data } = await promouvoir({
    variables: { input: { id: 456 } }
  });
  
  if (data.ajouterProfesseur.isConfirm) {
    console.log('✅ Succès:', data.ajouterProfesseur.message);
  } else {
    console.error('❌ Erreur métier:', data.ajouterProfesseur.message);
  }
} catch (error) {
  console.error('❌ Erreur technique:', error);
}
```

## Permissions et Sécurité

**Note :** Les resolvers n'implémentent pas encore de vérification de permissions.
Il est recommandé d'ajouter des guards pour :
- Vérifier que l'utilisateur est authentifié
- Vérifier que l'utilisateur a les droits admin/professeur
- Logger les actions sensibles (promotion, rétrogradation)

### Exemple de guard (à implémenter)

```typescript
const requireAdmin = (next: any) => (root: any, args: any, context: GraphQLContext, info: any) => {
  if (!context.user || context.user.role !== 'admin') {
    throw new Error('Accès refusé: droits admin requis');
  }
  return next(root, args, context, info);
};

// Utilisation
ajouterProfesseur: requireAdmin(async (_, { input }, context) => {
  // ... logique
})
```

## Tests

### Exemple de test avec Apollo Client

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

describe('Professeurs GraphQL', () => {
  let client: ApolloClient<any>;

  beforeAll(() => {
    client = new ApolloClient({
      uri: 'http://localhost:4000/graphql',
      cache: new InMemoryCache(),
    });
  });

  it('devrait récupérer tous les professeurs', async () => {
    const { data } = await client.query({
      query: gql`
        query {
          professeurs {
            isFind
            data {
              id
              nom
              prenom
            }
          }
        }
      `,
    });

    expect(data.professeurs.isFind).toBe(true);
    expect(Array.isArray(data.professeurs.data)).toBe(true);
  });

  it('devrait promouvoir un utilisateur', async () => {
    const { data } = await client.mutate({
      mutation: gql`
        mutation {
          ajouterProfesseur(input: { id: 456 }) {
            isConfirm
            message
          }
        }
      `,
    });

    expect(data.ajouterProfesseur.isConfirm).toBe(true);
  });
});
```

## Architecture

Ce module GraphQL utilise le repository pattern pour accéder aux données :

```
GraphQL Resolver
      ↓
getProfesseursRepository()
      ↓
ProfesseursRepository (singleton)
      ↓
ReadRepository / WriteRepository / ValidationRepository
      ↓
MysqlConnector
      ↓
Database
```

## Liens

- [Documentation du module DB professeurs](../../db/clients/professeurs/README.md)
- [Architecture du module](../../db/clients/professeurs/docs/ARCHITECTURE.md)
- [Guide de migration](../../db/clients/professeurs/docs/MIGRATION.md)

## Support

Pour toute question ou problème :
1. Consultez ce README
2. Consultez la documentation du module DB
3. Contactez l'équipe de développement

---

**Version** : 2.0.0  
**Dernière mise à jour** : 2024-01-11