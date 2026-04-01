import { Router } from 'express';
import { CoursController } from '../controllers/CoursController.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

/**
 * Routes pour le module Cours
 *
 * Base path: /api/cours
 *
 * Routes disponibles:
 * - GET    /semaine/:weekNumber        Récupérer les cours d'une semaine
 * - GET    /me                         Récupérer mes cours (authentifié)
 * - GET    /:id                        Récupérer un cours par ID
 * - POST   /                           Créer un nouveau cours (admin)
 * - POST   /:id/inscription            S'inscrire à un cours (authentifié)
 * - DELETE /inscription/:inscriptionId Annuler une inscription (authentifié)
 * - PATCH  /inscription/:inscriptionId/presence Marquer présence (professeur/admin)
 *
 * Note: Certaines routes nécessitent une authentification et/ou des permissions spécifiques
 */

/**
 * Crée le router avec toutes les routes cours
 * @param coursController - Instance du CoursController avec ses dépendances injectées
 * @returns Router Express configuré
 */
export function createCoursRoutes(coursController: CoursController): Router {
  const router = Router();

  // ==================== ROUTES PUBLIQUES / SEMI-PUBLIQUES ====================

  /**
   * GET /cours/semaine/:weekNumber
   * Récupère tous les cours d'une semaine donnée
   *
   * Params:
   * - weekNumber: number (1-53)
   *
   * Query params (optionnels):
   * - year?: number (année, défaut: année courante)
   *
   * Réponse 200:
   * {
   *   success: true,
   *   data: {
   *     weekNumber: number,
   *     year: number,
   *     cours: [...],
   *     total: number
   *   }
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "Le numéro de semaine doit être entre 1 et 53",
   *   code: "INVALID_WEEK_NUMBER"
   * }
   */
  router.get(
    '/semaine/:weekNumber',
    asyncHandler(coursController.getCoursParSemaine.bind(coursController))
  );

  /**
   * GET /cours/:id
   * Récupère un cours par son ID avec toutes ses informations
   *
   * Params:
   * - id: number (ID du cours)
   *
   * Réponse 200:
   * {
   *   success: true,
   *   data: {
   *     id: number,
   *     date_cours: string,
   *     type_cours: string,
   *     horaire: { debut: string, fin: string },
   *     cours_recurrent_id: number,
   *     inscriptions: [...],
   *     ...
   *   }
   * }
   *
   * Réponse 404:
   * {
   *   success: false,
   *   error: "Le cours avec l'identifiant \"123\" n'existe pas",
   *   code: "COURS_NOT_FOUND"
   * }
   */
  router.get(
    '/:id',
    asyncHandler(coursController.getCours.bind(coursController))
  );

  // ==================== ROUTES AUTHENTIFIÉES ====================
  // Note: Ajouter un middleware d'authentification ici
  // router.use(authMiddleware);

  /**
   * GET /cours/me
   * Récupère tous les cours de l'utilisateur connecté (ses inscriptions)
   * Requiert: Authentification
   *
   * Réponse 200:
   * {
   *   success: true,
   *   data: {
   *     cours: [...],
   *     total: number
   *   }
   * }
   *
   * Réponse 401:
   * {
   *   success: false,
   *   error: "Utilisateur non authentifié",
   *   code: "NOT_AUTHENTICATED"
   * }
   */
  router.get(
    '/me',
    // authMiddleware, // À décommenter quand le middleware auth est prêt
    asyncHandler(coursController.getMesCours.bind(coursController))
  );

  /**
   * POST /cours/:id/inscription
   * Inscrit l'utilisateur connecté à un cours
   * Requiert: Authentification
   *
   * Params:
   * - id: number (ID du cours)
   *
   * Body (optionnel):
   * {
   *   notes?: string
   * }
   *
   * Réponse 201:
   * {
   *   success: true,
   *   message: "Inscription au cours réussie",
   *   data: {
   *     id: number,
   *     cours_id: number,
   *     participant_id: number,
   *     statut: string,
   *     ...
   *   }
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "Le cours est complet",
   *   code: "COURS_COMPLET"
   * }
   *
   * Réponse 409:
   * {
   *   success: false,
   *   error: "Vous êtes déjà inscrit à ce cours",
   *   code: "ALREADY_INSCRIT"
   * }
   */
  router.post(
    '/:id/inscription',
    // authMiddleware, // À décommenter
    asyncHandler(coursController.inscrire.bind(coursController))
  );

  /**
   * DELETE /cours/inscription/:inscriptionId
   * Annule l'inscription d'un utilisateur à un cours
   * Requiert: Authentification
   *
   * Permissions:
   * - L'utilisateur peut annuler sa propre inscription
   * - Les admins peuvent annuler n'importe quelle inscription
   *
   * Params:
   * - inscriptionId: number (ID de l'inscription)
   *
   * Body (optionnel):
   * {
   *   motif?: string
   * }
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Inscription annulée avec succès"
   * }
   *
   * Réponse 403:
   * {
   *   success: false,
   *   error: "Vous n'avez pas les permissions pour annuler cette inscription",
   *   code: "INSUFFICIENT_PERMISSIONS"
   * }
   *
   * Réponse 404:
   * {
   *   success: false,
   *   error: "L'inscription n'existe pas",
   *   code: "INSCRIPTION_NOT_FOUND"
   * }
   */
  router.delete(
    '/inscription/:inscriptionId',
    // authMiddleware, // À décommenter
    asyncHandler(coursController.annulerInscription.bind(coursController))
  );

  // ==================== ROUTES PROFESSEUR / ADMIN ====================
  // Note: Ajouter un middleware de vérification du rôle professeur/admin
  // router.use(requireProfesseurOrAdminMiddleware);

  /**
   * PATCH /cours/inscription/:inscriptionId/presence
   * Marque la présence d'un participant à un cours
   * Requiert: Authentification + Rôle Professeur ou Admin
   *
   * Params:
   * - inscriptionId: number (ID de l'inscription)
   *
   * Body:
   * {
   *   present: boolean (true = présent, false = absent)
   * }
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Présence marquée avec succès",
   *   data: {
   *     id: number,
   *     present: boolean,
   *     date_presence: string,
   *     ...
   *   }
   * }
   *
   * Réponse 403:
   * {
   *   success: false,
   *   error: "Seuls les professeurs et administrateurs peuvent marquer les présences",
   *   code: "INSUFFICIENT_PERMISSIONS"
   * }
   */
  router.patch(
    '/inscription/:inscriptionId/presence',
    // authMiddleware, // À décommenter
    // requireProfesseurOrAdminMiddleware, // À décommenter
    asyncHandler(coursController.marquerPresence.bind(coursController))
  );

  // ==================== ROUTES ADMIN ====================
  // Note: Ajouter un middleware de vérification du rôle admin
  // router.use(requireAdminMiddleware);

  /**
   * POST /cours
   * Crée un nouveau cours
   * Requiert: Authentification + Rôle Admin
   *
   * Body:
   * {
   *   date_cours: string (ISO 8601),
   *   type_cours: string,
   *   heure_debut: string (HH:MM),
   *   heure_fin: string (HH:MM),
   *   cours_recurrent_id: number
   * }
   *
   * Réponse 201:
   * {
   *   success: true,
   *   message: "Cours créé avec succès",
   *   data: {
   *     id: number,
   *     date_cours: string,
   *     type_cours: string,
   *     horaire: { debut: string, fin: string },
   *     ...
   *   }
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "Un cours existe déjà à cet horaire",
   *   code: "HORAIRE_CONFLICT"
   * }
   *
   * Réponse 403:
   * {
   *   success: false,
   *   error: "Seuls les administrateurs peuvent créer des cours",
   *   code: "INSUFFICIENT_PERMISSIONS"
   * }
   */
  router.post(
    '/',
    // authMiddleware, // À décommenter
    // requireAdminMiddleware, // À décommenter
    asyncHandler(coursController.createCours.bind(coursController))
  );

  return router;
}

/**
 * Export par défaut pour une utilisation simple
 *
 * Exemple d'utilisation avec injection de dépendances:
 *
 * ```typescript
 * import { createCoursRoutes } from './routes/cours.routes.js';
 * import { createCoursController } from './controllers/CoursController.js';
 *
 * // Créer les use cases
 * const createCoursUseCase = new CreateCoursUseCase(...);
 * const getCoursUseCase = new GetCoursUseCase(...);
 * const getCoursForParticipantUseCase = new GetCoursForParticipantUseCase(...);
 * const getCoursParSemaineUseCase = new GetCoursParSemaineUseCase(...);
 * const createInscriptionUseCase = new CreateInscriptionUseCase(...);
 * const annulerInscriptionUseCase = new AnnulerInscriptionUseCase(...);
 * const marquerPresenceUseCase = new MarquerPresenceUseCase(...);
 *
 * // Créer le controller
 * const coursController = createCoursController(
 *   createCoursUseCase,
 *   getCoursUseCase,
 *   getCoursForParticipantUseCase,
 *   getCoursParSemaineUseCase,
 *   createInscriptionUseCase,
 *   annulerInscriptionUseCase,
 *   marquerPresenceUseCase
 * );
 *
 * // Créer les routes
 * const coursRoutes = createCoursRoutes(coursController);
 *
 * // Monter les routes dans l'application
 * app.use('/api/cours', coursRoutes);
 * ```
 */
export default createCoursRoutes;
