/**
 * Obtenir les statistiques financières complètes
 */

import type { StatistiquesFinancieres, PaiementParMois, DernierPaiement, PaiementEchu } from '@clubmanager/types';
import { StatistiquesError } from '@clubmanager/types';

export async function obtenirStatistiquesFinancieres(prisma: any): Promise<StatistiquesFinancieres> {
  try {
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const date7JoursAvant = new Date();
    date7JoursAvant.setDate(date7JoursAvant.getDate() - 7);
    const date12MoisAvant = new Date();
    date12MoisAvant.setMonth(date12MoisAvant.getMonth() - 12);

    // Total paiements du mois avec somme
    const paiementsMois = await prisma.paiements.findMany({
      where: {
        date_paiement: { gte: debutMois },
        statut: { in: ['validé', 'confirmé'] }
      },
      select: { montant: true }
    });
    const totalPaiementsMois = paiementsMois.reduce((sum: number, p: any) => sum + Number(p.montant), 0);

    // Paiements récents (7 derniers jours)
    const paiementsRecents = await prisma.paiements.count({
      where: {
        date_paiement: { gte: date7JoursAvant },
        statut: { in: ['validé', 'confirmé'] }
      }
    });

    // Paiements en attente
    const paiementsEnAttente = await prisma.paiements.count({
      where: { statut: 'en_attente' }
    });

    // Taux de renouvellement
    const [totalActifs, totalValides] = await Promise.all([
      prisma.paiements.count({
        where: { periode_fin: { gte: maintenant } }
      }),
      prisma.paiements.count({
        where: {
          statut: { in: ['validé', 'confirmé'] },
          periode_fin: { gte: maintenant }
        }
      })
    ]);
    const tauxRenouvellement = totalActifs > 0 ? (totalValides / totalActifs) * 100 : 0;

    // Paiements par mois (12 derniers mois)
    const paiements12Mois = await prisma.paiements.findMany({
      where: {
        date_paiement: { gte: date12MoisAvant },
        statut: { in: ['validé', 'confirmé'] }
      },
      select: {
        montant: true,
        date_paiement: true
      },
      orderBy: { date_paiement: 'desc' }
    });

    const groupeParMois = paiements12Mois.reduce((acc: any, p: any) => {
      const date = new Date(p.date_paiement);
      const mois = date.toLocaleString('fr-FR', { month: 'short' });
      if (!acc[mois]) {
        acc[mois] = 0;
      }
      acc[mois] += Number(p.montant);
      return acc;
    }, {});

    const paiementsParMois: PaiementParMois[] = Object.entries(groupeParMois)
      .map(([mois, total]: [string, any]) => ({ mois, total }))
      .slice(0, 12);

    // Derniers paiements
    const derniersPaiementsData = await prisma.paiements.findMany({
      where: {
        statut: { in: ['validé', 'confirmé'] }
      },
      include: {
        utilisateurs: {
          select: {
            first_name: true,
            last_name: true,
            nom_utilisateur: true
          }
        }
      },
      orderBy: { date_paiement: 'desc' },
      take: 10
    });

    const derniersPaiements: DernierPaiement[] = derniersPaiementsData.map((p: any) => ({
      montant: Number(p.montant),
      date_paiement: new Date(p.date_paiement),
      statut: p.statut,
      first_name: p.utilisateurs.first_name,
      last_name: p.utilisateurs.last_name,
      nom_utilisateur: p.utilisateurs.nom_utilisateur
    }));

    // Paiements échus
    const paiementsEchusData = await prisma.echeances_paiements.findMany({
      where: {
        date_echeance: { lt: maintenant },
        statut: { in: ['en attente', 'échu'] }
      },
      include: {
        utilisateurs: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            nom_utilisateur: true
          }
        }
      },
      orderBy: { date_echeance: 'desc' },
      take: 10
    });

    const paiementsEchus: PaiementEchu[] = paiementsEchusData.map((ep: any) => ({
      montant: Number(ep.montant),
      date_echeance: new Date(ep.date_echeance),
      statut: ep.statut,
      first_name: ep.utilisateurs.first_name,
      last_name: ep.utilisateurs.last_name,
      nom_utilisateur: ep.utilisateurs.nom_utilisateur,
      utilisateur_id: ep.utilisateurs.id
    }));

    return {
      totalPaiementsMois,
      paiementsRecents,
      paiementsEnAttente,
      tauxRenouvellement,
      paiementsParMois,
      derniersPaiements,
      paiementsEchus
    };
  } catch (error) {
    throw new StatistiquesError(
      `Erreur lors de la récupération des statistiques financières: ${(error as Error).message}`,
      'FINANCIAL_STATS_ERROR',
      500
    );
  }
}
