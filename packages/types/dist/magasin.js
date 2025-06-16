"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.articleDataValidationSchema = exports.articleCreationSchema = void 0;
const zod_1 = require("zod");
// Pour création (sans id)
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
