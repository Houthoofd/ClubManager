/**
 * Local Validation Schemas
 * Replaces external package schemas that are not available
 */

import { z } from "zod";

// User schemas
export const userInscriptionSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe minimum 8 caractères"),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  genderId: z.number().optional(),
});

export const utilisateurInscriptionSchema = userInscriptionSchema;

export const userDataLoginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const userDataLoginByUserIdSchema = z.object({
  userId: z.number().int().positive("ID utilisateur invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const userSearchByEmailSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const userDataAjoutSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe minimum 8 caractères").optional(),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  genderId: z.number().optional(),
  statusId: z.number().optional(),
  gradeId: z.number().optional(),
  abonnementId: z.number().optional(),
  actif: z.boolean().default(true),
});

// Article/Shop schemas
export const articleCreationSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  prix: z.number().positive("Le prix doit être positif"),
  tailleId: z.number().optional(),
  imageUrl: z.string().url().optional(),
  actif: z.boolean().default(true),
});

export const articleDataValidationSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  prix: z.number().positive("Le prix doit être positif"),
  tailleId: z.number().optional(),
  imageUrl: z.string().url().optional(),
  actif: z.boolean().default(true),
});

export const nouvelleCommandeSchema = z.object({
  utilisateur_id: z.number().int().positive("ID utilisateur invalide"),
  articles: z.array(z.object({
    article_id: z.number().int().positive("ID article invalide"),
    quantite: z.number().int().positive("Quantité invalide"),
    taille: z.string().optional(),
  })),
  statut: z.string().default("en attente"),
  date: z.string().optional(),
  total: z.number().positive("Total invalide"),
  adresse_livraison: z.string().optional(),
  notes: z.string().optional(),
});

export const articleCommandeSchema = z.object({
  article_id: z.number().int().positive("ID article invalide"),
  quantite: z.number().int().positive("Quantité invalide"),
  prix_unitaire: z.number().positive("Prix unitaire invalide"),
});

// Types inferred from schemas
export type UserData = z.infer<typeof userInscriptionSchema>;
export type ArticleCreationData = z.infer<typeof articleCreationSchema>;
export type UserCreation = z.infer<typeof userDataAjoutSchema>;

export interface UserSearchQuery {
  search?: string;
  statusId?: number;
  actif?: boolean;
  tenantId?: string;
}

export interface VerifyResultWithData {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  isFind?: boolean;
}

// Course schemas
export const courseCreationSchema = z.object({
  dateCours: z.string().transform((str) => new Date(str)),
  typeCours: z.string().min(1, "Type de cours requis"),
  heureDebut: z.string(),
  heureFin: z.string(), 
  capaciteMax: z.number().int().positive().optional(),
  description: z.string().optional(),
  actif: z.boolean().default(true),
});

// Payment schemas  
export const paiementCreationSchema = z.object({
  utilisateurId: z.number().int().positive("ID utilisateur invalide"),
  montant: z.number().positive("Montant invalide"),
  datePaiement: z.string().transform((str) => new Date(str)).optional(),
  statut: z.string().default("en attente"),
  abonnementId: z.number().int().optional(),
  periodeDebut: z.string().transform((str) => new Date(str)).optional(),
  periodeFin: z.string().transform((str) => new Date(str)).optional(),
  methode: z.string().optional(),
  transactionId: z.string().optional(),
});

// Message schemas
export const messageCreationSchema = z.object({
  senderId: z.number().int().positive("ID expéditeur invalide"),
  recipientId: z.number().int().positive("ID destinataire invalide").optional(),
  subject: z.string().min(1, "Sujet requis"),
  body: z.string().min(1, "Corps du message requis"),
  type: z.string().default("prive"),
  priority: z.string().default("NORMAL"),
  scheduledFor: z.string().transform((str) => new Date(str)).optional(),
});

// Export all schemas for easy import
export const schemas = {
  userInscription: userInscriptionSchema,
  utilisateurInscription: utilisateurInscriptionSchema,
  userDataLogin: userDataLoginSchema,
  userDataLoginByUserId: userDataLoginByUserIdSchema,
  userSearchByEmail: userSearchByEmailSchema,
  userDataAjout: userDataAjoutSchema,
  articleCreation: articleCreationSchema,
  articleDataValidation: articleDataValidationSchema,
  nouvelleCommande: nouvelleCommandeSchema,
  articleCommande: articleCommandeSchema,
  courseCreation: courseCreationSchema,
  paiementCreation: paiementCreationSchema,
  messageCreation: messageCreationSchema,
};