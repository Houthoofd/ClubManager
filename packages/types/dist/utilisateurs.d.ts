import { z } from "zod";
export type UserData = {
    prenom: string;
    nom: string;
    nom_utilisateur: string;
    email: string;
    genre_id: number | null;
    date_naissance: string;
    password: string;
    status_id: number;
    grade_id: number | null;
    abonnement_id: number | null;
};
export type UserDataSession = {
    isFind: boolean;
    message: string;
    dataToStore: {
        prenom: string;
        nom: string;
        nom_utilisateur: string;
        email: string;
        date_naissance: string;
        status_id: number;
        grade_id: number | null;
        abonnement_id: number | null;
    };
};
export type Professeur = {
    id: string;
    prenom: string;
    nom: string;
    nom_utilisateur: string;
    email: string;
    genre_id: number;
    date_naissance: string;
    grade_id: number;
};
export type UserDataLogin = {
    email: string;
    password: string;
};
export type Abonnement = {
    id: number;
    nom_plan: string;
};
export type Grade = {
    id: number;
    grade_id: string;
};
export type Genres = {
    id: number;
    genre_name: string;
};
export declare const abonnementSchema: z.ZodObject<{
    id: z.ZodNumber;
    nom_plan: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    nom_plan: string;
}, {
    id: number;
    nom_plan: string;
}>;
export declare const gradeSchema: z.ZodObject<{
    id: z.ZodNumber;
    grade_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    grade_id: string;
}, {
    id: number;
    grade_id: string;
}>;
export declare const genresSchema: z.ZodObject<{
    id: z.ZodNumber;
    genre_name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    genre_name: string;
}, {
    id: number;
    genre_name: string;
}>;
export declare const userDataLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const userSchema: z.ZodObject<{
    prenom: z.ZodString;
    nom: z.ZodString;
    nom_utilisateur: z.ZodString;
    email: z.ZodString;
    genre_id: z.ZodNullable<z.ZodNumber>;
    date_naissance: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    status_id: z.ZodNumber;
    grade_id: z.ZodNullable<z.ZodNumber>;
    abonnement_id: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    grade_id: number | null;
    email: string;
    password: string;
    prenom: string;
    nom: string;
    nom_utilisateur: string;
    genre_id: number | null;
    date_naissance: string;
    status_id: number;
    abonnement_id: number | null;
}, {
    grade_id: number | null;
    email: string;
    password: string;
    prenom: string;
    nom: string;
    nom_utilisateur: string;
    genre_id: number | null;
    date_naissance: string;
    status_id: number;
    abonnement_id: number | null;
}>;
//# sourceMappingURL=utilisateurs.d.ts.map