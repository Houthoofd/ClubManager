/**
 * Obtenir les statistiques des paiements par période
 */

export interface StatistiquesParPeriodeArgs {
  dateDebut: Date;
  dateFin: Date;
  groupBy?: 'jour' | 'semaine' | 'mois';
}

export async function statistiquesParPeriode(prisma: any, args: StatistiquesParPeriodeArgs) {
  const { dateDebut, dateFin, groupBy = 'mois' } = args;

  const paiements = await prisma.paiements.findMany({
    where: {
      date_paiement: {
        gte: dateDebut,
        lte: dateFin
      }
    },
    select: {
      montant: true,
      statut: true,
      date_paiement: true,
      methode_paiement: true
    }
  });

  // Grouper par période
  const groupedData: Map<string, {
    montant: number;
    count: number;
    valides: number;
    enAttente: number;
    refuses: number;
  }> = new Map();

  paiements.forEach((p: any) => {
    const date = new Date(p.date_paiement);
    let key: string;

    switch (groupBy) {
      case 'jour':
        key = date.toISOString().split('T')[0];
        break;
      case 'semaine':
        const weekNumber = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
        key = `${date.getFullYear()}-S${weekNumber}`;
        break;
      case 'mois':
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    const current = groupedData.get(key) || {
      montant: 0,
      count: 0,
      valides: 0,
      enAttente: 0,
      refuses: 0
    };

    current.montant += Number(p.montant);
    current.count += 1;
    
    if (p.statut === 'validé') current.valides += 1;
    else if (p.statut === 'en attente') current.enAttente += 1;
    else if (p.statut === 'refusé') current.refuses += 1;

    groupedData.set(key, current);
  });

  return {
    periode: {
      debut: dateDebut,
      fin: dateFin,
      groupBy
    },
    donnees: Array.from(groupedData.entries()).map(([periode, stats]) => ({
      periode,
      montantTotal: stats.montant,
      nombrePaiements: stats.count,
      paiementsValides: stats.valides,
      paiementsEnAttente: stats.enAttente,
      paiementsRefuses: stats.refuses,
      moyenneMontant: stats.count > 0 ? stats.montant / stats.count : 0
    })).sort((a, b) => a.periode.localeCompare(b.periode))
  };
}
