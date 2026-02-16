/**
 * Schémas GraphQL pour Sports
 * Définition des types, queries et mutations pour le système multi-sports
 */

import { gql } from "graphql-tag";

export const sportsTypeDefs = gql`
  # ============================================
  # SCALARS
  # ============================================

  scalar DateTime
  scalar JSON

  # ============================================
  # ENUMS
  # ============================================

  """
  Type de données pour la configuration d'un sport
  """
  enum SportConfigDataType {
    STRING
    NUMBER
    BOOLEAN
    JSON
    TEXT
  }

  """
  Niveau d'équipement requis
  """
  enum SportEquipmentLevel {
    BEGINNER
    INTERMEDIATE
    ADVANCED
    COMPETITION
    ALL
  }

  """
  Type de règle de compétition
  """
  enum CompetitionRuleType {
    SCORING
    TIME
    SAFETY
    EQUIPMENT
    CATEGORY
    OTHER
  }

  # ============================================
  # TYPES - SPORT
  # ============================================

  """
  Représente un sport dans le système
  """
  type Sport {
    """
    Identifiant unique
    """
    id: Int!

    """
    Code unique du sport (ex: KARATE, JUDO)
    """
    code: String!

    """
    Nom du sport
    """
    name: String!

    """
    Description détaillée
    """
    description: String

    """
    Couleur associée (format hex)
    """
    color: String!

    """
    Icône du sport
    """
    icon: String

    """
    URL de l'image du sport
    """
    imageUrl: String

    """
    Le sport est-il actif ?
    """
    isActive: Boolean!

    """
    Ordre d'affichage
    """
    displayOrder: Int!

    """
    Nécessite-t-il des ceintures/grades ?
    """
    requiresBelt: Boolean!

    """
    Autorise-t-il les compétitions ?
    """
    allowCompetitions: Boolean!

    """
    Date de création
    """
    createdAt: DateTime!

    """
    Date de dernière modification
    """
    updatedAt: DateTime!

    """
    Configurations associées
    """
    configurations: [SportConfiguration!]!

    """
    Équipements associés
    """
    equipment: [SportEquipment!]!

    """
    Règles de compétition associées
    """
    competitionRules: [SportCompetitionRule!]!

    """
    Statistiques associées
    """
    statistics: [SportStatistic!]!
  }

  # ============================================
  # TYPES - SPORT CONFIGURATION
  # ============================================

  """
  Configuration d'un sport (paramètres métier)
  """
  type SportConfiguration {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID du sport
    """
    sportId: Int!

    """
    Clé de configuration
    """
    configKey: String!

    """
    Valeur de configuration
    """
    configValue: String!

    """
    Type de données
    """
    dataType: SportConfigDataType!

    """
    Description de la configuration
    """
    description: String

    """
    Ordre d'affichage
    """
    displayOrder: Int!

    """
    Date de création
    """
    createdAt: DateTime!

    """
    Date de dernière modification
    """
    updatedAt: DateTime!

    """
    Sport associé
    """
    sport: Sport!
  }

  # ============================================
  # TYPES - USER SPORT
  # ============================================

  """
  Liaison entre un utilisateur et un sport
  """
  type UserSport {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID de l'utilisateur
    """
    userId: Int!

    """
    ID du sport
    """
    sportId: Int!

    """
    Ceinture/grade actuel
    """
    currentBelt: String

    """
    Date d'obtention du grade
    """
    beltObtainedDate: DateTime

    """
    Années d'expérience
    """
    yearsOfExperience: Int

    """
    Notes supplémentaires
    """
    notes: String

    """
    Est-ce le sport principal ?
    """
    isPrimary: Boolean!

    """
    Le sport est-il actif pour cet utilisateur ?
    """
    isActive: Boolean!

    """
    Date de création
    """
    createdAt: DateTime!

    """
    Date de dernière modification
    """
    updatedAt: DateTime!

    """
    Sport associé
    """
    sport: Sport!

    """
    Historique des grades
    """
    gradeHistory: [UserGradeHistory!]!
  }

  # ============================================
  # TYPES - USER GRADE HISTORY
  # ============================================

  """
  Historique des grades/ceintures d'un utilisateur
  """
  type UserGradeHistory {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID du UserSport
    """
    userSportId: Int!

    """
    Ancien grade
    """
    previousBelt: String

    """
    Nouveau grade
    """
    newBelt: String!

    """
    Date de passage
    """
    examDate: DateTime!

    """
    Résultat de l'examen
    """
    examResult: String

    """
    Notes du jury
    """
    juryNotes: String

    """
    Date de création
    """
    createdAt: DateTime!

    """
    UserSport associé
    """
    userSport: UserSport!
  }

  # ============================================
  # TYPES - SPORT EQUIPMENT
  # ============================================

  """
  Équipement requis pour un sport
  """
  type SportEquipment {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID du sport
    """
    sportId: Int!

    """
    Nom de l'équipement
    """
    name: String!

    """
    Description de l'équipement
    """
    description: String

    """
    Est-il obligatoire ?
    """
    isRequired: Boolean!

    """
    Niveau requis
    """
    requiredLevel: SportEquipmentLevel!

    """
    Ordre d'affichage
    """
    displayOrder: Int!

    """
    Date de création
    """
    createdAt: DateTime!

    """
    Date de dernière modification
    """
    updatedAt: DateTime!

    """
    Sport associé
    """
    sport: Sport!
  }

  # ============================================
  # TYPES - SPORT COMPETITION RULE
  # ============================================

  """
  Règles de compétition pour un sport
  """
  type SportCompetitionRule {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID du sport
    """
    sportId: Int!

    """
    Titre de la règle
    """
    title: String!

    """
    Description de la règle
    """
    description: String!

    """
    Type de règle
    """
    ruleType: CompetitionRuleType!

    """
    Catégorie d'âge (optionnel)
    """
    ageCategory: String

    """
    Est-elle active ?
    """
    isActive: Boolean!

    """
    Ordre d'affichage
    """
    displayOrder: Int!

    """
    Date de création
    """
    createdAt: DateTime!

    """
    Date de dernière modification
    """
    updatedAt: DateTime!

    """
    Sport associé
    """
    sport: Sport!
  }

  # ============================================
  # TYPES - SPORT STATISTIC
  # ============================================

  """
  Statistique d'un sport
  """
  type SportStatistic {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID du sport
    """
    sportId: Int!

    """
    Nom de la statistique
    """
    statName: String!

    """
    Valeur de la statistique
    """
    statValue: Float!

    """
    Unité de mesure
    """
    unit: String

    """
    Période de référence
    """
    period: String

    """
    Date de référence
    """
    recordedAt: DateTime!

    """
    Date de création
    """
    createdAt: DateTime!

    """
    Sport associé
    """
    sport: Sport!
  }

  # ============================================
  # INPUTS - SPORT
  # ============================================

  """
  Données pour créer un nouveau sport
  """
  input CreateSportInput {
    code: String!
    name: String!
    description: String
    color: String!
    icon: String
    imageUrl: String
    isActive: Boolean
    displayOrder: Int
    requiresBelt: Boolean
    allowCompetitions: Boolean
  }

  """
  Données pour mettre à jour un sport
  """
  input UpdateSportInput {
    code: String
    name: String
    description: String
    color: String
    icon: String
    imageUrl: String
    isActive: Boolean
    displayOrder: Int
    requiresBelt: Boolean
    allowCompetitions: Boolean
  }

  """
  Filtre de recherche pour les sports
  """
  input SportFilter {
    isActive: Boolean
    requiresBelt: Boolean
    allowCompetitions: Boolean
    search: String
    limit: Int
    offset: Int
  }

  # ============================================
  # INPUTS - SPORT CONFIGURATION
  # ============================================

  """
  Données pour créer une configuration de sport
  """
  input CreateSportConfigurationInput {
    sportId: Int!
    configKey: String!
    configValue: String!
    dataType: SportConfigDataType!
    description: String
    displayOrder: Int
  }

  """
  Données pour mettre à jour une configuration de sport
  """
  input UpdateSportConfigurationInput {
    configKey: String
    configValue: String
    dataType: SportConfigDataType
    description: String
    displayOrder: Int
  }

  # ============================================
  # INPUTS - USER SPORT
  # ============================================

  """
  Données pour assigner un sport à un utilisateur
  """
  input CreateUserSportInput {
    userId: Int!
    sportId: Int!
    currentBelt: String
    beltObtainedDate: DateTime
    yearsOfExperience: Int
    notes: String
    isPrimary: Boolean
    isActive: Boolean
  }

  """
  Données pour mettre à jour l'association utilisateur-sport
  """
  input UpdateUserSportInput {
    currentBelt: String
    beltObtainedDate: DateTime
    yearsOfExperience: Int
    notes: String
    isPrimary: Boolean
    isActive: Boolean
  }

  # ============================================
  # INPUTS - USER GRADE HISTORY
  # ============================================

  """
  Données pour enregistrer un passage de grade
  """
  input CreateUserGradeHistoryInput {
    userSportId: Int!
    previousBelt: String
    newBelt: String!
    examDate: DateTime!
    examResult: String
    juryNotes: String
  }

  # ============================================
  # INPUTS - SPORT EQUIPMENT
  # ============================================

  """
  Données pour créer un équipement de sport
  """
  input CreateSportEquipmentInput {
    sportId: Int!
    name: String!
    description: String
    isRequired: Boolean
    requiredLevel: SportEquipmentLevel!
    displayOrder: Int
  }

  """
  Données pour mettre à jour un équipement de sport
  """
  input UpdateSportEquipmentInput {
    name: String
    description: String
    isRequired: Boolean
    requiredLevel: SportEquipmentLevel
    displayOrder: Int
  }

  # ============================================
  # INPUTS - SPORT COMPETITION RULE
  # ============================================

  """
  Données pour créer une règle de compétition
  """
  input CreateSportCompetitionRuleInput {
    sportId: Int!
    title: String!
    description: String!
    ruleType: CompetitionRuleType!
    ageCategory: String
    isActive: Boolean
    displayOrder: Int
  }

  """
  Données pour mettre à jour une règle de compétition
  """
  input UpdateSportCompetitionRuleInput {
    title: String
    description: String
    ruleType: CompetitionRuleType
    ageCategory: String
    isActive: Boolean
    displayOrder: Int
  }

  # ============================================
  # INPUTS - SPORT STATISTIC
  # ============================================

  """
  Données pour enregistrer une statistique de sport
  """
  input CreateSportStatisticInput {
    sportId: Int!
    statName: String!
    statValue: Float!
    unit: String
    period: String
    recordedAt: DateTime
  }

  # ============================================
  # RESPONSE TYPES
  # ============================================

  """
  Liste paginée de sports
  """
  type SportList {
    items: [Sport!]!
    total: Int!
    hasMore: Boolean!
  }

  """
  Résultat d'une opération sur un sport
  """
  type SportResult {
    success: Boolean!
    sport: Sport
    error: String
  }

  """
  Liste paginée d'associations utilisateur-sport
  """
  type UserSportList {
    items: [UserSport!]!
    total: Int!
    hasMore: Boolean!
  }

  """
  Résultat d'une opération sur une association utilisateur-sport
  """
  type UserSportResult {
    success: Boolean!
    userSport: UserSport
    error: String
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    """
    Récupérer un sport par son ID
    """
    getSport(id: Int!): Sport

    """
    Récupérer un sport par son code
    """
    getSportByCode(code: String!): Sport

    """
    Récupérer tous les sports avec filtres
    """
    getSportList(filter: SportFilter): SportList!

    """
    Rechercher des sports
    """
    searchSports(search: String!): [Sport!]!

    """
    Récupérer les sports actifs
    """
    getActiveSports: [Sport!]!

    """
    Récupérer les sports d'un utilisateur
    """
    getUserSports(userId: Int!): [UserSport!]!

    """
    Récupérer le sport principal d'un utilisateur
    """
    getUserPrimarySport(userId: Int!): UserSport

    """
    Récupérer l'historique des grades d'un utilisateur pour un sport
    """
    getUserGradeHistory(userSportId: Int!): [UserGradeHistory!]!

    """
    Récupérer les équipements requis pour un sport
    """
    getSportEquipment(sportId: Int!): [SportEquipment!]!

    """
    Récupérer les règles de compétition d'un sport
    """
    getSportCompetitionRules(sportId: Int!): [SportCompetitionRule!]!

    """
    Récupérer les statistiques d'un sport
    """
    getSportStatistics(sportId: Int!, period: String): [SportStatistic!]!

    """
    Récupérer les configurations d'un sport
    """
    getSportConfigurations(sportId: Int!): [SportConfiguration!]!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    """
    Créer un nouveau sport
    """
    createSport(input: CreateSportInput!): SportResult!

    """
    Mettre à jour un sport
    """
    updateSport(id: Int!, input: UpdateSportInput!): SportResult!

    """
    Supprimer un sport
    """
    deleteSport(id: Int!): SportResult!

    """
    Activer/désactiver un sport
    """
    toggleSportStatus(id: Int!): SportResult!

    """
    Assigner un sport à un utilisateur
    """
    assignSportToUser(input: CreateUserSportInput!): UserSportResult!

    """
    Mettre à jour l'association utilisateur-sport
    """
    updateUserSport(id: Int!, input: UpdateUserSportInput!): UserSportResult!

    """
    Supprimer l'association utilisateur-sport
    """
    removeUserSport(id: Int!): UserSportResult!

    """
    Définir le sport principal d'un utilisateur
    """
    setUserPrimarySport(userSportId: Int!): UserSportResult!

    """
    Enregistrer un passage de grade
    """
    recordGradeChange(input: CreateUserGradeHistoryInput!): UserSportResult!

    """
    Créer un équipement de sport
    """
    createSportEquipment(input: CreateSportEquipmentInput!): SportResult!

    """
    Mettre à jour un équipement de sport
    """
    updateSportEquipment(
      id: Int!
      input: UpdateSportEquipmentInput!
    ): SportResult!

    """
    Supprimer un équipement de sport
    """
    deleteSportEquipment(id: Int!): SportResult!

    """
    Créer une règle de compétition
    """
    createSportCompetitionRule(
      input: CreateSportCompetitionRuleInput!
    ): SportResult!

    """
    Mettre à jour une règle de compétition
    """
    updateSportCompetitionRule(
      id: Int!
      input: UpdateSportCompetitionRuleInput!
    ): SportResult!

    """
    Supprimer une règle de compétition
    """
    deleteSportCompetitionRule(id: Int!): SportResult!

    """
    Enregistrer une statistique de sport
    """
    recordSportStatistic(input: CreateSportStatisticInput!): SportResult!

    """
    Créer une configuration de sport
    """
    createSportConfiguration(
      input: CreateSportConfigurationInput!
    ): SportResult!

    """
    Mettre à jour une configuration de sport
    """
    updateSportConfiguration(
      id: Int!
      input: UpdateSportConfigurationInput!
    ): SportResult!

    """
    Supprimer une configuration de sport
    """
    deleteSportConfiguration(id: Int!): SportResult!
  }
`;
