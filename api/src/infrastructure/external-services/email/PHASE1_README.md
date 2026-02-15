# 🚀 Phase 1 : Amélioration du Système d'Email - IMPLÉMENTÉ

**Date :** 15 Février 2024  
**Statut :** ✅ Implémenté - Prêt à tester

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Ce qui a été implémenté](#ce-qui-a-été-implémenté)
3. [Installation & Configuration](#installation--configuration)
4. [Utilisation](#utilisation)
5. [Endpoints & Monitoring](#endpoints--monitoring)
6. [Tests](#tests)
7. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

La Phase 1 ajoute **3 améliorations critiques** pour rendre votre système d'email ultra-robuste :

### 1️⃣ Queue Persistante en Base de Données
- **Problème résolu :** Aucun email perdu, même si le serveur crash
- **Comment :** Table `email_queue` + Worker automatique
- **Impact :** 🔥🔥🔥 Énorme

### 2️⃣ Circuit Breaker pour SendGrid
- **Problème résolu :** Détection automatique des pannes SendGrid
- **Comment :** Pattern Circuit Breaker (3 états : CLOSED/OPEN/HALF_OPEN)
- **Impact :** 🔥🔥 Très élevé

### 3️⃣ Health Check Endpoint
- **Problème résolu :** Monitoring en temps réel du système
- **Comment :** Endpoint REST `/health/email`
- **Impact :** 🔥🔥 Très élevé

---

## Ce qui a été implémenté

### 📁 Fichiers Créés

```
api/
├── prisma/
│   ├── schema.prisma (modifié)
│   │   └── + model EmailQueue
│   │   └── + enum EmailQueueStatus
│   └── migrations/
│       └── 20250215_add_email_queue/
│           └── migration.sql
│
├── src/
│   ├── infrastructure/external-services/email/
│   │   ├── circuit-breaker.ts           ✨ NOUVEAU (379 lignes)
│   │   ├── email-queue-worker.ts        ✨ NOUVEAU (535 lignes)
│   │   └── email-queue-service.ts       ✨ NOUVEAU (443 lignes)
│   │
│   └── routes/health/
│       └── email.ts                     ✨ NOUVEAU (440 lignes)
│
└── PHASE1_README.md                     📖 Ce fichier
```

### 🗄️ Base de Données

**Nouvelle table : `email_queue`**

```sql
CREATE TABLE `email_queue` (
    `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
    `to` VARCHAR(255) NOT NULL,
    `subject` VARCHAR(500) NULL,
    `template_title` VARCHAR(100) NULL,
    `variables` JSON NULL,
    `html_content` TEXT NULL,
    
    -- Gestion des tentatives
    `attempts` INTEGER DEFAULT 0,
    `max_attempts` INTEGER DEFAULT 5,
    `next_retry_at` DATETIME NULL,
    
    -- Statut
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    
    -- Métadonnées
    `priority` INTEGER DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME,
    `processed_at` DATETIME NULL,
    
    -- Erreurs
    `last_error` TEXT NULL,
    `error_details` JSON NULL,
    
    -- Relations
    `utilisateur_id` INTEGER NULL,
    `correlation_id` VARCHAR(36) NULL,
    
    -- Index
    INDEX `idx_status_retry` (`status`, `next_retry_at`),
    INDEX `idx_status_priority_created` (`status`, `priority`, `created_at`),
    FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`)
);
```

---

## Installation & Configuration

### Étape 1 : Appliquer la Migration

```bash
cd api

# Si DATABASE_URL est configuré
npx prisma migrate deploy

# OU manuellement
mysql -u root -p votrebase < prisma/migrations/20250215_add_email_queue/migration.sql
```

### Étape 2 : Générer le Client Prisma

```bash
npx prisma generate
```

### Étape 3 : Reconstruire l'API

```bash
npm run build
```

### Étape 4 : Intégrer le Worker dans votre serveur

**Dans votre fichier principal (ex: `src/server.ts` ou `src/index.ts`) :**

```typescript
import { startEmailQueueWorker } from './infrastructure/external-services/email/email-queue-worker';
import { emailClient } from './infrastructure/external-services/email/email-client';

// Démarrer le worker au lancement du serveur
async function startServer() {
  // ... votre code existant ...
  
  // 🚀 Démarrer le worker d'emails
  console.log('📬 Starting email queue worker...');
  await startEmailQueueWorker(
    // Fonction d'envoi (utilise votre emailClient existant)
    async (request) => {
      return await emailClient.send(request);
    },
    // Configuration optionnelle
    {
      pollInterval: 5000,      // Vérifier toutes les 5s
      batchSize: 10,           // Traiter 10 emails à la fois
      maxAttempts: 5,          // Max 5 tentatives
    }
  );
  
  console.log('✅ Email queue worker started');
  
  // ... reste de votre code ...
}

startServer();
```

### Étape 5 : Ajouter les Routes Health Check

**Dans votre fichier de routes (ex: `src/routes/index.ts`) :**

```typescript
import healthEmailRouter from './health/email';

// Ajouter la route
app.use('/health', healthEmailRouter);
```

---

## Utilisation

### 📧 Ajouter un Email à la Queue

#### Option 1 : Via le Service (Recommandé)

```typescript
import { emailQueueService } from './infrastructure/external-services/email/email-queue-service';

// Email normal
await emailQueueService.addToQueue({
  to: 'user@example.com',
  templateTitle: 'bienvenue',
  variables: { userName: 'John Doe' },
});

// Email urgent (haute priorité)
await emailQueueService.addUrgentToQueue({
  to: 'admin@example.com',
  templateTitle: 'reset-password',
  variables: { resetUrl: 'https://...' },
});

// Email programmé (envoi différé)
await emailQueueService.scheduleEmail(
  {
    to: 'user@example.com',
    templateTitle: 'rappel-cours',
    variables: { coursNom: 'Karaté' },
  },
  new Date('2024-12-25 09:00:00') // 25 décembre à 9h
);

// Bulk insert (plusieurs emails)
await emailQueueService.addBulkToQueue([
  { to: 'user1@example.com', templateTitle: 'notification', variables: {...} },
  { to: 'user2@example.com', templateTitle: 'notification', variables: {...} },
  { to: 'user3@example.com', templateTitle: 'notification', variables: {...} },
]);
```

#### Option 2 : Via Prisma Directement

```typescript
import { PrismaClient, EmailQueueStatus } from '@prisma/client';

const prisma = new PrismaClient();

await prisma.emailQueue.create({
  data: {
    to: 'user@example.com',
    subject: 'Bienvenue',
    templateTitle: 'bienvenue',
    variables: { userName: 'John' },
    status: EmailQueueStatus.PENDING,
    priority: 0,
  },
});
```

### 🔄 Le Worker Fait le Reste Automatiquement !

Une fois l'email dans la queue :
1. **Worker le détecte** (toutes les 5 secondes)
2. **Tente l'envoi** via SendGrid
3. **Si succès :** Marque comme `COMPLETED` ✅
4. **Si échec :** Réessaie automatiquement avec backoff :
   - Tentative 1 : Immédiat
   - Tentative 2 : Dans 2 minutes
   - Tentative 3 : Dans 4 minutes
   - Tentative 4 : Dans 8 minutes
   - Tentative 5 : Dans 16 minutes
   - Après 5 échecs : Marque comme `FAILED` ❌

### 🔌 Circuit Breaker en Action

Le Circuit Breaker protège automatiquement votre système :

```typescript
import { sendGridCircuitBreaker } from './infrastructure/external-services/email/circuit-breaker';

// Utilisation automatique dans vos envois
try {
  await sendGridCircuitBreaker.execute(async () => {
    // Votre code d'envoi SendGrid
    return await sendGridMail.send({...});
  });
} catch (error) {
  if (error.name === 'CircuitBreakerOpenError') {
    // Circuit ouvert : SendGrid indisponible
    console.error('SendGrid temporairement indisponible');
    // Mettre en queue au lieu d'échouer
    await emailQueueService.addToQueue(request);
  }
}

// Vérifier l'état du circuit
const status = sendGridCircuitBreaker.getStatus();
console.log(`Circuit state: ${status.state}`); // CLOSED, OPEN, ou HALF_OPEN

// Obtenir les métriques
const metrics = sendGridCircuitBreaker.getMetrics();
console.log(`Failure rate: ${metrics.rates.failureRate}`);
```

---

## Endpoints & Monitoring

### 🏥 Health Check (Simple)

**Endpoint :** `GET /health/email`

**Exemple de réponse (tout va bien) :**

```json
{
  "status": "healthy",
  "timestamp": "2024-02-15T10:30:00.000Z",
  "checks": {
    "sendgrid": {
      "name": "SendGrid",
      "ok": true,
      "message": "Connected ✅",
      "details": {
        "latency": "145ms",
        "status": "fast"
      }
    },
    "queue": {
      "name": "Email Queue",
      "ok": true,
      "message": "Queue healthy ✅",
      "details": {
        "pending": 3,
        "processing": 1,
        "stuck": 0,
        "workerRunning": true
      }
    },
    "circuitBreaker": {
      "name": "Circuit Breaker",
      "ok": true,
      "message": "All operational ✅",
      "details": {
        "state": "CLOSED",
        "failureCount": 0
      }
    },
    "failures": {
      "name": "Recent Failures",
      "ok": true,
      "message": "No failures ✅",
      "details": {
        "last24h": 0
      }
    }
  },
  "stats": {
    "last24h": {
      "sent": 1247,
      "failed": 3,
      "total": 1250,
      "successRate": "99.76%"
    },
    "queue": {
      "pending": 3
    }
  }
}
```

**Exemple de réponse (problème détecté) :**

```json
{
  "status": "degraded",
  "timestamp": "2024-02-15T10:30:00.000Z",
  "checks": {
    "circuitBreaker": {
      "name": "Circuit Breaker",
      "ok": false,
      "message": "SendGrid unavailable ❌",
      "details": {
        "state": "OPEN",
        "failureCount": 5,
        "nextAttemptTime": "2024-02-15T10:35:00.000Z"
      }
    }
  }
}
```

### 📊 Health Check (Détaillé)

**Endpoint :** `GET /health/email/detailed`

Contient en plus :
- Statistiques de la queue complètes
- Échecs récents (derniers 5)
- Emails à venir (prochains 5)
- Statistiques du worker

### 👷 Statut du Worker

**Endpoint :** `GET /health/email/worker`

```json
{
  "status": "running",
  "stats": {
    "totalProcessed": 1250,
    "totalSucceeded": 1247,
    "totalFailed": 3,
    "successRate": "99.76%",
    "uptime": "2h 15m 30s"
  },
  "queue": {
    "counts": {
      "pending": 3,
      "processing": 1,
      "completed": 1247,
      "failed": 3
    }
  }
}
```

### 🔔 Monitoring Externe avec UptimeRobot (Gratuit)

1. Créez un compte sur [UptimeRobot](https://uptimerobot.com)
2. Créez un monitor HTTP(S)
3. URL : `https://votreapi.com/health/email`
4. Intervalle : 5 minutes
5. Alert Type : Email/SMS si status ≠ 200

**Vous serez alerté automatiquement en cas de problème !**

---

## Tests

### 🧪 Tester la Queue

```typescript
import { emailQueueService } from './infrastructure/external-services/email/email-queue-service';
import { getEmailQueueWorker } from './infrastructure/external-services/email/email-queue-worker';

// 1. Ajouter un email de test
const queued = await emailQueueService.addToQueue({
  to: 'test@example.com',
  subject: 'Test Email',
  templateTitle: 'bienvenue',
  variables: { userName: 'Test User' },
});

console.log(`Email queued with ID: ${queued.id}`);

// 2. Vérifier qu'il est dans la queue
const email = await emailQueueService.getQueuedEmail(queued.id);
console.log(`Status: ${email.status}`); // PENDING

// 3. Attendre que le worker le traite (max 10 secondes)
await new Promise(resolve => setTimeout(resolve, 10000));

// 4. Vérifier qu'il a été traité
const processed = await emailQueueService.getQueuedEmail(queued.id);
console.log(`Final status: ${processed.status}`); // COMPLETED ou FAILED

// 5. Voir les stats du worker
const worker = getEmailQueueWorker();
if (worker) {
  const stats = worker.getStats();
  console.log('Worker stats:', stats);
}
```

### 🧪 Tester le Circuit Breaker

```typescript
import { sendGridCircuitBreaker } from './infrastructure/external-services/email/circuit-breaker';

// Simuler des échecs pour ouvrir le circuit
for (let i = 0; i < 5; i++) {
  try {
    await sendGridCircuitBreaker.execute(async () => {
      throw new Error('Simulated failure');
    });
  } catch (error) {
    console.log(`Failure ${i + 1}/5`);
  }
}

// Vérifier l'état
const status = sendGridCircuitBreaker.getStatus();
console.log(`Circuit state: ${status.state}`); // OPEN

// Réinitialiser pour tests
sendGridCircuitBreaker.reset();
console.log('Circuit reset to CLOSED');
```

### 🧪 Tester le Health Check

```bash
# Simple check
curl http://localhost:4000/health/email

# Detailed check
curl http://localhost:4000/health/email/detailed

# Worker status
curl http://localhost:4000/health/email/worker
```

---

## Troubleshooting

### ❌ Problème : Le worker ne démarre pas

**Symptôme :**
```
Error: Cannot find module '@prisma/client'
```

**Solution :**
```bash
cd api
npx prisma generate
npm run build
```

---

### ❌ Problème : Les emails restent en PENDING

**Symptôme :**
Emails ajoutés à la queue mais jamais traités.

**Diagnostic :**
```bash
# Vérifier si le worker tourne
curl http://localhost:4000/health/email/worker

# Vérifier les logs du serveur
# Devrait afficher : "📬 Email Queue Worker started"
```

**Solution :**
Assurez-vous d'avoir ajouté le worker au démarrage du serveur (voir Étape 4).

---

### ❌ Problème : Circuit Breaker bloqué en OPEN

**Symptôme :**
```json
{
  "circuitBreaker": {
    "state": "OPEN",
    "message": "SendGrid unavailable"
  }
}
```

**Diagnostic :**
1. Vérifiez votre clé API SendGrid
2. Vérifiez votre quota SendGrid
3. Vérifiez la connexion réseau

**Solution temporaire (forcer la fermeture) :**
```typescript
import { sendGridCircuitBreaker } from './infrastructure/external-services/email/circuit-breaker';

// Forcer CLOSED (seulement pour tests/debug)
sendGridCircuitBreaker.forceClose();
```

---

### ❌ Problème : Emails bloqués en PROCESSING

**Symptôme :**
```json
{
  "queue": {
    "stuck": 5
  }
}
```

**Solution :**
Le worker nettoie automatiquement les emails bloqués après 10 minutes. Si persistant :

```typescript
import { PrismaClient, EmailQueueStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Réinitialiser manuellement
await prisma.emailQueue.updateMany({
  where: { status: EmailQueueStatus.PROCESSING },
  data: { 
    status: EmailQueueStatus.PENDING,
    nextRetryAt: null,
  },
});
```

---

### ❌ Problème : Trop d'emails en queue

**Symptôme :**
```json
{
  "queue": {
    "pending": 5000
  }
}
```

**Solutions :**

1. **Augmenter la taille des batches :**
```typescript
await startEmailQueueWorker(emailSender, {
  batchSize: 50, // Au lieu de 10
  pollInterval: 2000, // Vérifier plus souvent (2s)
});
```

2. **Nettoyer les vieux emails :**
```typescript
import { emailQueueService } from './infrastructure/external-services/email/email-queue-service';

// Supprimer emails > 30 jours (completed/failed)
const deleted = await emailQueueService.cleanOldEmails(30);
console.log(`Cleaned ${deleted} old emails`);
```

---

## 📈 Métriques & KPIs

**Métriques importantes à surveiller :**

| Métrique | Valeur OK | Action si dépassé |
|----------|-----------|-------------------|
| Taux de succès | > 95% | Vérifier SendGrid / Configuration |
| Emails pending | < 100 | Augmenter worker capacity |
| Emails stuck | 0 | Redémarrer worker / Vérifier DB |
| Circuit Breaker | CLOSED | Vérifier SendGrid service |
| Worker uptime | > 99% | Vérifier stabilité serveur |

---

## 🎉 Succès !

Vous avez maintenant un système d'email **ultra-robuste** avec :

✅ **Zéro perte d'email** (queue persistante)  
✅ **Détection automatique des pannes** (circuit breaker)  
✅ **Monitoring en temps réel** (health check)  
✅ **Réessais automatiques** (backoff exponentiel)  
✅ **Visibilité totale** (stats et logs)

**Prochaines étapes :**
- Phase 2 : Métriques avancées & Correlation IDs
- Phase 3 : Validation stricte & Tests automatisés

**Questions ?** N'hésitez pas à demander ! 🚀