// user.ts
import { z } from "zod";

// Types
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
    id: number | null,
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

export type UserDataLogin = { email: string; password: string; };
export type Abonnement = { id: number; nom_plan: string; };
export type Grade = { id: number; grade_id: string; };
export type Genres = { id: number; genre_name: string; };
export type Status = { id: number; status_name: string; };

// Schémas Zod
export const abonnementSchema = z.object({
  id: z.number().positive(),
  nom_plan: z.string().min(1)
});

export const gradeSchema = z.object({
  id: z.number().positive(),
  grade_id: z.string().min(1)
});

export const genresSchema = z.object({
  id: z.number().positive(),
  genre_name: z.string().min(1)
});

export const userDataLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const userSchema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  nom_utilisateur: z.string().min(1),
  email: z.string().email(),
  genre_id: z.number().positive().nullable(),
  date_naissance: z.string().refine(val => !isNaN(Date.parse(val))),
  password: z.string().min(6),
  status_id: z.number().positive(),
  grade_id: z.number().positive().nullable(),
  abonnement_id: z.number().positive().nullable(),
});

// Hack pour CommonJS
const exported = {
  abonnementSchema,
  gradeSchema,
  genresSchema,
  userDataLoginSchema,
  userSchema
};

module.exports = exported;
export default exported;
