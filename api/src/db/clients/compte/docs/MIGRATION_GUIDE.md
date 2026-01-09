# Guide de Migration - Module Compte V2

## 📋 Vue d'ensemble

Ce guide vous aidera à migrer votre code de l'ancienne architecture monolithique du module Compte vers la nouvelle architecture modulaire V2 avec GraphQL.

## 🎯 Pourquoi migrer ?

- ✅ **Code plus maintenable** : Architecture modulaire claire
- ✅ **Meilleure testabilité** : Mocking et tests unitaires simplifiés
- ✅ **GraphQL moderne** : API GraphQL complète
- ✅ **Performance** : Requêtes optimisées et typage strict
- ✅ **Sécurité** : Validation renforcée et gestion d'erreurs améliorée

## ⚠️ Compatibilité ascendante

**Bonne nouvelle** : La migration peut être progressive ! Les anciennes méthodes continuent de fonctionner via un layer de compatibilité.

## 🔄 Changements majeurs

### 1. Structure des imports

#### ❌ Ancien (V1 - deprecated)
```typescript
import { compte } from '@/db/clients/compte/compte';

// Utilisation
const user = await compte.findByName('John Doe');
```

#### ✅ Nouveau (V2 - recommandé)
```typescript
import { getCompteRepository } from '@/db/clients/compte/compte.repository';

// Utilisation
const compteRepo = getCompteRepository();
const user = await compteRepo.findByName('John Doe');
```

### 2. GraphQL (NOUVEAU)

La V2 introduit une API GraphQL complète :

```typescript
// Importer les définitions GraphQL
import { compteTypeDefs, compteResolvers } from '@/graphql/compte';
```

## 📖 Migration par cas d'usage

### Cas 1 : Lecture d'un utilisateur par ID

#### ❌ Ancien code
```typescript
import { compte } from './db/clients/compte/compte';

async function getUser(id: number) {
  const result = await compte.findById(id);
  if (!result.isFind) {
    throw new Error(result.message);
  }
  return result.data;
}
```

#### ✅ Nouveau code (Repository)
```typescript
import { getCompteRepository } from './db/clients/compte/compte.repository';

async function getUser(id: number) {
  const repo = getCompteRepository();
  const user = await repo.findById(id);
  
  if (!user) {
    throw new Error('Utilisateur introuvable');
  }
  
  return user;
}
```

#### ✅ Nouveau code (GraphQL)
```graphql
query GetUser($id: Int!) {
  utilisateur(id: $id) {
    id
    first_name
    last_name
    email
    status_id
  }
}
```

### Cas 2 : Recherche par email

#### ❌ Ancien code
```typescript
async function getUserByEmail(email: string) {
  const result = await compte.findByEmail(email);
  return result.isFind ? result.data : null;
}
```

#### ✅ Nouveau code (Repository)
```typescript
async function getUserByEmail(email: string) {
  const repo = getCompteRepository();
  return await repo.findByEmail(email);
}
```

#### ✅ Nouveau code (GraphQL)
```graphql
query GetUserByEmail($email: String!) {
  utilisateurByEmail(email: $email) {
    id
    first_name
    last_name
    email
  }
}
```

### Cas 3 : Mise à jour du compte

#### ❌ Ancien code
```typescript
async function updateUserInfo(id: number, data: any) {
  const result = await compte.updateCompteInfo(id, data);
  if (!result.isConfirm) {
    throw new Error(result.message);
  }
  return result;
}
```

#### ✅ Nouveau code (Repository)
```typescript
async function updateUserInfo(id: number, data: UpdateCompteData) {
  const repo = getCompteRepository();
  
  // Vérifier existence
  const exists = await repo.exists(id);
  if (!exists) {
    throw new Error('Utilisateur introuvable');
  }
  
  // Vérifier email si modifié
  if (data.email) {
    const emailExists = await repo.emailExists(data.email, id);
    if (emailExists) {
      throw new Error('Email déjà utilisé');
    }
  }
  
  await repo.updateCompteInfo(id, data);
  return await repo.getCompteInfo(id);
}
```

#### ✅ Nouveau code (GraphQL)
```graphql
mutation UpdateCompteInfo($id: Int!, $data: UpdateCompteInput!) {
  updateCompteInfo(id: $id, data: $data) {
    id
    first_name
    last_name
    email
    date_of_birth
    phone
  }
}
```

### Cas 4 : Vérification d'existence d'email

#### ❌ Ancien code
```typescript
async function checkEmail(email: string) {
  const result = await compte.emailExists(email);
  return result.isFind;
}
```

#### ✅ Nouveau code (Repository)
```typescript
async function checkEmail(email: string) {
  const repo = getCompteRepository();
  return await repo.emailExists(email);
}
```

#### ✅ Nouveau code (GraphQL)
```graphql
query CheckEmailAvailability($email: String!) {
  checkEmailAvailability(email: $email) {
    available
    message
  }
}
```

### Cas 5 : Liste des utilisateurs avec relations

#### ❌ Ancien code
```typescript
async function getAllUsersWithDetails() {
  const result = await compte.findAllWithRelations();
  return result.isFind ? result.data : [];
}
```

#### ✅ Nouveau code (Repository)
```typescript
async function getAllUsersWithDetails() {
  const repo = getCompteRepository();
  return await repo.findAllWithRelations();
}
```

#### ✅ Nouveau code (GraphQL)
```graphql
query GetAllUsersWithRelations {
  utilisateursAvecRelations {
    id
    first_name
    last_name
    email
    genres
    status
    grades
    abonnement
  }
}
```

### Cas 6 : Recherche avec filtres

#### ❌ Ancien code
```typescript
async function searchUsers(filters: any) {
  const result = await compte.search(filters);
  return result.isFind ? result.data : [];
}
```

#### ✅ Nouveau code (Repository)
```typescript
async function searchUsers(filters: SearchFilters) {
  const repo = getCompteRepository();
  return await repo.search(filters);
}
```

#### ✅ Nouveau code (GraphQL)
```graphql
query SearchUsers($filters: CompteSearchFiltersInput!) {
  searchUtilisateurs(filters: $filters) {
    utilisateurs {
      id
      first_name
      last_name
      email
    }
    total
    page
    totalPages
  }
}
```

### Cas 7 : Statistiques

#### ✅ Nouveau (GraphQL uniquement)
```graphql
query GetCompteStatistiques {
  comptesStatistiques {
    total_utilisateurs
    utilisateurs_actifs
    utilisateurs_inactifs
    nouveaux_ce_mois
    par_genre {
      genre
      count
    }
    par_status {
      status
      count
    }
    par_abonnement {
      abonnement
      count
    }
  }
}
```

## 🔧 Migration des types

### Ancien format de réponse
```typescript
interface UserSearchResult {
  isFind: boolean;
  message: string;
  data: any;
}

interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
}
```

### Nouveau format
```typescript
// Les repositories retournent directement les données ou null
const user: Utilisateur | null = await repo.findById(1);

// Pour les opérations de modification, utiliser try/catch
try {
  await repo.updateCompteInfo(id, data);
  return { success: true };
} catch (error) {
  return { success: false, message: error.message };
}
```

## 📊 Tableau de correspondance des méthodes

| Ancienne méthode (V1) | Nouvelle méthode (V2) Repository | GraphQL Query/Mutation |
|----------------------|----------------------------------|------------------------|
| `compte.findById()` | `repo.findById()` | `utilisateur(id)` |
| `compte.findByEmail()` | `repo.findByEmail()` | `utilisateurByEmail(email)` |
| `compte.findByName()` | `repo.findByName()` | - |
| `compte.findByNameWithRelations()` | `repo.findByNameWithRelations()` | - |
| `compte.findAllActive()` | `repo.findAllActive()` | `utilisateurs` |
| `compte.findAllWithRelations()` | `repo.findAllWithRelations()` | `utilisateursAvecRelations` |
| `compte.getCompteInfo()` | `repo.getCompteInfo()` | `compteInfo(id)` |
| `compte.updatePassword()` | `repo.updatePassword()` | `updatePassword` |
| `compte.updateCompteInfo()` | `repo.updateCompteInfo()` | `updateCompteInfo` |
| `compte.updateUtilisateur()` | `repo.updateUtilisateur()` | `updateUtilisateur` |
| `compte.softDelete()` | `repo.softDelete()` | `softDeleteCompte` |
| `compte.reactivate()` | `repo.reactivate()` | `reactivateCompte` |
| `compte.exists()` | `repo.exists()` | - |
| `compte.emailExists()` | `repo.emailExists()` | `checkEmailAvailability` |
| `compte.usernameExists()` | `repo.usernameExists()` | `checkUsernameAvailability` |
| `compte.isActive()` | `repo.isActive()` | `isUtilisateurActive` |
| `compte.search()` | `repo.search()` | `searchUtilisateurs` |
| `compte.getAllGenres()` | `repo.getAllGenres()` | `genres` |
| `compte.getAllGrades()` | `repo.getAllGrades()` | `grades` |
| `compte.getAllStatus()` | `repo.getAllStatus()` | `status` |
| `compte.getAllPlans()` | `repo.getAllPlans()` | `plansTarifaires` |
| - | `repo.countByStatus()` | (dans `comptesStatistiques`) |
| - | `repo.countByGenre()` | (dans `comptesStatistiques`) |
| - | `repo.countByAbonnement()` | (dans `comptesStatistiques`) |

## 🚀 Plan de migration progressif

### Phase 1 : Préparation (Semaine 1)
1. ✅ Lire cette documentation
2. ✅ Identifier tous les usages de l'ancien module
3. ✅ Créer une liste de priorités
4. ✅ Mettre en place des tests pour le code existant

### Phase 2 : Migration des lectures (Semaine 2-3)
1. Migrer les `findById`, `findByEmail`, etc.
2. Migrer les recherches simples
3. Tester chaque migration

### Phase 3 : Migration des écritures (Semaine 4)
1. Migrer les `update*` méthodes
2. Migrer les `softDelete`, `reactivate`
3. Tests d'intégration

### Phase 4 : Migration GraphQL (Semaine 5)
1. Intégrer les typeDefs et resolvers GraphQL
2. Migrer le frontend vers GraphQL (si applicable)
3. Tests end-to-end

### Phase 5 : Nettoyage (Semaine 6)
1. Retirer les anciens imports
2. Supprimer le code deprecated
3. Documentation finale

## ⚠️ Pièges courants

### Piège 1 : Gestion des erreurs différente

**Ancien** : Retourne `{ isFind: false, message: '...' }`  
**Nouveau** : Retourne `null` ou lance une exception

**Solution** : Toujours vérifier `null` et utiliser try/catch

```typescript
// ✅ Bon
const user = await repo.findById(id);
if (!user) {
  throw new Error('User not found');
}

// ❌ Mauvais (crash si null)
const userName = (await repo.findById(id)).first_name;
```

### Piège 2 : Types différents

**Ancien** : Types loosely typed (`any`)  
**Nouveau** : Types stricts TypeScript

**Solution** : Utiliser les types exportés

```typescript
import type { Utilisateur, UpdateCompteData } from '@/db/clients/compte/types';
```

### Piège 3 : Email/username exists avec exclusion

**Nouveau comportement** : Vous pouvez exclure un ID lors de la vérification (utile pour updates)

```typescript
// Vérifier si email existe SAUF pour l'utilisateur actuel
const exists = await repo.emailExists(newEmail, currentUserId);
```

## 🧪 Tests

### Tester le code migré

```typescript
import { getCompteRepository } from '@/db/clients/compte/compte.repository';

describe('Compte Repository Migration', () => {
  let repo: ReturnType<typeof getCompteRepository>;
  
  beforeEach(() => {
    repo = getCompteRepository();
  });
  
  test('findById returns user', async () => {
    const user = await repo.findById(1);
    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
  });
  
  test('emailExists returns true for existing email', async () => {
    const exists = await repo.emailExists('test@example.com');
    expect(exists).toBe(true);
  });
});
```

### Tester GraphQL

```typescript
import { compteResolvers } from '@/graphql/compte';

describe('Compte GraphQL Resolvers', () => {
  test('utilisateur query returns user', async () => {
    const result = await compteResolvers.Query.utilisateur(
      null,
      { id: 1 },
      { user: mockUser }
    );
    
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });
});
```

## 📞 Support et aide

### Questions fréquentes

**Q: Dois-je migrer tout d'un coup ?**  
R: Non ! La migration peut être progressive grâce à la compatibilité ascendante.

**Q: Que faire si j'ai un bug après migration ?**  
R: Consultez les logs, vérifiez les types, et comparez avec les exemples de ce guide.

**Q: GraphQL est-il obligatoire ?**  
R: Non, vous pouvez continuer à utiliser les repositories directement. GraphQL est un bonus.

**Q: Les performances sont-elles meilleures ?**  
R: Oui, les requêtes sont optimisées et le typage TypeScript aide à éviter les erreurs runtime.

### Ressources

- 📖 [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) - Architecture détaillée
- 📝 [API_REFERENCE.md](./API_REFERENCE.md) - Référence complète des méthodes
- 📋 [CHANGELOG.md](./CHANGELOG.md) - Historique des changements

### Contact

En cas de problème, contactez l'équipe de développement ou créez une issue sur le repository.

## ✅ Checklist de migration

Utilisez cette checklist pour suivre votre progression :

- [ ] Lecture de la documentation complète
- [ ] Identification de tous les usages de l'ancien module
- [ ] Tests du code existant en place
- [ ] Migration des méthodes de lecture
- [ ] Migration des méthodes d'écriture
- [ ] Migration des recherches
- [ ] Migration des validations
- [ ] Intégration GraphQL (si souhaité)
- [ ] Tests unitaires pour le nouveau code
- [ ] Tests d'intégration
- [ ] Revue de code
- [ ] Documentation mise à jour
- [ ] Déploiement en staging
- [ ] Tests end-to-end en staging
- [ ] Déploiement en production
- [ ] Monitoring post-déploiement

## 🎉 Conclusion

La migration vers la V2 du module Compte apporte de nombreux bénéfices en termes de maintenabilité, testabilité et performance. Suivez ce guide étape par étape et n'hésitez pas à demander de l'aide si nécessaire.

Bon courage ! 💪