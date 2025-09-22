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
    date_inscription: string;
};
export type UserDataSession = {
    isFind: boolean;
    message: string;
    dataToStore: {
        id: number | null;
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
export type Status = {
    id: number;
    status_name: string;
};
export type UserDataInscription = {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    date: string;
    abonnement: string | number;
    genre: string | number;
};
export type UserDataAjout = {
    first_name: string;
    last_name: string;
    nom_utilisateur: string;
    email: string;
    date_of_birth: string;
    genres: number;
    grades: number;
    abonnement: number;
    status: number;
};
export type UtilisateurInscriptionPayload = {
    prenom: string;
    nom: string;
    nom_utilisateur: string;
    email: string;
    password: string;
    genre_id: number;
    abonnement_id: number;
    date_naissance: string;
    date_inscription: string;
    status_id: number;
    grade_id: number;
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
    date_inscription: z.ZodEffects<z.ZodString, string, string>;
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
    date_inscription: string;
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
    date_inscription: string;
}>;
export declare const userInscriptionSchema: z.ZodObject<{
    nom: z.ZodString;
    prenom: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    date: z.ZodEffects<z.ZodString, string, string>;
    abonnement: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string | number, unknown>;
    genre: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string | number, unknown>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    prenom: string;
    nom: string;
    date: string;
    abonnement: string | number;
    genre: string | number;
}, {
    email: string;
    password: string;
    prenom: string;
    nom: string;
    date: string;
    abonnement?: unknown;
    genre?: unknown;
}>;
export declare const userDataAjoutSchema: z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodString;
    nom_utilisateur: z.ZodString;
    email: z.ZodString;
    date_of_birth: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, unknown>;
    genres: z.ZodEffects<z.ZodNumber, number, unknown>;
    grades: z.ZodEffects<z.ZodNumber, number, unknown>;
    abonnement: z.ZodEffects<z.ZodNumber, number, unknown>;
    status: z.ZodEffects<z.ZodNumber, number, unknown>;
}, "strip", z.ZodTypeAny, {
    status: number;
    email: string;
    nom_utilisateur: string;
    abonnement: number;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    genres: number;
    grades: number;
}, {
    email: string;
    nom_utilisateur: string;
    first_name: string;
    last_name: string;
    status?: unknown;
    abonnement?: unknown;
    date_of_birth?: unknown;
    genres?: unknown;
    grades?: unknown;
}>;
export declare const utilisateurInscriptionSchema: z.ZodObject<{
    prenom: z.ZodString;
    nom: z.ZodString;
    nom_utilisateur: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    genre_id: z.ZodEffects<z.ZodNumber, number, unknown>;
    abonnement_id: z.ZodEffects<z.ZodNumber, number, unknown>;
    date_naissance: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, unknown>;
    date_inscription: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, unknown>;
    status_id: z.ZodEffects<z.ZodNumber, number, unknown>;
    grade_id: z.ZodEffects<z.ZodNumber, number, unknown>;
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
    email: string;
    password: string;
    prenom: string;
    nom: string;
    nom_utilisateur: string;
    grade_id?: unknown;
    genre_id?: unknown;
    date_naissance?: unknown;
    status_id?: unknown;
    abonnement_id?: unknown;
    date_inscription?: unknown;
}>;
//# sourceMappingURL=utilisateurs.d.ts.map