/**
 * Requêtes de récupération des alertes
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { AlerteUtilisateur } from '@clubmanager/types';

/**
 * Obtient les alertes actives avec détails utilisateur et type
 */
export async function obtenirAlertesActives(prisma = defaultPrisma): Promise<AlerteUtilisateur[]> {
  console.log('📋 [AlertesQueries] Récupération alertes actives');

  const alertes = await prisma.alertes_utilisateurs.findMany({
    where: {
      statut: 'active',
    },
    include: {
      alertes_types: true,
      utilisateurs: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          status_id: true,
        },
      },
    },
    orderBy: [
      {
        alertes_types: {
          priorite: 'desc',
        },
      },
      {
        date_detection: 'desc',
      },
    ],
  });

  return alertes.map((alerte: any) => ({
    id: alerte.id,
    utilisateurId: alerte.utilisateur_id,
    typeAlerte: alerte.alertes_types.nom,
    code: alerte.alertes_types.code,
    description: alerte.alertes_types.description || '',
    priorite: alerte.alertes_types.priorite as 'basse' | 'normale' | 'haute' | 'critique',
    statut: alerte.statut as 'active' | 'resolue' | 'ignoree',
    donneesContexte: alerte.donnees_contexte,
    dateDetection: alerte.date_detection || new Date(),
    dateResolution: alerte.date_resolution || undefined,
    notes: alerte.notes || undefined,
    nomUtilisateur: `${alerte.utilisateurs.first_name} ${alerte.utilisateurs.last_name}`,
    email: alerte.utilisateurs.email,
    statusId: alerte.utilisateurs.status_id,
  }));
}

/**
 * Obtient les alertes d'un utilisateur spécifique
 */
export async function obtenirAlertesUtilisateur(utilisateurId: number, prisma = defaultPrisma): Promise<AlerteUtilisateur[]> {
  console.log(`👤 [AlertesQueries] Récupération alertes utilisateur ${utilisateurId}`);

  // Validation
  if (!utilisateurId || utilisateurId <= 0) {
    throw new Error('L\'ID utilisateur est requis et doit être positif');
  }

  const alertes = await prisma.alertes_utilisateurs.findMany({
    where: {
      utilisateur_id: utilisateurId,
    },
    include: {
      alertes_types: true,
      utilisateurs: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
          status_id: true,
        },
      },
    },
    orderBy: {
      date_detection: 'desc',
    },
  });

  return alertes.map((alerte: any) => ({
    id: alerte.id,
    utilisateurId: alerte.utilisateur_id,
    typeAlerte: alerte.alertes_types.nom,
    code: alerte.alertes_types.code,
    description: alerte.alertes_types.description || '',
    priorite: alerte.alertes_types.priorite as 'basse' | 'normale' | 'haute' | 'critique',
    statut: alerte.statut as 'active' | 'resolue' | 'ignoree',
    donneesContexte: alerte.donnees_contexte,
    dateDetection: alerte.date_detection || new Date(),
    dateResolution: alerte.date_resolution || undefined,
    notes: alerte.notes || undefined,
    nomUtilisateur: `${alerte.utilisateurs.first_name} ${alerte.utilisateurs.last_name}`,
    email: alerte.utilisateurs.email,
    statusId: alerte.utilisateurs.status_id,
  }));
}
