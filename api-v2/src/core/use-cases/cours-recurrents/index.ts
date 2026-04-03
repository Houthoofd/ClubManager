/**
 * Barrel export pour tous les Use Cases du module CoursRecurrents
 *
 * Ce fichier centralise les exports des Use Cases pour faciliter les imports.
 * Au lieu d'importer depuis chaque fichier individuellement, on peut importer depuis ce fichier.
 *
 * @example
 * import { CreateCoursRecurrentUseCase, GetAllCoursRecurrentsUseCase } from '@/core/use-cases/cours-recurrents';
 */

// ============== GET ALL COURS RECURRENTS ==============
export {
  GetAllCoursRecurrentsUseCase,
  type GetAllCoursRecurrentsDTO,
} from "./GetAllCoursRecurrents.usecase.js";

// ============== GET ACTIVE COURS RECURRENTS ==============
export {
  GetActiveCoursRecurrentsUseCase,
  type GetActiveCoursRecurrentsDTO,
} from "./GetActiveCoursRecurrents.usecase.js";

// ============== CREATE COURS RECURRENT ==============
export {
  CreateCoursRecurrentUseCase,
  type CreateCoursRecurrentDTO,
} from "./CreateCoursRecurrent.usecase.js";

// ============== UPDATE COURS RECURRENT ==============
export {
  UpdateCoursRecurrentUseCase,
  type UpdateCoursRecurrentDTO,
} from "./UpdateCoursRecurrent.usecase.js";

// ============== ACTIVATE COURS RECURRENT ==============
export {
  ActivateCoursRecurrentUseCase,
  type ActivateCoursRecurrentDTO,
} from "./ActivateCoursRecurrent.usecase.js";

// ============== DEACTIVATE COURS RECURRENT ==============
export {
  DeactivateCoursRecurrentUseCase,
  type DeactivateCoursRecurrentDTO,
} from "./DeactivateCoursRecurrent.usecase.js";
