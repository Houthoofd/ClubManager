/**
 * TypeDefs GraphQL pour le module Utilisateurs
 * Définit les types, queries et mutations pour la gestion des utilisateurs
 */

export const utilisateursTypeDefs = `#graphql
  # Types de base
  type Utilisateur {
    id: Int!
    prenom: String!
    nom: String!
    nom_utilisateur: String
    email: String!
    date_naissance: String!
    date_inscription: String!
    genre_id: Int!
    grade_id: Int
    abonnement_id: Int!
    status_id: Int!
    genre: String
    grade: String
    abonnement: String
    status: String
    created_at: String
    updated_at: String
  }

  type UtilisateurStats {
    totalUtilisateurs: Int!
    utilisateursActifs: Int!
    utilisateursInactifs: Int!
  }

  type VerifierExistenceResult {
    message: String!
    type: String!
    userExists: Boolean!
    canRegister: Boolean
    userData: UtilisateurExistant
  }

  type UtilisateurExistant {
    id: Int!
    prenom: String!
    nom: String!
    email: String
    date_naissance: String!
    status: String
  }

  type InscriptionResult {
    message: String!
    generatedUserId: Int!
    inscriptionDetails: InscriptionDetails!
    emailStatus: EmailStatus!
    warning: String
  }

  type InscriptionDetails {
    userId: Int!
    prenom: String!
    nom: String!
    email: String!
    nom_utilisateur: String!
  }

  type EmailStatus {
    sent: Boolean!
    message: String
    details: JSON
    emailDestination: String
    isTestMode: Boolean
    error: String
    reason: String
  }

  type ConnexionResult {
    success: Boolean!
    message: String!
    data: ConnexionData
  }

  type ConnexionData {
    id: Int!
    prenom: String!
    nom: String!
    email: String!
    token: String
  }

  type UpdateUtilisateurResult {
    message: String!
    data: Utilisateur!
  }

  type DeleteUtilisateurResult {
    isConfirm: Boolean!
    message: String!
    action: String!
  }

  type VerifyEmailTokenResult {
    success: Boolean!
    message: String
    data: JSON
    error: String
    redirect_to: String!
  }

  type EmailTestResult {
    success: Boolean!
    message: String!
    messageId: String
    details: JSON
    error: String
  }

  type EmailConfigTestResult {
    success: Boolean!
    message: String!
    details: JSON!
  }

  type HealthCheckResult {
    status: String!
    module: String!
    timestamp: String!
  }

  # Inputs
  input VerifierExistenceInput {
    nom: String!
    prenom: String!
    date_naissance: String!
  }

  input InscriptionInput {
    prenom: String!
    nom: String!
    nom_utilisateur: String
    email: String!
    password: String!
    genre_id: Int!
    abonnement_id: Int!
    date_naissance: String!
    date_inscription: String
    status_id: Int
    grade_id: Int
  }

  input ConnexionUserIdInput {
    userId: String!
    password: String!
  }

  input ConnexionEmailInput {
    email: String!
    password: String!
  }

  input UpdateUtilisateurInput {
    email: String
    date_naissance: String
    genres: Int
    grades: Int
    abonnement: Int
    status: Int
    password: String
  }

  input DeleteUtilisateurInput {
    isConfirm: Boolean!
  }

  input SoftDeleteUtilisateurInput {
    isConfirm: Boolean!
  }

  # Queries
  extend type Query {
    # Vérifier l'existence d'un utilisateur (public)
    verifierExistenceUtilisateur(input: VerifierExistenceInput!): VerifierExistenceResult!

    # Health check du module
    healthCheckUtilisateurs: HealthCheckResult!

    # Récupérer tous les utilisateurs (auth + admin requise)
    getUtilisateurs(includeInactive: Boolean): [Utilisateur!]!

    # Récupérer un utilisateur par ID (auth requise, owner ou admin)
    getUtilisateur(id: Int!): Utilisateur!

    # Récupérer les statistiques des utilisateurs (auth + admin requise)
    getUtilisateursStats: UtilisateurStats!

    # Vérifier un token de validation d'email (public)
    verifyEmailToken(token: String!, userId: String!): VerifyEmailTokenResult!

    # Tester la configuration email (admin)
    testEmailConfig: EmailConfigTestResult!
  }

  # Mutations
  extend type Mutation {
    # Inscription d'un nouvel utilisateur (public)
    inscrireUtilisateur(input: InscriptionInput!): InscriptionResult!

    # Connexion par userId (public)
    connexionUserId(input: ConnexionUserIdInput!): ConnexionResult!

    # Connexion par email - legacy (public)
    connexionEmail(input: ConnexionEmailInput!): ConnexionResult!

    # Mettre à jour un utilisateur (auth requise, owner ou admin)
    updateUtilisateur(id: Int!, input: UpdateUtilisateurInput!): UpdateUtilisateurResult!

    # Supprimer définitivement un utilisateur (admin)
    deleteUtilisateur(id: Int!, input: DeleteUtilisateurInput!): DeleteUtilisateurResult!

    # Désactiver un utilisateur - soft delete (admin)
    softDeleteUtilisateur(id: Int!, input: SoftDeleteUtilisateurInput!): DeleteUtilisateurResult!

    # Envoyer un email de test (admin)
    sendTestEmail(email: String!): EmailTestResult!
  }
`;
