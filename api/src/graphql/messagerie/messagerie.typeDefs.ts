/**
 * Définitions de types GraphQL pour le module Messagerie
 */

export const messagerieTypeDefs = `#graphql
  """
  Type de message personnalisé
  """
  type TypeMessage {
    id: Int!
    title: String!
    content: String!
    created_at: String
    updated_at: String
  }

  """
  Message personnalisé
  """
  type MessagePersonnalise {
    id: Int!
    utilisateur_id: Int!
    contenu: String!
    lu: Boolean
    created_at: String!
    updated_at: String
  }

  """
  Message avec informations expéditeur
  """
  type MessageAvecExpediteur {
    id: Int!
    content: String!
    date_reception: String!
    expediteur_prenom: String!
    expediteur_nom: String!
    title: String!
    lu: Boolean!
  }

  """
  Historique d'un message envoyé
  """
  type HistoriqueMessage {
    id: Int!
    utilisateur_id: Int
    type_message: String!
    sujet: String!
    contenu: String!
    recipients: String!
    status: MessageStatus!
    error_message: String
    created_at: String!
    sent_at: String
    user_email: String
    user_name: String
  }

  """
  Statut d'un message
  """
  enum MessageStatus {
    pending
    sent
    failed
  }

  """
  Utilisateur pour la messagerie
  """
  type UtilisateurMessagerie {
    id: Int!
    userId: String!
    full_name: String!
    first_name: String!
    last_name: String!
    email: String!
    status: String
  }

  """
  Template d'email
  """
  type EmailTemplate {
    id: Int!
    title: String!
    subject: String!
    body: String!
    variables: [String!]
    created_at: String
    updated_at: String
  }

  """
  Statistiques de la messagerie
  """
  type StatistiquesMessagerie {
    totalTypesMessages: Int!
    totalMessagesEnvoyes: Int!
    messagesUtilisateur: Int
    messagesParJour: [MessageParJour!]!
    messagesParStatut: [MessageParStatut!]!
  }

  """
  Messages envoyés par jour
  """
  type MessageParJour {
    date: String!
    count: Int!
  }

  """
  Messages par statut
  """
  type MessageParStatut {
    status: String!
    count: Int!
  }

  """
  Résultat de confirmation d'opération
  """
  type ConfirmationResult {
    isConfirm: Boolean!
    message: String!
    insertId: Int
  }

  """
  Résultat d'envoi de message
  """
  type EnvoiMessageResult {
    success: Boolean!
    message: String!
    messageId: Int
    historiqueId: Int
  }

  """
  Résultat d'envoi d'email
  """
  type EnvoiEmailResult {
    success: Boolean!
    message: String!
    messageId: String
    historiqueId: Int
  }

  """
  Entrée pour créer un type de message
  """
  input CreateTypeMessageInput {
    title: String!
    content: String!
  }

  """
  Entrée pour mettre à jour un type de message
  """
  input UpdateTypeMessageInput {
    title: String
    content: String
  }

  """
  Entrée pour créer un message personnalisé
  """
  input CreateMessagePersonnaliseInput {
    utilisateur_id: Int!
    contenu: String!
  }

  """
  Entrée pour créer un template d'email
  """
  input CreateEmailTemplateInput {
    title: String!
    subject: String!
    body: String!
    variables: [String!]
  }

  """
  Entrée pour mettre à jour un template d'email
  """
  input UpdateEmailTemplateInput {
    title: String
    subject: String
    body: String
    variables: [String!]
  }

  """
  Entrée pour envoyer un email simple
  """
  input EnvoyerEmailSimpleInput {
    to: String!
    subject: String!
    text: String
    html: String
  }

  """
  Entrée pour envoyer un email avec template
  """
  input EnvoyerEmailTemplateInput {
    to: String!
    templateId: Int!
    variables: [EmailVariableInput!]
  }

  """
  Variable pour template d'email
  """
  input EmailVariableInput {
    key: String!
    value: String!
  }

  """
  Entrée pour envoyer un email de bienvenue
  """
  input EnvoyerEmailBienvenueInput {
    userId: Int!
    email: String!
    prenom: String!
  }

  """
  Entrée pour envoyer un email de confirmation
  """
  input EnvoyerEmailConfirmationInput {
    userId: Int!
    email: String!
    token: String!
  }

  """
  Options de pagination
  """
  input PaginationInput {
    limit: Int = 50
    offset: Int = 0
  }

  """
  Queries pour la messagerie
  """
  type Query {
    """
    Récupérer tous les types de messages
    """
    typesMessages: [TypeMessage!]!

    """
    Récupérer un type de message par son ID
    """
    typeMessage(id: Int!): TypeMessage

    """
    Récupérer un type de message par son titre
    """
    typeMessageParTitre(title: String!): TypeMessage

    """
    Récupérer tous les messages personnalisés
    """
    messagesPersonnalises(pagination: PaginationInput): [MessagePersonnalise!]!

    """
    Récupérer un message personnalisé par son ID
    """
    messagePersonnalise(id: Int!): MessagePersonnalise

    """
    Récupérer les messages d'un utilisateur
    """
    messagesUtilisateur(utilisateur_id: Int!): [MessagePersonnalise!]!

    """
    Récupérer les messages reçus d'un utilisateur
    """
    messagesRecus(userId: String!): [MessageAvecExpediteur!]!

    """
    Récupérer les messages non lus d'un utilisateur
    """
    messagesNonLus(userId: String!): [MessageAvecExpediteur!]!

    """
    Compter les messages non lus d'un utilisateur
    """
    compterMessagesNonLus(userId: String!): Int!

    """
    Récupérer l'historique des messages envoyés
    """
    historiqueMessages(pagination: PaginationInput): [HistoriqueMessage!]!

    """
    Récupérer l'historique des messages d'un utilisateur
    """
    historiqueMessagesUtilisateur(utilisateur_id: Int!, pagination: PaginationInput): [HistoriqueMessage!]!

    """
    Récupérer les messages par statut
    """
    messagesParStatut(status: MessageStatus!, pagination: PaginationInput): [HistoriqueMessage!]!

    """
    Récupérer tous les templates d'email
    """
    emailTemplates: [EmailTemplate!]!

    """
    Récupérer un template d'email par son ID
    """
    emailTemplate(id: Int!): EmailTemplate

    """
    Récupérer un template d'email par son titre
    """
    emailTemplateParTitre(title: String!): EmailTemplate

    """
    Récupérer les statistiques de la messagerie
    """
    statistiquesMessagerie(utilisateur_id: Int): StatistiquesMessagerie!

    """
    Récupérer tous les utilisateurs pour la messagerie
    """
    utilisateursMessagerie: [UtilisateurMessagerie!]!

    """
    Vérifier si un type de message existe
    """
    typeMessageExiste(title: String!): Boolean!

    """
    Vérifier si un template existe
    """
    emailTemplateExiste(title: String!): Boolean!
  }

  """
  Mutations pour la messagerie
  """
  type Mutation {
    """
    Créer un nouveau type de message
    """
    creerTypeMessage(input: CreateTypeMessageInput!): ConfirmationResult!

    """
    Mettre à jour un type de message
    """
    mettreAJourTypeMessage(id: Int!, input: UpdateTypeMessageInput!): ConfirmationResult!

    """
    Supprimer un type de message
    """
    supprimerTypeMessage(id: Int!): ConfirmationResult!

    """
    Créer un message personnalisé
    """
    creerMessagePersonnalise(input: CreateMessagePersonnaliseInput!): ConfirmationResult!

    """
    Envoyer un message personnalisé à un utilisateur
    """
    envoyerMessagePersonnalise(utilisateur_id: Int!, contenu: String!): EnvoiMessageResult!

    """
    Envoyer un message à tous les utilisateurs
    """
    envoyerMessageTousUtilisateurs(contenu: String!): EnvoiMessageResult!

    """
    Marquer un message comme lu
    """
    marquerMessageLu(id: Int!): ConfirmationResult!

    """
    Marquer tous les messages d'un utilisateur comme lus
    """
    marquerTousMessagesLus(userId: String!): ConfirmationResult!

    """
    Supprimer un message personnalisé
    """
    supprimerMessagePersonnalise(id: Int!): ConfirmationResult!

    """
    Créer un nouveau template d'email
    """
    creerEmailTemplate(input: CreateEmailTemplateInput!): ConfirmationResult!

    """
    Mettre à jour un template d'email
    """
    mettreAJourEmailTemplate(id: Int!, input: UpdateEmailTemplateInput!): ConfirmationResult!

    """
    Supprimer un template d'email
    """
    supprimerEmailTemplate(id: Int!): ConfirmationResult!

    """
    Envoyer un email simple
    """
    envoyerEmailSimple(input: EnvoyerEmailSimpleInput!): EnvoiEmailResult!

    """
    Envoyer un email avec template
    """
    envoyerEmailAvecTemplate(input: EnvoyerEmailTemplateInput!): EnvoiEmailResult!

    """
    Envoyer un email de bienvenue
    """
    envoyerEmailBienvenue(input: EnvoyerEmailBienvenueInput!): EnvoiEmailResult!

    """
    Envoyer un email de confirmation
    """
    envoyerEmailConfirmation(input: EnvoyerEmailConfirmationInput!): EnvoiEmailResult!

    """
    Renvoyer un email de confirmation
    """
    renvoyerEmailConfirmation(userId: Int!, email: String!): EnvoiEmailResult!
  }
`;
