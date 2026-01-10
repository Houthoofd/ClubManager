# Module Inscription - Documentation

## Vue d'ensemble

Le module **Inscription** gère l'ensemble des opérations liées aux cours, inscriptions, présences et professeurs dans le système ClubManager. Il suit une architecture modulaire inspirée du pattern Repository avec séparation stricte des responsabilités.

## Architecture

```
inscription/
├── inscription.repository.ts    # Repository principal (accès BDD)
├── inscription.ts               # Ancienne implémentation (legacy)
├── types/
│   └── index.ts                # Types TypeScript complets
├── queries/
│   ├── index.ts                # Export centralisé
│   ├── read.queries.ts         # Queries SELECT
│   ├── write.queries.ts        # Queries INSERT/UPDATE/DELETE
│   ├── validation.queries.ts   # Queries de validation
│   └── search.queries.ts       # Queries de recherche avancée
├── utils/
│   └── index.ts                # Parsers et utilitaires
└── docs/
    └── README.md               # Cette documentation
```

## Principes de conception

### 1. Separation of Concerns

- **Repository** : Accès base de données uniquement
- **Types** : Définitions TypeScript strictes
- **Queries** : Requêtes SQL modulaires
- **Utils** : Parsing et transformation de données

### 2. Type Safety

Tous les types sont strictement définis avec :
- Types TypeScript natifs
- Types pour les rows SQL
- Type guards pour validation runtime
- Enums pour les valeurs contraintes

### 3. Testabilité

- Dépendances mockables
- Tests unitaires complets
- Couverture 100%

## Types principaux

### Cours

```typescript
interface Cours {
  id: number;
  date_cours: Date | string;
  jour_cours?: string;
  jour_semaine?: number;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  cours_recurrent_id?: number | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}
```

### CoursRecurrent

```typescript
interface CoursRecurrent {
  id: number;
  jour_semaine: number;  // 0-6 (dimanche-samedi)
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  date_debut: Date | string;
  date_fin?: Date | string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}
```

### Inscription

```typescript
interface Inscription {
  id: number;
  cours_id: number;
  utilisateur_id: number;
  date_inscription: Date | string;
  presence: 'present' | 'absent' | 'en_attente' | null;
  est_valide: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}
```

### UtilisateurInscrit

```typescript
interface UtilisateurInscrit {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  presence: 'present' | 'absent' | 'en_attente' | null;
  date_inscription?: Date | string;
  est_valide?: boolean;
}
```

### Professeur

```typescript
interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
}
```

## Utilisation

### Initialisation

```typescript
import { InscriptionRepository, getInscriptionRepository } from './inscription.repository.js';

// Via singleton (recommandé)
const repo = getInscriptionRepository();

// Via instanciation directe
const repo = new InscriptionRepository();
```

### Opérations de lecture

#### Récupérer tous les cours

```typescript
const cours = await repo.findAllCours();
// Retourne: Cours[]
```

#### Récupérer un cours par ID

```typescript
const cours = await repo.findCoursById(1);
// Retourne: Cours | null
```

#### Récupérer les cours d'un participant

```typescript
const cours = await repo.findCoursByParticipant(userId);
// Retourne: Cours[]
```

#### Rechercher des cours par date

```typescript
const cours = await repo.searchCoursByDate('2024-01-15');
// Retourne: Cours[]
```

#### Rechercher des cours par plage de dates

```typescript
const cours = await repo.searchCoursByDateRange('2024-01-01', '2024-01-31');
// Retourne: Cours[]
```

### Opérations sur les cours récurrents

#### Créer un cours récurrent

```typescript
const coursRecurrentId = await repo.createCoursRecurrent({
  jour: 'lundi',
  type_cours: 'Judo',
  heure_debut: '18:00',
  heure_fin: '19:00',
  date_debut: '2024-01-01',
  professeurs: ['Jean Dupont', 'Marie Martin']
});
```

#### Récupérer les jours de cours

```typescript
const jours = await repo.findJoursDeCours();
// Retourne: JourDeCours[]
// Inclut les professeurs associés
```

#### Modifier un cours récurrent

```typescript
const success = await repo.updateCoursRecurrent({
  id: 1,
  jour: 'mardi',
  heure_debut: '19:00',
  heure_fin: '20:00'
});
```

### Opérations sur les inscriptions

#### Inscrire un utilisateur

```typescript
const inscriptionId = await repo.createInscription({
  coursId: 1,
  utilisateurId: 10,
  presence: 'en_attente',
  est_valide: false
});
```

#### Vérifier une inscription

```typescript
const verification = await repo.verifyInscription(coursId, userId);
// Retourne: VerificationInscription
// {
//   isBooked: boolean,
//   isFind: boolean,
//   message: string,
//   data: { inscriptionId?, userId?, presence?, ... }
// }
```

#### Récupérer les inscriptions d'un cours

```typescript
const inscriptions = await repo.findInscriptionsByCours(coursId);
// Retourne: Inscription[]
```

#### Récupérer les utilisateurs d'un cours

```typescript
const utilisateurs = await repo.findUtilisateursByCours(coursId);
// Retourne: UtilisateurInscrit[]
// Inclut le statut de présence
```

### Gestion de la présence

#### Mettre à jour la présence

```typescript
const success = await repo.updatePresence({
  inscriptionId: 1,
  presence: 'present'
});
```

#### Valider une inscription (marquer présent)

```typescript
const success = await repo.validerInscription(coursId, userId);
```

#### Annuler une inscription (marquer absent)

```typescript
const success = await repo.annulerInscription(coursId, userId);
```

### Statistiques

#### Statistiques de présence par cours

```typescript
const stats = await repo.getStatistiquesPresenceByCours(
  '2024-01-01',
  '2024-01-31'
);
// Retourne: StatistiquesPresenceCours[]
// {
//   cours_id, date_cours, type_cours,
//   total_inscrits, presents, absents, en_attente,
//   taux_presence
// }
```

#### Statistiques de présence par utilisateur

```typescript
const stats = await repo.getStatistiquesPresenceByUtilisateur(
  '2024-01-01',
  '2024-01-31'
);
// Retourne: StatistiquesPresenceUtilisateur[]
// {
//   utilisateur_id, nom, prenom,
//   total_cours, presents, absents, en_attente,
//   taux_presence
// }
```

### Validation

#### Vérifier l'existence d'un cours

```typescript
const exists = await repo.coursExists(coursId);
// Retourne: boolean
```

#### Vérifier si un utilisateur est inscrit

```typescript
const isInscrit = await repo.isUserInscrit(coursId, userId);
// Retourne: boolean
```

#### Vérifier l'existence d'un utilisateur

```typescript
const exists = await repo.utilisateurExists(userId);
// Retourne: boolean
```

## Utilitaires

### Parsers

Tous les parsers transforment les rows SQL brutes en objets typés:

```typescript
import { parseCoursRow, parseCoursRows } from './utils/index.js';

// Parser une row unique
const cours = parseCoursRow(sqlRow);

// Parser plusieurs rows
const coursList = parseCoursRows(sqlRows);
```

### Formatage

```typescript
import {
  formatDateSQL,
  formatDateFR,
  formatHeure,
  getJourSemaineName,
  getJourSemaineNumber
} from './utils/index.js';

// Format SQL (YYYY-MM-DD)
const sqlDate = formatDateSQL(new Date());
// '2024-01-15'

// Format français (DD/MM/YYYY)
const frDate = formatDateFR(new Date());
// '15/01/2024'

// Format heure (HH:MM)
const heure = formatHeure('18:00:00');
// '18:00'

// Nom du jour
const jour = getJourSemaineName(1);
// 'lundi'

// Numéro du jour
const num = getJourSemaineNumber('lundi');
// 1
```

### Validation

```typescript
import {
  isValidCours,
  isValidInscription,
  isValidHeureFormat,
  isValidPlageHoraire
} from './utils/index.js';

// Valider un cours
if (isValidCours(cours)) {
  // cours est de type Cours
}

// Valider un format d'heure
if (isValidHeureFormat('18:00')) {
  // Format valide
}

// Valider une plage horaire
if (isValidPlageHoraire('18:00', '19:00')) {
  // Plage valide (debut < fin)
}
```

### Transformation

```typescript
import {
  groupCoursByDate,
  groupCoursByType,
  sortCoursByDateTime,
  filterCoursFuturs,
  filterCoursPasses
} from './utils/index.js';

// Grouper par date
const grouped = groupCoursByDate(cours);
// Map<string, Cours[]>

// Trier par date et heure
const sorted = sortCoursByDateTime(cours);

// Filtrer cours futurs
const futurs = filterCoursFuturs(cours);

// Filtrer cours passés
const passes = filterCoursPasses(cours);
```

## Queries SQL

### Organisation

Les queries sont organisées par responsabilité:

- **read.queries.ts** : SELECT
- **write.queries.ts** : INSERT, UPDATE, DELETE
- **validation.queries.ts** : Vérifications EXISTS, CHECK
- **search.queries.ts** : Recherches complexes

### Utilisation directe

```typescript
import * as queries from './queries/index.js';

// Utiliser une query
mysqlConnector.query(
  queries.SELECT_COURS_BY_ID,
  [coursId],
  callback
);
```

### Queries principales

#### Lecture

- `SELECT_ALL_COURS`
- `SELECT_COURS_BY_ID`
- `SELECT_COURS_BY_PARTICIPANT`
- `SELECT_COURS_BY_SEMAINE`
- `SELECT_ALL_COURS_RECURRENTS`
- `SELECT_JOURS_DE_COURS`
- `SELECT_INSCRIPTIONS_BY_COURS`
- `SELECT_UTILISATEURS_BY_COURS`

#### Écriture

- `INSERT_COURS`
- `INSERT_COURS_RECURRENT`
- `INSERT_INSCRIPTION`
- `UPDATE_INSCRIPTION_PRESENCE`
- `UPDATE_COURS_RECURRENT`
- `DELETE_COURS`
- `DELETE_INSCRIPTION`

#### Validation

- `CHECK_COURS_EXISTS`
- `CHECK_USER_INSCRIT_TO_COURS`
- `CHECK_UTILISATEUR_EXISTS`
- `CHECK_COURS_IS_FULL`

#### Recherche

- `SEARCH_COURS_BY_DATE`
- `SEARCH_COURS_BY_DATE_RANGE`
- `SEARCH_COURS_BY_TYPE`
- `SEARCH_COURS_DISPONIBLES`

## Tests

### Exécution

```bash
# Tous les tests inscription
npm test inscription

# Avec coverage
npm test -- --coverage inscription

# Mode watch
npm test -- --watch inscription
```

### Structure des tests

Les tests couvrent:
- ✅ Toutes les méthodes du repository
- ✅ Cas de succès
- ✅ Cas d'erreur
- ✅ Cas limites (null, empty, invalid)
- ✅ Validation des paramètres
- ✅ Gestion des erreurs
- ✅ Singleton pattern

### Exemple de test

```typescript
describe('findCoursById', () => {
  it('should return a cours by id', async () => {
    const mockCours = { /* ... */ };
    mockMysqlConnector.query = jest.fn((sql, params, callback) => {
      callback(null, [mockCours]);
    });

    const result = await repository.findCoursById(1);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
  });

  it('should return null when not found', async () => {
    mockMysqlConnector.query = jest.fn((sql, params, callback) => {
      callback(null, []);
    });

    const result = await repository.findCoursById(999);

    expect(result).toBeNull();
  });

  it('should reject on error', async () => {
    mockMysqlConnector.query = jest.fn((sql, params, callback) => {
      callback(new Error('DB error'), null);
    });

    await expect(repository.findCoursById(1))
      .rejects.toThrow('DB error');
  });
});
```

## Bonnes pratiques

### 1. Toujours utiliser le singleton

```typescript
// ✅ Bon
const repo = getInscriptionRepository();

// ❌ Éviter
const repo = new InscriptionRepository();
```

### 2. Gérer les erreurs

```typescript
try {
  const cours = await repo.findCoursById(id);
  if (!cours) {
    // Gérer le cas non trouvé
  }
} catch (error) {
  // Gérer l'erreur DB
  console.error('Erreur:', error);
}
```

### 3. Valider avant d'insérer

```typescript
// Vérifier l'existence
const userExists = await repo.utilisateurExists(userId);
const coursExists = await repo.coursExists(coursId);

if (userExists && coursExists) {
  // Vérifier si pas déjà inscrit
  const isInscrit = await repo.isUserInscrit(coursId, userId);
  if (!isInscrit) {
    await repo.createInscription({ coursId, utilisateurId });
  }
}
```

### 4. Utiliser les types

```typescript
import type { Cours, Inscription } from './types/index.js';

function processCours(cours: Cours): void {
  // TypeScript garantit la structure
  console.log(cours.type_cours);
}
```

### 5. Parser les résultats

```typescript
// Le repository parse automatiquement
const cours = await repo.findCoursById(1);
// cours est de type Cours | null

// Si requête manuelle, parser explicitement
import { parseCoursRow } from './utils/index.js';
const cours = parseCoursRow(sqlRow);
```

## Migration depuis l'ancien code

### Ancien (inscription.ts)

```typescript
// Ancien code
const cours = new Cours();
const result = await cours.obtenirLesCoursPourParticipant(userId);
```

### Nouveau (inscription.repository.ts)

```typescript
// Nouveau code
import { getInscriptionRepository } from './inscription.repository.js';

const repo = getInscriptionRepository();
const result = await repo.findCoursByParticipant(userId);
```

### Mapping des méthodes

| Ancienne méthode | Nouvelle méthode |
|------------------|------------------|
| `obtenirLesCoursPourParticipant` | `findCoursByParticipant` |
| `obtenirUtilisateursParCours` | `findUtilisateursByCours` |
| `obtenirLesJoursDeCours` | `findJoursDeCours` |
| `inscrireUtilisateurAuCours` | `createInscription` |
| `verifierInscriptionUtilisateur` | `verifyInscription` |
| `validerUtilisateurAuCours` | `validerInscription` |
| `annulerUtilisateurAuCours` | `annulerInscription` |
| `obtenirStatistiquesPresenceParCours` | `getStatistiquesPresenceByCours` |

## GraphQL Integration

### Schema (à définir)

```graphql
type Cours {
  id: ID!
  date_cours: String!
  type_cours: String!
  heure_debut: String!
  heure_fin: String!
  professeurs: [Professeur!]
  inscrits: [UtilisateurInscrit!]
}

type Query {
  cours(id: ID!): Cours
  allCours: [Cours!]!
  coursByParticipant(userId: ID!): [Cours!]!
  joursDecours: [JourDeCours!]!
}

type Mutation {
  inscrire(coursId: ID!, userId: ID!): Inscription!
  desinscrire(coursId: ID!, userId: ID!): Boolean!
  validerPresence(coursId: ID!, userId: ID!): Boolean!
}
```

### Resolvers (exemple)

```typescript
import { getInscriptionRepository } from './inscription.repository.js';

const resolvers = {
  Query: {
    cours: async (_, { id }) => {
      const repo = getInscriptionRepository();
      return await repo.findCoursById(id);
    },
    
    allCours: async () => {
      const repo = getInscriptionRepository();
      return await repo.findAllCours();
    },
    
    coursByParticipant: async (_, { userId }) => {
      const repo = getInscriptionRepository();
      return await repo.findCoursByParticipant(userId);
    }
  },
  
  Mutation: {
    inscrire: async (_, { coursId, userId }) => {
      const repo = getInscriptionRepository();
      const inscriptionId = await repo.createInscription({
        coursId,
        utilisateurId: userId
      });
      return await repo.findInscriptionById(inscriptionId);
    }
  }
};
```

## Performance

### Indexation recommandée

```sql
-- Cours
CREATE INDEX idx_cours_date ON cours(date_cours);
CREATE INDEX idx_cours_type ON cours(type_cours);
CREATE INDEX idx_cours_recurrent ON cours(cours_recurrent_id);

-- Inscriptions
CREATE INDEX idx_inscriptions_cours ON inscriptions(cours_id);
CREATE INDEX idx_inscriptions_user ON inscriptions(utilisateur_id);
CREATE INDEX idx_inscriptions_presence ON inscriptions(presence);

-- Cours récurrents
CREATE INDEX idx_cours_recurrent_jour ON cours_recurrents(jour_semaine);
```

### Optimisations

1. Utiliser les méthodes de recherche spécifiques plutôt que charger tout puis filtrer
2. Limiter les résultats avec LIMIT dans les queries
3. Utiliser les index sur les colonnes fréquemment recherchées
4. Préférer les queries avec JOINs aux queries multiples

## Support

### Problèmes connus

- Les heures doivent être au format HH:MM:SS ou HH:MM
- Les jours de semaine sont 0-6 (dimanche = 0)
- Les dates doivent être au format ISO (YYYY-MM-DD)

### Debug

Activer les logs SQL:

```typescript
// Dans le connector
process.env.DEBUG_SQL = 'true';
```

### Contact

Pour toute question ou problème:
- Créer une issue GitHub
- Consulter les tests pour des exemples d'usage
- Vérifier la documentation des types

## Changelog

### v2.0.0 - Refactoring complet
- ✨ Nouveau repository pattern
- ✨ Types TypeScript stricts
- ✨ Queries modulaires
- ✨ Tests complets
- ✨ Documentation complète
- 🔄 Migration progressive depuis v1

### v1.0.0 - Version initiale
- Implémentation basique dans inscription.ts