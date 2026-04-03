/**
 * Requête pour obtenir tous les paiements avec filtres et pagination
 */

export interface ObtenirPaiementsArgs {
  utilisateurId?: number;
  statut?: string;
  dateDebut?: Date;
  dateFin?: Date;
  methodePaiement?: string;
  abonnementId?: number;
  limit?: number;
  offset?: number;
}

export async function obtenirPaiements(prisma: any, args: ObtenirPaiementsArgs) {
  const {
    utilisateurId,
    statut,
    dateDebut,
    dateFin,
    methodePaiement,
    abonnementId,
    limit = 50,
    offset = 0
  } = args;

  const where: any = {};

  if (utilisateurId) {
    where.utilisateur_id = utilisateurId;
  }

  if (statut) {
    where.statut = statut;
  }

  if (methodePaiement) {
    where.methode_paiement = methodePaiement;
  }

  if (abonnementId) {
    where.abonnement_id = abonnementId;
  }

  if (dateDebut || dateFin) {
    where.date_paiement = {};
    if (dateDebut) {
      where.date_paiement.gte = dateDebut;
    }
    if (dateFin) {
      where.date_paiement.lte = dateFin;
    }
  }

  const [paiements, total] = await Promise.all([
    prisma.paiements.findMany({
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
        commandes: {
          select: {
            id: true,
            numero_commande: true,
            montant_total: true,
            statut: true
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
        date_paiement: 'desc'
      },
      take: limit,
      skip: offset
    }),
    prisma.paiements.count({ where })
  ]);

  return {
    paiements: paiements.map((p: any) => ({
      id: p.id,
      commande_id: p.commande_id,
      utilisateur_id: p.utilisateur_id,
      montant: Number(p.montant),
      methode_paiement: p.methode_paiement,
      stripe_payment_intent_id: p.stripe_payment_intent_id,
      paypal_order_id: p.paypal_order_id,
      bitcoin_address: p.bitcoin_address,
      date_paiement: p.date_paiement,
      statut: p.statut,
      description: p.description,
      date_confirmation: p.date_confirmation,
      date_modification: p.date_modification,
      abonnement_id: p.abonnement_id,
      periode_debut: p.periode_debut,
      periode_fin: p.periode_fin,
      utilisateur: p.utilisateurs ? {
        id: p.utilisateurs.id,
        nom: p.utilisateurs.nom,
        prenom: p.utilisateurs.prenom,
        email: p.utilisateurs.email
      } : undefined,
      commande: p.commandes ? {
        id: p.commandes.id,
        numero_commande: p.commandes.numero_commande,
        montant_total: Number(p.commandes.montant_total),
        statut: p.commandes.statut
      } : undefined,
      abonnement: p.plans_tarifaires ? {
        id: p.plans_tarifaires.id,
        nom: p.plans_tarifaires.nom,
        montant: Number(p.plans_tarifaires.montant),
        frequence: p.plans_tarifaires.frequence
      } : undefined
    })),
    total,
    hasMore: offset + paiements.length < total
  };
}
