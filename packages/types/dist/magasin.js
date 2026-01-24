import { z } from 'zod';
// Schéma Zod pour la vérification d'un nom d'article dans une catégorie
export const articleNomCategorieSchema = z.object({
    nom: z.string(),
    categorie_id: z.preprocess((val) => Number(val), z.number().int().positive()),
});
// === Validation Zod (importés pour inférence automatique) ===
// Schéma création d’article (sans id)
export const articleCreationSchema = z.object({
    nom: z.string(),
    description: z.string(),
    prix: z.preprocess((val) => Number(val), z.number()),
    images: z.array(z.string()).default([]), // Rendre optionnel avec valeur par défaut
    categorie_id: z.preprocess((val) => Number(val), z.number()),
    stocks: z.array(z.object({
        taille: z.string(),
        quantite: z.preprocess((val) => Number(val), z.number().int().nonnegative()),
    }))
});
// Schéma article complet (avec id)
export const articleDataValidationSchema = articleCreationSchema.extend({
    id: z.number().int().positive(),
});
// Schéma création de commande
export const nouvelleCommandeSchema = z.object({
    utilisateur_id: z.preprocess((val) => Number(val), z.number().int().positive()),
    articles: z.array(z.object({
        article_id: z.preprocess((val) => Number(val), z.number().int().positive()),
        taille: z.string().optional(),
        quantite: z.preprocess((val) => Number(val), z.number().int().positive()),
        prix: z.preprocess((val) => Number(val), z.number().nonnegative()),
    })),
    statut: z.string().optional(),
    date: z.string().datetime().optional(),
    total: z.preprocess((val) => Number(val), z.number().nonnegative().optional()),
});
// Schéma ArticleCommande
export const articleCommandeSchema = z.object({
    article_id: z.preprocess((val) => Number(val), z.number().int().positive()),
    taille_id: z.preprocess((val) => val === undefined || val === null || val === "" ? undefined : Number(val), z.number().int().positive().optional()),
    quantite: z.preprocess((val) => Number(val), z.number().int().positive()),
    prix: z.preprocess((val) => Number(val), z.number().nonnegative()),
});
// === Statuts et configuration ===
export var StatutCommande;
(function (StatutCommande) {
    StatutCommande["EN_ATTENTE"] = "en_attente";
    StatutCommande["CONFIRMEE"] = "confirmee";
    StatutCommande["EXPEDIEE"] = "expediee";
    StatutCommande["LIVREE"] = "livree";
    StatutCommande["ANNULEE"] = "annulee";
})(StatutCommande || (StatutCommande = {}));
// === Erreurs spécifiques ===
export class MagasinError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'MagasinError';
    }
}
export const TAILLES_MAPPING = {
    'S': 1,
    'M': 2,
    'L': 3,
    'XL': 4
};
export const TAILLES_REVERSE_MAPPING = {
    1: 'S',
    2: 'M',
    3: 'L',
    4: 'XL'
};
