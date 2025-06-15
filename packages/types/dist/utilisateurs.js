"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = exports.userDataLoginSchema = exports.genresSchema = exports.gradeSchema = exports.abonnementSchema = void 0;
const zod_1 = require("zod");
// Schéma Zod pour valider les données d'Abonnement
exports.abonnementSchema = zod_1.z.object({
    id: zod_1.z.number().positive("L'ID de l'abonnement doit être un nombre positif"),
    nom_plan: zod_1.z.string().min(1, "Le nom du plan est requis")
});
// Schéma Zod pour valider les données de Grade
exports.gradeSchema = zod_1.z.object({
    id: zod_1.z.number().positive("L'ID du grade doit être un nombre positif"),
    grade_id: zod_1.z.string().min(1, "Le grade ID est requis")
});
// Schéma Zod pour valider les données de Genres
exports.genresSchema = zod_1.z.object({
    id: zod_1.z.number().positive("L'ID du genre doit être un nombre positif"),
    genre_name: zod_1.z.string().min(1, "Le nom du genre est requis")
});
// Schéma Zod pour valider les données de Genres
exports.userDataLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("L'email est invalide"),
    password: zod_1.z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});
// Schéma Zod pour valider les données d'inscription utilisateur
exports.userSchema = zod_1.z.object({
    prenom: zod_1.z.string().min(1, "Le prénom est requis"),
    nom: zod_1.z.string().min(1, "Le nom est requis"),
    nom_utilisateur: zod_1.z.string().min(1, "Le nom d'utilisateur est requis"),
    email: zod_1.z.string().email("L'email est invalide"),
    genre_id: zod_1.z.number().positive("Le genre ID doit être un nombre positif").nullable(), // Autorise null
    date_naissance: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), "La date de naissance est invalide"),
    password: zod_1.z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    status_id: zod_1.z.number().positive("Le status ID doit être un nombre positif"),
    grade_id: zod_1.z.number().positive("Le grade ID doit être un nombre positif").nullable(), // Autorise null
    abonnement_id: zod_1.z.number().positive("L'abonnement ID doit être un nombre positif").nullable(), // Autorise null
});
