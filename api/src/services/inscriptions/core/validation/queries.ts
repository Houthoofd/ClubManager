/**
 * Queries pour le domaine Validation des inscriptions
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { InscriptionValidation } from '@clubmanager/types';

/**
 * Vérifie si un utilisateur peut s'inscrire à un cours
 */
export async function verifierDisponibiliteInscription(
  utilisateurId: number,
  coursId: number,
  prisma = defaultPrisma
): Promise<InscriptionValidation> {
  console.log(`🔍 [ValidationQueries] Vérification disponibilité cours ${coursId} pour utilisateur ${utilisateurId}`);

  // Vérifier si déjà inscrit
  const inscriptionExistante = await prisma.inscriptions.findFirst({
    where: {
      utilisateur_id: utilisateurId,
      cours_id: coursId,
    },
  });

  if (inscriptionExistante) {
    console.log('❌ [ValidationQueries] Utilisateur déjà inscrit');
    return {
      disponible: false,
      raison: 'Vous êtes déjà inscrit à ce cours',
    };
  }

  // Récupérer les informations du cours
  const cours = await prisma.cours.findUnique({
    where: { id: coursId },
  });

  if (!cours) {
    console.log('❌ [ValidationQueries] Cours non trouvé');
    return {
      disponible: false,
      raison: 'Ce cours n\'existe pas',
    };
  }

  // Vérifier les conflits d'horaires
  const conflits = await prisma.inscriptions.findMany({
    where: {
      utilisateur_id: utilisateurId,
      cours: {
        date_cours: cours.date_cours,
        OR: [
          {
            AND: [
              { heure_debut: { lte: cours.heure_debut } },
              { heure_fin: { gt: cours.heure_debut } },
            ],
          },
          {
            AND: [
              { heure_debut: { lt: cours.heure_fin } },
              { heure_fin: { gte: cours.heure_fin } },
            ],
          },
          {
            AND: [
              { heure_debut: { gte: cours.heure_debut } },
              { heure_fin: { lte: cours.heure_fin } },
            ],
          },
        ],
      },
    },
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
  });

  if (conflits.length > 0) {
    console.log(`⚠️ [ValidationQueries] ${conflits.length} conflit(s) détecté(s)`);
    return {
      disponible: false,
      raison: 'Conflit d\'horaire avec un autre cours',
      conflits: conflits.map((c: any) => c.cours),
    };
  }

  console.log('✅ [ValidationQueries] Inscription disponible');
  return {
    disponible: true,
  };
}

/**
 * Compte le nombre d'inscriptions pour un cours
 */
export async function compterInscriptionsCours(coursId: number, prisma = defaultPrisma): Promise<number> {
  console.log(`🔢 [ValidationQueries] Comptage inscriptions cours ${coursId}`);

  const count = await prisma.inscriptions.count({
    where: {
      cours_id: coursId,
      status_id: true,
    },
  });

  console.log(`✅ [ValidationQueries] ${count} inscriptions actives`);
  return count;
}

/**
 * Vérifie si un cours est complet (optionnel, si capacité max existe)
 */
export async function verifierCoursComplet(coursId: number, prisma = defaultPrisma): Promise<boolean> {
  console.log(`🔍 [ValidationQueries] Vérification si cours ${coursId} est complet`);

  // Pour l'instant, on retourne toujours false car pas de capacité max dans le schéma
  // À implémenter si on ajoute un champ capacite_max dans la table cours
  const count = await compterInscriptionsCours(coursId, prisma);
  
  // Exemple: capacité max de 20 personnes (à adapter selon vos besoins)
  const CAPACITE_MAX = 20;
  const estComplet = count >= CAPACITE_MAX;

  console.log(`${estComplet ? '❌' : '✅'} [ValidationQueries] Cours ${estComplet ? 'complet' : 'disponible'} (${count}/${CAPACITE_MAX})`);
  
  return estComplet;
}
