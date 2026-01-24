/**
 * Module de conversions - Convertit les noms en IDs pour les références
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { ConversionResult } from '@clubmanager/types';

/**
 * Obtient l'ID d'un genre par son nom
 */
export async function obtenirIdGenreParNom(genreName: string, prisma = defaultPrisma): Promise<number> {
  console.log(`🔄 [CompteConversions] Recherche genre "${genreName}"`);

  const genre = await prisma.genres.findFirst({
    where: { genre_name: genreName },
  });

  if (!genre) {
    throw new Error(`Genre "${genreName}" non trouvé`);
  }

  return genre.id;
}

/**
 * Obtient l'ID d'un grade par son nom/code
 */
export async function obtenirIdGradeParNom(gradeName: string, prisma = defaultPrisma): Promise<number> {
  console.log(`🔄 [CompteConversions] Recherche grade "${gradeName}"`);

  const grade = await prisma.grades.findFirst({
    where: { grade_id: gradeName },
  });

  if (!grade) {
    throw new Error(`Grade "${gradeName}" non trouvé`);
  }

  return grade.id;
}

/**
 * Obtient l'ID d'un status par son nom
 */
export async function obtenirIdStatusParNom(statusName: string, prisma = defaultPrisma): Promise<number> {
  console.log(`🔄 [CompteConversions] Recherche status "${statusName}"`);

  const status = await prisma.status.findFirst({
    where: { nom_role: statusName },
  });

  if (!status) {
    throw new Error(`Status "${statusName}" non trouvé`);
  }

  return status.id;
}

/**
 * Obtient l'ID d'un abonnement par son nom
 */
export async function obtenirIdAbonnementParNom(abonnementName: string, prisma = defaultPrisma): Promise<number> {
  console.log(`🔄 [CompteConversions] Recherche abonnement "${abonnementName}"`);

  const abonnement = await prisma.plans_tarifaires.findFirst({
    where: { nom_plan: abonnementName },
  });

  if (!abonnement) {
    throw new Error(`Abonnement "${abonnementName}" non trouvé`);
  }

  return abonnement.id;
}

/**
 * Convertit automatiquement les noms en IDs
 */
export async function convertirNomsEnIds(input: any, prisma = defaultPrisma): Promise<ConversionResult> {
  console.log(`🔄 [CompteConversions] Conversion automatique`, input);

  const result: ConversionResult = {};

  // Conversion genre
  if (input.genres && isNaN(Number(input.genres))) {
    result.genre_id = await obtenirIdGenreParNom(input.genres, prisma);
  } else if (input.genres) {
    result.genre_id = Number(input.genres);
  }

  // Conversion grade
  if (input.grades && isNaN(Number(input.grades))) {
    result.grade_id = await obtenirIdGradeParNom(input.grades, prisma);
  } else if (input.grades) {
    result.grade_id = Number(input.grades);
  }

  // Conversion status
  if (input.status && isNaN(Number(input.status))) {
    result.status_id = await obtenirIdStatusParNom(input.status, prisma);
  } else if (input.status) {
    result.status_id = Number(input.status);
  }

  // Conversion abonnement
  if (input.abonnement && isNaN(Number(input.abonnement))) {
    result.abonnement_id = await obtenirIdAbonnementParNom(input.abonnement, prisma);
  } else if (input.abonnement) {
    result.abonnement_id = Number(input.abonnement);
  }

  return result;
}
