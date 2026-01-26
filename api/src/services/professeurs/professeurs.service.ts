/**
 * Service de professeurs
 * Gère les professeurs, leur planning et statistiques
 */

import { prisma as defaultPrisma } from '../../infrastructure/database/prisma-client.js';
import type {
  ProfesseurAvecDetails,
  PlanningCoursProf,
  AjouterProfesseurInput,
  ModifierStatutProfesseurInput,
  StatistiquesProfesseurs,
  StatistiquesProfesseur
} from '@clubmanager/types';
import { ProfesseursError } from '@clubmanager/types';

// Import des modules core
import * as queries from './core/queries/obtenirProfesseurs.js';
import * as professeurQuery from './core/queries/obtenirProfesseurParId.js';
import * as planningQuery from './core/queries/obtenirPlanningProfesseur.js';

import * as ajouterMutation from './core/mutations/ajouterProfesseur.js';
import * as modifierStatutMutation from './core/mutations/modifierStatutProfesseur.js';
import * as retirerPromotionMutation from './core/mutations/retirerPromotionProfesseur.js';

import * as stats from './core/statistiques/statistiquesProfesseurs.js';

export class ProfesseursService {
  private prisma: typeof defaultPrisma;

  constructor(prisma: typeof defaultPrisma) {
    this.prisma = prisma;
  }

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Récupère tous les professeurs
   */
  async obtenirProfesseurs(args?: queries.ObtenirProfesseursArgs): Promise<{
    professeurs: ProfesseurAvecDetails[];
    total: number;
    hasMore: boolean;
  }> {
    return queries.obtenirProfesseurs(this.prisma, args || {});
  }

  /**
   * Récupère un professeur par son ID
   */
  async obtenirProfesseurParId(id: number): Promise<ProfesseurAvecDetails | null> {
    return professeurQuery.obtenirProfesseurParId(this.prisma, { id });
  }

  /**
   * Récupère le planning des cours d'un professeur
   */
  async obtenirPlanningProfesseur(professeurId: number): Promise<{
    planning: PlanningCoursProf[];
    total: number;
  }> {
    return planningQuery.obtenirPlanningProfesseur(this.prisma, { professeurId });
  }

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Ajoute un ou plusieurs professeurs
   */
  async ajouterProfesseur(input: AjouterProfesseurInput): Promise<{
    success: boolean;
    message: string;
    professeurs?: ProfesseurAvecDetails[];
  }> {
    return ajouterMutation.ajouterProfesseur(this.prisma, input);
  }

  /**
   * Modifie le statut d'un professeur
   */
  async modifierStatutProfesseur(input: ModifierStatutProfesseurInput): Promise<ProfesseurAvecDetails> {
    return modifierStatutMutation.modifierStatutProfesseur(this.prisma, input);
  }

  /**
   * Retire la promotion professeur (redevient utilisateur normal)
   */
  async retirerPromotionProfesseur(id: number, motif?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return retirerPromotionMutation.retirerPromotionProfesseur(this.prisma, { id, motif });
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  /**
   * Récupère les statistiques générales des professeurs
   */
  async statistiquesGenerales(): Promise<StatistiquesProfesseurs> {
    return stats.statistiquesGenerales(this.prisma);
  }

  /**
   * Récupère les statistiques d'un professeur
   */
  async statistiquesProfesseur(professeurId: number): Promise<StatistiquesProfesseur> {
    return stats.statistiquesProfesseur(this.prisma, { professeurId });
  }

  // ============================================
  // MÉTHODES UTILITAIRES
  // ============================================

  /**
   * Vérifie si un professeur existe
   */
  async professeurExiste(id: number): Promise<boolean> {
    const count = await this.prisma.utilisateurs.count({
      where: {
        id,
        status_id: 5
      }
    });
    return count > 0;
  }

  /**
   * Vérifie si un utilisateur est professeur
   */
  async estProfesseur(utilisateurId: number): Promise<boolean> {
    const utilisateur = await this.prisma.utilisateurs.findUnique({
      where: { id: utilisateurId },
      select: { status_id: true }
    });
    return utilisateur?.status_id === 5;
  }

  /**
   * Obtient le nombre de cours d'un professeur
   */
  async compterCoursProfesseur(professeurId: number): Promise<number> {
    // Cette requête dépend de votre structure de base de données
    // Adapter selon vos tables de liaison
    const count = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM cours_recurrent_professeur crp
      JOIN professeurs p ON crp.professeur_id = p.id
      JOIN utilisateurs u ON p.nom = u.nom AND p.prenom = u.prenom
      WHERE u.id = ${professeurId}
    `;
    return Number(count[0]?.count || 0);
  }

  /**
   * Obtient le nombre d'élèves d'un professeur
   */
  async compterElevesProfesseur(professeurId: number): Promise<number> {
    // Cette requête dépend de votre structure de base de données
    // Adapter selon vos tables de liaison
    return 0; // À implémenter selon votre schema
  }

  /**
   * Obtient tous les professeurs (sans pagination)
   */
  async obtenirTousProfesseurs(): Promise<ProfesseurAvecDetails[]> {
    const result = await this.obtenirProfesseurs({ limit: 1000 });
    return result.professeurs;
  }

  /**
   * Recherche des professeurs par nom
   */
  async rechercherProfesseurs(recherche: string): Promise<ProfesseurAvecDetails[]> {
    const result = await this.obtenirProfesseurs({ recherche, limit: 50 });
    return result.professeurs;
  }
}

// Export d'une instance par défaut
let professeursServiceInstance: ProfesseursService | null = null;

export function initProfesseursService(prisma: typeof defaultPrisma): ProfesseursService {
  professeursServiceInstance = new ProfesseursService(prisma);
  return professeursServiceInstance;
}

export function getProfesseursService(): ProfesseursService {
  if (!professeursServiceInstance) {
    throw new Error('ProfesseursService n\'a pas été initialisé');
  }
  return professeursServiceInstance;
}
