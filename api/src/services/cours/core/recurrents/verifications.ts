/**
 * Vérifications pour les cours récurrents
 * Gère les conflits horaires et la capacité des cours
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';

/**
 * Normalise une chaîne de caractères (enlève les accents et met en minuscules)
 */
const normalizeString = (str: string): string =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Mapping des jours de la semaine
 */
const JOURS_SEMAINE: Record<string, number> = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 7,
};

/**
 * Vérifie si un cours existe déjà dans le planning (conflit horaire)
 */
export async function verifierConflitHoraire(params: {
  jour: string;
  heureDebut: string;
  heureFin: string;
  typeCours?: string;
  excludeOriginal?: {
    jour: string;
    type: string;
    heureDebut: string;
    heureFin: string;
  };
}): Promise<{ exists: boolean; message: string; coursConflict?: any }> {
  const { jour, heureDebut, heureFin, typeCours, excludeOriginal } = params;

  // Convertir le jour en numéro
  const jourNum = JOURS_SEMAINE[normalizeString(jour)];
  if (!jourNum) {
    throw new Error(`Jour invalide: ${jour}`);
  }

  // Si type_cours est 'ANY' ou vide, on ignore le type dans la vérification
  const ignoreType = !typeCours || typeCours === 'ANY';

  // Construire les conditions de recherche
  const whereConditions: any = {
    jour_semaine: jourNum,
    active: true,
    OR: [
      // Cas 1: Le nouveau cours commence pendant un cours existant
      {
        heure_debut: { lte: heureDebut },
        heure_fin: { gt: heureDebut },
      },
      // Cas 2: Le nouveau cours se termine pendant un cours existant
      {
        heure_debut: { lt: heureFin },
        heure_fin: { gte: heureFin },
      },
      // Cas 3: Le nouveau cours englobe complètement un cours existant
      {
        heure_debut: { gte: heureDebut },
        heure_fin: { lte: heureFin },
      },
    ],
  };

  // Ajouter le filtre de type si nécessaire
  if (!ignoreType && typeCours) {
    whereConditions.type_cours = typeCours;
  }

  // Exclure le cours original si en mode modification
  if (excludeOriginal) {
    const originalJourNum = JOURS_SEMAINE[normalizeString(excludeOriginal.jour)];
    const originalHeureDebut =
      excludeOriginal.heureDebut.length === 5
        ? `${excludeOriginal.heureDebut}:00`
        : excludeOriginal.heureDebut;
    const originalHeureFin =
      excludeOriginal.heureFin.length === 5
        ? `${excludeOriginal.heureFin}:00`
        : excludeOriginal.heureFin;

    whereConditions.NOT = {
      AND: [
        { jour_semaine: originalJourNum },
        { type_cours: excludeOriginal.type },
        { heure_debut: originalHeureDebut },
        { heure_fin: originalHeureFin },
      ],
    };
  }

  // Rechercher les conflits
  const coursConflict = await prisma.cours_recurrent.findFirst({
    where: whereConditions,
    select: {
      id: true,
      type_cours: true,
      heure_debut: true,
      heure_fin: true,
      jour_semaine: true,
    },
  });

  if (coursConflict) {
    return {
      exists: true,
      message: `Un cours ${coursConflict.type_cours} est déjà programmé à ce créneau horaire.`,
      coursConflict,
    };
  }

  return {
    exists: false,
    message: 'Ce créneau est disponible.',
  };
}

/**
 * Vérifie la capacité d'un cours (nombre d'inscrits vs capacité max)
 */
export async function verifierCapaciteCours(
  coursId: number
): Promise<{ capaciteAtteinte: boolean; nombreInscrits: number; capaciteMax?: number }> {
  if (!coursId || coursId <= 0) {
    throw new Error('ID de cours invalide');
  }

  // Récupérer le cours avec le nombre d'inscrits
  const cours = await prisma.cours.findUnique({
    where: { id: coursId },
    select: {
      id: true,
      capacite_max: true,
      _count: {
        select: {
          inscriptions: true,
        },
      },
    },
  });

  if (!cours) {
    return {
      capaciteAtteinte: false,
      nombreInscrits: 0,
    };
  }

  const nombreInscrits = cours._count.inscriptions;
  const capaciteMax = cours.capacite_max;

  // Vérifier si la capacité est atteinte
  const capaciteAtteinte = capaciteMax ? nombreInscrits >= capaciteMax : false;

  return {
    capaciteAtteinte,
    nombreInscrits,
    capaciteMax: capaciteMax || undefined,
  };
}

/**
 * Vérifie si un cours récurrent existe avec les critères donnés
 */
export async function verifierCoursRecurrentExiste(params: {
  jour: string;
  typeCours: string;
  heureDebut: string;
  heureFin: string;
}): Promise<{ existe: boolean; coursId?: number; message: string }> {
  const { jour, typeCours, heureDebut, heureFin } = params;

  // Convertir le jour en numéro
  const jourNum = JOURS_SEMAINE[normalizeString(jour)];
  if (!jourNum) {
    throw new Error(`Jour invalide: ${jour}`);
  }

  // Normaliser les heures (ajouter :00 si nécessaire)
  const heureDebutNormalized = heureDebut.length === 5 ? `${heureDebut}:00` : heureDebut;
  const heureFinNormalized = heureFin.length === 5 ? `${heureFin}:00` : heureFin;

  const cours = await prisma.cours_recurrent.findFirst({
    where: {
      jour_semaine: jourNum,
      type_cours: typeCours,
      heure_debut: heureDebutNormalized,
      heure_fin: heureFinNormalized,
      active: true,
    },
    select: {
      id: true,
    },
  });

  if (cours) {
    return {
      existe: true,
      coursId: cours.id,
      message: 'Un cours récurrent existe déjà avec ces critères.',
    };
  }

  return {
    existe: false,
    message: 'Aucun cours récurrent trouvé avec ces critères.',
  };
}

/**
 * Vérifie si un utilisateur peut s'inscrire à un cours
 * (vérifie la capacité et si l'utilisateur n'est pas déjà inscrit)
 */
export async function verifierInscriptionPossible(params: {
  coursId: number;
  utilisateurId: number;
}): Promise<{
  possible: boolean;
  raison?: string;
  dejaInscrit?: boolean;
  capaciteAtteinte?: boolean;
}> {
  const { coursId, utilisateurId } = params;

  // Vérifier si l'utilisateur est déjà inscrit
  const inscriptionExistante = await prisma.inscriptions.findFirst({
    where: {
      cours_id: coursId,
      utilisateur_id: utilisateurId,
    },
  });

  if (inscriptionExistante) {
    return {
      possible: false,
      raison: 'Utilisateur déjà inscrit à ce cours.',
      dejaInscrit: true,
    };
  }

  // Vérifier la capacité du cours
  const { capaciteAtteinte, nombreInscrits, capaciteMax } = await verifierCapaciteCours(coursId);

  if (capaciteAtteinte) {
    return {
      possible: false,
      raison: `Cours complet (${nombreInscrits}/${capaciteMax} inscrits).`,
      capaciteAtteinte: true,
    };
  }

  return {
    possible: true,
  };
}
