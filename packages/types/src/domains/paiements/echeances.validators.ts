import { z } from "zod";

/**
 * Schema pour récupérer les échéances d'un utilisateur
 */
export const getEcheancesUtilisateurSchema = z.object({
  userId: z
    .string()
    .refine((val) => /^\d+$/.test(val), {
      message: "ID utilisateur doit être un nombre positif",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: "ID utilisateur doit être supérieur à 0",
    }),
});

/**
 * Schema pour récupérer les détails d'une échéance
 */
export const getEcheanceDetailSchema = z.object({
  echeanceId: z
    .string()
    .refine((val) => /^\d+$/.test(val), {
      message: "ID échéance doit être un nombre positif",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: "ID échéance doit être supérieur à 0",
    }),
  userId: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: "ID utilisateur doit être un nombre positif",
    })
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || val > 0, {
      message: "ID utilisateur doit être supérieur à 0",
    }),
});

/**
 * Schema pour la création d'une échéance
 */
export const createEcheanceSchema = z.object({
  utilisateur_id: z
    .number({
      required_error: "L'ID de l'utilisateur est requis",
      invalid_type_error: "L'ID de l'utilisateur doit être un nombre",
    })
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif"),

  abonnement_id: z
    .number({
      invalid_type_error: "L'ID de l'abonnement doit être un nombre",
    })
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif")
    .optional()
    .nullable(),

  montant: z
    .number({
      required_error: "Le montant est requis",
      invalid_type_error: "Le montant doit être un nombre",
    })
    .positive("Le montant doit être positif")
    .min(0.01, "Le montant minimum est 0.01€")
    .max(999999, "Le montant maximum est 999,999€"),

  date_echeance: z
    .string({
      required_error: "La date d'échéance est requise",
      invalid_type_error: "La date d'échéance doit être une chaîne",
    })
    .refine(
      (val) => !isNaN(Date.parse(val)),
      "La date d'échéance doit être une date valide",
    ),

  description: z
    .string()
    .min(1, "La description ne peut pas être vide")
    .max(255, "La description ne peut pas dépasser 255 caractères")
    .optional(),

  statut: z
    .enum(["en attente", "payé", "échu"], {
      errorMap: () => ({
        message: "Le statut doit être 'en attente', 'payé' ou 'échu'",
      }),
    })
    .optional()
    .default("en attente"),
});

/**
 * Schema pour la mise à jour d'une échéance
 */
export const updateEcheanceSchema = z.object({
  echeanceId: z
    .number({
      required_error: "L'ID de l'échéance est requis",
      invalid_type_error: "L'ID de l'échéance doit être un nombre",
    })
    .int()
    .positive(),

  montant: z
    .number({
      invalid_type_error: "Le montant doit être un nombre",
    })
    .positive("Le montant doit être positif")
    .min(0.01, "Le montant minimum est 0.01€")
    .max(999999, "Le montant maximum est 999,999€")
    .optional(),

  date_echeance: z
    .string({
      invalid_type_error: "La date d'échéance doit être une chaîne",
    })
    .refine(
      (val) => !isNaN(Date.parse(val)),
      "La date d'échéance doit être une date valide",
    )
    .optional(),

  description: z
    .string()
    .min(1, "La description ne peut pas être vide")
    .max(255, "La description ne peut pas dépasser 255 caractères")
    .optional(),

  statut: z.enum(["en attente", "payé", "échu"]).optional(),

  date_paiement: z
    .string({
      invalid_type_error: "La date de paiement doit être une chaîne",
    })
    .refine(
      (val) => !isNaN(Date.parse(val)),
      "La date de paiement doit être une date valide",
    )
    .optional()
    .nullable(),

  stripe_payment_intent_id: z
    .string()
    .refine(
      (val) => /^pi_[a-zA-Z0-9_]+$/.test(val),
      "L'ID du Payment Intent doit commencer par 'pi_'",
    )
    .optional()
    .nullable(),
});

/**
 * Schema pour supprimer une échéance
 */
export const deleteEcheanceSchema = z.object({
  echeanceId: z
    .string()
    .refine((val) => /^\d+$/.test(val), {
      message: "ID échéance doit être un nombre positif",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: "ID échéance doit être supérieur à 0",
    }),
});

/**
 * Schema pour les statistiques d'un utilisateur
 */
export const getStatistiquesSchema = z.object({
  userId: z
    .string()
    .refine((val) => /^\d+$/.test(val), {
      message: "ID utilisateur doit être un nombre positif",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: "ID utilisateur doit être supérieur à 0",
    }),
});

/**
 * Schema pour le diagnostic d'échéance
 */
export const diagnosticEcheanceSchema = z.object({
  echeanceId: z
    .string()
    .refine((val) => /^\d+$/.test(val), {
      message: "ID échéance doit être un nombre positif",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: "ID échéance doit être supérieur à 0",
    }),

  userId: z
    .string()
    .refine((val) => /^\d+$/.test(val), {
      message: "ID utilisateur doit être un nombre positif",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: "ID utilisateur doit être supérieur à 0",
    }),
});

/**
 * Types TypeScript dérivés des schemas
 */
export type GetEcheancesUtilisateurData = z.infer<
  typeof getEcheancesUtilisateurSchema
>;
export type GetEcheanceDetailData = z.infer<typeof getEcheanceDetailSchema>;
export type CreateEcheanceData = z.infer<typeof createEcheanceSchema>;
export type UpdateEcheanceData = z.infer<typeof updateEcheanceSchema>;
export type DeleteEcheanceData = z.infer<typeof deleteEcheanceSchema>;
export type GetStatistiquesData = z.infer<typeof getStatistiquesSchema>;
export type DiagnosticEcheanceData = z.infer<typeof diagnosticEcheanceSchema>;

/**
 * Schema pour les filtres de recherche d'échéances (GraphQL)
 */
export const echeancesFiltersInputSchema = z
  .object({
    statut: z.enum(["en attente", "payé", "échu", "annulé"]).optional(),
    date_debut: z
      .string()
      .refine(
        (val) => !isNaN(Date.parse(val)),
        "La date de début doit être une date valide",
      )
      .optional(),
    date_fin: z
      .string()
      .refine(
        (val) => !isNaN(Date.parse(val)),
        "La date de fin doit être une date valide",
      )
      .optional(),
    montant_min: z.number().positive().optional(),
    montant_max: z.number().positive().optional(),
  })
  .refine(
    (data) => {
      if (data.montant_min && data.montant_max) {
        return data.montant_min <= data.montant_max;
      }
      return true;
    },
    { message: "Le montant minimum doit être inférieur au montant maximum" },
  )
  .refine(
    (data) => {
      if (data.date_debut && data.date_fin) {
        return new Date(data.date_debut) <= new Date(data.date_fin);
      }
      return true;
    },
    { message: "La date de début doit être antérieure à la date de fin" },
  );

/**
 * Schema pour les IDs utilisateurs en GraphQL
 */
export const echeancesUtilisateurIdSchema = z.object({
  utilisateurId: z.number().int().positive("ID utilisateur invalide"),
  filters: echeancesFiltersInputSchema.optional(),
});

/**
 * Schema pour les IDs d'échéances en GraphQL
 */
export const echeanceIdSchema = z.object({
  echeanceId: z.number().int().positive("ID échéance invalide"),
});

/**
 * Schema pour marquer une échéance comme payée
 */
export const marquerEcheancePayeeSchema = z.object({
  echeanceId: z.number().int().positive("ID échéance invalide"),
});

/**
 * Types TypeScript pour GraphQL
 */
export type EcheancesFiltersInput = z.infer<typeof echeancesFiltersInputSchema>;
export type EcheancesUtilisateurIdInput = z.infer<
  typeof echeancesUtilisateurIdSchema
>;
export type EcheanceIdInput = z.infer<typeof echeanceIdSchema>;
export type MarquerEcheancePayeeInput = z.infer<
  typeof marquerEcheancePayeeSchema
>;

/**
 * Exports groupés pour faciliter l'import
 */
export const echeancesValidators = {
  getEcheancesUtilisateur: getEcheancesUtilisateurSchema,
  getEcheanceDetail: getEcheanceDetailSchema,
  createEcheance: createEcheanceSchema,
  updateEcheance: updateEcheanceSchema,
  deleteEcheance: deleteEcheanceSchema,
  getStatistiques: getStatistiquesSchema,
  diagnosticEcheance: diagnosticEcheanceSchema,
  echeancesFilters: echeancesFiltersInputSchema,
  echeancesUtilisateurId: echeancesUtilisateurIdSchema,
  echeanceId: echeanceIdSchema,
  marquerEcheancePayee: marquerEcheancePayeeSchema,
};
