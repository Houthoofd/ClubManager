/**
 * Requête pour obtenir les échéances de paiement
 */

export interface ObtenirEcheancesArgs {
  utilisateurId?: number;
  abonnementId?: number;
  statut?: string;
  dateDebut?: Date;
  dateFin?: Date;
  limit?: number;
  offset?: number;
}

export async function obtenirEcheances(prisma: any, args: ObtenirEcheancesArgs) {
  const {
    utilisateurId,
    abonnementId,
    statut,
    dateDebut,
    dateFin,
    limit = 50,
    offset = 0
  } = args;

  const where: any = {};

  if (utilisateurId) {
    where.utilisateur_id = utilisateurId;
  }

  if (abonnementId) {
    where.abonnement_id = abonnementId;
  }

  if (statut) {
    where.statut = statut;
  }

  if (dateDebut || dateFin) {
    where.date_echeance = {};
    if (dateDebut) {
      where.date_echeance.gte = dateDebut;
    }
    if (dateFin) {
      where.date_echeance.lte = dateFin;
    }
  }

  const [echeances, total] = await Promise.all([
    prisma.echeances_paiements.findMany({
      where,
      include: {
        utilisateurs: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        plans_tarifaires: {
          select: {
            id: true,
            nom: true,
            montant: true,
            frequence: true
          }
        }
      },
      orderBy: {
        date_echeance: 'asc'
      },
      take: limit,
      skip: offset
    }),
    prisma.echeances_paiements.count({ where })
  ]);

  return {
    echeances: echeances.map((e: any) => ({
      id: e.id,
      utilisateur_id: e.utilisateur_id,
      abonnement_id: e.abonnement_id,
      date_echeance: e.date_echeance,
      montant: Number(e.montant),
      statut: e.statut,
      date_paiement: e.date_paiement,
      utilisateur: e.utilisateurs ? {
        id: e.utilisateurs.id,
        nom: e.utilisateurs.nom,
        prenom: e.utilisateurs.prenom,
        email: e.utilisateurs.email
      } : undefined,
      abonnement: e.plans_tarifaires ? {
        id: e.plans_tarifaires.id,
        nom: e.plans_tarifaires.nom,
        montant: Number(e.plans_tarifaires.montant),
        frequence: e.plans_tarifaires.frequence
      } : undefined
    })),
    total,
    hasMore: offset + echeances.length < total
  };
}
