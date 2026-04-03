/**
 * Requête pour obtenir le planning des cours d'un professeur
 */

import { ProfesseursError } from '@clubmanager/types';

export interface ObtenirPlanningProfesseurArgs {
  professeurId: number;
}

export async function obtenirPlanningProfesseur(prisma: any, args: ObtenirPlanningProfesseurArgs) {
  const { professeurId } = args;

  // Vérifier que le professeur existe
  const professeur = await prisma.utilisateurs.findFirst({
    where: {
      id: professeurId,
      status_id: 5
    }
  });

  if (!professeur) {
    throw new ProfesseursError('Professeur introuvable', 'PROFESSEUR_INTROUVABLE');
  }

  // Note: Cette requête dépend de votre structure de base de données
  // Adaptez selon vos tables de liaison cours/professeurs
  // Exemple basique si vous avez une table cours_recurrent_professeur

  const planning = await prisma.$queryRaw`
    SELECT
      cr.id AS cours_recurrent_id,
      cr.type_cours,
      cr.jour_semaine,
      cr.heure_debut,
      cr.heure_fin,
      cr.active AS est_recurrent_actif,
      u.id AS professeur_id,
      u.nom AS professeur_nom,
      u.prenom AS professeur_prenom
    FROM
      cours_recurrent cr
    JOIN
      cours_recurrent_professeur crp ON cr.id = crp.cours_recurrent_id
    JOIN
      utilisateurs u ON u.id = ${professeurId}
    WHERE
      u.status_id = 5
      AND crp.professeur_id = (
        SELECT p.id
        FROM professeurs p
        JOIN utilisateurs u2 ON p.nom = u2.nom AND p.prenom = u2.prenom
        WHERE u2.id = ${professeurId}
        LIMIT 1
      )
    ORDER BY
      cr.jour_semaine, cr.heure_debut
  `;

  return {
    planning: planning.map((p: any) => ({
      cours_recurrent_id: p.cours_recurrent_id,
      type_cours: p.type_cours,
      jour_semaine: p.jour_semaine,
      heure_debut: p.heure_debut,
      heure_fin: p.heure_fin,
      est_recurrent_actif: Boolean(p.est_recurrent_actif),
      professeur_id: p.professeur_id,
      professeur_nom: p.professeur_nom,
      professeur_prenom: p.professeur_prenom
    })),
    total: planning.length
  };
}
