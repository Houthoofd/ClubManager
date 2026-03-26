import { z } from 'zod';
export declare const userInscriptionSchema: z.ZodObject<{
    prenom: z.ZodEffects<z.ZodString, string, string>;
    nom: z.ZodEffects<z.ZodString, string, string>;
    nom_utilisateur: z.ZodString;
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodEffects<z.ZodString, string, string>;
    date_naissance: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>, string, string>, string, string>, string, string>, string, string>;
    genre_id: z.ZodNumber;
    abonnement_id: z.ZodNumber;
    date_inscription: z.ZodEffects<z.ZodString, string, string>;
    status_id: z.ZodNumber;
    grade_id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    grade_id: number;
    email: string;
    password: string;
    prenom: string;
    nom: string;
    nom_utilisateur: string;
    genre_id: number;
    date_naissance: string;
    status_id: number;
    abonnement_id: number;
    date_inscription: string;
}, {
    grade_id: number;
    email: string;
    password: string;
    prenom: string;
    nom: string;
    nom_utilisateur: string;
    genre_id: number;
    date_naissance: string;
    status_id: number;
    abonnement_id: number;
    date_inscription: string;
}>;
export interface UserDataSession {
    isFind: boolean;
    message: string;
    dataToStore: {
        id: number | null;
        userId?: string;
        prenom: string;
        nom: string;
        nom_utilisateur: string;
        email: string;
        date_naissance: string;
        status_id: number;
        grade_id: number | null;
        abonnement_id: number | null;
    };
}
//# sourceMappingURL=user.d.ts.map