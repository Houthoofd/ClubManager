/**
 * Service Statistiques - Logique métier
 *
 * Ce service encapsule toute la logique métier liée aux statistiques
 * du club. Il utilise Prisma pour accéder aux données.
 *
 * ✅ Migré vers Prisma avec intégration Sentry
 *
 * @module statistiques.service
 */

import { prisma } from '@/infrastructure/database/prisma-client.js';
import {
  captureException,
  addSentryBreadcrumb,
} from '@/shared/config/sentry.config.js';

// Types pour le service
export interface FrequentationData {
  utilisateurId: number;
  totalFrequentation: number;
  mois: Array<{
    mois: string;
    frequentation: number;
    totalCoursMois: number;
    pourcentageCoursValides: number;
  }>;
}

export interface ProgressionData {
  utilisateur_id: number;
  nom_complet: string;
  grade_actuel: string;
  nombre_cours_suivis: number;
  taux_presence: number;
  date_dernier_cours?: string;
}

export interface PresenceParMoisData {
  mois: string;
  presences: number;
  type_cours: string;
}

export interface StatistiqueSimple {
  count?: number;
  total?: number;
  value?: number;
  taux?: number;
}

export interface PaiementParMois {
  mois: string;
  total: number;
  nombre_paiements: number;
}

export interface MembreParPlan {
  plan_nom: string;
  nombre_membres: number;
  pourcentage: number;
}

export interface DernierPaiement {
  id: number;
  utilisateur_nom: string;
  montant: number;
  date_paiement: string;
  statut: string;
}

export interface PaiementEchu {
  id: number;
  utilisateur_nom: string;
  montant: number;
  date_fin_periode: string;
  jours_echus: number;
}

export interface NouveauMembre {
  id: number;
  nom_complet: string;
  email: string;
  date_inscription: string;
  jours_depuis_inscription: number;
}

export interface MembreAssidu {
  id: number;
  nom_complet: string;
  total_presences: number;
  taux_presence: number;
}

export interface MembreParGrade {
  grade: string;
  nombre_membres: number;
  pourcentage: number;
}

export interface MembreParGenre {
  genre: string;
  nombre_membres: number;
  pourcentage: number;
}

export interface Anniversaire {
  id: number;
  nom_complet: string;
  date_naissance: string;
  age: number;
  jours_avant_anniversaire: number;
}

export interface ArticleVendu {
  article_nom: string;
  quantite_vendue: number;
  revenu_total: number;
}

/**
 * Obtenir les statistiques de fréquentation d'un utilisateur
 */
export async function obtenirStatistiquesFrequentation(
  utilisateurId: number,
): Promise<FrequentationData> {
  try {
    addSentryBreadcrumb(
      `Récupération statistiques de fréquentation pour userId: ${utilisateurId}`,
      "service.statistiques",
      "info",
      { utilisateurId },
    );

    console.log(
      `📊 [StatistiquesService] Récupération fréquentation userId: ${utilisateurId}`,
    );

    // Récupérer les inscriptions de l'utilisateur avec les cours
    const inscriptions = await prisma.inscriptions.findMany({
      where: {
        utilisateur_id: utilisateurId,
      },
      include: {
        cours: true,
      },
    });

    if (inscriptions.length === 0) {
      console.log(
        `⚠️ [StatistiquesService] Aucune inscription pour userId: ${utilisateurId}`,
      );
      return {
        utilisateurId,
        totalFrequentation: 0,
        mois: [],
      };
    }

    // Grouper par mois
    const moisMap = new Map<string, { count: number; total: number }>();

    inscriptions.forEach((inscription) => {
      const dateInscription = new Date(inscription.date_inscription);
      const moisKey = `${dateInscription.getFullYear()}-${String(dateInscription.getMonth() + 1).padStart(2, "0")}`;

      if (!moisMap.has(moisKey)) {
        moisMap.set(moisKey, { count: 0, total: 0 });
      }

      const moisData = moisMap.get(moisKey)!;
      moisData.count += 1;
      moisData.total += 1;
    });

    const moisData = Array.from(moisMap.entries()).map(([mois, data]) => ({
      mois,
      frequentation: data.count,
      totalCoursMois: data.total,
      pourcentageCoursValides:
        data.total > 0 ? Math.round((data.count / data.total) * 100) : 0,
    }));

    const totalFrequentation = inscriptions.length;

    console.log(
      `✅ [StatistiquesService] Fréquentation calculée: ${totalFrequentation} cours`,
    );

    return {
      utilisateurId,
      totalFrequentation,
      mois: moisData,
    };
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération fréquentation:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "obtenirStatistiquesFrequentation",
      },
      extra: { utilisateurId },
    });

    throw new Error(
      `Erreur lors de la récupération des statistiques de fréquentation: ${error.message}`,
    );
  }
}

/**
 * Obtenir la progression d'un utilisateur
 */
export async function obtenirProgressionUtilisateur(
  userId: number,
): Promise<ProgressionData> {
  try {
    addSentryBreadcrumb(
      `Récupération progression pour userId: ${userId}`,
      "service.statistiques",
      "info",
      { userId },
    );

    console.log(
      `📊 [StatistiquesService] Récupération progression userId: ${userId}`,
    );

    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: userId },
      include: {
        grades: true,
        inscriptions: {
          include: {
            cours: true,
          },
        },
      },
    });

    if (!utilisateur) {
      throw new Error(`Utilisateur ${userId} non trouvé`);
    }

    const nombreCoursSuivis = utilisateur.inscriptions.length;
    const tauxPresence = nombreCoursSuivis > 0 ? 100 : 0; // Simplification

    const dernierCours =
      utilisateur.inscriptions.length > 0
        ? new Date(
            Math.max(
              ...utilisateur.inscriptions.map((i) =>
                i.date_inscription.getTime(),
              ),
            ),
          ).toISOString()
        : undefined;

    console.log(
      `✅ [StatistiquesService] Progression calculée: ${nombreCoursSuivis} cours`,
    );

    return {
      utilisateur_id: userId,
      nom_complet: `${utilisateur.first_name} ${utilisateur.last_name}`,
      grade_actuel: utilisateur.grades?.nom || "Non défini",
      nombre_cours_suivis: nombreCoursSuivis,
      taux_presence: tauxPresence,
      date_dernier_cours: dernierCours,
    };
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération progression:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "obtenirProgressionUtilisateur",
      },
      extra: { userId },
    });

    throw new Error(
      `Erreur lors de la récupération de la progression: ${error.message}`,
    );
  }
}

/**
 * Obtenir les présences par mois d'un utilisateur
 */
export async function obtenirPresenceParMois(
  userId: number,
): Promise<PresenceParMoisData[]> {
  try {
    addSentryBreadcrumb(
      `Récupération présences par mois pour userId: ${userId}`,
      "service.statistiques",
      "info",
      { userId },
    );

    console.log(
      `📊 [StatistiquesService] Récupération présences par mois userId: ${userId}`,
    );

    const inscriptions = await prisma.inscriptions.findMany({
      where: {
        utilisateur_id: userId,
      },
      include: {
        cours: true,
      },
      orderBy: {
        date_inscription: "desc",
      },
    });

    // Grouper par mois
    const moisMap = new Map<
      string,
      Map<string, { count: number; typeCours: string }>
    >();

    inscriptions.forEach((inscription) => {
      const date = new Date(inscription.date_inscription);
      const moisKey = date.toLocaleString("fr-FR", {
        year: "numeric",
        month: "long",
      });
      const typeCours = inscription.cours.nom_cours || "Cours";

      if (!moisMap.has(moisKey)) {
        moisMap.set(moisKey, new Map());
      }

      const moisData = moisMap.get(moisKey)!;
      if (!moisData.has(typeCours)) {
        moisData.set(typeCours, { count: 0, typeCours });
      }

      const typeData = moisData.get(typeCours)!;
      typeData.count += 1;
    });

    const results: PresenceParMoisData[] = [];
    moisMap.forEach((types, mois) => {
      types.forEach((data) => {
        results.push({
          mois,
          presences: data.count,
          type_cours: data.typeCours,
        });
      });
    });

    console.log(
      `✅ [StatistiquesService] Présences par mois calculées: ${results.length} entrées`,
    );

    return results;
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération présences par mois:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "obtenirPresenceParMois",
      },
      extra: { userId },
    });

    throw new Error(
      `Erreur lors de la récupération des présences par mois: ${error.message}`,
    );
  }
}

/**
 * Obtenir le nombre total de membres
 */
export async function getNombreMembres(): Promise<StatistiqueSimple> {
  try {
    addSentryBreadcrumb(
      "Récupération nombre total de membres",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération nombre de membres`);

    const count = await prisma.utilisateurs.count({
      where: {
        active: true,
      },
    });

    console.log(`✅ [StatistiquesService] Nombre de membres: ${count}`);

    return {
      count,
      value: count,
    };
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération nombre membres:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getNombreMembres",
      },
    });

    throw new Error(
      `Erreur lors de la récupération du nombre de membres: ${error.message}`,
    );
  }
}

/**
 * Obtenir le total des paiements du mois
 */
export async function getTotalPaiementsMois(): Promise<StatistiqueSimple> {
  try {
    addSentryBreadcrumb(
      "Récupération total paiements du mois",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération total paiements mois`);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await prisma.paiements.aggregate({
      where: {
        date_paiement: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
        statut: "succes",
      },
      _sum: {
        montant: true,
      },
      _count: true,
    });

    const total = Number(result._sum.montant || 0);

    console.log(
      `✅ [StatistiquesService] Total paiements mois: ${total}€ (${result._count} paiements)`,
    );

    return {
      total,
      value: total,
      count: result._count,
    };
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération total paiements mois:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getTotalPaiementsMois",
      },
    });

    throw new Error(
      `Erreur lors de la récupération du total des paiements du mois: ${error.message}`,
    );
  }
}

/**
 * Obtenir le nombre de paiements récents (7 derniers jours)
 */
export async function getPaiementsRecents(): Promise<StatistiqueSimple> {
  try {
    addSentryBreadcrumb(
      "Récupération paiements récents (7 jours)",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération paiements récents`);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const count = await prisma.paiements.count({
      where: {
        date_paiement: {
          gte: sevenDaysAgo,
        },
        statut: "succes",
      },
    });

    console.log(`✅ [StatistiquesService] Paiements récents: ${count}`);

    return {
      count,
      value: count,
    };
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération paiements récents:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getPaiementsRecents",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des paiements récents: ${error.message}`,
    );
  }
}

/**
 * Obtenir le nombre de paiements en attente
 */
export async function getPaiementsEnAttente(): Promise<StatistiqueSimple> {
  try {
    addSentryBreadcrumb(
      "Récupération paiements en attente",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération paiements en attente`);

    const count = await prisma.echeances_paiements.count({
      where: {
        statut: "en_attente",
      },
    });

    console.log(`✅ [StatistiquesService] Paiements en attente: ${count}`);

    return {
      count,
      value: count,
    };
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération paiements en attente:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getPaiementsEnAttente",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des paiements en attente: ${error.message}`,
    );
  }
}

/**
 * Obtenir le nombre de plans actifs
 */
export async function getPlansActifs(): Promise<StatistiqueSimple> {
  try {
    addSentryBreadcrumb(
      "Récupération nombre de plans actifs",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération plans actifs`);

    const count = await prisma.plans_tarifaires.count({
      where: {
        actif: true,
      },
    });

    console.log(`✅ [StatistiquesService] Plans actifs: ${count}`);

    return {
      count,
      value: count,
    };
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération plans actifs:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getPlansActifs",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des plans actifs: ${error.message}`,
    );
  }
}

/**
 * Obtenir le taux de renouvellement des abonnements
 */
export async function getTauxRenouvellement(): Promise<StatistiqueSimple> {
  try {
    addSentryBreadcrumb(
      "Calcul taux de renouvellement",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Calcul taux de renouvellement`);

    const totalAbonnes = await prisma.utilisateurs.count({
      where: {
        abonnement_id: {
          not: null,
        },
      },
    });

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const renouvellements = await prisma.paiements.count({
      where: {
        date_paiement: {
          gte: lastMonth,
        },
        statut: "succes",
      },
    });

    const taux =
      totalAbonnes > 0 ? Math.round((renouvellements / totalAbonnes) * 100) : 0;

    console.log(`✅ [StatistiquesService] Taux de renouvellement: ${taux}%`);

    return {
      taux,
      value: taux,
      count: renouvellements,
      total: totalAbonnes,
    };
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur calcul taux renouvellement:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getTauxRenouvellement",
      },
    });

    throw new Error(
      `Erreur lors du calcul du taux de renouvellement: ${error.message}`,
    );
  }
}

/**
 * Obtenir l'évolution des paiements par mois
 */
export async function getPaiementsParMois(): Promise<PaiementParMois[]> {
  try {
    addSentryBreadcrumb(
      "Récupération évolution paiements par mois",
      "service.statistiques",
      "info",
    );

    console.log(
      `📊 [StatistiquesService] Récupération paiements par mois (12 derniers mois)`,
    );

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const paiements = await prisma.paiements.findMany({
      where: {
        date_paiement: {
          gte: twelveMonthsAgo,
        },
        statut: "succes",
      },
      select: {
        montant: true,
        date_paiement: true,
      },
    });

    // Grouper par mois
    const moisMap = new Map<
      string,
      { total: number; nombre_paiements: number }
    >();

    paiements.forEach((paiement) => {
      const date = new Date(paiement.date_paiement);
      const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!moisMap.has(moisKey)) {
        moisMap.set(moisKey, { total: 0, nombre_paiements: 0 });
      }

      const moisData = moisMap.get(moisKey)!;
      moisData.total += Number(paiement.montant);
      moisData.nombre_paiements += 1;
    });

    const results = Array.from(moisMap.entries())
      .map(([mois, data]) => ({
        mois,
        total: Math.round(data.total * 100) / 100,
        nombre_paiements: data.nombre_paiements,
      }))
      .sort((a, b) => a.mois.localeCompare(b.mois));

    console.log(
      `✅ [StatistiquesService] Paiements par mois: ${results.length} mois`,
    );

    return results;
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération paiements par mois:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getPaiementsParMois",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des paiements par mois: ${error.message}`,
    );
  }
}

/**
 * Obtenir la répartition des membres par plan
 */
export async function getMembresParPlan(): Promise<MembreParPlan[]> {
  try {
    addSentryBreadcrumb(
      "Récupération répartition membres par plan",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération membres par plan`);

    const totalMembres = await prisma.utilisateurs.count({
      where: {
        active: true,
        abonnement_id: {
          not: null,
        },
      },
    });

    const membresParPlan = await prisma.utilisateurs.groupBy({
      by: ["abonnement_id"],
      where: {
        active: true,
        abonnement_id: {
          not: null,
        },
      },
      _count: true,
    });

    const results: MembreParPlan[] = [];

    for (const groupe of membresParPlan) {
      if (groupe.abonnement_id) {
        const plan = await prisma.plans_tarifaires.findUnique({
          where: { id: groupe.abonnement_id },
        });

        if (plan) {
          results.push({
            plan_nom: plan.nom_plan,
            nombre_membres: groupe._count,
            pourcentage:
              totalMembres > 0
                ? Math.round((groupe._count / totalMembres) * 100)
                : 0,
          });
        }
      }
    }

    console.log(
      `✅ [StatistiquesService] Membres par plan: ${results.length} plans`,
    );

    return results;
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération membres par plan:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getMembresParPlan",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des membres par plan: ${error.message}`,
    );
  }
}

/**
 * Obtenir les 10 derniers paiements
 */
export async function getDerniersPaiements(): Promise<DernierPaiement[]> {
  try {
    addSentryBreadcrumb(
      "Récupération 10 derniers paiements",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération derniers paiements`);

    const paiements = await prisma.paiements.findMany({
      take: 10,
      orderBy: {
        date_paiement: "desc",
      },
      include: {
        utilisateurs: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    const results = paiements.map((p) => ({
      id: p.id,
      utilisateur_nom: `${p.utilisateurs.first_name} ${p.utilisateurs.last_name}`,
      montant: Number(p.montant),
      date_paiement: p.date_paiement.toISOString(),
      statut: p.statut || "inconnu",
    }));

    console.log(
      `✅ [StatistiquesService] Derniers paiements: ${results.length}`,
    );

    return results;
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération derniers paiements:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getDerniersPaiements",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des derniers paiements: ${error.message}`,
    );
  }
}

/**
 * Obtenir les paiements échus
 */
export async function getPaiementsEchus(): Promise<PaiementEchu[]> {
  try {
    addSentryBreadcrumb(
      "Récupération paiements échus",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération paiements échus`);

    const now = new Date();

    const echeances = await prisma.echeances_paiements.findMany({
      where: {
        statut: "en_attente",
        date_echeance: {
          lt: now,
        },
      },
      include: {
        utilisateurs: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        date_echeance: "asc",
      },
    });

    const results = echeances.map((e) => {
      const joursEchus = Math.floor(
        (now.getTime() - e.date_echeance.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        id: e.id,
        utilisateur_nom: `${e.utilisateurs.first_name} ${e.utilisateurs.last_name}`,
        montant: Number(e.montant),
        date_fin_periode: e.date_echeance.toISOString(),
        jours_echus: joursEchus,
      };
    });

    console.log(`✅ [StatistiquesService] Paiements échus: ${results.length}`);

    return results;
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération paiements échus:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getPaiementsEchus",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des paiements échus: ${error.message}`,
    );
  }
}

/**
 * Obtenir les nouveaux membres (7 derniers jours)
 */
export async function getNouveauxMembres(): Promise<NouveauMembre[]> {
  try {
    addSentryBreadcrumb(
      "Récupération nouveaux membres (7 jours)",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération nouveaux membres`);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const membres = await prisma.utilisateurs.findMany({
      where: {
        date_inscription: {
          gte: sevenDaysAgo,
        },
        active: true,
      },
      orderBy: {
        date_inscription: "desc",
      },
    });

    const now = new Date();
    const results = membres.map((m) => {
      const joursDepuis = Math.floor(
        (now.getTime() - m.date_inscription.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        id: m.id,
        nom_complet: `${m.first_name} ${m.last_name}`,
        email: m.email,
        date_inscription: m.date_inscription.toISOString(),
        jours_depuis_inscription: joursDepuis,
      };
    });

    console.log(`✅ [StatistiquesService] Nouveaux membres: ${results.length}`);

    return results;
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération nouveaux membres:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getNouveauxMembres",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des nouveaux membres: ${error.message}`,
    );
  }
}

/**
 * Obtenir le top 5 des membres les plus assidus
 */
export async function getTopMembresAssidus(): Promise<MembreAssidu[]> {
  try {
    addSentryBreadcrumb(
      "Récupération top membres assidus",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération top membres assidus`);

    const inscriptionsParUtilisateur = await prisma.inscriptions.groupBy({
      by: ["utilisateur_id"],
      _count: true,
      orderBy: {
        _count: {
          utilisateur_id: "desc",
        },
      },
      take: 5,
    });

    const results: MembreAssidu[] = [];

    for (const groupe of inscriptionsParUtilisateur) {
      const utilisateur = await prisma.utilisateurs.findUnique({
        where: { id: groupe.utilisateur_id },
      });

      if (utilisateur) {
        results.push({
          id: utilisateur.id,
          nom_complet: `${utilisateur.first_name} ${utilisateur.last_name}`,
          total_presences: groupe._count,
          taux_presence: 100, // Simplification
        });
      }
    }

    console.log(
      `✅ [StatistiquesService] Top membres assidus: ${results.length}`,
    );

    return results;
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération top membres assidus:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getTopMembresAssidus",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des membres les plus assidus: ${error.message}`,
    );
  }
}

/**
 * Obtenir la répartition des membres par grade
 */
export async function getMembresParGrade(): Promise<MembreParGrade[]> {
  try {
    addSentryBreadcrumb(
      "Récupération répartition membres par grade",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération membres par grade`);

    const totalMembres = await prisma.utilisateurs.count({
      where: { active: true },
    });

    const membresParGrade = await prisma.utilisateurs.groupBy({
      by: ["grade_id"],
      where: {
        active: true,
        grade_id: {
          not: null,
        },
      },
      _count: true,
    });

    const results: MembreParGrade[] = [];

    for (const groupe of membresParGrade) {
      if (groupe.grade_id) {
        const grade = await prisma.grades.findUnique({
          where: { id: groupe.grade_id },
        });

        if (grade) {
          results.push({
            grade: grade.nom,
            nombre_membres: groupe._count,
            pourcentage:
              totalMembres > 0
                ? Math.round((groupe._count / totalMembres) * 100)
                : 0,
          });
        }
      }
    }

    console.log(
      `✅ [StatistiquesService] Membres par grade: ${results.length} grades`,
    );

    return results;
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération membres par grade:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getMembresParGrade",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des membres par grade: ${error.message}`,
    );
  }
}

/**
 * Obtenir la répartition des membres par genre
 */
export async function getMembresParGenre(): Promise<MembreParGenre[]> {
  try {
    addSentryBreadcrumb(
      "Récupération répartition membres par genre",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération membres par genre`);

    const totalMembres = await prisma.utilisateurs.count({
      where: { active: true },
    });

    const membresParGenre = await prisma.utilisateurs.groupBy({
      by: ["genre_id"],
      where: {
        active: true,
        genre_id: {
          not: null,
        },
      },
      _count: true,
    });

    const results: MembreParGenre[] = [];

    for (const groupe of membresParGenre) {
      if (groupe.genre_id) {
        const genre = await prisma.genres.findUnique({
          where: { id: groupe.genre_id },
        });

        if (genre) {
          results.push({
            genre: genre.nom,
            nombre_membres: groupe._count,
            pourcentage:
              totalMembres > 0
                ? Math.round((groupe._count / totalMembres) * 100)
                : 0,
          });
        }
      }
    }

    console.log(
      `✅ [StatistiquesService] Membres par genre: ${results.length} genres`,
    );

    return results;
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération membres par genre:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getMembresParGenre",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des membres par genre: ${error.message}`,
    );
  }
}

/**
 * Obtenir les prochains anniversaires (30 jours)
 */
export async function getProchainsAnniversaires(): Promise<Anniversaire[]> {
  try {
    addSentryBreadcrumb(
      "Récupération prochains anniversaires (30 jours)",
      "service.statistiques",
      "info",
    );

    console.log(
      `📊 [StatistiquesService] Récupération prochains anniversaires`,
    );

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const membres = await prisma.utilisateurs.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        date_of_birth: true,
      },
    });

    const results: Anniversaire[] = [];

    membres.forEach((m) => {
      const dateNaissance = new Date(m.date_of_birth);
      const anniversaireCetteAnnee = new Date(
        now.getFullYear(),
        dateNaissance.getMonth(),
        dateNaissance.getDate(),
      );

      // Si l'anniversaire est passé cette année, regarder l'année prochaine
      if (anniversaireCetteAnnee < now) {
        anniversaireCetteAnnee.setFullYear(now.getFullYear() + 1);
      }

      const joursAvant = Math.floor(
        (anniversaireCetteAnnee.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (joursAvant >= 0 && joursAvant <= 30) {
        const age =
          now.getFullYear() -
          dateNaissance.getFullYear() +
          (anniversaireCetteAnnee.getFullYear() > now.getFullYear() ? 0 : 1);

        results.push({
          id: m.id,
          nom_complet: `${m.first_name} ${m.last_name}`,
          date_naissance: dateNaissance.toISOString().split("T")[0],
          age,
          jours_avant_anniversaire: joursAvant,
        });
      }
    });

    // Trier par jours avant anniversaire
    results.sort(
      (a, b) => a.jours_avant_anniversaire - b.jours_avant_anniversaire,
    );

    console.log(
      `✅ [StatistiquesService] Prochains anniversaires: ${results.length}`,
    );

    return results;
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération prochains anniversaires:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getProchainsAnniversaires",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des prochains anniversaires: ${error.message}`,
    );
  }
}

/**
 * Obtenir les articles les plus vendus
 */
export async function getArticlesPlusVendus(): Promise<ArticleVendu[]> {
  try {
    addSentryBreadcrumb(
      "Récupération articles les plus vendus",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération articles plus vendus`);

    const commandesArticles = await prisma.commandes_articles.groupBy({
      by: ["article_id"],
      _sum: {
        quantite: true,
      },
      orderBy: {
        _sum: {
          quantite: "desc",
        },
      },
      take: 10,
    });

    const results: ArticleVendu[] = [];

    for (const groupe of commandesArticles) {
      const article = await prisma.articles.findUnique({
        where: { id: groupe.article_id },
      });

      if (article) {
        const quantiteVendue = groupe._sum.quantite || 0;
        const revenuTotal = quantiteVendue * Number(article.prix);

        results.push({
          article_nom: article.nom,
          quantite_vendue: quantiteVendue,
          revenu_total: Math.round(revenuTotal * 100) / 100,
        });
      }
    }

    console.log(
      `✅ [StatistiquesService] Articles plus vendus: ${results.length}`,
    );

    return results;
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération articles plus vendus:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getArticlesPlusVendus",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des articles les plus vendus: ${error.message}`,
    );
  }
}

/**
 * Obtenir le nombre de cours de la semaine
 */
export async function getCoursSemaine(): Promise<StatistiqueSimple> {
  try {
    addSentryBreadcrumb(
      "Récupération nombre de cours de la semaine",
      "service.statistiques",
      "info",
    );

    console.log(`📊 [StatistiquesService] Récupération cours de la semaine`);

    // Compter tous les cours actifs (simplification)
    const count = await prisma.cours.count({
      where: {
        actif: true,
      },
    });

    console.log(`✅ [StatistiquesService] Cours de la semaine: ${count}`);

    return {
      count,
      value: count,
    };
  } catch (error: any) {
    console.error(
      `❌ [StatistiquesService] Erreur récupération cours semaine:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "statistiques",
        operation: "getCoursSemaine",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des cours de la semaine: ${error.message}`,
    );
  }
}
