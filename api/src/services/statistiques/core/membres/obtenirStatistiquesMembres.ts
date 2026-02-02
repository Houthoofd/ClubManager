/**
 * Obtenir les statistiques des membres
 */

import type { StatistiquesMembres, NouveauMembre, MembresParPlan, MembreAssidu } from '@clubmanager/types';
import { StatistiquesError } from '@clubmanager/types';

export async function obtenirStatistiquesMembres(prisma: any): Promise<StatistiquesMembres> {
  try {
    const date7JoursAvant = new Date();
    date7JoursAvant.setDate(date7JoursAvant.getDate() - 7);

    // Nombre de membres actifs
    const nombreMembres = await prisma.utilisateurs.count({
      where: {
        status_id: { in: [1, 2, 3, 4, 5] }
      }
    });

    // Nouveaux membres
    const nouveauxMembresData = await prisma.utilisateurs.findMany({
      where: {
        date_inscription: { gte: date7JoursAvant }
      },
      include: {
        plans_tarifaires: {
          select: {
            nom_plan: true
          }
        }
      },
      orderBy: {
        date_inscription: 'desc'
      },
      take: 10
    });

    const nouveauxMembres: NouveauMembre[] = nouveauxMembresData.map((u: any) => ({
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      date_inscription: new Date(u.date_inscription),
      plan_name: u.plans_tarifaires?.nom_plan
    }));

    // Membres par plan
    const utilisateurs = await prisma.utilisateurs.findMany({
      where: {
        status_id: { in: [1, 2, 3, 4, 5] }
      },
      include: {
        plans_tarifaires: {
          select: {
            nom_plan: true
          }
        }
      }
    });

    const groupeParPlan = utilisateurs.reduce((acc: any, u: any) => {
      const plan = u.plans_tarifaires?.nom_plan || 'Sans plan';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});

    const membresParPlan: MembresParPlan[] = Object.entries(groupeParPlan).map(([plan, count]: [string, any]) => ({
      plan,
      value: count,
      pourcentage: nombreMembres > 0 ? (count / nombreMembres) * 100 : 0
    }));

    // Top 5 membres assidus
    const utilisateursAvecPresences = await prisma.utilisateurs.findMany({
      include: {
        inscriptions: {
          where: {
            status_id: 1
          }
        }
      }
    });

    const topMembresAssidus: MembreAssidu[] = utilisateursAvecPresences
      .map((u: any) => ({
        first_name: u.first_name,
        last_name: u.last_name,
        total_presences_validees: u.inscriptions.length
      }))
      .sort((a: any, b: any) => b.total_presences_validees - a.total_presences_validees)
      .slice(0, 5);

    return {
      nombreMembres,
      nouveauxMembres,
      membresParPlan,
      topMembresAssidus
    };
  } catch (error) {
    throw new StatistiquesError(
      `Erreur lors de la récupération des statistiques membres: ${(error as Error).message}`,
      'MEMBERS_STATS_ERROR',
      500
    );
  }
}
