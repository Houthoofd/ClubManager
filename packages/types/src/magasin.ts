import { z } from 'zod';

// === Stocks ===
export type Stock = {
  taille: string;       // taille du produit en string (ex: "S", "M", "L")
  quantite: number;     // quantité disponible en stock
};

export type Taille = "S" | "M" | "L" | "XL";

// === Articles ===
export type Article = {
  id: number;
  nom: string;
  description: string;
  prix: number;
  images: string[];
  stocks: Stock[];
  categorie_id: number;
  taille?: string;
  quantite?: number;
};

export type ArticleAPI = {
  id: number;
  nom: string;
  prix: number;
  description: string;
  images: string[];
  stocks: Stock[];
};

export type ArticlesParCategorie = {
  [categorieNom: string]: Article[];
};

// === Catégories ===
export type Categorie = {
  id: number;
  nom: string;
};

// === Commandes ===
export interface ArticleCommande {
  article_id: number;
  taille_id?: number;
  quantite: number;
  prix: number;
}

export type Commande = {
  user_id: number;
  articles: {
    id: number;
    nom: string;
    prix: number;
    quantite?: number;
    taille?: string;
  }[];
  total: number;
  statut: string;
  date: string;
};

// === Validation Zod ===
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

export const articleDataValidationSchema = articleCreationSchema.extend({
  id: z.number().int().positive(),
});

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

export const articleCommandeSchema = z.object({
  article_id: z.preprocess((val) => Number(val), z.number().int().positive()),
  taille_id: z.preprocess(
    (val) => val === undefined || val === null || val === "" ? undefined : Number(val),
    z.number().int().positive().optional()
  ),
  quantite: z.preprocess((val) => Number(val), z.number().int().positive()),
  prix: z.preprocess((val) => Number(val), z.number().nonnegative()),
});

// === Types inférés ===
export type ArticleCreationData = z.infer<typeof articleCreationSchema>;
export type ArticleData = z.infer<typeof articleDataValidationSchema>;
export type NouvelleCommande = z.infer<typeof nouvelleCommandeSchema>;

// === Hack CommonJS pour importer les types et schémas ===
const exported = {};
module.exports = exported;
export default exported;
