import { z } from 'zod';


export type ArticleAPI = {
  id: number;
  nom: string;
  prix: number;
  description: string;
  images: string[];
  stocks: { taille: string; quantite: number }[];
};

export type ArticlesParCategorie = {
  [categorieNom: string]: ArticleData[];
};


export type Categorie = {
  id: number;
  nom: string;
};

export interface CommandeArticle {
  article_id: number;
  taille_id: number;
  quantite: number;
  prix: number; // Prix unitaire au moment de la commande
}


export type ArticleCommande = {
  article_id: number;
  taille_id: number;
  quantite: number;
  prix: number;
};

export type NouvelleCommande = {
  utilisateur_id: number;
  articles: ArticleCommande[];
  statut?: string;
};


// Pour création (sans id)
export const articleCreationSchema = z.object({
  nom: z.string(),
  description: z.string(),
  prix: z.preprocess((val) => Number(val), z.number()),
  images: z.array(z.string()),
  categorie_id: z.preprocess((val) => Number(val), z.number()),
  stocks: z.array(
    z.object({
      taille: z.string(),
      quantite: z.preprocess((val) => Number(val), z.number().int().nonnegative()),
    })
  )
});

// Pour lecture/modification (avec id)
export const articleDataValidationSchema = articleCreationSchema.extend({
  id: z.number().int().positive(),
});

// Types dérivés des schémas
export type ArticleCreationData = z.infer<typeof articleCreationSchema>;
export type ArticleData = z.infer<typeof articleDataValidationSchema>;






