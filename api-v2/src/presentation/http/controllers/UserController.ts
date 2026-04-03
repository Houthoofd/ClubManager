import { Request, Response, NextFunction } from 'express';
import { CreateUserUseCase } from '../../../core/use-cases/users/CreateUser.usecase.js';
import { GetUserUseCase } from '../../../core/use-cases/users/GetUser.usecase.js';
import { UpdateUserUseCase } from '../../../core/use-cases/users/UpdateUser.usecase.js';
import { DomainError } from '../../../core/domain/errors/DomainError.js';
import { UserRole } from '../../../core/domain/entities/User.js';

/**
 * UserController
 *
 * Responsabilités :
 * - Recevoir les requêtes HTTP
 * - Valider les données d'entrée (validation basique)
 * - Appeler les use cases appropriés
 * - Transformer les réponses pour l'API
 * - Gérer les erreurs et retourner les codes HTTP appropriés
 *
 * Ce controller ne contient PAS de logique métier.
 * Toute la logique est déléguée aux use cases.
 */
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase
  ) {}

  /**
   * POST /users
   * Crée un nouvel utilisateur
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Extraire les données de la requête
      const {
        email,
        password,
        nom,
        prenom,
        telephone,
        dateNaissance,
        adresse,
        codePostal,
        ville,
        role,
        requireParentalConsent,
      } = req.body;

      // 2. Validation basique (les validations métier sont dans le use case)
      if (!email || !password || !nom || !prenom) {
        res.status(400).json({
          success: false,
          error: 'Les champs email, password, nom et prenom sont obligatoires',
          code: 'MISSING_REQUIRED_FIELDS',
        });
        return;
      }

      // 3. Appeler le use case
      const result = await this.createUserUseCase.execute({
        email,
        password,
        nom,
        prenom,
        telephone,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : undefined,
        adresse,
        codePostal,
        ville,
        role: role as UserRole,
        requireParentalConsent,
      });

      // 4. Retourner la réponse (sans le mot de passe)
      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: {
          user: result.user.toPublicObject(),
          verificationToken: result.verificationToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/:id
   * Récupère un utilisateur par son ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Extraire l'ID des paramètres
      const userId = parseInt(req.params.id, 10);

      // 2. Validation basique
      if (isNaN(userId) || userId <= 0) {
        res.status(400).json({
          success: false,
          error: 'L\'ID utilisateur doit être un nombre positif valide',
          code: 'INVALID_USER_ID',
        });
        return;
      }

      // 3. Appeler le use case
      const user = await this.getUserUseCase.execute({ userId });

      // 4. Déterminer quelles informations retourner selon l'utilisateur connecté
      // Note: Dans un cas réel, on vérifierait les permissions
      const isOwnProfile = this.isOwnProfile(req, userId);
      const isAdmin = this.isAdmin(req);

      const userData = isOwnProfile || isAdmin ? user.toObject() : user.toPublicObject();

      // Ne jamais retourner le hash du mot de passe
      delete userData.passwordHash;

      // 5. Retourner la réponse
      res.status(200).json({
        success: true,
        data: userData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users
   * Liste tous les utilisateurs avec pagination
   */
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Extraire les paramètres de pagination
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const sortBy = (req.query.sortBy as string) || 'created_at';
      const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';

      // 2. Validation basique
      if (page < 1) {
        res.status(400).json({
          success: false,
          error: 'Le numéro de page doit être supérieur ou égal à 1',
          code: 'INVALID_PAGE',
        });
        return;
      }

      if (limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          error: 'La limite doit être entre 1 et 100',
          code: 'INVALID_LIMIT',
        });
        return;
      }

      // 3. Note: Un use case ListUsers devrait être créé pour cette fonctionnalité
      // Pour l'instant, on retourne une réponse vide
      res.status(200).json({
        success: true,
        message: 'Fonctionnalité de listage à implémenter via un use case dédié',
        data: {
          users: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /users/:id
   * Met à jour un utilisateur
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Extraire l'ID des paramètres
      const userId = parseInt(req.params.id, 10);

      // 2. Validation basique
      if (isNaN(userId) || userId <= 0) {
        res.status(400).json({
          success: false,
          error: 'L\'ID utilisateur doit être un nombre positif valide',
          code: 'INVALID_USER_ID',
        });
        return;
      }

      // 3. Vérifier les permissions (l'utilisateur ne peut modifier que son propre profil)
      // Sauf s'il est admin
      if (!this.isOwnProfile(req, userId) && !this.isAdmin(req)) {
        res.status(403).json({
          success: false,
          error: 'Vous n\'avez pas les permissions pour modifier ce profil',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      // 4. Extraire les données de mise à jour
      const {
        nom,
        prenom,
        telephone,
        dateNaissance,
        adresse,
        codePostal,
        ville,
        photoUrl,
      } = req.body;

      // 5. Appeler le use case
      const updatedUser = await this.updateUserUseCase.execute({
        userId,
        nom,
        prenom,
        telephone,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : undefined,
        adresse,
        codePostal,
        ville,
        photoUrl,
      });

      // 6. Retourner la réponse
      const userData = updatedUser.toObject();
      delete userData.passwordHash;

      res.status(200).json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        data: userData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /users/:id/activate
   * Active un compte utilisateur
   */
  async activateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Extraire l'ID
      const userId = parseInt(req.params.id, 10);

      // 2. Validation
      if (isNaN(userId) || userId <= 0) {
        res.status(400).json({
          success: false,
          error: 'L\'ID utilisateur doit être un nombre positif valide',
          code: 'INVALID_USER_ID',
        });
        return;
      }

      // 3. Note: Un use case ActivateUser devrait être créé
      // Pour l'instant, retourner un message
      res.status(200).json({
        success: true,
        message: 'Fonctionnalité d\'activation à implémenter via un use case dédié',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /users/:id
   * Supprime un utilisateur (soft delete)
   */
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Extraire l'ID
      const userId = parseInt(req.params.id, 10);

      // 2. Validation
      if (isNaN(userId) || userId <= 0) {
        res.status(400).json({
          success: false,
          error: 'L\'ID utilisateur doit être un nombre positif valide',
          code: 'INVALID_USER_ID',
        });
        return;
      }

      // 3. Vérifier les permissions (seul un admin peut supprimer)
      if (!this.isAdmin(req)) {
        res.status(403).json({
          success: false,
          error: 'Seuls les administrateurs peuvent supprimer des utilisateurs',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      // 4. Note: Un use case DeleteUser devrait être créé
      res.status(200).json({
        success: true,
        message: 'Fonctionnalité de suppression à implémenter via un use case dédié',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/search
   * Recherche des utilisateurs
   */
  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Extraire le terme de recherche
      const searchTerm = req.query.q as string;

      // 2. Validation
      if (!searchTerm || searchTerm.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Un terme de recherche est requis',
          code: 'MISSING_SEARCH_TERM',
        });
        return;
      }

      if (searchTerm.length < 2) {
        res.status(400).json({
          success: false,
          error: 'Le terme de recherche doit contenir au moins 2 caractères',
          code: 'SEARCH_TERM_TOO_SHORT',
        });
        return;
      }

      // 3. Pagination
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      // 4. Note: Un use case SearchUsers devrait être créé
      res.status(200).json({
        success: true,
        message: 'Fonctionnalité de recherche à implémenter via un use case dédié',
        data: {
          users: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/me
   * Récupère le profil de l'utilisateur connecté
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Récupérer l'ID depuis le token JWT (dans req.user)
      const userId = this.getCurrentUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      // 2. Appeler le use case
      const user = await this.getUserUseCase.execute({ userId });

      // 3. Retourner toutes les informations (c'est son propre profil)
      const userData = user.toObject();
      delete userData.passwordHash;

      res.status(200).json({
        success: true,
        data: userData,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Vérifie si l'utilisateur connecté consulte son propre profil
   */
  private isOwnProfile(req: Request, userId: number): boolean {
    // Note: Dans un cas réel, req.user serait ajouté par un middleware d'authentification
    const currentUserId = this.getCurrentUserId(req);
    return currentUserId === userId;
  }

  /**
   * Vérifie si l'utilisateur connecté est administrateur
   */
  private isAdmin(req: Request): boolean {
    // Note: Dans un cas réel, req.user.role serait ajouté par un middleware d'authentification
    const user = (req as any).user;
    return user?.role === UserRole.ADMIN;
  }

  /**
   * Récupère l'ID de l'utilisateur connecté
   */
  private getCurrentUserId(req: Request): number | null {
    // Note: Dans un cas réel, ceci serait extrait du token JWT
    const user = (req as any).user;
    return user?.id || null;
  }
}

/**
 * Fonction factory pour créer une instance du controller avec les dépendances
 * Cette fonction sera utilisée lors de la configuration de l'injection de dépendances
 */
export function createUserController(
  createUserUseCase: CreateUserUseCase,
  getUserUseCase: GetUserUseCase,
  updateUserUseCase: UpdateUserUseCase
): UserController {
  return new UserController(createUserUseCase, getUserUseCase, updateUserUseCase);
}
