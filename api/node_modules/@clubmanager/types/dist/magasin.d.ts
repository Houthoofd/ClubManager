import { z } from 'zod';
export type ArticleData = {
    nom: string;
    description: string;
    prix: number;
    image_url: string;
    categorie_id: number;
};
export type Categorie = {
    id: number;
    nom: string;
};
export declare const articleDataValidationSchema: z.ZodObject<{
    nom: z.ZodString;
    description: z.ZodString;
    prix: z.ZodNumber;
    image_url: z.ZodString;
    categorie_id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    nom: string;
    description: string;
    prix: number;
    image_url: string;
    categorie_id: number;
}, {
    nom: string;
    description: string;
    prix: number;
    image_url: string;
    categorie_id: number;
}>;
//# sourceMappingURL=magasin.d.ts.map