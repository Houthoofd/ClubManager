/**
 * Définitions de types GraphQL pour le module Professeurs
 */

export const professeursTypeDefs = `#graphql
  """
  Professeur avec informations complètes
  """
  type Professeur {
    id: Int!
    nom: String!
    prenom: String!
    nom_utilisateur: String!
    email: String!
    genre_id: Int!
    date_naissance: String!
    grade_id: Int!
  }

  """
  Professeur avec informations étendues
  """
  type ProfesseurComplet {
    id: Int!
    nom: String!
    prenom: String!
    nom_utilisateur: String!
    email: String!
    genre_id: Int!
    date_naissance: String!
    grade_id: Int!
    first_name: String
    last_name: String
    date_of_birth: String
    status_id: Int!
    created_at: String
    updated_at: String
  }

  """
  Cours récurrent d'un professeur
  """
  type CoursRecurrent {
    cours_recurrent_id: Int!
    type_cours: String!
    jour_semaine: Int!
    heure_debut: String!
    heure_fin: String!
    est_recurrent_actif: Boolean!
    professeur_id: Int!
    professeur_nom: String!
    professeur_prenom: String!
  }

  """
  Planning des cours d'un professeur
  """
  type PlanningCours {
    cours: [CoursRecurrent!]!
    professeur: ProfesseurInfo
  }

  """
  Informations basiques d'un professeur
  """
  type ProfesseurInfo {
    id: Int!
    nom: String!
    prenom: String!
  }

  """
  Résultat de recherche de professeurs
  """
  type ProfesseursSearchResult {
    professeurs: [Professeur!]!
    total: Int!
  }

  """
  Résultat de confirmation d'opération
  """
  type ConfirmationResult {
    isConfirm: Boolean!
    message: String!
  }

  """
  Résultat de vérification avec données
  """
  type VerifyResultWithData {
    isFind: Boolean!
    message: String!
    data: [Professeur!]
  }

  """
  Résultat de vérification de planning
  """
  type VerifyPlanningResult {
    isFind: Boolean!
    message: String!
    data: [CoursRecurrent!]
  }

  """
  Dépendances d'un professeur
  """
  type ProfesseurDependencies {
    coursCount: Int!
    coursPonctuelsCount: Int!
    hasDependencies: Boolean!
  }

  """
  Entrée pour ajouter un professeur
  """
  input AjouterProfesseurInput {
    id: Int!
  }

  """
  Entrée pour ajouter plusieurs professeurs
  """
  input AjouterProfesseursBatchInput {
    utilisateurs: [Int!]!
  }

  """
  Entrée pour modifier le statut d'un professeur
  """
  input ModifierStatutProfesseurInput {
    id: Int!
    status_id: Int!
  }

  """
  Entrée pour mettre à jour un utilisateur
  """
  input UpdateUtilisateurInput {
    firstName: String!
    lastName: String!
    email: String!
    genreId: Int!
    dateOfBirth: String!
    gradeId: Int!
  }

  """
  Queries pour les professeurs
  """
  type Query {
    """
    Récupérer tous les professeurs
    """
    professeurs: VerifyResultWithData!

    """
    Récupérer un professeur par son ID
    """
    professeur(id: Int!): ProfesseurComplet

    """
    Récupérer le planning des cours d'un professeur
    """
    planningCoursProfesseur(id: Int!): VerifyPlanningResult!

    """
    Rechercher des professeurs
    """
    rechercherProfesseurs(
      searchTerm: String!
      limit: Int = 50
      offset: Int = 0
    ): ProfesseursSearchResult!

    """
    Compter le nombre total de professeurs
    """
    compterProfesseurs: Int!

    """
    Vérifier si un utilisateur est professeur
    """
    estProfesseur(id: Int!): Boolean!

    """
    Vérifier si un professeur a des cours actifs
    """
    professeurACoursActifs(id: Int!): Boolean!

    """
    Compter les cours d'un professeur
    """
    compterCoursProfesseur(id: Int!): Int!

    """
    Vérifier les dépendances d'un professeur
    """
    verifierDependancesProfesseur(id: Int!): ProfesseurDependencies!

    """
    Obtenir le statut d'un utilisateur
    """
    obtenirStatutUtilisateur(id: Int!): Int
  }

  """
  Mutations pour les professeurs
  """
  type Mutation {
    """
    Ajouter/promouvoir un utilisateur en professeur
    """
    ajouterProfesseur(input: AjouterProfesseurInput!): ConfirmationResult!

    """
    Ajouter/promouvoir plusieurs utilisateurs en professeurs
    """
    ajouterProfesseursBatch(input: AjouterProfesseursBatchInput!): ConfirmationResult!

    """
    Modifier le statut d'un professeur
    """
    modifierStatutProfesseur(input: ModifierStatutProfesseurInput!): ConfirmationResult!

    """
    Retirer la promotion d'un professeur
    """
    retirerPromotionProfesseur(id: Int!): ConfirmationResult!

    """
    Assigner un professeur à un cours
    """
    assignerProfesseurACours(coursId: Int!, professeurId: Int!): ConfirmationResult!

    """
    Retirer un professeur d'un cours
    """
    retirerProfesseurDuCours(coursId: Int!, professeurId: Int!): ConfirmationResult!

    """
    Retirer un professeur de tous ses cours
    """
    retirerProfesseurDeTousLesCours(professeurId: Int!): ConfirmationResult!

    """
    Mettre à jour les informations d'un utilisateur/professeur
    """
    mettreAJourUtilisateur(id: Int!, input: UpdateUtilisateurInput!): ConfirmationResult!

    """
    Mettre à jour l'email d'un utilisateur
    """
    mettreAJourEmail(id: Int!, email: String!): ConfirmationResult!

    """
    Mettre à jour le grade d'un utilisateur
    """
    mettreAJourGrade(id: Int!, gradeId: Int!): ConfirmationResult!
  }
`;
