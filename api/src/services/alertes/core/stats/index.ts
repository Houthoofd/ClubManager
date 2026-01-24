/**
 * Statistiques et dashboard des alertes
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';
import type { AlerteDashboard, AlerteStats } from '@clubmanager/types';

/**
 * Obtient le dashboard des alertes avec compteurs par priorité
 */
export async function obtenirDashboardAlertes(): Promise<AlerteDashboard> {
  console.log('📊 [AlertesStats] Récupération dashboard alertes');

  const [alertesParPriorite, total] = await Promise.all([
    // Compte par priorité et type
    prisma.alertes_utilisateurs.groupBy({
      by: ['alerte_type_id', 'statut'],
      _count: true,
      where: {
        statut: 'active',
      },
    }),
    
    // Total alertes actives
    prisma.alertes_utilisateurs.count({
      where: { statut: 'active' },
    }),
  ]);

  // Compte critiques
  const critiques = await prisma.alertes_utilisateurs.count({
    where: {
      statut: 'active',
      alertes_types: {
        priorite: 'critique',
      },
    },
  });

  // Total résolues
  const resolues = await prisma.alertes_utilisateurs.count({
    where: { statut: 'resolue' },
  });

  return {
    totalAlertes: total,
    alertesActives: total,
    alertesCritiques: critiques,
    alertesResolues: resolues,
    alertesParType: alertesParPriorite.map((item: any) => ({
      typeAlerteId: item.alerte_type_id,
      count: item._count,
      statut: item.statut as string,
    })),
  };
}

/**
 * Obtient les statistiques des alertes (30 derniers jours)
 */
export async function obtenirStatistiquesAlertes(): Promise<AlerteStats> {
  console.log('📈 [AlertesStats] Récupération statistiques');

  const date30JoursAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [total, actives, resolues, critiques] = await Promise.all([
    prisma.alertes_utilisateurs.count({
      where: {
        date_detection: {
          gte: date30JoursAgo,
        },
      },
    }),
    
    prisma.alertes_utilisateurs.count({
      where: {
        statut: 'active',
      },
    }),
    
    prisma.alertes_utilisateurs.count({
      where: {
        statut: 'resolue',
        date_detection: {
          gte: date30JoursAgo,
        },
      },
    }),
    
    prisma.alertes_utilisateurs.count({
      where: {
        statut: 'active',
        alertes_types: {
          priorite: 'critique',
        },
      },
    }),
  ]);

  return {
    totalAlertes: total,
    alertesActives: actives,
    alertesResolues: resolues,
    alertesCritiques: critiques,
  };
}
