import { gql } from 'graphql-tag';

/**
 * Types GraphQL pour le module Alertes
 * Définit le schéma GraphQL pour la gestion des alertes utilisateurs
 */

export const alertesTypeDefs = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  """
  Statut d'une alerte
  """
  enum StatutAlerte {
    ACTIVE
    RESOLUE
    IGNOREE
  }

  """
  Priorité d'une alerte
  """
  enum PrioriteAlerte {
    BASSE
    NORMALE
    HAUTE
    CRITIQUE
  }

  # ==========================================
  # TYPES
  # ==========================================

  """
  Type d'alerte (configuration)
  """
  type AlerteType {
    """ID du type d'alerte"""
    id: Int!

    """Nom du type d'alerte"""
    nom: String!

    """Code unique du type d'alerte"""
    code: String!

    """Description du type d'alerte"""
    description: String!

    """Priorité par défaut"""
    priorite: PrioriteAlerte!

    """Nombre d'alertes actives de ce type"""
    nombreActives: Int
  }

  """
  Alerte utilisateur active
  """
  type AlerteActive {
    """ID de l'alerte"""
    id: Int!

    """ID de l'utilisateur concerné"""
    utilisateurId: Int!

    """Type d'alerte"""
    typeAlerte: String!

    """Code de l'alerte"""
    code: String!

    """Description de l'alerte"""
    description: String!

    """Priorité de l'alerte"""
    priorite: PrioriteAlerte!

    """Données contextuelles (JSON)"""
    donneesContexte: JSON

    """Date de détection de l'alerte"""
    dateDetection: DateTime!

    """Nom complet de l'utilisateur"""
    nomUtilisateur: String!

    """Email de l'utilisateur"""
    email: String!

    """Statut de l'utilisateur"""
    statusId: Int!
  }

  """
  Alerte utilisateur complète
  """
  type AlerteUtilisateur {
    """ID de l'alerte"""
    id: Int!

    """ID de l'utilisateur"""
    utilisateurId: Int!

    """ID du type d'alerte"""
    alerteTypeId: Int!

    """Type d'alerte (relation)"""
    typeAlerte: AlerteType

    """Statut de l'alerte"""
    statut: StatutAlerte!

    """Données contextuelles (JSON)"""
    donneesContexte: JSON

    """Date de détection"""
    dateDetection: DateTime!

    """Date de résolution (si applicable)"""
    dateResolution: DateTime

    """Notes de résolution/ignorement"""
    notes: String

    """ID de l'utilisateur qui a résolu l'alerte"""
    resoluPar: Int

    """Nom de l'utilisateur qui a résolu"""
    resoluParNom: String
  }

  """
  Élément du dashboard des alertes
  """
  type DashboardAlerte {
    """Type d'alerte"""
    typeAlerte: String!

    """Code de l'alerte"""
    code: String!

    """Priorité"""
    priorite: PrioriteAlerte!

    """Nombre d'alertes de ce type"""
    nombreAlertes: Int!

    """Nombre d'utilisateurs affectés"""
    utilisateursAffectes: Int!
  }

  """
  Statistiques globales des alertes
  """
  type StatistiquesAlertes {
    """Nombre total d'alertes (30 derniers jours)"""
    totalAlertes: Int!

    """Nombre d'alertes actives"""
    alertesActives: Int!

    """Nombre d'alertes résolues"""
    alertesResolues: Int!

    """Nombre d'alertes critiques actives"""
    alertesCritiques: Int!

    """Taux de résolution (%)"""
    tauxResolution: Float

    """Temps moyen de résolution (en heures)"""
    tempsMoyenResolution: Float
  }

  """
  Résultat de détection d'alertes
  """
  type DetectionResult {
    """Succès de l'opération"""
    success: Boolean!

    """Message de confirmation"""
    message: String!

    """Nombre d'alertes détectées"""
    nombreAlertesDetectees: Int
  }

  """
  Résultat d'une action sur une alerte
  """
  type AlerteActionResult {
    """Succès de l'opération"""
    success: Boolean!

    """Message de confirmation"""
    message: String!

    """Alerte mise à jour (optionnelle)"""
    alerte: AlerteUtilisateur
  }

  """
  Liste paginée d'alertes actives
  """
  type AlertesActivesResult {
    """Liste des alertes"""
    alertes: [AlerteActive!]!

    """Nombre total d'alertes"""
    total: Int!

    """Page actuelle"""
    page: Int!

    """Nombre total de pages"""
    totalPages: Int!
  }

  """
  Détails d'une alerte avec historique
  """
  type AlerteDetails {
    """Alerte principale"""
    alerte: AlerteUtilisateur!

    """Utilisateur concerné"""
    utilisateur: AlerteUtilisateurInfo

    """Historique des actions"""
    historique: [AlerteHistorique!]
  }

  """
  Informations utilisateur pour une alerte
  """
  type AlerteUtilisateurInfo {
    """ID de l'utilisateur"""
    id: Int!

    """Prénom"""
    firstName: String!

    """Nom"""
    lastName: String!

    """Nom complet"""
    fullName: String!

    """Email"""
    email: String!

    """Statut"""
    statusId: Int!

    """Grade"""
    gradeId: Int
  }

  """
  Entrée d'historique d'alerte
  """
  type AlerteHistorique {
    """Date de l'action"""
    date: DateTime!

    """Action effectuée"""
    action: String!

    """Utilisateur qui a effectué l'action"""
    effectuePar: String

    """Notes/détails"""
    notes: String
  }

  # ==========================================
  # INPUTS
  # ==========================================

  """
  Filtres pour les alertes actives
  """
  input AlertesActivesFilter {
    """Filtrer par priorité"""
    priorite: PrioriteAlerte

    """Filtrer par type d'alerte (code)"""
    typeCode: String

    """Filtrer par utilisateur"""
    utilisateurId: Int

    """Recherche textuelle"""
    search: String
  }

  """
  Pagination pour les listes
  """
  input PaginationInput {
    """Numéro de page (commence à 1)"""
    page: Int

    """Nombre d'éléments par page"""
    limit: Int
  }

  """
  Données pour résoudre une alerte
  """
  input ResoudreAlerteInput {
    """ID de l'alerte"""
    alerteId: Int!

    """Notes de résolution"""
    notes: String!

    """ID de l'utilisateur qui résout"""
    effectuePar: Int!
  }

  """
  Données pour ignorer une alerte
  """
  input IgnorerAlerteInput {
    """ID de l'alerte"""
    alerteId: Int!

    """Raison de l'ignorement"""
    notes: String!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    """
    Récupère le dashboard des alertes avec vue d'ensemble
    Nécessite une authentification (admin/manager)
    """
    alertesDashboard: [DashboardAlerte!]!

    """
    Récupère toutes les alertes actives avec pagination et filtres
    Nécessite une authentification (admin/manager)
    """
    alertesActives(
      filter: AlertesActivesFilter
      pagination: PaginationInput
    ): AlertesActivesResult!

    """
    Récupère les alertes d'un utilisateur spécifique
    Nécessite une authentification
    """
    alertesUtilisateur(userId: Int!): [AlerteUtilisateur!]!

    """
    Récupère une alerte spécifique avec détails complets
    Nécessite une authentification
    """
    alerteDetails(alerteId: Int!): AlerteDetails!

    """
    Récupère les statistiques globales des alertes
    Nécessite une authentification (admin/manager)
    """
    statistiquesAlertes: StatistiquesAlertes!

    """
    Récupère tous les types d'alertes disponibles
    """
    typesAlertes: [AlerteType!]!

    """
    Récupère les alertes critiques urgentes
    Nécessite une authentification
    """
    alertesCritiques: [AlerteActive!]!

    """
    Compte le nombre d'alertes actives par utilisateur
    Nécessite une authentification
    """
    nombreAlertesParUtilisateur(userId: Int!): Int!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    """
    Déclenche la détection automatique des alertes pour tous les utilisateurs
    Nécessite une authentification (admin)
    """
    detecterAlertes: DetectionResult!

    """
    Résout une alerte spécifique avec notes et tracking
    Nécessite une authentification
    """
    resoudreAlerte(input: ResoudreAlerteInput!): AlerteActionResult!

    """
    Ignore une alerte (la marque comme non pertinente)
    Nécessite une authentification
    """
    ignorerAlerte(input: IgnorerAlerteInput!): AlerteActionResult!

    """
    Réactive une alerte précédemment ignorée ou résolue
    Nécessite une authentification (admin)
    """
    reactiverAlerte(alerteId: Int!): AlerteActionResult!

    """
    Résout toutes les alertes d'un type spécifique en masse
    Nécessite une authentification (admin)
    """
    resoudreAlertesEnMasse(
      typeCode: String!
      notes: String!
      effectuePar: Int!
    ): DetectionResult!

    """
    Supprime les alertes résolues anciennes (nettoyage)
    Nécessite une authentification (admin)
    """
    nettoyerAlertesAnciennes(joursAConserver: Int!): DetectionResult!
  }

  # ==========================================
  # SUBSCRIPTIONS (Future)
  # ==========================================

  # extend type Subscription {
  #   """
  #   S'abonne aux nouvelles alertes en temps réel
  #   """
  #   nouvelleAlerte: AlerteActive!
  #
  #   """
  #   S'abonne aux alertes critiques uniquement
  #   """
  #   alerteCritique: AlerteActive!
  # }
`;
