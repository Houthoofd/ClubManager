/**
 * Définitions de types GraphQL pour le module Cours
 */

export const coursTypeDefs = `#graphql
  """
  Professeur enseignant un cours
  """
  type Professeur {
    id: Int!
    nom: String!
    prenom: String!
    email: String
  }

  """
  Utilisateur participant à un cours
  """
  type UtilisateurParticipant {
    id: Int!
    nom: String!
    prenom: String!
    presence: Boolean!
    date_inscription: String
  }

  """
  Cours avec informations complètes
  """
  type Cours {
    id: Int!
    date_cours: String!
    jour_cours: String
    jour_semaine: Int
    type_cours: String!
    heure_debut: String!
    heure_fin: String!
    capacite_max: Int
    description: String
    actif: Boolean!
    created_at: String
    updated_at: String
    professeurs: [Professeur!]!
    participants: [UtilisateurParticipant!]!
    places_disponibles: Int
    complet: Boolean
  }

  """
  Cours récurrent (template hebdomadaire)
  """
  type CoursRecurrent {
    id: Int!
    jour_semaine: Int!
    type_cours: String!
    heure_debut: String!
    heure_fin: String!
    actif: Boolean!
    created_at: String
    professeurs: [Professeur!]!
  }

  """
  Jour de cours dans le planning hebdomadaire
  """
  type JourDeCours {
    jour: String!
    type_cours: String!
    heure_debut: String!
    heure_fin: String!
    professeurs: [String!]!
  }

  """
  Inscription d'un utilisateur à un cours
  """
  type Inscription {
    id: Int!
    utilisateur_id: Int!
    cours_id: Int!
    date_inscription: String!
    status_id: Int!
    present: Boolean!
    notes: String
    created_at: String
  }

  """
  Informations de semaine
  """
  type Semaine {
    annee: Int!
    numero_semaine: Int!
    date_debut: String!
    date_fin: String!
    nombre_cours: Int!
  }

  """
  Statistiques de présence pour un cours
  """
  type StatistiquesPresenceCours {
    cours_id: Int!
    type_cours: String!
    date_cours: String!
    total_inscrits: Int!
    presents: Int!
    absents: Int!
    taux_presence: Float!
  }

  """
  Statistiques de présence pour un utilisateur
  """
  type StatistiquesPresenceUtilisateur {
    utilisateur_id: Int!
    nom: String!
    prenom: String!
    total_cours_inscrits: Int!
    cours_assistes: Int!
    cours_manques: Int!
    taux_presence: Float!
  }

  """
  Disponibilité d'un cours
  """
  type DisponibiliteCours {
    cours_id: Int!
    capacite_max: Int!
    places_occupees: Int!
    places_disponibles: Int!
    complet: Boolean!
  }

  """
  Résumé hebdomadaire
  """
  type ResumeHebdomadaire {
    semaine: Semaine!
    cours: [Cours!]!
    total_cours: Int!
    total_participants: Int!
  }

  """
  Input pour créer un cours récurrent
  """
  input CreateCoursRecurrentInput {
    jour_semaine: Int!
    type_cours: String!
    heure_debut: String!
    heure_fin: String!
    date_debut: String
    date_fin: String
    professeurs: [String!]
  }

  """
  Input pour modifier un cours récurrent
  """
  input UpdateCoursRecurrentInput {
    type_cours: String
    heure_debut: String
    heure_fin: String
    actif: Boolean
    professeurs: [String!]
  }

  """
  Input pour créer un cours ponctuel
  """
  input CreateCoursInput {
    date_cours: String!
    type_cours: String!
    heure_debut: String!
    heure_fin: String!
    capacite_max: Int
    description: String
    professeurs: [Int!]
  }

  """
  Input pour modifier un cours
  """
  input UpdateCoursInput {
    date_cours: String
    type_cours: String
    heure_debut: String
    heure_fin: String
    capacite_max: Int
    description: String
    actif: Boolean
  }

  """
  Input pour inscrire un utilisateur
  """
  input InscriptionInput {
    utilisateur_id: Int!
    cours_id: Int!
    notes: String
  }

  """
  Filtres de recherche de cours
  """
  input CoursSearchFiltersInput {
    type_cours: String
    date_debut: String
    date_fin: String
    jour_semaine: Int
    heure_debut: String
    heure_fin: String
    actif: Boolean
    avec_places_disponibles: Boolean
    limit: Int
    offset: Int
  }

  """
  Filtres de recherche d'inscriptions
  """
  input InscriptionSearchFiltersInput {
    utilisateur_id: Int
    cours_id: Int
    present: Boolean
    date_debut: String
    date_fin: String
    limit: Int
    offset: Int
  }

  """
  Résultat de recherche avec pagination
  """
  type CoursSearchResult {
    cours: [Cours!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  """
  Résultat de confirmation d'opération
  """
  type CoursConfirmationResult {
    success: Boolean!
    message: String!
    data: String
  }

  """
  Résultat de vérification d'inscription
  """
  type VerificationInscriptionResult {
    isBooked: Boolean!
    isFind: Boolean!
    message: String!
    inscriptionId: Int
    userId: Int
  }

  extend type Query {
    """
    Récupérer tous les cours
    """
    cours: [Cours!]!

    """
    Récupérer un cours par son ID
    """
    coursById(id: Int!): Cours

    """
    Récupérer les cours d'une semaine spécifique
    """
    coursParSemaine(semaine: Int!, annee: Int!): [Cours!]!

    """
    Récupérer le planning hebdomadaire
    """
    planningHebdomadaire(semaine: Int, annee: Int): [JourDeCours!]!

    """
    Récupérer tous les cours récurrents
    """
    coursRecurrents: [CoursRecurrent!]!

    """
    Récupérer les inscriptions d'un utilisateur
    """
    mesInscriptions(utilisateurId: Int!): [Cours!]!

    """
    Récupérer les cours auxquels un utilisateur peut s'inscrire
    """
    coursDisponibles(utilisateurId: Int!): [Cours!]!

    """
    Récupérer les participants d'un cours
    """
    participantsCours(coursId: Int!): [UtilisateurParticipant!]!

    """
    Rechercher des cours avec filtres
    """
    searchCours(filters: CoursSearchFiltersInput!): CoursSearchResult!

    """
    Vérifier l'inscription d'un utilisateur à un cours
    """
    verifierInscription(
      utilisateurId: Int!
      coursId: Int!
    ): VerificationInscriptionResult!

    """
    Récupérer la disponibilité d'un cours
    """
    disponibiliteCours(coursId: Int!): DisponibiliteCours!

    """
    Récupérer toutes les semaines avec cours
    """
    semainesAvecCours: [Semaine!]!

    """
    Récupérer le résumé hebdomadaire
    """
    resumeHebdomadaire(semaine: Int!, annee: Int!): ResumeHebdomadaire!

    """
    Statistiques de présence pour un cours
    """
    statistiquesCours(coursId: Int!): StatistiquesPresenceCours!

    """
    Statistiques de présence pour un utilisateur
    """
    statistiquesUtilisateur(utilisateurId: Int!): StatistiquesPresenceUtilisateur!

    """
    Statistiques globales de présence
    """
    statistiquesGlobales: [StatistiquesPresenceCours!]!
  }

  extend type Mutation {
    """
    Créer un cours récurrent
    """
    ajouterCoursRecurrent(
      data: CreateCoursRecurrentInput!
    ): CoursConfirmationResult!

    """
    Modifier un cours récurrent
    """
    modifierCoursRecurrent(
      id: Int!
      data: UpdateCoursRecurrentInput!
    ): CoursConfirmationResult!

    """
    Supprimer un cours récurrent
    """
    supprimerCoursRecurrent(id: Int!): CoursConfirmationResult!

    """
    Créer un cours ponctuel
    """
    ajouterCours(data: CreateCoursInput!): CoursConfirmationResult!

    """
    Modifier un cours
    """
    modifierCours(
      id: Int!
      data: UpdateCoursInput!
    ): CoursConfirmationResult!

    """
    Supprimer un cours
    """
    supprimerCours(id: Int!): CoursConfirmationResult!

    """
    Inscrire un utilisateur à un cours
    """
    inscrireUtilisateur(
      utilisateurId: Int!
      coursId: Int!
      notes: String
    ): CoursConfirmationResult!

    """
    Désinscrire un utilisateur d'un cours
    """
    desinscrireUtilisateur(
      inscriptionId: Int!
    ): CoursConfirmationResult!

    """
    Marquer la présence d'un utilisateur
    """
    marquerPresence(
      inscriptionId: Int!
      present: Boolean!
    ): CoursConfirmationResult!

    """
    Valider la présence d'un utilisateur (marquer présent)
    """
    validerPresence(inscriptionId: Int!): CoursConfirmationResult!

    """
    Annuler la présence d'un utilisateur (marquer absent)
    """
    annulerPresence(inscriptionId: Int!): CoursConfirmationResult!

    """
    Associer des professeurs à un cours récurrent
    """
    associerProfesseurs(
      coursRecurrentId: Int!
      professeurs: [String!]!
    ): CoursConfirmationResult!

    """
    Supprimer un professeur d'un cours récurrent
    """
    supprimerProfesseur(
      coursRecurrentId: Int!
      professeurNom: String!
    ): CoursConfirmationResult!
  }
`;
