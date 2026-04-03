/**
 * Obtenir les statistiques générales des paiements
 */

export interface StatistiquesGeneralesArgs {
  dateDebut?: Date;
  dateFin?: Date;
}

export async function statistiquesGenerales(prisma: any, args: StatistiquesGeneralesArgs = {}) {
  const { dateDebut, dateFin } = args;

  const where: any = {};

  if (dateDebut || dateFin) {
    where.date_paiement = {};
    if (dateDebut) {
      where.date_paiement.gte = dateDebut;
    }
    if (dateFin) {
      where.date_paiement.lte = dateFin;
    }
  }

  // Obtenir tous les paiements pour les calculs
  const paiements = await prisma.paiements.findMany({
    where,
    select: {
      montant: true,
      statut: true,
      methode_paiement: true,
      date_paiement: true
    }
  });

  const totalPaiements = paiements.length;
  const montantTotal = paiements.reduce((sum: number, p: any) => sum + Number(p.montant), 0);

  // Comptage par statut
  const paiementsValides = paiements.filter((p: any) => p.statut === 'validé').length;
  const paiementsEnAttente = paiements.filter((p: any) => p.statut === 'en attente').length;
  const paiementsRefuses = paiements.filter((p: any) => p.statut === 'refusé').length;
  const paiementsRembourses = paiements.filter((p: any) => p.statut === 'remboursé').length;
  const paiementsAnnules = paiements.filter((p: any) => p.statut === 'annulé').length;

  const moyenneMontant = totalPaiements > 0 ? montantTotal / totalPaiements : 0;

  // Montant par mois
  const montantParMois: Map<string, { montant: number; count: number }> = new Map();
  paiements.forEach((p: any) => {
    const date = new Date(p.date_paiement);
    const mois = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = montantParMois.get(mois) || { montant: 0, count: 0 };
    montantParMois.set(mois, {
      montant: current.montant + Number(p.montant),
      count: current.count + 1
    });
  });

  // Répartition par méthode de paiement
  const repartitionMethodes: Map<string, { count: number; montantTotal: number }> = new Map();
  paiements.forEach((p: any) => {
    if (p.methode_paiement) {
      const current = repartitionMethodes.get(p.methode_paiement) || { count: 0, montantTotal: 0 };
      repartitionMethodes.set(p.methode_paiement, {
        count: current.count + 1,
        montantTotal: current.montantTotal + Number(p.montant)
      });
    }
  });

  return {
    totalPaiements,
    montantTotal,
    paiementsValides,
    paiementsEnAttente,
    paiementsRefuses,
    paiementsRembourses,
    paiementsAnnules,
    moyenneMontant,
    montantParMois: Array.from(montantParMois.entries()).map(([mois, data]) => ({
      mois,
      montant: data.montant,
      count: data.count
    })),
    repartitionMethodes: Array.from(repartitionMethodes.entries()).map(([methode, data]) => ({
      methode: methode as any, // Cast to match MethodePaiement enum
      count: data.count,
      montantTotal: data.montantTotal
    }))
  };
}
