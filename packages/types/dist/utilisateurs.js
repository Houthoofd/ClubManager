// Pour compatibilité ESM : utilisez import au lieu de require
import { z } from "zod";
// Schéma Zod pour valider les données d'Abonnement
export const abonnementSchema = z.object({
    id: z.number().positive("L'ID de l'abonnement doit être un nombre positif"),
    nom_plan: z.string().min(1, "Le nom du plan est requis")
});
// Schéma Zod pour valider les données de Grade
export const gradeSchema = z.object({
    id: z.number().positive("L'ID du grade doit être un nombre positif"),
    grade_id: z.string().min(1, "Le grade ID est requis")
});
// Schéma Zod pour valider les données de Genres
export const genresSchema = z.object({
    id: z.number().positive("L'ID du genre doit être un nombre positif"),
    genre_name: z.string().min(1, "Le nom du genre est requis")
});
// Schéma Zod pour valider les données de Genres
export const userDataLoginSchema = z.object({
    email: z.string().email("L'email est invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});
// Schéma Zod pour valider les données d'inscription utilisateur
export const userSchema = z.object({
    prenom: z.string().min(1, "Le prénom est requis"),
    nom: z.string().min(1, "Le nom est requis"),
    nom_utilisateur: z.string().min(1, "Le nom d'utilisateur est requis"),
    email: z.string().email("L'email est invalide"),
    genre_id: z.number().positive("Le genre ID doit être un nombre positif").nullable(), // Autorise null
    date_naissance: z.string().refine((val) => !isNaN(Date.parse(val)), "La date de naissance est invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    status_id: z.number().positive("Le status ID doit être un nombre positif"),
    grade_id: z.number().positive("Le grade ID doit être un nombre positif").nullable(), // Autorise null
    abonnement_id: z.number().positive("L'abonnement ID doit être un nombre positif").nullable(), // Autorise null
    date_inscription: z.string().refine((val) => !isNaN(Date.parse(val)), "La date d'inscription est invalide"),
});
// Schéma Zod pour valider les données d'inscription simplifiée
export const userInscriptionSchema = z.object({
    nom: z.string().min(1, "Le nom est requis"),
    prenom: z.string().min(1, "Le prénom est requis"),
    email: z.string().email("L'email est invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "La date est invalide"),
    abonnement: z.preprocess(val => typeof val === "string" && /^\d+$/.test(val) ? parseInt(val, 10) : val, z.union([z.string().min(1), z.number().positive()])),
    genre: z.preprocess(val => typeof val === "string" && /^\d+$/.test(val) ? parseInt(val, 10) : val, z.union([z.string().min(1), z.number().positive()])),
});
