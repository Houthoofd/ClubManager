# Installation et Configuration du Module Inscription

> Guide d'installation complet pour le module Inscription v2.0.0

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Vérification](#vérification)
5. [Tests](#tests)
6. [Intégration GraphQL](#intégration-graphql)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prérequis

### Environnement

- **Node.js** : >= 18.0.0
- **npm** : >= 9.0.0
- **TypeScript** : >= 5.0.0
- **MySQL** : >= 8.0.0

### Dépendances du projet

```json
{
  "dependencies": {
    "mysql2": "^3.x.x",
    "graphql": "^16.x.x",
    "graphql-tag": "^2.x.x"
  },
  "devDependencies": {
    "@types/node": "^20.x.x",
    "typescript": "^5.x.x",
    "jest": "^29.x.x",
    "@types/jest": "^29.x.x",
    "ts-jest": "^29.x.x"
  }
}
```

---

## 📦 Installation

### Étape 1 : Vérifier la structure

Assurez-vous que la structure suivante existe :

```
api/src/db/clients/inscription/
├── inscription.repository.ts
├── inscription.graphql.ts
├── inscription.ts (legacy)
├── types/
│   └── index.ts
├── queries/
│   ├── index.ts
│   ├── read.queries.ts
│   ├── write.queries.ts
│   ├── validation.queries.ts
│   └── search.queries.ts
├── utils/
│   └── index.ts
└── docs/
    └── README.md
```

### Étape 2 : Installer les dépendances

```bash
# Dans le dossier api/
npm install

# Ou avec yarn
yarn install
```

### Étape 3 : Compiler TypeScript

```bash
# Compiler tout le projet
npm run build

# Ou en mode watch
npm run build:watch
```

---

## ⚙️ Configuration

### 1. Configuration TypeScript

Vérifier `tsconfig.json` :

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

### 2. Configuration Jest

Vérifier `jest.config.cjs` :

```javascript
module.exports = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
  ],
};
```

### 3. Configuration Base de données

#### Schéma requis

Le module nécessite les tables suivantes :

```sql
-- Table cours
CREATE TABLE IF NOT EXISTS cours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date_cours DATE NOT NULL,
  jour_cours VARCHAR(20),
  jour_semaine TINYINT,
  type_cours VARCHAR(100) NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  cours_recurrent_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date_cours (date_cours),
  INDEX idx_type_cours (type_cours),
  INDEX idx_cours_recurrent (cours_recurrent_id)
);

-- Table cours_recurrents
CREATE TABLE IF NOT EXISTS cours_recurrents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jour_semaine TINYINT NOT NULL,
  type_cours VARCHAR(100) NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jour_semaine (jour_semaine)
);

-- Table inscriptions
CREATE TABLE IF NOT EXISTS inscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cours_id INT NOT NULL,
  utilisateur_id INT NOT NULL,
  date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  presence ENUM('present', 'absent', 'en_attente') DEFAULT 'en_attente',
  est_valide TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  UNIQUE KEY unique_inscription (cours_id, utilisateur_id),
  INDEX idx_cours (cours_id),
  INDEX idx_utilisateur (utilisateur_id),
  INDEX idx_presence (presence)
);

-- Table cours_professeurs
CREATE TABLE IF NOT EXISTS cours_professeurs (
  cours_id INT NOT NULL,
  professeur_id INT NOT NULL,
  PRIMARY KEY (cours_id, professeur_id),
  FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
  FOREIGN KEY (professeur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table cours_recurrents_professeurs
CREATE TABLE IF NOT EXISTS cours_recurrents_professeurs (
  cours_recurrent_id INT NOT NULL,
  professeur_id INT NOT NULL,
  PRIMARY KEY (cours_recurrent_id, professeur_id),
  FOREIGN KEY (cours_recurrent_id) REFERENCES cours_recurrents(id) ON DELETE CASCADE,
  FOREIGN KEY (professeur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);
```

#### Script de migration

Créer le fichier `migrations/create_inscription_tables.sql` :

```bash
mysql -u root -p clubmanager < migrations/create_inscription_tables.sql
```

---

## ✅ Vérification

### 1. Vérifier la compilation

```bash
npm run build
```

**Résultat attendu :** Pas d'erreur TypeScript

### 2. Vérifier l'import

Créer un fichier test `test-import.ts` :

```typescript
import { getInscriptionRepository } from './db/clients/inscription/inscription.repository.js';

const repo = getInscriptionRepository();
console.log('Repository initialized:', !!repo);
```

Exécuter :

```bash
node dist/test-import.js
```

**Résultat attendu :** `Repository initialized: true`

### 3. Vérifier la connexion DB

```typescript
import { getInscriptionRepository } from './db/clients/inscription/inscription.repository.js';

async function testConnection() {
  try {
    const repo = getInscriptionRepository();
    const cours = await repo.findAllCours();
    console.log(`✓ Connexion OK - ${cours.length} cours trouvés`);
  } catch (error) {
    console.error('✗ Erreur connexion:', error);
  }
}

testConnection();
```

---

## 🧪 Tests

### Installation des dépendances de test

```bash
npm install --save-dev jest @types/jest ts-jest
```

### Lancer les tests

```bash
# Tous les tests du module
npm test inscription

# Avec coverage
npm test -- --coverage inscription

# Mode watch
npm test -- --watch inscription

# Tests spécifiques
npm test inscription.repository
npm test inscription.graphql
```

### Vérifier le coverage

```bash
npm test -- --coverage inscription
```

**Résultat attendu :**

```
------------------------|---------|----------|---------|---------|
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
inscription/            |     100 |      100 |     100 |     100 |
  inscription.repository|     100 |      100 |     100 |     100 |
  inscription.graphql   |     100 |      100 |     100 |     100 |
  types                 |     100 |      100 |     100 |     100 |
  utils                 |     100 |      100 |     100 |     100 |
------------------------|---------|----------|---------|---------|
```

---

## 🎨 Intégration GraphQL

### 1. Importer le schema

```typescript
import { typeDefs, resolvers } from './db/clients/inscription/inscription.graphql.js';
```

### 2. Intégrer à Apollo Server

```typescript
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs as inscriptionTypeDefs, resolvers as inscriptionResolvers } from './db/clients/inscription/inscription.graphql.js';

const server = new ApolloServer({
  typeDefs: [
    // Autres typeDefs
    inscriptionTypeDefs,
  ],
  resolvers: [
    // Autres resolvers
    inscriptionResolvers,
  ],
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Server ready at ${url}`);
```

### 3. Tester GraphQL

#### Query de test

```graphql
query {
  allCours {
    id
    date_cours
    type_cours
    heure_debut
    heure_fin
  }
}
```

#### Mutation de test

```graphql
mutation {
  inscrire(input: {
    cours_id: 1
    utilisateur_id: 1
  }) {
    success
    message
    id
  }
}
```

---

## 🔧 Troubleshooting

### Erreur : "Cannot find module"

**Problème :** TypeScript ne trouve pas les modules

**Solution :**

1. Vérifier les extensions `.js` dans les imports
2. Recompiler : `npm run build`
3. Vérifier `package.json` : `"type": "module"`

### Erreur : "Property does not exist on type"

**Problème :** Queries non exportées correctement

**Solution :**

1. Vérifier `queries/index.ts` exporte tout
2. Vérifier les noms de queries dans les fichiers
3. Recompiler TypeScript

### Erreur de connexion MySQL

**Problème :** Impossible de se connecter à la DB

**Solution :**

1. Vérifier le connector : `MysqlConnector.getInstance()`
2. Vérifier les credentials DB
3. Vérifier que MySQL est lancé
4. Tester la connexion directement

### Tests qui échouent

**Problème :** Tests ne passent pas

**Solution :**

1. Vérifier que Jest est configuré pour ESM
2. Vérifier les mocks dans `__tests__`
3. Lancer avec `--verbose` pour plus de détails
4. Vérifier `NODE_OPTIONS=--experimental-vm-modules`

### Erreur GraphQL

**Problème :** Resolvers ne fonctionnent pas

**Solution :**

1. Vérifier que le repository est bien importé
2. Vérifier les types GraphQL correspondent aux types TS
3. Tester les resolvers individuellement
4. Vérifier les erreurs dans les logs

---

## 📚 Prochaines étapes

Après l'installation :

1. ✅ Lire la [documentation complète](./docs/README.md)
2. ✅ Consulter les [exemples d'utilisation](./README.md#utilisation-rapide)
3. ✅ Tester les queries GraphQL
4. ✅ Migrer l'ancien code progressivement
5. ✅ Créer vos propres queries/mutations

---

## 🆘 Support

### Ressources

- 📖 [Documentation technique](./docs/README.md)
- 📋 [README principal](./README.md)
- 🧪 [Tests exemples](./__tests__/)
- 📊 [Résumé du refactoring](./REFACTORING_SUMMARY.md)

### Problèmes

Si vous rencontrez des problèmes :

1. Consultez cette documentation
2. Vérifiez les tests pour des exemples
3. Consultez la documentation détaillée
4. Créez une issue GitHub avec :
   - Version Node/npm/TypeScript
   - Message d'erreur complet
   - Stack trace
   - Étapes pour reproduire

---

## ✨ Checklist d'installation

- [ ] Node.js >= 18 installé
- [ ] Dépendances npm installées
- [ ] TypeScript compilé sans erreur
- [ ] Tables MySQL créées
- [ ] Repository s'instancie correctement
- [ ] Connexion DB fonctionne
- [ ] Tests passent (100% coverage)
- [ ] GraphQL schema intégré
- [ ] Queries GraphQL fonctionnent
- [ ] Documentation lue

---

**🎉 Installation terminée ! Vous êtes prêt à utiliser le module Inscription.**

Pour commencer : `import { getInscriptionRepository } from './inscription.repository.js';`
