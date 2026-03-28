// ============================================
// LEGACY EXPORTS (à migrer progressivement)
// ============================================
export * from "./utilisateurs.js";
export * from "./query.js";
export * from "./cours.js";
export * from "./statistiques.js";
// Export du magasin
export * from "./magasin.js";
export { userDataLoginByUserIdSchema, userSearchByEmailSchema, } from "./utilisateurs.js";
// ============================================
// NEW ARCHITECTURE EXPORTS
// ============================================
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
// DTOs - Users
export * from "./dtos/users/UserDto.js";
export * from "./dtos/auth/AuthDto.js";
// DTOs - Courses
export * from "./dtos/courses/index.js";
// DTOs - Payments
export * from "./dtos/payments/index.js";
// DTOs - Store
export * from "./dtos/store/index.js";
// Validators (Zod schemas)
export * from "./validators/index.js";
