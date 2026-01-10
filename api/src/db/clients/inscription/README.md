# Module Inscription - ClubManager

> Module de gestion des inscriptions, cours et présences

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-100%25-success.svg)](./docs/README.md)
[![GraphQL](https://img.shields.io/badge/GraphQL-Ready-e10098.svg)](./inscription.graphql.ts)

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Installation](#installation)
- [Utilisation rapide](#utilisation-rapide)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Tests](#tests)
- [Migration](#migration)
- [Contribution](#contribution)

## 🎯 Vue d'ensemble

Le module **Inscription** est un module complet pour gérer :

- ✅ **Cours** : Création, modification, suppression de cours
- ✅ **Cours récurrents** : Gestion des cours hebdomadaires
- ✅ **Inscriptions** : Inscription/désinscription des participants
- ✅ **Présence** : Suivi de la présence (présent/absent/en attente)
- ✅ **Professeurs** : Association des professeurs aux cours
- ✅ **Statistiques** : Taux de présence, analyses

### Caractéristiques

- 🎨 **Architecture moderne** : Repository pattern, types stricts
- 🧪 **100% testé** : Tests unitaires complets
- 🚀 **GraphQL ready** : Schema et resolvers inclus
- 📦 **Modulaire** : Queries séparées par responsabilité
- 🔒 **Type-safe** : TypeScript strict mode
- 📚 **Documentation complète** : Inline + markdown

## 🚀 Installation

### Prérequis

```json
{
  "node": ">=18.0.0",
  "typescript": ">=5.0.0"
}
```

### Dépendances

```bash
npm install mysql2
npm install graphql graphql-tag
npm install --save-dev @types/node
npm install --save-dev jest @types/jest ts-jest
```

## ⚡ Utilisation rapide

### Import

```typescript
import { getInscriptionRepository } from './inscription.repository.js';
```

### Exemples de base

#### Récupérer tous les cours

```typescript
const repo = getInscriptionRepository();
const cours = await repo.findAllCours();
console.log(`${cours.length} cours trouvés`);
```

#### Inscrire un utilisateur

```typescript
const repo = getInscriptionRepository();
const inscriptionId = await repo.createInscription({
  coursId: 1,
  utilisateurId: 10,
  presence: 'en_attente',
  est_valide: false
});
console.log(`Inscription créée: ${inscriptionId}`);
```

#### Rechercher des cours par date

```typescript
const repo = getInscriptionRepository();
const cours = await repo.searchCoursByDateRange(
  '2024-01-01',
  '2024-01-31'
);
```

#### Statistiques de présence

```typescript
const repo = getInscriptionRepository();
const stats = await repo.getStatistiquesPresenceByCours(
  '2024-01-01',
  '2024-01-31'
);
stats.forEach(stat => {
  console.log(`${stat.type_cours}: ${stat.taux_presence}% de présence`);
});
```

### GraphQL

#### Query

```graphql
query {
  allCours {
    id
    date_cours
    type_cours
    heure_debut
    heure_fin
    professeurs {
      nom
      prenom
    }
    nombre_inscrits
  }
}
```

#### Mutation

```graphql
mutation {
  inscrire(input: {
    cours_id: 1
    utilisateur_id: 10
  }) {
    success
    message
    id
  }
}
```

## 🏗️ Architecture

```
inscription/
├── inscription.repository.ts    # Repository principal
├── inscription.graphql.ts       # Schema et resolvers GraphQL
├── inscription.ts               # Legacy (à migrer)
├── types/
│   └── index.ts                # Types TypeScript
├── queries/
│   ├── index.ts                # Export centralisé
│   ├── read.queries.ts         # SELECT queries
│   ├── write.queries.ts        # INSERT/UPDATE/DELETE
│   ├── validation.queries.ts   # Vérifications
│   └── search.queries.ts       # Recherches avancées
├── utils/
│   └── index.ts                # Parsers et utilitaires
├── docs/
│   └── README.md               # Documentation détaillée
└── README.md                   # Ce fichier
```

### Principes

1. **Repository Pattern** : Séparation de l'accès aux données
2. **Type Safety** : Types stricts pour toutes les données
3. **Modularité** : Queries organisées par fonction
4. **Testabilité** : Dépendances mockables
5. **DRY** : Réutilisation via utilitaires

## 📚 Documentation

### Documentation détaillée

Voir [docs/README.md](./docs/README.md) pour :
- Guide complet d'utilisation
- Référence des types
- Liste des queries SQL
- Exemples avancés
- Bonnes pratiques

### Types principaux

```typescript
// Cours
interface Cours {
  id: number;
  date_cours: Date | string;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
}

// Inscription
interface Inscription {
  id: number;
  cours_id: number;
  utilisateur_id: number;
  presence: 'present' | 'absent' | 'en_attente' | null;
  est_valide: boolean;
}

// Cours Récurrent
interface CoursRecurrent {
  id: number;
  jour_semaine: number;  // 0-6
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
}
```

### Méthodes principales

#### Lecture (SELECT)

| Méthode | Description |
|---------|-------------|
| `findAllCours()` | Tous les cours |
| `findCoursById(id)` | Cours par ID |
| `findCoursByParticipant(userId)` | Cours d'un participant |
| `searchCoursByDate(date)` | Cours par date |
| `findJoursDeCours()` | Jours de cours récurrents |

#### Écriture (INSERT/UPDATE)

| Méthode | Description |
|---------|-------------|
| `createCours(data)` | Créer un cours |
| `createCoursRecurrent(data)` | Créer cours récurrent |
| `createInscription(data)` | Inscrire un utilisateur |
| `updatePresence(data)` | Mettre à jour présence |
| `validerInscription(coursId, userId)` | Valider présence |

#### Statistiques

| Méthode | Description |
|---------|-------------|
| `getStatistiquesPresenceByCours()` | Stats par cours |
| `getStatistiquesPresenceByUtilisateur()` | Stats par utilisateur |
| `countInscriptionsByCours(coursId)` | Nombre d'inscrits |

## 🧪 Tests

### Exécution

```bash
# Tous les tests du module
npm test inscription

# Avec coverage
npm test -- --coverage inscription

# Mode watch
npm test -- --watch inscription

# Tests GraphQL uniquement
npm test inscription.graphql
```

### Coverage

Le module atteint **100% de coverage** :
- ✅ Toutes les méthodes testées
- ✅ Cas de succès et d'erreur
- ✅ Cas limites (null, empty, invalid)
- ✅ Validation des paramètres

### Structure des tests

```
__tests__/db/clients/inscription/
├── inscription.repository.test.ts    # Tests repository
└── inscription.graphql.test.ts       # Tests GraphQL
```

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
});
```

## 🔄 Migration

### Depuis l'ancien code (inscription.ts)

#### Avant

```typescript
import { Cours } from './inscription.js';

const cours = new Cours();
const result = await cours.obtenirLesCoursPourParticipant(userId);
```

#### Après

```typescript
import { getInscriptionRepository } from './inscription.repository.js';

const repo = getInscriptionRepository();
const result = await repo.findCoursByParticipant(userId);
```

### Table de correspondance

| Ancien | Nouveau |
|--------|---------|
| `obtenirLesCoursPourParticipant` | `findCoursByParticipant` |
| `obtenirUtilisateursParCours` | `findUtilisateursByCours` |
| `inscrireUtilisateurAuCours` | `createInscription` |
| `verifierInscriptionUtilisateur` | `verifyInscription` |
| `validerUtilisateurAuCours` | `validerInscription` |
| `obtenirStatistiquesPresenceParCours` | `getStatistiquesPresenceByCours` |

### Migration progressive

L'ancien fichier `inscription.ts` reste disponible pour compatibilité.
Migration recommandée par étapes :

1. ✅ Nouveau code utilise `inscription.repository.ts`
2. ⏳ Migration progressive de l'existant
3. 🔄 Tests et validation
4. ❌ Suppression de l'ancien fichier

## 🛠️ Développement

### Ajouter une nouvelle méthode

1. **Définir le type** dans `types/index.ts`
2. **Créer la query SQL** dans `queries/`
3. **Implémenter dans repository** : `inscription.repository.ts`
4. **Créer les tests** : `__tests__/inscription.repository.test.ts`
5. **Documenter** : Mettre à jour `docs/README.md`
6. **(Optionnel) Ajouter GraphQL** : `inscription.graphql.ts`

### Exemple

```typescript
// 1. Type
export interface NouvelleDonnee {
  id: number;
  valeur: string;
}

// 2. Query
export const SELECT_NOUVELLE = `
  SELECT id, valeur FROM table WHERE id = ?
`;

// 3. Repository
async findNouvelle(id: number): Promise<NouvelleDonnee | null> {
  return new Promise((resolve, reject) => {
    this.mysqlConnector.query(
      queries.SELECT_NOUVELLE,
      [id],
      (error, results) => {
        if (error) reject(error);
        else resolve(results[0] || null);
      }
    );
  });
}

// 4. Test
it('should find nouvelle by id', async () => {
  // ... test implementation
});
```

## 🤝 Contribution

### Guidelines

1. ✅ Suivre le style existant
2. ✅ Écrire des tests
3. ✅ Documenter les changements
4. ✅ Respecter TypeScript strict
5. ✅ Utiliser les types fournis

### Pull Requests

- Décrire le changement
- Inclure des tests
- Vérifier le coverage
- Mettre à jour la documentation

## 📝 Changelog

### v2.0.0 - 2024-01-XX (Refactoring complet)

**✨ Nouvelles fonctionnalités**
- Repository pattern moderne
- Types TypeScript stricts
- Queries modulaires
- Tests complets (100%)
- GraphQL schema complet
- Documentation exhaustive

**🔄 Changements**
- Séparation claire des responsabilités
- Meilleure testabilité
- API plus cohérente
- Gestion d'erreurs améliorée

**📦 Migration**
- Ancien code conservé pour compatibilité
- Table de correspondance fournie
- Documentation de migration

### v1.0.0 - Historique

- Implémentation initiale dans `inscription.ts`

## 🐛 Problèmes connus

### Limitations

- Les heures doivent être au format HH:MM:SS ou HH:MM
- Les jours de semaine sont 0-6 (dimanche = 0)
- Dates au format ISO (YYYY-MM-DD)

### Solutions

```typescript
// ✅ Bon
const heure = '18:00:00';
const jour = 1; // lundi
const date = '2024-01-15';

// ❌ Éviter
const heure = '18h00';
const jour = 'lundi';
const date = '15/01/2024';
```

## 📞 Support

### Ressources

- 📖 [Documentation détaillée](./docs/README.md)
- 🧪 [Exemples de tests](./__tests__/inscription.repository.test.ts)
- 🎨 [Types TypeScript](./types/index.ts)
- 🔍 [Queries SQL](./queries/)

### Contact

- Issues GitHub : Pour bugs et questions
- Documentation : Pour guides et exemples
- Tests : Pour cas d'usage

## 📄 Licence

MIT © ClubManager

---

**Made with ❤️ by ClubManager Team**