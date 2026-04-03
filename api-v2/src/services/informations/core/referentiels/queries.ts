/**
 * Queries pour le domaine Référentiels
 * Opérations de lecture sur les tables de référence
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';
import type { Status, PlanTarifaire, Grade } from '@clubmanager/types';

/**
 * Obtenir tous les status
 */
export async function obtenirLesStatus(): Promise<Status[]> {
  console.log('🔍 [ReferentielsQueries] Récupération des status');
  
  const status = await prisma.status.findMany({
    orderBy: {
      id: 'asc'
    }
  });

  console.log(`✅ [ReferentielsQueries] ${status.length} status récupérés`);
  return status;
}

/**
 * Obtenir tous les plans tarifaires
 */
export async function obtenirLesPlansTarifaires(): Promise<PlanTarifaire[]> {
  console.log('🔍 [ReferentielsQueries] Récupération des plans tarifaires');
  
  const plans = await prisma.plans_tarifaires.findMany({
    orderBy: {
      id: 'asc'
    }
  });

  console.log(`✅ [ReferentielsQueries] ${plans.length} plans tarifaires récupérés`);
  return plans;
}

/**
 * Obtenir tous les genres
 */
export async function obtenirLesGenres(): Promise<{ id: number; nom: string }[]> {
  console.log('🔍 [ReferentielsQueries] Récupération des genres');
  
  const genres = await prisma.genres.findMany({
    orderBy: {
      id: 'asc'
    }
  });

  console.log(`✅ [ReferentielsQueries] ${genres.length} genres récupérés`);
  return genres;
}

/**
 * Obtenir tous les grades
 */
export async function obtenirLesGrades(): Promise<Grade[]> {
  console.log('🔍 [ReferentielsQueries] Récupération des grades');
  
  const grades = await prisma.grades.findMany({
    orderBy: {
      id: 'asc'
    }
  });

  console.log(`✅ [ReferentielsQueries] ${grades.length} grades récupérés`);
  return grades;
}
