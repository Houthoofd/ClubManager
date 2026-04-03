/**
 * Mutation pour valider un paiement
 */

import { PaiementsError } from '@clubmanager/types';

export interface ValiderPaiementArgs {
  paiementId: number;
  referenceTransaction?: string;
}

export async function validerPaiement(prisma: any, args: ValiderPaiementArgs) {
  const { paiementId, referenceTransaction } = args;

  // Vérifier que le paiement existe
  const paiement = await prisma.paiements.findUnique({
    where: { id: paiementId }
  });

  if (!paiement) {
    throw new PaiementsError('Paiement introuvable', 'PAIEMENT_INTROUVABLE');
  }

  // Vérifier que le paiement est en attente
  if (paiement.statut !== 'en attente') {
    throw new PaiementsError(
      `Impossible de valider un paiement avec le statut ${paiement.statut}`,
      'STATUT_INVALIDE'
    );
  }

  // Mettre à jour le statut
  const paiementMisAJour = await prisma.paiements.update({
    where: { id: paiementId },
    data: {
      statut: 'validé',
      date_confirmation: new Date(),
      date_modification: new Date(),
      description: referenceTransaction 
        ? `${paiement.description || ''} - Ref: ${referenceTransaction}`.trim()
        : paiement.description
    },
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

  // Si le paiement est lié à une échéance, la marquer comme payée
  if (paiement.abonnement_id && paiement.periode_debut) {
    await prisma.echeances_paiements.updateMany({
      where: {
        utilisateur_id: paiement.utilisateur_id,
        abonnement_id: paiement.abonnement_id,
        date_echeance: paiement.periode_debut,
        statut: 'en attente'
      },
      data: {
        statut: 'payé',
        date_paiement: new Date()
      }
    });
  }

  return {
    id: paiementMisAJour.id,
    commande_id: paiementMisAJour.commande_id,
    utilisateur_id: paiementMisAJour.utilisateur_id,
    montant: Number(paiementMisAJour.montant),
    methode_paiement: paiementMisAJour.methode_paiement,
    stripe_payment_intent_id: paiementMisAJour.stripe_payment_intent_id,
    paypal_order_id: paiementMisAJour.paypal_order_id,
    bitcoin_address: paiementMisAJour.bitcoin_address,
    date_paiement: paiementMisAJour.date_paiement,
    statut: paiementMisAJour.statut,
    description: paiementMisAJour.description,
    date_confirmation: paiementMisAJour.date_confirmation,
    date_modification: paiementMisAJour.date_modification,
    abonnement_id: paiementMisAJour.abonnement_id,
    periode_debut: paiementMisAJour.periode_debut,
    periode_fin: paiementMisAJour.periode_fin,
    utilisateur: paiementMisAJour.utilisateurs ? {
      id: paiementMisAJour.utilisateurs.id,
      nom: paiementMisAJour.utilisateurs.nom,
      prenom: paiementMisAJour.utilisateurs.prenom,
      email: paiementMisAJour.utilisateurs.email
    } : undefined,
    commande: paiementMisAJour.commandes ? {
      id: paiementMisAJour.commandes.id,
      numero_commande: paiementMisAJour.commandes.numero_commande,
      montant_total: Number(paiementMisAJour.commandes.montant_total),
      statut: paiementMisAJour.commandes.statut
    } : undefined,
    abonnement: paiementMisAJour.plans_tarifaires ? {
      id: paiementMisAJour.plans_tarifaires.id,
      nom: paiementMisAJour.plans_tarifaires.nom,
      montant: Number(paiementMisAJour.plans_tarifaires.montant),
      frequence: paiementMisAJour.plans_tarifaires.frequence
    } : undefined
  };
}
