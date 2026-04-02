# 📋 Plan d'Implémentation - ClubManager Frontend V2

Plan détaillé de toutes les features à implémenter basé sur l'analyse du package `@clubmanager/types`.

---

## 📊 Vue d'Ensemble des Domaines

Le package `@clubmanager/types` définit **9 domaines principaux** :

1. **Users** (Utilisateurs) - ✅ Auth fait à 60%
2. **Courses** (Cours & Sessions)
3. **Payments** (Paiements)
4. **Store** (Boutique)
5. **Messaging** (Messagerie)
6. **Groups** (Groupes)
7. **Statistics** (Statistiques)
8. **Lookup** (Tables de référence)
9. **Payment Schedules** (Échéanciers)

---

## 🎯 Roadmap de Développement

### Phase 1 : Fondations (Semaine 1-2) 🔴 CRITIQUE

#### ✅ 1.1 Authentication & Users (60% fait)

**Déjà implémenté :**
- ✅ Login/Logout
- ✅ Register
- ✅ Forgot/Reset Password
- ✅ Protected Routes
- ✅ RBAC (Role-Based Access Control)

**À compléter :**
- [ ] Profile Management complet
- [ ] Avatar upload
- [ ] Email verification flow
- [ ] Password change
- [ ] User preferences
- [ ] User search & filters (admin)
- [ ] User activation/deactivation (admin)
- [ ] Soft delete & GDPR (anonymization)

**Hooks à ajouter :**
```typescript
// features/users/model/
- useUserProfile() // GET /users/:id
- useUpdateProfile() // PUT /users/:id
- useUploadAvatar() // POST /users/:id/avatar
- useChangePassword() // PUT /users/:id/password
- useUserPreferences() // GET/PUT /users/:id/preferences
- useUsers() // GET /users (admin, with filters)
- useActivateUser() // PUT /users/:id/activate
- useDeactivateUser() // PUT /users/:id/deactivate
- useDeleteUser() // DELETE /users/:id (soft delete)
- useAnonymizeUser() // POST /users/:id/anonymize (GDPR)
```

**API Endpoints :**
```
GET    /users                    # Liste avec filtres (admin)
GET    /users/:id                # Profil détaillé
PUT    /users/:id                # Mise à jour profil
DELETE /users/:id                # Soft delete
POST   /users/:id/avatar         # Upload avatar
PUT    /users/:id/password       # Changer mot de passe
GET    /users/:id/preferences    # Préférences
PUT    /users/:id/preferences    # Sauver préférences
PUT    /users/:id/activate       # Activer utilisateur
PUT    /users/:id/deactivate     # Désactiver utilisateur
POST   /users/:id/anonymize      # Anonymiser (GDPR)
GET    /users/search?q=          # Recherche utilisateurs
```

**Pages :**
```
/profile                  # Mon profil
/profile/edit             # Éditer profil
/profile/password         # Changer mot de passe
/profile/preferences      # Préférences
/admin/users              # Gestion utilisateurs (admin)
/admin/users/:id          # Détail utilisateur (admin)
```

---

### Phase 2 : Courses (Cours & Sessions) (Semaine 2-4) 🔴 HAUTE

#### 2.1 CourseRecurrent (Templates de cours récurrents)

**Types disponibles :**
```typescript
interface CourseRecurrent {
  id: number;
  type_cours: string;
  jour_semaine: number; // 1-7 (Lundi-Dimanche)
  heure_debut: string;  // TIME
  heure_fin: string;    // TIME
  active: boolean;
}
```

**Feature à créer :**
```
features/course-templates/
├── api/
│   └── courseTemplatesApi.ts
├── model/
│   ├── types.ts
│   ├── useCourseTemplates.ts
│   ├── useCourseTemplate.ts
│   ├── useCreateCourseTemplate.ts
│   ├── useUpdateCourseTemplate.ts
│   ├── useDeleteCourseTemplate.ts
│   └── useAssignProfessors.ts
├── ui/
│   ├── CourseTemplatesList.tsx
│   ├── CourseTemplateCard.tsx
│   ├── CourseTemplateForm.tsx
│   └── ProfessorSelector.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- useCourseTemplates(filters?) // GET /course-templates
- useCourseTemplate(id) // GET /course-templates/:id
- useCourseTemplateWithProfessors(id) // GET /course-templates/:id?include=professors

// Mutations
- useCreateCourseTemplate() // POST /course-templates
- useUpdateCourseTemplate() // PUT /course-templates/:id
- useDeleteCourseTemplate() // DELETE /course-templates/:id
- useAssignProfessor() // POST /course-templates/:id/professors/:professorId
- useUnassignProfessor() // DELETE /course-templates/:id/professors/:professorId
- useToggleCourseTemplate() // PUT /course-templates/:id/toggle
- useGenerateCoursesFromTemplate() // POST /course-templates/:id/generate
```

**API Endpoints :**
```
GET    /course-templates                    # Liste templates
GET    /course-templates/:id                # Détail template
POST   /course-templates                    # Créer template
PUT    /course-templates/:id                # Modifier template
DELETE /course-templates/:id                # Supprimer template
PUT    /course-templates/:id/toggle         # Activer/désactiver
POST   /course-templates/:id/professors     # Assigner professeur
DELETE /course-templates/:id/professors/:pid # Retirer professeur
POST   /course-templates/:id/generate       # Générer cours (date_debut, date_fin)
GET    /course-templates?jour_semaine=1     # Filtrer par jour
GET    /course-templates?active=true        # Filtrer actifs
```

**Pages :**
```
/admin/course-templates           # Liste templates (admin)
/admin/course-templates/new       # Créer template (admin)
/admin/course-templates/:id/edit  # Éditer template (admin)
```

---

#### 2.2 Courses (Instances de cours)

**Types disponibles :**
```typescript
interface Course {
  id: number;
  date_cours: Date;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  cours_recurrent_id: number;
  annule: boolean;
}
```

**Feature à créer :**
```
features/courses/
├── api/
│   └── coursesApi.ts
├── model/
│   ├── types.ts
│   ├── useCourses.ts
│   ├── useCourse.ts
│   ├── useCreateCourse.ts
│   ├── useUpdateCourse.ts
│   ├── useCancelCourse.ts
│   └── useCoursesCalendar.ts
├── ui/
│   ├── CoursesList.tsx
│   ├── CourseCard.tsx
│   ├── CourseDetail.tsx
│   ├── CourseCalendar.tsx
│   ├── CourseFilters.tsx
│   └── CancelCourseModal.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- useCourses(filters?) // GET /courses
- useCourse(id) // GET /courses/:id
- useCourseWithDetails(id) // GET /courses/:id?include=inscriptions,reservations
- useCoursesCalendar(date_debut, date_fin) // GET /courses/calendar
- useCoursesByDate(date) // GET /courses?date=YYYY-MM-DD
- useCoursesByType(type) // GET /courses?type_cours=X
- useUpcomingCourses() // GET /courses?upcoming=true
- useCoursesForWeek(weekStart) // GET /courses/week/:date

// Mutations
- useCreateCourse() // POST /courses
- useUpdateCourse() // PUT /courses/:id
- useCancelCourse() // PUT /courses/:id/cancel
- useReactivateCourse() // PUT /courses/:id/reactivate
- useDuplicateCourse() // POST /courses/:id/duplicate
```

**API Endpoints :**
```
GET    /courses                       # Liste cours
GET    /courses/:id                   # Détail cours
POST   /courses                       # Créer cours
PUT    /courses/:id                   # Modifier cours
DELETE /courses/:id                   # Supprimer cours
PUT    /courses/:id/cancel            # Annuler cours
PUT    /courses/:id/reactivate        # Réactiver cours
POST   /courses/:id/duplicate         # Dupliquer cours
GET    /courses/calendar?start=&end=  # Calendrier période
GET    /courses/upcoming              # Prochains cours
GET    /courses/week/:date            # Cours de la semaine
GET    /courses?date=YYYY-MM-DD       # Cours d'un jour
GET    /courses?type_cours=Karate     # Filtrer par type
GET    /courses?annule=false          # Non annulés
```

**Pages :**
```
/courses                    # Liste des cours (public)
/courses/calendar           # Calendrier des cours
/courses/:id                # Détail d'un cours
/admin/courses              # Gestion cours (admin)
/admin/courses/new          # Créer cours (admin)
/admin/courses/:id/edit     # Éditer cours (admin)
```

---

#### 2.3 Professors (Professeurs)

**Types disponibles :**
```typescript
interface Professor {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  photo_url?: string;
  grade_id?: number;
  active: boolean;
}
```

**Feature à créer :**
```
features/professors/
├── api/
│   └── professorsApi.ts
├── model/
│   ├── types.ts
│   ├── useProfessors.ts
│   ├── useProfessor.ts
│   ├── useCreateProfessor.ts
│   ├── useUpdateProfessor.ts
│   └── useProfessorSchedule.ts
├── ui/
│   ├── ProfessorsList.tsx
│   ├── ProfessorCard.tsx
│   ├── ProfessorDetail.tsx
│   ├── ProfessorForm.tsx
│   └── ProfessorSchedule.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- useProfessors(filters?) // GET /professors
- useProfessor(id) // GET /professors/:id
- useProfessorWithCourses(id) // GET /professors/:id?include=courses
- useProfessorSchedule(id, date) // GET /professors/:id/schedule
- useActiveProfessors() // GET /professors?active=true

// Mutations
- useCreateProfessor() // POST /professors
- useUpdateProfessor() // PUT /professors/:id
- useDeleteProfessor() // DELETE /professors/:id
- useActivateProfessor() // PUT /professors/:id/activate
- useDeactivateProfessor() // PUT /professors/:id/deactivate
- useUploadProfessorPhoto() // POST /professors/:id/photo
```

**API Endpoints :**
```
GET    /professors                   # Liste professeurs
GET    /professors/:id               # Détail professeur
POST   /professors                   # Créer professeur
PUT    /professors/:id               # Modifier professeur
DELETE /professors/:id               # Supprimer professeur
PUT    /professors/:id/activate      # Activer
PUT    /professors/:id/deactivate    # Désactiver
POST   /professors/:id/photo         # Upload photo
GET    /professors/:id/schedule      # Planning professeur
GET    /professors/:id/courses       # Cours du professeur
GET    /professors?active=true       # Filtrer actifs
GET    /professors?specialite=Karate # Filtrer par spécialité
```

**Pages :**
```
/professors                    # Liste professeurs (public)
/professors/:id                # Profil professeur
/admin/professors              # Gestion professeurs (admin)
/admin/professors/new          # Ajouter professeur (admin)
/admin/professors/:id/edit     # Éditer professeur (admin)
```

---

#### 2.4 Inscriptions (Inscriptions aux cours)

**Types disponibles :**
```typescript
interface Inscription {
  id: number;
  utilisateur_id: number;
  cours_id: number;
  status_id?: number; // NULL=absent, 1=présent
  date_inscription: Date;
  commentaire?: string;
}
```

**Feature à créer :**
```
features/inscriptions/
├── api/
│   └── inscriptionsApi.ts
├── model/
│   ├── types.ts
│   ├── useInscriptions.ts
│   ├── useEnrollCourse.ts
│   ├── useUnenrollCourse.ts
│   ├── useMarkAttendance.ts
│   └── useMyInscriptions.ts
├── ui/
│   ├── EnrollButton.tsx
│   ├── MyInscriptionsList.tsx
│   ├── AttendanceSheet.tsx
│   └── InscriptionStatus.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- useInscriptions(filters?) // GET /inscriptions
- useCourseInscriptions(courseId) // GET /courses/:id/inscriptions
- useMyInscriptions() // GET /me/inscriptions
- useUserInscriptions(userId) // GET /users/:id/inscriptions
- useInscriptionsByCourse(courseId) // GET /inscriptions?cours_id=X
- useIsEnrolled(courseId) // Check si inscrit

// Mutations
- useEnrollCourse() // POST /courses/:id/enroll
- useUnenrollCourse() // DELETE /courses/:id/enroll
- useMarkAttendance() // PUT /inscriptions/:id/attendance
- useBulkMarkAttendance() // PUT /courses/:id/attendance (bulk)
- useAddInscriptionComment() // PUT /inscriptions/:id/comment
```

**API Endpoints :**
```
GET    /inscriptions                    # Liste inscriptions (admin)
GET    /inscriptions/:id                # Détail inscription
POST   /courses/:id/enroll              # S'inscrire à un cours
DELETE /courses/:id/enroll              # Se désinscrire
GET    /courses/:id/inscriptions        # Inscriptions d'un cours
PUT    /inscriptions/:id/attendance     # Marquer présence
PUT    /courses/:id/attendance          # Marquer présences (bulk)
PUT    /inscriptions/:id/comment        # Ajouter commentaire
GET    /me/inscriptions                 # Mes inscriptions
GET    /users/:id/inscriptions          # Inscriptions d'un user
GET    /inscriptions?cours_id=X         # Par cours
GET    /inscriptions?utilisateur_id=X   # Par utilisateur
GET    /inscriptions?status_id=1        # Par statut
```

**Pages :**
```
/my-courses                    # Mes inscriptions
/courses/:id/enroll            # Page d'inscription
/admin/courses/:id/attendance  # Feuille de présence (admin)
```

---

#### 2.5 Reservations (Réservations de cours)

**Types disponibles :**
```typescript
interface Reservation {
  id: number;
  utilisateur_id: number;
  cours_id: number;
  date_reservation: Date;
  annule: boolean;
}
```

**Feature à créer :**
```
features/reservations/
├── api/
│   └── reservationsApi.ts
├── model/
│   ├── types.ts
│   ├── useReservations.ts
│   ├── useReserveCourse.ts
│   ├── useCancelReservation.ts
│   └── useMyReservations.ts
├── ui/
│   ├── ReserveButton.tsx
│   ├── MyReservationsList.tsx
│   └── ReservationStatus.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- useReservations(filters?) // GET /reservations
- useCourseReservations(courseId) // GET /courses/:id/reservations
- useMyReservations() // GET /me/reservations
- useUserReservations(userId) // GET /users/:id/reservations
- useIsReserved(courseId) // Check si réservé

// Mutations
- useReserveCourse() // POST /courses/:id/reserve
- useCancelReservation() // DELETE /reservations/:id
- useConvertReservation() // POST /reservations/:id/convert (→ inscription)
```

**API Endpoints :**
```
GET    /reservations                    # Liste réservations (admin)
GET    /reservations/:id                # Détail réservation
POST   /courses/:id/reserve             # Réserver un cours
DELETE /reservations/:id                # Annuler réservation
POST   /reservations/:id/convert        # Convertir en inscription
GET    /courses/:id/reservations        # Réservations d'un cours
GET    /me/reservations                 # Mes réservations
GET    /users/:id/reservations          # Réservations d'un user
GET    /reservations?cours_id=X         # Par cours
GET    /reservations?annule=false       # Non annulées
```

**Pages :**
```
/my-reservations               # Mes réservations
/courses/:id/reserve           # Page de réservation
```

---

### Phase 3 : Payments (Paiements) (Semaine 4-5) 🔴 HAUTE

#### 3.1 Payments (Paiements)

**Types disponibles :**
```typescript
enum PaymentMethod {
  STRIPE = 'stripe',
  ESPECES = 'especes',
  VIREMENT = 'virement',
  AUTRE = 'autre',
}

enum PaymentStatus {
  EN_ATTENTE = 'en_attente',
  VALIDE = 'valide',
  ECHOUE = 'echoue',
  REMBOURSE = 'rembourse',
}

interface Payment {
  id: number;
  utilisateur_id: number;
  plan_tarifaire_id?: number;
  montant: number;
  methode_paiement: PaymentMethod;
  statut: PaymentStatus;
  description?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  date_paiement: Date;
}
```

**Feature à créer :**
```
features/payments/
├── api/
│   └── paymentsApi.ts
├── model/
│   ├── types.ts
│   ├── usePayments.ts
│   ├── usePayment.ts
│   ├── useCreatePayment.ts
│   ├── useMyPayments.ts
│   ├── usePaymentIntent.ts
│   └── useConfirmPayment.ts
├── ui/
│   ├── PaymentForm.tsx
│   ├── StripeCheckout.tsx
│   ├── PaymentHistory.tsx
│   ├── PaymentDetail.tsx
│   └── Invoice.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- usePayments(filters?) // GET /payments (admin)
- usePayment(id) // GET /payments/:id
- useMyPayments() // GET /me/payments
- useUserPayments(userId) // GET /users/:id/payments
- usePaymentStats() // GET /payments/stats (admin)

// Mutations
- useCreatePaymentIntent() // POST /payments/create-intent
- useConfirmPayment() // POST /payments/confirm
- useRefundPayment() // POST /payments/:id/refund (admin)
- useCreateManualPayment() // POST /payments/manual (admin)
- useUpdatePaymentStatus() // PUT /payments/:id/status (admin)
```

**API Endpoints :**
```
GET    /payments                    # Liste paiements (admin)
GET    /payments/:id                # Détail paiement
POST   /payments/create-intent      # Créer intention Stripe
POST   /payments/confirm            # Confirmer paiement
POST   /payments/manual             # Paiement manuel (admin)
POST   /payments/:id/refund         # Rembourser (admin)
PUT    /payments/:id/status         # Changer statut (admin)
GET    /payments/stats              # Statistiques (admin)
GET    /me/payments                 # Mes paiements
GET    /users/:id/payments          # Paiements d'un user (admin)
GET    /payments?statut=valide      # Filtrer par statut
GET    /payments?methode=stripe     # Filtrer par méthode
GET    /payments/:id/invoice        # Télécharger facture
```

**Pages :**
```
/payments/checkout/:planId     # Checkout Stripe
/my-payments                   # Historique paiements
/my-payments/:id               # Détail paiement + facture
/admin/payments                # Gestion paiements (admin)
/admin/payments/:id            # Détail paiement (admin)
```

---

#### 3.2 Payment Schedules (Échéanciers de paiement)

**Types disponibles :**
```typescript
interface PaymentSchedule {
  id: number;
  utilisateur_id: number;
  plan_tarifaire_id?: number;
  montant_total: number;
  nombre_echeances: number;
  montant_echeance: number;
  date_debut: Date;
  statut: string;
}
```

**Feature à créer :**
```
features/payment-schedules/
├── api/
│   └── paymentSchedulesApi.ts
├── model/
│   ├── types.ts
│   ├── usePaymentSchedules.ts
│   ├── useCreatePaymentSchedule.ts
│   └── useMyPaymentSchedules.ts
├── ui/
│   ├── PaymentScheduleForm.tsx
│   ├── PaymentSchedulesList.tsx
│   ├── PaymentScheduleDetail.tsx
│   └── UpcomingPayments.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- usePaymentSchedules(filters?) // GET /payment-schedules (admin)
- usePaymentSchedule(id) // GET /payment-schedules/:id
- useMyPaymentSchedules() // GET /me/payment-schedules
- useUpcomingPayments() // GET /me/payment-schedules/upcoming

// Mutations
- useCreatePaymentSchedule() // POST /payment-schedules
- useUpdatePaymentSchedule() // PUT /payment-schedules/:id
- useCancelPaymentSchedule() // DELETE /payment-schedules/:id
- usePayScheduledPayment() // POST /payment-schedules/:id/pay-next
```

**API Endpoints :**
```
GET    /payment-schedules              # Liste échéanciers (admin)
GET    /payment-schedules/:id          # Détail échéancier
POST   /payment-schedules              # Créer échéancier
PUT    /payment-schedules/:id          # Modifier échéancier
DELETE /payment-schedules/:id          # Annuler échéancier
POST   /payment-schedules/:id/pay-next # Payer prochaine échéance
GET    /me/payment-schedules           # Mes échéanciers
GET    /me/payment-schedules/upcoming  # Prochaines échéances
GET    /payment-schedules?statut=actif # Filtrer par statut
```

**Pages :**
```
/my-payments/schedules         # Mes échéanciers
/payments/schedule/setup       # Créer échéancier
```

---

#### 3.3 Pricing Plans (Plans tarifaires)

**Types disponibles :**
```typescript
interface PricingPlan {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  duree_mois: number;
  actif: boolean;
}
```

**Feature à créer :**
```
features/pricing-plans/
├── api/
│   └── pricingPlansApi.ts
├── model/
│   ├── types.ts
│   ├── usePricingPlans.ts
│   ├── useCreatePricingPlan.ts
│   └── useActivePricingPlans.ts
├── ui/
│   ├── PricingPlansList.tsx
│   ├── PricingPlanCard.tsx
│   ├── PricingPlanForm.tsx
│   └── PricingTable.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- usePricingPlans(filters?) // GET /pricing-plans
- usePricingPlan(id) // GET /pricing-plans/:id
- useActivePricingPlans() // GET /pricing-plans?actif=true

// Mutations
- useCreatePricingPlan() // POST /pricing-plans (admin)
- useUpdatePricingPlan() // PUT /pricing-plans/:id (admin)
- useDeletePricingPlan() // DELETE /pricing-plans/:id (admin)
- useTogglePricingPlan() // PUT /pricing-plans/:id/toggle (admin)
```

**API Endpoints :**
```
GET    /pricing-plans              # Liste plans
GET    /pricing-plans/:id          # Détail plan
POST   /pricing-plans              # Créer plan (admin)
PUT    /pricing-plans/:id          # Modifier plan (admin)
DELETE /pricing-plans/:id          # Supprimer plan (admin)
PUT    /pricing-plans/:id/toggle   # Activer/désactiver (admin)
GET    /pricing-plans?actif=true   # Plans actifs seulement
```

**Pages :**
```
/pricing                       # Grille tarifaire (public)
/admin/pricing-plans           # Gestion plans (admin)
```

---

### Phase 4 : Store (Boutique) (Semaine 5-7) 🟡 MOYENNE

#### 4.1 Categories (Catégories d'articles)

**Feature à créer :**
```
features/store-categories/
├── api/
│   └── categoriesApi.ts
├── model/
│   ├── types.ts
│   ├── useCategories.ts
│   └── useCreateCategory.ts
├── ui/
│   ├── CategoriesList.tsx
│   ├── CategoryFilter.tsx
│   └── CategoryForm.tsx
└── index.ts
```

**Hooks :**
```typescript
- useCategories() // GET /store/categories
- useCategory(id) // GET /store/categories/:id
- useCreateCategory() // POST /store/categories (admin)
- useUpdateCategory() // PUT /store/categories/:id (admin)
- useDeleteCategory() // DELETE /store/categories/:id (admin)
```

---

#### 4.2 Articles (Articles de la boutique)

**Feature à créer :**
```
features/store-articles/
├── api/
│   └── articlesApi.ts
├── model/
│   ├── types.ts
│   ├── useArticles.ts
│   ├── useArticle.ts
│   ├── useCreateArticle.ts
│   └── useArticlesWithStock.ts
├── ui/
│   ├── ArticlesList.tsx
│   ├── ArticleCard.tsx
│   ├── ArticleDetail.tsx
│   ├── ArticleForm.tsx
│   ├── ArticleFilters.tsx
│   └── ArticleGallery.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- useArticles(filters?) // GET /store/articles
- useArticle(id) // GET /store/articles/:id
- useArticleWithStock(id) // GET /store/articles/:id?include=stocks
- useArticlesByCategoryId(categoryId) // GET /store/articles?categorie_id=X
- useActiveArticles() // GET /store/articles?actif=true

// Mutations
- useCreateArticle() // POST /store/articles (admin)
- useUpdateArticle() // PUT /store/articles/:id (admin)
- useDeleteArticle() // DELETE /store/articles/:id (admin)
- useToggleArticle() // PUT /store/articles/:id/toggle (admin)
- useUploadArticleImage() // POST /store/articles/:id/images
- useDeleteArticleImage() // DELETE /store/articles/:id/images/:imageId
```

**API Endpoints :**
```
GET    /store/articles                 # Liste articles
GET    /store/articles/:id             # Détail article
POST   /store/articles                 # Créer article (admin)
PUT    /store/articles/:id             # Modifier article (admin)
DELETE /store/articles/:id             # Supprimer article (admin)
PUT    /store/articles/:id/toggle      # Activer/désactiver (admin)
POST   /store/articles/:id/images      # Upload images
DELETE /store/articles/:id/images/:iid # Supprimer image
GET    /store/articles?categorie_id=X  # Par catégorie
GET    /store/articles?actif=true      # Articles actifs
GET    /store/articles/search?q=       # Recherche
```

**Pages :**
```
/store                         # Catalogue boutique
/store/articles/:id            # Détail article
/admin/store/articles          # Gestion articles (admin)
/admin/store/articles/new      # Créer article (admin)
/admin/store/articles/:id/edit # Éditer article (admin)
```

---

#### 4.3 Stock (Gestion des stocks)

**Feature à créer :**
```
features/store-stock/
├── api/
│   └── stockApi.ts
├── model/
│   ├── types.ts
│   ├── useStocks.ts
│   ├── useUpdateStock.ts
│   └── useLowStockAlerts.ts
├── ui/
│   ├── StockTable.tsx
│   ├── StockForm.tsx
│   ├── LowStockAlert.tsx
│   └── StockMovements.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- useStocks(filters?) // GET /store/stocks
- useArticleStocks(articleId) // GET /store/articles/:id/stocks
- useLowStockAlerts() // GET /store/stocks/low-stock

// Mutations
- useUpdateStock() // PUT /store/stocks/:id (admin)
- useAddStock() // POST /store/stocks/add (admin)
- useRemoveStock() // POST /store/stocks/remove (admin)
- useSetStockMinimum() // PUT /store/stocks/:id/minimum (admin)
```

**API Endpoints :**
```
GET    /store/stocks               # Liste stocks (admin)
GET    /store/stocks/:id           # Détail stock
PUT    /store/stocks/:id           # Modifier stock (admin)
POST   /store/stocks/add           # Ajouter stock (admin)
POST   /store/stocks/remove        # Retirer stock (admin)
PUT    /store/stocks/:id/minimum   # Définir minimum
GET    /store/stocks/low-stock     # Alertes stock bas
GET    /store/articles/:id/stocks  # Stocks d'un article
```

**Pages :**
```
/admin/store/stocks            # Gestion stocks (admin)
/admin/store/stocks/movements  # Mouvements de stock (admin)
```

---

#### 4.4 Orders (Commandes)

**Feature à créer :**
```
features/store-orders/
├── api/
│   └── ordersApi.ts
├── model/
│   ├── types.ts
│   ├── useOrders.ts
│   ├── useOrder.ts
│   ├── useCreateOrder.ts
│   ├── useMyOrders.ts
│   └── useCart.ts (panier local)
├── ui/
│   ├── OrdersList.tsx
│   ├── OrderCard.tsx
│   ├── OrderDetail.tsx
│   ├── Cart.tsx
│   ├── CartItem.tsx
│   ├── CheckoutForm.tsx
│   └── OrderStatus.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- useOrders(filters?) // GET /store/orders (admin)
- useOrder(id) // GET /store/orders/:id
- useMyOrders() // GET /me/orders
- useUserOrders(userId) // GET /users/:id/orders (admin)
- useOrderStats() // GET /store/orders/stats (admin)

// Mutations
- useCreateOrder() // POST /store/orders
- useUpdateOrderStatus() // PUT /store/orders/:id/status (admin)
- useCancelOrder() // PUT /store/orders/:id/cancel
- useMarkOrderShipped() // PUT /store/orders/:id/shipped (admin)
- useMarkOrderDelivered() // PUT /store/orders/:id/delivered (admin)

// Local state (panier)
- useCart() // Panier en local storage
- useAddToCart() // Ajouter au panier
- useRemoveFromCart() // Retirer du panier
- useUpdateCartQuantity() // Modifier quantité
- useClearCart() // Vider panier
```

**API Endpoints :**
```
GET    /store/orders                 # Liste commandes (admin)
GET    /store/orders/:id             # Détail commande
POST   /store/orders                 # Créer commande
PUT    /store/orders/:id/status      # Changer statut (admin)
PUT    /store/orders/:id/cancel      # Annuler commande
PUT    /store/orders/:id/shipped     # Marquer expédiée (admin)
PUT    /store/orders/:id/delivered   # Marquer livrée (admin)
GET    /store/orders/stats           # Statistiques (admin)
GET    /me/orders                    # Mes commandes
GET    /users/:id/orders             # Commandes user (admin)
GET    /store/orders?statut=pending  # Filtrer par statut
```

**Pages :**
```
/store/cart                    # Panier
/store/checkout                # Paiement
/my-orders                     # Mes commandes
/my-orders/:id                 # Détail commande
/admin/store/orders            # Gestion commandes (admin)
/admin/store/orders/:id        # Détail commande (admin)
```

---

### Phase 5 : Groups (Groupes) (Semaine 7-8) 🟡 MOYENNE

#### 5.1 Groups (Gestion des groupes)

**Feature à créer :**
```
features/groups/
├── api/
│   └── groupsApi.ts
├── model/
│   ├── types.ts
│   ├── useGroups.ts
│   ├── useGroup.ts
│   ├── useCreateGroup.ts
│   ├── useGroupMembers.ts
│   └── useMyGroups.ts
├── ui/
│   ├── GroupsList.tsx
│   ├── GroupCard.tsx
│   ├── GroupDetail.tsx
│   ├── GroupForm.tsx
│   ├── GroupMembers.tsx
│   └── AssignUsersModal.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- useGroups(filters?) // GET /groups
- useGroup(id) // GET /groups/:id
- useGroupMembers(id) // GET /groups/:id/members
- useMyGroups() // GET /me/groups
- useUserGroups(userId) // GET /users/:id/groups

// Mutations
- useCreateGroup() // POST /groups (admin)
- useUpdateGroup() // PUT /groups/:id (admin)
- useDeleteGroup() // DELETE /groups/:id (admin)
- useAssignUserToGroup() // POST /groups/:id/users/:userId (admin)
- useUnassignUserFromGroup() // DELETE /groups/:id/users/:userId (admin)
- useBulkAssignUsers() // POST /groups/:id/users/bulk (admin)
```

**API Endpoints :**
```
GET    /groups                      # Liste groupes
GET    /groups/:id                  # Détail groupe
POST   /groups                      # Créer groupe (admin)
PUT    /groups/:id                  # Modifier groupe (admin)
DELETE /groups/:id                  # Supprimer groupe (admin)
GET    /groups/:id/members          # Membres du groupe
POST   /groups/:id/users/:userId    # Assigner utilisateur
DELETE /groups/:id/users/:userId    # Retirer utilisateur
POST   /groups/:id/users/bulk       # Assigner multiple (admin)
GET    /me/groups                   # Mes groupes
GET    /users/:id/groups            # Groupes d'un user
```

**Pages :**
```
/groups                        # Liste groupes
/groups/:id                    # Détail groupe
/my-groups                     # Mes groupes
/admin/groups                  # Gestion groupes (admin)
/admin/groups/:id/members      # Gérer membres (admin)
```

---

### Phase 6 : Messaging (Messagerie) (Semaine 8-9) 🟢 BASSE

#### 6.1 Messages (Système de messagerie)

**Feature à créer :**
```
features/messaging/
├── api/
│   └── messagesApi.ts
├── model/
│   ├── types.ts
│   ├── useMessages.ts
│   ├── useSendMessage.ts
│   ├── useInbox.ts
│   ├── useSentMessages.ts
│   └── useUnreadCount.ts
├── ui/
│   ├── MessagesList.tsx
│   ├── MessageCard.tsx
│   ├── MessageDetail.tsx
│   ├── ComposeMessage.tsx
│   ├── MessageFilters.tsx
│   └── UnreadBadge.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- useInbox() // GET /me/messages/inbox
- useSentMessages() // GET /me/messages/sent
- useMessage(id) // GET /messages/:id
- useUnreadCount() // GET /me/messages/unread-count
- useConversation(userId) // GET /messages/conversation/:userId

// Mutations
- useSendMessage() // POST /messages
- useMarkAsRead() // PUT /messages/:id/read
- useMarkAsUnread() // PUT /messages/:id/unread
- useDeleteMessage() // DELETE /messages/:id
- useReplyToMessage() // POST /messages/:id/reply
- useBulkMarkAsRead() // PUT /messages/bulk/read
```

**API Endpoints :**
```
GET    /messages                    # Liste messages (admin)
GET    /messages/:id                # Détail message
POST   /messages                    # Envoyer message
PUT    /messages/:id/read           # Marquer lu
PUT    /messages/:id/unread         # Marquer non lu
DELETE /messages/:id                # Supprimer message
POST   /messages/:id/reply          # Répondre
GET    /me/messages/inbox           # Ma boîte de réception
GET    /me/messages/sent            # Messages envoyés
GET    /me/messages/unread-count    # Nombre non lus
GET    /messages/conversation/:uid  # Conversation avec user
PUT    /messages/bulk/read          # Marquer multiples lus
```

**Pages :**
```
/messages                      # Messagerie
/messages/inbox                # Boîte de réception
/messages/sent                 # Messages envoyés
/messages/:id                  # Détail message
/messages/compose              # Nouveau message
```

---

### Phase 7 : Statistics & Reporting (Semaine 9-10) 🟢 BASSE

#### 7.1 Statistics (Statistiques & Rapports)

**Feature à créer :**
```
features/statistics/
├── api/
│   └── statisticsApi.ts
├── model/
│   ├── types.ts
│   ├── useDashboardStats.ts
│   ├── useCourseStats.ts
│   ├── usePaymentStats.ts
│   ├── useStoreStats.ts
│   └── useUserStats.ts
├── ui/
│   ├── StatsOverview.tsx
│   ├── StatsCard.tsx
│   ├── ChartRevenue.tsx
│   ├── ChartAttendance.tsx
│   ├── ChartOrders.tsx
│   └── ExportButton.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries
- useDashboardStats() // GET /stats/dashboard
- useCourseStats(period?) // GET /stats/courses
- useAttendanceStats(period?) // GET /stats/attendance
- usePaymentStats(period?) // GET /stats/payments
- useStoreStats(period?) // GET /stats/store
- useUserStats() // GET /stats/users
- useMembershipStats() // GET /stats/memberships

// Export
- useExportStats() // GET /stats/export
```

**API Endpoints :**
```
GET    /stats/dashboard             # Vue d'ensemble
GET    /stats/courses               # Stats cours
GET    /stats/attendance            # Stats présence
GET    /stats/payments              # Stats paiements
GET    /stats/store                 # Stats boutique
GET    /stats/users                 # Stats utilisateurs
GET    /stats/memberships           # Stats abonnements
GET    /stats/export                # Export CSV/PDF
GET    /stats?period=month          # Par période
```

**Pages :**
```
/admin/statistics              # Tableau de bord stats (admin)
/admin/reports                 # Rapports (admin)
```

---

### Phase 8 : Lookup Tables (Semaine 10) 🟢 BASSE

#### 8.1 Lookup (Tables de référence)

**Feature à créer :**
```
features/lookup/
├── api/
│   └── lookupApi.ts
├── model/
│   ├── types.ts
│   ├── useGenres.ts
│   ├── useGrades.ts
│   ├── useStatuses.ts
│   └── useSizes.ts
├── ui/
│   ├── GenreSelector.tsx
│   ├── GradeSelector.tsx
│   ├── StatusBadge.tsx
│   └── SizeSelector.tsx
└── index.ts
```

**Hooks :**
```typescript
// Queries (cache long terme)
- useGenres() // GET /lookup/genres
- useGrades() // GET /lookup/grades
- useStatuses() // GET /lookup/statuses
- useSizes() // GET /lookup/sizes

// Mutations (admin only)
- useCreateGrade() // POST /lookup/grades
- useUpdateGrade() // PUT /lookup/grades/:id
- useDeleteGrade() // DELETE /lookup/grades/:id
```

**API Endpoints :**
```
GET    /lookup/genres               # Liste genres
GET    /lookup/grades               # Liste grades
GET    /lookup/statuses             # Liste statuts
GET    /lookup/sizes                # Liste tailles
```

---

## 📊 Récapitulatif Global

### Total Features à Implémenter

| Domaine | Features | Pages | Hooks | API Endpoints |
|---------|----------|-------|-------|---------------|
| **Users** | 1 | 6 | 12 | 15 |
| **Courses** | 5 | 15 | 45+ | 60+ |
| **Payments** | 3 | 8 | 20 | 25 |
| **Store** | 4 | 12 | 30+ | 40+ |
| **Groups** | 1 | 5 | 10 | 12 |
| **Messaging** | 1 | 5 | 12 | 15 |
| **Statistics** | 1 | 2 | 8 | 10 |
| **Lookup** | 1 | 0 | 8 | 4 |
| **TOTAL** | **17** | **53** | **145+** | **181+** |

---

## 🎯 Ordre de Priorité Recommandé

### Sprint 1 (Semaine 1-2) - Fondations
1. ✅ Auth (déjà fait à 60%)
2. Compléter Users (profile, preferences)
3. Dashboard de base

### Sprint 2 (Semaine 2-3) - Cours Templates
4. CourseRecurrent (templates)
5. Professors

### Sprint 3 (Semaine 3-4) - Cours & Inscriptions
6. Courses (instances)
7. Inscriptions
8. Reservations

### Sprint 4 (Semaine 4-5) - Paiements
9. Payments
10. Payment Schedules
11. Pricing Plans

### Sprint 5 (Semaine 5-6) - Boutique (partie 1)
12. Store Categories
13. Store Articles
14. Stock Management

### Sprint 6 (Semaine 6-7) - Boutique (partie 2)
15. Store Orders
16. Cart & Checkout

### Sprint 7 (Semaine 7-8) - Groupes
17. Groups Management

### Sprint 8 (Semaine 8-9) - Messagerie
18. Messaging System

### Sprint 9 (Semaine 9-10) - Stats & Lookup
19. Statistics & Reports
20. Lookup Tables

---

## 🛠️ Stack Technique par Feature

### Toutes les features utilisent :
- **React 18** - UI
- **TypeScript strict** - Type safety
- **TanStack Query v5** - Data fetching
- **PatternFly 6** - UI components
- **Result pattern** - Error handling
- **Zod** - Validation

### Features spécifiques :
- **Payments** : Stripe SDK, Elements
- **Store** : react-table pour tableaux
- **Courses Calendar** : react-big-calendar ou fullcalendar
- **Statistics** : recharts pour graphiques
- **Messaging** : WebSocket (future)

---

## ✅ Checklist de Création de Feature

Pour chaque nouvelle feature, suivre cette checklist :

### 1. Structure
- [ ] Créer dossier `features/{feature-name}/`
- [ ] Créer sous-dossiers : `api/`, `model/`, `ui/`
- [ ] Créer `index.ts` pour export public

### 2. Types
- [ ] Importer types depuis `@clubmanager/types`
- [ ] Créer types UI supplémentaires si nécessaire
- [ ] Ajouter dans `model/types.ts`

### 3. API
- [ ] Créer `api/{feature}Api.ts`
- [ ] Implémenter tous les endpoints
- [ ] Utiliser `apiClient` + Result pattern
- [ ] Typer les requêtes et réponses

### 4. Hooks (React Query)
- [ ] Créer hooks `use{Feature}()` pour queries
- [ ] Créer hooks `use{Action}()` pour mutations
- [ ] Configurer cache & stale time
- [ ] Gérer loading & error states
- [ ] Ajouter optimistic updates si pertinent

### 5. UI Components
- [ ] Liste : `{Feature}List.tsx`
- [ ] Carte : `{Feature}Card.tsx`
- [ ] Détail : `{Feature}Detail.tsx`
- [ ] Formulaire : `{Feature}Form.tsx`
- [ ] Filtres : `{Feature}Filters.tsx` (si applicable)

### 6. Pages
- [ ] Créer pages dans `pages/{feature}/`
- [ ] Ajouter routes dans `App.tsx`
- [ ] Protéger routes si nécessaire
- [ ] Lazy loading

### 7. Tests (optionnel mais recommandé)
- [ ] Tests API : `{feature}Api.test.ts`
- [ ] Tests hooks : `use{Feature}.test.ts`
- [ ] Tests UI : `{Feature}Form.test.tsx`

### 8. Documentation
- [ ] JSDoc sur fonctions publiques
- [ ] Exemples d'utilisation
- [ ] Mettre à jour FEATURES.md

---

## 🎓 Ressources & Patterns

### Pattern Result pour API
```typescript
const result = await apiClient.get<Course[]>('/courses');

if (result.isOk()) {
  const courses = result.value;
} else {
  const error = result.error; // ApiError | NetworkError
}
```

### Pattern Hook React Query
```typescript
export const useCourses = (filters?: CourseFilters) => {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: async () => {
      const result = await coursesApi.getAll(filters);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### Pattern Mutation
```typescript
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCourseInput) => {
      const result = await coursesApi.create(data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
```

---

## 📈 Métriques de Succès

### Par Sprint
- [ ] Toutes les features du sprint fonctionnelles
- [ ] Tests passants (coverage > 70%)
- [ ] Pas d'erreurs TypeScript
- [ ] Documentation à jour
- [ ] Code review fait

### Global
- [ ] 145+ hooks créés
- [ ] 181+ endpoints couverts
- [ ] 53+ pages fonctionnelles
- [ ] 17 features complètes
- [ ] Lighthouse score > 90
- [ ] Bundle size < 800KB

---

**Prêt à implémenter ! 🚀**

_Ce plan sera mis à jour au fur et à mesure de l'avancement du projet._