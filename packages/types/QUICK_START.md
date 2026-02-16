# 🚀 Quick Start - Générateur de Domaine

Guide de démarrage rapide pour créer de nouveaux domaines dans `@clubmanager/types`.

---

## ⚡ Création en 30 secondes

### 1. Générer un nouveau domaine

```bash
cd packages/types
npm run generate:domain mon-domaine -- --with-graphql
```

### 2. Valider

```bash
npm run validate:domain mon-domaine
```

### 3. Compiler

```bash
npm run build
```

✅ **C'est tout !** Votre domaine est prêt à être utilisé.

---

## 📦 Cas d'usage courants

### Domaine simple (types + validation)

```bash
npm run generate:domain produits
```

**Génère :**
- ✅ `types.ts` - Types TypeScript
- ✅ `validators.ts` - Schémas Zod
- ✅ `index.ts` - Exports
- ✅ `README.md` - Documentation

---

### Domaine avec GraphQL

```bash
npm run generate:domain cours -- --with-graphql
```

**Génère :**
- ✅ Types + Validators
- 📘 `graphql.typedefs.ts` - SDL GraphQL
- 📘 `graphql.types.ts` - Types resolvers

**N'oubliez pas d'ajouter dans `src/index.ts` :**

```typescript
import { coursTypeDefs } from "./domains/cours/index.js";

export const allTypeDefs = [
  // ... autres typedefs
  coursTypeDefs, // ← Ajouter ici
];
```

---

### Domaine avec service

```bash
npm run generate:domain paiements -- --with-graphql --with-service
```

**Génère :**
- ✅ Types + Validators + GraphQL
- 🔵 `service.ts` - Interface service

**Utilisez l'interface :**

```typescript
import type { PaiementService } from '@clubmanager/types';

class MyPaiementService implements PaiementService {
  async create(input: CreatePaiementInput): Promise<Paiement> {
    // Votre implémentation
  }
  // ... autres méthodes
}
```

---

### Domaine avec types Database

```bash
npm run generate:domain utilisateurs -- --with-database
```

**Génère :**
- ✅ Types (camelCase métier)
- 🔵 `database.types.ts` (snake_case DB)

**Mapper DB → Métier :**

```typescript
import type { Utilisateur, UtilisateurDB } from '@clubmanager/types';

function mapToUtilisateur(db: UtilisateurDB): Utilisateur {
  return {
    id: db.id,
    nom: db.nom,
    createdAt: db.created_at, // snake_case → camelCase
  };
}
```

---

### Domaine complexe avec sous-domaine

```bash
npm run generate:domain magasin -- --with-graphql --with-subdomain
```

**Génère :**
- ✅ Structure principale
- 📁 `items/` - Sous-domaine exemple

**Utilisation namespace :**

```typescript
import { Magasin } from '@clubmanager/types';
import { MagasinItems } from '@clubmanager/types';

const item: MagasinItems.Item = { ... };
```

---

## 🧪 Test avant création

Mode **dry-run** pour prévisualiser :

```bash
npm run generate:domain test -- --dry-run --with-graphql
```

Affiche ce qui serait créé **sans créer** les fichiers.

---

## ✅ Validation complète

Après génération, validez la conformité :

```bash
npm run validate:domain mon-domaine
```

**Vérifie :**
- ✅ Fichiers obligatoires présents
- ✅ Séparation Zod correcte
- ✅ Pattern GraphQL conforme
- ✅ Exports corrects
- ✅ Conventions de nommage

---

## 📋 Checklist complète

Après avoir généré un domaine :

- [ ] ✅ Généré : `npm run generate:domain <nom> -- [options]`
- [ ] ✅ Validé : `npm run validate:domain <nom>`
- [ ] 📝 Personnaliser `types.ts` selon besoins
- [ ] 🔍 Compléter validations dans `validators.ts`
- [ ] 📘 Ajuster schéma GraphQL (si `--with-graphql`)
- [ ] 🔗 Ajouter typeDef dans `src/index.ts` (si GraphQL)
- [ ] ✅ Compiler : `npm run build`
- [ ] 🧪 Tester import : `import { MonDomaine } from '@clubmanager/types'`

---

## 🎯 Workflow recommandé

```bash
# 1. Créer avec dry-run pour vérifier
npm run generate:domain evenements -- --with-graphql --dry-run

# 2. Générer réellement
npm run generate:domain evenements -- --with-graphql

# 3. Valider
npm run validate:domain evenements

# 4. Personnaliser les types générés
code src/domains/evenements/types.ts

# 5. Compiler
npm run build

# 6. Tester dans l'app
cd ../../apps/backend
npm run dev
```

---

## 🎨 Options disponibles

| Option | Description |
|--------|-------------|
| `--with-graphql` | Ajoute GraphQL (typedefs + types) |
| `--with-service` | Ajoute interface service |
| `--with-database` | Ajoute types DB snake_case |
| `--with-subdomain` | Ajoute sous-domaine exemple |
| `--skip-validators` | Saute validators.ts (⚠️ non recommandé) |
| `--dry-run` | Simule sans créer fichiers |

---

## 📚 Scripts utiles

```bash
# Générer domaine
npm run generate:domain <nom>

# Valider domaine
npm run validate:domain <nom>

# Audit tous domaines
npm run audit:structure
npm run audit:graphql

# Compiler
npm run build
```

---

## 💡 Exemples concrets

### E-commerce

```bash
npm run generate:domain produits -- --with-graphql
npm run generate:domain commandes -- --with-graphql --with-service
npm run generate:domain stock -- --with-database
```

### Gestion utilisateurs

```bash
npm run generate:domain utilisateurs -- --with-graphql --with-database
npm run generate:domain roles -- --with-graphql
npm run generate:domain permissions -- --with-service
```

### Système événements

```bash
npm run generate:domain evenements -- --with-graphql --with-subdomain
npm run generate:domain reservations -- --with-graphql --with-service
npm run generate:domain notifications -- --with-service
```

---

## 🐛 Problèmes courants

### "Le domaine existe déjà"

```bash
# Supprimer et recréer
rm -rf src/domains/mon-domaine
npm run generate:domain mon-domaine -- --with-graphql
```

### "Nom doit être en kebab-case"

```bash
# ❌ Incorrect
npm run generate:domain MonDomaine
npm run generate:domain mon_domaine

# ✅ Correct
npm run generate:domain mon-domaine
```

### Erreur compilation TypeScript

```bash
# Valider le domaine
npm run validate:domain mon-domaine

# Vérifier imports avec .js
# Dans types.ts, validators.ts, etc :
import { Type } from "./types.js"; // ✅ Correct
import { Type } from "./types";    // ❌ Incorrect
```

### GraphQL typeDef non reconnu

Vérifier `src/index.ts` :

```typescript
// 1. Import manquant ?
import { monDomaineTypeDefs } from "./domains/mon-domaine/index.js";

// 2. Ajout dans allTypeDefs ?
export const allTypeDefs = [
  // ...
  monDomaineTypeDefs, // ← Doit être ici
];
```

---

## 🎓 Conventions à respecter

### Nommage

```
Domaine :         kebab-case     evenements
Types :           PascalCase     Evenement
Propriétés :      camelCase      createdAt
Constantes :      UPPER_SNAKE    MAX_ITEMS
Schémas Zod :     camelCase      createEvenementSchema
Types Zod :       PascalCase     CreateEvenementData
TypeDefs GraphQL: camelCase      evenementsTypeDefs
```

### Structure fichiers

```
✅ OBLIGATOIRE
├── types.ts          # Types métier (pas de Zod !)
├── validators.ts     # Schémas Zod uniquement
└── index.ts          # Exports

📘 SI GRAPHQL
├── graphql.typedefs.ts  # SDL (gql tag)
└── graphql.types.ts     # Types resolvers

🔵 OPTIONNEL
├── service.ts           # Interfaces service
├── database.types.ts    # Types DB snake_case
└── sous-domaine/        # Sous-modules
```

---

## 📞 Aide

**Documentation complète :** `GENERATOR_GUIDE.md`

**Templates détaillés :** `DOMAIN_TEMPLATE.md`

**Architecture globale :** `STRUCTURE.md`

---

## ⚡ Résumé ultra-rapide

```bash
# Créer
npm run generate:domain mon-domaine -- --with-graphql

# Valider
npm run validate:domain mon-domaine

# Compiler
npm run build

# Utiliser
import { MonDomaine } from '@clubmanager/types';
```

**C'est tout ! 🚀**

---

**Dernière mise à jour :** Février 2025  
**Version :** 1.0.0