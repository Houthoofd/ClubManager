/**
 * TypeDefs GraphQL pour le module Auth
 * Définit les types, queries et mutations pour l'authentification
 */

export const authTypeDefs = `
  # Types de base
  type User {
    id: Int!
    email: String!
    first_name: String!
    last_name: String!
    status_id: Int!
    status: String!
    role: String!
  }

  type AuthPayload {
    success: Boolean!
    message: String!
    user: User
    token: String
  }

  type LogoutResult {
    success: Boolean!
    message: String!
    cookiesCleared: [String!]
    headersSet: Int
  }

  type VerifyAuthResult {
    success: Boolean!
    user: User!
  }

  type ForgotPasswordResult {
    message: String!
  }

  type VerifyTokenResult {
    valid: Boolean!
    email: String
    userName: String
    error: String
  }

  type ResetPasswordResult {
    message: String!
    error: String
  }

  type RefreshTokenResult {
    success: Boolean!
    message: String!
    token: String
    user: User
  }

  type StatusResult {
    authenticated: Boolean!
    user: User
    message: String
  }

  type ConfirmEmailResult {
    success: Boolean!
    message: String!
    redirect_to: String
  }

  type TestResult {
    success: Boolean!
    message: String!
    timestamp: String!
  }

  # Inputs
  input LoginInput {
    email: String!
    password: String!
  }

  input ForgotPasswordInput {
    email: String!
  }

  input ResetPasswordInput {
    token: String!
    newPassword: String!
  }

  input ConfirmEmailInput {
    token: String!
    userId: String!
  }

  # Queries
  type Query {
    # Vérifier l'authentification de l'utilisateur connecté
    verifyAuth: VerifyAuthResult!

    # Vérifier un token de réinitialisation
    verifyResetToken(token: String!): VerifyTokenResult!

    # Vérifier le statut d'authentification
    checkAuthStatus: StatusResult!

    # Confirmer l'email avec un token
    confirmEmail(token: String!, userId: String!): ConfirmEmailResult!

    # Route de test publique
    testAuth: TestResult!
  }

  # Mutations
  type Mutation {
    # Connexion utilisateur
    login(input: LoginInput!): AuthPayload!

    # Déconnexion utilisateur
    logout: LogoutResult!

    # Demande de réinitialisation de mot de passe
    forgotPassword(input: ForgotPasswordInput!): ForgotPasswordResult!

    # Réinitialiser le mot de passe avec un token
    resetPassword(input: ResetPasswordInput!): ResetPasswordResult!

    # Rafraîchir le token d'authentification
    refreshToken: RefreshTokenResult!
  }
`;
