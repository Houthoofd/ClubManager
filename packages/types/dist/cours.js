"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.datavalidationSchema = exports.datannulationSchema = exports.datareservationSchema = exports.coursdataSchema = void 0;
const zod_1 = require("zod");
// Schéma Zod pour valider les données d'Abonnement
exports.coursdataSchema = zod_1.z.object({
    id: zod_1.z.number().positive("L'ID du cours doit être un nombre positif"),
    date_cours: zod_1.z.string().min(1, "La date du cours doit être requis"),
    type_cours: zod_1.z.string().min(1, "Le type de cours doit être requis"),
    heure_debut: zod_1.z.string().min(1, "L'heure de début du cours doit être requis"),
    heure_fin: zod_1.z.string().min(1, "L'heure de fin du cours doit être requis")
});
// Schéma Zod pour valider les données d'Abonnement
exports.datareservationSchema = zod_1.z.object({
    cours_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().positive("L'ID du cours doit être un nombre positif")),
    utilisateur_nom: zod_1.z.string().min(1, "Le nom de l'utilisateur est requis"),
    utilisateur_prenom: zod_1.z.string().min(1, "Le prenom de l'utilisateur est requis")
});
exports.datannulationSchema = zod_1.z.object({
    cours_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().positive("L'ID du cours doit être un nombre positif")),
    utilisateur_nom: zod_1.z.string().min(1, "Le nom de l'utilisateur est requis"),
    utilisateur_prenom: zod_1.z.string().min(1, "Le prenom de l'utilisateur est requis")
});
exports.datavalidationSchema = zod_1.z.object({
    cours_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().positive("L'ID du cours doit être un nombre positif")),
    utilisateur_nom: zod_1.z.string().min(1, "Le nom de l'utilisateur est requis"),
    utilisateur_prenom: zod_1.z.string().min(1, "Le prenom de l'utilisateur est requis")
});
