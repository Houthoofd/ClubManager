import { z } from "zod";

/**
 * Validators Zod pour le module Paiements
 * Centralisés dans @clubmanager/types
 *
 * @package @clubmanager/types
 */

// ============================================
// ENUMS
// ============================================

/**
 * Statut d'un paiement
 */
export enum StatutPaiement {
  EN_ATTENTE = "en attente",
  VALIDE = "validé",
  REFUSE = "refusé",
  REMBOURSE = "remboursé",
  ANNULE = "annulé",
}

/**
 * Statut d'une échéance de paiement
 */
export enum StatutEcheance {
  PAYE = "payé",
  EN_ATTENTE = "en attente",
  ECHU = "échu",
}

/**
 * Méthode de paiement
 */
export enum MethodePaiement {
  STRIPE = "stripe",
  PAYPAL = "paypal",
  BITCOIN = "bitcoin",
  VIREMENT = "virement",
  AUTRE = "autre",
}

// ============================================
// SCHEMAS DE DONNÉES (depuis types.ts)
// ============================================

/**
 * Schéma Zod pour validation d'un paiement
 */
export const PaiementSchema = z.object({
  id: z.number().int().positive(),
  commande_id: z.number().int().positive().nullable(),
  utilisateur_id: z.number().int().positive(),
  montant: z.number().positive(),
  methode_paiement: z.nativeEnum(MethodePaiement).nullable(),
  stripe_payment_intent_id: z.string().nullable(),
  paypal_order_id: z.string().nullable(),
  bitcoin_address: z.string().nullable(),
  date_paiement: z.date(),
  statut: z.nativeEnum(StatutPaiement),
  description: z.string().nullable(),
  date_confirmation: z.date().nullable(),
  date_modification: z.date().nullable(),
  abonnement_id: z.number().int().positive().nullable(),
  periode_debut: z.date().nullable(),
  periode_fin: z.date().nullable(),
});

/**
 * Schéma Zod pour validation d'une échéance de paiement
 */
export const EcheancePaiementSchema = z.object({
  id: z.number().int().positive(),
  utilisateur_id: z.number().int().positive(),
  abonnement_id: z.number().int().positive(),
  date_echeance: z.date(),
  montant: z.number().positive(),
  statut: z.nativeEnum(StatutEcheance),
  date_paiement: z.date().nullable(),
});

/**
 * Input pour créer un paiement
 */
export const CreerPaiementInputSchema = z.object({
  commandeId: z.number().int().positive().optional(),
  utilisateurId: z.number().int().positive("ID utilisateur requis"),
  montant: z
    .number()
    .positive("Montant doit être positif")
    .max(999999.99, "Montant trop élevé"),
  methodePaiement: z.nativeEnum(MethodePaiement).optional(),
  stripePaymentIntentId: z.string().optional(),
  paypalOrderId: z.string().optional(),
  bitcoinAddress: z.string().optional(),
  datePaiement: z.date(),
  description: z.string().optional(),
  abonnementId: z.number().int().positive().optional(),
  periodeDebut: z.date().optional(),
  periodeFin: z.date().optional(),
});

/**
 * Input pour valider un paiement
 */
export const ValiderPaiementInputSchema = z.object({
  paiementId: z.number().int().positive("ID paiement requis"),
  referenceTransaction: z.string().optional(),
});

// ============================================
// SCHEMAS DE VALIDATION DE REQUÊTES
// ============================================

/**
 * Utilitaire pour convertir un montant en centimes pour Stripe
 */
export const toStripeAmount = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Schema pour créer un Payment Intent pour une échéance
 */
export const createPaymentIntentEcheanceSchema = z.object({
  amount: z
    .number({
      required_error: "Le montant est requis",
      invalid_type_error: "Le montant doit être un nombre",
    })
    .positive("Le montant doit être positif")
    .max(999999.99, "Montant trop élevé"),

  echeanceId: z
    .number({
      required_error: "L'ID de l'échéance est requis",
      invalid_type_error: "L'ID de l'échéance doit être un nombre",
    })
    .int()
    .positive(),

  userId: z
    .number({
      required_error: "L'ID de l'utilisateur est requis",
      invalid_type_error: "L'ID de l'utilisateur doit être un nombre",
    })
    .int()
    .positive(),

  currency: z
    .string()
    .length(3, "La devise doit être un code ISO 4217 à 3 lettres")
    .toUpperCase()
    .optional()
    .default("EUR"),

  description: z.string().max(500, "Description trop longue").optional(),
});

/**
 * Schema pour créer un Payment Intent pour une commande
 */
export const createPaymentIntentCommandeSchema = z.object({
  amount: z
    .number({
      required_error: "Le montant est requis",
      invalid_type_error: "Le montant doit être un nombre",
    })
    .positive("Le montant doit être positif")
    .max(999999.99, "Montant trop élevé"),

  commandeId: z
    .number({
      required_error: "L'ID de la commande est requis",
      invalid_type_error: "L'ID de la commande doit être un nombre",
    })
    .int()
    .positive(),

  userId: z
    .number({
      required_error: "L'ID de l'utilisateur est requis",
      invalid_type_error: "L'ID de l'utilisateur doit être un nombre",
    })
    .int()
    .positive(),

  currency: z
    .string()
    .length(3, "La devise doit être un code ISO 4217 à 3 lettres")
    .toUpperCase()
    .optional()
    .default("EUR"),

  description: z.string().max(500, "Description trop longue").optional(),
});

/**
 * Schema pour la confirmation de paiement d'une échéance
 */
export const confirmEcheancePaymentSchema = z.object({
  paymentIntentId: z
    .string({
      required_error: "L'ID du Payment Intent est requis",
      invalid_type_error: "L'ID du Payment Intent doit être une chaîne",
    })
    .min(10, "L'ID du Payment Intent est trop court")
    .refine(
      (val) => /^pi_[a-zA-Z0-9_]+$/.test(val),
      "L'ID du Payment Intent doit commencer par 'pi_' et contenir uniquement des caractères alphanumériques",
    ),

  echeanceId: z
    .number({
      required_error: "L'ID de l'échéance est requis",
      invalid_type_error: "L'ID de l'échéance doit être un nombre",
    })
    .int()
    .positive(),

  userId: z
    .number({
      required_error: "L'ID de l'utilisateur est requis",
      invalid_type_error: "L'ID de l'utilisateur doit être un nombre",
    })
    .int()
    .positive(),

  amount: z
    .number({
      required_error: "Le montant est requis",
      invalid_type_error: "Le montant doit être un nombre",
    })
    .positive(),
});

/**
 * Schema pour la confirmation de paiement d'une commande
 */
export const confirmCommandePaymentSchema = z.object({
  paymentIntentId: z
    .string({
      required_error: "L'ID du Payment Intent est requis",
      invalid_type_error: "L'ID du Payment Intent doit être une chaîne",
    })
    .min(10, "L'ID du Payment Intent est trop court")
    .refine(
      (val) => /^pi_[a-zA-Z0-9_]+$/.test(val),
      "L'ID du Payment Intent doit commencer par 'pi_' et contenir uniquement des caractères alphanumériques",
    ),

  commandeId: z
    .number({
      required_error: "L'ID de la commande est requis",
      invalid_type_error: "L'ID de la commande doit être un nombre",
    })
    .int()
    .positive(),

  userId: z
    .number({
      required_error: "L'ID de l'utilisateur est requis",
      invalid_type_error: "L'ID de l'utilisateur doit être un nombre",
    })
    .int()
    .positive(),

  amount: z
    .number({
      required_error: "Le montant est requis",
      invalid_type_error: "Le montant doit être un nombre",
    })
    .positive(),
});

/**
 * Schema pour récupérer une échéance par ID
 */
export const getEcheanceByIdSchema = z.object({
  echeanceId: z
    .number({
      required_error: "L'ID de l'échéance est requis",
      invalid_type_error: "L'ID de l'échéance doit être un nombre",
    })
    .int()
    .positive(),

  userId: z
    .number({
      required_error: "L'ID de l'utilisateur est requis",
      invalid_type_error: "L'ID de l'utilisateur doit être un nombre",
    })
    .int()
    .positive(),
});

/**
 * Schema pour récupérer l'historique des paiements
 */
export const getHistoriqueSchema = z.object({
  utilisateurId: z
    .number({
      invalid_type_error: "L'ID de l'utilisateur doit être un nombre",
    })
    .int()
    .positive()
    .optional(),

  limit: z
    .number()
    .int()
    .positive()
    .max(100, "La limite maximale est de 100")
    .optional()
    .default(10),

  offset: z.number().int().min(0).optional().default(0),
});

/**
 * Schema pour créer un paiement manuel (Admin)
 */
export const creerPaiementSchema = z.object({
  commandeId: z.number().int().positive().optional(),
  utilisateurId: z.number().int().positive("ID utilisateur requis"),
  montant: z
    .number()
    .positive("Montant doit être positif")
    .max(999999.99, "Montant trop élevé"),
  methodePaiement: z.string().optional(),
  description: z.string().optional(),
  abonnementId: z.number().int().positive().optional(),
});

/**
 * Schema pour valider un paiement (Admin)
 */
export const validerPaiementSchema = z.object({
  paiementId: z.number().int().positive("ID paiement requis"),
  referenceTransaction: z.string().optional(),
});

/**
 * Schema pour refuser un paiement (Admin)
 */
export const refuserPaiementSchema = z.object({
  paiementId: z.number().int().positive("ID paiement requis"),
  raison: z.string().optional(),
});

/**
 * Schema pour rembourser un paiement (Admin)
 */
export const rembourserPaiementSchema = z.object({
  paiementId: z.number().int().positive("ID paiement requis"),
  montant: z.number().positive().optional(),
  raison: z.string().optional(),
});

/**
 * Schema pour annuler un paiement (Admin)
 */
export const annulerPaiementSchema = z.object({
  paiementId: z.number().int().positive("ID paiement requis"),
  raison: z.string().optional(),
});

/**
 * Schema pour récupérer un paiement par ID
 */
export const getPaiementByIdSchema = z.object({
  id: z.number().int().positive("ID paiement requis"),
});

/**
 * Schema pour filtrer les paiements
 */
export const paiementsFiltresSchema = z.object({
  utilisateurId: z.number().int().positive().optional(),
  statut: z.string().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  abonnementId: z.number().int().positive().optional(),
  montantMin: z.number().positive().optional(),
  montantMax: z.number().positive().optional(),
  limit: z.number().int().positive().max(100).optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
});

/**
 * Schema pour récupérer les statistiques des paiements
 */
export const statistiquesPaiementsSchema = z.object({
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
});

/**
 * Schema pour récupérer les statistiques d'un utilisateur
 */
export const statistiquesPaiementsUtilisateurSchema = z.object({
  utilisateurId: z.number().int().positive("ID utilisateur requis"),
});

// ============================================
// TYPES TYPESCRIPT EXTRAITS DES SCHÉMAS ZOD
// ============================================

// Types de données
export type Paiement = z.infer<typeof PaiementSchema>;
export type EcheancePaiement = z.infer<typeof EcheancePaiementSchema>;
export type CreerPaiementInput = z.infer<typeof CreerPaiementInputSchema>;
export type ValiderPaiementInput = z.infer<typeof ValiderPaiementInputSchema>;

// Types de validation de requêtes
export type CreatePaymentIntentEcheanceInput = z.infer<
  typeof createPaymentIntentEcheanceSchema
>;
export type CreatePaymentIntentCommandeInput = z.infer<
  typeof createPaymentIntentCommandeSchema
>;
export type ConfirmEcheancePaymentInput = z.infer<
  typeof confirmEcheancePaymentSchema
>;
export type ConfirmCommandePaymentInput = z.infer<
  typeof confirmCommandePaymentSchema
>;
export type GetEcheanceByIdInput = z.infer<typeof getEcheanceByIdSchema>;
export type GetHistoriqueInput = z.infer<typeof getHistoriqueSchema>;
export type CreerPaiementInputFromValidator = z.infer<
  typeof creerPaiementSchema
>;
export type ValiderPaiementInputFromValidator = z.infer<
  typeof validerPaiementSchema
>;
export type RefuserPaiementInput = z.infer<typeof refuserPaiementSchema>;
export type RembourserPaiementInput = z.infer<typeof rembourserPaiementSchema>;
export type AnnulerPaiementInput = z.infer<typeof annulerPaiementSchema>;
export type GetPaiementByIdInput = z.infer<typeof getPaiementByIdSchema>;
export type PaiementsFiltresInput = z.infer<typeof paiementsFiltresSchema>;
export type StatistiquesPaiementsInput = z.infer<
  typeof statistiquesPaiementsSchema
>;
export type StatistiquesPaiementsUtilisateurInput = z.infer<
  typeof statistiquesPaiementsUtilisateurSchema
>;
