import { z } from 'zod';
// === Validation Zod ===
export const articleCreationSchema = z.object({
    nom: z.string(),
    description: z.string(),
    prix: z.preprocess((val) => Number(val), z.number()),
    images: z.array(z.string()),
    categorie_id: z.preprocess((val) => Number(val), z.number()),
    stocks: z.array(z.object({
        taille: z.string(),
        quantite: z.preprocess((val) => Number(val), z.number().int().nonnegative()),
    }))
});
export const articleDataValidationSchema = articleCreationSchema.extend({
    id: z.number().int().positive(),
});
export const nouvelleCommandeSchema = z.object({
    utilisateur_id: z.preprocess(val => Number(val), z.number().int().positive()),
    articles: z.array(z.object({
        article_id: z.preprocess(val => Number(val), z.number().int().positive()),
        taille: z.string().optional(),
        quantite: z.preprocess(val => Number(val), z.number().int().positive()),
        prix: z.preprocess(val => Number(val), z.number().nonnegative()),
    })),
    statut: z.string().optional(),
    date: z.string().datetime().optional(),
    total: z.preprocess(val => Number(val), z.number().nonnegative().optional()),
});
export const articleCommandeSchema = z.object({
    article_id: z.preprocess((val) => Number(val), z.number().int().positive()),
    taille_id: z.preprocess((val) => val === undefined || val === null || val === "" ? undefined : Number(val), z.number().int().positive().optional()),
    quantite: z.preprocess((val) => Number(val), z.number().int().positive()),
    prix: z.preprocess((val) => Number(val), z.number().nonnegative()),
});
// === Hack CommonJS pour importer les types et schémas ===
const exported = {};
module.exports = exported;
export default exported;
