# Feature: Enrollment 📝

> **Gestion des inscriptions aux cours**  
> Permet aux étudiants de s'inscrire aux cours, gérer les listes d'attente, et suivre leurs inscriptions.

---

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [API Layer](#api-layer)
- [Model Layer](#model-layer)
- [UI Layer](#ui-layer)
- [Utilisation](#utilisation)
- [Exemples de code](#exemples-de-code)
- [Gestion des erreurs](#gestion-des-erreurs)
- [Tests](#tests)
- [Roadmap](#roadmap)

---

## 🎯 Vue d'ensemble

### Fonctionnalités

✅ **Inscription à un cours**
- Vérification automatique de la capacité
- Placement en liste d'attente si complet
- Confirmation immédiate ou en attente

✅ **Désinscription**
- Annulation d'inscription avec confirmation
- Libération de place automatique
- Gestion de la liste d'attente

✅ **Suivi des inscriptions**
- Liste de mes inscriptions
- Filtrage par statut
- Détails complets (cours, dates, statut)

✅ **Liste d'attente**
- Position sur la liste
- Notification automatique de disponibilité
- Promotion automatique

✅ **Gestion de capacité**
- Vérification temps réel
- Compteurs (inscrits/max)
- Indicateur de disponibilité

---

## 🏗️ Architecture

### Structure FSD

```
features/enrollment/
├── api/
│   └── enrollmentApi.ts         # API client (HTTP calls)
├── model/
│   ├── types.ts                 # TypeScript types & enums
│   └── useEnrollment.ts         # React Query hooks
├── ui/
│   ├── EnrollButton.tsx         # Bouton d'inscription
│   ├── UnenrollButton.tsx       # Bouton de désinscription
│   ├── EnrollmentStatusBadge.tsx # Badge de statut
│   └── MyEnrollmentsList.tsx    # Liste des inscriptions
├── index.ts                     # Public API
└── README.md                    # Documentation
```

### Dépendances

**Internes:**
- `@/shared/api/httpClient` - Client HTTP avec Result pattern
- `@/shared/ui/*` - Composants UI réutilisables (Button, Badge, Card, etc.)
- `@/entities/user` - Authentification utilisateur

**Externes:**
- `@tanstack/react-query` - State management & caching
- `react` - Framework UI
- `react-router-dom` - Navigation

---

## 🌐 API Layer

### `enrollmentApi.ts`

Interface avec le backend pour toutes les opérations d'inscription.

#### Endpoints

##### 1. `enroll(courseId, notes?)`
Inscription à un cours.

```typescript
enroll(
  courseId: string,
  notes?: string
): Promise<Result<EnrollmentResult>>
```

**Comportement:**
- Vérifie la capacité disponible
- Crée l'inscription (CONFIRMED ou WAITLIST)
- Retourne la position en liste d'attente si applicable

**Réponse:**
```typescript
{
  success: true,
  data: {
    enrollment: { id: '...', status: 'CONFIRMED', ... },
    message: 'Inscription confirmée !',
    isWaitlisted: false,
    waitlistPosition: undefined
  }
}
```

##### 2. `unenroll(enrollmentId)`
Annulation d'une inscription.

```typescript
unenroll(enrollmentId: string): Promise<Result<void>>
```

**Effets:**
- Change le statut à CANCELLED
- Libère une place
- Promeut la première personne en liste d'attente

##### 3. `getMyEnrollments(filters?)`
Liste des inscriptions de l'utilisateur connecté.

```typescript
getMyEnrollments(
  filters?: EnrollmentFilters
): Promise<Result<Enrollment[]>>
```

**Filtres disponibles:**
```typescript
{
  status?: EnrollmentStatus | EnrollmentStatus[];
  courseId?: string;
  startDate?: string;
  endDate?: string;
}
```

##### 4. `getEnrollment(enrollmentId)`
Détails d'une inscription spécifique.

```typescript
getEnrollment(enrollmentId: string): Promise<Result<Enrollment>>
```

##### 5. `getCourseCapacity(courseId)`
Informations de capacité d'un cours.

```typescript
getCourseCapacity(courseId: string): Promise<Result<CourseCapacity>>
```

**Réponse:**
```typescript
{
  courseId: 'c123',
  currentEnrollments: 18,
  maxCapacity: 20,
  availableSpots: 2,
  waitlistCount: 3,
  isFull: false
}
```

##### 6. `updateEnrollment(enrollmentId, data)` ⚠️ Admin only
Mise à jour d'une inscription (admin).

```typescript
updateEnrollment(
  enrollmentId: string,
  data: EnrollmentUpdateDto
): Promise<Result<Enrollment>>
```

---

## 📦 Model Layer

### Types (`types.ts`)

#### `EnrollmentStatus` Enum

```typescript
enum EnrollmentStatus {
  CONFIRMED = 'CONFIRMED',    // Place confirmée
  PENDING = 'PENDING',        // En attente de validation
  WAITLIST = 'WAITLIST',      // Sur liste d'attente
  CANCELLED = 'CANCELLED',    // Annulée par l'étudiant
  REJECTED = 'REJECTED',      // Rejetée (admin)
}
```

#### `Enrollment` Interface

```typescript
interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: string;         // ISO date
  updatedAt: string;          // ISO date
  waitlistPosition?: number;  // Si WAITLIST
  notes?: string;
  
  // Relations (optionnelles)
  course?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    professorName?: string;
    currentEnrollments?: number;
    maxCapacity?: number;
  };
  
  student?: {
    id: string;
    name: string;
    email: string;
  };
}
```

#### `CourseCapacity` Interface

```typescript
interface CourseCapacity {
  courseId: string;
  currentEnrollments: number;
  maxCapacity: number;
  availableSpots: number;
  waitlistCount: number;
  isFull: boolean;
}
```

### Hooks (`useEnrollment.ts`)

#### 1. `useEnroll()`
Mutation pour s'inscrire à un cours.

```typescript
const { mutate: enroll, isPending, isError } = useEnroll();

enroll(
  { courseId: 'c123', notes: 'Besoin d'aide' },
  {
    onSuccess: (result) => {
      if (result.isWaitlisted) {
        console.log(`Position: ${result.waitlistPosition}`);
      }
    }
  }
);
```

**Features:**
- Invalidation automatique des queries
- Optimistic updates
- Toast notifications
- Gestion des erreurs

#### 2. `useUnenroll()`
Mutation pour se désinscrire.

```typescript
const { mutate: unenroll, isPending } = useUnenroll();

unenroll(enrollmentId, {
  onSuccess: () => {
    console.log('Désinscription réussie');
  }
});
```

#### 3. `useMyEnrollments(filters?)`
Query pour lister mes inscriptions.

```typescript
const { data: enrollments, isLoading, error } = useMyEnrollments({
  status: [EnrollmentStatus.CONFIRMED, EnrollmentStatus.WAITLIST]
});
```

**Options:**
- `filters`: Filtrage par statut, cours, dates
- Auto-refetch toutes les 30s
- Cache 5 minutes

#### 4. `useEnrollment(enrollmentId)`
Query pour une inscription spécifique.

```typescript
const { data: enrollment, isLoading } = useEnrollment(enrollmentId);
```

#### 5. `useCourseCapacity(courseId)`
Query pour la capacité d'un cours.

```typescript
const { data: capacity, isLoading } = useCourseCapacity(courseId);

if (capacity?.isFull) {
  // Afficher message "Complet"
}
```

**Features:**
- Refetch toutes les 10s (temps réel)
- Utile pour afficher disponibilité

---

## 🎨 UI Layer

### 1. `EnrollButton.tsx`

Bouton intelligent pour l'inscription avec gestion de capacité.

**Props:**
```typescript
interface EnrollButtonProps {
  courseId: string;
  courseName?: string;
  onSuccess?: (result: EnrollmentResult) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
}
```

**Comportement:**
- Vérifie la capacité avant affichage
- Affiche "Complet" si maxCapacity atteint
- Affiche "S'inscrire" ou "Rejoindre la liste d'attente"
- Loading state pendant l'inscription
- Toast de confirmation

**Exemple:**
```tsx
<EnrollButton
  courseId="c123"
  courseName="Yoga Débutants"
  onSuccess={(result) => {
    if (result.isWaitlisted) {
      alert(`Liste d'attente - Position ${result.waitlistPosition}`);
    } else {
      navigate('/my-enrollments');
    }
  }}
/>
```

### 2. `UnenrollButton.tsx`

Bouton de désinscription avec confirmation.

**Props:**
```typescript
interface UnenrollButtonProps {
  enrollmentId: string;
  courseName?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  confirmMessage?: string;
  className?: string;
}
```

**Comportement:**
- Dialog de confirmation avant annulation
- Message personnalisable
- Loading state
- Toast de succès/erreur

**Exemple:**
```tsx
<UnenrollButton
  enrollmentId="e456"
  courseName="Yoga Débutants"
  confirmMessage="Êtes-vous sûr de vouloir annuler cette inscription ?"
  onSuccess={() => navigate('/my-enrollments')}
/>
```

### 3. `EnrollmentStatusBadge.tsx`

Badge visuel pour le statut d'inscription.

**Props:**
```typescript
interface EnrollmentStatusBadgeProps {
  status: EnrollmentStatus;
  waitlistPosition?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Variantes:**
- `CONFIRMED` → Vert 🟢
- `PENDING` → Orange 🟠
- `WAITLIST` → Bleu 🔵 (+ position)
- `CANCELLED` → Gris ⚪
- `REJECTED` → Rouge 🔴

**Exemple:**
```tsx
<EnrollmentStatusBadge
  status={EnrollmentStatus.WAITLIST}
  waitlistPosition={3}
  showLabel={true}
/>
// Affiche: "Liste d'attente (Position 3)"
```

### 4. `MyEnrollmentsList.tsx`

Liste complète des inscriptions avec filtres.

**Props:**
```typescript
interface MyEnrollmentsListProps {
  filters?: EnrollmentFilters;
  showFilters?: boolean;
  onEnrollmentClick?: (enrollment: Enrollment) => void;
  emptyMessage?: string;
  className?: string;
}
```

**Features:**
- Filtrage par statut (multi-select)
- Recherche par nom de cours
- Tri par date
- Loading skeletons
- Empty state
- Click handler pour détails

**Exemple:**
```tsx
<MyEnrollmentsList
  filters={{ status: [EnrollmentStatus.CONFIRMED] }}
  showFilters={true}
  onEnrollmentClick={(e) => navigate(`/courses/${e.courseId}`)}
  emptyMessage="Aucune inscription trouvée"
/>
```

---

## 💡 Utilisation

### Scénario 1: Page de détail de cours

Afficher le bouton d'inscription dans la page de détail d'un cours.

```tsx
import { EnrollButton, useCourseCapacity } from '@/features/enrollment';

function CourseDetailPage() {
  const { courseId } = useParams();
  const { data: capacity } = useCourseCapacity(courseId);
  
  return (
    <div>
      <h1>Détails du cours</h1>
      
      {/* Indicateur de capacité */}
      <p>
        Places: {capacity?.currentEnrollments} / {capacity?.maxCapacity}
        {capacity?.isFull && ' - COMPLET'}
      </p>
      
      {/* Bouton d'inscription */}
      <EnrollButton
        courseId={courseId}
        onSuccess={(result) => {
          if (result.isWaitlisted) {
            toast.info(`Liste d'attente - Position ${result.waitlistPosition}`);
          } else {
            toast.success('Inscription confirmée !');
          }
        }}
      />
    </div>
  );
}
```

### Scénario 2: Page "Mes inscriptions"

Afficher toutes les inscriptions de l'utilisateur.

```tsx
import { MyEnrollmentsList, EnrollmentStatus } from '@/features/enrollment';

function MyEnrollmentsPage() {
  const [filter, setFilter] = useState<EnrollmentStatus[]>([
    EnrollmentStatus.CONFIRMED,
    EnrollmentStatus.WAITLIST,
  ]);
  
  return (
    <div>
      <h1>Mes inscriptions</h1>
      
      <MyEnrollmentsList
        filters={{ status: filter }}
        showFilters={true}
        onEnrollmentClick={(enrollment) => {
          navigate(`/enrollment/${enrollment.id}`);
        }}
      />
    </div>
  );
}
```

### Scénario 3: Card d'inscription avec actions

Afficher une carte avec détails et actions.

```tsx
import {
  useEnrollment,
  EnrollmentStatusBadge,
  UnenrollButton
} from '@/features/enrollment';

function EnrollmentCard({ enrollmentId }: { enrollmentId: string }) {
  const { data: enrollment, isLoading } = useEnrollment(enrollmentId);
  
  if (isLoading) return <Skeleton />;
  if (!enrollment) return <NotFound />;
  
  return (
    <Card>
      <h3>{enrollment.course?.name}</h3>
      
      <EnrollmentStatusBadge
        status={enrollment.status}
        waitlistPosition={enrollment.waitlistPosition}
      />
      
      <p>Inscrit le: {formatDate(enrollment.enrolledAt)}</p>
      
      {enrollment.status === EnrollmentStatus.CONFIRMED && (
        <UnenrollButton
          enrollmentId={enrollment.id}
          courseName={enrollment.course?.name}
        />
      )}
    </Card>
  );
}
```

### Scénario 4: Vérification avant inscription

Vérifier la capacité avant d'afficher le bouton.

```tsx
import { useCourseCapacity, EnrollButton } from '@/features/enrollment';

function CourseCard({ courseId }: { courseId: string }) {
  const { data: capacity, isLoading } = useCourseCapacity(courseId);
  
  return (
    <Card>
      <h3>Cours de Yoga</h3>
      
      {isLoading ? (
        <Skeleton />
      ) : capacity?.isFull ? (
        <Button disabled>Complet ({capacity.waitlistCount} en attente)</Button>
      ) : (
        <EnrollButton courseId={courseId} />
      )}
    </Card>
  );
}
```

---

## 🚨 Gestion des erreurs

### Erreurs API courantes

#### 1. Course complet (capacité atteinte)
```typescript
{
  success: false,
  error: {
    code: 'COURSE_FULL',
    message: 'Le cours est complet',
    details: {
      currentEnrollments: 20,
      maxCapacity: 20,
      waitlistAvailable: true
    }
  }
}
```

**Gestion:**
- Proposer automatiquement la liste d'attente
- Afficher message explicite

#### 2. Déjà inscrit
```typescript
{
  success: false,
  error: {
    code: 'ALREADY_ENROLLED',
    message: 'Vous êtes déjà inscrit à ce cours'
  }
}
```

**Gestion:**
- Afficher toast informatif
- Rediriger vers "Mes inscriptions"

#### 3. Prérequis manquants
```typescript
{
  success: false,
  error: {
    code: 'PREREQUISITES_NOT_MET',
    message: 'Vous devez compléter le cours débutant',
    details: {
      requiredCourses: ['c001']
    }
  }
}
```

#### 4. Délai de désinscription dépassé
```typescript
{
  success: false,
  error: {
    code: 'UNENROLL_DEADLINE_PASSED',
    message: 'Trop tard pour se désinscrire (24h avant le début)'
  }
}
```

### Gestion globale

```tsx
const { mutate: enroll } = useEnroll();

enroll(
  { courseId },
  {
    onError: (error) => {
      switch (error.code) {
        case 'COURSE_FULL':
          // Proposer liste d'attente
          break;
        case 'ALREADY_ENROLLED':
          toast.info('Déjà inscrit');
          break;
        case 'PREREQUISITES_NOT_MET':
          toast.error('Prérequis manquants');
          break;
        default:
          toast.error('Erreur lors de l\'inscription');
      }
    }
  }
);
```

---

## 🧪 Tests

### Tests unitaires

**Hooks:**
```typescript
// useEnrollment.test.ts
describe('useEnroll', () => {
  it('should enroll successfully', async () => {
    const { result } = renderHook(() => useEnroll());
    
    act(() => {
      result.current.mutate({ courseId: 'c123' });
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
  
  it('should handle waitlist correctly', async () => {
    // Mock API response with waitlist
    server.use(
      rest.post('/api/enrollments', (req, res, ctx) => {
        return res(ctx.json({
          enrollment: { status: 'WAITLIST' },
          isWaitlisted: true,
          waitlistPosition: 3
        }));
      })
    );
    
    // Test...
  });
});
```

**Composants:**
```typescript
// EnrollButton.test.tsx
describe('EnrollButton', () => {
  it('renders correctly when spots available', () => {
    render(<EnrollButton courseId="c123" />);
    
    expect(screen.getByText(/s'inscrire/i)).toBeInTheDocument();
  });
  
  it('shows "Complet" when course is full', async () => {
    // Mock capacity response
    server.use(
      rest.get('/api/courses/:id/capacity', (req, res, ctx) => {
        return res(ctx.json({ isFull: true }));
      })
    );
    
    render(<EnrollButton courseId="c123" />);
    
    await waitFor(() => {
      expect(screen.getByText(/complet/i)).toBeInTheDocument();
    });
  });
});
```

### Tests d'intégration

```typescript
// enrollment-flow.test.tsx
describe('Enrollment Flow', () => {
  it('complete enrollment flow', async () => {
    render(<CourseDetailPage />);
    
    // 1. Click enroll button
    userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));
    
    // 2. Wait for success
    await waitFor(() => {
      expect(screen.getByText(/inscription confirmée/i)).toBeInTheDocument();
    });
    
    // 3. Navigate to my enrollments
    userEvent.click(screen.getByText(/mes inscriptions/i));
    
    // 4. Verify enrollment appears
    expect(screen.getByText(/yoga débutants/i)).toBeInTheDocument();
  });
});
```

---

## 📊 Metrics & Analytics

### Events à tracker

```typescript
// Inscription réussie
analytics.track('enrollment_created', {
  courseId: 'c123',
  status: 'CONFIRMED',
  isWaitlisted: false
});

// Placement en liste d'attente
analytics.track('enrollment_waitlisted', {
  courseId: 'c123',
  waitlistPosition: 3
});

// Désinscription
analytics.track('enrollment_cancelled', {
  enrollmentId: 'e456',
  courseId: 'c123',
  daysBeforeCourse: 7
});

// Promotion depuis liste d'attente
analytics.track('waitlist_promoted', {
  enrollmentId: 'e789',
  courseId: 'c123',
  previousPosition: 1
});
```

---

## 🗺️ Roadmap

### ✅ Phase 1 - MVP (Actuel)
- [x] Inscription/désinscription basique
- [x] Liste d'attente
- [x] Vérification de capacité
- [x] Mes inscriptions

### 🚧 Phase 2 - Améliorations (Semaine 4)
- [ ] Notifications push (promotion liste d'attente)
- [ ] Historique des inscriptions
- [ ] Export PDF des inscriptions
- [ ] Rappels par email

### 🔮 Phase 3 - Avancé (Semaine 5-6)
- [ ] Inscription groupée (plusieurs cours)
- [ ] Gestion des prérequis automatique
- [ ] Recommandations de cours
- [ ] Statistiques personnelles

### 💡 Phase 4 - Premium (Semaine 7+)
- [ ] Réservation temporaire (panier)
- [ ] Paiement intégré
- [ ] Transfert d'inscription
- [ ] Système de crédits

---

## 📝 Notes techniques

### Performance

**Optimisations:**
- Query caching (5 min)
- Optimistic updates
- Prefetching sur hover
- Pagination (100 items/page)

**Bundle size:**
- Feature complète: ~25 KB gzipped
- Tree-shaking friendly

### Accessibilité (a11y)

- Tous les boutons ont des labels ARIA
- Navigation au clavier complète
- Annonces de statut pour screen readers
- Contraste WCAG AA minimum

### Sécurité

- Validation côté client ET serveur
- Protection CSRF
- Rate limiting (5 req/min)
- Vérification des permissions

---

## 🤝 Contributeurs

- **Author:** Front-end v2 Team
- **Reviewers:** Backend Team, QA Team
- **Last updated:** April 2025

---

## 📚 Ressources

- [API Documentation](../../../docs/api/enrollment.md)
- [Backend Schema](../../../../api/src/enrollment/schema.prisma)
- [Figma Designs](https://figma.com/...)
- [User Stories](https://jira.com/...)

---

**Questions ? Contactez l'équipe front-end ! 💬**