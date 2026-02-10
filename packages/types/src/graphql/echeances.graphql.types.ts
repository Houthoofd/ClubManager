/**
 * TypeDefs GraphQL pour le module Écheances
 * ✅ Centralisés dans @clubmanager/types
 *
 * @package @clubmanager/types
 */

export const echeancesTypeDefs = `#graphql
  """
  Échéance de paiement
  """
  type Echeance {
    id: Int!
    utilisateur_id: Int!
    abonnement_id: Int
    montant: Float!
    date_echeance: String!
    date_paiement: String
    statut: StatutEcheance!
    description: String
    created_at: String
    updated_at: String
  }

  """
  Détail complet d'une échéance
  """
  type EcheanceDetail {
    id: Int!
    utilisateur_id: Int!
    utilisateur_nom: String
    utilisateur_prenom: String
    utilisateur_email: String
    abonnement_id: Int
    abonnement_nom: String
    montant: Float!
    date_echeance: String!
    date_paiement: String
    statut: StatutEcheance!
    description: String
    created_at: String
    updated_at: String
    retard_jours: Int
  }

  """
  Statut d'une échéance
  """
  enum StatutEcheance {
    EN_ATTENTE
    PAYE
    ECHU
    ANNULE
  }

  """
  Statistiques des échéances d'un utilisateur
  """
  type StatistiquesEcheances {
    utilisateur_id: Int!
    total_echeances: Int!
    total_montant: Float!
    echeances_payees: Int!
    montant_paye: Float!
    echeances_en_attente: Int!
    montant_en_attente: Float!
    echeances_echues: Int!
    montant_echu: Float!
    taux_paiement: Float!
    prochain_paiement: String
    prochain_montant: Float
  }

  """
  Diagnostic d'une échéance
  """
  type DiagnosticEcheance {
    echeance_id: Int!
    existe: Boolean!
    statut: String
    jours_retard: Int
    montant: Float
    utilisateur_id: Int
    problemes: [String!]!
    recommandations: [String!]!
  }

  """
  Résultat de création/modification d'échéance
  """
  type EcheanceResult {
    success: Boolean!
    message: String!
    echeance: Echeance
  }

  """
  Résultat de suppression d'échéance
  """
  type DeleteEcheanceResult {
    success: Boolean!
    message: String!
    echeance_id: Int!
  }

  """
  Input pour créer une échéance
  """
  input CreateEcheanceInput {
    utilisateur_id: Int!
    abonnement_id: Int
    montant: Float!
    date_echeance: String!
    description: String
    statut: StatutEcheance
  }

  """
  Input pour mettre à jour une échéance
  """
  input UpdateEcheanceInput {
    abonnement_id: Int
    montant: Float
    date_echeance: String
    date_paiement: String
    statut: StatutEcheance
    description: String
  }

  """
  Filtres pour rechercher des échéances
  """
  input EcheancesFiltersInput {
    statut: StatutEcheance
    date_debut: String
    date_fin: String
    montant_min: Float
    montant_max: Float
  }

  extend type Query {
    """
    Obtenir toutes les échéances d'un utilisateur
    Requiert: Authentification (utilisateur ou admin)
    """
    echeancesUtilisateur(
      utilisateurId: Int!
      filters: EcheancesFiltersInput
    ): [EcheanceDetail!]!

    """
    Obtenir le détail d'une échéance
    Requiert: Authentification (utilisateur ou admin)
    """
    echeanceDetail(echeanceId: Int!): EcheanceDetail!

    """
    Obtenir les statistiques des échéances d'un utilisateur
    Requiert: Authentification (utilisateur ou admin)
    """
    statistiquesEcheances(utilisateurId: Int!): StatistiquesEcheances!

    """
    Diagnostic d'une échéance
    Requiert: Authentification + Admin
    """
    diagnosticEcheance(echeanceId: Int!): DiagnosticEcheance!

    """
    Santé du service échéances
    """
    echeancesHealth: HealthStatus!
  }

  extend type Mutation {
    """
    Créer une nouvelle échéance
    Requiert: Authentification + Admin
    """
    creerEcheance(input: CreateEcheanceInput!): EcheanceResult!

    """
    Mettre à jour une échéance
    Requiert: Authentification + Admin
    """
    modifierEcheance(
      echeanceId: Int!
      input: UpdateEcheanceInput!
    ): EcheanceResult!

    """
    Supprimer une échéance
    Requiert: Authentification + Admin
    """
    supprimerEcheance(echeanceId: Int!): DeleteEcheanceResult!

    """
    Marquer une échéance comme payée
    Requiert: Authentification + Admin
    """
    marquerEcheancePayee(echeanceId: Int!): EcheanceResult!
  }

  """
  Statut de santé générique
  """
  type HealthStatus {
    status: String!
    timestamp: String!
    service: String!
  }
`;
