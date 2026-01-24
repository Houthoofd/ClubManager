/**
 * Détection automatique des alertes
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';
import type { AlerteResult } from '@clubmanager/types';

/**
 * Crée une alerte si elle n'existe pas déjà
 */
async function creerAlerteIfNotExists(
  utilisateurId: number,
  alerteTypeId: number,
  contexte: any
): Promise<void> {
  const exists = await prisma.alertes_utilisateurs.findFirst({
    where: {
      utilisateur_id: utilisateurId,
      alerte_type_id: alerteTypeId,
      statut: 'active',
    },
  });

  if (!exists) {
    await prisma.alertes_utilisateurs.create({
      data: {
        utilisateur_id: utilisateurId,
        alerte_type_id: alerteTypeId,
        donnees_contexte: contexte,
        statut: 'active',
      },
    });
  }
}

/**
 * Détecte et crée automatiquement les alertes basées sur les règles métier
 */
export async function detecterAlertes(): Promise<AlerteResult> {
  console.log('🔍 [AlertesDetection] Détection des alertes');

  let alertesCreees = 0;

  // Récupérer tous les utilisateurs actifs
  const utilisateurs = await prisma.utilisateurs.findMany({
    where: {
      status_id: {
        in: [1, 2, 3, 4, 5], // Exclure visiteurs
      },
    },
    include: {
      echeances_paiements: {
        where: {
          statut: 'en_attente',
        },
      },
    },
  });

  // Récupérer les types d'alertes
  const typesAlertes = await prisma.alertes_types.findMany({
    where: { actif: true },
  });

  const typesMap = Object.fromEntries(
    typesAlertes.map((t: any) => [t.code, t.id])
  );

  for (const user of utilisateurs) {
    // 1. Vérifier profil incomplet
    if (!user.email || !user.date_of_birth || !user.genre_id || !user.abonnement_id) {
      await creerAlerteIfNotExists(
        user.id,
        typesMap['COMPTE_INCOMPLET'],
        {
          champsManquants: [
            !user.email ? 'email' : null,
            !user.date_of_birth ? 'date_naissance' : null,
            !user.genre_id ? 'genre' : null,
            !user.abonnement_id ? 'abonnement' : null,
          ].filter(Boolean),
        }
      );
      alertesCreees++;
    }

    // 2. Vérifier paiements en retard (< 30 jours)
    const paiementsRetard = user.echeances_paiements.filter(
      (p: any) => p.date_echeance < new Date() && 
           p.date_echeance >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (paiementsRetard.length > 0) {
      const montantTotal = paiementsRetard.reduce((sum: number, p: any) => sum + Number(p.montant), 0);
      await creerAlerteIfNotExists(
        user.id,
        typesMap['PAIEMENT_RETARD'],
        {
          echeancesRetard: paiementsRetard.length,
          montantTotal: montantTotal.toFixed(2),
        }
      );
      alertesCreees++;
    }

    // 3. Vérifier paiements critiques (> 30 jours)
    const paiementsCritiques = user.echeances_paiements.filter(
      (p: any) => p.date_echeance < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (paiementsCritiques.length > 0) {
      const joursRetard = Math.floor(
        (Date.now() - paiementsCritiques[0].date_echeance.getTime()) / (24 * 60 * 60 * 1000)
      );
      const montantTotal = paiementsCritiques.reduce((sum: number, p: any) => sum + Number(p.montant), 0);
      
      await creerAlerteIfNotExists(
        user.id,
        typesMap['PAIEMENT_CRITIQUE'],
        {
          joursRetard,
          montantTotal: montantTotal.toFixed(2),
        }
      );
      alertesCreees++;
    }

    // 4. Vérifier absence abonnement
    if (!user.abonnement_id || user.abonnement_id === 0) {
      await creerAlerteIfNotExists(
        user.id,
        typesMap['SANS_ABONNEMENT'],
        { statut: 'Aucun abonnement actif' }
      );
      alertesCreees++;
    }
  }

  console.log(`✅ [AlertesDetection] ${alertesCreees} alertes détectées/créées`);

  return {
    success: true,
    message: `Détection terminée: ${alertesCreees} alertes détectées`,
  };
}
