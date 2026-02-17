# @clubmanager/types

TypeScript types package for ClubManager - A generic club and shop management system.

## 📦 Structure

This package contains **automatically generated TypeScript types** from the SQL database schema, organized into **12 logical domains** (all in English).

### Domains

| Domain | Tables | Description |
|--------|--------|-------------|
| **users** | 6 | User accounts, profiles, security, password resets, deletion requests |
| **activities** | 4 | Activity categories, activities, levels/grades, user-activity assignments |
| **sessions** | 4 | Instructors, session types, scheduled sessions, enrollments |
| **memberships** | 3 | Membership plans, active memberships, payments |
| **shop** | 4 | Product categories, products, orders, order items |
| **communications** | 3 | Messages, announcements, notifications |
| **events** | 3 | Event types, events, event registrations |
| **documents** | 1 | Shared documents and files |
| **gdpr** | 1 | User consents (RGPD compliance) |
| **settings** | 1 | Club configuration settings |
| **statistics** | 4 | Attendance, financial, activity, and club-wide statistics |
| **audit** | 1 | Audit logs for traceability |

**Total: 35 tables across 12 domains**

## 🚀 Usage

### Import Everything

```typescript
import * as types from '@clubmanager/types';

// Access domain types
const user: types.users.Users = { ... };
const activity: types.activities.Activities = { ... };
```

### Import Specific Domain

```typescript
import { users, shop, events } from '@clubmanager/types';

// Use domain types
const newUser: users.Users = {
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  password: 'hashed_password',
  role: 'member'
};

// Insert types (without id and timestamps)
const userToCreate: users.UsersInsert = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@example.com',
  password: 'hashed_password'
};

// Update types (all fields optional)
const userUpdate: users.UsersUpdate = {
  first_name: 'Jane',
  active: true
};
```

### GraphQL Type Definitions

```typescript
import { users } from '@clubmanager/types/graphql';

// Use GraphQL type definitions
console.log(users.UsersTypeDefs);
// Returns GraphQL SDL string for Users type
```

### Zod Validators

```typescript
import { users } from '@clubmanager/types';

// Validate data
const result = users.usersSchema.safeParse(userData);

if (result.success) {
  // Data is valid
  const validUser = result.data;
} else {
  // Handle validation errors
  console.error(result.error);
}

// Use create/update schemas
const createResult = users.usersCreateSchema.safeParse(newUserData);
const updateResult = users.usersUpdateSchema.safeParse(updateData);
```

## 📁 Generated Files

Each domain contains 4 files:

1. **`database.types.generated.ts`** - TypeScript interfaces for all tables
   - Main interface (e.g., `Users`)
   - Insert interface (e.g., `UsersInsert`)
   - Update interface (e.g., `UsersUpdate`)

2. **`graphql.ts`** - GraphQL type definitions (SDL strings)

3. **`validators.ts`** - Zod schemas for validation
   - Main schema (e.g., `usersSchema`)
   - Create schema (e.g., `usersCreateSchema`)
   - Update schema (e.g., `usersUpdateSchema`)

4. **`index.ts`** - Re-exports all domain files

## 🔄 Regenerating Types

Types are automatically generated from the SQL schema. To regenerate:

```bash
npm run generate:types
```

This will:
1. Parse `db/schema/clubmanager_simplified.sql`
2. Delete old domain folders
3. Generate new TypeScript types for all 35 tables
4. Organize them into 12 logical domains
5. Create validators and GraphQL definitions

### Generation Script

The generator is located at: `scripts/generate-types-from-sql.js`

It:
- ✅ Parses SQL CREATE TABLE statements
- ✅ Extracts columns, types, enums, comments
- ✅ Converts SQL types to TypeScript types
- ✅ Generates Insert/Update interfaces
- ✅ Creates Zod validators
- ✅ Generates GraphQL SDL

## 🎯 Type Features

### Enum Support

SQL enums are converted to TypeScript union types:

```sql
role enum('admin','instructor','member')
```

Becomes:

```typescript
role?: 'admin' | 'instructor' | 'member';
```

### Nullable Fields

SQL nullable columns become optional TypeScript properties:

```sql
phone varchar(20) DEFAULT NULL
```

Becomes:

```typescript
phone?: string;
```

### Comments

SQL comments are preserved as JSDoc:

```sql
-- admin=administrateur, instructor=enseignant/coach, member=adhérent
role enum('admin','instructor','member')
```

Becomes:

```typescript
/** admin=administrateur, instructor=enseignant/coach, member=adhérent */
role?: 'admin' | 'instructor' | 'member';
```

## 🏗️ Core Types

In addition to domain types, the package exports core types:

- **Pagination**: `PaginationInput`, `PaginatedResponse`
- **Sorting**: `SortInput`, `SortOrder`
- **Filtering**: `FilterInput`, `MultiFilterInput`
- **Errors**: `AppError`, `ErrorResponse`, `ErrorCode`
- **API Responses**: `ApiResponse<T>`, `InsertResult`, `UpdateResult`
- **And more...**

See `src/core/` for all core types.

## 📊 Database Schema

The types are generated from a **generic, student-appropriate schema** designed for:

- ✅ Any type of club (sports, cultural, leisure, training)
- ✅ Any type of shop (equipment, books, merchandise, services)
- ✅ Multi-activity management
- ✅ Session scheduling and enrollment
- ✅ Membership and payment tracking
- ✅ E-commerce (products, orders)
- ✅ Communication (messages, announcements, notifications)
- ✅ Event management
- ✅ Document sharing
- ✅ GDPR compliance (user consents)
- ✅ Statistics and analytics
- ✅ Audit logging

## 🔐 Security Features

The schema includes:

- ✅ Password hashing (bcrypt)
- ✅ Rate limiting (failed login attempts, account lockout)
- ✅ Password reset tokens (secure, time-limited, one-time use)
- ✅ Email verification
- ✅ Audit logs (IP tracking, user actions)
- ✅ GDPR compliance (consents, deletion requests)

## 📝 License

ISC

## 👨‍💻 Maintained By

Generated automatically from SQL schema for ClubManager TFE project.