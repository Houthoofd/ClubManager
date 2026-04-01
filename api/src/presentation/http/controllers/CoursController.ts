import { Request, Response, NextFunction } from "express";
import {
  CreateCoursUseCase,
  GetCoursUseCase,
  GetCoursForParticipantUseCase,
  GetCoursParSemaineUseCase,
  GetAllCoursParSemaineUseCase,
  CreateInscriptionUseCase,
  AnnulerInscriptionUseCase,
  MarquerPresenceUseCase,
} from "../../../core/use-cases/cours/index.js";
import { UserRole } from "../../../core/domain/entities/User.js";

/**
 * CoursController
 *
 * Responsabilités :
 * - Recevoir les requêtes HTTP pour le module Cours
 * - Valider les données d'entrée (validation basique)
 * - Appeler les use cases appropriés
 * - Transformer les réponses pour l'API
 * - Gérer les erreurs et retourner les codes HTTP appropriés
 *
 * Ce controller ne contient PAS de logique métier.
 * Toute la logique est déléguée aux use cases.
 */
export class CoursController {
  constructor(
    private readonly createCoursUseCase: CreateCoursUseCase,
    private readonly getCoursUseCase: GetCoursUseCase,
    private readonly getCoursForParticipantUseCase: GetCoursForParticipantUseCase,
    private readonly getCoursParSemaineUseCase: GetCoursParSemaineUseCase,
    private readonly getAllCoursParSemaineUseCase: GetAllCoursParSemaineUseCase,
    private readonly createInscriptionUseCase: CreateInscriptionUseCase,
    private readonly annulerInscriptionUseCase: AnnulerInscriptionUseCase,
    private readonly marquerPresenceUseCase: MarquerPresenceUseCase,
  ) {}

  /**
   * GET /cours/:id
   * Récupère un cours par son ID avec ses informations complètes
   */
  async getCours(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Extraire l'ID des paramètres
      const coursId = parseInt(req.params.id, 10);

      // 2. Validation basique
      if (isNaN(coursId) || coursId <= 0) {
        res.status(400).json({
          success: false,
          error: "L'ID du cours doit être un nombre positif valide",
          code: "INVALID_COURS_ID",
        });
        return;
      }

      // 3. Appeler le use case
      const cours = await this.getCoursUseCase.execute({ coursId });

      // 4. Retourner la réponse
      res.status(200).json({
        success: true,
        data: cours.toObject(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /cours/me
   * Récupère tous les cours de l'utilisateur connecté (inscriptions)
   * Requiert : Authentification
   */
  async getMesCours(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Récupérer l'ID de l'utilisateur connecté
      const userId = this.getCurrentUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Utilisateur non authentifié",
          code: "NOT_AUTHENTICATED",
        });
        return;
      }

      // 2. Appeler le use case
      const coursList = await this.getCoursForParticipantUseCase.execute({
        participantId: userId,
      });

      // 3. Retourner la réponse
      res.status(200).json({
        success: true,
        data: {
          cours: coursList.map((cours) => cours.toObject()),
          total: coursList.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /cours/semaine/:weekNumber
   * Récupère tous les cours d'une semaine donnée
   *
   * Query params optionnels :
   * - year: number (année, défaut: année courante)
   */
  async getCoursParSemaine(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Extraire les paramètres
      const weekNumber = parseInt(req.params.weekNumber, 10);
      const year = req.query.year
        ? parseInt(req.query.year as string, 10)
        : new Date().getFullYear();

      // 2. Validation basique
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 53) {
        res.status(400).json({
          success: false,
          error: "Le numéro de semaine doit être entre 1 et 53",
          code: "INVALID_WEEK_NUMBER",
        });
        return;
      }

      if (isNaN(year) || year < 2000 || year > 2100) {
        res.status(400).json({
          success: false,
          error: "L'année doit être une valeur valide",
          code: "INVALID_YEAR",
        });
        return;
      }

      // 3. Appeler le use case GetAllCoursParSemaine (planning général)
      const coursList = await this.getAllCoursParSemaineUseCase.execute({
        weekNumber,
        year,
      });

      // 4. Retourner la réponse
      res.status(200).json({
        success: true,
        data: {
          weekNumber,
          year, // Note: Le use case n'utilise pas encore year
          cours: coursList.map((cours) => cours.toObject()),
          total: coursList.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /cours
   * Crée un nouveau cours
   * Requiert : Authentification + Rôle Admin
   */
  async createCours(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Vérifier les permissions (admin only)
      if (!this.isAdmin(req)) {
        res.status(403).json({
          success: false,
          error: "Seuls les administrateurs peuvent créer des cours",
          code: "INSUFFICIENT_PERMISSIONS",
        });
        return;
      }

      // 2. Extraire les données de la requête
      const {
        date_cours,
        type_cours,
        heure_debut,
        heure_fin,
        cours_recurrent_id,
      } = req.body;

      // 3. Validation basique
      if (
        !date_cours ||
        !type_cours ||
        !heure_debut ||
        !heure_fin ||
        !cours_recurrent_id
      ) {
        res.status(400).json({
          success: false,
          error:
            "Les champs date_cours, type_cours, heure_debut, heure_fin et cours_recurrent_id sont obligatoires",
          code: "MISSING_REQUIRED_FIELDS",
        });
        return;
      }

      // 4. Appeler le use case
      const cours = await this.createCoursUseCase.execute({
        date_cours: new Date(date_cours),
        type_cours,
        heure_debut,
        heure_fin,
        cours_recurrent_id: parseInt(cours_recurrent_id, 10),
      });

      // 5. Retourner la réponse
      res.status(201).json({
        success: true,
        message: "Cours créé avec succès",
        data: cours.toObject(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /cours/:id/inscription
   * Inscrit l'utilisateur connecté à un cours
   * Requiert : Authentification
   */
  async inscrire(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Récupérer l'utilisateur connecté
      const userId = this.getCurrentUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Utilisateur non authentifié",
          code: "NOT_AUTHENTICATED",
        });
        return;
      }

      // 2. Extraire l'ID du cours
      const coursId = parseInt(req.params.id, 10);

      // 3. Validation basique
      if (isNaN(coursId) || coursId <= 0) {
        res.status(400).json({
          success: false,
          error: "L'ID du cours doit être un nombre positif valide",
          code: "INVALID_COURS_ID",
        });
        return;
      }

      // 4. Extraire les données optionnelles
      const { notes } = req.body;

      // 5. Appeler le use case
      const inscription = await this.createInscriptionUseCase.execute({
        coursId,
        utilisateurId: userId,
      });

      // 6. Retourner la réponse
      res.status(201).json({
        success: true,
        message: "Inscription au cours réussie",
        data: inscription.toObject(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /cours/inscription/:inscriptionId
   * Annule l'inscription d'un utilisateur à un cours
   * Requiert : Authentification
   *
   * Permissions :
   * - L'utilisateur peut annuler sa propre inscription
   * - Les admins peuvent annuler n'importe quelle inscription
   */
  async annulerInscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Récupérer l'utilisateur connecté
      const userId = this.getCurrentUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Utilisateur non authentifié",
          code: "NOT_AUTHENTICATED",
        });
        return;
      }

      // 2. Extraire l'ID de l'inscription
      const inscriptionId = parseInt(req.params.inscriptionId, 10);

      // 3. Validation basique
      if (isNaN(inscriptionId) || inscriptionId <= 0) {
        res.status(400).json({
          success: false,
          error: "L'ID de l'inscription doit être un nombre positif valide",
          code: "INVALID_INSCRIPTION_ID",
        });
        return;
      }

      // 4. Extraire le motif optionnel
      const { motif } = req.body;

      // 5. Appeler le use case
      await this.annulerInscriptionUseCase.execute({
        inscriptionId,
        utilisateurId: userId,
      });

      // 6. Retourner la réponse
      res.status(200).json({
        success: true,
        message: "Inscription annulée avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /cours/inscription/:inscriptionId/presence
   * Marque la présence d'un participant à un cours
   * Requiert : Authentification + Rôle Professeur ou Admin
   */
  async marquerPresence(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Vérifier les permissions (professeur ou admin)
      if (!this.isProfesseurOrAdmin(req)) {
        res.status(403).json({
          success: false,
          error:
            "Seuls les professeurs et administrateurs peuvent marquer les présences",
          code: "INSUFFICIENT_PERMISSIONS",
        });
        return;
      }

      // 2. Extraire l'ID de l'inscription
      const inscriptionId = parseInt(req.params.inscriptionId, 10);

      // 3. Validation basique
      if (isNaN(inscriptionId) || inscriptionId <= 0) {
        res.status(400).json({
          success: false,
          error: "L'ID de l'inscription doit être un nombre positif valide",
          code: "INVALID_INSCRIPTION_ID",
        });
        return;
      }

      // 4. Extraire le statut de présence
      const { present } = req.body;

      if (typeof present !== "boolean") {
        res.status(400).json({
          success: false,
          error: "Le champ present (boolean) est obligatoire",
          code: "MISSING_REQUIRED_FIELD",
        });
        return;
      }

      // 5. Récupérer l'ID du professeur
      const professeurId = this.getCurrentUserId(req);

      if (!professeurId) {
        res.status(401).json({
          success: false,
          error: "Utilisateur non authentifié",
          code: "NOT_AUTHENTICATED",
        });
        return;
      }

      // 6. Appeler le use case
      const inscription = await this.marquerPresenceUseCase.execute({
        inscriptionId,
        isPresent: present,
      });

      // 7. Retourner la réponse
      res.status(200).json({
        success: true,
        message: `Présence ${present ? "marquée" : "retirée"} avec succès`,
        data: inscription.toObject(),
      });
    } catch (error) {
      next(error);
    }
  }

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Récupère l'ID de l'utilisateur connecté depuis le token JWT
   */
  private getCurrentUserId(req: Request): number | null {
    // Note: Dans un cas réel, ceci serait extrait du token JWT via un middleware
    const user = (req as any).user;
    return user?.id || null;
  }

  /**
   * Vérifie si l'utilisateur connecté est administrateur
   */
  private isAdmin(req: Request): boolean {
    const user = (req as any).user;
    return user?.role === UserRole.ADMIN;
  }

  /**
   * Vérifie si l'utilisateur connecté est professeur ou admin
   */
  private isProfesseurOrAdmin(req: Request): boolean {
    const user = (req as any).user;
    return user?.role === UserRole.PROFESSEUR || user?.role === UserRole.ADMIN;
  }
}

/**
 * Fonction factory pour créer une instance du controller avec les dépendances
 * Cette fonction sera utilisée lors de la configuration de l'injection de dépendances
 */
export function createCoursController(
  createCoursUseCase: CreateCoursUseCase,
  getCoursUseCase: GetCoursUseCase,
  getCoursForParticipantUseCase: GetCoursForParticipantUseCase,
  getCoursParSemaineUseCase: GetCoursParSemaineUseCase,
  getAllCoursParSemaineUseCase: GetAllCoursParSemaineUseCase,
  createInscriptionUseCase: CreateInscriptionUseCase,
  annulerInscriptionUseCase: AnnulerInscriptionUseCase,
  marquerPresenceUseCase: MarquerPresenceUseCase,
): CoursController {
  return new CoursController(
    createCoursUseCase,
    getCoursUseCase,
    getCoursForParticipantUseCase,
    getCoursParSemaineUseCase,
    getAllCoursParSemaineUseCase,
    createInscriptionUseCase,
    annulerInscriptionUseCase,
    marquerPresenceUseCase,
  );
}
