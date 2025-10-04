import { z } from 'zod';
export declare const userInscriptionSchema: z.ZodObject<{
    prenom: z.ZodString;
    nom: z.ZodString;
    nom_utilisateur: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    date_naissance: z.ZodString;
    genre_id: z.ZodNumber;
    abonnement_id: z.ZodNumber;
    date_inscription: z.ZodString;
    status_id: z.ZodNumber;
    grade_id: z.ZodNumber;
}, z.core.$strip>;
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