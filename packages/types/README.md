# 📦 @clubmanager/types

**Version**: 1.0.0  
**Type**: Shared TypeScript Types Package

---

## 📚 Documentation

**La documentation complète se trouve dans le dossier `/docs` du projet principal :**

- **[📖 Package README Complet](../../docs/TYPES_PACKAGE_README.md)** - Documentation détaillée du package
- **[📋 Structure & Conventions](./STRUCTURE.md)** - Guide d'organisation et conventions de code
- **[📝 Changelog](../../docs/TYPES_PACKAGE_CHANGELOG.md)** - Historique des modifications

---

## 🚀 Installation

```bash
# Le package est utilisé via workspace npm
npm install @clubmanager/types
```

---

## 🎨 Générateur de Domaine

**Créez automatiquement de nouveaux domaines conformes aux conventions architecturales !**

### Quick Start

```bash
# Générer un nouveau domaine
npm run generate:domain mon-domaine -- --with-graphql

# Valider la conformité
npm run validate:domain mon-domaine

# Compiler
npm run build
```

### Options disponibles

- `--with-graphql` - Ajoute support GraphQL complet
- `--with-service` - Ajoute interfaces de service
- `--with-database` - Ajoute types database (snake_case)
- `--with-subdomain` - Ajoute un sous-domaine exemple
- `--dry-run` - Prévisualise sans créer de fichiers

### Documentation complète

- **[🚀 Quick Start](./QUICK_START.md)** - Démarrage rapide en 30 secondes
- **[📖 Guide Complet](./GENERATOR_GUIDE.md)** - Documentation détaillée du générateur
- **[📋 Templates](./DOMAIN_TEMPLATE.md)** - Templates et conventions

### Exemple

```bash
# Domaine avec GraphQL
npm run generate:domain evenements -- --with-graphql

# Domaine complet (GraphQL + Service + Database)
npm run generate:domain paiements -- --with-graphql --with-service --with-database
```

---

## 💡 Usage Rapide

### Import Recommandé (Namespace)

```typescript
// ✅ RECOMMANDÉ - Évite les conflits de noms
import { Auth, Magasin, Cours } from '@clubmanager/types';

const user: Auth.User = { ... };
const product: Magasin.Produit = { ... };
```

### Import de Types Core

```typescript
import { Result, PaginatedResult, AppError } from '@clubmanager/types';
```

### Import de GraphQL TypeDefs

```typescript
import { 
  authTypeDefs, 
  coursTypeDefs, 
  magasinTypeDefs 
} from '@clubmanager/types';
```

---

## 📁 Structure

```
packages/types/
├── src/
│   ├── core/                # Types fondamentaux
│   ├── domains/             # Types métier (15 domaines)
│   └── infrastructure/      # Types d'infrastructure
├── dist/                    # Fichiers compilés
├── STRUCTURE.md            # Guide détaillé de structure
└── README.md               # Ce fichier
```

Voir **[STRUCTURE.md](./STRUCTURE.md)** pour plus de détails.

---

## 🔧 Scripts

```bash
# Compilation
npm run build

# Générateur de domaine
npm run generate:domain <nom> -- [options]

# Validation
npm run validate:domain <nom>

# Audits
npm run audit:structure
npm run audit:graphql

# Tests
npm test
```

---

## 📖 Plus d'informations

### Générateur
- **[🚀 Quick Start](./QUICK_START.md)** - Démarrage rapide
- **[📖 Guide Complet](./GENERATOR_GUIDE.md)** - Documentation générateur
- **[📋 Templates](./DOMAIN_TEMPLATE.md)** - Templates détaillés

### Package
- **[Documentation complète](../../docs/TYPES_PACKAGE_README.md)** - Guide du package
- **[Structure & Conventions](./STRUCTURE.md)** - Organisation du code
- **[Changelog](../../docs/TYPES_PACKAGE_CHANGELOG.md)** - Historique
- **[Architecture](../../docs/ARCHITECTURE_ANALYSIS.md)** - Architecture projet

---

**Mainteneur** : Équipe ClubManager  
**Licence** : Propriétaire
