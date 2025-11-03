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
    professeurs: string[];
};
export type AjoutCours = {
    nom: string;
    heure_debut: string | null;
    heure_fin: string | null;
    jour_semaine: string;
    type_cours: string;
    professeurs: string[];
};
export type PlanningCoursProfesseur = {
    cours_recurrent_id: number;
    type_cours: string;
    jour_semaine: number | string;
    heure_debut: string;
    heure_fin: string;
    est_recurrent_actif: boolean | number;
    professeur_id: number;
    professeur_nom: string;
    professeur_prenom: string;
};
export declare const coursdataSchema: z.ZodObject<{
    id: z.ZodNumber;
    date_cours: z.ZodString;
    type_cours: z.ZodString;
    heure_debut: z.ZodString;
    heure_fin: z.ZodString;
}, z.core.$strip>;
export declare const datareservationSchema: z.ZodObject<{
    cours_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    utilisateur_nom: z.ZodString;
    utilisateur_prenom: z.ZodString;
}, z.core.$strip>;
export declare const datannulationSchema: z.ZodObject<{
    cours_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    utilisateur_nom: z.ZodString;
    utilisateur_prenom: z.ZodString;
}, z.core.$strip>;
export declare const datavalidationSchema: z.ZodObject<{
    cours_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    utilisateur_nom: z.ZodString;
    utilisateur_prenom: z.ZodString;
}, z.core.$strip>;
export declare const planningCoursProfesseurSchema: z.ZodObject<{
    cours_recurrent_id: z.ZodNumber;
    type_cours: z.ZodString;
    jour_semaine: z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>;
    heure_debut: z.ZodString;
    heure_fin: z.ZodString;
    est_recurrent_actif: z.ZodUnion<readonly [z.ZodBoolean, z.ZodNumber]>;
    professeur_id: z.ZodNumber;
    professeur_nom: z.ZodString;
    professeur_prenom: z.ZodString;
}, z.core.$strip>;
export type CoursDataValidated = z.infer<typeof coursdataSchema>;
export type DataReservationValidated = z.infer<typeof datareservationSchema>;
export type DataAnnulationValidated = z.infer<typeof datannulationSchema>;
export type DataValidationValidated = z.infer<typeof datavalidationSchema>;
export type PlanningCoursProfesseurValidated = z.infer<typeof planningCoursProfesseurSchema>;
//# sourceMappingURL=cours.d.ts.map