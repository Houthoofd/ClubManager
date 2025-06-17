import { z } from 'zod';

// === Articles ===

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

// === Commandes ===

// Article dans une commande (pour création/enregistrement)
export interface ArticleCommande {
  article_id: number;
  taille_id?: number;  // <- optionnel ici
  quantite: number;
  prix: number;
}


// Commande complète (affichage, BDD, back-office)
export type Commande = {
  user_id: number;
  articles: {
    id: number;       // article_id
    nom: string;
    prix: number;
    quantite?: number;
    taille?: string;
  }[];
  total: number;
  statut: string;
  date: string;
};

// === Schémas de validation ===

// Pour création d'article (sans id)
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

// Pour création de commande
export const nouvelleCommandeSchema = z.object({
  utilisateur_id: z.preprocess(val => Number(val), z.number().int().positive()),
  articles: z.array(
    z.object({
      article_id: z.preprocess(val => Number(val), z.number().int().positive()),
      taille: z.string().optional(),         // taille en string optionnelle
      quantite: z.preprocess(val => Number(val), z.number().int().positive()),
      prix: z.preprocess(val => Number(val), z.number().nonnegative()),
    })
  ),
  statut: z.string().optional(),
  date: z.string().datetime().optional(),
  total: z.preprocess(val => Number(val), z.number().nonnegative().optional()),
});


export const articleCommandeSchema = z.object({
  article_id: z.preprocess((val) => Number(val), z.number().int().positive()),
  taille_id: z.preprocess(
    (val) => val === undefined || val === null || val === "" ? undefined : Number(val),
    z.number().int().positive().optional()
  ),
  quantite: z.preprocess((val) => Number(val), z.number().int().positive()),
  prix: z.preprocess((val) => Number(val), z.number().nonnegative()),
});

// === Types dérivés des schémas ===

export type ArticleCreationData = z.infer<typeof articleCreationSchema>;
export type ArticleData = z.infer<typeof articleDataValidationSchema>;
export type NouvelleCommande = z.infer<typeof nouvelleCommandeSchema>;
