import { z } from 'zod';
export type CoursData = {
    id: number;
    date_cours: string;
    type_cours: string;
    heure_debut: string;
    heure_fin: string;
    utilisateurs?: Utilisateur[];
};
export type Utilisateur = {
    nom: string;
    prenom: string;
    presence: number;
};
export type UtilisateursParCours = CoursData & {
    utilisateurs: Utilisateur[];
};
export type DataReservation = {
    cours_id: number;
    utilisateur_nom: string;
    utilisateur_prenom: string;
};
export type DataAnnulation = {
    cours_id: number;
    utilisateur_nom: string;
    utilisateur_prenom: string;
};
export type DataValidation = {
    cours_id: number;
    utilisateur_nom: string;
    utilisateur_prenom: string;
};
export type DataInscription = {
    cours_id: number;
    utilisateur_id: number;
    status_id: number;
};
export type JourCours = {
    jour: string;
    type_cours: string;
    heure_debut: string | null;
    heure_fin: string | null;
};
export type AjoutCours = {
    heure_debut: string | null;
    heure_fin: string | null;
    jour_semaine: string;
    type_cours: string;
    professeurs: string[];
};
export declare const coursdataSchema: z.ZodObject<{
    id: z.ZodNumber;
    date_cours: z.ZodString;
    type_cours: z.ZodString;
    heure_debut: z.ZodString;
    heure_fin: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    date_cours: string;
    type_cours: string;
    heure_debut: string;
    heure_fin: string;
}, {
    id: number;
    date_cours: string;
    type_cours: string;
    heure_debut: string;
    heure_fin: string;
}>;
export declare const datareservationSchema: z.ZodObject<{
    cours_id: z.ZodNumber;
    utilisateur_nom: z.ZodString;
    utilisateur_prenom: z.ZodString;
}, "strip", z.ZodTypeAny, {
    cours_id: number;
    utilisateur_nom: string;
    utilisateur_prenom: string;
}, {
    cours_id: number;
    utilisateur_nom: string;
    utilisateur_prenom: string;
}>;
export declare const datannulationSchema: z.ZodObject<{
    cours_id: z.ZodNumber;
    utilisateur_nom: z.ZodString;
    utilisateur_prenom: z.ZodString;
}, "strip", z.ZodTypeAny, {
    cours_id: number;
    utilisateur_nom: string;
    utilisateur_prenom: string;
}, {
    cours_id: number;
    utilisateur_nom: string;
    utilisateur_prenom: string;
}>;
export declare const datavalidationSchema: z.ZodObject<{
    cours_id: z.ZodNumber;
    utilisateur_nom: z.ZodString;
    utilisateur_prenom: z.ZodString;
}, "strip", z.ZodTypeAny, {
    cours_id: number;
    utilisateur_nom: string;
    utilisateur_prenom: string;
}, {
    cours_id: number;
    utilisateur_nom: string;
    utilisateur_prenom: string;
}>;
//# sourceMappingURL=cours.d.ts.map