/**
 * Service de statistiques
 * Gère les statistiques de fréquentation, progression, financières et membres
 */

import { prisma as defaultPrisma } from '../../infrastructure/database/prisma-client.js';
import type {
  StatistiquesGenerales,
  StatistiquesParCours,
  StatistiquesPresenceGlobale,
  StatistiquesFrequentationUtilisateur,
  PresenceParMois,
  StatistiquesPresenceParMois,
  StatistiquesProgressionUtilisateur,
  EvolutionInscriptions,
  StatistiquesFinancieres,
  StatistiquesMembres,
  TableauDeBord,
  StatistiquesDataResponse
} from '@clubmanager/types';
import { StatistiquesError } from '@clubmanager/types';

// Import des modules core
import * as statsGenerales from './core/globales/obtenirStatistiquesGenerales.js';
import * as statsParCours from './core/globales/obtenirStatistiquesParCours.js';

import * as frequentationUtilisateur from './core/frequentation/obtenirFrequentationUtilisateur.js';
import * as presencesParMois from './core/frequentation/obtenirPresencesParMois.js';
import * as statsPresenceParMois from './core/frequentation/obtenirStatistiquesPresenceParMois.js';
import * as statsPresence from './core/frequentation/obtenirStatistiquesPresence.js';

import * as progressionUtilisateur from './core/progression/obtenirProgressionUtilisateur.js';
import * as evolutionInscriptions from './core/progression/obtenirEvolutionInscriptions.js';

import * as statsFinancieres from './core/financier/obtenirStatistiquesFinancieres.js';

import * as statsMembres from './core/membres/obtenirStatistiquesMembres.js';

export class StatistiquesService {
  private prisma: typeof defaultPrisma;

  constructor(prisma: typeof defaultPrisma) {
    this.prisma = prisma;
  }

  // ============================================
  // STATISTIQUES GÉNÉRALES
  // ============================================

  /**
   * Récupère les statistiques générales du club
   */
  async obtenirStatistiquesGenerales(): Promise<StatistiquesGenerales> {
    return statsGenerales.obtenirStatistiquesGenerales(this.prisma);
  }

  /**
   * Récupère les statistiques par cours
   */
  async obtenirStatistiquesParCours(dateDebut?: Date, dateFin?: Date): Promise<StatistiquesParCours[]> {
    // Validation des dates
    if (dateDebut && !(dateDebut instanceof Date) || (dateDebut && isNaN(dateDebut.getTime()))) {
      throw new StatistiquesError('Date de début invalide', 'INVALID_DATE', 400);
    }
    if (dateFin && !(dateFin instanceof Date) || (dateFin && isNaN(dateFin.getTime()))) {
      throw new StatistiquesError('Date de fin invalide', 'INVALID_DATE', 400);
    }
    if (dateDebut && dateFin && dateDebut > dateFin) {
      throw new StatistiquesError('Date de début postérieure à la date de fin', 'INVALID_DATE_RANGE', 400);
    }

    return statsParCours.obtenirStatistiquesParCours(this.prisma, { dateDebut, dateFin });
  }

  // ============================================
  // FRÉQUENTATION
  // ============================================

  /**
   * Récupère les statistiques de fréquentation d'un utilisateur
   */
  async obtenirFrequentationUtilisateur(utilisateurId: number): Promise<StatistiquesFrequentationUtilisateur[]> {
    // Validation de l'ID utilisateur
    if (typeof utilisateurId !== 'number' || utilisateurId <= 0 || !Number.isFinite(utilisateurId)) {
      throw new StatistiquesError('ID utilisateur invalide', 'INVALID_USER_ID', 400);
    }
    if (utilisateurId > 2147483647) { // Max INT en PostgreSQL
      throw new StatistiquesError('ID utilisateur trop grand', 'INVALID_USER_ID', 400);
    }

    return frequentationUtilisateur.obtenirFrequentationUtilisateur(this.prisma, { utilisateurId });
  }

  /**
   * Récupère les présences par mois d'un utilisateur
   */
  async obtenirPresencesParMois(utilisateurId: number, valide?: boolean): Promise<PresenceParMois[]> {
    return presencesParMois.obtenirPresencesParMois(this.prisma, { utilisateurId, valide });
  }

  /**
   * Récupère les présences validées par mois d'un utilisateur
   */
  async obtenirPresencesValideesParMois(utilisateurId: number): Promise<PresenceParMois[]> {
    return this.obtenirPresencesParMois(utilisateurId, true);
  }

  /**
   * Récupère les présences non validées par mois d'un utilisateur
   */
  async obtenirPresencesNonValideesParMois(utilisateurId: number): Promise<PresenceParMois[]> {
    return this.obtenirPresencesParMois(utilisateurId, false);
  }

  /**
   * Récupère les statistiques de présence par mois (tous utilisateurs)
   */
  async obtenirStatistiquesPresenceParMois(moisHistorique?: number): Promise<StatistiquesPresenceParMois[]> {
    // Validation des paramètres numériques
    if (moisHistorique !== undefined) {
      if (typeof moisHistorique !== 'number' || !Number.isFinite(moisHistorique)) {
        throw new StatistiquesError('Paramètre moisHistorique invalide', 'INVALID_PARAMETER', 400);
      }
      if (moisHistorique < 0) {
        throw new StatistiquesError('moisHistorique ne peut pas être négatif', 'INVALID_PARAMETER', 400);
      }
    }

    return statsPresenceParMois.obtenirStatistiquesPresenceParMois(this.prisma, { moisHistorique });
  }

  /**
   * Récupère les statistiques de présence globales
   */
  async obtenirStatistiquesPresence(joursHistorique?: number): Promise<StatistiquesPresenceGlobale[]> {
    // Validation des paramètres numériques
    if (joursHistorique !== undefined) {
      if (typeof joursHistorique !== 'number' || !Number.isFinite(joursHistorique)) {
        throw new StatistiquesError('Paramètre joursHistorique invalide', 'INVALID_PARAMETER', 400);
      }
      if (joursHistorique < 0) {
        throw new StatistiquesError('joursHistorique ne peut pas être négatif', 'INVALID_PARAMETER', 400);
      }
    }

    return statsPresence.obtenirStatistiquesPresence(this.prisma, { joursHistorique });
  }

  // ============================================
  // PROGRESSION
  // ============================================

  /**
   * Récupère la progression d'un utilisateur
   */
  async obtenirProgressionUtilisateur(utilisateurId: number): Promise<StatistiquesProgressionUtilisateur> {
    return progressionUtilisateur.obtenirProgressionUtilisateur(this.prisma, { utilisateurId });
  }

  /**
   * Récupère l'évolution des inscriptions
   */
  async obtenirEvolutionInscriptions(joursHistorique?: number): Promise<EvolutionInscriptions[]> {
    return evolutionInscriptions.obtenirEvolutionInscriptions(this.prisma, { joursHistorique });
  }

  // ============================================
  // FINANCIÈRES
  // ============================================

  /**
   * Récupère les statistiques financières
   */
  async obtenirStatistiquesFinancieres(): Promise<StatistiquesFinancieres> {
    return statsFinancieres.obtenirStatistiquesFinancieres(this.prisma);
  }

  // ============================================
  // MEMBRES
  // ============================================

  /**
   * Récupère les statistiques des membres
   */
  async obtenirStatistiquesMembres(): Promise<StatistiquesMembres> {
    return statsMembres.obtenirStatistiquesMembres(this.prisma);
  }

  // ============================================
  // TABLEAU DE BORD COMPLET
  // ============================================

  /**
   * Récupère le tableau de bord complet avec toutes les statistiques
   */
  async obtenirTableauDeBord(): Promise<TableauDeBord> {
    try {
      const [generales, financieres, membres, presenceParMois] = await Promise.all([
        this.obtenirStatistiquesGenerales(),
        this.obtenirStatistiquesFinancieres(),
        this.obtenirStatistiquesMembres(),
        this.obtenirStatistiquesPresenceParMois(12)
      ]);

      // Articles plus vendus - requête directe simple
      const articles = await this.prisma.commande_articles.groupBy({
        by: ['article_id'],
        _sum: {
          quantite: true
        },
        orderBy: {
          _sum: {
            quantite: 'desc'
          }
        },
        take: 10
      });

      const articlesAvecNoms = await Promise.all(
        articles.map(async (a: any) => {
          const article = await this.prisma.articles.findUnique({
            where: { id: a.article_id },
            select: { nom: true }
          });
          return {
            nom: article?.nom || 'Inconnu',
            total_vendu: a._sum.quantite || 0
          };
        })
      );

      return {
        generales,
        financieres,
        membres,
        presenceParMois,
        articlesPlusVendus: articlesAvecNoms
      };
    } catch (error) {
      if (error instanceof StatistiquesError) {
        throw error;
      }
      throw new StatistiquesError(
        `Erreur lors de la récupération du tableau de bord: ${(error as Error).message}`,
        'DASHBOARD_ERROR',
        500
      );
    }
  }

  // ============================================
  // MÉTHODES UTILITAIRES
  // ============================================

  /**
   * Vérifie si un utilisateur existe
   */
  private async verifierUtilisateurExiste(utilisateurId: number): Promise<boolean> {
    const count = await this.prisma.utilisateurs.count({
      where: { id: utilisateurId }
    });
    return count > 0;
  }

  /**
   * Valide une période de dates
   */
  private validerPeriode(dateDebut?: Date, dateFin?: Date): void {
    if (dateDebut && dateFin && dateFin < dateDebut) {
      throw new StatistiquesError(
        'La date de fin doit être postérieure à la date de début',
        'INVALID_DATE_RANGE',
        400
      );
    }
  }
}

/**
 * Instance singleton du service
 */
let statistiquesServiceInstance: StatistiquesService | null = null;

/**
 * Initialise le service statistiques
 */
export function initStatistiquesService(prisma: typeof defaultPrisma): StatistiquesService {
  statistiquesServiceInstance = new StatistiquesService(prisma);
  return statistiquesServiceInstance;
}

/**
 * Récupère l'instance du service statistiques
 */
export function getStatistiquesService(): StatistiquesService {
  if (!statistiquesServiceInstance) {
    throw new Error('StatistiquesService n\'a pas été initialisé');
  }
  return statistiquesServiceInstance;
}
