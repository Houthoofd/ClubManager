import { Request, Response } from 'express';
import { StripeService } from '../services/stripe.service.js';
import { Paiements } from '../../../../db/clients/paiements/paiements.js';

/**
 * Handler pour vérifier la santé du module paiements
 * GET /api/paiements/health
 */
export async function healthCheck(
  req: Request,
  res: Response,
  paiementsClient?: Paiements
): Promise<void> {
  try {
    console.log('🏥 [Health] Vérification santé module paiements');

    const stripeService = StripeService.getInstance();
    const client = paiementsClient || new Paiements();

    const checks = {
      timestamp: new Date().toISOString(),
      stripe: {
        initialized: false,
        connected: false,
        error: null as string | null,
      },
      database: {
        connected: false,
        error: null as string | null,
      },
      overall: 'unknown' as 'healthy' | 'degraded' | 'unhealthy' | 'unknown',
    };

    // 1. Vérifier Stripe
    try {
      if (stripeService.isInitialized()) {
        checks.stripe.initialized = true;

        // Test de connectivité
        await stripeService.getStripe().balance.retrieve();
        checks.stripe.connected = true;
      }
    } catch (error) {
      checks.stripe.error = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ [Health] Erreur Stripe:', checks.stripe.error);
    }

    // 2. Vérifier la base de données
    try {
      // Simple requête pour vérifier la connexion
      await client.obtenirTousPaiements({ limit: 1, offset: 0 });
      checks.database.connected = true;
    } catch (error) {
      checks.database.error = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ [Health] Erreur DB:', checks.database.error);
    }

    // 3. Déterminer l'état global
    if (checks.stripe.connected && checks.database.connected) {
      checks.overall = 'healthy';
    } else if (checks.stripe.connected || checks.database.connected) {
      checks.overall = 'degraded';
    } else {
      checks.overall = 'unhealthy';
    }

    // 4. Déterminer le code de statut HTTP
    const statusCode = checks.overall === 'healthy' ? 200 : checks.overall === 'degraded' ? 207 : 503;

    console.log('✅ [Health] Vérification terminée:', checks.overall);

    res.status(statusCode).json({
      success: checks.overall === 'healthy',
      status: checks.overall,
      checks,
    });
  } catch (error) {
    console.error('❌ [Health] Erreur critique:', error);

    res.status(500).json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler pour obtenir des diagnostics détaillés du système de paiement
 * GET /api/paiements/diagnostic
 */
export async function getDiagnostic(
  req: Request,
  res: Response
): Promise<void> {
  try {
    console.log('🔍 [Diagnostic] Génération diagnostic détaillé');

    const stripeService = StripeService.getInstance();

    // Informations sur les clés Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
    const stripePublicKey = process.env.STRIPE_PUBLIC_KEY || '';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    const diagnostic = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      module: 'paiements',
      version: '2.0.0',

      configuration: {
        stripe: {
          secret_key: {
            configured: !!stripeSecretKey,
            type: stripeSecretKey.startsWith('sk_test_') ? 'test' : stripeSecretKey.startsWith('sk_live_') ? 'live' : 'unknown',
            length: stripeSecretKey.length,
            preview: stripeSecretKey ? `${stripeSecretKey.substring(0, 7)}...${stripeSecretKey.substring(stripeSecretKey.length - 4)}` : null,
          },
          public_key: {
            configured: !!stripePublicKey,
            type: stripePublicKey.startsWith('pk_test_') ? 'test' : stripePublicKey.startsWith('pk_live_') ? 'live' : 'unknown',
            length: stripePublicKey.length,
            preview: stripePublicKey ? `${stripePublicKey.substring(0, 7)}...${stripePublicKey.substring(stripePublicKey.length - 4)}` : null,
          },
          webhook_secret: {
            configured: !!webhookSecret,
            length: webhookSecret.length,
          },
          keys_match: stripeSecretKey && stripePublicKey
            ? stripeSecretKey.includes('test') === stripePublicKey.includes('test')
            : false,
        },

        features: {
          payment_intents: true,
          webhooks: !!webhookSecret,
          echeances: true,
          commandes: true,
          email_notifications: !!process.env.EMAIL_API_KEY,
        },
      },

      status: {
        stripe_initialized: stripeService.isInitialized(),
        stripe_api_version: '2025-02-24.acacia',
      },
    };

    // Test de connexion Stripe (optionnel)
    let stripeTest = {
      attempted: false,
      success: false,
      error: null as string | null,
      account_info: null as any,
    };

    try {
      if (stripeService.isInitialized()) {
        stripeTest.attempted = true;
        const account = await stripeService.getStripe().account.retrieve();
        stripeTest.success = true;
        stripeTest.account_info = {
          id: account.id,
          country: account.country,
          currency: account.default_currency,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
        };
      }
    } catch (error) {
      stripeTest.error = error instanceof Error ? error.message : 'Erreur inconnue';
    }

    // Avertissements et recommandations
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!diagnostic.configuration.stripe.secret_key.configured) {
      warnings.push('Clé secrète Stripe non configurée');
      recommendations.push('Configurer STRIPE_SECRET_KEY dans .env');
    }

    if (!diagnostic.configuration.stripe.webhook_secret.configured) {
      warnings.push('Secret webhook Stripe non configuré');
      recommendations.push('Configurer STRIPE_WEBHOOK_SECRET dans .env pour activer les webhooks');
    }

    if (!diagnostic.configuration.stripe.keys_match) {
      warnings.push('Les clés Stripe ne correspondent pas (test vs live)');
      recommendations.push('Assurez-vous que les clés test/live sont cohérentes');
    }

    if (diagnostic.configuration.stripe.secret_key.type === 'test') {
      warnings.push('Mode TEST Stripe activé');
      recommendations.push('Passez en mode LIVE pour la production');
    }

    if (!diagnostic.configuration.features.email_notifications) {
      warnings.push('Notifications email non configurées');
      recommendations.push('Configurer EMAIL_API_KEY pour activer les notifications');
    }

    // Déterminer le statut global
    const isHealthy =
      diagnostic.configuration.stripe.secret_key.configured &&
      diagnostic.status.stripe_initialized &&
      stripeTest.success;

    console.log('✅ [Diagnostic] Diagnostic généré');

    res.status(200).json({
      success: true,
      diagnostic,
      stripe_test: stripeTest,
      analysis: {
        healthy: isHealthy,
        warnings,
        recommendations,
      },
    });
  } catch (error) {
    console.error('❌ [Diagnostic] Erreur:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du diagnostic',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler pour tester la compatibilité des clés Stripe
 * POST /api/paiements/test-keys
 */
export async function testStripeKeys(
  req: Request,
  res: Response
): Promise<void> {
  try {
    console.log('🔑 [Test Keys] Test compatibilité clés Stripe');

    const { frontend_public_key } = req.body;

    if (!frontend_public_key) {
      res.status(400).json({
        success: false,
        message: 'Clé publique frontend manquante',
        usage: 'POST /api/paiements/test-keys avec { frontend_public_key: "pk_..." }',
      });
      return;
    }

    const stripeService = StripeService.getInstance();
    const backendSecretKey = process.env.STRIPE_SECRET_KEY || '';
    const backendPublicKey = process.env.STRIPE_PUBLIC_KEY || '';

    // Extraire les comptes des clés
    const frontendAccount = frontend_public_key.match(/pk_(test|live)_(.+)/)?.[2] || '';
    const backendAccount = backendSecretKey.match(/sk_(test|live)_(.+)/)?.[2] || '';

    const compatibility = {
      frontend: {
        key: frontend_public_key,
        type: frontend_public_key.startsWith('pk_test_') ? 'test' : 'live',
        account: frontendAccount,
      },
      backend: {
        secret_key: {
          configured: !!backendSecretKey,
          type: backendSecretKey.startsWith('sk_test_') ? 'test' : 'live',
          account: backendAccount,
        },
        public_key: {
          configured: !!backendPublicKey,
          matches_frontend: backendPublicKey === frontend_public_key,
        },
      },
      compatibility: {
        same_account: frontendAccount === backendAccount && frontendAccount !== '',
        same_type:
          (frontend_public_key.includes('test') && backendSecretKey.includes('test')) ||
          (frontend_public_key.includes('live') && backendSecretKey.includes('live')),
        fully_compatible: false,
      },
    };

    compatibility.compatibility.fully_compatible =
      compatibility.compatibility.same_account &&
      compatibility.compatibility.same_type;

    // Test pratique : créer un Payment Intent de test
    let practicalTest = {
      attempted: false,
      success: false,
      error: null as string | null,
      payment_intent_id: null as string | null,
    };

    if (stripeService.isInitialized() && compatibility.compatibility.fully_compatible) {
      try {
        practicalTest.attempted = true;

        const testPaymentIntent = await stripeService.getStripe().paymentIntents.create({
          amount: 100, // 1 EUR
          currency: 'eur',
          description: 'Test compatibilité clés',
          metadata: {
            test: 'compatibility_check',
            frontend_key_account: frontendAccount,
            timestamp: new Date().toISOString(),
          },
        });

        practicalTest.success = true;
        practicalTest.payment_intent_id = testPaymentIntent.id;

        // Annuler immédiatement le Payment Intent de test
        await stripeService.getStripe().paymentIntents.cancel(testPaymentIntent.id);

        console.log('✅ [Test Keys] Payment Intent de test créé et annulé');
      } catch (error) {
        practicalTest.error = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('❌ [Test Keys] Erreur test pratique:', practicalTest.error);
      }
    }

    const recommendation = compatibility.compatibility.fully_compatible
      ? 'Les clés sont compatibles et fonctionnelles ✅'
      : 'Les clés ne sont pas compatibles. Vérifiez que les clés proviennent du même compte Stripe.';

    console.log('✅ [Test Keys] Test terminé');

    res.status(200).json({
      success: true,
      compatibility_test: compatibility,
      practical_test: practicalTest,
      recommendation,
      next_steps: compatibility.compatibility.fully_compatible
        ? ['Les clés fonctionnent correctement', 'Vous pouvez effectuer des paiements']
        : [
            'Vérifiez vos clés Stripe dans le dashboard',
            'Assurez-vous d\'utiliser des clés du même compte',
            'Vérifiez que frontend et backend utilisent le même mode (test/live)',
          ],
    });
  } catch (error) {
    console.error('❌ [Test Keys] Erreur:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors du test des clés Stripe',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }
}
