/**
 * TypeDefs GraphQL pour le module Cours
 * ✅ Centralisés dans @clubmanager/types
 *
 * @package @clubmanager/types
 */

export const coursTypeDefs = `#graphql
  """
  Cours récurrent dans le planning
  """
  type CoursRecurrent {
    id: Int!
    nom: String!
    type_cours: String!
    jour_semaine: String!
    heure_debut: String!
    heure_fin: String!
    professeurs: [String!]
    places_max: Int
    created_at: String
  }

  """
  Instance de cours (date spécifique)
  """
  type CoursInstance {
    id: Int!
    cours_recurrent_id: Int!
    date_cours: String!
    statut: String!
    professeur_id: Int
    professeur_nom: String
    inscriptions_count: Int
    places_restantes: Int
  }

  """
  Inscription à un cours
  """
  type InscriptionCours {
    id: Int!
    utilisateur_id: Int!
    cours_id: Int!
    date_inscription: String!
    presence_validee: Boolean!
    utilisateur_nom: String
    utilisateur_prenom: String
    cours_date: String
    cours_type: String
  }

  """
  Planning complet d'un jour
  """
  type PlanningJour {
    jour: String!
    cours: [CoursRecurrent!]!
  }

  """
  Résultat de l'ajout d'un cours
  """
  type AjouterCoursResult {
    success: Boolean!
    message: String!
    cours_id: Int
    cours_recurrent_id: Int
  }

  """
  Résultat de l'inscription
  """
  type InscrireUtilisateurResult {
    success: Boolean!
    message: String!
    inscription_id: Int
    utilisateur_id: Int
    cours_id: Int
  }

  """
  Résultat de désinscription
  """
  type DesinscrireUtilisateurResult {
    success: Boolean!
    message: String!
    inscription_id: Int
  }

  """
  Résultat validation/annulation présence
  """
  type PresenceResult {
    success: Boolean!
    message: String!
    inscription_id: Int
    presence_validee: Boolean!
  }

  """
  Liste des participants à un cours
  """
  type ParticipantsCours {
    cours_id: Int!
    cours_date: String
    cours_type: String
    total_participants: Int!
    participants: [InscriptionCours!]!
  }

  """
  Statistiques d'un cours
  """
  type StatistiquesCours {
    cours_id: Int!
    nom: String!
    type_cours: String!
    total_inscriptions: Int!
    taux_presence: Float!
    places_max: Int
    moyenne_participants: Float
  }

  """
  Input pour ajouter un cours récurrent
  """
  input AjouterCoursInput {
    nom: String!
    type_cours: String!
    jour_semaine: String!
    heure_debut: String!
    heure_fin: String!
    professeurs: [String!]
    places_max: Int
  }

  """
  Input pour modifier un cours
  """
  input ModifierCoursInput {
    nom: String
    type_cours: String
    jour_semaine: String
    heure_debut: String
    heure_fin: String
    professeurs: [String!]
    places_max: Int
  }

  """
  Input pour inscrire un utilisateur
  """
  input InscrireUtilisateurInput {
    utilisateur_nom: String!
    utilisateur_prenom: String!
    cours_id: Int!
  }

  """
  Input pour désinscrire un utilisateur
  """
  input DesinscrireUtilisateurInput {
    utilisateur_id: Int!
    cours_id: Int!
  }

  """
  Input pour valider/annuler présence
  """
  input PresenceInput {
    utilisateur_id: Int!
    cours_id: Int!
  }

  """
  Input pour retirer un professeur
  """
  input RetirerProfesseurInput {
    cours_recurrent_id: Int!
    professeur_id: Int!
  }

  extend type Query {
    """
    Obtenir tous les cours récurrents
    """
    tousLesCours: [CoursRecurrent!]!

    """
    Obtenir le planning complet
    """
    planningCours: [PlanningJour!]!

    """
    Obtenir les cours d'un utilisateur
    """
    coursUtilisateur(utilisateurId: Int!): [InscriptionCours!]!

    """
    Obtenir les participants d'un cours
    """
    participantsCours(coursId: Int!): ParticipantsCours!

    """
    Obtenir les inscriptions d'un utilisateur
    """
    inscriptionsUtilisateur(utilisateurId: Int!): [InscriptionCours!]!

    """
    Obtenir les statistiques d'un cours
    """
    statistiquesCours(coursId: Int!): StatistiquesCours!
  }

  extend type Mutation {
    """
    Ajouter un cours récurrent
    Requiert: Authentification + Admin
    """
    ajouterCours(input: AjouterCoursInput!): AjouterCoursResult!

    """
    Modifier un cours récurrent
    Requiert: Authentification + Admin
    """
    modifierCours(coursId: Int!, input: ModifierCoursInput!): AjouterCoursResult!

    """
    Supprimer un jour de cours
    Requiert: Authentification + Admin
    """
    supprimerJourCours(coursId: Int!): AjouterCoursResult!

    """
    Inscrire un utilisateur à un cours
    Requiert: Authentification
    """
    inscrireUtilisateur(input: InscrireUtilisateurInput!): InscrireUtilisateurResult!

    """
    Désinscrire un utilisateur d'un cours
    Requiert: Authentification
    """
    desinscrireUtilisateur(input: DesinscrireUtilisateurInput!): DesinscrireUtilisateurResult!

    """
    Valider la présence d'un utilisateur
    Requiert: Authentification + Staff
    """
    validerPresence(input: PresenceInput!): PresenceResult!

    """
    Annuler la présence d'un utilisateur
    Requiert: Authentification + Staff
    """
    annulerPresence(input: PresenceInput!): PresenceResult!

    """
    Retirer un professeur d'un cours
    Requiert: Authentification + Admin
    """
    retirerProfesseur(input: RetirerProfesseurInput!): AjouterCoursResult!
  }
`;
