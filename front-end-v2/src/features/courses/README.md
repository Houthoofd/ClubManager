# 🎓 Courses Feature

> Feature complète de gestion des cours suivant l'architecture Feature-Sliced Design (FSD)

## 📋 Vue d'Ensemble

Cette feature gère l'affichage, la recherche, et la gestion CRUD des cours du club (Krav Maga, Fitness, Yoga, Self-Defense).

**Status**: ✅ Complete (v1.0)  
**Dernière mise à jour**: Janvier 2025

---

## 📁 Structure

```
courses/
├── api/
│   └── coursesApi.ts         # API layer avec Result pattern
├── model/
│   ├── types.ts              # Types TypeScript
│   └── useCourses.ts         # React Query hooks
├── ui/
│   ├── CourseCard.tsx        # Carte d'affichage d'un cours
│   └── CoursesList.tsx       # Liste des cours avec états
├── index.ts                  # Public API
└── README.md                 # Ce fichier
```

---

## 🎯 Fonctionnalités

### ✅ Implémenté

- **Liste des cours** avec pagination automatique
- **Recherche et filtres** (type, niveau, professeur, statut)
- **Affichage des détails** d'un cours
- **Gestion de la capacité** et places disponibles
- **CRUD complet** (Create, Read, Update, Delete)
- **Invalidation cache** React Query automatique
- **États UI** (loading, error, empty)
- **Color coding** par statut et niveau

### 🚧 À Venir

- [ ] Filtres UI (composant CourseFilters)
- [ ] Pagination UI avec contrôles
- [ ] Formulaire de création/édition (admin)
- [ ] Tri des cours (par nom, prix, date)
- [ ] Export de la liste (CSV, PDF)

---

## 🔧 Utilisation

### Import de la Feature

```typescript
import { 
  // Composants
  CourseCard,
  CoursesList,
  
  // Hooks
  useCourses,
  useCourseDetail,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  
  // Types
  type Course,
  type CourseFilters,
  COURSE_TYPE_LABELS,
} from '@/features/courses';
```

### Afficher la Liste des Cours

```tsx
import { CoursesList } from '@/features/courses';

export const MyPage = () => {
  return (
    <div>
      <h1>Nos Cours</h1>
      <CoursesList />
    </div>
  );
};
```

### Filtrer les Cours

```tsx
import { CoursesList } from '@/features/courses';
import type { CourseFilters } from '@/features/courses';

export const KravMagaPage = () => {
  const filters: CourseFilters = {
    type: 'krav-maga',
    level: 'beginner',
  };

  return <CoursesList filters={filters} />;
};
```

### Afficher un Cours Spécifique

```tsx
import { useCourseDetail } from '@/features/courses';

export const CourseWidget = ({ courseId }: { courseId: number }) => {
  const { data: course, isLoading, error } = useCourseDetail(courseId);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  if (!course) return <NotFound />;

  return (
    <div>
      <h2>{course.name}</h2>
      <p>{course.description}</p>
      <p>Prix: {course.price} €</p>
    </div>
  );
};
```

### Créer un Nouveau Cours (Admin)

```tsx
import { useCreateCourse } from '@/features/courses';
import type { CreateCourseData } from '@/features/courses';

export const CreateCourseForm = () => {
  const createCourse = useCreateCourse();

  const handleSubmit = (data: CreateCourseData) => {
    createCourse.mutate(data, {
      onSuccess: (newCourse) => {
        toast.success(`Cours "${newCourse.name}" créé avec succès !`);
        navigate(`/courses/${newCourse.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulaire ici */}
    </form>
  );
};
```

### Mettre à Jour un Cours

```tsx
import { useUpdateCourse } from '@/features/courses';

export const EditCourseButton = ({ courseId }: { courseId: number }) => {
  const updateCourse = useUpdateCourse();

  const handleUpdate = () => {
    updateCourse.mutate(
      {
        id: courseId,
        capacity: 25,
        price: 55,
      },
      {
        onSuccess: () => {
          toast.success('Cours mis à jour');
        },
      }
    );
  };

  return <button onClick={handleUpdate}>Modifier</button>;
};
```

### Supprimer un Cours

```tsx
import { useDeleteCourse } from '@/features/courses';

export const DeleteCourseButton = ({ courseId }: { courseId: number }) => {
  const deleteCourse = useDeleteCourse();

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      deleteCourse.mutate(courseId, {
        onSuccess: () => {
          toast.success('Cours supprimé');
          navigate('/courses');
        },
      });
    }
  };

  return <button onClick={handleDelete}>Supprimer</button>;
};
```

---

## 📊 Types

### Course

```typescript
interface Course {
  id: number;
  name: string;
  description: string;
  type: CourseType;
  level: CourseLevel;
  professorId: number;
  professor?: {
    id: number;
    firstName: string;
    lastName: string;
    name: string;
  };
  capacity: number;
  enrolled: number;
  price: number;
  duration: number; // en minutes
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}
```

### CourseType

```typescript
type CourseType = 'krav-maga' | 'fitness' | 'yoga' | 'self-defense';
```

### CourseLevel

```typescript
type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
```

### CourseStatus

```typescript
type CourseStatus = 'active' | 'inactive' | 'full';
```

### CourseFilters

```typescript
interface CourseFilters {
  type?: CourseType;
  level?: CourseLevel;
  professorId?: number;
  status?: CourseStatus;
  search?: string;
}
```

### Labels

```typescript
const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  'krav-maga': 'Krav Maga',
  'fitness': 'Fitness',
  'yoga': 'Yoga',
  'self-defense': 'Self-Defense',
};

const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  'beginner': 'Débutant',
  'intermediate': 'Intermédiaire',
  'advanced': 'Avancé',
};

const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  'active': 'Actif',
  'inactive': 'Inactif',
  'full': 'Complet',
};
```

---

## 🎨 Composants UI

### CourseCard

Affiche un cours sous forme de carte.

**Props**:
- `course: Course` - Le cours à afficher

**Features**:
- Affichage du nom, description, type, niveau
- Prix mis en évidence
- Indicateur de places disponibles avec color coding
- Statut du cours (actif/inactif/complet)
- Lien vers la page de détails
- Responsive avec PatternFly grid

**Exemple**:
```tsx
<CourseCard course={course} />
```

### CoursesList

Liste de cours avec gestion des états.

**Props**:
- `filters?: CourseFilters` - Filtres optionnels

**Features**:
- Loading state avec spinner
- Error state avec alert
- Empty state si aucun cours
- Grid responsive automatique
- Affiche CourseCard pour chaque cours

**Exemple**:
```tsx
<CoursesList filters={{ type: 'krav-maga' }} />
```

---

## 🔌 Hooks

### useCourses

Récupère la liste des cours avec filtres optionnels.

**Paramètres**:
- `filters?: CourseFilters`

**Retour**: `UseQueryResult<Course[], Error>`

**Cache Key**: `['courses', filters]`

**Exemple**:
```tsx
const { data, isLoading, error } = useCourses({ 
  type: 'krav-maga', 
  level: 'beginner' 
});
```

### useCourseDetail

Récupère un cours par son ID.

**Paramètres**:
- `id: number`

**Retour**: `UseQueryResult<Course, Error>`

**Cache Key**: `['courses', id]`

**Enabled**: Seulement si `id > 0`

**Exemple**:
```tsx
const { data: course } = useCourseDetail(1);
```

### useCreateCourse

Crée un nouveau cours.

**Retour**: `UseMutationResult<Course, Error, CreateCourseData>`

**Side Effects**: Invalide `['courses']`

**Exemple**:
```tsx
const createCourse = useCreateCourse();
createCourse.mutate({ name: 'Krav Maga', ... });
```

### useUpdateCourse

Met à jour un cours existant.

**Retour**: `UseMutationResult<Course, Error, UpdateCourseData>`

**Side Effects**: Invalide `['courses']` et `['courses', id]`

**Exemple**:
```tsx
const updateCourse = useUpdateCourse();
updateCourse.mutate({ id: 1, price: 60 });
```

### useDeleteCourse

Supprime un cours.

**Retour**: `UseMutationResult<number, Error, number>`

**Side Effects**: Invalide `['courses']`

**Exemple**:
```tsx
const deleteCourse = useDeleteCourse();
deleteCourse.mutate(1);
```

---

## 🌐 API

### coursesApi.getAll(filters?)

Récupère tous les cours avec filtres optionnels.

**Endpoint**: `GET /courses?[filters]`

**Paramètres Query**:
- `type` - Type de cours
- `level` - Niveau
- `professorId` - ID du professeur
- `status` - Statut
- `search` - Recherche textuelle

**Retour**: `ApiResult<Course[]>`

### coursesApi.getById(id)

Récupère un cours par son ID.

**Endpoint**: `GET /courses/:id`

**Retour**: `ApiResult<Course>`

### coursesApi.create(data)

Crée un nouveau cours.

**Endpoint**: `POST /courses`

**Body**: `CreateCourseData`

**Retour**: `ApiResult<Course>`

### coursesApi.update(data)

Met à jour un cours.

**Endpoint**: `PUT /courses/:id`

**Body**: `Omit<UpdateCourseData, 'id'>`

**Retour**: `ApiResult<Course>`

### coursesApi.delete(id)

Supprime un cours.

**Endpoint**: `DELETE /courses/:id`

**Retour**: `ApiResult<void>`

---

## 🧪 Tests (À Implémenter)

```typescript
// courses.test.ts
describe('Courses Feature', () => {
  describe('useCourses', () => {
    it('should fetch courses list');
    it('should filter courses by type');
    it('should filter courses by level');
  });

  describe('useCourseDetail', () => {
    it('should fetch course by id');
    it('should handle course not found');
  });

  describe('useCreateCourse', () => {
    it('should create a new course');
    it('should invalidate courses cache');
  });

  describe('CourseCard', () => {
    it('should render course information');
    it('should show full status when capacity reached');
  });

  describe('CoursesList', () => {
    it('should render list of courses');
    it('should show loading state');
    it('should show error state');
    it('should show empty state');
  });
});
```

---

## 📝 Notes

### Gestion de la Capacité

Le composant calcule automatiquement les places disponibles :
```typescript
const availableSpots = course.capacity - course.enrolled;
const isFull = availableSpots <= 0;
const isAlmostFull = availableSpots > 0 && availableSpots <= 3;
```

### Color Coding

- **Type**: Toujours bleu (`pf-m-blue`)
- **Niveau**:
  - Débutant: Vert (`pf-m-green`)
  - Intermédiaire: Orange (`pf-m-orange`)
  - Avancé: Rouge (`pf-m-red`)
- **Statut**:
  - Actif: Vert (`pf-m-green`)
  - Complet: Orange (`pf-m-orange`)
  - Inactif: Gris (`pf-m-grey`)
- **Places**:
  - Complet (0): Rouge danger
  - Presque complet (1-3): Orange warning
  - Disponible (4+): Vert success

### Performance

- **React Query Cache**: Les données sont mises en cache automatiquement
- **Invalidation intelligente**: Seulement les queries affectées sont rafraîchies
- **Lazy Loading**: Les composants UI utilisent `React.lazy()`

---

## 🔗 Liens Relatifs

### Dépendances

- `@/shared/api/client` - HTTP Client
- `@tanstack/react-query` - Data fetching

### Features Liées

- `@/features/professors` - Professeurs des cours
- `@/features/enrollment` - Inscriptions aux cours (à venir)
- `@/features/sessions` - Sessions des cours (à venir)

### Pages

- `@/pages/courses/CoursesListPage` - Page liste
- `@/pages/courses/CourseDetailPage` - Page détails

---

## 📜 Changelog

### v1.0.0 (Janvier 2025)

#### Added
- ✅ Structure FSD complète
- ✅ API layer avec Result pattern
- ✅ Types TypeScript complets
- ✅ React Query hooks (CRUD)
- ✅ CourseCard component
- ✅ CoursesList component
- ✅ CourseFilters types
- ✅ Labels français
- ✅ Pages liste et détails
- ✅ Routes intégrées au router
- ✅ Documentation complète

---

## 👥 Contributeurs

- **Architecture**: Feature-Sliced Design
- **Patterns**: Result Pattern, React Query
- **UI Library**: PatternFly 6

---

## 📄 License

Partie du projet ClubManager - Tous droits réservés

---

**Dernière révision**: Janvier 2025  
**Status**: ✅ Production Ready