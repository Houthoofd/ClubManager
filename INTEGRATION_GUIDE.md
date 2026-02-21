# Guide d'Intégration des Services et HOCs

Ce guide vous accompagne dans l'intégration des services métier et des HOCs (Higher-Order Components) dans les composants existants du projet ClubManager.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Services disponibles](#services-disponibles)
3. [HOCs disponibles](#hocs-disponibles)
4. [Migration étape par étape](#migration-étape-par-étape)
5. [Exemples de refactoring](#exemples-de-refactoring)
6. [Checklist d'intégration](#checklist-dintégration)

---

## 🎯 Vue d'ensemble

### Objectifs de l'intégration

- **Séparation des responsabilités** : UI vs Logique métier
- **Réutilisabilité** : Code DRY (Don't Repeat Yourself)
- **Testabilité** : Tests unitaires facilités
- **Maintenabilité** : Code plus clair et organisé

### Architecture cible

```
Composant (UI uniquement)
    ↓ utilise
HOCs (fonctionnalités transverses)
    ↓ utilise
Services (logique métier)
    ↓ utilise
API GraphQL
```

---

## 📦 Services disponibles

### 1. User Services

**`UserService`** (`features/users/services/user.service.ts`)
- `formatUser()` - Formater les données utilisateur
- `validateUserData()` - Valider les données
- `getUserDisplayName()` - Nom d'affichage
- `isUserActive()` - Statut actif
- `getUsersByRole()` - Filtrer par rôle
- `searchUsers()` - Recherche
- `sortUsers()` - Tri

**`UserStatsService`** (`features/users/services/user-stats.service.ts`)
- `calculateUserStats()` - Statistiques utilisateur
- `formatStatsForDisplay()` - Formater pour affichage
- `compareStats()` - Comparer périodes
- `getStatsTrend()` - Tendances
- `aggregateUserStats()` - Agrégation

**Utilisation :**
```typescript
import { UserService, UserStatsService } from '@/features/users/services';

// Dans un composant
const displayName = UserService.getUserDisplayName(user);
const stats = UserStatsService.calculateUserStats(userData);
```

---

### 2. Course Services

**`CourseService`** (`features/courses/services/course.service.ts`)
- `formatCourse()` - Formater les cours
- `validateCourse()` - Validation
- `getCourseStatus()` - Statut du cours
- `isEnrollmentOpen()` - Inscription ouverte?
- `getAvailableSpots()` - Places disponibles
- `filterCourses()` - Filtrage
- `sortCourses()` - Tri
- `searchCourses()` - Recherche
- `groupCoursesByCategory()` - Grouper

**Utilisation :**
```typescript
import { CourseService } from '@/features/courses/services';

const availableSpots = CourseService.getAvailableSpots(course);
const isOpen = CourseService.isEnrollmentOpen(course);
const grouped = CourseService.groupCoursesByCategory(courses);
```

---

### 3. Shop Services

**`ProductService`** (`features/shop/services/product.service.ts`)
- `formatProduct()` - Formater produits
- `calculatePrice()` - Prix avec réductions
- `isProductAvailable()` - Disponibilité
- `getStockStatus()` - Statut stock
- `filterProducts()` - Filtrage
- `sortProducts()` - Tri
- `searchProducts()` - Recherche

**Utilisation :**
```typescript
import { ProductService } from '@/features/shop/services';

const finalPrice = ProductService.calculatePrice(product, discount);
const stockStatus = ProductService.getStockStatus(product);
```

---

### 4. Message Services

**`MessageService`** (`features/messages/services/message.service.ts`)
- `formatMessage()` - Formater messages
- `isMessageUnread()` - Non lu?
- `markAsRead()` - Marquer lu
- `filterMessages()` - Filtrage
- `sortMessages()` - Tri
- `groupMessagesByDate()` - Grouper par date
- `searchMessages()` - Recherche

---

### 5. Order Services

**`OrderService`** (`features/orders/services/order.service.ts`)
- `formatOrder()` - Formater commandes
- `calculateOrderTotal()` - Total commande
- `getOrderStatus()` - Statut
- `canCancelOrder()` - Annulation possible?
- `filterOrders()` - Filtrage
- `sortOrders()` - Tri

---

### 6. Stats Services

**`StatsService`** (`features/stats/services/stats.service.ts`)
- `calculateGrowthRate()` - Taux de croissance
- `aggregateByPeriod()` - Agrégation temporelle
- `calculatePercentage()` - Pourcentages
- `formatStatValue()` - Formatage
- `generateChartData()` - Données graphiques
- `compareMetrics()` - Comparaison

**Utilisation :**
```typescript
import { StatsService } from '@/features/stats/services';

const chartData = StatsService.generateChartData(data);
const growthRate = StatsService.calculateGrowthRate(current, previous);
```

---

### 7. Teacher Services

**`TeacherService`** (`features/teachers/services/teacher.service.ts`)
- `formatTeacher()` - Formater enseignants
- `getTeacherAvailability()` - Disponibilité
- `calculateTeacherStats()` - Statistiques
- `assignCourse()` - Assigner cours
- `getTeacherSchedule()` - Emploi du temps
- `filterTeachers()` - Filtrage

---

## 🎨 HOCs disponibles

### 1. `withAuth` - Protection d'authentification

**Usage :**
```typescript
import { withAuth } from '@/hocs';

const PrivatePage = () => <div>Contenu privé</div>;
export default withAuth(PrivatePage);

// Avec options
export default withAuth(PrivatePage, {
  redirectTo: '/login',
  showLoader: true
});
```

**Hook alternatif :**
```typescript
import { useRequireAuth } from '@/hocs';

function MyComponent() {
  useRequireAuth({ redirectTo: '/login' });
  return <div>Protégé</div>;
}
```

---

### 2. `withAuthRole` - Protection par rôle

**Usage :**
```typescript
import { withAuthRole } from '@/hocs';

const AdminPanel = () => <div>Admin</div>;
export default withAuthRole(AdminPanel, ['admin', 'teacher']);
```

---

### 3. `withLoading` - États de chargement

**Usage :**
```typescript
import { withLoading } from '@/hocs';

const UserProfile = ({ user }) => <div>{user.name}</div>;
export default withLoading(UserProfile, {
  type: 'skeleton',
  skeletonRows: 5
});

// Dans le parent
<UserProfile isLoading={loading} user={data?.user} />
```

**Hook alternatif :**
```typescript
import { useLoadingWrapper } from '@/hocs';

function MyComponent({ loading, data }) {
  const LoadingWrapper = useLoadingWrapper({ type: 'skeleton' });
  
  return (
    <LoadingWrapper isLoading={loading}>
      <div>{data}</div>
    </LoadingWrapper>
  );
}
```

---

### 4. `withData` - Fetching GraphQL

**Usage :**
```typescript
import { withData } from '@/hocs';
import { GET_USER } from './queries';

const UserCard = ({ data }) => <div>{data.name}</div>;

export default withData({
  query: GET_USER,
  variables: (props) => ({ id: props.userId }),
  dataKey: 'user'
})(UserCard);

// Usage
<UserCard userId="123" />
```

**Variante simple :**
```typescript
import { withQuery } from '@/hocs';

export default withQuery(GET_USERS, 'users')(UserList);
```

---

### 5. `withTracking` - Analytics

**Usage :**
```typescript
import { withTracking } from '@/hocs';

const DashboardPage = ({ track }) => (
  <div>
    <button onClick={() => track('button_clicked', { id: 'submit' })}>
      Submit
    </button>
  </div>
);

export default withTracking({
  eventName: 'dashboard',
  trackPageView: true
})(DashboardPage);
```

**Hook alternatif :**
```typescript
import { useTracking } from '@/hocs';

function MyComponent() {
  const track = useTracking();
  
  const handleClick = () => {
    track('event_name', { prop: 'value' });
  };
}
```

---

### 6. `withErrorBoundary` - Gestion d'erreurs

**Usage :**
```typescript
import { withErrorBoundary } from '@/hocs';

const RiskyComponent = () => { /* ... */ };

export default withErrorBoundary(RiskyComponent, {
  componentName: 'RiskyComponent',
  reportToSentry: true
});
```

**Composant alternatif :**
```typescript
import { ErrorBoundary } from '@/hocs';

<ErrorBoundary componentName="MyFeature">
  <RiskyComponent />
</ErrorBoundary>
```

---

### 7. `withPermissions` - Contrôle d'accès

**Usage :**
```typescript
import { withPermissions } from '@/hocs';

const AdminSettings = () => <div>Settings</div>;

export default withPermissions(AdminSettings, {
  allowedRoles: ['admin'],
  requiredPermissions: ['settings.edit']
});
```

**Hook alternatif :**
```typescript
import { usePermissions } from '@/hocs';

function MyComponent() {
  const { hasPermission, hasRole } = usePermissions();
  
  return (
    <div>
      {hasRole('admin') && <AdminButton />}
      {hasPermission('edit') && <EditButton />}
    </div>
  );
}
```

---

## 🔄 Migration étape par étape

### Étape 1 : Identifier le composant

Choisissez un composant à refactorer. Priorité :
1. Composants avec logique métier complexe
2. Composants réutilisés à plusieurs endroits
3. Composants difficiles à tester

### Étape 2 : Analyser la logique actuelle

Identifiez :
- ✅ Logique métier (à déplacer dans services)
- ✅ Appels API / GraphQL
- ✅ Calculs et transformations
- ✅ Validations
- ❌ Rendu UI (à garder)
- ❌ Gestion d'état local UI (à garder)

### Étape 3 : Choisir les services et HOCs

| Besoin | Solution |
|--------|----------|
| Authentification requise | `withAuth` ou `useRequireAuth` |
| Rôles spécifiques | `withAuthRole` ou `useRequireRole` |
| Fetching GraphQL | `withData`, `withQuery` |
| État de chargement | `withLoading` ou `useLoadingWrapper` |
| Tracking analytics | `withTracking` ou `useTracking` |
| Gestion d'erreurs | `withErrorBoundary` |
| Permissions | `withPermissions` ou `usePermissions` |
| Logique métier users | `UserService`, `UserStatsService` |
| Logique métier courses | `CourseService` |
| Logique métier shop | `ProductService` |
| Statistiques | `StatsService` |

### Étape 4 : Refactorer

1. **Importer les services nécessaires**
```typescript
import { UserService, UserStatsService } from '@/features/users/services';
```

2. **Extraire la logique métier**
```typescript
// AVANT
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// APRÈS - dans le service
// OrderService.calculateOrderTotal(items)
```

3. **Appliquer les HOCs**
```typescript
// AVANT
export default MyComponent;

// APRÈS
import { withAuth, withErrorBoundary } from '@/hocs';

export default withAuth(
  withErrorBoundary(MyComponent, { componentName: 'MyComponent' })
);
```

### Étape 5 : Tester

- ✅ Fonctionnalité identique
- ✅ Pas de régression
- ✅ Performances maintenues/améliorées

---

## 💡 Exemples de refactoring

### Exemple 1 : Liste d'utilisateurs

**AVANT :**
```typescript
// UsersList.tsx
const UsersList = () => {
  const { data, loading, error } = useQuery(GET_USERS);
  
  if (loading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;
  
  const activeUsers = data.users.filter(u => u.status === 'active');
  const sortedUsers = activeUsers.sort((a, b) => a.name.localeCompare(b.name));
  
  return (
    <div>
      {sortedUsers.map(user => (
        <div key={user.id}>{user.firstName} {user.lastName}</div>
      ))}
    </div>
  );
};

export default UsersList;
```

**APRÈS :**
```typescript
// UsersList.tsx
import { UserService } from '@/features/users/services';
import { withData, withErrorBoundary } from '@/hocs';
import { GET_USERS } from './queries';

const UsersList = ({ data, refetch }) => {
  // Logique métier déplacée dans le service
  const activeUsers = UserService.filterByStatus(data, 'active');
  const sortedUsers = UserService.sortByName(activeUsers);
  
  return (
    <div>
      {sortedUsers.map(user => (
        <div key={user.id}>
          {UserService.getUserDisplayName(user)}
        </div>
      ))}
    </div>
  );
};

// Composition HOCs
export default withData({
  query: GET_USERS,
  dataKey: 'users'
})(
  withErrorBoundary(UsersList, {
    componentName: 'UsersList'
  })
);
```

**Gains :**
- ✅ Logique métier testable séparément
- ✅ Gestion loading/error automatique
- ✅ Error boundary intégré
- ✅ Code UI plus lisible

---

### Exemple 2 : Page de profil

**AVANT :**
```typescript
const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useQuery(GET_USER_STATS, {
    variables: { userId: user?.id }
  });
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  if (loading) return <Spinner />;
  
  const stats = {
    totalCourses: data?.enrollments?.length || 0,
    completedCourses: data?.enrollments?.filter(e => e.completed).length || 0,
    // ... calculs complexes
  };
  
  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <div>Cours: {stats.totalCourses}</div>
      <div>Complétés: {stats.completedCourses}</div>
    </div>
  );
};

export default ProfilePage;
```

**APRÈS :**
```typescript
import { UserService, UserStatsService } from '@/features/users/services';
import { withAuth, withData, withTracking, withErrorBoundary } from '@/hocs';
import { GET_USER_STATS } from './queries';

const ProfilePage = ({ data, track }) => {
  const { user } = useAuthStore();
  
  // Logique métier dans services
  const displayName = UserService.getUserDisplayName(user);
  const stats = UserStatsService.calculateUserStats(data);
  const formattedStats = UserStatsService.formatStatsForDisplay(stats);
  
  useEffect(() => {
    track('profile_viewed', { userId: user.id });
  }, []);
  
  return (
    <div>
      <h1>{displayName}</h1>
      <div>Cours: {formattedStats.totalCourses}</div>
      <div>Complétés: {formattedStats.completedCourses}</div>
    </div>
  );
};

// Composition
const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x);

export default compose(
  withAuth,
  (comp) => withErrorBoundary(comp, { componentName: 'ProfilePage' }),
  (comp) => withTracking({ eventName: 'profile', trackPageView: true })(comp),
  (comp) => withData({
    query: GET_USER_STATS,
    variables: (props) => ({ userId: props.user?.id }),
    dataKey: 'userStats'
  })(comp)
)(ProfilePage);
```

**Gains :**
- ✅ Auth automatique avec redirection
- ✅ Tracking intégré
- ✅ Error boundary
- ✅ Logique stats réutilisable
- ✅ Composant focalisé sur l'UI

---

### Exemple 3 : Composant de statistiques

**AVANT (voir StatistiquesUtilisateur.tsx original) :**
```typescript
const StatistiquesUtilisateur = ({ userId }) => {
  const { data, loading } = useQuery(GET_USER_STATS, { variables: { userId } });
  
  if (loading) return <Skeleton />;
  
  // Logique de calcul dans le composant (❌)
  const totalCourses = data.courses?.length || 0;
  const completedCourses = data.courses?.filter(c => c.status === 'completed').length || 0;
  const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
  
  // Formatage dans le composant (❌)
  const formattedRate = `${completionRate.toFixed(1)}%`;
  
  return <div>{formattedRate}</div>;
};
```

**APRÈS (déjà fait !) :**
```typescript
import { UserStatsService } from '@/features/users/services';
import { withData } from '@/hocs';

const StatistiquesUtilisateur = ({ data }) => {
  // Logique dans le service (✅)
  const stats = UserStatsService.calculateUserStats(data);
  const formatted = UserStatsService.formatStatsForDisplay(stats);
  
  return <div>{formatted.completionRate}</div>;
};

export default withData({
  query: GET_USER_STATS,
  variables: (props) => ({ userId: props.userId }),
  dataKey: 'userStats'
})(StatistiquesUtilisateur);
```

---

## ✅ Checklist d'intégration

### Pour chaque composant refactoré :

#### Analyse
- [ ] Identifier la logique métier à extraire
- [ ] Identifier les appels API/GraphQL
- [ ] Identifier les besoins en auth/permissions
- [ ] Identifier les besoins de tracking

#### Implémentation
- [ ] Créer/utiliser le service approprié
- [ ] Déplacer la logique métier dans le service
- [ ] Appliquer les HOCs nécessaires
- [ ] Nettoyer le composant (UI only)
- [ ] Ajouter les imports nécessaires

#### Qualité
- [ ] Le composant est plus lisible
- [ ] La logique est testable
- [ ] Pas de duplication de code
- [ ] Types TypeScript corrects
- [ ] Props bien documentées

#### Tests
- [ ] Fonctionnalité identique
- [ ] Pas de régression visuelle
- [ ] Pas de régression fonctionnelle
- [ ] Performance OK

---

## 🎯 Plan de migration recommandé

### Phase 1 : Composants critiques (Semaine 1-2)
1. **StatistiquesUtilisateur** ✅ (Déjà fait)
2. **UserProfile** / **AccountPage**
3. **CourseList** / **ListeCours**
4. **ProductList**

### Phase 2 : Pages principales (Semaine 3-4)
5. **Dashboard pages**
6. **Auth pages** (Login, Register)
7. **Course detail pages**
8. **Shop pages**

### Phase 3 : Composants secondaires (Semaine 5-6)
9. **Modals**
10. **Forms**
11. **Cards**
12. **Lists**

### Phase 4 : Optimisation (Semaine 7)
13. Tests unitaires des services
14. Tests d'intégration
15. Performance monitoring
16. Documentation

---

## 📚 Ressources supplémentaires

### Fichiers de référence
- `/src/hocs/HOC_USAGE_EXAMPLES.tsx` - Exemples HOCs
- `/src/features/SERVICES_USAGE_EXAMPLE.tsx` - Exemples services
- `/src/features/users/services/user.service.ts` - Service user
- `/src/features/stats/services/stats.service.ts` - Service stats

### Patterns recommandés

**Composition HOCs :**
```typescript
const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x);

export default compose(
  withAuth,
  (c) => withErrorBoundary(c, { componentName: 'Name' }),
  (c) => withTracking({ eventName: 'event' })(c),
  (c) => withLoading(c, { type: 'skeleton' })
)(Component);
```

**Ordre des HOCs (important !) :**
1. `withAuth` / `withAuthRole` (authentification en premier)
2. `withErrorBoundary` (capturer toutes les erreurs)
3. `withTracking` (tracker les événements)
4. `withPermissions` (contrôle d'accès)
5. `withData` / `withLoading` (données)
6. Composant final

---

## 🆘 Aide et support

### Questions fréquentes

**Q : Dois-je tout migrer d'un coup ?**
R : Non ! Migration progressive recommandée. Commencez par les composants critiques.

**Q : Les HOCs ou les hooks ?**
R : Préférez les hooks pour la flexibilité, les HOCs pour la composition et la réutilisation.

**Q : Comment tester un composant avec services ?**
R : Les services sont des fonctions pures → faciles à tester unitairement. Les composants peuvent être testés avec des mocks.

**Q : Performance des HOCs multiples ?**
R : Impact négligeable. Les HOCs sont composés au build time.

**Q : Comment débugger ?**
R : Utilisez React DevTools. Les HOCs gardent les displayNames.

---

## 🚀 Prochaines étapes

1. **Lire ce guide** ✅
2. **Consulter les exemples** dans `HOC_USAGE_EXAMPLES.tsx`
3. **Choisir un composant** de la Phase 1
4. **Refactorer** en suivant les étapes
5. **Tester** et valider
6. **Passer au suivant** !

---

**Bon refactoring ! 🎉**