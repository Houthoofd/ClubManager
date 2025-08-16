import { z } from 'zod';
// Schéma Zod pour valider les données d'Abonnement
export const coursdataSchema = z.object({
    id: z.number().positive("L'ID du cours doit être un nombre positif"),
    date_cours: z.string().min(1, "La date du cours doit être requis"),
    type_cours: z.string().min(1, "Le type de cours doit être requis"),
    heure_debut: z.string().min(1, "L'heure de début du cours doit être requis"),
    heure_fin: z.string().min(1, "L'heure de fin du cours doit être requis")
});
// Schéma Zod pour valider les données d'Abonnement
export const datareservationSchema = z.object({
    cours_id: z.preprocess((val) => Number(val), z.number().positive("L'ID du cours doit être un nombre positif")),
    utilisateur_nom: z.string().min(1, "Le nom de l'utilisateur est requis"),
    utilisateur_prenom: z.string().min(1, "Le prenom de l'utilisateur est requis")
});
export const datannulationSchema = z.object({
    cours_id: z.preprocess((val) => Number(val), z.number().positive("L'ID du cours doit être un nombre positif")),
    utilisateur_nom: z.string().min(1, "Le nom de l'utilisateur est requis"),
    utilisateur_prenom: z.string().min(1, "Le prenom de l'utilisateur est requis")
});
export const datavalidationSchema = z.object({
    cours_id: z.preprocess((val) => Number(val), z.number().positive("L'ID du cours doit être un nombre positif")),
    utilisateur_nom: z.string().min(1, "Le nom de l'utilisateur est requis"),
    utilisateur_prenom: z.string().min(1, "Le prenom de l'utilisateur est requis")
});
