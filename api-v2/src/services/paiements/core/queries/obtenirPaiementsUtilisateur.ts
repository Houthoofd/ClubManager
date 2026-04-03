/**
 * Requête pour obtenir les paiements d'un utilisateur
 */

export interface ObtenirPaiementsUtilisateurArgs {
  utilisateurId: number;
  statut?: string;
  limit?: number;
  offset?: number;
}

export async function obtenirPaiementsUtilisateur(prisma: any, args: ObtenirPaiementsUtilisateurArgs) {
  const { utilisateurId, statut, limit = 50, offset = 0 } = args;

  const where: any = {
    utilisateur_id: utilisateurId
  };

  if (statut) {
    where.statut = statut;
  }

  const [paiements, total] = await Promise.all([
    prisma.paiements.findMany({
      where,
      include: {
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
