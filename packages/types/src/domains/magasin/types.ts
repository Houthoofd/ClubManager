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

export type ArticleNomCategorie = {
  nom: string;
  categorie_id: number;
};

// Schéma Zod pour la vérification d'un nom d'article dans une catégorie
export const articleNomCategorieSchema = z.object({
  nom: z.string(),
  categorie_id: z.preprocess((val: any) => Number(val), z.number().int().positive()),
});

// === Validation Zod (importés pour inférence automatique) ===

// Schéma création d’article (sans id)
export const articleCreationSchema = z.object({
  nom: z.string(),
  description: z.string(),
  prix: z.preprocess((val: any) => Number(val), z.number()),
  images: z.array(z.string()).default([]), // Rendre optionnel avec valeur par défaut
  categorie_id: z.preprocess((val: any) => Number(val), z.number()),
  stocks: z.array(
    z.object({
      taille: z.string(),
      quantite: z.preprocess((val: any) => Number(val), z.number().int().nonnegative()),
    })
  )
});

// Schéma article complet (avec id)
export const articleDataValidationSchema = articleCreationSchema.extend({
  id: z.number().int().positive(),
});

// Schéma création de commande
export const nouvelleCommandeSchema = z.object({
  utilisateur_id: z.preprocess((val: any) => Number(val), z.number().int().positive()),
  articles: z.array(
    z.object({
      article_id: z.preprocess((val: any) => Number(val), z.number().int().positive()),
      taille: z.string().optional(),
      quantite: z.preprocess((val: any) => Number(val), z.number().int().positive()),
      prix: z.preprocess((val: any) => Number(val), z.number().nonnegative()),
    })
  ),
  statut: z.string().optional(),
  date: z.string().datetime().optional(),
  total: z.preprocess((val: any) => Number(val), z.number().nonnegative().optional()),
});

// Schéma ArticleCommande
export const articleCommandeSchema = z.object({
  article_id: z.preprocess((val: any) => Number(val), z.number().int().positive()),
  taille_id: z.preprocess(
    (val: any) => val === undefined || val === null || val === "" ? undefined : Number(val),
    z.number().int().positive().optional()
  ),
  quantite: z.preprocess((val: any) => Number(val), z.number().int().positive()),
  prix: z.preprocess((val: any) => Number(val), z.number().nonnegative()),
});

// === Types inférés depuis les schémas ===

export type ArticleCreationData = z.infer<typeof articleCreationSchema>;
export type ArticleData = z.infer<typeof articleDataValidationSchema>;
export type NouvelleCommande = z.infer<typeof nouvelleCommandeSchema>;

// === Commandes complètes ===

export type Commande = {
  id: number;
  utilisateur_id: number;
  statut: string;
  date: string;
  total: number;
  articles: ArticleCommande[];
};

export type CommandeDetails = {
  id: number;
  utilisateur_id: number;
  utilisateur_nom?: string; // optionnel pour éviter les jointures
  statut: string;
  date: string;
  total: number;
  articles: ArticleCommandeDetails[];
};

export type ArticleCommandeDetails = {
  article_id: number;
  article_nom: string;
  taille?: string;
  quantite: number;
  prix: number;
};

// === Types utilisateur ===

export type UtilisateurMagasin = {
  id: number;
  nom: string;
  email: string;
};

// === Types de réponse API ===

export type MagasinResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
};

export type ArticlesResponse = MagasinResponse<{
  articles: Article[];
  total?: number;
}>;

export type CommandeResponse = MagasinResponse<{
  commande: Commande;
}>;

export type CommandesResponse = MagasinResponse<{
  commandes: CommandeDetails[];
  total?: number;
}>;

export type CategoriesResponse = MagasinResponse<{
  categories: Categorie[];
}>;

// === Statuts et configuration ===

export enum StatutCommande {
  EN_ATTENTE = 'en_attente',
  CONFIRMEE = 'confirmee',
  EXPEDIEE = 'expediee',
  LIVREE = 'livree',
  ANNULEE = 'annulee'
}

export type FiltresArticles = {
  categorie_id?: number;
  prix_min?: number;
  prix_max?: number;
  disponible?: boolean;
  recherche?: string;
};

export type OptionsTri = {
  colonne: 'nom' | 'prix' | 'date_creation' | 'categorie';
  direction: 'asc' | 'desc';
};

export type OptionsPagination = {
  page: number;
  limit: number;
};

// === Erreurs spécifiques ===

export class MagasinError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'MagasinError';
  }
}

// === Types d'identification ===

export type IdMagasin = {
  id: number;
};

export type IdArticle = IdMagasin;
export type IdCommande = IdMagasin;
export type IdCategorie = IdMagasin;
export type IdUtilisateur = IdMagasin;

// === Mapping des tailles ===

export type MappingTaille = {
  [taille: string]: number; // taille string -> id numérique
};

export const TAILLES_MAPPING: MappingTaille = {
  'S': 1,
  'M': 2,
  'L': 3,
  'XL': 4
};

export const TAILLES_REVERSE_MAPPING: { [id: number]: string } = {
  1: 'S',
  2: 'M',
  3: 'L',
  4: 'XL'
};

// === Types utilitaires ===

export type ConfirmationResult = {
  success: boolean;
  isConfirm: boolean;
  message?: string;
  data?: any;
};

export type MagasinConfirmationResult = ConfirmationResult;
