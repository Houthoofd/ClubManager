/**
 * Queries pour le domaine Inscriptions
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { Inscription } from '@clubmanager/types';

/**
 * Obtient toutes les inscriptions avec relations
 */
export async function obtenirToutesLesInscriptions(prisma = defaultPrisma): Promise<Inscription[]> {
  console.log('📋 [InscriptionsQueries] Récupération de toutes les inscriptions');

  const inscriptions = await prisma.inscriptions.findMany({
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      cours: {
        select: {
          id: true,
          date_cours: true,
          type_cours: true,
          heure_debut: true,
          heure_fin: true,
        },
      },
    },
    orderBy: {
      date_inscription: 'desc',
    },
  });

  console.log(`✅ [InscriptionsQueries] ${inscriptions.length} inscriptions récupérées`);

  return inscriptions.map((i: any) => ({
    ...i,
    utilisateur: i.users,
  })) as Inscription[];
}

/**
 * Obtient une inscription par ID
 */
export async function obtenirInscriptionParId(id: number, prisma = defaultPrisma): Promise<Inscription | null> {
  console.log(`🔍 [InscriptionsQueries] Récupération inscription ID ${id}`);

  const inscription = await prisma.inscriptions.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      cours: {
        select: {
          id: true,
          date_cours: true,
          type_cours: true,
          heure_debut: true,
          heure_fin: true,
        },
      },
    },
  });

  if (!inscription) {
    console.log(`❌ [InscriptionsQueries] Inscription ${id} non trouvée`);
    return null;
  }

  console.log(`✅ [InscriptionsQueries] Inscription ${id} trouvée`);
  return {
    ...inscription,
    utilisateur: inscription.users,
  } as Inscription;
}

/**
 * Obtient les inscriptions d'un utilisateur
 */
export async function obtenirInscriptionsParUtilisateur(utilisateurId: number, prisma = defaultPrisma): Promise<Inscription[]> {
  console.log(`📋 [InscriptionsQueries] Récupération inscriptions utilisateur ${utilisateurId}`);

  const inscriptions = await prisma.inscriptions.findMany({
    where: { utilisateur_id: utilisateurId },
    include: {
      cours: {
        select: {
          id: true,
          date_cours: true,
          type_cours: true,
          heure_debut: true,
          heure_fin: true,
        },
      },
    },
    orderBy: {
      date_inscription: 'desc',
    },
  });

  console.log(`✅ [InscriptionsQueries] ${inscriptions.length} inscriptions pour utilisateur ${utilisateurId}`);

  return inscriptions as Inscription[];
}

/**
 * Obtient les inscriptions pour un cours
 */
export async function obtenirInscriptionsParCours(coursId: number, prisma = defaultPrisma): Promise<Inscription[]> {
  console.log(`📋 [InscriptionsQueries] Récupération inscriptions cours ${coursId}`);

  const inscriptions = await prisma.inscriptions.findMany({
    where: { cours_id: coursId },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
    orderBy: {
      date_inscription: 'asc',
    },
  });

  console.log(`✅ [InscriptionsQueries] ${inscriptions.length} inscriptions pour cours ${coursId}`);

  return inscriptions.map((i: any) => ({
    ...i,
    utilisateur: i.users,
  })) as Inscription[];
}

/**
 * Obtient les inscriptions actives
 */
export async function obtenirInscriptionsActives(prisma = defaultPrisma): Promise<Inscription[]> {
  console.log('📋 [InscriptionsQueries] Récupération inscriptions actives');

  const inscriptions = await prisma.inscriptions.findMany({
    where: { status_id: true },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      cours: {
        select: {
          id: true,
          date_cours: true,
          type_cours: true,
          heure_debut: true,
          heure_fin: true,
        },
      },
    },
    orderBy: {
      date_inscription: 'desc',
    },
  });

  console.log(`✅ [InscriptionsQueries] ${inscriptions.length} inscriptions actives`);

  return inscriptions.map((i: any) => ({
    ...i,
    utilisateur: i.users,
  })) as Inscription[];
}
