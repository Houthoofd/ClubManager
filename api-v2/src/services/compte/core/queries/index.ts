/**
 * Module de requêtes - Récupération des informations de compte
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { CompteInfo } from '@clubmanager/types';

/**
 * Récupère les informations d'un compte par ID
 */
export async function obtenirCompteParId(utilisateurId: number, prisma = defaultPrisma): Promise<CompteInfo | null> {
  console.log(`🔍 [CompteQueries] Recherche compte ID ${utilisateurId}`);

  const utilisateur = await prisma.utilisateurs.findUnique({
    where: { id: utilisateurId, status_id: 1 },
    include: {
      genres: true,
      status: true,
      grades: true,
      plans_tarifaires: true,
    },
  });

  if (!utilisateur) {
    return null;
  }

  return transformCompte(utilisateur);
}

/**
 * Récupère un utilisateur par prénom et nom
 */
export async function obtenirCompteParNomPrenom(
  prenom: string,
  nom: string,
  prisma = defaultPrisma
): Promise<CompteInfo[]> {
  console.log(`🔍 [CompteQueries] Recherche compte ${prenom} ${nom}`);

  const utilisateurs = await prisma.utilisateurs.findMany({
    where: {
      first_name: prenom,
      last_name: nom,
    },
    include: {
      genres: true,
      status: true,
      grades: true,
      plans_tarifaires: true,
    },
  });

  return utilisateurs.map(transformCompte);
}

/**
 * Récupère les informations complètes d'un compte
 */
export async function obtenirInformationsCompte(
  prenom: string,
  nom: string,
  prisma = defaultPrisma
): Promise<CompteInfo | null> {
  console.log(`🔍 [CompteQueries] Informations compte ${prenom} ${nom}`);

  const utilisateur = await prisma.utilisateurs.findFirst({
    where: {
      first_name: prenom,
      last_name: nom,
    },
    include: {
      genres: true,
      status: true,
      grades: true,
      plans_tarifaires: true,
    },
  });

  if (!utilisateur) {
    return null;
  }

  return transformCompte(utilisateur);
}

/**
 * Transforme un utilisateur Prisma en CompteInfo
 */
function transformCompte(utilisateurPrisma: any): CompteInfo {
  return {
    id: utilisateurPrisma.id,
    first_name: utilisateurPrisma.first_name,
    last_name: utilisateurPrisma.last_name,
    nom_utilisateur: utilisateurPrisma.nom_utilisateur || undefined,
    email: utilisateurPrisma.email,
    date_of_birth: utilisateurPrisma.date_of_birth || undefined,
    phone: utilisateurPrisma.phone || undefined,
    genre_id: utilisateurPrisma.genre_id || undefined,
    genre_name: utilisateurPrisma.genres?.genre_name || undefined,
    status_id: utilisateurPrisma.status_id,
    status_name: utilisateurPrisma.status?.nom_role || undefined,
    grade_id: utilisateurPrisma.grade_id || undefined,
    grade_name: utilisateurPrisma.grades?.grade_id || undefined,
    abonnement_id: utilisateurPrisma.abonnement_id || undefined,
    abonnement_name: utilisateurPrisma.plans_tarifaires?.nom_plan || undefined,
  };
}
