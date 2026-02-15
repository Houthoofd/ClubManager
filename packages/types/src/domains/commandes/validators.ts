/**
 * Validators Zod pour le module Commandes
 * Centralise toutes les validations liées aux commandes
 */

import { z } from 'zod';

// ============================================
// ENUMS & CONSTANTES
// ============================================

export const StatutCommandeEnum = z.enum([
  'en_attente',
  'confirmee',
  'en_preparation',
  'expediee',
  'livree',
  'annulee'
]);

export type StatutCommande = z.infer<typeof StatutCommandeEnum>;

// ============================================
// SCHEMAS POUR LES ARTICLES DE COMMANDE
// ============================================

/**
 * Schema pour un article dans une commande
 */
export const CommandeArticleSchema = z.object({
  article_id: z.number().int().positive('L\'ID de l\'article doit être positif'),
  taille_id: z.number().int().positive('L\'ID de la taille doit être positif'),
  quantite: z.number().int().positive('La quantité doit être positive'),
  prix: z.number().positive('Le prix doit être positif')
});

export type CommandeArticleInput = z.infer<typeof CommandeArticleSchema>;

// ============================================
// SCHEMAS POUR LES MUTATIONS
// ============================================

/**
 * Schema pour créer une commande
 */
export const CreateCommandeSchema = z.object({
  utilisateur_id: z.number().int().positive('L\'ID utilisateur doit être positif'),
  articles: z
    .array(CommandeArticleSchema)
    .min(1, 'La commande doit contenir au moins un article')
    .max(100, 'Maximum 100 articles par commande'),
  payment_intent_id: z.string().optional()
});

export type CreateCommandeInput = z.infer<typeof CreateCommandeSchema>;

/**
 * Schema pour mettre à jour une commande
 */
export const UpdateCommandeSchema = z.object({
  statut: StatutCommandeEnum.optional(),
  total: z.number().positive('Le total doit être positif').optional(),
  articles: z.array(CommandeArticleSchema).optional(),
  payment_intent_id: z.string().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni pour la mise à jour' }
);

export type UpdateCommandeInput = z.infer<typeof UpdateCommandeSchema>;

/**
 * Schema pour mettre à jour le statut d'une commande
 */
export const UpdateStatutCommandeSchema = z.object({
  statut: StatutCommandeEnum
});

export type UpdateStatutCommandeInput = z.infer<typeof UpdateStatutCommandeSchema>;

// ============================================
// SCHEMAS POUR LES QUERIES
// ============================================

/**
 * Schema pour obtenir une commande par ID
 */
export const GetCommandeByIdSchema = z.object({
  commandeId: z.string().min(1, 'L\'ID de la commande est requis')
});

/**
 * Schema pour obtenir les commandes d'un utilisateur
 */
export const GetCommandesUtilisateurSchema = z.object({
  utilisateurId: z.number().int().positive('L\'ID utilisateur doit être positif')
});

/**
 * Schema pour obtenir les commandes par statut
 */
export const GetCommandesParStatutSchema = z.object({
  statut: StatutCommandeEnum
});

/**
 * Schema pour la recherche de commandes avec filtres
 */
export const SearchCommandesSchema = z.object({
  utilisateurId: z.number().int().positive().optional(),
  statut: StatutCommandeEnum.optional(),
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
  montantMin: z.number().positive().optional(),
  montantMax: z.number().positive().optional(),
  numeroCommande: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20)
}).refine(
  (data) => {
    if (data.montantMin !== undefined && data.montantMax !== undefined) {
      return data.montantMin <= data.montantMax;
    }
    return true;
  },
  { message: 'Le montant minimum doit être inférieur ou égal au montant maximum' }
).refine(
  (data) => {
    if (data.dateDebut && data.dateFin) {
      return new Date(data.dateDebut) <= new Date(data.dateFin);
    }
    return true;
  },
  { message: 'La date de début doit être antérieure à la date de fin' }
);

export type SearchCommandesInput = z.infer<typeof SearchCommandesSchema>;

/**
 * Schema pour la pagination
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

// ============================================
// SCHEMAS POUR LES PARAMETRES D'URL
// ============================================

/**
 * Schema pour valider un ID de commande en paramètre
 */
export const CommandeIdParamSchema = z.object({
  id: z.string().min(1, 'L\'ID de la commande est requis')
});

/**
 * Schema pour valider un ID utilisateur en paramètre
 */
export const UtilisateurIdParamSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'L\'ID utilisateur doit être un nombre positif'
    })
});

// ============================================
// SCHEMAS POUR LE BATCH UPDATE
// ============================================

/**
 * Schema pour la mise à jour en lot des commandes
 */
export const BatchUpdateCommandesSchema = z.object({
  commandeIds: z
    .array(z.string())
    .min(1, 'Au moins une commande doit être spécifiée')
    .max(50, 'Maximum 50 commandes peuvent être mises à jour simultanément'),
  statut: StatutCommandeEnum
});

export type BatchUpdateCommandesInput = z.infer<typeof BatchUpdateCommandesSchema>;

// ============================================
// EXPORTS GROUPÉS
// ============================================

export const commandesValidators = {
  // Mutations
  createCommande: CreateCommandeSchema,
  updateCommande: UpdateCommandeSchema,
  updateStatut: UpdateStatutCommandeSchema,
  batchUpdate: BatchUpdateCommandesSchema,

  // Queries
  getById: GetCommandeByIdSchema,
  getByUtilisateur: GetCommandesUtilisateurSchema,
  getByStatut: GetCommandesParStatutSchema,
  search: SearchCommandesSchema,

  // Params
  commandeIdParam: CommandeIdParamSchema,
  utilisateurIdParam: UtilisateurIdParamSchema,

  // Sous-schemas
  article: CommandeArticleSchema,
  pagination: PaginationSchema,
  statutEnum: StatutCommandeEnum
};
