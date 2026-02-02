/**
 * Mutation pour modifier le statut d'un professeur
 */

import { ProfesseursError } from "@clubmanager/types";

export interface ModifierStatutProfesseurArgs {
  id: number;
  status_id: number;
}

export async function modifierStatutProfesseur(
  prisma: any,
  args: ModifierStatutProfesseurArgs,
) {
  const { id, status_id } = args;

  // Vérifier que le professeur existe
  const professeur = await prisma.utilisateurs.findFirst({
    where: {
      id,
      status_id: 5, // Doit être professeur
    },
  });

  if (!professeur) {
    throw new ProfesseursError(
      "Professeur introuvable",
      "PROFESSEUR_INTROUVABLE",
    );
  }

  // Empêcher la promotion en professeur via cette méthode
  // La promotion doit passer par ajouterProfesseur
  if (status_id === 5 && professeur.status_id !== 5) {
    throw new ProfesseursError(
      "Utilisez ajouterProfesseur pour promouvoir un utilisateur en professeur",
      "PROMOTION_INTERDITE",
    );
  }

  // Valider le nouveau statut
  if (status_id < 1 || status_id > 10) {
    throw new ProfesseursError("Statut invalide", "STATUT_INVALIDE");
  }

  // Mettre à jour le statut
  const professeurMisAJour = await prisma.utilisateurs.update({
    where: { id },
    data: { status_id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      nom_utilisateur: true,
      email: true,
      genre_id: true,
      date_naissance: true,
      grade_id: true,
      status_id: true,
    },
  });

  return {
    id: professeurMisAJour.id,
    nom: professeurMisAJour.nom,
    prenom: professeurMisAJour.prenom,
    nom_utilisateur: professeurMisAJour.nom_utilisateur,
    email: professeurMisAJour.email,
    genre_id: professeurMisAJour.genre_id,
    date_naissance: professeurMisAJour.date_naissance,
    grade_id: professeurMisAJour.grade_id,
    status_id: professeurMisAJour.status_id,
  };
}
