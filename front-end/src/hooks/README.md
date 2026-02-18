# 🎣 Hooks Module Documentation

> **Centralized React hooks for ClubManager application**  
> Organized into logical modules for better maintainability and developer experience.

---

## 📁 Module Structure

```
hooks/
├── index.ts                    # Central barrel export
├── auth/                       # Authentication & User Management
│   ├── index.ts
│   ├── useAuth.ts             ✅ Typed
│   ├── useCompte.ts           🔄 To type
│   ├── useCompteData.ts       🔄 To type
│   ├── useConnexion.ts        🔄 To type
│   ├── useVerification.ts     🔄 To type
│   └── useAuthRedirect.ts     🔄 To type
├── courses/                    # Courses & Sessions Management
│   ├── index.ts
│   ├── useCours.ts            ✅ Typed
│   ├── useInscriptions.ts     ✅ Typed
│   ├── useParticipants.ts     ✅ Typed
│   ├── useProfesseurs.ts      ✅ Typed
│   └── useInscriptionValidation.ts  🔄 To type
├── shop/                       # E-commerce & Payments
│   ├── index.ts
│   ├── useArticles.ts         ✅ Typed
│   ├── useMagasin.ts          ✅ Typed
│   ├── useCommandes.ts        ✅ Typed
│   └── usePaiements.ts        🔄 To type (priority - large file)
├── communication/              # Messaging & Notifications
│   ├── index.ts
│   ├── useMessages.ts         🔄 To type (priority - Redux removal)
│   ├── useMessagcerie.ts      🔄 To type
│   └── useNotifications.ts    🔄 To type
├── dashboard/                  # Analytics & Statistics
│   ├── index.ts
│   ├── useDashboard.ts        ✅ Typed
│   └── useStatistiques.ts     ✅ Typed
├── admin/                      # Administrative Functions
│   ├── index.ts
│   └── useUtilisateurs.ts     ✅ Typed
└── utils/                      # Common Utilities
    ├── index.ts
    ├── useToast.ts            🔄 To type
    ├── useUpload.ts           🔄 To type
    ├── useAlertes.ts          🔄 To type
    ├── useEmailDebug.ts       🔄 To type
    └── useInformations.ts     🔄 To type
```

---

## 📊 Progress Tracking

### Overall Status
- **Total Hooks**: 26
- **Typed**: 13 (50%)
- **Remaining**: 13 (50%)

### By Module
| Module | Total | Typed | Remaining | Progress |
|--------|-------|-------|-----------|----------|
| 🔐 Auth | 6 | 1 | 5 | 17% |
| 📚 Courses | 5 | 4 | 1 | 80% |
| 🛒 Shop | 4 | 3 | 1 | 75% |
| 💬 Communication | 3 | 0 | 3 | 0% |
| 📊 Dashboard | 2 | 2 | 0 | 100% ✅ |
| 👥 Admin | 1 | 1 | 0 | 100% ✅ |
| 🔧 Utils | 5 | 0 | 5 | 0% |

---

## 🎯 Module Descriptions

### 🔐 Auth Module (`hooks/auth`)
**Purpose**: Authentication, user sessions, and account management

**Hooks**:
- `useAuth` - Main authentication hook (login, logout, session status)
- `useCompte` - User account data and profile management
- `useCompteData` - Extended account information retrieval
- `useConnexion` - Connection state and session handling
- `useVerification` - Email/account verification flows
- `useAuthRedirect` - Authentication-based navigation redirects

**Usage**:
```typescript
import { useAuth, useCompte } from '@/hooks/auth';
// or
import { useAuth } from '@/hooks';
```

---

### 📚 Courses Module (`hooks/courses`)
**Purpose**: Course catalog, sessions, enrollments, and participant management

**Hooks**:
- `useCours` - Course catalog and course details
- `useInscriptions` - Enrollment management (create, update, delete)
- `useParticipants` - Participant lists and attendance tracking
- `useProfesseurs` - Instructor/teacher management
- `useInscriptionValidation` - Enrollment validation logic

**Usage**:
```typescript
import { useCours, useInscriptions } from '@/hooks/courses';
// or
import { useCours } from '@/hooks';
```

---

### 🛒 Shop Module (`hooks/shop`)
**Purpose**: E-commerce catalog, shopping cart, orders, and payments

**Hooks**:
- `useArticles` - Product catalog and article management
- `useMagasin` - Shop configuration and settings
- `useCommandes` - Order management (list, details, history)
- `usePaiements` - Payment processing and Stripe integration

**Usage**:
```typescript
import { useArticles, useCommandes } from '@/hooks/shop';
// or
import { useArticles } from '@/hooks';
```

**Note**: `usePaiements` is a large, complex hook requiring special attention during typing.

---

### 💬 Communication Module (`hooks/communication`)
**Purpose**: Messaging, notifications, and user communication

**Hooks**:
- `useMessages` - Direct messaging between users
- `useMessagcerie` - Messaging system management
- `useNotifications` - App notifications and alerts

**Usage**:
```typescript
import { useMessages, useNotifications } from '@/hooks/communication';
// or
import { useMessages } from '@/hooks';
```

**Priority**: `useMessages` requires Redux removal before full typing.

---

### 📊 Dashboard Module (`hooks/dashboard`)
**Purpose**: Analytics, statistics, and dashboard data

**Hooks**:
- `useDashboard` - Main dashboard data aggregation
- `useStatistiques` - Statistical data and reports

**Usage**:
```typescript
import { useDashboard, useStatistiques } from '@/hooks/dashboard';
// or
import { useDashboard } from '@/hooks';
```

**Status**: ✅ 100% Typed

---

### 👥 Admin Module (`hooks/admin`)
**Purpose**: Administrative functions and user management

**Hooks**:
- `useUtilisateurs` - User account administration (CRUD operations)

**Usage**:
```typescript
import { useUtilisateurs } from '@/hooks/admin';
// or
import { useUtilisateurs } from '@/hooks';
```

**Status**: ✅ 100% Typed

---

### 🔧 Utils Module (`hooks/utils`)
**Purpose**: Common utility hooks for cross-cutting concerns

**Hooks**:
- `useToast` - Toast notification management
- `useUpload` - File upload handling
- `useAlertes` - Alert/warning system
- `useEmailDebug` - Email debugging utilities
- `useInformations` - General information retrieval

**Usage**:
```typescript
import { useToast, useUpload } from '@/hooks/utils';
// or
import { useToast } from '@/hooks';
```

---

## 🚀 Usage Guidelines

### Import Patterns

#### ✅ Recommended: Central Import
```typescript
// Import from main barrel export
import { useAuth, useCours, useArticles } from '@/hooks';
```

#### ✅ Also Good: Module-specific Import
```typescript
// Import from module barrel export
import { useAuth, useCompte } from '@/hooks/auth';
import { useCours } from '@/hooks/courses';
```

#### ❌ Avoid: Direct File Import
```typescript
// Don't do this - bypasses barrel exports
import { useAuth } from '@/hooks/auth/useAuth';
```

### Type Safety

All typed hooks follow these conventions:
- ✅ Zero `any` types
- ✅ Full TypeScript coverage
- ✅ Use types from `@clubmanager/types` package
- ✅ Use `type` keyword (not `interface`)
- ✅ Proper error handling with typed responses

Example:
```typescript
import { useAuth } from '@/hooks';
import type { User } from '@clubmanager/types';

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth();
  
  // user is fully typed as User | null
  // login/logout are typed functions
  // isLoading is boolean
  
  return <div>{user?.email}</div>;
}
```

---

## 🔄 Migration Guide

### Updating Imports After Reorganization

The hooks have been moved into modules. Update your imports:

**Before**:
```typescript
import { useAuth } from '@/hooks/useAuth';
import { useCours } from '@/hooks/useCours';
import { useArticles } from '@/hooks/useArticles';
```

**After**:
```typescript
import { useAuth, useCours, useArticles } from '@/hooks';
```

### Auto-fix with Find & Replace

Use your IDE's find & replace (with regex):

**Find**: `from ['"]@/hooks/use(\w+)['"]`  
**Replace**: `from '@/hooks'`

Then organize imports and remove duplicates.

---

## 📝 Contributing

### Adding a New Hook

1. **Determine the module** - Which category does it belong to?
2. **Create the hook file** - Follow naming convention `useXxx.ts`
3. **Type everything** - Zero `any`, use `@clubmanager/types`
4. **Add to module barrel** - Export from `module/index.ts`
5. **Document it** - Update this README

### Typing an Existing Hook

1. **Read the hook** - Understand current implementation
2. **Identify types needed** - Check if types exist in `@clubmanager/types`
3. **Add missing types** - Add to `packages/types/src/core/api.types.ts` if needed
4. **Apply types** - Replace `any` with proper types
5. **Test** - Verify no TypeScript errors
6. **Update README** - Mark as ✅ Typed

---

## 🎯 Next Steps

### High Priority
1. **useMessages** - Remove Redux dependency, then type
2. **usePaiements** - Type this large/complex payment hook
3. **Auth hooks** - Complete typing of all auth-related hooks (5 remaining)

### Medium Priority
4. **Communication module** - Type messaging and notifications
5. **Utils module** - Type all utility hooks

### Lower Priority
6. **Global refactor** - Update all imports across the app
7. **Documentation** - Add JSDoc comments to all hooks
8. **Testing** - Add unit tests for critical hooks

---

## 📚 Related Documentation

- [Phase 2 Types Complete](../../../PHASE2_TYPES_COMPLETE.md)
- [Types Package Documentation](../../../../packages/types/README.md)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/best-practices)

---

**Last Updated**: 2024 - ClubManager Frontend TypeScript Migration  
**Maintained by**: Development Team