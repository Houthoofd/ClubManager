import { z } from 'zod';

export type ArticleData = {
  nom: string;
  description: string;
  prix: number;
  image_url: string;
  categorie_id: number;
};


export type Categorie = {
  id: number;
  nom: string;
};

export const articleDataValidationSchema = z.object({
  nom: z.string().min(1, "Le nom de l'article est requis"),
  description: z.string().min(1, "La description de l'article est requise"),
  prix: z.number().positive("Le prix de l'article doit être un nombre positif"),
  image_url: z.string().url("L'URL de l'image doit être valide"),
  categorie_id: z.number().int().positive("L'ID de la catégorie doit être un nombre entier positif"),
});

