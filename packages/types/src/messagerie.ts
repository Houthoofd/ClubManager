/**
 * Types pour le service Messagerie
 */

import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export enum StatutMessage {
  NON_LU = 'non_lu',
  LU = 'lu',
  ARCHIVE = 'archive'
}

export enum TypeExpediteur {
  SYSTEME = 'systeme',
  UTILISATEUR = 'utilisateur',
  ADMIN = 'admin'
}

// ============================================
// INTERFACES - Types de messages
// ============================================

export interface TypeMessagePersonnalise {
  id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface TypeMessageCreationData {
  title: string;
  content: string;
}

export interface TypeMessageUpdateData {
  id: number;
  title: string;
  content: string;
}

// ============================================
// INTERFACES - Messages
// ============================================

export interface Message {
  id: number;
  contenu: string;
  utilisateur_id: number;
  expediteur_id?: number;
  type_expediteur: TypeExpediteur;
  statut: StatutMessage;
  date_envoi: Date;
  date_lecture?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface MessageRecu {
  id: number;
  content: string;
  date_reception: Date;
  expediteur_prenom: string;
  expediteur_nom: string;
  title: string;
  lu: boolean;
  statut: StatutMessage;
}

export interface EnvoyerMessageInput {
  destinataires: number[];
  typeMessageId: number;
  expediteurId?: number;
}

export interface EnvoyerMessagePersonnaliseInput {
  destinataireId: number;
  contenu: string;
  expediteurId?: number;
}

export interface MarquerMessageLuInput {
  messageId: number;
  userId: number;
}

// ============================================
// INTERFACES - Utilisateurs
// ============================================

export interface UtilisateurMessage {
  id: number;
  userId: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
}

// ============================================
// INTERFACES - Statistiques
// ============================================

export interface StatistiquesMessages {
  totalTypesMessages: number;
  totalMessagesEnvoyes: number;
  messagesUtilisateur?: number;
  messagesParJour: MessageParJour[];
  messagesNonLus?: number;
  messagesArchives?: number;
}

export interface MessageParJour {
  date: string;
  count: number;
}

// ============================================
// INTERFACES - Réponses
// ============================================

export interface MessagerieResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface EnvoyerMessageResult {
  success: boolean;
  count: number;
  message: string;
}

export interface TypesMessagesResponse extends MessagerieResponse<{
  typesMessages: TypeMessagePersonnalise[];
}> {}

export interface MessagesRecusResponse extends MessagerieResponse<{
  messages: MessageRecu[];
}> {}

export interface UtilisateursResponse extends MessagerieResponse<{
  utilisateurs: UtilisateurMessage[];
}> {}

export interface StatistiquesResponse extends MessagerieResponse<{
  statistiques: StatistiquesMessages;
}> {}

export interface MessagerieConfirmationResult {
  success: boolean;
  isConfirm: boolean;
  message: string;
  data?: any;
}

// ============================================
// SCHEMAS ZOD - Validation
// ============================================

export const typeMessageCreationSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255, 'Titre trop long'),
  content: z.string().min(1, 'Le contenu est requis')
});

export const typeMessageUpdateSchema = z.object({
  id: z.number().int().positive('ID invalide'),
  title: z.string().min(1, 'Le titre est requis').max(255, 'Titre trop long'),
  content: z.string().min(1, 'Le contenu est requis')
});

export const envoyerMessageSchema = z.object({
  destinataires: z.array(z.number().int().positive()).min(1, 'Au moins un destinataire requis'),
  typeMessageId: z.number().int().positive('ID type message invalide'),
  expediteurId: z.number().int().positive().optional()
});

export const envoyerMessagePersonnaliseSchema = z.object({
  destinataireId: z.number().int().positive('ID destinataire invalide'),
  contenu: z.string().min(1, 'Le contenu est requis'),
  expediteurId: z.number().int().positive().optional()
});

export const marquerMessageLuSchema = z.object({
  messageId: z.number().int().positive('ID message invalide'),
  userId: z.number().int().positive('ID utilisateur invalide')
});

// ============================================
// CLASSE D'ERREUR PERSONNALISÉE
// ============================================

export class MessagerieError extends Error {
  constructor(
    message: string,
    public code: string = 'MESSAGERIE_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'MessagerieError';
    Object.setPrototypeOf(this, MessagerieError.prototype);
  }
}

// ============================================
// TYPES INFÉRÉS
// ============================================

export type TypeMessageCreation = z.infer<typeof typeMessageCreationSchema>;
export type TypeMessageUpdate = z.infer<typeof typeMessageUpdateSchema>;
export type EnvoyerMessage = z.infer<typeof envoyerMessageSchema>;
export type EnvoyerMessagePersonnalise = z.infer<typeof envoyerMessagePersonnaliseSchema>;
export type MarquerMessageLu = z.infer<typeof marquerMessageLuSchema>;
