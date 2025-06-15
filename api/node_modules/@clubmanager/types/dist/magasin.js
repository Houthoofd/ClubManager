"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.articleDataValidationSchema = void 0;
const zod_1 = require("zod");
exports.articleDataValidationSchema = zod_1.z.object({
    nom: zod_1.z.string(),
    description: zod_1.z.string(),
    prix: zod_1.z.preprocess((val) => Number(val), zod_1.z.number()), // ← transformation automatique
    images: zod_1.z.array(zod_1.z.string()), // si ce ne sont pas des URL, enlève `.url()`
    categorie_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number()), // ← ici aussi
    stocks: zod_1.z.array(zod_1.z.object({
        taille: zod_1.z.string(),
        quantite: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().nonnegative()),
    }))
});
