import { z } from "zod";

/**
 * Schemas de validation Zod pour les endpoints Stripe
 */

// ============================================================================
// SCHEMAS POUR PAYMENT INTENTS
// ============================================================================

/**
 * Schema pour créer un PaymentIntent pour une échéance
 */
export const createPaymentIntentEcheanceSchema = z.object({
  amount: z
    .number()
    .positive("Le montant doit être positif")
    .min(0.5, "Le montant minimum est 0.50€")
    .max(999999, "Le montant maximum est 999999€"),
  echeanceId: z
    .number()
    .int("L'ID échéance doit être un entier")
    .positive("L'ID échéance doit être positif"),
  userId: z
    .number()
    .int("L'ID utilisateur doit être un entier")
    .positive("L'ID utilisateur doit être positif"),
  description: z.string().optional(),
});

/**
 * Schema pour créer un PaymentIntent pour une commande
 * Supporte 2 formats:
 * - commande: number (ID existant)
 * - commande: object (nouvelle commande avec articles)
 */
export const createPaymentIntentCommandeSchema = z.object({
  amount: z
    .number()
    .positive("Le montant doit être positif")
    .min(0.5, "Le montant minimum est 0.50€")
    .max(999999, "Le montant maximum est 999999€"),
  commande: z.union([
    z.number().int().positive("L'ID commande doit être positif"),
    z.object({
      id: z.number().int().positive().optional(),
      articles: z
        .array(z.any())
        .min(1, "La commande doit contenir au moins un article"),
      total: z.number().positive().optional(),
      utilisateur_id: z.number().int().positive().optional(),
    }),
  ]),
  userId: z.number().int().positive().optional(), // Peut venir du middleware
  description: z.string().optional().default("Paiement commande magasin"),
});

// ============================================================================
// SCHEMAS POUR CONFIRMATION DE PAIEMENT
// ============================================================================

/**
 * Schema pour confirmer un paiement d'échéance
 */
export const confirmPaymentEcheanceSchema = z.object({
  paymentIntentId: z
    .string()
    .min(10, "Le PaymentIntent ID est invalide")
    .refine(
      (val) => val.startsWith("pi_"),
      "Le PaymentIntent ID doit commencer par 'pi_'",
    ),
  echeanceId: z
    .number()
    .int("L'ID échéance doit être un entier")
    .positive("L'ID échéance doit être positif"),
  userId: z
    .number()
    .int("L'ID utilisateur doit être un entier")
    .positive("L'ID utilisateur doit être positif"),
  amount: z.number().positive("Le montant doit être positif"),
});

/**
 * Schema pour confirmer un paiement de commande
 */
export const confirmPaymentCommandeSchema = z.object({
  paymentIntentId: z
    .string()
    .min(10, "Le PaymentIntent ID est invalide")
    .refine(
      (val) => val.startsWith("pi_"),
      "Le PaymentIntent ID doit commencer par 'pi_'",
    ),
  commandeId: z
    .number()
    .int("L'ID commande doit être un entier")
    .positive("L'ID commande doit être positif"),
  userId: z
    .number()
    .int("L'ID utilisateur doit être un entier")
    .positive("L'ID utilisateur doit être positif"),
  amount: z.number().positive("Le montant doit être positif"),
});

// ============================================================================
// SCHEMAS POUR MÉTHODES DE PAIEMENT ALTERNATIVES
// ============================================================================

/**
 * Schema générique pour les méthodes de paiement alternatives
 */
export const alternativePaymentSchema = z.object({
  amount: z
    .number()
    .positive("Le montant doit être positif")
    .min(0.5, "Le montant minimum est 0.50€")
    .max(999999, "Le montant maximum est 999999€"),
  commande: z.union([
    z.number().int().positive("L'ID commande doit être positif"),
    z.object({
      id: z.number().int().positive().optional(),
      articles: z.array(z.any()).optional(),
      total: z.number().positive().optional(),
      utilisateur_id: z.number().int().positive().optional(),
    }),
  ]),
  userId: z.number().int().positive("L'ID utilisateur doit être positif"),
});

/**
 * Schema pour paiement Bancontact
 */
export const bancontactPaymentSchema = z.object({
  amount: z
    .number()
    .positive("Le montant doit être positif")
    .min(0.5, "Le montant minimum est 0.50€")
    .max(999999, "Le montant maximum est 999999€"),
  commande: z.union([
    z.number().int().positive("L'ID commande doit être positif"),
    z.object({
      id: z.number().int().positive().optional(),
      articles: z.array(z.any()).optional(),
      total: z.number().positive().optional(),
      utilisateur_id: z.number().int().positive().optional(),
    }),
  ]),
  utilisateur_id: z.number().int().positive().optional(),
});

/**
 * Schema pour paiement PayPal
 */
export const paypalPaymentSchema = z.object({
  totalAmount: z
    .number()
    .positive("Le montant doit être positif")
    .min(0.5, "Le montant minimum est 0.50€"),
  userId: z.number().int().positive("L'ID utilisateur doit être positif"),
  commande: z.union([
    z.number().int().positive(),
    z.object({
      id: z.number().int().positive().optional(),
      articles: z.array(z.any()).optional(),
    }),
  ]),
  paypalOrderId: z.string().optional(),
});

/**
 * Schema pour paiement Bitcoin
 */
export const bitcoinPaymentSchema = z.object({
  sats: z
    .number()
    .int("Le montant en satoshis doit être un entier")
    .positive("Le montant doit être positif")
    .min(1000, "Le montant minimum est 1000 sats"),
  commande: z.union([
    z.number().int().positive(),
    z.object({
      id: z.number().int().positive().optional(),
      articles: z.array(z.any()).optional(),
    }),
  ]),
  userId: z.number().int().positive().optional(),
});

// ============================================================================
// SCHEMAS POUR DEBUG ET CONFIGURATION
// ============================================================================

/**
 * Schema pour test de création de PaymentIntent
 */
export const testPaymentIntentSchema = z.object({
  amount: z.number().positive().optional().default(100), // 1€ par défaut
  currency: z.string().optional().default("eur"),
});

// ============================================================================
// TYPES EXPORTÉS (pour TypeScript)
// ============================================================================

export type CreatePaymentIntentEcheanceInput = z.infer<
  typeof createPaymentIntentEcheanceSchema
>;
export type CreatePaymentIntentCommandeInput = z.infer<
  typeof createPaymentIntentCommandeSchema
>;
export type ConfirmPaymentEcheanceInput = z.infer<
  typeof confirmPaymentEcheanceSchema
>;
export type ConfirmPaymentCommandeInput = z.infer<
  typeof confirmPaymentCommandeSchema
>;
export type BancontactPaymentInput = z.infer<typeof bancontactPaymentSchema>;
export type PaypalPaymentInput = z.infer<typeof paypalPaymentSchema>;
export type BitcoinPaymentInput = z.infer<typeof bitcoinPaymentSchema>;
export type TestPaymentIntentInput = z.infer<typeof testPaymentIntentSchema>;

// ============================================================================
// HELPERS DE VALIDATION
// ============================================================================

/**
 * Valide si une valeur est un montant valide (positif, max 2 décimales)
 */
export function isValidAmount(amount: number): boolean {
  if (amount <= 0) return false;
  if (amount > 999999) return false;
  // Vérifier max 2 décimales
  const decimals = (amount.toString().split(".")[1] || "").length;
  return decimals <= 2;
}

/**
 * Convertit un montant en centimes pour Stripe
 */
export function toStripeAmount(amountInEuros: number): number {
  return Math.round(amountInEuros * 100);
}

/**
 * Convertit un montant Stripe (centimes) en euros
 */
export function fromStripeAmount(amountInCents: number): number {
  return Math.round(amountInCents) / 100;
}

/**
 * Valide un PaymentIntent ID Stripe
 */
export function isValidPaymentIntentId(id: string): boolean {
  return /^pi_[a-zA-Z0-9_]+$/.test(id);
}

/**
 * Valide un Order ID PayPal
 */
export function isValidPaypalOrderId(id: string): boolean {
  return id.length > 10 && /^[A-Z0-9]+$/.test(id);
}

/**
 * Valide une adresse Bitcoin
 */
export function isValidBitcoinAddress(address: string): boolean {
  // Simplifié - dans la vraie vie, utiliser une lib de validation Bitcoin
  return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
}
