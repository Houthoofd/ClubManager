# 🎯 REFACTORING PLAN - packages/types v2.0

**Branche** : `feature/packages-types-refactoring-v2`  
**Date début** : 2025-01-25  
**Durée estimée** : 2-3 semaines  
**Objectif** : Centraliser et restructurer tous les types, DTOs, validators dans un package monorepo partagé

---

## 📋 STRUCTURE CIBLE

```
packages/types/
├── src/
│   ├── domain/                    # Entités métier (Domain Driven Design)
│   │   ├── user/
│   │   │   ├── User.types.ts
│   │   │   ├── UserAggregate.types.ts
│   │   │   └── ValueObjects.types.ts
│   │   ├── payment/
│   │   ├── course/
│   │   └── product/
│   │
│   ├── dtos/                      # Data Transfer Objects (API)
│   │   ├── users/
│   │   │   ├── CreateUserDto.ts
│   │   │   ├── UpdateUserDto.ts
│   │   │   ├── UserResponseDto.ts
│   │   │   └── SoftDeleteUserDto.ts
│   │   └── auth/
│   │       ├── LoginDto.ts
│   │       └── RegisterDto.ts
│   │
│   ├── validators/                # Zod Schemas (Validation)
│   │   ├── users/
│   │   │   ├── user.validators.ts
│   │   │   └── auth.validators.ts
│   │   └── common/
│   │       └── common.validators.ts
│   │
│   ├── api/                       # API Response Types
│   │   └── responses/
│   │       ├── ApiResponse.types.ts
│   │       └── PaginatedResponse.types.ts
│   │
│   ├── enums/                     # Enums partagés
│   │   ├── UserStatus.enum.ts
│   │   ├── UserRole.enum.ts
│   │   └── PaymentStatus.enum.ts
│   │
│   ├── constants/                 # Constants partagées
│   │   ├── validation.constants.ts
│   │   ├── roles.constants.ts
│   │   └── errors.constants.ts
│   │
│   ├── legacy/                    # Code existant (à migrer)
│   │   ├── utilisateurs.ts
│   │   ├── cours.ts
│   │   └── magasin.ts
│   │
│   └── index.ts                   # Barrel exports
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎯 PHASES DE MIGRATION

### **Phase 1 : Setup & Fondations** (Jours 1-2)
- [x] Créer nouvelle structure de dossiers
- [ ] Créer constants/validation.constants.ts
- [ ] Créer enums/UserStatus.enum.ts
- [ ] Créer enums/UserRole.enum.ts
- [ ] Créer api/responses/ApiResponse.types.ts
- [ ] Migrer code existant vers legacy/

### **Phase 2 : Domain Layer - Users** (Jours 3-4)
- [ ] Créer domain/user/User.types.ts
- [ ] Créer domain/user/UserAggregate.types.ts
- [ ] Créer domain/user/ValueObjects.types.ts (UserId, Email, etc.)
- [ ] Documentation JSDoc complète

### **Phase 3 : DTOs - Users** (Jour 5)
- [ ] Créer dtos/users/CreateUserDto.ts
- [ ] Créer dtos/users/UpdateUserDto.ts
- [ ] Créer dtos/users/UserResponseDto.ts
- [ ] Créer dtos/users/SoftDeleteUserDto.ts (RGPD v4.1)
- [ ] Créer dtos/auth/LoginDto.ts
- [ ] Créer dtos/auth/RegisterDto.ts

### **Phase 4 : Validators - Zod Schemas** (Jours 6-7)
- [ ] Créer validators/users/user.validators.ts
  - [x] createUserSchema
  - [ ] updateUserSchema
  - [ ] softDeleteUserSchema
  - [ ] userIdParamSchema
- [ ] Créer validators/users/auth.validators.ts
  - [ ] loginSchema
  - [ ] registerSchema
  - [ ] emailValidationSchema
- [ ] Créer validators/common/common.validators.ts
  - [ ] idSchema
  - [ ] dateSchema
  - [ ] paginationSchema

### **Phase 5 : Autres Domaines** (Jours 8-12)
- [ ] Domain/DTOs/Validators pour Payments
- [ ] Domain/DTOs/Validators pour Courses
- [ ] Domain/DTOs/Validators pour Products

### **Phase 6 : Intégration Backend** (Jours 13-15)
- [ ] Remplacer imports dans api/src/routes/
- [ ] Remplacer imports dans api/src/db/clients/
- [ ] Remplacer imports dans api/src/controllers/
- [ ] Tests de non-régression

### **Phase 7 : Intégration Frontend** (Jours 16-18)
- [ ] Remplacer imports dans front-end/src/
- [ ] Mettre à jour appels API
- [ ] Tests d'intégration

### **Phase 8 : Nettoyage & Documentation** (Jours 19-21)
- [ ] Supprimer legacy/ si tout fonctionne
- [ ] Mettre à jour README.md
- [ ] Générer documentation TypeDoc
- [ ] Créer exemples d'utilisation

---

## 📝 FICHIERS PRIORITAIRES (Phase 1-4)

### 1. **constants/validation.constants.ts**
```typescript
export const VALIDATION_CONSTANTS = {
  USER: {
    USERNAME: { MIN_LENGTH: 3, MAX_LENGTH: 100 },
    PASSWORD: { MIN_LENGTH: 8, MAX_LENGTH: 255 },
    EMAIL: { MIN_LENGTH: 5, MAX_LENGTH: 255 },
    AGE: { MIN: 5, MAX: 120 },
  },
  TOKEN: {
    HASH_ALGORITHM: 'sha256',
    EXPIRY: {
      EMAIL_VALIDATION: 24 * 60 * 60 * 1000, // 24h
      PASSWORD_RESET: 1 * 60 * 60 * 1000,    // 1h
    },
  },
};
```

### 2. **enums/UserStatus.enum.ts**
```typescript
export enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  SUSPENDED = 3,
  PENDING_VERIFICATION = 4,
  DELETED = 5,
}
```

### 3. **enums/UserRole.enum.ts**
```typescript
export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  PROFESSOR = 'professor',
  GUEST = 'guest',
}
```

### 4. **api/responses/ApiResponse.types.ts**
```typescript
export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  timestamp?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: any;
  };
  timestamp?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;
```

### 5. **domain/user/User.types.ts**
```typescript
/**
 * DOMAIN ENTITY - User
 * Représente un utilisateur du club
 */
export interface User {
  id: number;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth: Date;
  phone?: string;
  
  // Relations
  genreId: number;
  gradeId?: number;
  subscriptionId?: number;
  statusId: number;
  
  // Security
  passwordHash: string;
  emailVerified: boolean;
  active: boolean;
  
  // RGPD v4.1
  deletedAt?: Date | null;
  deletedBy?: number | null;
  deletionReason?: string | null;
  anonymized: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}
```

### 6. **dtos/users/CreateUserDto.ts**
```typescript
export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  password: string;
  dateOfBirth: string;
  phone?: string;
  genreId: number;
  gradeId?: number;
  subscriptionId?: number;
  statusId?: number;
}
```

### 7. **validators/users/user.validators.ts**
```typescript
import { z } from 'zod';

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const createUserSchema = z.object({
  email: z.string().email().regex(EMAIL_REGEX),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  username: z.string().min(3).max(100).optional(),
  password: z.string().min(8).max(255)
    .regex(/[A-Z]/, "Majuscule requise")
    .regex(/[a-z]/, "Minuscule requise")
    .regex(/[0-9]/, "Chiffre requis")
    .regex(/[@$!%*?&#]/, "Caractère spécial requis"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().optional(),
  genreId: z.number().int().positive(),
  gradeId: z.number().int().positive().optional(),
  subscriptionId: z.number().int().positive().optional(),
  statusId: z.number().int().positive().optional().default(1),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

---

## ✅ CHECKLIST DE MIGRATION

### Avant migration d'un module :
- [ ] Lire code existant dans legacy/
- [ ] Identifier tous les types utilisés
- [ ] Créer domain types
- [ ] Créer DTOs
- [ ] Créer validators Zod
- [ ] Créer tests unitaires

### Après migration d'un module :
- [ ] Mettre à jour imports dans backend
- [ ] Mettre à jour imports dans frontend
- [ ] Vérifier que tout compile (npm run build)
- [ ] Exécuter tests
- [ ] Commit avec message descriptif

---

## 🎯 RÈGLES DE NOMMAGE

### Fichiers
- **Types Domain** : `User.types.ts`, `Payment.types.ts`
- **DTOs** : `CreateUserDto.ts`, `UserResponseDto.ts`
- **Validators** : `user.validators.ts`, `auth.validators.ts`
- **Enums** : `UserStatus.enum.ts`, `UserRole.enum.ts`
- **Constants** : `validation.constants.ts`, `roles.constants.ts`

### Interfaces/Types
- **Domain** : `User`, `Payment`, `Course`
- **DTOs** : `CreateUserDto`, `UserResponseDto`
- **Zod inferred** : `CreateUserInput`, `UpdateUserInput`

### Exports
- Utiliser **barrel exports** dans index.ts
- Export nommés uniquement (pas de default export)
- Grouper exports par domaine

---

## 📊 ESTIMATION TEMPS

| Phase | Durée | Priorité |
|-------|-------|----------|
| Phase 1 : Setup | 2 jours | 🔴 HAUTE |
| Phase 2 : Domain Users | 2 jours | 🔴 HAUTE |
| Phase 3 : DTOs Users | 1 jour | 🔴 HAUTE |
| Phase 4 : Validators | 2 jours | 🔴 HAUTE |
| Phase 5 : Autres domaines | 5 jours | 🟡 MOYENNE |
| Phase 6 : Backend | 3 jours | 🔴 HAUTE |
| Phase 7 : Frontend | 3 jours | 🟡 MOYENNE |
| Phase 8 : Nettoyage | 3 jours | 🟢 BASSE |
| **TOTAL** | **21 jours** | |

---

## 🚀 AVANTAGES

1. ✅ **Type Safety** : Backend + Frontend partagent les mêmes types
2. ✅ **DRY** : Pas de duplication de code
3. ✅ **Maintenabilité** : Modifier un type = propagation auto
4. ✅ **Validation partagée** : Zod schemas réutilisés côté client ET serveur
5. ✅ **Documentation vivante** : Les types SONT la documentation
6. ✅ **Scalabilité** : Facile d'ajouter de nouveaux domaines
7. ✅ **Monorepo best practice** : Standard de l'industrie

---

## 📝 NOTES IMPORTANTES

### Migration progressive
- Garder legacy/ pendant la migration
- Migrer module par module (users → payments → courses)
- Ne pas tout casser d'un coup !

### Validation côté client vs serveur
- Zod schemas réutilisés des 2 côtés
- Backend = validation stricte (sécurité)
- Frontend = validation UX (feedback utilisateur)

### Versioning API
- Préparer v2 API avec nouveaux types
- Garder v1 compatible avec legacy

### Tests
- Tests unitaires pour validators
- Tests d'intégration pour DTOs
- Tests E2E pour vérifier non-régression

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Créer structure de dossiers
2. 📝 Créer fichiers Phase 1 (constants, enums, API responses)
3. 📝 Migrer code existant vers legacy/
4. 📝 Créer domain types User (Phase 2)
5. 📝 Créer DTOs User (Phase 3)
6. 📝 Créer validators User (Phase 4)
7. 🔄 Tester dans backend
8. 🔄 Tester dans frontend

---

**Prêt à démarrer Phase 1 ! 🚀**