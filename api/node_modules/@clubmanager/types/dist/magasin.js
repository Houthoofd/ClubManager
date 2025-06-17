"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.articleCommandeSchema = exports.nouvelleCommandeSchema = exports.articleDataValidationSchema = exports.articleCreationSchema = void 0;
const zod_1 = require("zod");
// === Schémas de validation ===
// Pour création d'article (sans id)
exports.articleCreationSchema = zod_1.z.object({
    nom: zod_1.z.string(),
    description: zod_1.z.string(),
    prix: zod_1.z.preprocess((val) => Number(val), zod_1.z.number()),
    images: zod_1.z.array(zod_1.z.string()),
    categorie_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number()),
    stocks: zod_1.z.array(zod_1.z.object({
        taille: zod_1.z.string(),
        quantite: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().nonnegative()),
    }))
});
// Pour lecture/modification (avec id)
exports.articleDataValidationSchema = exports.articleCreationSchema.extend({
    id: zod_1.z.number().int().positive(),
});
// Pour création de commande
exports.nouvelleCommandeSchema = zod_1.z.object({
    utilisateur_id: zod_1.z.preprocess(val => Number(val), zod_1.z.number().int().positive()),
    articles: zod_1.z.array(zod_1.z.object({
        article_id: zod_1.z.preprocess(val => Number(val), zod_1.z.number().int().positive()),
        taille: zod_1.z.string().optional(), // taille en string optionnelle
        quantite: zod_1.z.preprocess(val => Number(val), zod_1.z.number().int().positive()),
        prix: zod_1.z.preprocess(val => Number(val), zod_1.z.number().nonnegative()),
    })),
    statut: zod_1.z.string().optional(),
    date: zod_1.z.string().datetime().optional(),
    total: zod_1.z.preprocess(val => Number(val), zod_1.z.number().nonnegative().optional()),
});
exports.articleCommandeSchema = zod_1.z.object({
    article_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
    taille_id: zod_1.z.preprocess((val) => val === undefined || val === null || val === "" ? undefined : Number(val), zod_1.z.number().int().positive().optional()),
    quantite: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
    prix: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().nonnegative()),
});
