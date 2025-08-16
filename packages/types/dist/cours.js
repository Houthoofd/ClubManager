// schemas.ts
import { z } from 'zod';
// === Schémas Zod ===
export const coursdataSchema = z.object({
    id: z.number().positive("L'ID du cours doit être un nombre positif"),
    date_cours: z.string().min(1, "La date du cours doit être requis"),
    type_cours: z.string().min(1, "Le type de cours doit être requis"),
    heure_debut: z.string().min(1, "L'heure de début du cours doit être requis"),
    heure_fin: z.string().min(1, "L'heure de fin du cours doit être requis")
});
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
// === Schémas Zod pour AjoutCours et JourCours ===
export const ajoutCoursSchema = z.object({
    heure_debut: z.string().min(1, "L'heure de début du cours doit être requis").nullable(),
    heure_fin: z.string().min(1, "L'heure de fin du cours doit être requis").nullable(),
    jour_semaine: z.string().min(1, "Le jour de la semaine doit être requis"),
    type_cours: z.string().min(1, "Le type de cours doit être requis"),
    professeurs: z.array(z.string().min(1, "Chaque professeur doit avoir un ID"))
});
export const jourCoursSchema = z.object({
    jour: z.string().min(1, "Le jour doit être requis"),
    type_cours: z.string().min(1, "Le type de cours doit être requis"),
    heure_debut: z.string().nullable(),
    heure_fin: z.string().nullable(),
    professeurs: z.array(z.string().min(1, "Chaque professeur doit avoir un ID"))
});
// === Hack CommonJS ===
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        coursdataSchema,
        datareservationSchema,
        datannulationSchema,
        datavalidationSchema,
        ajoutCoursSchema,
        jourCoursSchema
    };
}
