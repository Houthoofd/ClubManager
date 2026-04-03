# 🎯 Plan d'Action Immédiat - Front-End V2

> **Date**: Janvier 2025  
> **Objectif**: Créer les features critiques du cœur métier  
> **Timeline**: 2-3 semaines

---

## 📍 Où Nous Sommes

### ✅ Complété
- Infrastructure FSD complète
- Feature Auth (100%)
- Feature Professors (100%)
- Documentation exhaustive
- 10 pages créées

### 🎯 Objectif Immédiat
Créer les **3 features critiques** du cœur métier:
1. **Courses** (gestion des cours)
2. **Enrollment** (inscriptions)
3. **Sessions** (planning)

---

## 🚀 Action Plan - Semaine 1

### 📦 Tâche 1: Feature Courses (2-3 jours)

#### Étape 1.1: Structure (30 min)
```bash
# Créer la structure FSD
mkdir -p src/features/courses/{api,model,ui}
touch src/features/courses/api/coursesApi.ts
touch src/features/courses/model/types.ts
touch src/features/courses/model/useCourses.ts
touch src/features/courses/model/useCourseDetail.ts
touch src/features/courses/model/useCourseFilters.ts
touch src/features/courses/ui/CourseCard.tsx
touch src/features/courses/ui/CoursesList.tsx
touch src/features/courses/ui/CourseDetail.tsx
touch src/features/courses/ui/CourseForm.tsx
touch src/features/courses/ui/CourseFilters.tsx
touch src/features/courses/index.ts
```

#### Étape 1.2: Types (1h)
**Fichier**: `src/features/courses/model/types.ts`

```typescript
export type CourseType = 'krav-maga' | 'fitness' | 'yoga' | 'self-defense';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'active' | 'inactive' | 'full';

export interface Course {
  id: number;
  name: string;
  description: string;
  type: CourseType;
  level: CourseLevel;
  professorId: number;
  professor?: {
    id: number;
    name: string;
  };
  capacity: number;
  enrolled: number;
  price: number;
  duration: number; // minutes
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFilters {
  type?: CourseType;
  level?: CourseLevel;
  professorId?: number;
  status?: CourseStatus;
  search?: string;
}

export interface CreateCourseData {
  name: string;
  description: string;
  type: CourseType;
  level: CourseLevel;
  professorId: number;
  capacity: number;
  price: number;
  duration: number;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  id: number;
}
```

#### Étape 1.3: API Layer (1h)
**Fichier**: `src/features/courses/api/coursesApi.ts`

```typescript
import { httpClient } from '@/shared/api/client';
import type { ApiResult } from '@/shared/api/client';
import type { Course, CreateCourseData, UpdateCourseData, CourseFilters } from '../model/types';

export const coursesApi = {
  getAll: async (filters?: CourseFilters): Promise<ApiResult<Course[]>> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.level) params.append('level', filters.level);
    if (filters?.professorId) params.append('professorId', filters.professorId.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = queryString ? `courses?${queryString}` : 'courses';
    
    return httpClient.get(url);
  },

  getById: async (id: number): Promise<ApiResult<Course>> => {
    return httpClient.get(`courses/${id}`);
  },

  create: async (data: CreateCourseData): Promise<ApiResult<Course>> => {
    return httpClient.post('courses', data);
  },

  update: async (data: UpdateCourseData): Promise<ApiResult<Course>> => {
    const { id, ...updateData } = data;
    return httpClient.put(`courses/${id}`, updateData);
  },

  delete: async (id: number): Promise<ApiResult<void>> => {
    return httpClient.delete(`courses/${id}`);
  },
};
```

#### Étape 1.4: Hooks (2h)
**Fichier**: `src/features/courses/model/useCourses.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../api/coursesApi';
import type { CourseFilters, CreateCourseData, UpdateCourseData } from './types';

export const useCourses = (filters?: CourseFilters) => {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: async () => {
      const result = await coursesApi.getAll(filters);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
  });
};

export const useCourseDetail = (id: number) => {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: async () => {
      const result = await coursesApi.getById(id);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    enabled: !!id,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCourseData) => {
      const result = await coursesApi.create(data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCourseData) => {
      const result = await coursesApi.update(data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses', data.id] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await coursesApi.delete(id);
      return result.match(
        () => id,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
```

#### Étape 1.5: UI Components (4h)
**Fichier**: `src/features/courses/ui/CourseCard.tsx`

```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '../model/types';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const availableSpots = course.capacity - course.enrolled;
  const isFull = availableSpots <= 0;

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{course.name}</h3>
        <span
          className={`px-2 py-1 rounded text-sm ${
            course.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {course.status}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description}</p>

      <div className="space-y-1 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Type:</span>
          <span className="font-medium">{course.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Niveau:</span>
          <span className="font-medium">{course.level}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Durée:</span>
          <span className="font-medium">{course.duration} min</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Places:</span>
          <span className={isFull ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
            {availableSpots} / {course.capacity}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t">
        <span className="text-lg font-bold text-blue-600">{course.price} €</span>
        <Link
          to={`/courses/${course.id}`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Voir détails
        </Link>
      </div>
    </div>
  );
};
```

**Fichier**: `src/features/courses/ui/CoursesList.tsx`

```typescript
import React from 'react';
import { useCourses } from '../model/useCourses';
import { CourseCard } from './CourseCard';
import type { CourseFilters } from '../model/types';

interface CoursesListProps {
  filters?: CourseFilters;
}

export const CoursesList: React.FC<CoursesListProps> = ({ filters }) => {
  const { data: courses, isLoading, error } = useCourses(filters);

  if (isLoading) {
    return <div className="text-center py-8">Chargement des cours...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Erreur: {error.message}
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucun cours trouvé.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};
```

#### Étape 1.6: Public API (15 min)
**Fichier**: `src/features/courses/index.ts`

```typescript
// UI Components
export { CourseCard } from './ui/CourseCard';
export { CoursesList } from './ui/CoursesList';
export { CourseDetail } from './ui/CourseDetail';
export { CourseForm } from './ui/CourseForm';
export { CourseFilters } from './ui/CourseFilters';

// Hooks
export { 
  useCourses, 
  useCourseDetail,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from './model/useCourses';

// Types
export type {
  Course,
  CourseType,
  CourseLevel,
  CourseStatus,
  CourseFilters,
  CreateCourseData,
  UpdateCourseData,
} from './model/types';
```

#### Étape 1.7: Pages (1h)
**Fichier**: `src/pages/courses/CoursesListPage.tsx`

```typescript
import React, { useState } from 'react';
import { CoursesList, CourseFilters as Filters } from '@/features/courses';
import type { CourseFilters } from '@/features/courses';

export const CoursesListPage: React.FC = () => {
  const [filters, setFilters] = useState<CourseFilters>({});

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Nos Cours</h1>
        <p className="text-gray-600">
          Découvrez notre catalogue de cours et inscrivez-vous dès maintenant
        </p>
      </div>

      {/* Filters component will be implemented */}
      <div className="mb-6">
        {/* <Filters filters={filters} onChange={setFilters} /> */}
      </div>

      <CoursesList filters={filters} />
    </div>
  );
};
```

#### Étape 1.8: Router (15 min)
**Fichier**: `src/app/router/Router.tsx` (ajouter routes)

```typescript
// Ajouter dans les routes
{
  path: '/courses',
  element: <CoursesListPage />,
},
{
  path: '/courses/:id',
  element: <CourseDetailPage />,
},
```

---

### 📦 Tâche 2: Composants UI Partagés (1 jour)

#### Créer les composants essentiels

**À créer**:
1. `shared/ui/Input/` - Champ texte
2. `shared/ui/Select/` - Liste déroulante
3. `shared/ui/Card/` - Carte réutilisable
4. `shared/ui/Modal/` - Fenêtre modale
5. `shared/ui/Badge/` - Badge de statut
6. `shared/ui/Spinner/` - Indicateur de chargement

**S'inspirer de**: `shared/ui/Button/` pour la structure

---

### 📦 Tâche 3: Feature Enrollment (2 jours)

#### Structure similaire à Courses

```
features/enrollment/
├── api/enrollmentApi.ts
├── model/
│   ├── types.ts
│   ├── useEnrollment.ts
│   └── useMyEnrollments.ts
├── ui/
│   ├── EnrollButton.tsx
│   ├── UnenrollButton.tsx
│   └── MyEnrollmentsList.tsx
└── index.ts
```

#### Types principaux

```typescript
interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  status: 'confirmed' | 'pending' | 'waitlist';
  enrolledAt: string;
}

interface EnrollmentRequest {
  courseId: number;
}
```

---

## 🚀 Action Plan - Semaine 2

### 📦 Tâche 4: Feature Sessions (3-4 jours)

**Challenge**: Calendrier complexe

#### Option A: Utiliser react-big-calendar
```bash
npm install react-big-calendar date-fns
npm install -D @types/react-big-calendar
```

#### Option B: Utiliser FullCalendar
```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid
```

**Recommandation**: react-big-calendar (plus léger, plus customizable)

#### Structure

```
features/sessions/
├── api/sessionsApi.ts
├── model/
│   ├── types.ts
│   ├── useSessions.ts
│   └── useCreateSession.ts
├── ui/
│   ├── SessionCalendar.tsx
│   ├── SessionCard.tsx
│   └── SessionForm.tsx
└── index.ts

widgets/calendar/
├── ui/
│   └── Calendar.tsx
└── index.ts
```

---

## 📋 Checklist Quotidienne

### Chaque Jour
- [ ] Lancer le dev server: `npm run dev`
- [ ] Tester les nouvelles features dans le navigateur
- [ ] Vérifier ESLint: `npm run lint`
- [ ] Commit avec message descriptif
- [ ] Mettre à jour la documentation si nécessaire

### Chaque Feature
- [ ] Structure FSD respectée
- [ ] Types TypeScript complets
- [ ] Result pattern utilisé
- [ ] Public API (index.ts) propre
- [ ] Pas de console.log
- [ ] Pas de `any`
- [ ] Composants testables
- [ ] Documentation JSDoc

---

## 🎯 Objectifs de la Semaine 1

### Livrables
- ✅ Feature Courses complète
- ✅ 5+ composants UI partagés
- ✅ Feature Enrollment (base)
- ✅ 3+ nouvelles pages

### Métriques
- Features: 2 → 4 (100% augmentation)
- Components: 2 → 7+ (250% augmentation)
- Pages: 10 → 13+ (30% augmentation)

---

## 🎯 Objectifs de la Semaine 2

### Livrables
- ✅ Feature Sessions complète
- ✅ Widget Calendar
- ✅ Feature Enrollment complète
- ✅ 10+ composants UI partagés

### Métriques
- Features: 4 → 5 (25% augmentation)
- Widgets: 0 → 1
- Components: 7 → 17+ (140% augmentation)

---

## 💡 Conseils

### Performance
- Utiliser React.memo pour les listes
- Pagination dès le début (ne pas charger 1000+ items)
- Lazy loading pour les images

### UX
- Loading states partout
- Error boundaries
- Messages d'erreur clairs
- Feedback visuel sur actions

### Code Quality
- Extraire la logique complexe dans des hooks custom
- Composants < 200 lignes
- Fonctions < 50 lignes
- Un seul niveau de responsabilité

---

## 🚨 Quand Demander de l'Aide

### Blocker si:
- Stuck > 2h sur un problème
- Architecture decision complexe
- Performance issue
- Bug incompréhensible

### Ressources
1. Documentation FSD: `front-end-v2/README.md`
2. Guide migration: `front-end/MIGRATION_GUIDE.md`
3. Exemples: `features/auth/`, `features/professors/`
4. Stack Overflow pour React/TypeScript

---

## 📊 Tracking Progress

### Mise à jour quotidienne dans:
- `ROADMAP.md` - Burn down chart
- `REFACTORING_TODO.md` - Cocher les ✅

### Weekly review:
- Demo des features complétées
- Retrospective: What worked / What didn't
- Planning semaine suivante

---

## 🎉 Motivation

**Progrès actuel**: 30% ✅  
**Après semaine 1**: ~45% 🎯  
**Après semaine 2**: ~60% 🚀  

**On est sur la bonne voie ! 💪**

---

*Let's build something awesome! 🚀*