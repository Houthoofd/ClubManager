/**
 * TypeDefs GraphQL pour le module Confirmation
 * ✅ Centralisés dans @clubmanager/types
 *
 * @package @clubmanager/types
 */

export const confirmationTypeDefs = `#graphql
  """
  Résultat de la confirmation de paiement d'échéance
  """
  type ConfirmationPaiementResult {
    success: Boolean!
    message: String!
    paiement_id: String!
    echeance_id: Int!
    premier_paiement: Boolean!
    statut_upgrade: String
    echeance_confirmee: Boolean!
    already_paid: Boolean
    duplicate_resolved: Boolean
    error_handled: Boolean
  }

  """
  Résultat de la confirmation de paiement de commande
  """
  type ConfirmationCommandeResult {
    success: Boolean!
    message: String!
    payment_intent_id: String!
    commande_id: Int!
    stripe_status: String!
    database_updated: Boolean!
    email_envoye: Boolean!
    timestamp: String!
    commande_info: CommandeInfo
  }

  """
  Informations sur la commande confirmée
  """
  type CommandeInfo {
    statut_mis_a_jour: String!
    table_structure: String
    date_paiement_tracee_dans: String
  }

  """
  Input pour confirmer un paiement d'échéance
  """
  input ConfirmPaymentInput {
    paymentIntentId: String!
    echeanceId: Int!
    userId: Int!
    amount: Float!
  }

  """
  Input pour confirmer un paiement de commande
  """
  input ConfirmPaymentCommandeInput {
    paymentIntentId: String!
    commandeId: Int!
    userId: Int!
    amount: Float
  }

  """
  Statut de santé du service de confirmation
  """
  type ConfirmationHealthStatus {
    status: String!
    timestamp: String!
    service: String!
  }

  extend type Query {
    """
    Vérifier le statut de santé du service de confirmation
    """
    confirmationHealth: ConfirmationHealthStatus!
  }

  extend type Mutation {
    """
    Confirmer un paiement d'échéance
    Requiert: Authentification utilisateur
    """
    confirmPayment(input: ConfirmPaymentInput!): ConfirmationPaiementResult!

    """
    Confirmer un paiement de commande
    Requiert: Authentification utilisateur
    """
    confirmPaymentCommande(input: ConfirmPaymentCommandeInput!): ConfirmationCommandeResult!
  }
`;
