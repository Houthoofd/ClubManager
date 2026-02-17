import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # messages
  type Messages {
    id: Int!
    sender_id: Int!
    recipient_id: Int!
    subject: String
    content: String!
    is_read: Boolean
    read_at: String
    parent_id: Int # Pour les fils de discussion
    sent_at: String
  }

  # announcements
  type Announcements {
    id: Int!
    author_id: Int!
    title: String!
    content: String!
    priority: String
    target_audience: String
    published_at: String
    expires_at: String
    active: Boolean
    created_at: String
  }

  # notifications
  type Notifications {
    id: Int!
    user_id: Int!
    type: String! # Type de notification (message, payment, session, etc.)
    title: String!
    content: String!
    action_url: String # URL vers l'action concernée
    is_read: Boolean
    read_at: String
    created_at: String
  }

  # email_logs
  type EmailLogs {
    id: Int!
    user_id: Int
    recipient_email: String!
    recipient_name: String
    email_type: String!
    subject: String!
    body: String!
    status: String
    sent_at: String
    failed_reason: String
    template_used: String # Nom du template utilisé
    metadata: String # Données additionnelles (variables template, tracking, etc.)
    created_at: String
  }

  # email_templates
  type EmailTemplates {
    id: Int!
    name: String! # Nom du template
    slug: String! # Identifiant unique (ex: welcome-email)
    description: String
    email_type: String!
    subject: String! # Sujet du mail (peut contenir des variables {{name}})
    body_html: String! # Corps HTML du mail avec variables {{variable}}
    body_text: String # Version texte brut (fallback)
    variables: String # Liste des variables disponibles: [
    active: Boolean
    is_default: Boolean # Template par défaut pour ce type d'email
    created_by: Int
    created_at: String
    updated_at: String
  }

  # alerts
  type Alerts {
    id: Int!
    user_id: Int!
    alert_type: String!
    severity: String
    title: String!
    message: String!
    action_required: Boolean # Nécessite une action de l'utilisateur
    action_url: String # Lien vers l'action à effectuer
    reference_type: String # Type d'entité liée (membership, payment, session, etc.)
    reference_id: Int # ID de l'entité liée
    is_read: Boolean
    read_at: String
    is_dismissed: Boolean
    dismissed_at: String
    expires_at: String # Date d'expiration de l'alerte
    email_sent: Boolean # Email d'alerte envoyé
    created_at: String
  }

`;
