/**
 * Queries pour le domaine Informations
 * Opérations de lecture sur la table informations
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';
import type { Information } from '@clubmanager/types';

/**
 * Obtenir toutes les informations actives
 */
export async function obtenirToutesLesInformations(): Promise<Information[]> {
  const informations = await prisma.informations.findMany({
    where: {
      status_id: 1
    },
    orderBy: {
      date_creation: 'desc'
    }
  });

  return informations;
}

/**
 * Obtenir une information par son ID
 */
export async function obtenirInformationParId(id: number): Promise<Information | null> {
  const information = await prisma.informations.findFirst({
    where: {
      id,
      status_id: 1
    }
  });

  return information;
}
