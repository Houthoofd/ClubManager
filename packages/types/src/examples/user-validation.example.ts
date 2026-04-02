/**
 * @fileoverview User Validation Example
 * @module @clubmanager/types/examples/user-validation
 *
 * Real-world example showing how to use Result monad + Zod validators
 * for type-safe error handling in the backend.
 *
 * This replaces the current backend pattern:
 * ❌ OLD: throw new Error() + try/catch everywhere
 * ✅ NEW: Result<T, DomainError> + explicit error handling
 */

import { z } from "zod";
import { Result } from "../shared/Result.js";
import { DomainError } from "../shared/errors/DomainError.js";
import type {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../shared/errors/DomainError.js";
import { createUserSchema } from "../validators/users/user.validators.js";
import type { User } from "../domain/user/User.types.js";

// ============================================================================
// EXAMPLE 1: Validation avec Zod + Result
// ============================================================================

/**
 * ❌ OLD WAY (current backend):
 * ```typescript
 * function validateUser(data: unknown): User {
 *   const result = createUserSchema.safeParse(data);
 *   if (!result.success) {
 *     throw new Error('Validation failed');
 *   }
 *   return result.data as User;
 * }
 * ```
 */

/**
 * ✅ NEW WAY (with Result):
 * Parse user data and return Result instead of throwing
 */
export function parseUserData(
  data: unknown,
): Result<z.infer<typeof createUserSchema>, ValidationError> {
  const result = createUserSchema.safeParse(data);

  if (!result.success) {
    // Extract first error for simplicity (or create MultipleValidationErrors)
    const firstError = result.error.errors[0];

    return Result.fail(
      DomainError.validation({
        field: firstError.path.join("."),
        message: firstError.message,
        code: mapZodErrorCode(firstError.code),
        value: data,
      }),
    );
  }

  return Result.ok(result.data);
}

/**
 * Map Zod error codes to domain error codes
 */
function mapZodErrorCode(zodCode: string): ValidationError["code"] {
  switch (zodCode) {
    case "invalid_type":
      return "INVALID_TYPE";
    case "invalid_string":
      return "INVALID_FORMAT";
    case "too_small":
      return "TOO_SHORT";
    case "too_big":
      return "TOO_LONG";
    case "invalid_enum_value":
      return "INVALID_ENUM";
    case "custom":
      return "CUSTOM_VALIDATION";
    default:
      return "INVALID_FORMAT";
  }
}

// ============================================================================
// EXAMPLE 2: Database operations avec Result
// ============================================================================

/**
 * Mock database user type
 */
interface DbUser {
  id: number;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  active: boolean;
}

/**
 * ❌ OLD WAY:
 * ```typescript
 * async function findUserById(id: number): Promise<User> {
 *   const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
 *   if (!user) {
 *     throw new Error('User not found');
 *   }
 *   return user;
 * }
 * ```
 */

/**
 * ✅ NEW WAY:
 * Find user by ID and return Result
 */
export async function findUserById(
  id: number,
): Promise<Result<DbUser, NotFoundError>> {
  try {
    // Simulate database query
    const user = await mockDatabaseQuery(id);

    if (!user) {
      return Result.fail(
        DomainError.notFound({
          entity: "User",
          id,
          message: `User with ID ${id} not found`,
        }),
      );
    }

    return Result.ok(user);
  } catch (error) {
    // Database errors would be caught here
    return Result.fail(
      DomainError.notFound({
        entity: "User",
        id,
        message: "User not found",
      }),
    );
  }
}

/**
 * Mock database query
 */
async function mockDatabaseQuery(id: number): Promise<DbUser | null> {
  // Simulate async DB call
  await new Promise((resolve) => setTimeout(resolve, 10));

  if (id === 1) {
    return {
      id: 1,
      user_id: "U-2024-0001",
      email: "john@example.com",
      first_name: "John",
      last_name: "Doe",
      active: true,
    };
  }

  return null;
}

// ============================================================================
// EXAMPLE 3: Business logic avec Result chaining
// ============================================================================

/**
 * Check if email already exists
 */
async function checkEmailExists(
  email: string,
): Promise<Result<boolean, ConflictError>> {
  // Simulate DB check
  await new Promise((resolve) => setTimeout(resolve, 10));

  const exists = email === "existing@example.com";

  if (exists) {
    return Result.fail(
      DomainError.conflict({
        entity: "User",
        field: "email",
        value: email,
        message: `User with email ${email} already exists`,
      }),
    );
  }

  return Result.ok(false);
}

/**
 * ❌ OLD WAY:
 * ```typescript
 * async function createUser(data: unknown): Promise<User> {
 *   // Validation
 *   const parsed = createUserSchema.parse(data);
 *
 *   // Check email
 *   const exists = await checkEmailExists(parsed.email);
 *   if (exists) {
 *     throw new Error('Email already exists');
 *   }
 *
 *   // Create user
 *   const user = await db.insert(parsed);
 *   return user;
 * }
 * ```
 */

/**
 * ✅ NEW WAY:
 * Create user with Result chaining - all errors are typed
 */
export async function createUser(
  data: unknown,
): Promise<Result<DbUser, ValidationError | ConflictError>> {
  // Step 1: Parse input data
  const parseResult = parseUserData(data);
  if (parseResult.isFailure()) {
    return parseResult as any;
  }

  const userData = parseResult.value;

  // Step 2: Check email doesn't exist
  const emailCheckResult = await checkEmailExists(userData.email);
  if (emailCheckResult.isFailure()) {
    return emailCheckResult as any;
  }

  // Step 3: Insert into database
  const user: DbUser = {
    id: Math.floor(Math.random() * 1000),
    user_id: `U-2024-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
    email: userData.email,
    first_name: userData.first_name,
    last_name: userData.last_name,
    active: true,
  };

  return Result.ok(user);
}

// ============================================================================
// EXAMPLE 4: Express route handler avec Result
// ============================================================================

/**
 * ✅ Express route handler using Result pattern
 *
 * Usage in backend:
 * ```typescript
 * import { createUserRoute } from '@clubmanager/types/examples/user-validation';
 *
 * router.post('/users', createUserRoute);
 * ```
 */
export async function createUserRoute(req: any, res: any) {
  const result = await createUser(req.body);

  // Pattern matching on Result
  return result.match({
    ok: (user) => {
      res.status(201).json({
        success: true,
        data: user,
      });
    },
    err: (error) => {
      const statusCode = getHttpStatusCode(error);
      res.status(statusCode).json({
        success: false,
        error: {
          code: error._tag,
          message: error.message,
          field: "field" in error ? error.field : undefined,
          timestamp: error.timestamp.toISOString(),
        },
      });
    },
  });
}

/**
 * Get HTTP status code from domain error
 */
function getHttpStatusCode(error: ValidationError | ConflictError): number {
  switch (error._tag) {
    case "ValidationError":
      return 400;
    case "ConflictError":
      return 409;
    default:
      return 500;
  }
}

// ============================================================================
// EXAMPLE 5: Multiple operations with Result.combine
// ============================================================================

/**
 * Fetch multiple users and combine results
 */
export async function fetchMultipleUsers(
  ids: number[],
): Promise<Result<DbUser[], NotFoundError>> {
  // Fetch all users in parallel
  const userPromises = ids.map((id) => findUserById(id));
  const userResults = await Promise.all(userPromises);

  // Combine results - fails if ANY user is not found
  return Result.combine(userResults);
}

// ============================================================================
// EXAMPLE 6: Using Result with Express middleware
// ============================================================================

/**
 * Generic validation middleware
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstError = result.error.errors[0];
      return res.status(400).json({
        success: false,
        error: {
          code: "ValidationError",
          message: firstError.message,
          field: firstError.path.join("."),
        },
      });
    }

    // Attach validated data to request
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Usage in routes:
 * ```typescript
 * router.post('/users',
 *   validateBody(createUserSchema),
 *   async (req, res) => {
 *     // req.validatedBody is now type-safe!
 *     const user = await createUserInDb(req.validatedBody);
 *     res.json({ success: true, data: user });
 *   }
 * );
 * ```
 */

// ============================================================================
// EXAMPLE 7: Error handling utility
// ============================================================================

/**
 * Handle Result in Express route
 */
export function handleResult<T>(
  result: Result<T, any>,
  res: any,
  successStatus: number = 200,
) {
  if (result.isSuccess()) {
    return res.status(successStatus).json({
      success: true,
      data: result.value,
    });
  }

  const error = result.error;
  const statusCode = getStatusCodeFromError(error);

  return res.status(statusCode).json({
    success: false,
    error: {
      code: error._tag || "UNKNOWN_ERROR",
      message: error.message || "An error occurred",
      ...(error.field && { field: error.field }),
      timestamp: error.timestamp?.toISOString() || new Date().toISOString(),
    },
  });
}

function getStatusCodeFromError(error: any): number {
  if (!error._tag) return 500;

  switch (error._tag) {
    case "ValidationError":
    case "MultipleValidationErrors":
      return 400;
    case "UnauthorizedError":
      return 401;
    case "ForbiddenError":
      return 403;
    case "NotFoundError":
      return 404;
    case "ConflictError":
      return 409;
    case "BusinessRuleViolation":
      return 422;
    case "RateLimitError":
      return 429;
    default:
      return 500;
  }
}

/**
 * Simplified route handler:
 * ```typescript
 * router.post('/users', async (req, res) => {
 *   const result = await createUser(req.body);
 *   return handleResult(result, res, 201);
 * });
 * ```
 */

// ============================================================================
// EXAMPLE 8: Testing with Result
// ============================================================================

/**
 * Tests are cleaner with Result - no try/catch needed
 *
 * ```typescript
 * describe('createUser', () => {
 *   it('should create user with valid data', async () => {
 *     const result = await createUser({
 *       email: 'test@example.com',
 *       firstName: 'John',
 *       lastName: 'Doe',
 *       // ... other fields
 *     });
 *
 *     expect(result.isSuccess()).toBe(true);
 *     if (result.isSuccess()) {
 *       expect(result.value.email).toBe('test@example.com');
 *     }
 *   });
 *
 *   it('should fail with invalid email', async () => {
 *     const result = await createUser({
 *       email: 'invalid',
 *       // ...
 *     });
 *
 *     expect(result.isFailure()).toBe(true);
 *     if (result.isFailure()) {
 *       expect(result.error._tag).toBe('ValidationError');
 *       expect(result.error.field).toBe('email');
 *     }
 *   });
 * });
 * ```
 */

// ============================================================================
// SUMMARY: Migration Path
// ============================================================================

/**
 * MIGRATION CHECKLIST pour le backend:
 *
 * 1. ✅ Installer @clubmanager/types (déjà fait)
 *
 * 2. ✅ Importer Result + DomainError:
 *    ```typescript
 *    import { Result, DomainError } from '@clubmanager/types';
 *    ```
 *
 * 3. ✅ Remplacer fonctions qui throw:
 *    - Avant: `function parse(data): User { ... throw ... }`
 *    - Après: `function parse(data): Result<User, ValidationError> { ... }`
 *
 * 4. ✅ Utiliser Result.fromThrowable pour wrapper code existant:
 *    ```typescript
 *    const result = Result.fromThrowable(
 *      () => JSON.parse(jsonString),
 *      (error) => DomainError.validation({...})
 *    );
 *    ```
 *
 * 5. ✅ Handler les erreurs dans les routes:
 *    ```typescript
 *    const result = await someOperation();
 *    if (result.isFailure()) {
 *      return res.status(400).json({ error: result.error });
 *    }
 *    return res.json({ data: result.value });
 *    ```
 *
 * 6. ✅ Tests deviennent plus simples (pas de try/catch)
 *
 * AVANTAGES:
 * - ✅ Erreurs explicites dans le type de retour
 * - ✅ Impossible d'oublier de gérer une erreur (TypeScript force)
 * - ✅ Pattern matching exhaustif
 * - ✅ Tests plus propres
 * - ✅ Refactoring plus sûr
 */
