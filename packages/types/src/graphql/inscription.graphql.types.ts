/**
 * TypeDefs GraphQL pour le module Inscription
 * Gestion de l'inscription des nouveaux utilisateurs et vérification d'email
 */

export const inscriptionTypeDefs = `#graphql
  # ============================================
  # TYPES - INSCRIPTION
  # ============================================

  """
  Résultat de la vérification d'email
  """
  type EmailVerificationResult {
    exists: Boolean!
    message: String
  }

  """
  Résultat de l'inscription d'un utilisateur
  """
  type InscriptionResult {
    success: Boolean!
    message: String!
    userId: Int
  }

  """
  Force du mot de passe (score de 0 à 4)
  """
  type PasswordStrength {
    score: Int!
    feedback: String!
  }

  # ============================================
  # INPUTS
  # ============================================

  """
  Input pour vérifier la disponibilité d'un email
  """
  input VerificationEmailInput {
    email: String!
  }

  """
  Input pour l'inscription d'un nouvel utilisateur
  """
  input InscriptionInput {
    nom: String!
    prenom: String!
    email: String!
    password: String!
    date: String!
    abonnement: Int!
    genre: Int!
  }

  """
  Input pour évaluer la force d'un mot de passe
  """
  input EvaluerMotDePasseInput {
    password: String!
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    """
    Vérifie si un email est déjà utilisé
    Pas d'authentification requise (inscription publique)
    """
    verifierEmail(input: VerificationEmailInput!): EmailVerificationResult!

    """
    Évalue la force d'un mot de passe
    Pas d'authentification requise (inscription publique)
    """
    evaluerForceMotDePasse(input: EvaluerMotDePasseInput!): PasswordStrength!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    """
    Inscrit un nouvel utilisateur dans le système
    Pas d'authentification requise (inscription publique)
    """
    inscrireUtilisateur(input: InscriptionInput!): InscriptionResult!
  }
`;
