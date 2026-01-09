/**
 * Resolvers GraphQL pour le module Auth
 * Utilise les services refactorisés pour implémenter la logique
 */

import { GraphQLError } from 'graphql';
import { generateToken, verifyToken } from '../../middleware/auth.js';
import { Auth } from '../../db/clients/auth/index.js';
import { AuthService } from '../../services/authService.js';
import { AuthUtils, ValidationUtils, StringUtils } from '../../db/clients/auth/utils.js';

// ==========================================
// INSTANCES
// ==========================================

const authClient = new Auth();
const authService = new AuthService();

// ==========================================
// HELPERS
// ==========================================

/**
 * Vérifie que l'utilisateur est authentifié
 */
const requireAuth = (context: any) => {
  if (!context.user) {
    throw new GraphQLError('Non authentifié', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
};

/**
 * Vérifie que l'utilisateur a un rôle spécifique
 */
const requireRole = (context: any, allowedRoles: string[]) => {
  const user = requireAuth(context);
  if (!allowedRoles.includes(user.role)) {
    throw new GraphQLError('Permissions insuffisantes', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
  return user;
};

/**
 * Génère un token JWT pour un utilisateur
 */
const generateAuthToken = (user: any, rememberMe: boolean = false) => {
  const expiresIn = rememberMe ? '30d' : '7d';
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.statusId
  }, expiresIn);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

  return {
    token,
    expiresAt,
    tokenType: 'Bearer'
  };
};

// ==========================================
// RESOLVERS
// ==========================================

export const authResolvers = {
  // ==========================================
  // QUERIES
  // ==========================================
  Query: {
    /**
     * Récupère l'utilisateur actuellement authentifié
     */
    me: async (_: any, __: any, context: any) => {
      const user = requireAuth(context);

      const userData = await authClient.rechercherUtilisateurParEmail(user.email);
      if (!userData) {
        throw new GraphQLError('Utilisateur non trouvé', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return {
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        fullName: `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        statusId: userData.status_id,
        gradeId: userData.grade_id || null,
        dateInscription: userData.date_inscription || null
      };
    },

    /**
     * Vérifie si un email existe déjà
     */
    emailExists: async (_: any, { email }: any) => {
      try {
        return await authClient.emailExiste(email);
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'email:', error);
        throw new GraphQLError('Erreur lors de la vérification de l\'email', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Valide un mot de passe selon les règles de sécurité
     */
    validatePassword: (_: any, { password }: any) => {
      const validation = ValidationUtils.validerMotDePasse(password);

      // Calcul du score de force (0-100)
      let strength = 0;
      if (password.length >= 8) strength += 20;
      if (password.length >= 12) strength += 10;
      if (/[A-Z]/.test(password)) strength += 20;
      if (/[a-z]/.test(password)) strength += 20;
      if (/[0-9]/.test(password)) strength += 15;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;

      return {
        valid: validation.valid,
        errors: validation.errors,
        strength: Math.min(strength, 100)
      };
    },

    /**
     * Récupère les informations de sécurité d'un utilisateur
     */
    securityInfo: async (_: any, { userId }: any, context: any) => {
      requireAuth(context);

      const info = await authClient.obtenirInformationsSecurite(userId);
      if (!info) {
        throw new GraphQLError('Utilisateur non trouvé', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return {
        id: info.id,
        email: info.email,
        lastName: info.last_name,
        firstName: info.first_name,
        dateOfBirth: info.date_of_birth || null,
        dateInscription: info.date_inscription || null,
        nbPaiements: info.nb_paiements || 0,
        nbInscriptions: info.nb_inscriptions || 0,
        dernierPaiement: info.dernier_paiement || null
      };
    },

    /**
     * Récupère les statistiques de sécurité pour un email
     */
    securityStats: async (_: any, { email }: any) => {
      try {
        const loginAttempts = await authClient.obtenirTentativesConnexionRecentes(email, 15);
        const recoveryAttempts = await authClient.verifierTentativesRecuperationRecentes(email, 15);

        const isBlocked = loginAttempts >= 5 || recoveryAttempts >= 3;
        const blockedUntilMinutes = isBlocked ? 15 : null;

        return {
          recentLoginAttempts: loginAttempts,
          recentRecoveryAttempts: recoveryAttempts,
          isBlocked,
          blockedUntilMinutes
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des stats de sécurité:', error);
        throw new GraphQLError('Erreur lors de la récupération des statistiques', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Vérifie la validité d'un token de récupération
     */
    verifyResetToken: async (_: any, { token }: any) => {
      try {
        const tokenData = await authClient.verifierTokenRecuperation(token);
        return tokenData !== null;
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        return false;
      }
    }
  },

  // ==========================================
  // MUTATIONS
  // ==========================================
  Mutation: {
    /**
     * Authentifie un utilisateur avec email et mot de passe
     */
    login: async (_: any, { input }: any) => {
      const { email, password, rememberMe } = input;

      // Normaliser l'email
      const normalizedEmail = AuthUtils.normaliserEmail(email);

      // Vérifier les tentatives récentes
      const attempts = await authClient.obtenirTentativesConnexionRecentes(normalizedEmail, 15);
      if (attempts >= 5) {
        throw new GraphQLError('Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.', {
          extensions: { code: 'TOO_MANY_ATTEMPTS' }
        });
      }

      // Authentifier
      const result = await authClient.authentifierUtilisateur(normalizedEmail, password);

      if (!result.success) {
        throw new GraphQLError(result.message || 'Authentification échouée', {
          extensions: { code: 'AUTHENTICATION_FAILED' }
        });
      }

      // Générer le token
      const authToken = generateAuthToken(result.user, rememberMe);

      return {
        token: authToken.token,
        user: {
          id: result.user.id,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          fullName: `${result.user.first_name} ${result.user.last_name}`,
          email: result.user.email,
          statusId: result.user.status_id || 1,
          gradeId: null,
          dateInscription: null
        },
        expiresAt: authToken.expiresAt,
        tokenType: authToken.tokenType
      };
    },

    /**
     * Déconnecte l'utilisateur actuel
     */
    logout: (_: any, __: any, context: any) => {
      requireAuth(context);

      // La déconnexion est gérée côté client (suppression du token)
      // Ici on peut ajouter une logique de blacklist si nécessaire

      return {
        success: true,
        message: 'Déconnexion réussie'
      };
    },

    /**
     * Crée un nouveau compte utilisateur
     */
    createAccount: async (_: any, { input }: any) => {
      const { firstName, lastName, email, password, passwordConfirm, dateOfBirth, genderId } = input;

      // Normaliser l'email
      const normalizedEmail = AuthUtils.normaliserEmail(email);

      // Vérifier que les mots de passe correspondent
      if (password !== passwordConfirm) {
        throw new GraphQLError('Les mots de passe ne correspondent pas', {
          extensions: { code: 'PASSWORDS_MISMATCH' }
        });
      }

      // Valider et hasher le mot de passe
      const validation = await authService.validerEtHasherMotDePasse(password);
      if (!validation.success) {
        throw new GraphQLError(validation.errors?.join(', ') || 'Mot de passe invalide', {
          extensions: { code: 'INVALID_PASSWORD', errors: validation.errors }
        });
      }

      // Créer le compte
      try {
        const result = await authService.creerCompteUtilisateur({
          first_name: firstName,
          last_name: lastName,
          email: normalizedEmail,
          password_hash: validation.hash!
        });

        if (!result.isConfirm) {
          throw new GraphQLError(result.message || 'Erreur lors de la création du compte', {
            extensions: { code: 'ACCOUNT_CREATION_FAILED' }
          });
        }

        // Récupérer l'utilisateur créé pour obtenir son ID
        const user = await authClient.rechercherUtilisateurParEmail(normalizedEmail);

        return {
          success: true,
          message: 'Compte créé avec succès',
          userId: user?.id || null
        };
      } catch (error: any) {
        console.error('Erreur lors de la création du compte:', error);
        throw new GraphQLError(error.message || 'Erreur lors de la création du compte', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Modifie le mot de passe de l'utilisateur authentifié
     */
    changePassword: async (_: any, { input }: any, context: any) => {
      const user = requireAuth(context);
      const { oldPassword, newPassword, newPasswordConfirm } = input;

      // Vérifier que les nouveaux mots de passe correspondent
      if (newPassword !== newPasswordConfirm) {
        throw new GraphQLError('Les nouveaux mots de passe ne correspondent pas', {
          extensions: { code: 'PASSWORDS_MISMATCH' }
        });
      }

      // Vérifier l'ancien mot de passe
      const authResult = await authClient.authentifierUtilisateur(user.email, oldPassword);
      if (!authResult.success) {
        throw new GraphQLError('Ancien mot de passe incorrect', {
          extensions: { code: 'INVALID_OLD_PASSWORD' }
        });
      }

      // Valider et hasher le nouveau mot de passe
      const validation = await authService.validerEtHasherMotDePasse(newPassword);
      if (!validation.success) {
        throw new GraphQLError(validation.errors?.join(', ') || 'Nouveau mot de passe invalide', {
          extensions: { code: 'INVALID_PASSWORD', errors: validation.errors }
        });
      }

      // Modifier le mot de passe
      const result = await authService.modifierMotDePasse(user.id, validation.hash!);

      if (!result.isConfirm) {
        throw new GraphQLError(result.message || 'Erreur lors de la modification du mot de passe', {
          extensions: { code: 'PASSWORD_CHANGE_FAILED' }
        });
      }

      return {
        success: true,
        message: 'Mot de passe modifié avec succès'
      };
    },

    /**
     * Demande la récupération de mot de passe
     */
    requestPasswordReset: async (_: any, { input }: any) => {
      const { email } = input;
      const normalizedEmail = AuthUtils.normaliserEmail(email);

      // Vérifier les tentatives récentes
      const attempts = await authClient.verifierTentativesRecuperationRecentes(normalizedEmail, 15);
      if (attempts >= 3) {
        throw new GraphQLError('Trop de tentatives de récupération. Veuillez réessayer dans 15 minutes.', {
          extensions: { code: 'TOO_MANY_ATTEMPTS' }
        });
      }

      // Rechercher l'utilisateur
      const user = await authClient.rechercherUtilisateurParEmail(normalizedEmail);

      // Pour des raisons de sécurité, toujours retourner un succès
      // même si l'utilisateur n'existe pas
      await authClient.enregistrerTentativeRecuperation(normalizedEmail, user !== null);

      if (!user) {
        return {
          success: true,
          message: 'Si cet email existe, un lien de récupération a été envoyé.'
        };
      }

      // Générer un token sécurisé
      const token = Auth.genererTokenSecurise(32);
      const expiresAt = AuthUtils.genererDateExpiration(1); // 1 heure

      // Créer le token en base
      await authService.creerTokenRecuperation(user.id, token, expiresAt);

      // TODO: Envoyer l'email avec le token
      // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      // await emailService.sendPasswordResetEmail(user.email, resetLink);

      return {
        success: true,
        message: 'Si cet email existe, un lien de récupération a été envoyé.'
      };
    },

    /**
     * Réinitialise le mot de passe avec un token valide
     */
    resetPassword: async (_: any, { input }: any) => {
      const { token, newPassword, newPasswordConfirm } = input;

      // Vérifier que les mots de passe correspondent
      if (newPassword !== newPasswordConfirm) {
        throw new GraphQLError('Les mots de passe ne correspondent pas', {
          extensions: { code: 'PASSWORDS_MISMATCH' }
        });
      }

      // Valider et hasher le nouveau mot de passe
      const validation = await authService.validerEtHasherMotDePasse(newPassword);
      if (!validation.success) {
        throw new GraphQLError(validation.errors?.join(', ') || 'Mot de passe invalide', {
          extensions: { code: 'INVALID_PASSWORD', errors: validation.errors }
        });
      }

      // Réinitialiser le mot de passe
      const result = await authService.reinitialiserMotDePasseAvecToken(token, validation.hash!);

      if (!result.isConfirm) {
        throw new GraphQLError(result.message || 'Token invalide ou expiré', {
          extensions: { code: 'INVALID_TOKEN' }
        });
      }

      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      };
    },

    /**
     * Rafraîchit le token JWT actuel
     */
    refreshToken: async (_: any, __: any, context: any) => {
      const user = requireAuth(context);

      // Récupérer les données utilisateur à jour
      const userData = await authClient.rechercherUtilisateurParEmail(user.email);
      if (!userData) {
        throw new GraphQLError('Utilisateur non trouvé', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Générer un nouveau token
      const authToken = generateAuthToken(userData, false);

      return {
        token: authToken.token,
        user: {
          id: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          fullName: `${userData.first_name} ${userData.last_name}`,
          email: userData.email,
          statusId: userData.status_id,
          gradeId: null,
          dateInscription: null
        },
        expiresAt: authToken.expiresAt,
        tokenType: authToken.tokenType
      };
    },

    /**
     * Nettoie les tokens expirés et les anciennes tentatives
     */
    cleanupSecurityData: async (_: any, { daysToKeep = 30 }: any, context: any) => {
      requireRole(context, ['admin', 'superadmin']);

      try {
        const result = await authService.nettoyageComplet(daysToKeep);

        return {
          success: true,
          message: `Nettoyage effectué: ${result.tokens.message}, ${result.tentatives.message}`
        };
      } catch (error: any) {
        console.error('Erreur lors du nettoyage:', error);
        throw new GraphQLError('Erreur lors du nettoyage des données', {
          extensions: { code: 'CLEANUP_FAILED' }
        });
      }
    }
  }
};
