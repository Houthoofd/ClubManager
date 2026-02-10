import { z } from "zod";

/**
 * Validators Zod pour le module Paiements
 * Centralisés dans @clubmanager/types
 *
 * Note: Les validators Stripe (createPaymentIntent*) sont dans stripe.validators.ts
 *
 * @package @clubmanager/types
 */

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

/**
 * Types TypeScript dérivés des schemas
 */
export type ConfirmEcheancePaymentInput = z.infer<
  typeof confirmEcheancePaymentSchema
>;
export type ConfirmCommandePaymentInput = z.infer<
  typeof confirmCommandePaymentSchema
>;
export type GetEcheanceByIdInput = z.infer<typeof getEcheanceByIdSchema>;
export type GetHistoriqueInput = z.infer<typeof getHistoriqueSchema>;
export type CreerPaiementInput = z.infer<typeof creerPaiementSchema>;
export type ValiderPaiementInput = z.infer<typeof validerPaiementSchema>;
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
