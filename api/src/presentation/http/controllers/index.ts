/**
 * Barrel export pour tous les Controllers
 *
 * Ce fichier centralise les exports des Controllers pour faciliter les imports.
 * Au lieu d'importer depuis chaque fichier individuellement, on peut importer depuis ce fichier.
 *
 * @example
 * import { CoursController, createCoursController } from '@/presentation/http/controllers';
 */

// ============== USER CONTROLLER ==============
export { UserController, createUserController } from './UserController.js';

// ============== COURS CONTROLLER ==============
export { CoursController, createCoursController } from './CoursController.js';

// ============== COURS RECURRENT CONTROLLER ==============
export {
  CoursRecurrentController,
  createCoursRecurrentController,
} from './CoursRecurrentController.js';
