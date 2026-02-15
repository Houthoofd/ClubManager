/**
 * TypeDefs GraphQL pour le module Vérification
 * Définit les types, queries et mutations pour les opérations de vérification
 */

export const verificationTypeDefs = `#graphql
  # =============================================================================
  # Types de base pour les vérifications
  # =============================================================================

  """
  Résultat standard d'une vérification
  """
  type VerificationResult {
    """
    Indique si l'élément existe
    """
    exists: Boolean!

    """
    Message descriptif du résultat
    """
    message: String!
  }

  """
  Résultat du health check du service de vérification
  """
  type VerificationHealthResult {
    """
    Statut du service (healthy, degraded, unhealthy)
    """
    status: String!

    """
    Message descriptif du statut
    """
    message: String!

    """
    Détails des vérifications
    """
    checks: VerificationChecks!
  }

  """
  Détails des vérifications du health check
  """
  type VerificationChecks {
    """
    État de la connexion à la base de données
    """
    database: Boolean!

    """
    État du service de vérification
    """
    verification: Boolean!
  }

  """
  Résultat de la vérification des professeurs
  """
  type VerifierProfesseursResult {
    """
    Liste des utilisateurs avec leur statut de professeur
    """
    professeurs: [ProfesseurStatus!]!

    """
    Message récapitulatif
    """
    message: String!
  }

  """
  Statut de professeur d'un utilisateur
  """
  type ProfesseurStatus {
    """
    Nom de l'utilisateur
    """
    nom: String!

    """
    Prénom de l'utilisateur
    """
    prenom: String!

    """
    Indique si l'utilisateur est professeur
    """
    isProf: Boolean!
  }

  # =============================================================================
  # Inputs pour les mutations et queries
  # =============================================================================

  """
  Input pour vérifier un utilisateur par prénom et nom
  """
  input VerifierPrenomNomInput {
    """
    Prénom de l'utilisateur
    """
    prenom: String!

    """
    Nom de l'utilisateur
    """
    nom: String!
  }

  """
  Input pour vérifier un utilisateur par email, prénom et nom
  """
  input VerifierEmailPrenomNomInput {
    """
    Email de l'utilisateur
    """
    email: String!

    """
    Prénom de l'utilisateur
    """
    prenom: String!

    """
    Nom de l'utilisateur
    """
    nom: String!
  }

  """
  Input pour vérifier un cours dans le planning
  """
  input VerifierPlanningInput {
    """
    Jour de la semaine (Lundi, Mardi, etc.)
    """
    jour: String!

    """
    Heure de début (format HH:MM)
    """
    heure_debut: String!

    """
    Heure de fin (format HH:MM)
    """
    heure_fin: String!

    """
    Type de cours
    """
    type_cours: String!
  }

  """
  Input pour vérifier un article par nom et catégorie
  """
  input VerifierArticleCategorieInput {
    """
    Nom de l'article
    """
    nom: String!

    """
    ID de la catégorie
    """
    categorie_id: Int!
  }

  """
  Input pour un utilisateur (nom et prénom)
  """
  input UtilisateurVerificationInput {
    """
    Nom de l'utilisateur
    """
    nom: String!

    """
    Prénom de l'utilisateur
    """
    prenom: String!
  }

  """
  Input pour vérifier si des utilisateurs sont professeurs
  """
  input VerifierProfesseursInput {
    """
    Liste des utilisateurs à vérifier
    """
    utilisateurs: [UtilisateurVerificationInput!]!
  }

  # =============================================================================
  # Queries
  # =============================================================================

  extend type Query {
    """
    Health check du service de vérification
    """
    verificationHealth: VerificationHealthResult!

    """
    Vérifie si un email existe dans la base de données
    """
    verifierEmail(email: String!): VerificationResult!

    """
    Vérifie si un nom d'utilisateur existe
    """
    verifierNomUtilisateur(nom_utilisateur: String!): VerificationResult!

    """
    Vérifie si un prénom existe
    """
    verifierPrenom(prenom: String!): VerificationResult!

    """
    Vérifie si un nom existe
    """
    verifierNom(nom: String!): VerificationResult!

    """
    Vérifie si un utilisateur existe par prénom et nom
    """
    verifierPrenomNom(input: VerifierPrenomNomInput!): VerificationResult!

    """
    Vérifie si un utilisateur existe par email, prénom et nom
    """
    verifierEmailPrenomNom(
      input: VerifierEmailPrenomNomInput!
    ): VerificationResult!

    """
    Vérifie si un cours existe dans le planning
    """
    verifierPlanning(input: VerifierPlanningInput!): VerificationResult!

    """
    Vérifie si un article existe par nom
    """
    verifierArticle(nom: String!): VerificationResult!

    """
    Vérifie si un article existe par nom et catégorie
    """
    verifierArticleCategorie(
      input: VerifierArticleCategorieInput!
    ): VerificationResult!

    """
    Vérifie si des utilisateurs sont professeurs
    """
    verifierProfesseurs(
      input: VerifierProfesseursInput!
    ): VerifierProfesseursResult!
  }

  # =============================================================================
  # Mutations
  # =============================================================================

  extend type Mutation {
    """
    Vérifie si un email existe (mutation pour compatibilité)
    """
    verifierEmailMutation(email: String!): VerificationResult!
  }
`;
