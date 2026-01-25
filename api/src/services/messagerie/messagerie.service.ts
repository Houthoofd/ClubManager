/**
 * Service de messagerie
 * Gère l'envoi, la réception et le suivi des messages
 */

import { prisma as defaultPrisma } from '../../infrastructure/database/prisma-client.js';
import {
  MessageRecu,
  MessagerieResponse,
  EnvoyerMessageResult,
  StatistiquesMessages,
  EnvoyerMessageInput,
  EnvoyerMessagePersonnaliseInput,
  MarquerMessageLuInput,
  MessagerieError
} from '@clubmanager/types';

// Import des modules core
import * as messagesPersonnalisesQueries from './core/messages-personnalises/queries.js';
import * as messagesPersonnalisesMutations from './core/messages-personnalises/mutations.js';
import * as messagesQueries from './core/messages/queries.js';
import * as messagesMutations from './core/messages/mutations.js';
import * as messageStatus from './core/message-status/index.js';
import * as envoi from './core/envoi/index.js';
import * as statistiques from './core/statistiques/index.js';

export class MessagerieService {
  private prisma;

  constructor(prisma) {
    this.prisma = prisma;
  }

  // ============================================
  // MESSAGES PERSONNALISÉS - Queries
  // ============================================

  /**
   * Récupère tous les messages personnalisés d'un utilisateur
   */
  async obtenirMessagesPersonnalises(utilisateurId: number): Promise<MessageRecu[]> {
    return messagesPersonnalisesQueries.obtenirMessagesRecus(this.prisma, utilisateurId);
  }

  /**
   * Récupère un message personnalisé par son ID
   */
  async obtenirMessagePersonnaliseParId(
    messageId: number,
    utilisateurId: number
  ): Promise<MessageRecu | null> {
    return messagesPersonnalisesQueries.obtenirMessagePersonnaliseParId(
      this.prisma,
      messageId,
      utilisateurId
    );
  }

  // ============================================
  // MESSAGES PERSONNALISÉS - Mutations
  // ============================================

  /**
   * Marque un message personnalisé comme lu
   */
  async marquerMessagePersonnaliseLu(
    input: MarquerMessageLuInput
  ): Promise<MessagerieResponse<{ message: string }>> {
    return messagesPersonnalisesMutations.marquerMessageLu(
      this.prisma,
      input.messageId,
      input.userId
    );
  }

  /**
   * Supprime un message personnalisé
   */
  async supprimerMessagePersonnalise(
    messageId: number,
    utilisateurId: number
  ): Promise<MessagerieResponse<{ message: string }>> {
    return messagesPersonnalisesMutations.supprimerMessagePersonnalise(
      this.prisma,
      messageId,
      utilisateurId
    );
  }

  /**
   * Crée un nouveau message personnalisé
   */
  async creerMessagePersonnalise(
    utilisateurId: number,
    contenu: string
  ): Promise<MessagerieResponse<{ id: number }>> {
    return messagesPersonnalisesMutations.creerMessagePersonnalise(
      this.prisma,
      utilisateurId,
      contenu
    );
  }

  /**
   * Nettoie les anciens messages supprimés
   */
  async nettoyerAnciennesMessages(
    joursAnciennete: number = 90
  ): Promise<MessagerieResponse<{ count: number }>> {
    return messagesPersonnalisesMutations.nettoyerAnciennesMessages(
      this.prisma,
      joursAnciennete
    );
  }

  // ============================================
  // MESSAGES STANDARDS - Queries
  // ============================================

  /**
   * Récupère tous les messages standards d'un utilisateur
   */
  async obtenirMessagesUtilisateur(utilisateurId: number): Promise<MessageRecu[]> {
    return messagesQueries.obtenirMessagesRecusUtilisateur(this.prisma, utilisateurId);
  }

  /**
   * Récupère un message par son ID
   */
  async obtenirMessageParId(
    messageId: number,
    utilisateurId: number
  ): Promise<MessageRecu | null> {
    return messagesQueries.obtenirMessageParId(this.prisma, messageId, utilisateurId);
  }

  /**
   * Récupère les messages d'un groupe
   */
  async obtenirMessagesGroupe(
    groupeId: number,
    utilisateurId: number
  ): Promise<MessageRecu[]> {
    return messagesQueries.obtenirMessagesGroupe(this.prisma, groupeId, utilisateurId);
  }

  /**
   * Récupère tous les messages d'un utilisateur (standards + personnalisés)
   */
  async obtenirTousMessages(utilisateurId: number): Promise<MessageRecu[]> {
    const [messagesStandards, messagesPersonnalises] = await Promise.all([
      this.obtenirMessagesUtilisateur(utilisateurId),
      this.obtenirMessagesPersonnalises(utilisateurId)
    ]);

    return [...messagesStandards, ...messagesPersonnalises].sort(
      (a, b) => b.date_reception.getTime() - a.date_reception.getTime()
    );
  }

  // ============================================
  // MESSAGES STANDARDS - Mutations
  // ============================================

  /**
   * Envoie un message à un utilisateur
   */
  async envoyerMessageUtilisateur(
    senderId: number,
    receiverId: number,
    contenu: string
  ): Promise<MessagerieResponse<{ id: number }>> {
    return messagesMutations.envoyerMessageUtilisateur(
      this.prisma,
      senderId,
      receiverId,
      contenu
    );
  }

  /**
   * Envoie un message à un groupe
   */
  async envoyerMessageGroupe(
    senderId: number,
    groupeId: number,
    contenu: string
  ): Promise<MessagerieResponse<{ id: number }>> {
    return messagesMutations.envoyerMessageGroupe(
      this.prisma,
      senderId,
      groupeId,
      contenu
    );
  }

  /**
   * Supprime un message
   */
  async supprimerMessage(
    messageId: number,
    utilisateurId: number
  ): Promise<MessagerieResponse<{ message: string }>> {
    return messagesMutations.supprimerMessage(this.prisma, messageId, utilisateurId);
  }

  // ============================================
  // STATUTS DE MESSAGES
  // ============================================

  /**
   * Marque un message comme vu
   */
  async marquerMessageVu(
    messageId: number,
    utilisateurId: number
  ): Promise<MessagerieResponse<{ message: string }>> {
    return messageStatus.marquerMessageVu(this.prisma, messageId, utilisateurId);
  }

  /**
   * Récupère le statut d'un message
   */
  async obtenirStatutMessage(
    messageId: number,
    utilisateurId: number
  ): Promise<'vu' | 'non_vu'> {
    return messageStatus.obtenirStatutMessage(this.prisma, messageId, utilisateurId);
  }

  /**
   * Compte les messages non vus
   */
  async compterMessagesNonVus(utilisateurId: number): Promise<number> {
    return messageStatus.compterMessagesNonVus(this.prisma, utilisateurId);
  }

  /**
   * Marque tous les messages comme vus
   */
  async marquerTousMessagesVus(
    utilisateurId: number
  ): Promise<MessagerieResponse<{ count: number }>> {
    return messageStatus.marquerTousMessagesVus(this.prisma, utilisateurId);
  }

  // ============================================
  // ENVOI EN MASSE
  // ============================================

  /**
   * Envoie un message à plusieurs destinataires
   */
  async envoyerMessageMultiple(
    input: EnvoyerMessageInput
  ): Promise<EnvoyerMessageResult> {
    // Cette fonction devrait utiliser typeMessageId pour récupérer le contenu
    // Pour l'instant, nous allons créer une implémentation simplifiée
    throw new MessagerieError(
      'Fonction non implémentée - utiliser envoyerMessageMultipleAvecContenu',
      'NOT_IMPLEMENTED'
    );
  }

  /**
   * Envoie un message avec contenu à plusieurs destinataires
   */
  async envoyerMessageMultipleAvecContenu(
    senderId: number,
    destinataireIds: number[],
    contenu: string
  ): Promise<EnvoyerMessageResult> {
    return envoi.envoyerMessageMultiple(
      this.prisma,
      senderId,
      destinataireIds,
      contenu
    );
  }

  /**
   * Envoie un message personnalisé
   */
  async envoyerMessagePersonnalise(
    input: EnvoyerMessagePersonnaliseInput
  ): Promise<EnvoyerMessageResult> {
    return envoi.envoyerMessagePersonnalise(
      this.prisma,
      input.destinataireId,
      input.contenu,
      input.expediteurId
    );
  }

  /**
   * Envoie un message à plusieurs groupes
   */
  async envoyerMessageGroupes(
    senderId: number,
    groupeIds: number[],
    contenu: string
  ): Promise<EnvoyerMessageResult> {
    return envoi.envoyerMessageGroupes(this.prisma, senderId, groupeIds, contenu);
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  /**
   * Récupère les statistiques générales
   */
  async obtenirStatistiquesGenerales(
    utilisateurId?: number
  ): Promise<StatistiquesMessages> {
    return statistiques.obtenirStatistiquesGenerales(this.prisma, utilisateurId);
  }

  /**
   * Récupère les statistiques d'un utilisateur
   */
  async obtenirStatistiquesUtilisateur(
    utilisateurId: number
  ): Promise<StatistiquesMessages> {
    return statistiques.obtenirStatistiquesUtilisateur(this.prisma, utilisateurId);
  }

  /**
   * Récupère les statistiques des messages personnalisés
   */
  async obtenirStatistiquesMessagesPersonnalises(): Promise<{
    total: number;
    actifs: number;
    supprimes: number;
    lus: number;
    nonLus: number;
    parStatutEnvoi: Record<string, number>;
  }> {
    return statistiques.obtenirStatistiquesMessagesPersonnalises(this.prisma);
  }
}

// Export d'une instance par défaut (sera initialisée par l'application)
let messagerieServiceInstance: MessagerieService | null = null;

export function initMessagerieService(prisma): MessagerieService {
  messagerieServiceInstance = new MessagerieService(prisma);
  return messagerieServiceInstance;
}

export function getMessagerieService(): MessagerieService {
  if (!messagerieServiceInstance) {
    throw new Error('MessagerieService n\'a pas été initialisé');
  }
  return messagerieServiceInstance;
}
