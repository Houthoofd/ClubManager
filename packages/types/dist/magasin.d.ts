import { z } from 'zod';
export type Stock = {
    taille: string;
    quantite: number;
};
export type Taille = "S" | "M" | "L" | "XL";
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
export type Categorie = {
    id: number;
    nom: string;
};
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
export type ArticleNomCategorie = {
    nom: string;
    categorie_id: number;
};
export declare const articleNomCategorieSchema: z.ZodObject<{
    nom: z.ZodString;
    categorie_id: z.ZodEffects<z.ZodNumber, number, unknown>;
}, "strip", z.ZodTypeAny, {
    nom: string;
    categorie_id: number;
}, {
    nom: string;
    categorie_id?: unknown;
}>;
export declare const articleCreationSchema: z.ZodObject<{
    nom: z.ZodString;
    description: z.ZodString;
    prix: z.ZodEffects<z.ZodNumber, number, unknown>;
    images: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
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
    categorie_id: number;
    description: string;
    prix: number;
    images: string[];
    stocks: {
        taille: string;
        quantite: number;
    }[];
}, {
    nom: string;
    description: string;
    stocks: {
        taille: string;
        quantite?: unknown;
    }[];
    categorie_id?: unknown;
    prix?: unknown;
    images?: string[] | undefined;
}>;
export declare const articleDataValidationSchema: z.ZodObject<{
    nom: z.ZodString;
    description: z.ZodString;
    prix: z.ZodEffects<z.ZodNumber, number, unknown>;
    images: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
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
} & {
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
    nom: string;
    categorie_id: number;
    description: string;
    prix: number;
    images: string[];
    stocks: {
        taille: string;
        quantite: number;
    }[];
}, {
    id: number;
    nom: string;
    description: string;
    stocks: {
        taille: string;
        quantite?: unknown;
    }[];
    categorie_id?: unknown;
    prix?: unknown;
    images?: string[] | undefined;
}>;
export declare const nouvelleCommandeSchema: z.ZodObject<{
    utilisateur_id: z.ZodEffects<z.ZodNumber, number, unknown>;
    articles: z.ZodArray<z.ZodObject<{
        article_id: z.ZodEffects<z.ZodNumber, number, unknown>;
        taille: z.ZodOptional<z.ZodString>;
        quantite: z.ZodEffects<z.ZodNumber, number, unknown>;
        prix: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        prix: number;
        quantite: number;
        article_id: number;
        taille?: string | undefined;
    }, {
        prix?: unknown;
        taille?: string | undefined;
        quantite?: unknown;
        article_id?: unknown;
    }>, "many">;
    statut: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    total: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    utilisateur_id: number;
    articles: {
        prix: number;
        quantite: number;
        article_id: number;
        taille?: string | undefined;
    }[];
    date?: string | undefined;
    statut?: string | undefined;
    total?: number | undefined;
}, {
    articles: {
        prix?: unknown;
        taille?: string | undefined;
        quantite?: unknown;
        article_id?: unknown;
    }[];
    date?: string | undefined;
    utilisateur_id?: unknown;
    statut?: string | undefined;
    total?: unknown;
}>;
export declare const articleCommandeSchema: z.ZodObject<{
    article_id: z.ZodEffects<z.ZodNumber, number, unknown>;
    taille_id: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
    quantite: z.ZodEffects<z.ZodNumber, number, unknown>;
    prix: z.ZodEffects<z.ZodNumber, number, unknown>;
}, "strip", z.ZodTypeAny, {
    prix: number;
    quantite: number;
    article_id: number;
    taille_id?: number | undefined;
}, {
    prix?: unknown;
    quantite?: unknown;
    article_id?: unknown;
    taille_id?: unknown;
}>;
export type ArticleCreationData = z.infer<typeof articleCreationSchema>;
export type ArticleData = z.infer<typeof articleDataValidationSchema>;
export type NouvelleCommande = z.infer<typeof nouvelleCommandeSchema>;
//# sourceMappingURL=magasin.d.ts.map