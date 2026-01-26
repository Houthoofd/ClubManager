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
    images: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
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
    categorie_id: number;
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
    images: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
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
    description: string;
    categorie_id: number;
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
    utilisateur_nom?: string;
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
export type UtilisateurMagasin = {
    id: number;
    nom: string;
    email: string;
};
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
export declare enum StatutCommande {
    EN_ATTENTE = "en_attente",
    CONFIRMEE = "confirmee",
    EXPEDIEE = "expediee",
    LIVREE = "livree",
    ANNULEE = "annulee"
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
export declare class MagasinError extends Error {
    readonly code: string;
    readonly details?: any;
    constructor(message: string, code: string, details?: any);
}
export type IdMagasin = {
    id: number;
};
export type IdArticle = IdMagasin;
export type IdCommande = IdMagasin;
export type IdCategorie = IdMagasin;
export type IdUtilisateur = IdMagasin;
export type MappingTaille = {
    [taille: string]: number;
};
export declare const TAILLES_MAPPING: MappingTaille;
export declare const TAILLES_REVERSE_MAPPING: {
    [id: number]: string;
};
export type ConfirmationResult = {
    success: boolean;
    isConfirm: boolean;
    message?: string;
    data?: any;
};
export type MagasinConfirmationResult = ConfirmationResult;
//# sourceMappingURL=magasin.d.ts.map