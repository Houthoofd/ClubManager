import { gql } from 'graphql-tag';

/**
 * Types GraphQL pour le module Auth
 * Définit le schéma GraphQL pour l'authentification et la gestion des comptes
 */

export const authTypeDefs = gql`
  # ==========================================
  # TYPES
  # ==========================================

  """
  Résultat d'une authentification réussie
  """
  type AuthPayload {
    """Token JWT pour l'authentification"""
    token: String!

    """Informations de l'utilisateur authentifié"""
    user: AuthUser!

    """Date d'expiration du token"""
    expiresAt: DateTime!

    """Type de token (généralement 'Bearer')"""
    tokenType: String!
  }

  """
  Informations utilisateur pour l'authentification
  """
  type AuthUser {
    id: Int!
    firstName: String!
    lastName: String!
    fullName: String!
    email: String!
    statusId: Int!
    gradeId: Int
    dateInscription: DateTime
  }

  """
  Résultat d'une opération réussie (générique)
  """
  type SuccessResult {
    success: Boolean!
    message: String!
  }

  """
  Informations de sécurité d'un utilisateur
  """
  type SecurityInfo {
    """ID de l'utilisateur"""
    id: Int!

    """Email de l'utilisateur"""
    email: String!

    """Nom de famille"""
    lastName: String!

    """Prénom"""
    firstName: String!

    """Date de naissance (optionnelle)"""
    dateOfBirth: DateTime

    """Date d'inscription"""
    dateInscription: DateTime

    """Nombre de paiements effectués"""
    nbPaiements: Int!

    """Nombre d'inscriptions"""
    nbInscriptions: Int!

    """Date du dernier paiement"""
    dernierPaiement: DateTime
  }

  """
  Résultat de validation de mot de passe
  """
  type PasswordValidation {
    """Indique si le mot de passe est valide"""
    valid: Boolean!

    """Liste des erreurs de validation"""
    errors: [String!]!

    """Score de force du mot de passe (0-100)"""
    strength: Int
  }

  """
  Token de récupération de mot de passe
  """
  type PasswordResetToken {
    """Token généré"""
    token: String!

    """Date d'expiration du token"""
    expiresAt: DateTime!

    """Email masqué de l'utilisateur"""
    maskedEmail: String!
  }

  """
  Statistiques de sécurité
  """
  type SecurityStats {
    """Nombre de tentatives de connexion récentes"""
    recentLoginAttempts: Int!

    """Nombre de tentatives de récupération récentes"""
    recentRecoveryAttempts: Int!

    """Indique si le compte est temporairement bloqué"""
    isBlocked: Boolean!

    """Temps restant avant déblocage (en minutes)"""
    blockedUntilMinutes: Int
  }

  """
  Résultat de création de compte
  """
  type CreateAccountResult {
    success: Boolean!
    message: String!
    userId: Int
  }

  # ==========================================
  # INPUTS
  # ==========================================

  """
  Données pour l'authentification
  """
  input LoginInput {
    """Email de l'utilisateur"""
    email: String!

    """Mot de passe"""
    password: String!

    """Se souvenir de moi (token longue durée)"""
    rememberMe: Boolean
  }

  """
  Données pour la création de compte
  """
  input CreateAccountInput {
    """Prénom"""
    firstName: String!

    """Nom de famille"""
    lastName: String!

    """Email (unique)"""
    email: String!

    """Mot de passe (minimum 8 caractères)"""
    password: String!

    """Confirmation du mot de passe"""
    passwordConfirm: String!

    """Date de naissance"""
    dateOfBirth: DateTime

    """Genre ID"""
    genderId: Int
  }

  """
  Données pour la modification de mot de passe
  """
  input ChangePasswordInput {
    """Ancien mot de passe (pour vérification)"""
    oldPassword: String!

    """Nouveau mot de passe"""
    newPassword: String!

    """Confirmation du nouveau mot de passe"""
    newPasswordConfirm: String!
  }

  """
  Données pour la demande de récupération de mot de passe
  """
  input RequestPasswordResetInput {
    """Email de l'utilisateur"""
    email: String!
  }

  """
  Données pour la réinitialisation de mot de passe
  """
  input ResetPasswordInput {
    """Token de récupération"""
    token: String!

    """Nouveau mot de passe"""
    newPassword: String!

    """Confirmation du nouveau mot de passe"""
    newPasswordConfirm: String!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    """
    Récupère l'utilisateur actuellement authentifié
    Nécessite une authentification
    """
    me: AuthUser!

    """
    Vérifie si un email existe déjà dans le système
    """
    emailExists(email: String!): Boolean!

    """
    Valide un mot de passe selon les règles de sécurité
    """
    validatePassword(password: String!): PasswordValidation!

    """
    Récupère les informations de sécurité d'un utilisateur
    Nécessite une authentification
    """
    securityInfo(userId: Int!): SecurityInfo!

    """
    Récupère les statistiques de sécurité pour un email
    Utile pour vérifier les blocages avant tentative de connexion
    """
    securityStats(email: String!): SecurityStats!

    """
    Vérifie la validité d'un token de récupération
    """
    verifyResetToken(token: String!): Boolean!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    """
    Authentifie un utilisateur avec email et mot de passe
    Retourne un token JWT et les informations utilisateur
    """
    login(input: LoginInput!): AuthPayload!

    """
    Déconnecte l'utilisateur actuel
    Invalide le token JWT (côté client)
    """
    logout: SuccessResult!

    """
    Crée un nouveau compte utilisateur
    Valide l'email, le mot de passe et crée le compte
    """
    createAccount(input: CreateAccountInput!): CreateAccountResult!

    """
    Modifie le mot de passe de l'utilisateur authentifié
    Nécessite l'ancien mot de passe pour vérification
    """
    changePassword(input: ChangePasswordInput!): SuccessResult!

    """
    Demande la récupération de mot de passe
    Envoie un email avec un token de réinitialisation
    """
    requestPasswordReset(input: RequestPasswordResetInput!): SuccessResult!

    """
    Réinitialise le mot de passe avec un token valide
    """
    resetPassword(input: ResetPasswordInput!): SuccessResult!

    """
    Rafraîchit le token JWT actuel
    Nécessite une authentification
    """
    refreshToken: AuthPayload!

    """
    Nettoie les tokens expirés et les anciennes tentatives
    Nécessite des droits administrateur
    """
    cleanupSecurityData(daysToKeep: Int): SuccessResult!
  }
`;
