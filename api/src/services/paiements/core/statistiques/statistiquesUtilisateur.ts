/**
 * Obtenir les statistiques des paiements d'un utilisateur
 */

export interface StatistiquesUtilisateurArgs {
  utilisateurId: number;
}

export async function statistiquesUtilisateur(prisma: any, args: StatistiquesUtilisateurArgs) {
  const { utilisateurId } = args;

  // Obtenir tous les paiements de l'utilisateur
  const paiements = await prisma.paiements.findMany({
    where: {
      utilisateur_id: utilisateurId
    },
    select: {
      montant: true,
      statut: true,
      date_paiement: true
    },
    orderBy: {
      date_paiement: 'desc'
    }
  });

  const totalPaiements = paiements.length;
  const montantTotal = paiements.reduce((sum: number, p: any) => sum + Number(p.montant), 0);
  const moyenneMontant = totalPaiements > 0 ? montantTotal / totalPaiements : 0;
  const dernierPaiement = paiements.length > 0 ? paiements[0].date_paiement : null;

  // Compter les échéances en retard
  const now = new Date();
  const echeancesEnRetard = await prisma.echeances_paiements.count({
    where: {
      utilisateur_id: utilisateurId,
      statut: 'échu',
      date_echeance: {
        lt: now
      }
    }
  });

  return {
    utilisateurId,
    totalPaiements,
    montantTotal,
    dernierPaiement,
    paiementsEnRetard: echeancesEnRetard,
    moyenneMontant
  };
}
