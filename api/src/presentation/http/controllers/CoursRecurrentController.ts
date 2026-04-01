import { Request, Response, NextFunction } from "express";
import { UserRole } from "../../../core/domain/entities/User.js";
import {
  GetAllCoursRecurrentsUseCase,
  GetActiveCoursRecurrentsUseCase,
  CreateCoursRecurrentUseCase,
  UpdateCoursRecurrentUseCase,
  ActivateCoursRecurrentUseCase,
  DeactivateCoursRecurrentUseCase,
} from "../../../core/use-cases/cours-recurrents/index.js";

/**
 * CoursRecurrentController
 *
 * Responsabilités :
 * - Recevoir les requêtes HTTP pour la gestion des cours récurrents
 * - Valider les données d'entrée (validation basique)
 * - Appeler les use cases appropriés
 * - Transformer les réponses pour l'API
 * - Gérer les erreurs et retourner les codes HTTP appropriés
 *
 * Ce controller ne contient PAS de logique métier.
 * Toute la logique est déléguée aux use cases.
 */
export class CoursRecurrentController {
  constructor(
    private readonly getAllCoursRecurrentsUseCase: GetAllCoursRecurrentsUseCase,
    private readonly getActiveCoursRecurrentsUseCase: GetActiveCoursRecurrentsUseCase,
    private readonly createCoursRecurrentUseCase: CreateCoursRecurrentUseCase,
    private readonly updateCoursRecurrentUseCase: UpdateCoursRecurrentUseCase,
    private readonly activateCoursRecurrentUseCase: ActivateCoursRecurrentUseCase,
    private readonly deactivateCoursRecurrentUseCase: DeactivateCoursRecurrentUseCase,
  ) {}

  /**
   * GET /cours-recurrents
   * Récupère la liste de tous les cours récurrents avec pagination
   * Requiert : Authentification + Rôle Admin
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Vérifier les permissions (admin only)
      if (!this.isAdmin(req)) {
        res.status(403).json({
          success: false,
          error: "Seuls les administrateurs peuvent accéder à cette ressource",
          code: "INSUFFICIENT_PERMISSIONS",
        });
        return;
      }

      // 2. Extraire les paramètres de pagination
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const sortBy = (req.query.sortBy as string) || "jour_semaine";
      const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "ASC";

      // 3. Validation basique
      if (page < 1) {
        res.status(400).json({
          success: false,
          error: "Le numéro de page doit être supérieur ou égal à 1",
          code: "INVALID_PAGE",
        });
        return;
      }

      if (limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          error: "La limite doit être entre 1 et 100",
          code: "INVALID_LIMIT",
        });
        return;
      }

      // 4. Appeler le use case GetAllCoursRecurrentsUseCase
      const result = await this.getAllCoursRecurrentsUseCase.execute({
        page,
        limit,
        sortBy,
        sortOrder,
      });

      // 5. Retourner la réponse
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /cours-recurrents/actifs
   * Récupère uniquement les cours récurrents actifs
   * Requiert : Authentification + Rôle Admin
   */
  async getActive(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Vérifier les permissions (admin only)
      if (!this.isAdmin(req)) {
        res.status(403).json({
          success: false,
          error: "Seuls les administrateurs peuvent accéder à cette ressource",
          code: "INSUFFICIENT_PERMISSIONS",
        });
        return;
      }

      // 2. Extraire les paramètres de tri
      const sortBy = (req.query.sortBy as string) || "jour_semaine";
      const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "ASC";

      // 3. Appeler le use case GetActiveCoursRecurrentsUseCase
      const coursRecurrents =
        await this.getActiveCoursRecurrentsUseCase.execute({
          sortBy,
          sortOrder,
        });

      // 4. Retourner la réponse
      res.status(200).json({
        success: true,
        data: {
          coursRecurrents,
          total: coursRecurrents.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /cours-recurrents
   * Crée un nouveau cours récurrent
   * Requiert : Authentification + Rôle Admin
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Vérifier les permissions (admin only)
      if (!this.isAdmin(req)) {
        res.status(403).json({
          success: false,
          error: "Seuls les administrateurs peuvent créer des cours récurrents",
          code: "INSUFFICIENT_PERMISSIONS",
        });
        return;
      }

      // 2. Extraire les données de la requête
      const { type_cours, jour_semaine, heure_debut, heure_fin, professeurs } =
        req.body;

      // 3. Validation basique
      if (!type_cours || !jour_semaine || !heure_debut || !heure_fin) {
        res.status(400).json({
          success: false,
          error:
            "Les champs type_cours, jour_semaine, heure_debut et heure_fin sont obligatoires",
          code: "MISSING_REQUIRED_FIELDS",
        });
        return;
      }

      if (jour_semaine < 1 || jour_semaine > 7) {
        res.status(400).json({
          success: false,
          error:
            "Le jour de la semaine doit être entre 1 (lundi) et 7 (dimanche)",
          code: "INVALID_JOUR_SEMAINE",
        });
        return;
      }

      // 4. Appeler le use case CreateCoursRecurrentUseCase
      const coursRecurrent = await this.createCoursRecurrentUseCase.execute({
        type_cours,
        jour_semaine,
        heure_debut,
        heure_fin,
        professeurs,
      });

      // 5. Retourner la réponse
      res.status(201).json({
        success: true,
        data: {
          coursRecurrent,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /cours-recurrents/:id
   * Met à jour un cours récurrent existant
   * Requiert : Authentification + Rôle Admin
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Vérifier les permissions (admin only)
      if (!this.isAdmin(req)) {
        res.status(403).json({
          success: false,
          error:
            "Seuls les administrateurs peuvent modifier des cours récurrents",
          code: "INSUFFICIENT_PERMISSIONS",
        });
        return;
      }

      // 2. Extraire l'ID des paramètres
      const coursRecurrentId = parseInt(req.params.id, 10);

      // 3. Validation basique
      if (isNaN(coursRecurrentId) || coursRecurrentId <= 0) {
        res.status(400).json({
          success: false,
          error: "L'ID du cours récurrent doit être un nombre positif valide",
          code: "INVALID_COURS_RECURRENT_ID",
        });
        return;
      }

      // 4. Extraire les données de mise à jour
      const { type_cours, jour_semaine, heure_debut, heure_fin, professeurs } =
        req.body;

      // 5. Validation du jour de la semaine si fourni
      if (jour_semaine && (jour_semaine < 1 || jour_semaine > 7)) {
        res.status(400).json({
          success: false,
          error:
            "Le jour de la semaine doit être entre 1 (lundi) et 7 (dimanche)",
          code: "INVALID_JOUR_SEMAINE",
        });
        return;
      }

      // 6. Appeler le use case UpdateCoursRecurrentUseCase
      const coursRecurrent = await this.updateCoursRecurrentUseCase.execute({
        id: coursRecurrentId,
        type_cours,
        jour_semaine,
        heure_debut,
        heure_fin,
        professeurs,
      });

      // 7. Retourner la réponse
      res.status(200).json({
        success: true,
        data: {
          coursRecurrent,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /cours-recurrents/:id/activate
   * Active un cours récurrent (le rend disponible pour la génération de cours)
   * Requiert : Authentification + Rôle Admin
   */
  async activate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Vérifier les permissions (admin only)
      if (!this.isAdmin(req)) {
        res.status(403).json({
          success: false,
          error:
            "Seuls les administrateurs peuvent activer des cours récurrents",
          code: "INSUFFICIENT_PERMISSIONS",
        });
        return;
      }

      // 2. Extraire l'ID des paramètres
      const coursRecurrentId = parseInt(req.params.id, 10);

      // 3. Validation basique
      if (isNaN(coursRecurrentId) || coursRecurrentId <= 0) {
        res.status(400).json({
          success: false,
          error: "L'ID du cours récurrent doit être un nombre positif valide",
          code: "INVALID_COURS_RECURRENT_ID",
        });
        return;
      }

      // 4. Appeler le use case ActivateCoursRecurrentUseCase
      const coursRecurrent = await this.activateCoursRecurrentUseCase.execute({
        id: coursRecurrentId,
      });

      // 5. Retourner la réponse
      res.status(200).json({
        success: true,
        data: {
          coursRecurrent,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /cours-recurrents/:id/deactivate
   * Désactive un cours récurrent (ne sera plus généré automatiquement)
   * Requiert : Authentification + Rôle Admin
   */
  async deactivate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Vérifier les permissions (admin only)
      if (!this.isAdmin(req)) {
        res.status(403).json({
          success: false,
          error:
            "Seuls les administrateurs peuvent désactiver des cours récurrents",
          code: "INSUFFICIENT_PERMISSIONS",
        });
        return;
      }

      // 2. Extraire l'ID des paramètres
      const coursRecurrentId = parseInt(req.params.id, 10);

      // 3. Validation basique
      if (isNaN(coursRecurrentId) || coursRecurrentId <= 0) {
        res.status(400).json({
          success: false,
          error: "L'ID du cours récurrent doit être un nombre positif valide",
          code: "INVALID_COURS_RECURRENT_ID",
        });
        return;
      }

      // 4. Appeler le use case DeactivateCoursRecurrentUseCase
      const coursRecurrent = await this.deactivateCoursRecurrentUseCase.execute(
        {
          id: coursRecurrentId,
        },
      );

      // 5. Retourner la réponse
      res.status(200).json({
        success: true,
        data: {
          coursRecurrent,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Vérifie si l'utilisateur connecté est administrateur
   */
  private isAdmin(req: Request): boolean {
    const user = (req as any).user;
    return user?.role === UserRole.ADMIN;
  }
}

/**
 * Fonction factory pour créer une instance du controller avec les dépendances
 * Cette fonction sera utilisée lors de la configuration de l'injection de dépendances
 */
export function createCoursRecurrentController(
  getAllCoursRecurrentsUseCase: GetAllCoursRecurrentsUseCase,
  getActiveCoursRecurrentsUseCase: GetActiveCoursRecurrentsUseCase,
  createCoursRecurrentUseCase: CreateCoursRecurrentUseCase,
  updateCoursRecurrentUseCase: UpdateCoursRecurrentUseCase,
  activateCoursRecurrentUseCase: ActivateCoursRecurrentUseCase,
  deactivateCoursRecurrentUseCase: DeactivateCoursRecurrentUseCase,
): CoursRecurrentController {
  return new CoursRecurrentController(
    getAllCoursRecurrentsUseCase,
    getActiveCoursRecurrentsUseCase,
    createCoursRecurrentUseCase,
    updateCoursRecurrentUseCase,
    activateCoursRecurrentUseCase,
    deactivateCoursRecurrentUseCase,
  );
}
