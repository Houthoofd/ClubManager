/**
 * Exemple d'Intégration - Phase 1 : Système d'Email Amélioré
 *
 * Ce fichier montre comment intégrer les 3 améliorations de la Phase 1 :
 * 1. Queue Persistante
 * 2. Circuit Breaker
 * 3. Health Check
 *
 * À intégrer dans votre fichier server.ts ou index.ts
 */

import express from 'express';
import { startEmailQueueWorker, stopEmailQueueWorker } from './email-queue-worker';
import { emailQueueService } from './email-queue-service';
import { sendGridCircuitBreaker } from './circuit-breaker';
import { emailClient } from './email-client';
import healthEmailRouter from '../../../routes/health/email';

// ============================================================================
// 1. CONFIGURATION DU SERVEUR
// ============================================================================

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

// ============================================================================
// 2. DÉMARRAGE DU WORKER EMAIL (AU LANCEMENT DU SERVEUR)
// ============================================================================

async function startEmailSystem() {
  console.log('📬 [Email System] Starting...');

  try {
    // Démarrer le worker de la queue
    await startEmailQueueWorker(
      // Fonction d'envoi (utilise votre emailClient existant)
      async (request) => {
        return await emailClient.send(request);
      },
      // Configuration (optionnelle)
      {
        pollInterval: 5000,      // Vérifier la queue toutes les 5 secondes
        batchSize: 10,           // Traiter 10 emails à la fois
        maxAttempts: 5,          // Maximum 5 tentatives
        backoffMultiplier: 2,    // Backoff exponentiel : 2min, 4min, 8min...
        stuckEmailThreshold: 10 * 60 * 1000, // 10 minutes
      }
    );

    console.log('✅ [Email System] Worker started successfully');
  } catch (error) {
    console.error('❌ [Email System] Failed to start worker:', error);
    // Continuer quand même (le serveur peut fonctionner sans le worker)
  }
}

// ============================================================================
// 3. AJOUT DES ROUTES HEALTH CHECK
// ============================================================================

app.use('/health', healthEmailRouter);

// ============================================================================
// 4. EXEMPLES D'UTILISATION DANS VOS ROUTES
// ============================================================================

// Route exemple : Inscription utilisateur
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    // ... votre logique d'inscription ...

    // 📧 ANCIEN CODE (envoi direct)
    // await emailClient.send({
    //   to: email,
    //   templateTitle: 'bienvenue',
    //   variables: { userName: `${firstName} ${lastName}` },
    // });

    // 🚀 NOUVEAU CODE (via queue - plus robuste !)
    await emailQueueService.addToQueue({
      to: email,
      templateTitle: 'bienvenue',
      variables: { userName: `${firstName} ${lastName}` },
    });

    res.json({
      success: true,
      message: 'Inscription réussie. Un email de bienvenue vous sera envoyé sous peu.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route exemple : Reset password (URGENT)
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // ... générer token reset ...
    const resetToken = 'abc123';
    const resetUrl = `https://app.com/reset-password?token=${resetToken}`;

    // 🔥 Email URGENT (haute priorité)
    await emailQueueService.addUrgentToQueue({
      to: email,
      templateTitle: 'reset-password',
      variables: {
        userName: email,
        resetUrl,
        expiresIn: '24 heures',
      },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route exemple : Rappel de cours (schedulé)
app.post('/api/cours/:id/rappeler', async (req, res) => {
  try {
    const { id } = req.params;

    // ... récupérer le cours et les inscrits ...
    const cours = { nom: 'Karaté', date: new Date('2024-12-25 14:00:00') };
    const inscrits = [
      { email: 'user1@example.com', nom: 'John Doe' },
      { email: 'user2@example.com', nom: 'Jane Smith' },
    ];

    // 📅 Envoyer 24h avant le cours
    const rappelDate = new Date(cours.date.getTime() - 24 * 60 * 60 * 1000);

    for (const inscrit of inscrits) {
      await emailQueueService.scheduleEmail(
        {
          to: inscrit.email,
          templateTitle: 'rappel-cours',
          variables: {
            userName: inscrit.nom,
            coursNom: cours.nom,
            dateHeure: cours.date.toLocaleString('fr-FR'),
          },
        },
        rappelDate
      );
    }

    res.json({
      success: true,
      message: `${inscrits.length} rappels programmés pour ${rappelDate.toISOString()}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route exemple : Newsletter (bulk)
app.post('/api/newsletter/send', async (req, res) => {
  try {
    // ... récupérer tous les abonnés ...
    const abonnes = [
      { email: 'user1@example.com', prenom: 'John' },
      { email: 'user2@example.com', prenom: 'Jane' },
      { email: 'user3@example.com', prenom: 'Bob' },
      // ... potentiellement des milliers ...
    ];

    // 📨 Envoi en masse (tous ajoutés à la queue d'un coup)
    await emailQueueService.addBulkToQueue(
      abonnes.map(abonne => ({
        to: abonne.email,
        templateTitle: 'newsletter',
        variables: {
          userName: abonne.prenom,
          // ... contenu newsletter ...
        },
      })),
      {
        priority: -1, // Low priority (pas urgent)
      }
    );

    res.json({
      success: true,
      message: `${abonnes.length} newsletters ajoutées à la queue`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 5. ROUTES ADMIN POUR MONITORING
// ============================================================================

// Dashboard admin : stats de la queue
app.get('/api/admin/email/stats', async (req, res) => {
  try {
    const stats = await emailQueueService.getStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard admin : échecs récents
app.get('/api/admin/email/failures', async (req, res) => {
  try {
    const failures = await emailQueueService.getRecentFailures(20);
    res.json(failures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard admin : prochains emails
app.get('/api/admin/email/upcoming', async (req, res) => {
  try {
    const upcoming = await emailQueueService.getUpcomingEmails(20);
    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard admin : état du circuit breaker
app.get('/api/admin/email/circuit-breaker', async (req, res) => {
  try {
    const status = sendGridCircuitBreaker.getStatus();
    const metrics = sendGridCircuitBreaker.getMetrics();
    res.json({ status, metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Action admin : réessayer un email échoué
app.post('/api/admin/email/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await emailQueueService.retryFailedEmail(parseInt(id));

    if (success) {
      res.json({ success: true, message: 'Email re-queued' });
    } else {
      res.status(400).json({ success: false, message: 'Cannot retry email' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Action admin : annuler un email en attente
app.post('/api/admin/email/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await emailQueueService.cancelQueuedEmail(parseInt(id));

    if (success) {
      res.json({ success: true, message: 'Email cancelled' });
    } else {
      res.status(400).json({ success: false, message: 'Cannot cancel email' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Action admin : nettoyer les vieux emails
app.post('/api/admin/email/cleanup', async (req, res) => {
  try {
    const { days = 30 } = req.body;
    const deleted = await emailQueueService.cleanOldEmails(days);
    res.json({
      success: true,
      message: `${deleted} old emails deleted`,
      deleted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 6. GESTION DE L'ARRÊT GRACIEUX
// ============================================================================

async function gracefulShutdown() {
  console.log('🛑 [Server] Shutting down gracefully...');

  // Arrêter le worker (attend que les emails en cours se terminent)
  await stopEmailQueueWorker();
  console.log('✅ [Email Worker] Stopped');

  // Fermer le serveur
  server.close(() => {
    console.log('✅ [Server] Closed');
    process.exit(0);
  });

  // Force shutdown après 30 secondes
  setTimeout(() => {
    console.error('⚠️ [Server] Forced shutdown');
    process.exit(1);
  }, 30000);
}

// Écouter les signaux d'arrêt
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ============================================================================
// 7. DÉMARRAGE DU SERVEUR
// ============================================================================

async function startServer() {
  try {
    // Démarrer le système d'email
    await startEmailSystem();

    // Démarrer le serveur HTTP
    const server = app.listen(PORT, () => {
      console.log(`🚀 [Server] Listening on port ${PORT}`);
      console.log(`🏥 [Health] Check at http://localhost:${PORT}/health/email`);
    });

    return server;
  } catch (error) {
    console.error('❌ [Server] Failed to start:', error);
    process.exit(1);
  }
}

// Lancer si exécuté directement
if (require.main === module) {
  startServer();
}

// ============================================================================
// 8. EXEMPLES DE TESTS
// ============================================================================

/**
 * Test rapide de la queue
 */
export async function testEmailQueue() {
  console.log('🧪 Testing email queue...');

  // Ajouter un email de test
  const queued = await emailQueueService.addToQueue({
    to: 'test@example.com',
    subject: 'Test Email',
    templateTitle: 'bienvenue',
    variables: { userName: 'Test User' },
  });

  console.log(`✅ Email queued with ID: ${queued.id}`);

  // Vérifier le statut
  const email = await emailQueueService.getQueuedEmail(queued.id);
  console.log(`Status: ${email?.status}`);

  // Attendre 10 secondes
  console.log('⏳ Waiting 10 seconds for worker to process...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Vérifier à nouveau
  const processed = await emailQueueService.getQueuedEmail(queued.id);
  console.log(`Final status: ${processed?.status}`);
}

/**
 * Test du circuit breaker
 */
export async function testCircuitBreaker() {
  console.log('🧪 Testing circuit breaker...');

  // État initial
  let status = sendGridCircuitBreaker.getStatus();
  console.log(`Initial state: ${status.state}`);

  // Simuler 5 échecs
  console.log('Simulating 5 failures...');
  for (let i = 0; i < 5; i++) {
    try {
      await sendGridCircuitBreaker.execute(async () => {
        throw new Error('Simulated failure');
      });
    } catch (error) {
      console.log(`Failure ${i + 1}/5`);
    }
  }

  // Vérifier que le circuit est ouvert
  status = sendGridCircuitBreaker.getStatus();
  console.log(`State after failures: ${status.state}`); // OPEN

  // Réinitialiser
  sendGridCircuitBreaker.reset();
  console.log('✅ Circuit breaker reset to CLOSED');
}

/**
 * Test du health check
 */
export async function testHealthCheck() {
  console.log('🧪 Testing health check...');

  try {
    const response = await fetch('http://localhost:4000/health/email');
    const data = await response.json();

    console.log(`Status: ${data.status}`);
    console.log(`SendGrid: ${data.checks.sendgrid.message}`);
    console.log(`Queue: ${data.checks.queue.message}`);
    console.log(`Circuit Breaker: ${data.checks.circuitBreaker.message}`);
    console.log(`Success rate: ${data.stats.last24h.successRate}`);
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

// Décommenter pour tester
// testEmailQueue();
// testCircuitBreaker();
// testHealthCheck();
