/**
 * Définitions de types GraphQL pour le module Messages
 */

export const messagesTypeDefs = `#graphql
  """
  Type de message personnalisé
  """
  type TypeMessagePersonnalise {
    id: Int!
    nom_type: String!
    description: String
    actif: Boolean!
    created_at: String
    updated_at: String
  }

  """
  Message personnalisé
  """
  type MessagePersonnalise {
    id: Int!
    titre: String!
    contenu: String!
    type_id: Int!
    expediteur_id: Int!
    destinataire_id: Int!
    lu: Boolean!
    supprime: Boolean!
    created_at: String
    updated_at: String
  }

  """
  Message personnalisé avec détails des relations
  """
  type MessagePersonnaliseAvecDetails {
    id: Int!
    titre: String!
    contenu: String!
    type_nom: String!
    expediteur_nom: String!
    expediteur_prenom: String!
    destinataire_nom: String!
    destinataire_prenom: String!
    lu: Boolean!
    supprime: Boolean!
    created_at: String
  }

  """
  Historique des messages (emails)
  """
  type HistoriqueMessage {
    id: Int!
    utilisateur_id: Int!
    type_message: String!
    contenu: String!
    status_envoi: MessageStatus!
    email_recipient: String!
    message_id: String
    error_message: String
    created_at: String
    updated_at: String
  }

  """
  Template d'email
  """
  type EmailTemplate {
    id: Int!
    nom_template: String!
    sujet: String!
    contenu_html: String!
    contenu_texte: String
    variables_disponibles: String
    actif: Boolean!
    created_at: String
    updated_at: String
  }

  """
  Statistiques des messages
  """
  type MessageStatistiques {
    total: Int!
    envoyes: Int!
    lus: Int!
    non_lus: Int!
    supprimes: Int!
  }

  """
  Statistiques de suppression
  """
  type StatistiquesSuppressions {
    total_supprimes: Int!
    derniere_suppression: String
  }

  """
  Résultat d'envoi de message
  """
  type SendMessageResult {
    isConfirm: Boolean!
    message: String!
    messageId: Int
  }

  """
  Résultat de recherche de messages
  """
  type MessageSearchResult {
    isFind: Boolean!
    message: String!
    data: [MessagePersonnaliseAvecDetails!]
  }

  """
  Résultat de confirmation
  """
  type ConfirmationResult {
    isConfirm: Boolean!
    message: String!
  }

  """
  Résultat d'envoi avec emails
  """
  type SendMessageAvecEmailsResult {
    messagesInternes: ConfirmationResult!
    emailsEnvoyes: EmailsEnvoyesStats!
  }

  """
  Statistiques d'envoi d'emails
  """
  type EmailsEnvoyesStats {
    total: Int!
    reussis: Int!
    echecs: Int!
    details: [EmailSendDetail!]!
  }

  """
  Détail d'envoi d'email
  """
  type EmailSendDetail {
    id: Int!
    email: String!
    nom: String!
    success: Boolean!
    messageId: String
    error: String
  }

  """
  Résultat d'email
  """
  type EmailResult {
    success: Boolean!
    messageId: String
    error: String
  }

  """
  Status d'envoi d'un message
  """
  enum MessageStatus {
    PENDING
    SENT
    FAILED
  }

  """
  Types de messages prédéfinis
  """
  enum TypeMessage {
    BIENVENUE
    VALIDATION
    RECUPERATION
    RAPPEL_PAIEMENT
    NOTIFICATION
    ALERTE
    INFORMATION
  }

  """
  Input pour créer un type de message
  """
  input CreateTypeMessageInput {
    nom_type: String!
    description: String
    actif: Boolean
  }

  """
  Input pour modifier un type de message
  """
  input UpdateTypeMessageInput {
    nom_type: String
    description: String
    actif: Boolean
  }

  """
  Input pour envoyer un message personnalisé
  """
  input SendMessagePersonnaliseInput {
    titre: String!
    contenu: String!
    type_id: Int!
    expediteur_id: Int!
    destinataire_id: Int!
  }

  """
  Input pour envoyer un message avec emails
  """
  input SendMessageAvecEmailsInput {
    titre: String!
    contenu: String!
    type_id: Int!
    expediteur_id: Int!
    destinataires_ids: [Int!]!
    envoyer_email: Boolean
  }

  """
  Input pour l'email de bienvenue
  """
  input WelcomeEmailInput {
    userId: Int!
    email: String!
    userName: String!
    firstName: String!
    lastName: String!
  }

  """
  Input pour l'email de validation
  """
  input ValidationEmailInput {
    userId: Int!
    email: String!
    prenom: String!
    confirmationToken: String!
  }

  """
  Input pour l'email de récupération
  """
  input RecoveryEmailInput {
    userId: Int!
    email: String!
    prenom: String!
  }

  """
  Input pour l'email de rappel de paiement
  """
  input RappelPaiementEmailInput {
    receiverId: Int
    echeanceIds: [Int!]!
    montant: Float
    dateEcheance: String
  }

  """
  Requêtes GraphQL pour les messages
  """
  type Query {
    """
    Récupérer tous les types de messages actifs
    """
    getAllTypesMessages: MessageSearchResult!

    """
    Récupérer un type de message par ID
    """
    getTypeMessageById(typeId: Int!): TypeMessagePersonnalise

    """
    Récupérer les messages reçus par un utilisateur
    """
    getMessagesRecusParUtilisateur(utilisateurId: Int!): MessageSearchResult!

    """
    Compter les messages non lus d'un utilisateur
    """
    compterMessagesNonLus(utilisateurId: Int!): Int!

    """
    Récupérer les messages inactifs
    """
    getMessagesInactifs: MessageSearchResult!

    """
    Récupérer les messages supprimés
    """
    getMessagesSupprimes: MessageSearchResult!

    """
    Obtenir les statistiques des messages
    """
    getStatistiquesMessages: MessageStatistiques!

    """
    Obtenir les statistiques de suppression
    """
    getStatistiquesSuppressions: StatistiquesSuppressions!

    """
    Récupérer l'historique des messages d'un utilisateur
    """
    getMessageHistory(utilisateurId: Int!, limit: Int, offset: Int): [HistoriqueMessage!]!

    """
    Récupérer tous les templates actifs
    """
    getAllTemplates: [EmailTemplate!]!

    """
    Récupérer un template par nom
    """
    getTemplateByName(nomTemplate: String!): EmailTemplate
  }

  """
  Mutations GraphQL pour les messages
  """
  type Mutation {
    """
    Créer un nouveau type de message
    """
    creerTypeMessage(input: CreateTypeMessageInput!): SendMessageResult!

    """
    Modifier un type de message
    """
    modifierTypeMessage(typeId: Int!, input: UpdateTypeMessageInput!): ConfirmationResult!

    """
    Supprimer un type de message
    """
    supprimerTypeMessage(typeId: Int!): ConfirmationResult!

    """
    Envoyer un message personnalisé
    """
    envoyerMessage(input: SendMessagePersonnaliseInput!): SendMessageResult!

    """
    Envoyer un message avec emails
    """
    envoyerMessageAvecEmails(input: SendMessageAvecEmailsInput!): SendMessageAvecEmailsResult!

    """
    Marquer un message comme lu
    """
    marquerMessageCommeLu(messageId: Int!): ConfirmationResult!

    """
    Supprimer un message reçu
    """
    supprimerMessageRecu(messageId: Int!): ConfirmationResult!

    """
    Restaurer un message supprimé
    """
    restaurerMessage(messageId: Int!): ConfirmationResult!

    """
    Supprimer définitivement un message
    """
    supprimerDefinitivementMessage(messageId: Int!): ConfirmationResult!

    """
    Désactiver un message
    """
    desactiverMessage(messageId: Int!): ConfirmationResult!

    """
    Réactiver un message
    """
    reactiverMessage(messageId: Int!): ConfirmationResult!

    """
    Envoyer un email de bienvenue
    """
    envoyerEmailBienvenue(input: WelcomeEmailInput!): EmailResult!

    """
    Envoyer un email de validation
    """
    envoyerValidationEmail(input: ValidationEmailInput!): EmailResult!

    """
    Envoyer un email de récupération
    """
    envoyerRecuperationUserId(input: RecoveryEmailInput!): EmailResult!

    """
    Envoyer un rappel de paiement avec email
    """
    envoyerRappelPaiementAvecEmail(input: RappelPaiementEmailInput!): EmailResult!
  }
`;
