// user.ts
import { z } from "zod";
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
