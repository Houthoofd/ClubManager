import { z } from "zod";

/**
 * Schema pour la création d'un payment intent pour une échéance
 */
export const createPaymentIntentEcheanceSchema = z.object({
  amount: z
    .number({
      required_error: "Le montant est requis",
      invalid_type_error: "Le montant doit être un nombre",
    })
    .positive("Le montant doit être positif")
    .min(0.5, "Le montant minimum est 0.50€")
    .max(999999, "Le montant maximum est 999,999€"),

  echeanceId: z
    .number({
      required_error: "L'ID de l'échéance est requis",
      invalid_type_error: "L'ID de l'échéance doit être un nombre",
    })
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif"),

  userId: z
    .number({
      required_error: "L'ID de l'utilisateur est requis",
      invalid_type_error: "L'ID de l'utilisateur doit être un nombre",
    })
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif"),

  currency: z
    .string()
    .optional()
    .default("eur")
    .refine(
      (val) => ["eur", "usd", "gbp", "chf"].includes(val),
      "Devise non supportée. Utilisez: eur, usd, gbp, chf",
    ),

  description: z.string().optional().default("Paiement échéance"),
});

/**
 * Schema pour la création d'un payment intent pour une commande
 */
export const createPaymentIntentCommandeSchema = z.object({
  amount: z
    .number({
      required_error: "Le montant est requis",
      invalid_type_error: "Le montant doit être un nombre",
    })
    .positive("Le montant doit être positif")
    .min(0.5, "Le montant minimum est 0.50€")
    .max(999999, "Le montant maximum est 999,999€"),

  commande: z
    .union([
      z.number().int().positive(),
      z.object({
        id: z.number().int().positive(),
        articles: z.array(z.any()).optional(),
      }),
    ])
    .refine((val) => val !== null && val !== undefined, {
      message: "La commande est requise",
    }),

  userId: z
    .number({
      required_error: "L'ID de l'utilisateur est requis",
      invalid_type_error: "L'ID de l'utilisateur doit être un nombre",
    })
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif")
    .optional(),

  currency: z.string().optional().default("eur"),

  description: z.string().optional().default("Paiement commande"),
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
 * Types TypeScript dérivés des schemas
 */
export type CreatePaymentIntentEcheanceData = z.infer<
  typeof createPaymentIntentEcheanceSchema
>;
export type CreatePaymentIntentCommandeData = z.infer<
  typeof createPaymentIntentCommandeSchema
>;
export type ConfirmEcheancePaymentData = z.infer<
  typeof confirmEcheancePaymentSchema
>;
export type ConfirmCommandePaymentData = z.infer<
  typeof confirmCommandePaymentSchema
>;
export type GetEcheanceByIdData = z.infer<typeof getEcheanceByIdSchema>;
export type GetHistoriqueData = z.infer<typeof getHistoriqueSchema>;
