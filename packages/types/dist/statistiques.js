import { z } from "zod";
export const frequentationParCoursSchema = z.object({
    cours_id: z.preprocess(val => Number(val), z.number().int().positive()),
    titre: z.string(),
    frequentation: z.preprocess(val => Number(val), z.number().int().nonnegative()),
});
export const frequentationParMoisSchema = z.object({
    mois: z.string(),
    frequentation: z.preprocess(val => Number(val), z.number().int().nonnegative()),
});
export const statistiquesFrequentationSchema = z.object({
    totalFrequentation: z.preprocess(val => Number(val), z.number().int().nonnegative()),
    frequentationParCours: z.array(frequentationParCoursSchema),
    frequentationParMois: z.array(frequentationParMoisSchema),
});
export const progressionParCoursSchema = z.object({
    cours_id: z.preprocess(val => Number(val), z.number().int().positive()),
    titre: z.string(),
    progression: z.preprocess(val => Number(val), z.number().int().nonnegative()),
});
export const statistiquesProgressionUtilisateurSchema = z.object({
    utilisateur_id: z.preprocess(val => Number(val), z.number().int().positive()),
    coursSuivis: z.preprocess(val => Number(val), z.number().int().nonnegative()),
    progressionParCours: z.array(progressionParCoursSchema),
    niveauActuel: z.string(),
});
