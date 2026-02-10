/**
 * Validators Zod pour le module Confirmation
 * ✅ Centralisés dans @clubmanager/types
 *
 * @package @clubmanager/types
 */

import { z } from 'zod';

// ============================================
// SCHEMAS POUR LA CONFIRMATION DE PAIEMENT
// ============================================

/**
 * Schema pour confirmer un paiement d'échéance
 */
export const confirmationPaymentInputSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment Intent ID requis'),
  echeanceId: z.number().int().positive('ID d\'échéance invalide'),
  userId: z.number().int().positive('ID utilisateur invalide'),
  amount: z.number().positive('Montant invalide'),
});

/**
 * Schema pour confirmer un paiement de commande
 */
export const confirmationPaymentCommandeInputSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment Intent ID requis'),
  commandeId: z.number().int().positive('ID de commande invalide'),
  userId: z.number().int().positive('ID utilisateur invalide'),
  amount: z.number().positive('Montant invalide').optional(),
});

// ============================================
// TYPES EXPORTÉS
// ============================================

export type ConfirmationPaymentInput = z.infer<typeof confirmationPaymentInputSchema>;
export type ConfirmationPaymentCommandeInput = z.infer<typeof confirmationPaymentCommandeInputSchema>;

// ============================================
// EXPORTS GROUPÉS
// ============================================

export const confirmationValidators = {
  confirmPayment: confirmationPaymentInputSchema,
  confirmPaymentCommande: confirmationPaymentCommandeInputSchema,
};
