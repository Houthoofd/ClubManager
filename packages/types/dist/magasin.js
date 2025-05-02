"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.articleDataValidationSchema = void 0;
const zod_1 = require("zod");
exports.articleDataValidationSchema = zod_1.z.object({
    nom: zod_1.z.string().min(1, "Le nom de l'article est requis"),
    description: zod_1.z.string().min(1, "La description de l'article est requise"),
    prix: zod_1.z.number().positive("Le prix de l'article doit être un nombre positif"),
    image_url: zod_1.z.string().url("L'URL de l'image doit être valide"),
    categorie_id: zod_1.z.number().int().positive("L'ID de la catégorie doit être un nombre entier positif"),
});
