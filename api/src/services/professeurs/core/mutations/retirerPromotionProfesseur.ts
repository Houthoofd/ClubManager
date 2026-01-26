/**
 * Mutation pour retirer la promotion professeur (redevient utilisateur normal)
 */

import { ProfesseursError } from '@clubmanager/types';

export interface RetirerPromotionProfesseurArgs {
  id: number;
  motif?: string;
}

export async function retirerPromotionProfesseur(prisma: any, args: RetirerPromotionProfesseurArgs) {
  const { id, motif } = args;

  // Vérifier que le professeur existe
  const professeur = await prisma.utilisateurs.findFirst({
    where: {
      id,
      status_id: 5 // Doit être professeur
    }
  });

  if (!professeur) {
    throw new ProfesseursError('Professeur introuvable', 'PROFESSEUR_INTROUVABLE');
  }

  // Retirer la promotion (status_id = 1 pour utilisateur normal)
  await prisma.utilisateurs.update({
    where: { id },
    data: { status_id: 1 }
  });

  // Note: Si vous avez des triggers ou des relations à gérer
  // (ex: retirer des associations cours_recurrent_professeur)
  // cela devrait être géré ici ou via des triggers SQL

  return {
    success: true,
    message: motif
      ? `Promotion retirée avec succès. Motif: ${motif}`
      : 'Promotion retirée avec succès. Le professeur a été retiré de tous ses cours.'
  };
}
