/**
 * Mutation pour ajouter un ou plusieurs professeurs
 */

import { ProfesseursError } from '@clubmanager/types';

export interface AjouterProfesseurArgs {
  utilisateurs: Array<number | { id: number }>;
}

export async function ajouterProfesseur(prisma: any, args: AjouterProfesseurArgs) {
  const { utilisateurs } = args;

  // Normaliser les utilisateurs en tableau d'IDs
  let userIds: number[] = [];
  if (Array.isArray(utilisateurs)) {
    userIds = utilisateurs.map((u: any) =>
      typeof u === 'object' ? u.id : Number(u)
    );
  }

  if (userIds.length === 0) {
    throw new ProfesseursError('Aucun utilisateur fourni', 'AUCUN_UTILISATEUR');
  }

  const results = {
    success: true,
    message: '',
    professeurs: [] as any[],
    errors: [] as string[]
  };

  // Traiter chaque utilisateur
  for (const userId of userIds) {
    try {
      // Vérifier que l'utilisateur existe
      const utilisateur = await prisma.utilisateurs.findUnique({
        where: { id: userId },
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

      if (!utilisateur) {
        results.errors.push(`Utilisateur ID ${userId} non trouvé`);
        continue;
      }

      // Vérifier si déjà professeur
      if (utilisateur.status_id === 5) {
        results.professeurs.push({
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          nom_utilisateur: utilisateur.nom_utilisateur,
          email: utilisateur.email,
          genre_id: utilisateur.genre_id,
          date_naissance: utilisateur.date_naissance,
          grade_id: utilisateur.grade_id,
          status_id: utilisateur.status_id
        });
        continue;
      }

      // Promouvoir en professeur (status_id = 5)
      const professeur = await prisma.utilisateurs.update({
        where: { id: userId },
        data: { status_id: 5 },
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

      results.professeurs.push({
        id: professeur.id,
        nom: professeur.nom,
        prenom: professeur.prenom,
        nom_utilisateur: professeur.nom_utilisateur,
        email: professeur.email,
        genre_id: professeur.genre_id,
        date_naissance: professeur.date_naissance,
        grade_id: professeur.grade_id,
        status_id: professeur.status_id
      });

    } catch (error) {
      results.errors.push(`Erreur pour utilisateur ID ${userId}: ${error}`);
    }
  }

  // Déterminer le message final
  if (results.errors.length === 0) {
    results.message = `Tous les utilisateurs ont été promus professeurs (${results.professeurs.length})`;
  } else if (results.professeurs.length > 0) {
    results.message = `Promotion partielle: ${results.professeurs.length} réussis, ${results.errors.length} erreurs`;
    results.success = true;
  } else {
    results.message = `Aucune promotion. Erreurs: ${results.errors.join('; ')}`;
    results.success = false;
  }

  return {
    success: results.success,
    message: results.message,
    professeurs: results.professeurs
  };
}
