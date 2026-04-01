# Legacy Types - Migration Guide

⚠️ **DEPRECATED**: This folder contains legacy types that are maintained only for backward compatibility with the existing API.

## ⚠️ Status

**DO NOT USE** these types for new code. They will be removed in a future major version.

All new code should use the **new architecture** with:
- ✅ Zod validators (`validators/`)
- ✅ Domain types (`domain/`)
- ✅ DTOs (`dtos/`)

---

## 📋 Migration Guide

### 1. User Types

**OLD (Legacy):**
```typescript
import { 
  UserData, 
  UserDataLogin, 
  UserDataSession,
  UserDataAjout 
} from '@clubmanager/types';
```

**NEW (Current):**
```typescript
import { 
  User,
  CreateUser,
  UpdateUser,
  UserResponse 
} from '@clubmanager/types';

// With validation
import { 
  userBaseSchema,
  createUserSchema,
  updateUserSchema 
} from '@clubmanager/types';
```

---

### 2. Store/Magasin Types

**OLD (Legacy):**
```typescript
import { 
  ArticleData, 
  ArticleCreationData,
  NouvelleCommande,
  ArticleCommande,
  ArticlesParCategorie,
  CommandeStore 
} from '@clubmanager/types';
```

**NEW (Current):**
```typescript
import { 
  Article,
  CreateArticle,
  UpdateArticle,
  Order,
  CreateOrder,
  OrderItem 
} from '@clubmanager/types';

// With validation
import { 
  articleBaseSchema,
  createArticleSchema,
  createOrderSchema 
} from '@clubmanager/types';
```

---

### 3. Course Types

**OLD (Legacy):**
```typescript
import { 
  CoursData,
  Professeur,
  InscriptionData 
} from '@clubmanager/types';
```

**NEW (Current):**
```typescript
import { 
  Course,
  CreateCourse,
  Professor,
  CreateProfessor,
  Inscription,
  CreateInscription 
} from '@clubmanager/types';

// With validation
import { 
  courseBaseSchema,
  createCourseSchema,
  professorBaseSchema 
} from '@clubmanager/types';
```

---

### 4. Result Types (ConfirmationResult, VerifyResult)

**OLD (Legacy):**
```typescript
import { 
  ConfirmationResult, 
  VerifyResult, 
  VerifyResultWithData 
} from '@clubmanager/types';

function deleteUser(id: number): ConfirmationResult {
  // ...
  return { success: true };
}
```

**NEW (Current):**
```typescript
// Use Zod validation with proper error handling
import { z } from 'zod';
import { idSchema } from '@clubmanager/types';

function deleteUser(id: number): { success: boolean; error?: string } {
  const result = idSchema.safeParse(id);
  if (!result.success) {
    return { 
      success: false, 
      error: result.error.errors[0].message 
    };
  }
  
  // ... delete logic
  return { success: true };
}

// Or use ApiResponse<T> for consistent API responses
import { ApiResponse } from '@clubmanager/types';

async function getUser(id: number): Promise<ApiResponse<User>> {
  try {
    const user = await db.getUserById(id);
    return { success: true, data: user };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}
```

---

### 5. Validation Schemas

**OLD (Legacy):**
```typescript
import { 
  articleCreationSchema,
  articleDataValidationSchema,
  nouvelleCommandeSchema 
} from '@clubmanager/types';
```

**NEW (Current):**
```typescript
import { 
  createArticleSchema,
  updateArticleSchema,
  createOrderSchema,
  articleBaseSchema 
} from '@clubmanager/types';

// Usage example
const result = createArticleSchema.safeParse(data);
if (!result.success) {
  console.error(result.error.errors);
  return;
}

const validatedData = result.data; // Type-safe!
```

---

## 🏗️ New Architecture Benefits

### 1. **Single Source of Truth**
- Types are inferred directly from Zod schemas
- No duplication between validators and types
- Automatic type updates when schemas change

### 2. **Runtime Validation + TypeScript Types**
```typescript
import { createUserSchema, CreateUser } from '@clubmanager/types';

// Type-safe at compile time
const userData: CreateUser = {
  nom: 'Doe',
  prenom: 'John',
  email: 'john@example.com',
  // ... TypeScript ensures all required fields are present
};

// Validated at runtime
const result = createUserSchema.safeParse(userData);
if (result.success) {
  // Data is validated AND type-safe
  const validated: CreateUser = result.data;
}
```

### 3. **Better Error Messages**
```typescript
// Old way - generic errors
if (!data.nom || data.nom.length < 2) {
  throw new Error('Invalid name');
}

// New way - specific, actionable errors
const result = createUserSchema.safeParse(data);
if (!result.success) {
  // "Le nom doit contenir au moins 2 caractères"
  // "L'email n'est pas valide"
  // etc.
  console.error(result.error.errors);
}
```

### 4. **Consistent Validation Rules**
All validators respect database constraints:
- Field lengths (VARCHAR limits)
- CHECK constraints (prix >= 0, quantité > 0)
- ENUM types (status, notification types)
- Foreign key relationships
- Business logic (date ranges, bulk operation limits)

---

## 📊 Coverage

The new architecture covers **100% of the database schema**:

| Domain | Tables | Validators | Tests | Coverage |
|--------|--------|-----------|-------|----------|
| Users & Auth | 7 | 2 | 350 | 100% |
| Courses | 6 | 5 | 750 | 100% |
| Payments | 3 | 3 | 450 | 100% |
| Store | 8 | 8 | 1396 | 99.18% |
| Messaging | 8 | 8 | 1710 | 100% |
| Groups | 2 | 2 | 243 | 100% |
| Statistics | 2 | 2 | 43 | 97.87% |
| Lookup | 3 | 3 | 46 | 100% |
| **TOTAL** | **39** | **34** | **4588** | **99.68%** |

---

## 🚀 Migration Steps for API

### Step 1: Identify Usage
```bash
# Find all imports of legacy types
grep -r "from '@clubmanager/types'" api/src --include="*.ts" --include="*.js"
```

### Step 2: Replace Imports
```typescript
// Before
import { UserData } from '@clubmanager/types';

// After
import { User, CreateUser } from '@clubmanager/types';
```

### Step 3: Update Validation
```typescript
// Before
if (!data.nom || data.nom.length < 2) {
  return { success: false, message: 'Invalid name' };
}

// After
import { createUserSchema } from '@clubmanager/types';

const result = createUserSchema.safeParse(data);
if (!result.success) {
  return { 
    success: false, 
    errors: result.error.errors 
  };
}
```

### Step 4: Test
Run tests to ensure nothing breaks:
```bash
cd api
npm test
```

---

## 📅 Deprecation Timeline

- ✅ **v2.0.0** (Current): Legacy types moved to `legacy/` folder
- ⚠️ **v3.0.0** (Q2 2024): Legacy types marked as deprecated with warnings
- ❌ **v4.0.0** (Q4 2024): Legacy types removed completely

**Action Required**: Migrate all code to the new architecture before v4.0.0

---

## 🆘 Need Help?

If you encounter issues during migration:

1. Check the validators in `validators/` - they have comprehensive JSDoc
2. Look at the tests in `validators/**/__tests__/` - they show usage examples
3. Refer to domain types in `domain/` for the new structure
4. Check DTOs in `dtos/` for API request/response structures

---

## 📚 Additional Resources

- **Zod Documentation**: https://zod.dev
- **Validators Location**: `packages/types/src/validators/`
- **Tests Location**: `packages/types/src/validators/**/__tests__/`
- **Coverage**: Run `npm test -- --coverage` in `packages/types/`
