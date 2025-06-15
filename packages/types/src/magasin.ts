import { z } from 'zod';

export type ArticleData = {
  nom: string;
  description: string;
  prix: number;
  images: string[]; // ← modifié ici
  categorie_id: number;
  stocks: {
    taille: string;
    quantite: number;
  }[];
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


export const articleDataValidationSchema = z.object({
  nom: z.string(),
  description: z.string(),
  prix: z.preprocess((val) => Number(val), z.number()), // ← transformation automatique
  images: z.array(z.string()), // si ce ne sont pas des URL, enlève `.url()`
  categorie_id: z.preprocess((val) => Number(val), z.number()), // ← ici aussi
  stocks: z.array(
    z.object({
      taille: z.string(),
      quantite: z.preprocess((val) => Number(val), z.number().int().nonnegative()),
    })
  )
});



