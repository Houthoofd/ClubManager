/**
 * @fileoverview Legacy Types Index
 * @deprecated This file contains deprecated types that are still used by the API.
 *
 * ⚠️ WARNING: These types are deprecated and will be removed in a future version.
 * Please migrate to the new validators and types in the main package.
 *
 * Migration Guide:
 * - ConfirmationResult → Use Zod validators with proper error handling
 * - VerifyResult → Use Zod validators with proper error handling
 * - UserData → Use User type from domain/user
 * - CommandeStore → Use Order type from domain/store
 * - ArticleData → Use Article type from domain/store
 * - CoursData → Use Course type from domain/course
 * - Schemas → Use validators from validators/ directory
 */

// Re-export all deprecated types for backward compatibility
export * from './deprecated/utilisateurs.js';
export * from './deprecated/commandes.js';
export * from './deprecated/cours.js';
export * from './deprecated/magasin.js';
export * from './deprecated/query.js';
export * from './deprecated/statistiques.js';

// Re-export schemas if they exist
export * from './deprecated/schemas/user.js';

/**
 * @deprecated Use the new architecture:
 *
 * OLD → NEW Migration Examples:
 *
 * 1. User Types:
 *    import { UserData } from '@clubmanager/types/legacy'
 *    → import { User } from '@clubmanager/types'
 *
 * 2. Validation:
 *    import { articleCreationSchema } from '@clubmanager/types/legacy'
 *    → import { createArticleSchema } from '@clubmanager/types'
 *
 * 3. Store Types:
 *    import { ArticleData } from '@clubmanager/types/legacy'
 *    → import { Article, CreateArticle } from '@clubmanager/types'
 *
 * 4. Course Types:
 *    import { CoursData } from '@clubmanager/types/legacy'
 *    → import { Course, CreateCourse } from '@clubmanager/types'
 *
 * 5. Result Types:
 *    Instead of ConfirmationResult/VerifyResult, use:
 *    - Zod validation: schema.safeParse(data)
 *    - Proper error handling with try/catch
 *    - Type-safe responses with ApiResponse<T>
 */
