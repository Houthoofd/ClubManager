import { Router } from 'express';
import { CoursRecurrentController } from '../controllers/CoursRecurrentController.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

/**
 * Routes pour le module Cours Récurrents
 *
 * Base path: /api/cours-recurrents
 *
 * Routes disponibles:
 * - GET    /              Liste tous les cours récurrents (pagination)
 * - GET    /actifs        Liste uniquement les cours récurrents actifs
 * - POST   /              Créer un nouveau cours récurrent
 * - PUT    /:id           Modifier un cours récurrent
 * - PATCH  /:id/activate  Activer un cours récurrent
 * - PATCH  /:id/deactivate Désactiver un cours récurrent
 *
 * Note: Toutes les routes nécessitent une authentification et le rôle ADMIN
 *
 * Un cours récurrent représente un cours qui se répète chaque semaine au même horaire.
 * Exemple: Cours de Bachata niveau débutant tous les lundis de 19h à 20h.
 * Ces cours récurrents servent de modèle pour générer automatiquement les cours
 * de chaque semaine.
 */

/**
 * Crée le router avec toutes les routes cours récurrents
 * @param coursRecurrentController - Instance du CoursRecurrentController avec ses dépendances injectées
 * @returns Router Express configuré
 */
export function createCoursRecurrentsRoutes(coursRecurrentController: CoursRecurrentController): Router {
  const router = Router();

  // ==================== TOUTES LES ROUTES NÉCESSITENT ADMIN ====================
  // Note: Ajouter les middlewares d'authentification et de vérification du rôle admin
  // router.use(authMiddleware);
  // router.use(requireAdminMiddleware);

  /**
   * GET /cours-recurrents/actifs
   * Récupère uniquement les cours récurrents actifs
   * Requiert: Authentification + Rôle Admin
   *
   * Note: Cette route DOIT être avant /:id pour éviter que "actifs" soit
   * interprété comme un ID
   *
   * Réponse 200:
   * {
   *   success: true,
   *   data: {
   *     coursRecurrents: [
   *       {
   *         id: number,
   *         jour_semaine: number,
   *         heure_debut: string,
   *         heure_fin: string,
   *         niveau: string,
   *         capacite_max: number,
   *         lieu: string,
   *         description: string,
   *         professeur_id: number,
   *         actif: true
   *       },
   *       ...
   *     ],
   *     total: number
   *   }
   * }
   *
   * Réponse 403:
   * {
   *   success: false,
   *   error: "Seuls les administrateurs peuvent accéder à cette ressource",
   *   code: "INSUFFICIENT_PERMISSIONS"
   * }
   */
  router.get(
    '/actifs',
    // authMiddleware, // À décommenter
    // requireAdminMiddleware, // À décommenter
    asyncHandler(coursRecurrentController.getActive.bind(coursRecurrentController))
  );

  /**
   * GET /cours-recurrents
   * Récupère la liste de tous les cours récurrents avec pagination
   * Requiert: Authentification + Rôle Admin
   *
   * Query params (optionnels):
   * - page?: number (défaut: 1)
   * - limit?: number (défaut: 20, max: 100)
   * - sortBy?: string (défaut: 'jour_semaine')
   * - sortOrder?: 'ASC' | 'DESC' (défaut: 'ASC')
   *
   * Réponse 200:
   * {
   *   success: true,
   *   data: {
   *     coursRecurrents: [...],
   *     pagination: {
   *       page: number,
   *       limit: number,
   *       total: number,
   *       totalPages: number
   *     }
   *   }
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "Le numéro de page doit être supérieur ou égal à 1",
   *   code: "INVALID_PAGE"
   * }
   *
   * Réponse 403:
   * {
   *   success: false,
   *   error: "Seuls les administrateurs peuvent accéder à cette ressource",
   *   code: "INSUFFICIENT_PERMISSIONS"
   * }
   */
  router.get(
    '/',
    // authMiddleware, // À décommenter
    // requireAdminMiddleware, // À décommenter
    asyncHandler(coursRecurrentController.getAll.bind(coursRecurrentController))
  );

  /**
   * POST /cours-recurrents
   * Crée un nouveau cours récurrent
   * Requiert: Authentification + Rôle Admin
   *
   * Body:
   * {
   *   jour_semaine: number (1-7, 1=lundi, 7=dimanche),
   *   heure_debut: string (format HH:MM),
   *   heure_fin: string (format HH:MM),
   *   niveau: string (ex: "Débutant", "Intermédiaire", "Avancé"),
   *   capacite_max?: number,
   *   lieu?: string,
   *   description?: string,
   *   professeur_id?: number
   * }
   *
   * Réponse 201:
   * {
   *   success: true,
   *   message: "Cours récurrent créé avec succès",
   *   data: {
   *     id: number,
   *     jour_semaine: number,
   *     heure_debut: string,
   *     heure_fin: string,
   *     niveau: string,
   *     capacite_max: number,
   *     lieu: string,
   *     description: string,
   *     professeur_id: number,
   *     actif: boolean,
   *     ...
   *   }
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "Les champs jour_semaine, heure_debut, heure_fin et niveau sont obligatoires",
   *   code: "MISSING_REQUIRED_FIELDS"
   * }
   *
   * Réponse 403:
   * {
   *   success: false,
   *   error: "Seuls les administrateurs peuvent créer des cours récurrents",
   *   code: "INSUFFICIENT_PERMISSIONS"
   * }
   */
  router.post(
    '/',
    // authMiddleware, // À décommenter
    // requireAdminMiddleware, // À décommenter
    asyncHandler(coursRecurrentController.create.bind(coursRecurrentController))
  );

  /**
   * PUT /cours-recurrents/:id
   * Met à jour un cours récurrent existant
   * Requiert: Authentification + Rôle Admin
   *
   * Params:
   * - id: number (ID du cours récurrent)
   *
   * Body (tous les champs sont optionnels):
   * {
   *   jour_semaine?: number (1-7),
   *   heure_debut?: string (format HH:MM),
   *   heure_fin?: string (format HH:MM),
   *   niveau?: string,
   *   capacite_max?: number,
   *   lieu?: string,
   *   description?: string,
   *   professeur_id?: number
   * }
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Cours récurrent mis à jour avec succès",
   *   data: {
   *     id: number,
   *     jour_semaine: number,
   *     heure_debut: string,
   *     heure_fin: string,
   *     niveau: string,
   *     ...
   *   }
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "L'ID du cours récurrent doit être un nombre positif valide",
   *   code: "INVALID_COURS_RECURRENT_ID"
   * }
   *
   * Réponse 403:
   * {
   *   success: false,
   *   error: "Seuls les administrateurs peuvent modifier des cours récurrents",
   *   code: "INSUFFICIENT_PERMISSIONS"
   * }
   *
   * Réponse 404:
   * {
   *   success: false,
   *   error: "Le cours récurrent avec l'identifiant \"123\" n'existe pas",
   *   code: "COURS_RECURRENT_NOT_FOUND"
   * }
   */
  router.put(
    '/:id',
    // authMiddleware, // À décommenter
    // requireAdminMiddleware, // À décommenter
    asyncHandler(coursRecurrentController.update.bind(coursRecurrentController))
  );

  /**
   * PATCH /cours-recurrents/:id/activate
   * Active un cours récurrent (le rend disponible pour la génération automatique de cours)
   * Requiert: Authentification + Rôle Admin
   *
   * Params:
   * - id: number (ID du cours récurrent)
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Cours récurrent activé avec succès",
   *   data: {
   *     id: number,
   *     actif: true
   *   }
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "L'ID du cours récurrent doit être un nombre positif valide",
   *   code: "INVALID_COURS_RECURRENT_ID"
   * }
   *
   * Réponse 403:
   * {
   *   success: false,
   *   error: "Seuls les administrateurs peuvent activer des cours récurrents",
   *   code: "INSUFFICIENT_PERMISSIONS"
   * }
   *
   * Réponse 404:
   * {
   *   success: false,
   *   error: "Le cours récurrent avec l'identifiant \"123\" n'existe pas",
   *   code: "COURS_RECURRENT_NOT_FOUND"
   * }
   */
  router.patch(
    '/:id/activate',
    // authMiddleware, // À décommenter
    // requireAdminMiddleware, // À décommenter
    asyncHandler(coursRecurrentController.activate.bind(coursRecurrentController))
  );

  /**
   * PATCH /cours-recurrents/:id/deactivate
   * Désactive un cours récurrent (ne sera plus généré automatiquement)
   * Requiert: Authentification + Rôle Admin
   *
   * Note: Désactiver un cours récurrent n'affecte pas les cours déjà créés,
   * cela empêche seulement la création de nouveaux cours basés sur ce modèle.
   *
   * Params:
   * - id: number (ID du cours récurrent)
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Cours récurrent désactivé avec succès",
   *   data: {
   *     id: number,
   *     actif: false
   *   }
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "L'ID du cours récurrent doit être un nombre positif valide",
   *   code: "INVALID_COURS_RECURRENT_ID"
   * }
   *
   * Réponse 403:
   * {
   *   success: false,
   *   error: "Seuls les administrateurs peuvent désactiver des cours récurrents",
   *   code: "INSUFFICIENT_PERMISSIONS"
   * }
   *
   * Réponse 404:
   * {
   *   success: false,
   *   error: "Le cours récurrent avec l'identifiant \"123\" n'existe pas",
   *   code: "COURS_RECURRENT_NOT_FOUND"
   * }
   */
  router.patch(
    '/:id/deactivate',
    // authMiddleware, // À décommenter
    // requireAdminMiddleware, // À décommenter
    asyncHandler(coursRecurrentController.deactivate.bind(coursRecurrentController))
  );

  return router;
}

/**
 * Export par défaut pour une utilisation simple
 *
 * Exemple d'utilisation avec injection de dépendances:
 *
 * ```typescript
 * import { createCoursRecurrentsRoutes } from './routes/cours-recurrents.routes.js';
 * import { createCoursRecurrentController } from './controllers/CoursRecurrentController.js';
 *
 * // Créer les use cases (quand ils seront implémentés)
 * const getAllCoursRecurrentsUseCase = new GetAllCoursRecurrentsUseCase(...);
 * const getActiveCoursRecurrentsUseCase = new GetActiveCoursRecurrentsUseCase(...);
 * const createCoursRecurrentUseCase = new CreateCoursRecurrentUseCase(...);
 * const updateCoursRecurrentUseCase = new UpdateCoursRecurrentUseCase(...);
 * const activateCoursRecurrentUseCase = new ActivateCoursRecurrentUseCase(...);
 * const deactivateCoursRecurrentUseCase = new DeactivateCoursRecurrentUseCase(...);
 *
 * // Créer le controller
 * const coursRecurrentController = createCoursRecurrentController(
 *   getAllCoursRecurrentsUseCase,
 *   getActiveCoursRecurrentsUseCase,
 *   createCoursRecurrentUseCase,
 *   updateCoursRecurrentUseCase,
 *   activateCoursRecurrentUseCase,
 *   deactivateCoursRecurrentUseCase
 * );
 *
 * // Créer les routes
 * const coursRecurrentsRoutes = createCoursRecurrentsRoutes(coursRecurrentController);
 *
 * // Monter les routes dans l'application
 * app.use('/api/cours-recurrents', coursRecurrentsRoutes);
 * ```
 *
 * Note importante sur l'ordre des routes:
 * La route '/actifs' DOIT être déclarée AVANT la route '/:id'
 * sinon Express interprétera 'actifs' comme un paramètre ID.
 */
export default createCoursRecurrentsRoutes;
