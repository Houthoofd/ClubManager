# Migration FR → EN - ClubManager Database

## 📋 Vue d'ensemble

Ce document décrit la migration complète des noms de colonnes français vers l'anglais dans la base de données `clubmanager_test`.

**Date de migration :** 2025-02-20  
**Statut :** En cours  
**Impact :** Breaking change - Nécessite mise à jour de tous les services

---

## 🎯 Objectif

Uniformiser tous les noms de tables et colonnes en **anglais** pour :
- ✅ Améliorer la cohérence du code
- ✅ Faciliter la collaboration internationale
- ✅ Respecter les conventions de nommage standard
- ✅ Simplifier la maintenance à long terme

---

## 📊 Changements de colonnes

### 1. Table `orders`

| Ancien nom (FR) | Nouveau nom (EN) | Type |
|-----------------|------------------|------|
| `numero_commande` | `order_number` | VARCHAR(100) |
| `date_commande` | `order_date` | TIMESTAMP |

**Indexes mis à jour :**
- `idx_numero_commande` → `idx_order_number`
- `idx_statut_date_total` → `idx_status_date_total`

---

### 2. Table `orders_archive`

| Ancien nom (FR) | Nouveau nom (EN) | Type |
|-----------------|------------------|------|
| `numero_commande` | `order_number` | VARCHAR(100) |
| `date_commande` | `order_date` | TIMESTAMP |

**Indexes mis à jour :**
- `idx_numero_commande` → `idx_order_number`
- `idx_statut_date_total` → `idx_status_date_total`

---

### 3. Table `order_items`

| Ancien nom (FR) | Nouveau nom (EN) | Type |
|-----------------|------------------|------|
| `commande_id` | `order_id` | INT |

**Foreign Keys mis à jour :**
- `order_items_ibfk_1` → `fk_order_items_order`

**Indexes mis à jour :**
- `idx_commande_article` → `idx_order_article`

---

### 4. Table `order_status_history`

| Ancien nom (FR) | Nouveau nom (EN) | Type |
|-----------------|------------------|------|
| `commande_id` | `order_id` | INT |

**Foreign Keys mis à jour :**
- `order_status_history_ibfk_1` → `fk_order_status_history_order`

**Indexes mis à jour :**
- `idx_commande_id` → `idx_order_id`

---

### 5. Table `payments`

| Ancien nom (FR) | Nouveau nom (EN) | Type | Notes |
|-----------------|------------------|------|-------|
| `date_paiement` | `payment_date` | TIMESTAMP | - |
| `methode_paiement` | `payment_method_legacy` | VARCHAR(50) | ⚠️ DEPRECATED - Utiliser `payment_method_id` |
| `abonnement_id` | `subscription_id` | INT | FK vers `pricing_plans` |
| `commande_id` | `order_id` | INT | FK vers `orders` |

**Foreign Keys mis à jour :**
- `payments_ibfk_2` → `fk_payments_subscription`
- `payments_ibfk_3` → `fk_payments_order`

**Indexes mis à jour :**
- `abonnement_id` → `idx_subscription_id`
- `commande_id` → `idx_order_id`
- `idx_date` → `idx_payment_date`

---

### 6. Table `payments_archive`

| Ancien nom (FR) | Nouveau nom (EN) | Type |
|-----------------|------------------|------|
| `date_paiement` | `payment_date` | TIMESTAMP |
| `methode_paiement` | `payment_method_legacy` | VARCHAR(50) |
| `abonnement_id` | `subscription_id` | INT |
| `commande_id` | `order_id` | INT |

---

### 7. Table `payment_schedules`

| Ancien nom (FR) | Nouveau nom (EN) | Type |
|-----------------|------------------|------|
| `abonnement_id` | `subscription_id` | INT |
| `date_echeance` | `due_date` | DATE |
| `date_paiement` | `payment_date` | DATE |

**Foreign Keys mis à jour :**
- `payment_schedules_ibfk_2` → `fk_payment_schedules_subscription`

**Indexes mis à jour :**
- `idx_abonnement_echeance` → `idx_subscription_due_date`

---

### 8. Table `user_subscriptions`

| Ancien nom (FR) | Nouveau nom (EN) | Type |
|-----------------|------------------|------|
| `abonnement_id` | `subscription_id` | INT |

**Foreign Keys mis à jour :**
- `fk_user_subscriptions_abonnement` → `fk_user_subscriptions_subscription`

**Indexes mis à jour :**
- `idx_abonnement_id` → `idx_subscription_id`

---

## 📝 Colonnes conservées (déjà en anglais ou acceptables)

Les colonnes suivantes **ne sont PAS modifiées** :

### Table `users`
- ✅ `first_name`, `last_name`, `birth_date` (déjà en anglais)
- ✅ `genre_id` (acceptable - référence à `genders`)
- ✅ `grade_id`, `status_id`, `email`, `phone`, etc.

### Autres tables
- ✅ Toutes les nouvelles tables (Phase 1-2) sont déjà en anglais
- ✅ `Session`, `AuditLog`, `Email`, `Sport`, `UserProfile`, etc.

---

## 🔧 Impact sur le code

### 1. **Schéma Prisma** (`api/prisma/schema.prisma`)

Tous les modèles doivent être mis à jour pour refléter les nouveaux noms de colonnes.

**Exemple :**
```prisma
model orders {
  id           Int      @id @default(autoincrement())
  order_number String?  @db.VarChar(100)  // était: numero_commande
  order_date   DateTime @default(now())   // était: date_commande
  // ...
}
```

### 2. **Types TypeScript** (`packages/types/src/domains/`)

Tous les types et interfaces doivent être mis à jour.

**Domaines à modifier :**
- ✅ `paiements` → Renommer en `payments`
- ✅ `commandes` → Renommer en `orders`
- ✅ Toutes les propriétés d'interfaces

**Exemple :**
```typescript
// AVANT
interface Paiement {
  commande_id?: number;
  abonnement_id?: number;
  date_paiement: Date;
  methode_paiement: string;
}

// APRÈS
interface Payment {
  order_id?: number;
  subscription_id?: number;
  payment_date: Date;
  payment_method_legacy?: string; // DEPRECATED
  payment_method_id: number;      // NOUVEAU
}
```

### 3. **Validators Zod** (`packages/types/src/domains/*/validators.ts`)

Tous les schémas Zod doivent être mis à jour.

**Exemple :**
```typescript
// AVANT
export const creerPaiementSchema = z.object({
  commandeId: z.number().optional(),
  abonnementId: z.number(),
  datePaiement: z.date(),
});

// APRÈS
export const createPaymentSchema = z.object({
  order_id: z.number().optional(),
  subscription_id: z.number(),
  payment_date: z.date(),
});
```

### 4. **Tests** (`packages/types/src/domains/*/__tests__/`)

Tous les tests doivent être mis à jour avec les nouveaux noms.

---

## 🚀 Procédure de migration

### Étape 1 : Backup de la base de données

```bash
mysqldump -u root -p clubmanager_test > backup_before_migration_$(date +%Y%m%d).sql
```

### Étape 2 : Appliquer la migration SQL

**Option A : Via script Node.js (recommandé)**
```bash
cd api
node scripts/apply-translation-migration.js
```

**Option B : Via MySQL directement**
```bash
mysql -u root -p clubmanager_test < api/prisma/migrations/20250220_translate_all_to_english/migration.sql
```

### Étape 3 : Mettre à jour le schéma Prisma

```bash
cd api
npx prisma db pull
npx prisma generate
```

### Étape 4 : Mettre à jour les types TypeScript

```bash
cd packages/types
# Modifier tous les fichiers types.ts et validators.ts
# Voir sections ci-dessous pour détails
```

### Étape 5 : Mettre à jour les tests

```bash
cd packages/types
# Modifier tous les fichiers __tests__/*.test.ts
npm test  # Vérifier que tous les tests passent
```

### Étape 6 : Mettre à jour l'API

```bash
cd api
# Modifier tous les services, controllers, repositories
# pour utiliser les nouveaux noms de colonnes
```

### Étape 7 : Mettre à jour le frontend

```bash
cd frontend
# Modifier tous les appels API et types
# pour utiliser les nouveaux noms
```

---

## ⚠️ Points d'attention

### 1. **Backward Compatibility**

Cette migration est un **breaking change**. Toutes les applications clientes doivent être mises à jour.

### 2. **Données existantes**

Les **données** ne sont PAS modifiées, seuls les **noms de colonnes** changent.

### 3. **Foreign Keys**

Toutes les foreign keys sont recréées avec les nouveaux noms de colonnes.

### 4. **Indexes**

Tous les indexes sont recréés pour optimiser les performances avec les nouveaux noms.

### 5. **Champ DEPRECATED**

`payment_method_legacy` (ancien `methode_paiement`) est marqué comme **DEPRECATED**.  
Utiliser `payment_method_id` à la place (référence à la table `PaymentMethod`).

---

## 📋 Checklist de validation

Après la migration, vérifier :

- [ ] La migration SQL s'est exécutée sans erreur
- [ ] `npx prisma db pull` génère un schéma correct
- [ ] `npx prisma generate` fonctionne sans erreur
- [ ] Les types TypeScript compilent sans erreur
- [ ] Tous les tests passent (352/352)
- [ ] L'API démarre sans erreur
- [ ] Le frontend se connecte correctement
- [ ] Les requêtes SQL fonctionnent avec les nouveaux noms
- [ ] Les foreign keys sont correctes
- [ ] Les indexes existent et sont performants

---

## 🔄 Rollback (si nécessaire)

En cas de problème, restaurer le backup :

```bash
mysql -u root -p clubmanager_test < backup_before_migration_YYYYMMDD.sql
cd api
npx prisma db pull
npx prisma generate
```

---

## 📚 Dictionnaire de traduction

| Français | Anglais | Type |
|----------|---------|------|
| `commande` | `order` | Table/Colonne |
| `numero_commande` | `order_number` | Colonne |
| `date_commande` | `order_date` | Colonne |
| `paiement` | `payment` | Table/Colonne |
| `date_paiement` | `payment_date` | Colonne |
| `methode_paiement` | `payment_method_legacy` | Colonne (DEPRECATED) |
| `abonnement` | `subscription` | Table/Colonne |
| `echeance` | `schedule` / `due_date` | Contexte dépendant |
| `genre` | `gender` | Table/Colonne |
| `utilisateur` | `user` | Table/Colonne |

---

## 📞 Support

En cas de questions ou problèmes :
1. Consulter les logs de migration
2. Vérifier l'état de la base de données
3. Contacter l'équipe de développement

---

**Document créé le :** 2025-02-20  
**Dernière mise à jour :** 2025-02-20  
**Auteur :** ClubManager Dev Team