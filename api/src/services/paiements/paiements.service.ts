/**
 * Service de paiements
 * Gère les paiements, échéances et statistiques
 */

import { prisma as defaultPrisma } from '../../infrastructure/database/prisma-client.js';
import type { PrismaClient } from '../../infrastructure/generated/prisma/index.js';
import type {
  PaiementAvecDetails,
  EcheanceAvecDetails,
  CreerPaiementInput,
  ValiderPaiementInput,
  StatistiquesPaiements,
  StatistiquesPaiementsUtilisateur,
  PaiementsResponse
} from '@clubmanager/types';
import { PaiementsError } from '@clubmanager/types';

// Import des modules core
import * as queries from './core/queries/obtenirPaiements.js';
import * as paiementQuery from './core/queries/obtenirPaiementParId.js';
import * as utilisateurQueries from './core/queries/obtenirPaiementsUtilisateur.js';
import * as echeancesQueries from './core/queries/obtenirEcheances.js';

import * as creerMutation from './core/mutations/creerPaiement.js';
import * as validerMutation from './core/mutations/validerPaiement.js';
import * as refuserMutation from './core/mutations/refuserPaiement.js';
import * as annulerMutation from './core/mutations/annulerPaiement.js';
import * as rembourserMutation from './core/mutations/rembourserPaiement.js';

import * as statsGenerales from './core/statistiques/statistiquesGenerales.js';
import * as statsUtilisateur from './core/statistiques/statistiquesUtilisateur.js';
import * as statsParPeriode from './core/statistiques/statistiquesParPeriode.js';

export class PaiementsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Récupère tous les paiements avec filtres et pagination
   */
  async obtenirPaiements(args: queries.ObtenirPaiementsArgs): Promise<{
    paiements: PaiementAvecDetails[];
    total: number;
    hasMore: boolean;
  }> {
    return queries.obtenirPaiements(this.prisma, args);
  }

  /**
   * Récupère un paiement par son ID
   */
  async obtenirPaiementParId(id: number): Promise<PaiementAvecDetails | null> {
    return paiementQuery.obtenirPaiementParId(this.prisma, { id });
  }

  /**
   * Récupère les paiements d'un utilisateur
   */
  async obtenirPaiementsUtilisateur(args: utilisateurQueries.ObtenirPaiementsUtilisateurArgs): Promise<{
    paiements: PaiementAvecDetails[];
    total: number;
    hasMore: boolean;
  }> {
    return utilisateurQueries.obtenirPaiementsUtilisateur(this.prisma, args);
  }

  /**
   * Récupère les échéances de paiement
   */
  async obtenirEcheances(args: echeancesQueries.ObtenirEcheancesArgs): Promise<{
    echeances: EcheanceAvecDetails[];
    total: number;
    hasMore: boolean;
  }> {
    return echeancesQueries.obtenirEcheances(this.prisma, args);
  }

  /**
   * Récupère les échéances d'un utilisateur
   */
  async obtenirEcheancesUtilisateur(utilisateurId: number, limit?: number): Promise<{
    echeances: EcheanceAvecDetails[];
    total: number;
    hasMore: boolean;
  }> {
    return echeancesQueries.obtenirEcheances(this.prisma, {
      utilisateurId,
      limit
    });
  }

  /**
   * Récupère les échéances échues
   */
  async obtenirEcheancesEchues(): Promise<{
    echeances: EcheanceAvecDetails[];
    total: number;
    hasMore: boolean;
  }> {
    const now = new Date();
    return echeancesQueries.obtenirEcheances(this.prisma, {
      statut: 'échu',
      dateFin: now
    });
  }

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Crée un nouveau paiement
   */
  async creerPaiement(input: CreerPaiementInput): Promise<PaiementAvecDetails> {
    return creerMutation.creerPaiement(this.prisma, {
      commandeId: input.commandeId,
      utilisateurId: input.utilisateurId,
      montant: input.montant,
      methodePaiement: input.methodePaiement,
      stripePaymentIntentId: input.stripePaymentIntentId,
      paypalOrderId: input.paypalOrderId,
      bitcoinAddress: input.bitcoinAddress,
      datePaiement: input.datePaiement,
      description: input.description,
      abonnementId: input.abonnementId,
      periodeDebut: input.periodeDebut,
      periodeFin: input.periodeFin
    });
  }

  /**
   * Valide un paiement
   */
  async validerPaiement(input: ValiderPaiementInput): Promise<PaiementAvecDetails> {
    return validerMutation.validerPaiement(this.prisma, {
      paiementId: input.paiementId,
      referenceTransaction: input.referenceTransaction
    });
  }

  /**
   * Refuse un paiement
   */
  async refuserPaiement(paiementId: number, motif?: string): Promise<PaiementAvecDetails> {
    return refuserMutation.refuserPaiement(this.prisma, {
      paiementId,
      motif
    });
  }

  /**
   * Annule un paiement
   */
  async annulerPaiement(paiementId: number, motif?: string): Promise<PaiementAvecDetails> {
    return annulerMutation.annulerPaiement(this.prisma, {
      paiementId,
      motif
    });
  }

  /**
   * Rembourse un paiement
   */
  async rembourserPaiement(paiementId: number, motif?: string): Promise<PaiementAvecDetails> {
    return rembourserMutation.rembourserPaiement(this.prisma, {
      paiementId,
      motif
    });
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  /**
   * Récupère les statistiques générales des paiements
   */
  async statistiquesGenerales(dateDebut?: Date, dateFin?: Date): Promise<StatistiquesPaiements> {
    return statsGenerales.statistiquesGenerales(this.prisma, {
      dateDebut,
      dateFin
    });
  }

  /**
   * Récupère les statistiques d'un utilisateur
   */
  async statistiquesUtilisateur(utilisateurId: number): Promise<StatistiquesPaiementsUtilisateur> {
    return statsUtilisateur.statistiquesUtilisateur(this.prisma, {
      utilisateurId
    });
  }

  /**
   * Récupère les statistiques par période
   */
  async statistiquesParPeriode(
    dateDebut: Date,
    dateFin: Date,
    groupBy?: 'jour' | 'semaine' | 'mois'
  ): Promise<any> {
    return statsParPeriode.statistiquesParPeriode(this.prisma, {
      dateDebut,
      dateFin,
      groupBy
    });
  }

  // ============================================
  // MÉTHODES UTILITAIRES
  // ============================================

  /**
   * Vérifie si un paiement existe
   */
  async paiementExiste(id: number): Promise<boolean> {
    const paiement = await this.prisma.paiements.findUnique({
      where: { id },
      select: { id: true }
    });
    return paiement !== null;
  }

  /**
   * Vérifie si un utilisateur a des paiements en attente
   */
  async aDesPaiementsEnAttente(utilisateurId: number): Promise<boolean> {
    const count = await this.prisma.paiements.count({
      where: {
        utilisateur_id: utilisateurId,
        statut: 'en attente'
      }
    });
    return count > 0;
  }

  /**
   * Obtient le montant total payé par un utilisateur
   */
  async obtenirMontantTotalUtilisateur(utilisateurId: number): Promise<number> {
    const result = await this.prisma.paiements.aggregate({
      where: {
        utilisateur_id: utilisateurId,
        statut: 'validé'
      },
      _sum: {
        montant: true
      }
    });
    return Number(result._sum.montant || 0);
  }

  /**
   * Obtient le nombre de paiements valides d'un utilisateur
   */
  async compterPaiementsValides(utilisateurId: number): Promise<number> {
    return this.prisma.paiements.count({
      where: {
        utilisateur_id: utilisateurId,
        statut: 'validé'
      }
    });
  }

  /**
   * Obtient le dernier paiement d'un utilisateur
   */
  async obtenirDernierPaiement(utilisateurId: number): Promise<PaiementAvecDetails | null> {
    const paiement = await this.prisma.paiements.findFirst({
      where: {
        utilisateur_id: utilisateurId
      },
      orderBy: {
        date_paiement: 'desc'
      },
      include: {
        utilisateurs: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        commandes: {
          select: {
            id: true,
            numero_commande: true,
            montant_total: true,
            statut: true
          }
        },
        plans_tarifaires: {
          select: {
            id: true,
            nom: true,
            montant: true,
            frequence: true
          }
        }
      }
    });

    if (!paiement) {
      return null;
    }

    return {
      id: paiement.id,
      commande_id: paiement.commande_id,
      utilisateur_id: paiement.utilisateur_id,
      montant: Number(paiement.montant),
      methode_paiement: paiement.methode_paiement,
      stripe_payment_intent_id: paiement.stripe_payment_intent_id,
      paypal_order_id: paiement.paypal_order_id,
      bitcoin_address: paiement.bitcoin_address,
      date_paiement: paiement.date_paiement,
      statut: paiement.statut,
      description: paiement.description,
      date_confirmation: paiement.date_confirmation,
      date_modification: paiement.date_modification,
      abonnement_id: paiement.abonnement_id,
      periode_debut: paiement.periode_debut,
      periode_fin: paiement.periode_fin,
      utilisateur: paiement.utilisateurs ? {
        id: paiement.utilisateurs.id,
        nom: paiement.utilisateurs.nom,
        prenom: paiement.utilisateurs.prenom,
        email: paiement.utilisateurs.email
      } : undefined,
      commande: paiement.commandes ? {
        id: paiement.commandes.id,
        numero_commande: paiement.commandes.numero_commande,
        montant_total: Number(paiement.commandes.montant_total),
        statut: paiement.commandes.statut
      } : undefined,
      abonnement: paiement.plans_tarifaires ? {
        id: paiement.plans_tarifaires.id,
        nom: paiement.plans_tarifaires.nom,
        montant: Number(paiement.plans_tarifaires.montant),
        frequence: paiement.plans_tarifaires.frequence
      } : undefined
    };
  }
}

// Export d'une instance par défaut (sera initialisée par l'application)
let paiementsServiceInstance: PaiementsService | null = null;

export function initPaiementsService(prisma: PrismaClient): PaiementsService {
  paiementsServiceInstance = new PaiementsService(prisma);
  return paiementsServiceInstance;
}

export function getPaiementsService(): PaiementsService {
  if (!paiementsServiceInstance) {
    throw new Error('PaiementsService n\'a pas été initialisé');
  }
  return paiementsServiceInstance;
}
