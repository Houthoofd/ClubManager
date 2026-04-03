# 🔄 Analyse des Domaines à Refactoriser - Front-End V2

> **Date**: Janvier 2025  
> **Status**: En cours de migration vers Feature-Sliced Design  
> **Version**: 2.0.0-alpha

---

## 📊 État Actuel de la Migration

### ✅ Complété (30%)

#### Infrastructure & Setup
- [x] Structure FSD complète créée
- [x] HTTP Client avec Result pattern
- [x] Configuration environnement type-safe
- [x] React Query setup
- [x] Router configuration
- [x] Path aliases (@/)
- [x] Documentation complète

#### Features Migrées
- [x] **Authentication** (100%)
  - Login/Register/Logout
  - Password reset
  - User profile
  - Account security
  - User preferences
  - Protected routes

- [x] **Professors Management** (100%)
  - Liste des professeurs
  - Détails professeur
  - CRUD complet
  - Carte professeur
  - Formulaire professeur

#### Pages Créées
- [x] Login/Register
- [x] Forgot/Reset Password
- [x] Dashboard (structure de base)
- [x] Professors List/Detail
- [x] Settings
- [x] 404 Not Found

---

## 🚧 À Refactoriser (70%)

### 🔴 Priorité CRITIQUE (Semaine 1-2)

#### 1. Course Management (0% fait)
**Complexité**: ⭐⭐⭐⭐  
**Impact**: Critique - Fonctionnalité centrale

**Fichiers à créer**:
```
features/courses/
├── api/
│   └── coursesApi.ts
├── model/
│   ├── types.ts
│   ├── useCourses.ts
│   ├── useCourseDetail.ts
│   └── useCourseFilters.ts
├── ui/
│   ├── CourseCard.tsx
│   ├── CoursesList.tsx
│   ├── CourseDetail.tsx
│   ├── CourseForm.tsx
│   ├── CourseFilters.tsx
│   └── CourseSchedule.tsx
└── index.ts
```

**Fonctionnalités à implémenter**:
- [ ] Liste des cours avec pagination
- [ ] Filtres (par type, niveau, professeur, horaire)
- [ ] Recherche de cours
- [ ] Détails d'un cours
- [ ] Calendrier des sessions
- [ ] Création/Modification cours (admin)
- [ ] Suppression cours (admin)
- [ ] Gestion des capacités

**Types principaux**:
```typescript
interface Course {
  id: number;
  name: string;
  description: string;
  type: CourseType;
  level: CourseLevel;
  professorId: number;
  capacity: number;
  enrolled: number;
  schedule: Schedule[];
  price: number;
  duration: number; // minutes
  status: 'active' | 'inactive' | 'full';
}

type CourseType = 'krav-maga' | 'fitness' | 'yoga' | 'self-defense';
type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
```

**Pages à créer**:
- [ ] `pages/courses/CoursesListPage.tsx`
- [ ] `pages/courses/CourseDetailPage.tsx`
- [ ] `pages/courses/CreateCoursePage.tsx` (admin)
- [ ] `pages/courses/EditCoursePage.tsx` (admin)

---

#### 2. Enrollment Management (0% fait)
**Complexité**: ⭐⭐⭐⭐⭐  
**Impact**: Critique - Cœur métier

**Fichiers à créer**:
```
features/enrollment/
├── api/
│   └── enrollmentApi.ts
├── model/
│   ├── types.ts
│   ├── useEnrollment.ts
│   ├── useUnenroll.ts
│   └── useMyEnrollments.ts
├── ui/
│   ├── EnrollButton.tsx
│   ├── UnenrollButton.tsx
│   ├── EnrollmentStatus.tsx
│   ├── MyEnrollmentsList.tsx
│   └── EnrollmentModal.tsx
└── index.ts
```

**Fonctionnalités à implémenter**:
- [ ] Inscription à un cours
- [ ] Désinscription (avec conditions)
- [ ] Liste de mes inscriptions
- [ ] Statut d'inscription (confirmé, liste d'attente)
- [ ] Gestion de la liste d'attente
- [ ] Vérification des prérequis
- [ ] Limite de capacité
- [ ] Notifications d'inscription

**Types principaux**:
```typescript
interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  sessionId?: number;
  status: 'confirmed' | 'pending' | 'waitlist' | 'cancelled';
  enrolledAt: string;
  paidAt?: string;
  cancelledAt?: string;
}

interface EnrollmentRequest {
  courseId: number;
  sessionId?: number;
  paymentMethod?: PaymentMethod;
}
```

**Pages à créer**:
- [ ] `pages/enrollment/MyEnrollmentsPage.tsx`
- [ ] `pages/enrollment/EnrollmentConfirmationPage.tsx`

---

#### 3. Session Scheduling (0% fait)
**Complexité**: ⭐⭐⭐⭐⭐  
**Impact**: Critique - Planning complexe

**Fichiers à créer**:
```
features/sessions/
├── api/
│   └── sessionsApi.ts
├── model/
│   ├── types.ts
│   ├── useSessions.ts
│   ├── useCreateSession.ts
│   ├── useAttendance.ts
│   └── useSessionCalendar.ts
├── ui/
│   ├── SessionCalendar.tsx
│   ├── SessionCard.tsx
│   ├── SessionForm.tsx
│   ├── AttendanceSheet.tsx
│   └── SessionFilters.tsx
└── index.ts

widgets/calendar/
├── ui/
│   ├── WeekCalendar.tsx
│   ├── MonthCalendar.tsx
│   └── DayView.tsx
└── index.ts
```

**Fonctionnalités à implémenter**:
- [ ] Calendrier visuel (jour/semaine/mois)
- [ ] Création de sessions
- [ ] Modification/Annulation sessions
- [ ] Gestion des présences
- [ ] Sessions récurrentes
- [ ] Conflits d'horaires
- [ ] Notifications de session
- [ ] Export calendrier (iCal)

**Types principaux**:
```typescript
interface Session {
  id: number;
  courseId: number;
  professorId: number;
  startTime: string;
  endTime: string;
  capacity: number;
  enrolled: number;
  location: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  recurring?: RecurringPattern;
}

interface Attendance {
  id: number;
  sessionId: number;
  userId: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedAt: string;
  markedBy: number;
}
```

**Pages à créer**:
- [ ] `pages/sessions/SessionsCalendarPage.tsx`
- [ ] `pages/sessions/SessionDetailPage.tsx`
- [ ] `pages/sessions/CreateSessionPage.tsx` (admin)
- [ ] `pages/sessions/AttendancePage.tsx` (professor)

---

### 🟡 Priorité HAUTE (Semaine 3-4)

#### 4. Payment Integration (0% fait)
**Complexité**: ⭐⭐⭐⭐⭐  
**Impact**: Critique - Monétisation

**Fichiers à créer**:
```
features/payment/
├── api/
│   ├── paymentApi.ts
│   └── stripeApi.ts
├── model/
│   ├── types.ts
│   ├── usePayment.ts
│   ├── usePaymentHistory.ts
│   └── useStripeCheckout.ts
├── ui/
│   ├── CheckoutButton.tsx
│   ├── PaymentForm.tsx
│   ├── PaymentHistory.tsx
│   ├── StripeElements.tsx
│   └── InvoiceDownload.tsx
└── index.ts
```

**Fonctionnalités à implémenter**:
- [ ] Intégration Stripe
- [ ] Checkout sécurisé
- [ ] Paiement par carte
- [ ] Historique des paiements
- [ ] Génération de factures
- [ ] Remboursements
- [ ] Gestion des abonnements
- [ ] Webhooks Stripe

**Types principaux**:
```typescript
interface Payment {
  id: number;
  userId: number;
  amount: number;
  currency: 'EUR';
  type: 'enrollment' | 'product' | 'membership';
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripePaymentId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface StripeCheckoutSession {
  sessionId: string;
  url: string;
  expiresAt: string;
}
```

**Pages à créer**:
- [ ] `pages/payment/CheckoutPage.tsx`
- [ ] `pages/payment/PaymentSuccessPage.tsx`
- [ ] `pages/payment/PaymentCancelledPage.tsx`
- [ ] `pages/payment/PaymentHistoryPage.tsx`
- [ ] `pages/payment/InvoicesPage.tsx`

---

#### 5. Product Management (0% fait)
**Complexité**: ⭐⭐⭐  
**Impact**: Important - Ventes annexes

**Fichiers à créer**:
```
features/products/
├── api/
│   └── productsApi.ts
├── model/
│   ├── types.ts
│   ├── useProducts.ts
│   └── useProductPurchase.ts
├── ui/
│   ├── ProductCard.tsx
│   ├── ProductsList.tsx
│   ├── ProductDetail.tsx
│   └── ProductForm.tsx (admin)
└── index.ts

features/cart/
├── model/
│   ├── types.ts
│   └── useCart.ts
├── ui/
│   ├── CartIcon.tsx
│   ├── CartDrawer.tsx
│   └── CartItem.tsx
└── index.ts
```

**Fonctionnalités à implémenter**:
- [ ] Catalogue produits (équipements, vêtements)
- [ ] Détails produit
- [ ] Panier d'achat
- [ ] Gestion stock
- [ ] Variantes (tailles, couleurs)
- [ ] Images produits
- [ ] CRUD produits (admin)

**Types principaux**:
```typescript
interface Product {
  id: number;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  stock: number;
  images: string[];
  variants?: ProductVariant[];
  status: 'available' | 'out_of_stock' | 'discontinued';
}

type ProductCategory = 
  | 'equipment' 
  | 'clothing' 
  | 'accessories' 
  | 'supplements';
```

**Pages à créer**:
- [ ] `pages/products/ProductsListPage.tsx`
- [ ] `pages/products/ProductDetailPage.tsx`
- [ ] `pages/products/CartPage.tsx`
- [ ] `pages/products/ManageProductsPage.tsx` (admin)

---

#### 6. User Management (Admin) (0% fait)
**Complexité**: ⭐⭐⭐⭐  
**Impact**: Important - Administration

**Fichiers à créer**:
```
features/users/
├── api/
│   └── usersApi.ts
├── model/
│   ├── types.ts
│   ├── useUsers.ts
│   ├── useUserDetail.ts
│   └── useUserManagement.ts
├── ui/
│   ├── UsersList.tsx
│   ├── UserCard.tsx
│   ├── UserDetail.tsx
│   ├── UserForm.tsx
│   ├── UserRoles.tsx
│   └── UserStats.tsx
└── index.ts
```

**Fonctionnalités à implémenter**:
- [ ] Liste des membres
- [ ] Profil utilisateur complet
- [ ] Gestion des rôles
- [ ] Activation/Désactivation compte
- [ ] Historique activité
- [ ] Statistiques par utilisateur
- [ ] Recherche et filtres avancés
- [ ] Export des données

**Pages à créer**:
- [ ] `pages/admin/UsersListPage.tsx`
- [ ] `pages/admin/UserDetailPage.tsx`
- [ ] `pages/admin/UserEditPage.tsx`

---

### 🟢 Priorité MOYENNE (Semaine 5-6)

#### 7. Dashboard & Statistics (30% fait)
**Complexité**: ⭐⭐⭐⭐  
**Impact**: Important - Vue d'ensemble

**Fichiers à créer/compléter**:
```
features/statistics/
├── api/
│   └── statsApi.ts
├── model/
│   ├── types.ts
│   └── useStatistics.ts
├── ui/
│   ├── StatsCard.tsx
│   ├── AttendanceChart.tsx
│   ├── RevenueChart.tsx
│   └── EnrollmentTrends.tsx
└── index.ts

widgets/dashboard/
├── ui/
│   ├── QuickStats.tsx
│   ├── UpcomingSessions.tsx
│   ├── RecentActivity.tsx
│   └── Announcements.tsx
└── index.ts
```

**Fonctionnalités à implémenter**:
- [ ] Statistiques temps réel
- [ ] Graphiques de fréquentation
- [ ] Revenus et paiements
- [ ] Tendances d'inscription
- [ ] Sessions à venir
- [ ] Activité récente
- [ ] KPIs personnalisables
- [ ] Export rapports

**Pages à améliorer**:
- [ ] `pages/dashboard/DashboardPage.tsx` (compléter)
- [ ] `pages/analytics/AnalyticsPage.tsx` (créer)

---

#### 8. Notifications System (0% fait)
**Complexité**: ⭐⭐⭐  
**Impact**: Moyen - UX

**Fichiers à créer**:
```
features/notifications/
├── api/
│   └── notificationsApi.ts
├── model/
│   ├── types.ts
│   ├── useNotifications.ts
│   └── useNotificationPreferences.ts
├── ui/
│   ├── NotificationBell.tsx
│   ├── NotificationsList.tsx
│   ├── NotificationItem.tsx
│   └── NotificationSettings.tsx
└── index.ts
```

**Fonctionnalités à implémenter**:
- [ ] Centre de notifications
- [ ] Badge de notifications non lues
- [ ] Marquage lu/non lu
- [ ] Suppression notifications
- [ ] Préférences de notifications
- [ ] Push notifications (futur)
- [ ] Email notifications
- [ ] Types de notifications personnalisables

**Types principaux**:
```typescript
interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

type NotificationType = 
  | 'enrollment_confirmed'
  | 'session_reminder'
  | 'payment_received'
  | 'message_received'
  | 'session_cancelled';
```

---

#### 9. Messaging System (0% fait)
**Complexité**: ⭐⭐⭐⭐  
**Impact**: Moyen - Communication

**Fichiers à créer**:
```
features/messages/
├── api/
│   └── messagesApi.ts
├── model/
│   ├── types.ts
│   ├── useConversations.ts
│   └── useMessages.ts
├── ui/
│   ├── ConversationsList.tsx
│   ├── MessageThread.tsx
│   ├── MessageInput.tsx
│   └── MessageBubble.tsx
└── index.ts
```

**Fonctionnalités à implémenter**:
- [ ] Liste des conversations
- [ ] Thread de messages
- [ ] Envoi de messages
- [ ] Messages en temps réel (WebSocket)
- [ ] Pièces jointes
- [ ] Messages non lus
- [ ] Recherche de messages
- [ ] Archivage conversations

**Pages à créer**:
- [ ] `pages/messages/MessagesPage.tsx`
- [ ] `pages/messages/ConversationPage.tsx`

---

### 🔵 Priorité BASSE (Semaine 7+)

#### 10. Reports & Analytics (0% fait)
**Complexité**: ⭐⭐⭐⭐  
**Impact**: Faible - Features avancées

**Fonctionnalités**:
- [ ] Rapports personnalisables
- [ ] Export PDF/Excel
- [ ] Planification de rapports
- [ ] Analytics avancés

---

#### 11. Settings & Preferences (20% fait)
**Complexité**: ⭐⭐  
**Impact**: Faible - Confort

**Fonctionnalités à compléter**:
- [ ] Thème sombre/clair
- [ ] Langue (i18n)
- [ ] Préférences d'affichage
- [ ] Raccourcis clavier

---

#### 12. Mobile Optimization (0% fait)
**Complexité**: ⭐⭐⭐  
**Impact**: Faible - UX mobile

**Fonctionnalités**:
- [ ] Responsive design
- [ ] Touch gestures
- [ ] PWA capabilities
- [ ] Offline mode

---

## 📦 Entités à Créer (entities/)

### Actuellement vide - À implémenter:

```
entities/
├── user/
│   ├── model/
│   │   └── types.ts
│   ├── ui/
│   │   ├── UserAvatar.tsx
│   │   └── UserBadge.tsx
│   └── index.ts
│
├── course/
│   ├── model/
│   │   └── types.ts
│   ├── ui/
│   │   ├── CourseBadge.tsx
│   │   └── CourseLevel.tsx
│   └── index.ts
│
├── session/
│   ├── model/
│   │   └── types.ts
│   ├── ui/
│   │   └── SessionStatus.tsx
│   └── index.ts
│
└── payment/
    ├── model/
    │   └── types.ts
    └── index.ts
```

---

## 🎨 Shared UI à Ajouter (shared/ui/)

### Actuellement: Button, ErrorBoundary

### À créer:

```
shared/ui/
├── Input/
├── Select/
├── Modal/
├── Drawer/
├── Card/
├── Table/
├── Badge/
├── Spinner/
├── Toast/
├── Tabs/
├── Accordion/
├── DatePicker/
├── TimePicker/
├── Avatar/
├── Dropdown/
├── Pagination/
└── SearchBar/
```

---

## 🔧 Shared Utilities à Ajouter

```
shared/lib/
├── formatters/
│   ├── currency.ts
│   ├── date.ts
│   └── duration.ts
├── validators/
│   ├── email.ts
│   ├── phone.ts
│   └── password.ts
├── hooks/
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   └── useClickOutside.ts
└── utils/
    ├── cn.ts (classnames)
    ├── sleep.ts
    └── retry.ts
```

---

## 📊 Métriques de Migration

### Objectifs

| Métrique | Actuel | Objectif | Date cible |
|----------|---------|----------|------------|
| Features migrées | 2/12 | 12/12 | Mars 2025 |
| Pages créées | 10/25 | 25/25 | Mars 2025 |
| Entités créées | 0/4 | 4/4 | Février 2025 |
| Composants UI | 2/15 | 15/15 | Février 2025 |
| Tests unitaires | 0% | 80% | Avril 2025 |
| Coverage code | 0% | 80% | Avril 2025 |

### Progression Hebdomadaire

```
Semaine 1  ████████████████████░░░░░░░░░░  30% ✅ (Auth + Professors)
Semaine 2  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% ⏳ (Courses)
Semaine 3  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% ⏳ (Enrollment + Sessions)
Semaine 4  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% ⏳ (Payment)
Semaine 5  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% ⏳ (Products + Users)
Semaine 6  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% ⏳ (Dashboard + Notifications)
```

---

## 🎯 Prochaines Actions Concrètes

### Cette Semaine

1. **Créer feature `courses`**
   - [ ] Setup structure FSD
   - [ ] Types et API
   - [ ] Hook `useCourses`
   - [ ] Composants UI de base
   - [ ] Page liste des cours

2. **Créer feature `enrollment`**
   - [ ] Setup structure FSD
   - [ ] Types et API
   - [ ] Hook `useEnrollment`
   - [ ] Bouton d'inscription
   - [ ] Modal de confirmation

3. **Shared UI essentiels**
   - [ ] Input component
   - [ ] Card component
   - [ ] Modal component
   - [ ] Badge component

### Semaine Prochaine

4. **Feature `sessions`**
   - [ ] Calendrier de base
   - [ ] Création de sessions
   - [ ] Widget calendar

5. **Feature `payment`**
   - [ ] Intégration Stripe
   - [ ] Checkout flow
   - [ ] Historique paiements

---

## 🚨 Points de Vigilance

### Dépendances entre Features

```
enrollment → courses (doit exister)
enrollment → payment (optionnel mais recommandé)
sessions → courses (doit exister)
sessions → professors (déjà fait ✅)
payment → products (optionnel)
statistics → tous (créer en dernier)
```

### Risques Techniques

1. **Calendrier complexe**
   - Envisager librairie: `react-big-calendar` ou `fullcalendar`
   - Gestion des fuseaux horaires avec `date-fns-tz`

2. **Paiements Stripe**
   - Nécessite backend webhooks
   - Tests en mode test impératifs
   - Sécurité critique

3. **Temps réel (messages/notifications)**
   - WebSocket infrastructure
   - Synchronisation état
   - Gestion reconnexion

4. **Performance**
   - Pagination sur grandes listes
   - Virtual scrolling si nécessaire
   - Optimistic updates

---

## 📚 Ressources & Documentation

### Documentation Interne
- `front-end-v2/README.md` - Documentation principale
- `front-end-v2/QUICK_START.md` - Guide démarrage rapide
- `front-end-v2/FEATURES.md` - Liste des features
- `front-end/MIGRATION_GUIDE.md` - Guide de migration

### Templates de Référence
- `features/auth/` - Authentification complète
- `features/professors/` - CRUD complet

### Libraries Recommandées
- **UI**: shadcn/ui, Radix UI, Headless UI
- **Forms**: React Hook Form + Zod
- **Dates**: date-fns
- **Calendrier**: react-big-calendar
- **Charts**: recharts, visx
- **Tables**: TanStack Table
- **Paiement**: @stripe/react-stripe-js

---

## ✅ Checklist Avant de Merger

### Pour Chaque Feature

- [ ] Structure FSD respectée
- [ ] Types TypeScript complets
- [ ] Result pattern utilisé
- [ ] React Query pour data fetching
- [ ] Public API (index.ts) clean
- [ ] JSDoc sur fonctions publiques
- [ ] Composants testables
- [ ] Pas de console.log
- [ ] Pas de `any`
- [ ] ESLint pass
- [ ] Tests unitaires (80%+)
- [ ] Documentation à jour
- [ ] Demo/Storybook (optionnel)

---

## 🎉 Conclusion

**Travail réalisé**: Excellente base avec Auth et Professors  
**Travail restant**: 10 features majeures + UI components  
**Estimation**: 6-8 semaines pour MVP complet  
**Priorité #1**: Courses + Enrollment (cœur métier)

**Prochaine étape immédiate**: Créer feature `courses` 🚀

---

*Dernière mise à jour: Janvier 2025*
*Maintenu par: L'équipe Front-End*