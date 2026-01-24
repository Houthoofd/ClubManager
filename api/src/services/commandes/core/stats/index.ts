/**
 * Module de statistiques - Calcul des métriques des commandes
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';
import type { CommandeStats, CommandeCountByStatut } from '@clubmanager/types';

/**
 * Récupère les statistiques des commandes
 */
export async function obtenirStatistiquesCommandes(): Promise<CommandeStats> {
  console.log('📊 [CommandesStats] Calcul statistiques commandes');

  // Compter par statut
  const comptes = await prisma.commandes.groupBy({
    by: ['statut'],
    _count: true,
  });

  const comptesMap: Record<string, number> = {};
  comptes.forEach((item: any) => {
    comptesMap[item.statut] = item._count;
  });

  // Total des commandes
  const totalCommandes = await prisma.commandes.count();

  // Revenu total
  const revenuResult = await prisma.commandes.aggregate({
    _sum: {
      total: true,
    },
  });

  // Revenu du mois en cours
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const revenuMoisResult = await prisma.commandes.aggregate({
    where: {
      date_commande: {
        gte: debutMois,
      },
    },
    _sum: {
      total: true,
    },
  });

  const revenuTotal = Number(revenuResult._sum.total || 0);
  const revenuMois = Number(revenuMoisResult._sum.total || 0);
  const panierMoyen = totalCommandes > 0 ? revenuTotal / totalCommandes : 0;

  return {
    totalCommandes,
    commandesEnAttente: comptesMap.en_attente || 0,
    commandesConfirmees: comptesMap.confirmee || 0,
    commandesEnPreparation: comptesMap.en_preparation || 0,
    commandesLivrees: comptesMap.livree || 0,
    commandesAnnulees: comptesMap.annulee || 0,
    revenuTotal,
    revenuMoisEnCours: revenuMois,
    panierMoyen,
  };
}

/**
 * Compte les commandes par statut
 */
export async function obtenirComptesParStatut(): Promise<CommandeCountByStatut[]> {
  console.log('📊 [CommandesStats] Comptage par statut');

  const comptes = await prisma.commandes.groupBy({
    by: ['statut'],
    _count: true,
  });

  return comptes.map((item: any) => ({
    statut: item.statut,
    count: item._count,
  }));
}
