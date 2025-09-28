import { z } from 'zod';

// === Stocks ===
export type Stock = {
  taille: string;       // taille du produit en string (ex: "S", "M", "L")
  quantite: number;     // quantité disponible en stock
};

export type Taille = "S" | "M" | "L" | "XL";

// === Articles ===
// Article complet tel qu’en base ou affiché côté front
export type Article = {
  id: number;
  nom: string;
  description: string;
  prix: number;
  images: string[];
  stocks: Stock[];
  categorie_id: number;
  // propriétés optionnelles (ex: dans un panier)
  taille?: string;
  quantite?: number;
};

// Article simplifié ou spécifique à l’API (sans description complète ni stocks)
export type ArticleAPI = {
  id: number;
  nom: string;
  prix: number;
  description: string;
  images: string[];
  stocks: Stock[];
};

// Articles regroupés par catégorie (clé = nom de la catégorie)
export type ArticlesParCategorie = {
  [categorieNom: string]: Article[]; // Chaque article doit avoir un id (obligatoire)
};

// === Catégories ===
export type Categorie = {
  id: number;
  nom: string;
};

// === Commandes ===

// Article dans une commande (données envoyées à la création)
export interface ArticleCommande {
  article_id: number;
  taille_id?: number;    // optionnel (ex: taille choisie)
  quantite: number;
  prix: number;
}

// Commande complète avec articles, état, etc.
export type Commande = {
  user_id: number;
  articles: {
    id: number;          // article_id
    nom: string;
    prix: number;
    quantite?: number;
    taille?: string;
  }[];
  total: number;
  statut: string;
  date: string;          // date ISO
};

export type ArticleNomCategorie = {
  nom: string;
  categorie_id: number;
};

// Schéma Zod pour la vérification d'un nom d'article dans une catégorie
export const articleNomCategorieSchema = z.object({
  nom: z.string(),
  categorie_id: z.preprocess((val) => Number(val), z.number().int().positive()),
});

// === Validation Zod (importés pour inférence automatique) ===

// Schéma création d’article (sans id)
export const articleCreationSchema = z.object({
  nom: z.string(),
  description: z.string(),
  prix: z.preprocess((val) => Number(val), z.number()),
  images: z.array(z.string()).optional().default([]), // Rendre optionnel avec valeur par défaut
  categorie_id: z.preprocess((val) => Number(val), z.number()),
  stocks: z.array(
    z.object({
      taille: z.string(),
      quantite: z.preprocess((val) => Number(val), z.number().int().nonnegative()),
    })
  )
});

// Schéma article complet (avec id)
export const articleDataValidationSchema = articleCreationSchema.extend({
  id: z.number().int().positive(),
});

// Schéma création de commande
export const nouvelleCommandeSchema = z.object({
  utilisateur_id: z.preprocess(val => Number(val), z.number().int().positive()),
  articles: z.array(
    z.object({
      article_id: z.preprocess(val => Number(val), z.number().int().positive()),
      taille: z.string().optional(),
      quantite: z.preprocess(val => Number(val), z.number().int().positive()),
      prix: z.preprocess(val => Number(val), z.number().nonnegative()),
    })
  ),
  statut: z.string().optional(),
  date: z.string().datetime().optional(),
  total: z.preprocess(val => Number(val), z.number().nonnegative().optional()),
});

// Schéma ArticleCommande
export const articleCommandeSchema = z.object({
  article_id: z.preprocess((val) => Number(val), z.number().int().positive()),
  taille_id: z.preprocess(
    (val) => val === undefined || val === null || val === "" ? undefined : Number(val),
    z.number().int().positive().optional()
  ),
  quantite: z.preprocess((val) => Number(val), z.number().int().positive()),
  prix: z.preprocess((val) => Number(val), z.number().nonnegative()),
});

// === Types inférés depuis les schémas ===

export type ArticleCreationData = z.infer<typeof articleCreationSchema>;
export type ArticleData = z.infer<typeof articleDataValidationSchema>;
export type NouvelleCommande = z.infer<typeof nouvelleCommandeSchema>;
