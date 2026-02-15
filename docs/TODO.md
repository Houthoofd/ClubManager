# TODO - ClubManager API

Ce document liste tous les TODO restants dans le projet ClubManager API après la résolution des validators manquants.

## ✅ Résolu (2024)

### Validators manquants (PRIORITÉ HAUTE)
- ✅ `createPaymentIntentEcheanceSchema` - Créé dans `@clubmanager/types/domains/paiements/validators.ts`
- ✅ `createPaymentIntentCommandeSchema` - Créé dans `@clubmanager/types/domains/paiements/validators.ts`
- ✅ `toStripeAmount` - Utilitaire ajouté dans `@clubmanager/types/domains/paiements/validators.ts`
- ✅ `getWebhookLogsSchema` - Créé dans `@clubmanager/types/infrastructure/webhooks.ts`
- ✅ `getWebhookStatsSchema` - Créé dans `@clubmanager/types/infrastructure/webhooks.ts`
- ✅ `retryWebhookSchema` - Créé dans `@clubmanager/types/infrastructure/webhooks.ts`
- ✅ `processWebhookManuallySchema` - Créé dans `@clubmanager/types/infrastructure/webhooks.ts`
- ✅ Réactivation de la validation dans `paiements.resolvers.ts`
- ✅ Réactivation de la validation dans `webhooks.resolvers.ts`

---

## 📋 TODO Restants

### 🔴 PRIORITÉ HAUTE - Infrastructure critique

#### 1. Email & Notifications
**Fichier:** `api/src/infrastructure/external-services/email/sendgrid-sender.ts:99`
```typescript
// TODO: Implémenter avec Prisma
// await prisma.emails.create({
//   data: { to, subject, content, utilisateurId }
// });
```
**Action:** Implémenter la sauvegarde des emails envoyés en base de données avec Prisma.

**Fichier:** `api/src/routes/auth/core/services/auth.service.ts:346`
```typescript
// TODO: Implémenter l'envoi d'email de réinitialisation
```
**Action:** Implémenter l'envoi réel d'email de réinitialisation de mot de passe.

---

#### 2. Redis & Rate Limiting
**Fichier:** `api/src/routes/auth/core/services/rate-limit.service.ts:177-209`
```typescript
// TODO: Implémenter avec ioredis ou redis client
```
**Action:** Implémenter le store Redis pour le rate limiting en production multi-instance.
- Initialiser le client Redis (ligne 183)
- Implémenter `get()` (ligne 191)
- Implémenter `set()` (ligne 196)
- Implémenter `delete()` (ligne 201)
- Implémenter `increment()` (ligne 206)

---

#### 3. GraphQL Subscriptions
**Fichier:** `api/src/routes/stripe/core/webhooks/resolvers/webhooks.resolvers.ts:331`
```typescript
// TODO: Implémenter avec PubSub (Redis ou en mémoire)
```
**Action:** Implémenter le système de PubSub pour les subscriptions GraphQL temps réel des webhooks.

---

### 🟡 PRIORITÉ MOYENNE - Fonctionnalités métier

#### 4. Module Compte - Données de référence
**Fichiers:** `api/src/routes/compte/core/resolvers/compte.resolvers.ts`

- **Ligne 382:** Implémenter récupération des genres depuis DB
- **Ligne 402:** Implémenter récupération des grades depuis DB
- **Ligne 422:** Implémenter récupération des statuses depuis DB
- **Ligne 442:** Implémenter récupération des plans tarifaires depuis DB

**Action:** Connecter les resolvers GraphQL aux tables de référence de la base de données.

---

#### 5. Module Cours - Schéma DB
**Fichiers:** `api/src/routes/cours/core/resolvers/cours.resolvers.ts`

- **Ligne 93:** Ajouter colonne `places_max` au schéma
- **Ligne 358:** Utiliser `places_max` dans les statistiques

**Action:** Ajouter la colonne `places_max` au schéma Prisma et mettre à jour les resolvers.

---

#### 6. Module Paiements - Historique
**Fichier:** `api/src/routes/paiements/core/resolvers/paiements.resolvers.ts:125`
```typescript
// TODO: Implémenter la récupération de l'historique depuis la DB
```
**Action:** Implémenter la requête Prisma pour récupérer l'historique des paiements.

---

#### 7. Module Webhooks - Alertes & Statistiques
**Fichier:** `api/src/routes/stripe/core/webhooks/webhook.service.ts`

- **Ligne 930:** Créer système d'alerte admin pour échecs de paiement
- **Ligne 1034:** Récupérer plan name depuis `subscription.items`
- **Ligne 1240:** Récupérer plan name depuis metadata
- **Ligne 1497:** Calculer temps de traitement moyen et success rate

**Action:** Améliorer le suivi et les notifications des webhooks.

---

#### 8. Module Messages - Templates Email
**Fichier:** `api/src/routes/messages/core/services/email.service.ts:502`
```typescript
// TODO: Implémenter avec le nouveau système de templates
```
**Action:** Migrer vers le nouveau système de templates email (EmailClient).

---

#### 9. Module Utilisateurs - Authentification
**Fichiers:** `api/src/routes/utilisateurs/core/resolvers/utilisateurs.resolvers.ts`

- **Ligne 186:** Implémenter vérification token email
- **Ligne 209:** Implémenter test configuration email
- **Ligne 354:** Implémenter connexion par userId
- **Ligne 374:** Implémenter connexion par email
- **Ligne 523:** Implémenter envoi email de test

**Action:** Compléter les fonctionnalités d'authentification et de test.

---

### 🟢 PRIORITÉ BASSE - Refactoring & Organisation

#### 10. Migration services vers architecture DDD
**Fichiers:**
- `api/src/routes/commandes/index.ts:8` - Migrer services vers `core/services/`
- `api/src/routes/compte/index.ts:8` - Migrer services vers `core/services/`
- `api/src/routes/informations/index.ts:8` - Migrer services vers `core/services/`

**Action:** Uniformiser la structure des modules selon le pattern DDD.

---

#### 11. Services refactorés - Nettoyage
**Fichiers:**
- `api/src/routes/messages/core/services/email.service.ts:1` - Services email refactorés
- `api/src/routes/utilisateurs/core/services/utilisateurs.service.ts:14` - EmailService refactorisé

**Action:** Supprimer les imports commentés et finaliser la migration vers EmailClient.

---

#### 12. Module Verification - TypeDefs
**Fichier:** `api/src/routes/verification/index.ts:10`
```typescript
// TODO: Create TypeDefs if needed
```
**Action:** Créer les TypeDefs GraphQL si le module Verification en a besoin.

---

#### 13. Configuration - Auth
**Fichier:** `api/src/shared/config/index.ts:8`
```typescript
// TODO: Create auth.config.js file
```
**Action:** Créer fichier de configuration centralisée pour l'authentification.

---

### 🔵 Tests & Documentation

#### 14. Tests avec mocks
**Fichier:** `api/src/infrastructure/external-services/email/__tests__/email-client.test.ts:44`
```typescript
// TODO: Ajouter tests avec mocks une fois les dépendances résolues
```
**Action:** Ajouter des tests unitaires avec mocks pour EmailClient (actuellement skipped).

---

## 📊 Statistiques

- **Total TODO résolus:** 9
- **Total TODO restants:** ~35
- **Priorité HAUTE:** 3 items
- **Priorité MOYENNE:** 6 items
- **Priorité BASSE:** 3 items
- **Tests:** 1 item

---

## 🎯 Prochaines étapes recommandées

1. **Infrastructure critique (1-2 semaines)**
   - Implémenter sauvegarde emails en DB
   - Implémenter envoi email réinitialisation
   - Implémenter Redis store pour rate limiting

2. **Fonctionnalités métier (2-3 semaines)**
   - Connecter les données de référence (genres, grades, statuses, plans)
   - Implémenter historique paiements
   - Améliorer suivi webhooks

3. **Refactoring & Organisation (1 semaine)**
   - Migrer services vers architecture DDD
   - Nettoyer imports obsolètes
   - Créer configuration auth centralisée

4. **Tests & Documentation (ongoing)**
   - Ajouter tests avec mocks
   - Documenter nouvelles fonctionnalités

---

## 📝 Notes

- Tous les validators critiques ont été créés et sont fonctionnels
- L'API compile sans erreurs TypeScript
- Tous les tests passent (5 suites, 46 tests passed, 9 skipped)
- Les tests d'intégration (SendGrid, S3) sont skipped intentionnellement (nécessitent credentials)

---

**Dernière mise à jour:** 2024
**Status:** ✅ API opérationnelle - TODO non-bloquants restants