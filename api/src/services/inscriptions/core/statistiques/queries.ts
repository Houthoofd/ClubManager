/**
 * Queries pour le domaine Statistiques des inscriptions
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { InscriptionStats } from '@clubmanager/types';

/**
 * Obtient les statistiques globales des inscriptions
 */
export async function obtenirStatistiquesInscriptions(prisma = defaultPrisma): Promise<InscriptionStats> {
  console.log('📊 [StatistiquesQueries] Calcul statistiques inscriptions');

  // Total inscriptions
  const totalInscriptions = await prisma.inscriptions.count();

  // Inscriptions actives
  const inscriptionsActives = await prisma.inscriptions.count({
    where: { status_id: true },
  });

  // Inscriptions en attente
  const inscriptionsEnAttente = await prisma.inscriptions.count({
    where: { status_id: null },
  });

  // Inscriptions par cours
  const inscriptionsParCoursData = await prisma.inscriptions.groupBy({
    by: ['cours_id'],
    where: { status_id: true },
    _count: {
      id: true,
    },
  });

  // Récupérer les détails des cours
  const coursIds = inscriptionsParCoursData.map((i: any) => i.cours_id);
  const coursDetails = await prisma.cours.findMany({
    where: { id: { in: coursIds } },
    select: { id: true, type_cours: true },
  });

  const inscriptionsParCours = inscriptionsParCoursData.map((item: any) => {
    const cours = coursDetails.find((c: any) => c.id === item.cours_id);
    return {
      cours_id: item.cours_id,
      type_cours: cours?.type_cours || 'Inconnu',
      count: item._count.id,
    };
  });

  // Inscriptions par utilisateur
  const inscriptionsParUtilisateurData = await prisma.inscriptions.groupBy({
    by: ['utilisateur_id'],
    where: { status_id: true },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10, // Top 10
  });

  // Récupérer les détails des utilisateurs
  const utilisateurIds = inscriptionsParUtilisateurData.map((i: any) => i.utilisateur_id);
  const utilisateurDetails = await prisma.utilisateurs.findMany({
    where: { id: { in: utilisateurIds } },
    select: { id: true, first_name: true, last_name: true },
  });

  const inscriptionsParUtilisateur = inscriptionsParUtilisateurData.map((item: any) => {
    const user = utilisateurDetails.find((u: any) => u.id === item.utilisateur_id);
    return {
      utilisateur_id: item.utilisateur_id,
      nom_complet: user ? `${user.first_name} ${user.last_name}` : 'Inconnu',
      count: item._count.id,
    };
  });

  // Taux de présence (à adapter selon votre logique métier)
  // Pour l'instant, on considère que toutes les inscriptions actives sont présentes
  const tauxPresence = totalInscriptions > 0 
    ? Math.round((inscriptionsActives / totalInscriptions) * 100) 
    : 0;

  const stats: InscriptionStats = {
    totalInscriptions,
    inscriptionsActives,
    inscriptionsEnAttente,
    tauxPresence,
    inscriptionsParCours,
    inscriptionsParUtilisateur,
  };

  console.log('✅ [StatistiquesQueries] Statistiques calculées:', {
    total: totalInscriptions,
    actives: inscriptionsActives,
    enAttente: inscriptionsEnAttente,
  });

  return stats;
}

/**
 * Obtient le nombre d'inscriptions par période
 */
export async function obtenirInscriptionsParPeriode(
  dateDebut: Date,
  dateFin: Date,
  prisma = defaultPrisma
): Promise<number> {
  console.log(`📊 [StatistiquesQueries] Comptage inscriptions du ${dateDebut.toISOString()} au ${dateFin.toISOString()}`);

  const count = await prisma.inscriptions.count({
    where: {
      date_inscription: {
        gte: dateDebut,
        lte: dateFin,
      },
    },
  });

  console.log(`✅ [StatistiquesQueries] ${count} inscriptions sur la période`);
  return count;
}
