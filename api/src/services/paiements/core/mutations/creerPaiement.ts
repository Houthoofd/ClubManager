/**
 * Mutation pour créer un nouveau paiement
 */

import { PaiementsError } from '@clubmanager/types';

export interface CreerPaiementArgs {
  commandeId?: number;
  utilisateurId: number;
  montant: number;
  methodePaiement?: string;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  bitcoinAddress?: string;
  datePaiement: Date;
  description?: string;
  abonnementId?: number;
  periodeDebut?: Date;
  periodeFin?: Date;
}

export async function creerPaiement(prisma: any, args: CreerPaiementArgs) {
  const {
    commandeId,
    utilisateurId,
    montant,
    methodePaiement,
    stripePaymentIntentId,
    paypalOrderId,
    bitcoinAddress,
    datePaiement,
    description,
    abonnementId,
    periodeDebut,
    periodeFin
  } = args;

  // Validation: vérifier que l'utilisateur existe
  const utilisateur = await prisma.utilisateurs.findUnique({
    where: { id: utilisateurId }
  });

  if (!utilisateur) {
    throw new PaiementsError('Utilisateur introuvable', 'UTILISATEUR_INTROUVABLE');
  }

  // Validation: vérifier la commande si fournie
  if (commandeId) {
    const commande = await prisma.commandes.findUnique({
      where: { id: commandeId }
    });

    if (!commande) {
      throw new PaiementsError('Commande introuvable', 'COMMANDE_INTROUVABLE');
    }
  }

  // Validation: vérifier l'abonnement si fourni
  if (abonnementId) {
    const abonnement = await prisma.plans_tarifaires.findUnique({
      where: { id: abonnementId }
    });

    if (!abonnement) {
      throw new PaiementsError('Abonnement introuvable', 'ABONNEMENT_INTROUVABLE');
    }

    // Vérifier qu'il n'existe pas déjà un paiement pour cette période
    if (periodeDebut) {
      const paiementExistant = await prisma.paiements.findFirst({
        where: {
          utilisateur_id: utilisateurId,
          abonnement_id: abonnementId,
          periode_debut: periodeDebut
        }
      });

      if (paiementExistant) {
        throw new PaiementsError('Un paiement existe déjà pour cette période', 'PAIEMENT_EXISTANT');
      }
    }
  }

  // Validation du montant
  if (montant <= 0 || montant > 999999.99) {
    throw new PaiementsError('Montant invalide', 'MONTANT_INVALIDE');
  }

  // Créer le paiement
  const paiement = await prisma.paiements.create({
    data: {
      commande_id: commandeId,
      utilisateur_id: utilisateurId,
      montant,
      methode_paiement: methodePaiement,
      stripe_payment_intent_id: stripePaymentIntentId,
      paypal_order_id: paypalOrderId,
      bitcoin_address: bitcoinAddress,
      date_paiement: datePaiement,
      statut: 'en attente',
      description,
      date_confirmation: null,
      date_modification: new Date(),
      abonnement_id: abonnementId,
      periode_debut: periodeDebut,
      periode_fin: periodeFin
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
