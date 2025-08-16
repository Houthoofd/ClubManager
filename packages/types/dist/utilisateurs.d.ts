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
export declare const abonnementSchema: any;
export declare const gradeSchema: any;
export declare const genresSchema: any;
export declare const userDataLoginSchema: any;
export declare const userSchema: any;
//# sourceMappingURL=utilisateurs.d.ts.map