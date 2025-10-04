import { z } from "zod";
export type FrequentationParCours = {
    cours_id: number;
    titre: string;
    frequentation: number;
};
export type FrequentationParMois = {
    mois: string;
    frequentation: number;
};
export type StatistiquesFrequentation = {
    totalFrequentation: number;
    frequentationParCours: FrequentationParCours[];
    frequentationParMois: FrequentationParMois[];
};
export type ProgressionParCours = {
    cours_id: number;
    titre: string;
    progression: number;
};
export type StatistiquesProgressionUtilisateur = {
    utilisateur_id: number;
    coursSuivis: number;
    progressionParCours: ProgressionParCours[];
    niveauActuel: string;
};
export declare const frequentationParCoursSchema: z.ZodObject<{
    cours_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    titre: z.ZodString;
    frequentation: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
}, z.core.$strip>;
export declare const frequentationParMoisSchema: z.ZodObject<{
    mois: z.ZodString;
    frequentation: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
}, z.core.$strip>;
export declare const statistiquesFrequentationSchema: z.ZodObject<{
    totalFrequentation: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    frequentationParCours: z.ZodArray<z.ZodObject<{
        cours_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
        titre: z.ZodString;
        frequentation: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    }, z.core.$strip>>;
    frequentationParMois: z.ZodArray<z.ZodObject<{
        mois: z.ZodString;
        frequentation: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const progressionParCoursSchema: z.ZodObject<{
    cours_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    titre: z.ZodString;
    progression: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
}, z.core.$strip>;
export declare const statistiquesProgressionUtilisateurSchema: z.ZodObject<{
    utilisateur_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    coursSuivis: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    progressionParCours: z.ZodArray<z.ZodObject<{
        cours_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
        titre: z.ZodString;
        progression: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    }, z.core.$strip>>;
    niveauActuel: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=statistiques.d.ts.map