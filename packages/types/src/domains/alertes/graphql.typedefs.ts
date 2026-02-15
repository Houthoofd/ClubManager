/**
 * Schema GraphQL TypeDefs pour le module Alertes
 * ✅ Définition centralisée des types, queries et mutations pour les alertes système
 *
 * @package @clubmanager/types
 */

export const alertesTypeDefs = `#graphql
  """
  Type représentant une alerte système
  """
  type Alerte {
    id: Int!
    type: String!
    severite: String!
    message: String!
    utilisateur_id: Int
    statut: String!
    date_detection: String!
    date_resolution: String
    notes: String
  }

  """
  Dashboard des alertes avec statistiques globales
  """
  type AlerteDashboard {
    totalAlertes: Int!
    alertesCritiques: Int!
    alertesEnAttente: Int!
    alertesResolues: Int!
    alertesParType: JSON
    tendances: JSON
  }

  """
  Résultat d'une opération sur une alerte
  """
  type AlerteOperationResult {
    success: Boolean!
    message: String!
  }

  """
  Queries pour les alertes
  """
  extend type Query {
    """
    Récupérer le dashboard des alertes (Admin uniquement)
    Retourne les statistiques globales des alertes système
    """
    alertesDashboard: AlerteDashboard!

    """
    Récupérer toutes les alertes actives (Admin uniquement)
    Retourne la liste de toutes les alertes non résolues
    """
    alertesActives: [Alerte!]!

    """
    Récupérer les alertes d'un utilisateur spécifique (Admin uniquement)
    """
    alertesUtilisateur(userId: Int!): [Alerte!]!

    """
    Récupérer une alerte par son ID (Admin uniquement)
    """
    alerte(id: Int!): Alerte!
  }

  """
  Mutations pour les alertes
  """
  extend type Mutation {
    """
    Déclencher manuellement la détection des alertes (Admin uniquement)
    Lance le processus de détection de nouvelles alertes système
    """
    detecterAlertes: AlerteOperationResult!

    """
    Résoudre une alerte (Admin uniquement)
    Marque une alerte comme résolue avec des notes optionnelles
    """
    resoudreAlerte(
      alerteId: Int!
      notes: String
    ): AlerteOperationResult!

    """
    Ignorer une alerte (Admin uniquement)
    Marque une alerte comme ignorée avec des notes optionnelles
    """
    ignorerAlerte(
      alerteId: Int!
      notes: String
    ): AlerteOperationResult!
  }
`;

export default alertesTypeDefs;
