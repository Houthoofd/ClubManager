import { z } from "zod";

/**
 * Validators Zod pour le module Messages
 * Centralisés dans @clubmanager/types
 *
 * @package @clubmanager/types
 */

/**
 * Schéma de validation pour l'envoi de messages personnalisés
 */
export const sendMessageSchema = z.object({
  destinataires: z
    .array(z.number().int().positive())
    .min(1, "Au moins un destinataire est requis")
    .max(1000, "Maximum 1000 destinataires par envoi"),
  type_message_id: z
    .number()
    .int()
    .positive("L'ID du type de message doit être un entier positif"),
  envoyerEmail: z.boolean().optional().default(true),
});

/**
 * Schéma de validation pour marquer un message comme lu
 */
export const markAsReadSchema = z.object({
  messageId: z
    .number()
    .int()
    .positive("L'ID du message doit être un entier positif"),
});

/**
 * Schéma de validation pour obtenir les messages d'un utilisateur
 */
export const getUserMessagesSchema = z.object({
  userId: z
    .number()
    .int()
    .positive("L'ID utilisateur doit être un entier positif"),
  limit: z.number().int().positive().optional().default(50),
});

/**
 * Schéma de validation pour la suppression d'un message
 */
export const deleteMessageSchema = z.object({
  messageId: z
    .number()
    .int()
    .positive("L'ID du message doit être un entier positif"),
  userId: z
    .number()
    .int()
    .positive("L'ID utilisateur doit être un entier positif"),
});

/**
 * Schéma de validation pour restaurer un message
 */
export const restoreMessageSchema = z.object({
  messageId: z
    .number()
    .int()
    .positive("L'ID du message doit être un entier positif"),
});

/**
 * Schéma de validation pour les statistiques de messages
 */
export const messageStatsSchema = z.object({
  periode: z.enum(["jour", "semaine", "mois"]).optional().default("mois"),
  userId: z.number().int().positive().optional(),
});

/**
 * Schéma de validation pour l'envoi de rappel de paiement
 */
export const sendPaymentReminderSchema = z.object({
  echeanceIds: z
    .union([
      z.array(z.number()),
      z.number(),
      z.string().transform((val) => {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          const num = parseInt(val);
          return isNaN(num) ? [] : [num];
        }
      }),
    ])
    .transform((val) => {
      if (Array.isArray(val)) {
        return val.filter(
          (id) =>
            typeof id === "number" &&
            !isNaN(id) &&
            Number.isInteger(id) &&
            id > 0,
        );
      }
      if (
        typeof val === "number" &&
        !isNaN(val) &&
        Number.isInteger(val) &&
        val > 0
      ) {
        return [val];
      }
      return [];
    })
    .refine(
      (ids) => ids.length > 0,
      "Au moins une échéance valide est requise",
    ),
  messagePersonnalise: z.string().optional().default(""),
});

/**
 * Schéma de validation pour compter les messages non lus
 */
export const countUnreadMessagesSchema = z.object({
  userId: z
    .number()
    .int()
    .positive("L'ID utilisateur doit être un entier positif"),
});

/**
 * Schéma de validation pour activer/désactiver un message
 */
export const toggleMessageStatusSchema = z.object({
  messageId: z
    .number()
    .int()
    .positive("L'ID du message doit être un entier positif"),
});

/**
 * Schéma de validation pour supprimer définitivement un message (Admin)
 */
export const deleteMessagePermanentlySchema = z.object({
  messageId: z
    .number()
    .int()
    .positive("L'ID du message doit être un entier positif"),
});

/**
 * Schéma de validation pour désactiver un message (Admin)
 */
export const deactivateMessageSchema = z.object({
  messageId: z
    .number()
    .int()
    .positive("L'ID du message doit être un entier positif"),
});

/**
 * Schéma de validation pour réactiver un message (Admin)
 */
export const reactivateMessageSchema = z.object({
  messageId: z
    .number()
    .int()
    .positive("L'ID du message doit être un entier positif"),
});

/**
 * Schéma de validation pour obtenir les messages supprimés
 */
export const getDeletedMessagesSchema = z.object({
  userId: z
    .number()
    .int()
    .positive("L'ID utilisateur doit être un entier positif"),
  limit: z.number().int().positive().optional().default(50),
});

/**
 * Types TypeScript générés à partir des schémas Zod
 */
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type GetUserMessagesInput = z.infer<typeof getUserMessagesSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;
export type RestoreMessageInput = z.infer<typeof restoreMessageSchema>;
export type MessageStatsInput = z.infer<typeof messageStatsSchema>;
export type SendPaymentReminderInput = z.infer<
  typeof sendPaymentReminderSchema
>;
export type CountUnreadMessagesInput = z.infer<
  typeof countUnreadMessagesSchema
>;
export type ToggleMessageStatusInput = z.infer<
  typeof toggleMessageStatusSchema
>;
export type DeleteMessagePermanentlyInput = z.infer<
  typeof deleteMessagePermanentlySchema
>;
export type DeactivateMessageInput = z.infer<typeof deactivateMessageSchema>;
export type ReactivateMessageInput = z.infer<typeof reactivateMessageSchema>;
export type GetDeletedMessagesInput = z.infer<typeof getDeletedMessagesSchema>;
