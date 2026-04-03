/**
 * Requête pour obtenir un professeur par son ID
 */

import { ProfesseursError } from '@clubmanager/types';

export interface ObtenirProfesseurParIdArgs {
  id: number;
}

export async function obtenirProfesseurParId(prisma: any, args: ObtenirProfesseurParIdArgs) {
  const { id } = args;

  const professeur = await prisma.utilisateurs.findFirst({
    where: {
      id,
      status_id: 5 // Professeurs uniquement
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      nom_utilisateur: true,
      email: true,
      genre_id: true,
      date_naissance: true,
      grade_id: true,
      status_id: true
    }
  });

  if (!professeur) {
    return null;
  }

  return {
    id: professeur.id,
    nom: professeur.nom,
    prenom: professeur.prenom,
    nom_utilisateur: professeur.nom_utilisateur,
    email: professeur.email,
    genre_id: professeur.genre_id,
    date_naissance: professeur.date_naissance,
    grade_id: professeur.grade_id,
    status_id: professeur.status_id
  };
}
