import { z } from "zod";

// ============================================
// SCHEMAS DE DONNÉES (depuis types.ts)
// ============================================

/**
 * Schéma pour la vérification d'un nom d'article dans une catégorie
 */
export const articleNomCategorieSchema = z.object({
  nom: z.string(),
  categorie_id: z.preprocess(
    (val: any) => Number(val),
    z.number().int().positive(),
  ),
});

/**
 * Schéma création d'article (sans id)
 */
export const articleCreationSchema = z.object({
  nom: z.string(),
  description: z.string(),
  prix: z.preprocess((val: any) => Number(val), z.number()),
  images: z.array(z.string()).default([]),
  categorie_id: z.preprocess((val: any) => Number(val), z.number()),
  stocks: z.array(
    z.object({
      taille: z.string(),
      quantite: z.preprocess(
        (val: any) => Number(val),
        z.number().int().nonnegative(),
      ),
    }),
  ),
});

/**
 * Schéma article complet (avec id)
 */
export const articleDataValidationSchema = articleCreationSchema.extend({
  id: z.number().int().positive(),
});

/**
 * Schéma création de commande
 */
export const nouvelleCommandeSchema = z.object({
  utilisateur_id: z.preprocess(
    (val: any) => Number(val),
    z.number().int().positive(),
  ),
  articles: z.array(
    z.object({
      article_id: z.preprocess(
        (val: any) => Number(val),
        z.number().int().positive(),
      ),
      taille: z.string().optional(),
      quantite: z.preprocess(
        (val: any) => Number(val),
        z.number().int().positive(),
      ),
      prix: z.preprocess((val: any) => Number(val), z.number().nonnegative()),
    }),
  ),
  statut: z.string().optional(),
  date: z.string().datetime().optional(),
  total: z.preprocess(
    (val: any) => Number(val),
    z.number().nonnegative().optional(),
  ),
});

/**
 * Schéma ArticleCommande (depuis types.ts)
 */
export const articleCommandeSchemaFromTypes = z.object({
  article_id: z.preprocess(
    (val: any) => Number(val),
    z.number().int().positive(),
  ),
  taille_id: z.preprocess(
    (val: any) =>
      val === undefined || val === null || val === "" ? undefined : Number(val),
    z.number().int().positive().optional(),
  ),
  quantite: z.preprocess(
    (val: any) => Number(val),
    z.number().int().positive(),
  ),
  prix: z.preprocess((val: any) => Number(val), z.number().nonnegative()),
});

// ============================================
// SCHEMAS DE VALIDATION DE REQUÊTES
// ============================================

/**
 * Schema pour récupérer les articles
 */
export const getArticlesSchema = z.object({
  categorie: z.string().optional(),
});

/**
 * Schema pour récupérer un article par ID
 */
export const getArticleByIdSchema = z.object({
  articleId: z
    .string()
    .refine((val) => /^\d+$/.test(val), {
      message: "ID article doit être un nombre positif",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: "ID article doit être supérieur à 0",
    }),
});

/**
 * Schema pour la création d'un article
 */
export const createArticleSchema = z.object({
  nom: z
    .string({
      required_error: "Le nom est requis",
      invalid_type_error: "Le nom doit être une chaîne",
    })
    .min(1, "Le nom ne peut pas être vide")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),

  description: z
    .string()
    .min(1, "La description ne peut pas être vide")
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional(),

  prix: z
    .number({
      required_error: "Le prix est requis",
      invalid_type_error: "Le prix doit être un nombre",
    })
    .positive("Le prix doit être positif")
    .min(0.01, "Le prix minimum est 0.01€")
    .max(9999.99, "Le prix maximum est 9999.99€"),

  categorie_id: z
    .number({
      required_error: "L'ID de la catégorie est requis",
      invalid_type_error: "L'ID de la catégorie doit être un nombre",
    })
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif"),

  images: z
    .array(
      z
        .string()
        .url("L'URL de l'image doit être valide")
        .refine(
          (url) => url.startsWith("http://") || url.startsWith("https://"),
          "L'URL doit commencer par http:// ou https://",
        ),
    )
    .optional()
    .default([]),

  stocks: z
    .array(
      z.object({
        taille: z.string().min(1, "La taille est requise"),
        quantite: z
          .number()
          .int("La quantité doit être un entier")
          .nonnegative("La quantité ne peut pas être négative"),
      }),
    )
    .optional()
    .default([]),

  actif: z.boolean().optional().default(true),
});

/**
 * Schema pour la mise à jour d'un article
 */
export const updateArticleSchema = z.object({
  id: z
    .number({
      required_error: "L'ID de l'article est requis",
      invalid_type_error: "L'ID de l'article doit être un nombre",
    })
    .int()
    .positive(),

  nom: z
    .string()
    .min(1, "Le nom ne peut pas être vide")
    .max(255, "Le nom ne peut pas dépasser 255 caractères")
    .optional(),

  description: z
    .string()
    .min(1, "La description ne peut pas être vide")
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional(),

  prix: z
    .number()
    .positive("Le prix doit être positif")
    .min(0.01, "Le prix minimum est 0.01€")
    .max(9999.99, "Le prix maximum est 9999.99€")
    .optional(),

  categorie_id: z
    .number()
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif")
    .optional(),

  images: z
    .array(
      z
        .string()
        .url("L'URL de l'image doit être valide")
        .refine(
          (url) => url.startsWith("http://") || url.startsWith("https://"),
          "L'URL doit commencer par http:// ou https://",
        ),
    )
    .optional(),

  stocks: z
    .array(
      z.object({
        taille: z.string().min(1, "La taille est requise"),
        quantite: z
          .number()
          .int("La quantité doit être un entier")
          .nonnegative("La quantité ne peut pas être négative"),
      }),
    )
    .optional(),

  actif: z.boolean().optional(),
});

/**
 * Schema pour supprimer un article
 */
export const deleteArticleSchema = z.object({
  id: z
    .string()
    .refine((val) => /^\d+$/.test(val), {
      message: "ID article doit être un nombre positif",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: "ID article doit être supérieur à 0",
    }),
});

/**
 * Schema pour un article dans une commande
 */
export const articleCommandeSchema = z.object({
  article_id: z
    .number({
      required_error: "L'ID de l'article est requis",
      invalid_type_error: "L'ID de l'article doit être un nombre",
    })
    .int()
    .positive(),

  nom: z.string().optional(),

  quantite: z
    .number({
      required_error: "La quantité est requise",
      invalid_type_error: "La quantité doit être un nombre",
    })
    .int("La quantité doit être un entier")
    .positive("La quantité doit être positive")
    .min(1, "La quantité minimum est 1")
    .max(100, "La quantité maximum est 100"),

  taille: z
    .string({
      required_error: "La taille est requise",
    })
    .min(1, "La taille ne peut pas être vide")
    .max(20, "La taille ne peut pas dépasser 20 caractères"),

  prix: z.number().positive("Le prix doit être positif").optional(),
});

/**
 * Schema pour la création d'une commande
 */
export const createCommandeSchema = z.object({
  utilisateur_id: z
    .number({
      required_error: "L'ID de l'utilisateur est requis",
      invalid_type_error: "L'ID de l'utilisateur doit être un nombre",
    })
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif"),

  articles: z
    .array(articleCommandeSchema)
    .min(1, "Au moins un article est requis")
    .max(50, "Maximum 50 articles par commande"),

  total: z
    .number({
      required_error: "Le total est requis",
      invalid_type_error: "Le total doit être un nombre",
    })
    .positive("Le total doit être positif")
    .min(0.01, "Le total minimum est 0.01€")
    .max(99999.99, "Le total maximum est 99999.99€"),

  statut: z
    .enum(["en attente", "validé", "préparé", "livré", "annulé"], {
      errorMap: () => ({
        message:
          "Le statut doit être 'en attente', 'validé', 'préparé', 'livré' ou 'annulé'",
      }),
    })
    .optional()
    .default("en attente"),

  date: z
    .string()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(val);
    }, "La date doit être au format ISO valide (YYYY-MM-DD)")
    .optional(),

  unique_id: z.string().optional(),

  numero_commande: z.string().optional(),
});

/**
 * Schema pour récupérer les commandes d'un utilisateur
 */
export const getCommandesUtilisateurSchema = z.object({
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
 * Schema pour récupérer une commande par ID unique
 */
export const getCommandeByUniqueIdSchema = z.object({
  uniqueId: z
    .string({
      required_error: "L'ID unique est requis",
    })
    .min(1, "L'ID unique ne peut pas être vide")
    .regex(
      /^CMD-\d{3}-\d+-[A-F0-9]{8}$/,
      "Format d'ID unique invalide (attendu: CMD-XXX-TIMESTAMP-XXXXXXXX)",
    ),
});

/**
 * Schema pour récupérer une commande par numéro
 */
export const getCommandeByNumeroSchema = z.object({
  numeroCommande: z
    .string({
      required_error: "Le numéro de commande est requis",
    })
    .min(1, "Le numéro de commande ne peut pas être vide")
    .regex(
      /^CMD-\d{6}$/,
      "Format de numéro de commande invalide (attendu: CMD-XXXXXX)",
    ),
});

/**
 * Schema pour la récupération du PaymentIntent d'une commande
 */
export const getPaymentIntentSchema = z.object({
  commandeId: z
    .string({
      required_error: "L'ID de la commande est requis",
    })
    .min(1, "L'ID de la commande ne peut pas être vide"),

  userId: z
    .string({
      required_error: "L'ID utilisateur est requis",
    })
    .refine((val) => /^\d+$/.test(val), {
      message: "ID utilisateur doit être un nombre positif",
    }),
});

/**
 * Schema pour récupérer les tailles
 */
export const getTaillesSchema = z.object({
  actif: z.boolean().optional(),
});

/**
 * Schema pour les statistiques du magasin
 */
export const getStatistiquesMagasinSchema = z.object({
  dateDebut: z
    .string()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(val);
    }, "La date de début doit être au format ISO valide (YYYY-MM-DD)")
    .optional(),

  dateFin: z
    .string()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(val);
    }, "La date de fin doit être au format ISO valide (YYYY-MM-DD)")
    .optional(),
});

// ============================================
// TYPES TYPESCRIPT EXTRAITS DES SCHÉMAS ZOD
// ============================================

// Types de données
export type ArticleNomCategorie = z.infer<typeof articleNomCategorieSchema>;
export type ArticleCreationData = z.infer<typeof articleCreationSchema>;
export type ArticleData = z.infer<typeof articleDataValidationSchema>;
export type NouvelleCommande = z.infer<typeof nouvelleCommandeSchema>;
export type ArticleCommandeFromTypes = z.infer<
  typeof articleCommandeSchemaFromTypes
>;

// Types de validation de requêtes
export type GetArticlesData = z.infer<typeof getArticlesSchema>;
export type GetArticleByIdData = z.infer<typeof getArticleByIdSchema>;
export type CreateArticleData = z.infer<typeof createArticleSchema>;
export type UpdateArticleData = z.infer<typeof updateArticleSchema>;
export type DeleteArticleData = z.infer<typeof deleteArticleSchema>;
export type ArticleCommandeData = z.infer<typeof articleCommandeSchema>;
export type CreateCommandeData = z.infer<typeof createCommandeSchema>;
export type GetCommandesUtilisateurData = z.infer<
  typeof getCommandesUtilisateurSchema
>;
export type GetCommandeByUniqueIdData = z.infer<
  typeof getCommandeByUniqueIdSchema
>;
export type GetCommandeByNumeroData = z.infer<typeof getCommandeByNumeroSchema>;
export type GetPaymentIntentData = z.infer<typeof getPaymentIntentSchema>;
export type GetTaillesData = z.infer<typeof getTaillesSchema>;
export type GetStatistiquesMagasinData = z.infer<
  typeof getStatistiquesMagasinSchema
>;
