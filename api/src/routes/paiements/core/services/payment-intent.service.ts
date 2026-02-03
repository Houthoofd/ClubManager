import { StripeService } from './stripe.service.js';
import { Paiements } from '../../../../db/clients/paiements/paiements.js';
import Stripe from 'stripe';

/**
 * Service pour gérer les Payment Intents Stripe
 * Centralise la logique de création, validation et gestion des payment intents
 */
export class PaymentIntentService {
  private stripeService: StripeService;
  private cache: Map<string, { paymentIntent: Stripe.PaymentIntent; timestamp: number }>;
  private readonly CACHE_DURATION = 30000; // 30 secondes

  constructor(private paiementsClient?: Paiements) {
    this.stripeService = StripeService.getInstance();
    this.cache = new Map();
  }

  /**
   * Valide et convertit un montant en euros vers centimes
   */
  private validateAndConvertAmount(euros: number): number {
    console.log('💰 [Payment Intent Service] Validation montant:', { euros });

    // Validation du montant
    if (typeof euros !== 'number' || isNaN(euros)) {
      throw new Error('Le montant doit être un nombre valide');
    }

    if (euros <= 0) {
      throw new Error('Le montant doit être positif');
    }

    // Conversion en centimes
    const cents = Math.round(euros * 100);

    // Validation limites Stripe (0.50€ min, 999,999€ max)
    if (cents < 50) {
      throw new Error('Le montant minimum est de 0.50€');
    }

    if (cents > 99999900) {
      throw new Error('Le montant maximum est de 999,999€');
    }

    console.log('✅ [Payment Intent Service] Montant validé:', {
      original: euros,
      converted: cents,
      euros: cents / 100,
    });

    return cents;
  }

  /**
   * Vérifie si un payment intent existe en cache
   */
  private getCachedPaymentIntent(cacheKey: string): Stripe.PaymentIntent | null {
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('🔄 [Payment Intent Service] Payment Intent trouvé en cache');
      return cached.paymentIntent;
    }

    // Nettoyer le cache expiré
    if (cached) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Met en cache un payment intent
   */
  private cachePaymentIntent(cacheKey: string, paymentIntent: Stripe.PaymentIntent): void {
    this.cache.set(cacheKey, {
      paymentIntent,
      timestamp: Date.now(),
    });

    console.log('💾 [Payment Intent Service] Payment Intent mis en cache');
  }

  /**
   * Crée un payment intent pour une échéance
   */
  public async createForEcheance(data: {
    amount: number;
    echeanceId: number;
    userId: number;
    currency?: string;
    description?: string;
  }): Promise<{
    client_secret: string;
    payment_intent_id: string;
    amount: number;
    currency: string;
    metadata: Record<string, any>;
    echeance: {
      id: number;
      montant: number;
      statut: string;
    };
    cached?: boolean;
  }> {
    console.log('🎯 [Payment Intent Service] Création Payment Intent pour échéance:', data);

    // Vérifier le cache
    const cacheKey = `echeance_${data.echeanceId}_${data.userId}_${data.amount}`;
    const cachedPI = this.getCachedPaymentIntent(cacheKey);

    if (cachedPI) {
      return {
        client_secret: cachedPI.client_secret!,
        payment_intent_id: cachedPI.id,
        amount: cachedPI.amount,
        currency: cachedPI.currency,
        metadata: cachedPI.metadata,
        cached: true,
        echeance: {
          id: data.echeanceId,
          montant: data.amount,
          statut: 'en_attente',
        },
      };
    }

    // Vérifier que l'échéance existe
    const client = this.paiementsClient || new Paiements();
    const echeanceExists = await client.verifierEcheanceExiste(data.echeanceId);

    if (!echeanceExists) {
      throw new Error(`Échéance ${data.echeanceId} introuvable`);
    }

    // Récupérer les détails de l'échéance
    const echeance = await client.obtenirEcheance(data.echeanceId);

    if (!echeance) {
      throw new Error(`Impossible de récupérer les détails de l'échéance ${data.echeanceId}`);
    }

    // Vérifier que l'échéance n'est pas déjà payée
    if (echeance.statut === 'payé' || echeance.statut === 'paye') {
      throw new Error('Cette échéance a déjà été payée');
    }

    // Valider et convertir le montant
    const amountInCents = this.validateAndConvertAmount(data.amount);

    // Créer le payment intent via Stripe
    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: amountInCents,
      currency: data.currency || 'eur',
      metadata: {
        echeance_id: data.echeanceId.toString(),
        utilisateur_id: data.userId.toString(),
        type: 'echeance',
        montant_euros: data.amount.toString(),
      },
      description: data.description || `Paiement échéance #${data.echeanceId}`,
    });

    // Mettre en cache
    this.cachePaymentIntent(cacheKey, paymentIntent);

    console.log('✅ [Payment Intent Service] Payment Intent créé:', paymentIntent.id);

    return {
      client_secret: paymentIntent.client_secret!,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
      echeance: {
        id: data.echeanceId,
        montant: echeance.montant,
        statut: echeance.statut,
      },
    };
  }

  /**
   * Crée un payment intent pour une commande
   */
  public async createForCommande(data: {
    amount: number;
    commande: number | { id: number; articles?: any[] };
    userId?: number;
    currency?: string;
    description?: string;
  }): Promise<{
    client_secret: string;
    payment_intent_id: string;
    commande_id: number;
    amount: number;
    currency: string;
  }> {
    console.log('🎯 [Payment Intent Service] Création Payment Intent pour commande:', data);

    // Extraire l'ID de la commande
    let commandeId: number;
    let userId: number | undefined = data.userId;

    if (typeof data.commande === 'number') {
      commandeId = data.commande;
    } else if (typeof data.commande === 'object' && data.commande.id) {
      commandeId = data.commande.id;
    } else {
      throw new Error('Format de commande invalide');
    }

    // Si userId n'est pas fourni, le récupérer via la commande
    if (!userId) {
      const client = this.paiementsClient || new Paiements();
      const commande = await client.obtenirCommandeParId(commandeId);

      if (!commande) {
        throw new Error(`Commande ${commandeId} introuvable`);
      }

      userId = commande.utilisateur_id;

      // Vérifier que la commande n'est pas déjà payée
      const statutsPayes = ['payé', 'paye', 'completed', 'paid'];
      if (statutsPayes.includes(commande.statut?.toLowerCase())) {
        throw new Error('Cette commande a déjà été payée');
      }
    }

    // Valider et convertir le montant
    const amountInCents = this.validateAndConvertAmount(data.amount);

    // Créer le payment intent via Stripe
    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: amountInCents,
      currency: data.currency || 'eur',
      metadata: {
        type: 'commande',
        commande_id: commandeId.toString(),
        utilisateur_id: userId.toString(),
        montant_euros: data.amount.toString(),
      },
      description: data.description || `Paiement commande #${commandeId}`,
    });

    console.log('✅ [Payment Intent Service] Payment Intent créé:', paymentIntent.id);

    return {
      client_secret: paymentIntent.client_secret!,
      payment_intent_id: paymentIntent.id,
      commande_id: commandeId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  }

  /**
   * Récupère un payment intent par son ID
   */
  public async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    console.log('🔍 [Payment Intent Service] Récupération Payment Intent:', paymentIntentId);

    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      throw new Error('ID de Payment Intent invalide');
    }

    return await this.stripeService.retrievePaymentIntent(paymentIntentId);
  }

  /**
   * Nettoie le cache (utile pour les tests)
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('🧹 [Payment Intent Service] Cache nettoyé');
  }
}
