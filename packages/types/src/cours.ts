import { z } from 'zod';


export type CoursData = {
  id: number;
  date_cours: string;  // Peut être une date sous forme de chaîne
  type_cours: string;
  heure_debut: string;  // Heure de début sous forme de chaîne
  heure_fin: string;    // Heure de fin sous forme de chaîne
};

export type DataReservation = {
  cours_id : number,
  utilisateur_nom: string,
  utilisateur_prenom: string
}

export type DataInscription = {
  cours_id : number,
  utilisateur_id: number,
  status_id : number
}

// Schéma Zod pour valider les données d'Abonnement
export const coursdataSchema = z.object({
  id: z.number().positive("L'ID du cours doit être un nombre positif"),
  date_cours: z.string().min(1, "La date du cours doit être requis"),
  type_cours: z.string().min(1, "Le type de cours doit être requis"),
  heure_debut: z.string().min(1, "L'heure de début du cours doit être requis"),
  heure_fin: z.string().min(1, "L'heure de fin du cours doit être requis")
});

// Schéma Zod pour valider les données d'Abonnement
export const datareservationSchema = z.object({
  cours_id: z.number().positive("L'ID de l'abonnement doit être un nombre positif"),
  utilisateur_nom: z.string().min(1, "Le nom de l'utilisateur est requis"),
  utilisateur_prenom: z.string().min(1, "Le prenom de l'utilisateur est requis")
});