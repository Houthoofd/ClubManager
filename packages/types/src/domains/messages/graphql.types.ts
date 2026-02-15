/**
 * Schema GraphQL TypeDefs pour le module Messages
 * ✅ Définition centralisée des types, queries et mutations pour les messages personnalisés
 *
 * @package @clubmanager/types
 */

export const messagesTypeDefs = `#graphql
  """
  Type représentant un message personnalisé
  """
  type Message {
    id: Int!
    expediteur_id: Int
    destinataire_id: Int!
    type_message_id: Int!
    contenu: String!
    date_envoi: String!
    lu: Boolean!
    date_lecture: String
    supprime: Boolean!
    date_suppression: String
    actif: Boolean!
  }

  """
  Type représentant un type de message
  """
  type TypeMessage {
    id: Int!
    title: String!
    content: String!
    created_at: String
    updated_at: String
  }

  """
  Résultat de l'envoi d'un message avec détails
  """
  type EnvoiMessageResult {
    success: Boolean!
    message: String!
    data: EnvoiMessageData
  }

  """
  Données détaillées de l'envoi d'un message
  """
  type EnvoiMessageData {
    messagesInternes: Int!
    emailsEnvoyes: Int!
    typeMessage: TypeMessage
    details: EnvoiMessageDetails!
  }

  """
  Détails de l'envoi avec statistiques emails
  """
  type EnvoiMessageDetails {
    totalDestinataires: Int!
    emailsEnvoyes: Int!
    emailsEchecs: Int!
    emailsDetails: [EmailDetail!]!
  }

  """
  Détail de l'envoi d'un email individuel
  """
  type EmailDetail {
    email: String!
    success: Boolean!
    messageId: String
    error: String
  }

  """
  Statistiques des messages
  """
  type MessageStatistiques {
    totalMessages: Int!
    messagesNonLus: Int!
    messagesLus: Int!
    messagesSupprimes: Int!
    periode: String!
  }

  """
  Résultat du comptage des messages non lus
  """
  type MessageNonLusCount {
    success: Boolean!
    count: Int!
    userId: Int!
  }

  """
  Résultat d'une opération sur un message
  """
  type MessageOperationResult {
    success: Boolean!
    message: String!
  }

  """
  Résultat de l'envoi de rappel de paiement
  """
  type RappelPaiementResult {
    success: Boolean!
    message: String!
    data: RappelPaiementData
  }

  """
  Données du rappel de paiement
  """
  type RappelPaiementData {
    echeancesTraitees: Int!
    emailsEnvoyes: Int!
    erreurs: [String!]
  }

  """
  Queries pour les messages
  """
  extend type Query {
    """
    Récupérer les messages reçus par un utilisateur
    Retourne la liste des messages reçus, non supprimés
    """
    messagesRecus(userId: Int!): [Message!]!

    """
    Récupérer les messages supprimés par un utilisateur
    """
    messagesSupprimes(userId: Int!, limit: Int): [Message!]!

    """
    Récupérer les messages inactifs (Admin uniquement)
    """
    messagesInactifs: [Message!]!

    """
    Compter les messages non lus d'un utilisateur
    """
    compterMessagesNonLus(userId: Int!): MessageNonLusCount!

    """
    Récupérer les statistiques des messages
    """
    statistiquesMessages(periode: String, userId: Int): MessageStatistiques!

    """
    Récupérer tous les types de messages (Admin uniquement)
    """
    typesMessages: [TypeMessage!]!

    """
    Récupérer un type de message par son ID (Admin uniquement)
    """
    typeMessage(id: Int!): TypeMessage!
  }

  """
  Mutations pour les messages
  """
  extend type Mutation {
    """
    Envoyer un message personnalisé à plusieurs destinataires
    Peut également envoyer un email si demandé
    """
    envoyerMessage(
      destinataires: [Int!]!
      type_message_id: Int!
      envoyerEmail: Boolean
    ): EnvoiMessageResult!

    """
    Marquer un message comme lu
    """
    marquerMessageCommeLu(messageId: Int!): MessageOperationResult!

    """
    Supprimer un message (soft delete)
    """
    supprimerMessage(messageId: Int!, userId: Int!): MessageOperationResult!

    """
    Supprimer définitivement un message (hard delete, Admin uniquement)
    """
    supprimerDefinitivement(messageId: Int!): MessageOperationResult!

    """
    Restaurer un message supprimé
    """
    restaurerMessage(messageId: Int!): MessageOperationResult!

    """
    Désactiver un message (Admin uniquement)
    """
    desactiverMessage(messageId: Int!): MessageOperationResult!

    """
    Réactiver un message (Admin uniquement)
    """
    reactiverMessage(messageId: Int!): MessageOperationResult!

    """
    Envoyer un rappel de paiement (Admin uniquement)
    """
    envoyerRappelPaiement(
      echeanceIds: [Int!]!
      messagePersonnalise: String
    ): RappelPaiementResult!

    """
    Créer un nouveau type de message (Admin uniquement)
    """
    creerTypeMessage(
      title: String!
      content: String!
    ): MessageOperationResult!

    """
    Modifier un type de message existant (Admin uniquement)
    """
    modifierTypeMessage(
      id: Int!
      title: String!
      content: String!
    ): MessageOperationResult!

    """
    Supprimer un type de message (Admin uniquement)
    """
    supprimerTypeMessage(id: Int!): MessageOperationResult!
  }
`;

export default messagesTypeDefs;
