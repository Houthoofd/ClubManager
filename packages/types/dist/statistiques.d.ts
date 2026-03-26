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
    cours_id: z.ZodEffects<z.ZodNumber, number, unknown>;
    titre: z.ZodString;
    frequentation: z.ZodEffects<z.ZodNumber, number, unknown>;
}, "strip", z.ZodTypeAny, {
    cours_id: number;
    titre: string;
    frequentation: number;
}, {
    titre: string;
    cours_id?: unknown;
    frequentation?: unknown;
}>;
export declare const frequentationParMoisSchema: z.ZodObject<{
    mois: z.ZodString;
    frequentation: z.ZodEffects<z.ZodNumber, number, unknown>;
}, "strip", z.ZodTypeAny, {
    frequentation: number;
    mois: string;
}, {
    mois: string;
    frequentation?: unknown;
}>;
export declare const statistiquesFrequentationSchema: z.ZodObject<{
    totalFrequentation: z.ZodEffects<z.ZodNumber, number, unknown>;
    frequentationParCours: z.ZodArray<z.ZodObject<{
        cours_id: z.ZodEffects<z.ZodNumber, number, unknown>;
        titre: z.ZodString;
        frequentation: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        cours_id: number;
        titre: string;
        frequentation: number;
    }, {
        titre: string;
        cours_id?: unknown;
        frequentation?: unknown;
    }>, "many">;
    frequentationParMois: z.ZodArray<z.ZodObject<{
        mois: z.ZodString;
        frequentation: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        frequentation: number;
        mois: string;
    }, {
        mois: string;
        frequentation?: unknown;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    totalFrequentation: number;
    frequentationParCours: {
        cours_id: number;
        titre: string;
        frequentation: number;
    }[];
    frequentationParMois: {
        frequentation: number;
        mois: string;
    }[];
}, {
    frequentationParCours: {
        titre: string;
        cours_id?: unknown;
        frequentation?: unknown;
    }[];
    frequentationParMois: {
        mois: string;
        frequentation?: unknown;
    }[];
    totalFrequentation?: unknown;
}>;
export declare const progressionParCoursSchema: z.ZodObject<{
    cours_id: z.ZodEffects<z.ZodNumber, number, unknown>;
    titre: z.ZodString;
    progression: z.ZodEffects<z.ZodNumber, number, unknown>;
}, "strip", z.ZodTypeAny, {
    cours_id: number;
    titre: string;
    progression: number;
}, {
    titre: string;
    cours_id?: unknown;
    progression?: unknown;
}>;
export declare const statistiquesProgressionUtilisateurSchema: z.ZodObject<{
    utilisateur_id: z.ZodEffects<z.ZodNumber, number, unknown>;
    coursSuivis: z.ZodEffects<z.ZodNumber, number, unknown>;
    progressionParCours: z.ZodArray<z.ZodObject<{
        cours_id: z.ZodEffects<z.ZodNumber, number, unknown>;
        titre: z.ZodString;
        progression: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        cours_id: number;
        titre: string;
        progression: number;
    }, {
        titre: string;
        cours_id?: unknown;
        progression?: unknown;
    }>, "many">;
    niveauActuel: z.ZodString;
}, "strip", z.ZodTypeAny, {
    utilisateur_id: number;
    coursSuivis: number;
    progressionParCours: {
        cours_id: number;
        titre: string;
        progression: number;
    }[];
    niveauActuel: string;
}, {
    progressionParCours: {
        titre: string;
        cours_id?: unknown;
        progression?: unknown;
    }[];
    niveauActuel: string;
    utilisateur_id?: unknown;
    coursSuivis?: unknown;
}>;
//# sourceMappingURL=statistiques.d.ts.map