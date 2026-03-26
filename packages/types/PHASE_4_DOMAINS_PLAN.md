# Phase 4 : Domain Types Migration Plan

## 📋 Vue d'ensemble

**Objectif** : Créer les types TypeScript pour TOUS les domaines basés sur le schéma DB v4.1/v4.2

**Approche** : 
1. Analyser les 39 tables de la DB
2. Les regrouper par domaines fonctionnels
3. Créer Domain Types + DTOs + Validators pour chaque domaine
4. Respecter les contraintes DB (FK, CHECK, lengths, etc.)

---

## 🗂️ Organisation des Domaines (39 tables)

### ✅ 1. **Users & Auth** (FAIT - Phase 1-3)
- [x] `utilisateurs` (table principale)
- [x] `genres` (relation)
- [x] `grades` (relation)
- [x] `status` (relation)
- [x] `email_validation_tokens` (auth)
- [x] `password_reset_tokens` (auth)
- [x] `password_reset_attempts` (sécurité)
- [x] `auth_attempts` (sécurité)
- [x] `manual_recovery_requests` (admin)
- [x] `validation_tokens` (générique)

**Statut** : ✅ Domain types + DTOs + Validators créés

---

### 🎯 2. **Courses (Cours)** - PRIORITÉ 1
Tables concernées :
- [ ] `cours` (table principale - instances de cours)
- [ ] `cours_recurrent` (cours récurrents/template)
- [ ] `professeurs` (enseignants)
- [ ] `cours_recurrent_professeur` (relation N-N)
- [ ] `inscriptions` (élèves inscrits aux cours)
- [ ] `reservations` (réservations de cours)

**Relations** :
- `cours.cours_recurrent_id` → `cours_recurrent.id`
- `cours_recurrent_professeur.cours_recurrent_id` → `cours_recurrent.id`
- `cours_recurrent_professeur.professeur_id` → `professeurs.id`
- `inscriptions.cours_id` → `cours.id`
- `inscriptions.utilisateur_id` → `utilisateurs.id`
- `reservations.cours_id` → `cours.id`
- `reservations.utilisateur_id` → `utilisateurs.id`

**Fichiers à créer** :
```
domain/course/
  ├── Course.types.ts          # cours (instances)
  ├── CourseRecurrent.types.ts # cours_recurrent (templates)
  ├── Professor.types.ts       # professeurs
  ├── Inscription.types.ts     # inscriptions
  └── Reservation.types.ts     # reservations

dtos/courses/
  ├── CourseDto.ts
  ├── CourseRecurrentDto.ts
  ├── ProfessorDto.ts
  ├── InscriptionDto.ts
  └── ReservationDto.ts

validators/courses/
  ├── course.validators.ts
  ├── course-recurrent.validators.ts
  ├── professor.validators.ts
  ├── inscription.validators.ts
  └── reservation.validators.ts
```

---

### 💰 3. **Payments (Paiements)** - PRIORITÉ 2
Tables concernées :
- [ ] `paiements` (paiements effectués)
- [ ] `echeances_paiements` (échéances/installments)
- [ ] `plans_tarifaires` (plans d'abonnement)

**Relations** :
- `paiements.utilisateur_id` → `utilisateurs.id`
- `paiements.cours_id` → `cours.id` (optionnel)
- `echeances_paiements.paiement_id` → `paiements.id`

**Fichiers à créer** :
```
domain/payment/
  ├── Payment.types.ts
  ├── PaymentSchedule.types.ts  # echeances_paiements
  └── PricingPlan.types.ts      # plans_tarifaires

dtos/payments/
  ├── PaymentDto.ts
  ├── PaymentScheduleDto.ts
  └── PricingPlanDto.ts

validators/payments/
  ├── payment.validators.ts
  ├── payment-schedule.validators.ts
  └── pricing-plan.validators.ts
```

---

### 🛒 4. **Store (Magasin)** - PRIORITÉ 3
Tables concernées :
- [ ] `articles` (produits à vendre)
- [ ] `categories` (catégories d'articles)
- [ ] `tailles` (tailles disponibles)
- [ ] `images` (images des articles)
- [ ] `stocks` (gestion des stocks)
- [ ] `mouvements_stock` (historique mouvements)
- [ ] `commandes` (commandes clients)
- [ ] `commande_articles` (articles dans commandes - N-N)

**Relations** :
- `articles.categorie_id` → `categories.id`
- `images.article_id` → `articles.id`
- `stocks.article_id` → `articles.id`
- `stocks.taille_id` → `tailles.id`
- `mouvements_stock.stock_id` → `stocks.id`
- `commandes.utilisateur_id` → `utilisateurs.id`
- `commande_articles.commande_id` → `commandes.id`
- `commande_articles.article_id` → `articles.id`

**Fichiers à créer** :
```
domain/store/
  ├── Article.types.ts
  ├── Category.types.ts
  ├── Size.types.ts
  ├── Image.types.ts
  ├── Stock.types.ts
  ├── StockMovement.types.ts
  ├── Order.types.ts
  └── OrderItem.types.ts       # commande_articles

dtos/store/
  ├── ArticleDto.ts
  ├── CategoryDto.ts
  ├── StockDto.ts
  ├── OrderDto.ts
  └── OrderItemDto.ts

validators/store/
  ├── article.validators.ts
  ├── category.validators.ts
  ├── stock.validators.ts
  └── order.validators.ts
```

---

### 💬 5. **Messages & Notifications** - PRIORITÉ 4
Tables concernées :
- [ ] `messages` (messages entre utilisateurs)
- [ ] `message_status` (statut des messages)
- [ ] `types_messages_personnalises` (types de templates)
- [ ] `messages_personnalises` (templates de messages)
- [ ] `notifications` (notifications système)
- [ ] `alertes_types` (types d'alertes)
- [ ] `alertes_utilisateurs` (alertes pour utilisateurs)
- [ ] `alertes_actions` (actions sur alertes)

**Relations** :
- `messages.expediteur_id` → `utilisateurs.id`
- `messages.destinataire_id` → `utilisateurs.id`
- `message_status.message_id` → `messages.id`
- `message_status.utilisateur_id` → `utilisateurs.id`
- `messages_personnalises.type_id` → `types_messages_personnalises.id`
- `notifications.utilisateur_id` → `utilisateurs.id`
- `alertes_utilisateurs.utilisateur_id` → `utilisateurs.id`
- `alertes_utilisateurs.alerte_type_id` → `alertes_types.id`
- `alertes_actions.alerte_id` → `alertes_utilisateurs.id`

**Fichiers à créer** :
```
domain/messaging/
  ├── Message.types.ts
  ├── MessageStatus.types.ts
  ├── MessageTemplate.types.ts
  ├── Notification.types.ts
  ├── Alert.types.ts
  ├── AlertType.types.ts
  └── AlertAction.types.ts

dtos/messaging/
  ├── MessageDto.ts
  ├── NotificationDto.ts
  └── AlertDto.ts

validators/messaging/
  ├── message.validators.ts
  ├── notification.validators.ts
  └── alert.validators.ts
```

---

### 👥 6. **Groups (Groupes)** - PRIORITÉ 5
Tables concernées :
- [ ] `groupes` (groupes d'utilisateurs)
- [ ] `groupes_utilisateurs` (relation N-N)

**Relations** :
- `groupes_utilisateurs.groupe_id` → `groupes.id`
- `groupes_utilisateurs.utilisateur_id` → `utilisateurs.id`

**Fichiers à créer** :
```
domain/group/
  ├── Group.types.ts
  └── GroupMember.types.ts

dtos/groups/
  └── GroupDto.ts

validators/groups/
  └── group.validators.ts
```

---

### 📊 7. **Statistics & Info** - PRIORITÉ 6
Tables concernées :
- [ ] `statistiques` (stats générales)
- [ ] `informations` (infos système)

**Fichiers à créer** :
```
domain/stats/
  ├── Statistics.types.ts
  └── Information.types.ts

dtos/stats/
  ├── StatisticsDto.ts
  └── InformationDto.ts

validators/stats/
  └── statistics.validators.ts
```

---

## 📝 Plan d'implémentation

### Étape 1 : Courses (2-3h)
1. Lire les tables concernées dans `SCHEMA_CONSOLIDATE.sql`
2. Identifier toutes les colonnes + types + contraintes
3. Créer Domain Types (Course, CourseRecurrent, Professor, Inscription, Reservation)
4. Créer DTOs (Create, Update, Response)
5. Créer Validators Zod (basés sur contraintes DB)
6. Créer constants si nécessaire
7. Tester compilation
8. Commit + Push

### Étape 2 : Payments (1-2h)
1. Idem pour Payment, PaymentSchedule, PricingPlan
2. Relations avec utilisateurs + cours
3. Validators pour montants, dates échéances
4. Commit + Push

### Étape 3 : Store (3-4h)
1. Article + Category + Stock + Order
2. Gestion tailles + images
3. Mouvements stock
4. Validators complexes (prix, quantités, etc.)
5. Commit + Push

### Étape 4 : Messages & Notifications (2-3h)
1. Messages + Templates + Notifications + Alertes
2. Relations utilisateurs
3. Validators pour contenus
4. Commit + Push

### Étape 5 : Groups (30min-1h)
1. Simple : Group + GroupMember
2. Validators
3. Commit + Push

### Étape 6 : Statistics (30min-1h)
1. Statistics + Information
2. DTOs lecture seule
3. Commit + Push

---

## 🎯 Priorités

**Sprint 1 (Urgent)** :
- ✅ Users & Auth (FAIT)
- 🎯 Courses (métier principal)
- 🎯 Payments (métier principal)

**Sprint 2 (Important)** :
- Store (fonctionnalité e-commerce)
- Messages & Notifications (communication)

**Sprint 3 (Nice to have)** :
- Groups
- Statistics

---

## 🔧 Template pour chaque domaine

Pour chaque domaine, suivre cette structure :

1. **Domain Types** (`domain/*/`)
   - Interface principale (correspond 1:1 à la table DB)
   - Interface avec relations chargées (WithRelations)
   - Interface publique (sans données sensibles)
   - Interface basique (pour références)

2. **DTOs** (`dtos/*/`)
   - CreateDto (données entrantes)
   - UpdateDto (mise à jour partielle)
   - ResponseDto (données sortantes)
   - ListItemDto (pour listes/tableaux)

3. **Validators** (`validators/*/`)
   - createSchema (validation création)
   - updateSchema (validation mise à jour)
   - Schemas spécifiques (search, filter, etc.)
   - Types inférés exportés

4. **Constants** (si nécessaire)
   - Longueurs max/min
   - Regex spécifiques
   - Valeurs par défaut

---

## 📊 Métriques de progression

- [x] Users & Auth : 10 tables → **100%** ✅
- [ ] Courses : 6 tables → **0%**
- [ ] Payments : 3 tables → **0%**
- [ ] Store : 8 tables → **0%**
- [ ] Messaging : 8 tables → **0%**
- [ ] Groups : 2 tables → **0%**
- [ ] Stats : 2 tables → **0%**

**Total : 39 tables**
**Complétées : 10 / 39 (26%)**

---

## 🚀 Prochaine étape immédiate

**Commencer par COURSES (Priorité 1)** :
1. Analyser les 6 tables courses
2. Créer les Domain Types
3. Créer les DTOs
4. Créer les Validators
5. Compiler et tester
6. Commit + Push

**Tu veux que je commence maintenant ?** 🎯