import { z } from 'zod';
export type ArticleData = {
    nom: string;
    description: string;
    prix: number;
    images: string[];
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
    prix: number;
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
export declare const articleDataValidationSchema: z.ZodObject<{
    nom: z.ZodString;
    description: z.ZodString;
    prix: z.ZodEffects<z.ZodNumber, number, unknown>;
    images: z.ZodArray<z.ZodString, "many">;
    categorie_id: z.ZodEffects<z.ZodNumber, number, unknown>;
    stocks: z.ZodArray<z.ZodObject<{
        taille: z.ZodString;
        quantite: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        taille: string;
        quantite: number;
    }, {
        taille: string;
        quantite?: unknown;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    nom: string;
    description: string;
    prix: number;
    images: string[];
    categorie_id: number;
    stocks: {
        taille: string;
        quantite: number;
    }[];
}, {
    nom: string;
    description: string;
    images: string[];
    stocks: {
        taille: string;
        quantite?: unknown;
    }[];
    prix?: unknown;
    categorie_id?: unknown;
}>;
//# sourceMappingURL=magasin.d.ts.map