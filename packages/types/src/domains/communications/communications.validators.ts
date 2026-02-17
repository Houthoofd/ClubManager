import { z } from 'zod';

/**
 * messages
 */
export const messagesSchema = z.object({
  id: z.number(),
  sender_id: z.number(),
  recipient_id: z.number(),
  subject: z.string().nullable().optional(),
  content: z.string(),
  is_read: z.boolean().nullable().optional(),
  read_at: z.string().nullable().optional(),
  parent_id: z.number().nullable().optional(), // Pour les fils de discussion
  sent_at: z.string().nullable().optional(),
});

export const messagesCreateSchema = messagesSchema.omit({ id: true });

export const messagesUpdateSchema = messagesSchema.partial().omit({ id: true });


/**
 * announcements
 */
export const announcementsSchema = z.object({
  id: z.number(),
  author_id: z.number(),
  title: z.string(),
  content: z.string(),
  priority: z.enum(["low", "normal", "high", "urgent"]).nullable().optional(),
  target_audience: z.enum(["all", "members", "instructors", "admins"]).nullable().optional(),
  published_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const announcementsCreateSchema = announcementsSchema.omit({ id: true, created_at: true });

export const announcementsUpdateSchema = announcementsSchema.partial().omit({ id: true });


/**
 * notifications
 */
export const notificationsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  type: z.string(), // Type de notification (message, payment, session, etc.)
  title: z.string(),
  content: z.string(),
  action_url: z.string().nullable().optional(), // URL vers l'action concernée
  is_read: z.boolean().nullable().optional(),
  read_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const notificationsCreateSchema = notificationsSchema.omit({ id: true, created_at: true });

export const notificationsUpdateSchema = notificationsSchema.partial().omit({ id: true });


/**
 * email_logs
 */
export const emailLogsSchema = z.object({
  id: z.number(),
  user_id: z.number().nullable().optional(),
  recipient_email: z.string(),
  recipient_name: z.string().nullable().optional(),
  email_type: z.enum(["welcome", "verification", "password_reset", "invoice", "receipt", "event_confirmation", "session_reminder", "newsletter", "announcement", "other"]),
  subject: z.string(),
  body: z.string(),
  status: z.enum(["pending", "sent", "failed", "bounced"]).nullable().optional(),
  sent_at: z.string().nullable().optional(),
  failed_reason: z.string().nullable().optional(),
  template_used: z.string().nullable().optional(), // Nom du template utilisé
  metadata: z.record(z.any()).nullable().optional(), // Données additionnelles (variables template, tracking, etc.)
  created_at: z.string().nullable().optional(),
});

export const emailLogsCreateSchema = emailLogsSchema.omit({ id: true, created_at: true });

export const emailLogsUpdateSchema = emailLogsSchema.partial().omit({ id: true });


/**
 * email_templates
 */
export const emailTemplatesSchema = z.object({
  id: z.number(),
  name: z.string(), // Nom du template
  slug: z.string(), // Identifiant unique (ex: welcome-email)
  description: z.string().nullable().optional(),
  email_type: z.enum(["welcome", "verification", "password_reset", "invoice", "receipt", "event_confirmation", "session_reminder", "newsletter", "announcement", "other"]),
  subject: z.string(), // Sujet du mail (peut contenir des variables {{name}})
  body_html: z.string(), // Corps HTML du mail avec variables {{variable}}
  body_text: z.string().nullable().optional(), // Version texte brut (fallback)
  variables: z.record(z.any()).nullable().optional(), // Liste des variables disponibles: [
  active: z.boolean().nullable().optional(),
  is_default: z.boolean().nullable().optional(), // Template par défaut pour ce type d'email
  created_by: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const emailTemplatesCreateSchema = emailTemplatesSchema.omit({ id: true, created_at: true, updated_at: true });

export const emailTemplatesUpdateSchema = emailTemplatesSchema.partial().omit({ id: true });


/**
 * alerts
 */
export const alertsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  alert_type: z.enum(["membership_expiring", "payment_due", "payment_overdue", "session_cancelled", "profile_incomplete", "document_expiring", "birthday", "achievement", "account_security", "system"]),
  severity: z.enum(["info", "warning", "critical"]).nullable().optional(),
  title: z.string(),
  message: z.string(),
  action_required: z.boolean().nullable().optional(), // Nécessite une action de l'utilisateur
  action_url: z.string().nullable().optional(), // Lien vers l'action à effectuer
  reference_type: z.string().nullable().optional(), // Type d'entité liée (membership, payment, session, etc.)
  reference_id: z.number().nullable().optional(), // ID de l'entité liée
  is_read: z.boolean().nullable().optional(),
  read_at: z.string().nullable().optional(),
  is_dismissed: z.boolean().nullable().optional(),
  dismissed_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(), // Date d'expiration de l'alerte
  email_sent: z.boolean().nullable().optional(), // Email d'alerte envoyé
  created_at: z.string().nullable().optional(),
});

export const alertsCreateSchema = alertsSchema.omit({ id: true, created_at: true });

export const alertsUpdateSchema = alertsSchema.partial().omit({ id: true });


