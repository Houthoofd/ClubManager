/**
 * Requête pour obtenir un paiement par son ID
 */

export interface ObtenirPaiementParIdArgs {
  id: number;
}

export async function obtenirPaiementParId(prisma: any, args: ObtenirPaiementParIdArgs) {
  const { id } = args;

  const paiement = await prisma.paiements.findUnique({
    where: { id },
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
    }
  });

  if (!paiement) {
    return null;
  }

  return {
    id: paiement.id,
    commande_id: paiement.commande_id,
    utilisateur_id: paiement.utilisateur_id,
    montant: Number(paiement.montant),
    methode_paiement: paiement.methode_paiement,
    stripe_payment_intent_id: paiement.stripe_payment_intent_id,
    paypal_order_id: paiement.paypal_order_id,
    bitcoin_address: paiement.bitcoin_address,
    date_paiement: paiement.date_paiement,
    statut: paiement.statut,
    description: paiement.description,
    date_confirmation: paiement.date_confirmation,
    date_modification: paiement.date_modification,
    abonnement_id: paiement.abonnement_id,
    periode_debut: paiement.periode_debut,
    periode_fin: paiement.periode_fin,
    utilisateur: paiement.utilisateurs ? {
      id: paiement.utilisateurs.id,
      nom: paiement.utilisateurs.nom,
      prenom: paiement.utilisateurs.prenom,
      email: paiement.utilisateurs.email
    } : undefined,
    commande: paiement.commandes ? {
      id: paiement.commandes.id,
      numero_commande: paiement.commandes.numero_commande,
      montant_total: Number(paiement.commandes.montant_total),
      statut: paiement.commandes.statut
    } : undefined,
    abonnement: paiement.plans_tarifaires ? {
      id: paiement.plans_tarifaires.id,
      nom: paiement.plans_tarifaires.nom,
      montant: Number(paiement.plans_tarifaires.montant),
      frequence: paiement.plans_tarifaires.frequence
    } : undefined
  };
}
