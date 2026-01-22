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
// Nouveau schéma pour la recherche par email
export const userSearchByEmailSchema = z.object({
    email: z.string().email("L'email est invalide"),
});
// Nouveau schéma Zod pour la connexion par userId
export const userDataLoginByUserIdSchema = z.object({
    userId: z.string().min(1, "L'userId est requis"),
    password: z.string().min(1, "Le mot de passe est requis"), // Permettre tous les mots de passe y compris "password123"
});
// Schéma Zod pour valider les données de connexion
export const userDataLoginSchema = z.object({
    email: z.string().email("L'email est invalide"),
    password: z.string().min(1, "Le mot de passe est requis"), // Permettre tous les mots de passe y compris "password123"
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
// Schéma Zod pour valider UserDataAjout avec conversion string->number
export const userDataAjoutSchema = z.object({
    first_name: z.string().min(1, "Le prénom est requis"),
    last_name: z.string().min(1, "Le nom est requis"),
    nom_utilisateur: z.string().min(1, "Le nom d'utilisateur est requis"),
    email: z.string().email("L'email est invalide"),
    date_of_birth: z.preprocess(val => {
        // Si la date est vide ou invalide, retourne undefined pour déclencher une erreur
        if (typeof val === "string" && !isNaN(Date.parse(val))) {
            // Retourne la date au format YYYY-MM-DD
            return new Date(val).toISOString().split('T')[0];
        }
        return undefined;
    }, z.string().refine((val) => !isNaN(Date.parse(val)), "La date de naissance est invalide")),
    genres: z.preprocess(val => typeof val === "string" ? parseInt(val, 10) : val, z.number().positive("Le genre est requis")),
    grades: z.preprocess(val => typeof val === "string" ? parseInt(val, 10) : val, z.number().positive("Le grade est requis")),
    abonnement: z.preprocess(val => typeof val === "string" ? parseInt(val, 10) : val, z.number().positive("L'abonnement est requis")),
    status: z.preprocess(val => typeof val === "string" ? parseInt(val, 10) : val, z.number().positive("Le statut est requis")),
});
// Schéma Zod pour valider UtilisateurInscriptionPayload
export const utilisateurInscriptionSchema = z.object({
    prenom: z.string().min(1, "Le prénom est requis"),
    nom: z.string().min(1, "Le nom est requis"),
    nom_utilisateur: z.string().min(1, "Le nom d'utilisateur est requis").optional().default(""), // Rendre optionnel avec défaut
    email: z.string().email("L'email est invalide"),
    password: z.string().min(1, "Le mot de passe est requis").optional().default("password123"), // Mot de passe par défaut
    genre_id: z.preprocess(val => val === undefined ? 1 : val, z.number().positive("Le genre ID doit être un nombre positif")),
    abonnement_id: z.preprocess(val => val === undefined ? 1 : val, z.number().positive("L'abonnement ID doit être un nombre positif")),
    date_naissance: z.preprocess(val => {
        if (val === undefined)
            return new Date().toISOString().split('T')[0];
        if (typeof val === "string" && !isNaN(Date.parse(val))) {
            return new Date(val).toISOString().split('T')[0];
        }
        return val;
    }, z.string().refine((val) => !isNaN(Date.parse(val)), "La date de naissance est invalide")),
    date_inscription: z.preprocess(val => {
        if (val === undefined)
            return new Date().toISOString().split('T')[0];
        if (typeof val === "string" && !isNaN(Date.parse(val))) {
            return new Date(val).toISOString().split('T')[0];
        }
        return val;
    }, z.string().refine((val) => !isNaN(Date.parse(val)), "La date d'inscription est invalide")),
    status_id: z.preprocess(val => val === undefined ? 1 : val, z.number().positive("Le status ID doit être un nombre positif")),
    grade_id: z.preprocess(val => val === undefined ? 1 : val, z.number().positive("Le grade ID doit être un nombre positif")),
});
