/**
 * TypeDefs GraphQL pour le module Auth
 * Définit les types, queries et mutations pour l'authentification
 */

export const authTypeDefs = `
  # ============================================
  # TYPES DE BASE
  # ============================================

  """
  Utilisateur authentifié
  """
  type User {
    id: Int!
    email: String!
    first_name: String!
    last_name: String!
    status_id: Int!
    status: String!
    role: String!
  }

  # ============================================
  # TYPES DE RÉPONSE
  # ============================================

  """
  Résultat d'une opération d'authentification (login)
  """
  type AuthPayload {
    success: Boolean!
    message: String!
    user: User
    token: String
  }

  """
  Résultat de la déconnexion
  """
  type LogoutResult {
    success: Boolean!
    message: String!
    cookiesCleared: [String!]
    headersSet: Int
  }

  """
  Résultat de la vérification d'authentification
  """
  type VerifyAuthResult {
    success: Boolean!
    user: User!
  }

  """
  Résultat de la demande de réinitialisation de mot de passe
  """
  type ForgotPasswordResult {
    message: String!
  }

  """
  Résultat de la vérification d'un token de réinitialisation
  """
  type VerifyTokenResult {
    valid: Boolean!
    email: String
    userName: String
    error: String
  }

  """
  Résultat de la réinitialisation de mot de passe
  """
  type ResetPasswordResult {
    message: String!
    error: String
  }

  """
  Résultat du rafraîchissement du token
  """
  type RefreshTokenResult {
    success: Boolean!
    message: String!
    token: String
    user: User
  }

  """
  Résultat de la vérification du statut d'authentification
  """
  type StatusResult {
    authenticated: Boolean!
    user: User
    message: String
  }

  """
  Résultat de la confirmation d'email
  """
  type ConfirmEmailResult {
    success: Boolean!
    message: String!
    redirect_to: String
  }

  """
  Résultat du test d'authentification (debug)
  """
  type TestAuthResult {
    success: Boolean!
    message: String!
    timestamp: String!
  }

  # ============================================
  # INPUTS
  # ============================================

  """
  Input pour la connexion
  """
  input LoginInput {
    email: String!
    password: String!
  }

  """
  Input pour la demande de réinitialisation de mot de passe
  """
  input ForgotPasswordInput {
    email: String!
  }

  """
  Input pour la réinitialisation de mot de passe
  """
  input ResetPasswordInput {
    token: String!
    newPassword: String!
  }

  """
  Input pour la confirmation d'email
  """
  input ConfirmEmailInput {
    token: String!
  }

  """
  Input pour la vérification d'un token
  """
  input VerifyTokenInput {
    token: String!
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    """
    Vérifier l'authentification de l'utilisateur connecté
    Nécessite: Authentication
    """
    verifyAuth: VerifyAuthResult!

    """
    Vérifier un token de réinitialisation de mot de passe
    Public (pas d'authentification requise)
    """
    verifyResetToken(input: VerifyTokenInput!): VerifyTokenResult!

    """
    Vérifier le statut d'authentification actuel
    Public (pas d'authentification requise)
    """
    checkAuthStatus: StatusResult!

    """
    Confirmer l'email avec un token
    Public (pas d'authentification requise)
    """
    confirmEmail(input: ConfirmEmailInput!): ConfirmEmailResult!

    """
    Route de test publique pour vérifier que le module auth fonctionne
    Public (pas d'authentification requise)
    """
    testAuth: TestAuthResult!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    """
    Connexion utilisateur
    Public (pas d'authentification requise)
    Rate limited: 5 tentatives par 15 minutes
    """
    login(input: LoginInput!): AuthPayload!

    """
    Déconnexion utilisateur
    Nécessite: Authentication
    """
    logout: LogoutResult!

    """
    Demande de réinitialisation de mot de passe
    Public (pas d'authentification requise)
    Rate limited: 3 tentatives par 15 minutes
    """
    forgotPassword(input: ForgotPasswordInput!): ForgotPasswordResult!

    """
    Réinitialiser le mot de passe avec un token
    Public (pas d'authentification requise)
    Rate limited: 3 tentatives par 15 minutes
    """
    resetPassword(input: ResetPasswordInput!): ResetPasswordResult!

    """
    Rafraîchir le token d'authentification
    Nécessite: Authentication
    """
    refreshToken: RefreshTokenResult!
  }
`;
