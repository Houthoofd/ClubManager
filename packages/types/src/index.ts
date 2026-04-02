// ============================================
// NEW ARCHITECTURE EXPORTS
// ============================================

// Shared utilities (Result monad, errors)
export * from "./shared/index.js";

// Constants
export * from "./constants/index.js";

// Enums
export * from "./enums/index.js";

// API Response Types
export * from "./api/responses/ApiResponse.types.js";

// Domain Types - Users
export * from "./domain/user/User.types.js";

// Domain Types - Courses
export * from "./domain/course/index.js";

// Domain Types - Payments
export * from "./domain/payment/index.js";

// Domain Types - Store
export * from "./domain/store/index.js";

// Domain Types - Messaging
export * from "./domain/messaging/index.js";

// Domain Types - Groups
export * from "./domain/groups/index.js";

// Domain Types - Statistics
export * from "./domain/statistics/index.js";

// Domain Types - Lookup
export * from "./domain/lookup/index.js";

// DTOs - Users
export * from "./dtos/users/UserDto.js";
export * from "./dtos/auth/AuthDto.js";

// DTOs - Courses
export * from "./dtos/courses/index.js";

// DTOs - Payments
export * from "./dtos/payments/index.js";

// DTOs - Store
export * from "./dtos/store/index.js";

// DTOs - Messaging
export * from "./dtos/messaging/index.js";

// DTOs - Groups
export * from "./dtos/groups/index.js";

// DTOs - Statistics
export * from "./dtos/statistics/index.js";

// DTOs - Lookup
export * from "./dtos/lookup/index.js";

// ============================================
// VALIDATORS (ZOD SCHEMAS)
// ============================================
// Note: Validators are NOT exported from this index to avoid type conflicts.
// Domain types are inferred from validators, so exporting validators would create
// duplicate type exports (e.g., Article type from domain vs Article type from validators).
//
// To use validators/schemas, import them directly:
//   import { createUserSchema, loginSchema } from '@clubmanager/types/validators/users/user.validators';
//   import { createArticleSchema } from '@clubmanager/types/validators/store/article.validators';
//
// All validator schemas are available in: packages/types/src/validators/
//
// For convenience, domain types (inferred from validators) are exported above.
