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
    categorie_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
}, z.core.$strip>;
export declare const articleCreationSchema: z.ZodObject<{
    nom: z.ZodString;
    description: z.ZodString;
    prix: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    images: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    categorie_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    stocks: z.ZodArray<z.ZodObject<{
        taille: z.ZodString;
        quantite: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const articleDataValidationSchema: z.ZodObject<{
    nom: z.ZodString;
    description: z.ZodString;
    prix: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    images: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    categorie_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    stocks: z.ZodArray<z.ZodObject<{
        taille: z.ZodString;
        quantite: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    }, z.core.$strip>>;
    id: z.ZodNumber;
}, z.core.$strip>;
export declare const nouvelleCommandeSchema: z.ZodObject<{
    utilisateur_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    articles: z.ZodArray<z.ZodObject<{
        article_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
        taille: z.ZodOptional<z.ZodString>;
        quantite: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
        prix: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    }, z.core.$strip>>;
    statut: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    total: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export declare const articleCommandeSchema: z.ZodObject<{
    article_id: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    taille_id: z.ZodPipe<z.ZodTransform<number | undefined, unknown>, z.ZodOptional<z.ZodNumber>>;
    quantite: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
    prix: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>;
}, z.core.$strip>;
export type ArticleCreationData = z.infer<typeof articleCreationSchema>;
export type ArticleData = z.infer<typeof articleDataValidationSchema>;
export type NouvelleCommande = z.infer<typeof nouvelleCommandeSchema>;
//# sourceMappingURL=magasin.d.ts.map