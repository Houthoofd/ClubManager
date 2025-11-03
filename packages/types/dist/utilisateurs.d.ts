import { z } from "zod";
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
}, z.core.$strip>;
export declare const gradeSchema: z.ZodObject<{
    id: z.ZodNumber;
    grade_id: z.ZodString;
}, z.core.$strip>;
export declare const genresSchema: z.ZodObject<{
    id: z.ZodNumber;
    genre_name: z.ZodString;
}, z.core.$strip>;
export type UserSearchByEmail = {
    email: string;
};
export interface AvailableUserForLogin {
    userId: string;
    prenom: string;
    nom: string;
    date_naissance: string;
    nom_utilisateur: string;
    age: number;
    initiales: string;
    relation_familiale?: string;
    est_responsable?: boolean;
}
export declare const userSearchByEmailSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const userDataLoginByUserIdSchema: z.ZodObject<{
    userId: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const userDataLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const userSchema: z.ZodObject<{
    prenom: z.ZodString;
    nom: z.ZodString;
    nom_utilisateur: z.ZodString;
    email: z.ZodString;
    genre_id: z.ZodNullable<z.ZodNumber>;
    date_naissance: z.ZodString;
    password: z.ZodString;
    status_id: z.ZodNumber;
    grade_id: z.ZodNullable<z.ZodNumber>;
    abonnement_id: z.ZodNullable<z.ZodNumber>;
    date_inscription: z.ZodString;
}, z.core.$strip>;
export declare const userInscriptionSchema: z.ZodObject<{
    nom: z.ZodString;
    prenom: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    date: z.ZodString;
    abonnement: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
    genre: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
}, z.core.$strip>;
export declare const userDataAjoutSchema: z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodString;
    nom_utilisateur: z.ZodString;
    email: z.ZodString;
    date_of_birth: z.ZodPipe<z.ZodTransform<string | undefined, unknown>, z.ZodString>;
    genres: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNumber>;
    grades: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNumber>;
    abonnement: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNumber>;
    status: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNumber>;
}, z.core.$strip>;
export declare const utilisateurInscriptionSchema: z.ZodObject<{
    prenom: z.ZodString;
    nom: z.ZodString;
    nom_utilisateur: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    email: z.ZodString;
    password: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    genre_id: z.ZodPipe<z.ZodTransform<{} | null, unknown>, z.ZodNumber>;
    abonnement_id: z.ZodPipe<z.ZodTransform<{} | null, unknown>, z.ZodNumber>;
    date_naissance: z.ZodPipe<z.ZodTransform<{} | null, unknown>, z.ZodString>;
    date_inscription: z.ZodPipe<z.ZodTransform<{} | null, unknown>, z.ZodString>;
    status_id: z.ZodPipe<z.ZodTransform<{} | null, unknown>, z.ZodNumber>;
    grade_id: z.ZodPipe<z.ZodTransform<{} | null, unknown>, z.ZodNumber>;
}, z.core.$strip>;
export interface UserData {
    id?: number;
    userId?: string;
    prenom?: string;
    nom?: string;
    first_name?: string;
    last_name?: string;
    nom_utilisateur?: string;
    email?: string;
    genre_id?: number | null;
    date_of_birth?: string;
    date_naissance?: string;
    password?: string;
    status_id?: number;
    active?: boolean;
    grade_id?: number | null;
    abonnement_id?: number | null;
    date_inscription?: string;
}
export type UserDataLoginByUserId = {
    userId: string;
    password: string;
};
//# sourceMappingURL=utilisateurs.d.ts.map