/**
 * Barrel export pour tous les Use Cases du module Cours
 *
 * Ce fichier centralise les exports des Use Cases pour faciliter les imports.
 * Au lieu d'importer depuis chaque fichier individuellement, on peut importer depuis ce fichier.
 *
 * @example
 * import { CreateCoursUseCase, GetCoursUseCase } from '@/core/use-cases/cours';
 */

// ============== CREATE COURS ==============
export {
  CreateCoursUseCase,
  type CreateCoursDTO,
} from "./CreateCours.usecase.js";

// ============== GET COURS ==============
export { GetCoursUseCase, type GetCoursDTO } from "./GetCours.usecase.js";

// ============== GET COURS FOR PARTICIPANT ==============
export {
  GetCoursForParticipantUseCase,
  type GetCoursForParticipantDTO,
} from "./GetCoursForParticipant.usecase.js";

// ============== GET COURS PAR SEMAINE ==============
export {
  GetCoursParSemaineUseCase,
  type GetCoursParSemaineDTO,
} from "./GetCoursParSemaine.usecase.js";

// ============== GET ALL COURS PAR SEMAINE ==============
export {
  GetAllCoursParSemaineUseCase,
  type GetAllCoursParSemaineDTO,
} from "./GetAllCoursParSemaine.usecase.js";

// ============== CREATE INSCRIPTION ==============
export {
  CreateInscriptionUseCase,
  type CreateInscriptionDTO,
  type InscriptionConfig,
} from "./CreateInscription.usecase.js";

// ============== ANNULER INSCRIPTION ==============
export {
  AnnulerInscriptionUseCase,
  type AnnulerInscriptionDTO,
} from "./AnnulerInscription.usecase.js";

// ============== MARQUER PRESENCE ==============
export {
  MarquerPresenceUseCase,
  type MarquerPresenceDTO,
} from "./MarquerPresence.usecase.js";
