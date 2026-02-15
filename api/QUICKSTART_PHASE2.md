# 🚀 Phase 2 : Métriques Avancées, Correlation IDs & Alertes

**Date :** Février 2025  
**Statut :** ✅ Implémenté  
**Temps d'implémentation :** 3-4 heures

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Installation rapide](#installation-rapide)
3. [Composants Phase 2](#composants-phase-2)
4. [Configuration](#configuration)
5. [Utilisation](#utilisation)
6. [Intégration Prometheus/Grafana](#intégration-prometheusgrafana)
7. [Alertes Slack/Discord](#alertes-slackdiscord)
8. [Dashboard Admin](#dashboard-admin)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

La Phase 2 ajoute des capacités avancées de monitoring et d'observabilité au système d'email :

### Nouveautés Phase 2

✅ **Métriques Prometheus**
- Exposition des métriques au format Prometheus
- Collecte automatique des statistiques d'email
- Métriques système (CPU, mémoire, Node.js)
- Compatible avec Grafana pour visualisation

✅ **Correlation IDs**
- Tracing distribué des requêtes
- Propagation automatique dans les logs
- Context storage avec CLS (Continuation-Local Storage)
- Facilite le debugging et le troubleshooting

✅ **Système d'Alertes**
- Notifications automatiques vers Slack/Discord
- Alertes configurables par sévérité
- Rate limiting pour éviter le spam
- Contexte enrichi (correlation ID, détails)

✅ **Dashboard Admin**
- Métriques en temps réel
- Graphiques et tendances
- Statistiques par template/priorité
- Surveillance de la queue et du worker

---

## 🚀 Installation Rapide (15 minutes)

### Étape 1 : Installer les dépendances

```bash
cd api
npm install prom-client cls-hooked axios
```

### Étape 2 : Configuration environnement

Ajouter à votre `.env` :

```bash
# === PHASE 2 - Monitoring & Alertes ===

# Métriques Prometheus
METRICS_ENABLED=true
METRICS_PREFIX=email_

# Correlation IDs
CORRELATION_ID_ENABLED=true
CORRELATION_ID_PREFIX=email

# Alertes Slack (optionnel)
SLACK_ALERTS_ENABLED=false
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#alerts
SLACK_USERNAME=Email System

# Alertes Discord (optionnel)
DISCORD_ALERTS_ENABLED=false
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
DISCORD_USERNAME=Email System

# Dashboard
DASHBOARD_ENABLED=true
DASHBOARD_REFRESH_INTERVAL=5000
DASHBOARD_METRICS_RETENTION=86400000

# Rate Limiting des Alertes
ALERT_MAX_PER_HOUR=10
ALERT_COOLDOWN_MINUTES=5
```

### Étape 3 : Intégrer dans votre serveur

Dans `server.ts` ou `index.ts` :

```typescript
import express from 'express';
import { getCorrelationIdManager } from './infrastructure/external-services/email/correlation-id-manager';
import { getMetricsCollector } from './infrastructure/external-services/email/metrics-collector';
import metricsRouter from './routes/health/metrics';
import dashboardRouter from './routes/health/dashboard';

const app = express();

// 1. Middleware Correlation ID (doit être en premier)
const correlationIdManager = getCorrelationIdManager();
app.use(correlationIdManager.expressMiddleware());

// 2. Initialiser les métriques
const metricsCollector = getMetricsCollector({
  enabled: process.env.METRICS_ENABLED === 'true',
  prefix: process.env.METRICS_PREFIX || 'email_'
});

// 3. Ajouter les routes
app.use('/metrics', metricsRouter);
app.use('/dashboard', dashboardRouter);

// ... reste de votre configuration
```

### Étape 4 : Démarrer le dashboard

```typescript
import { getDashboardService } from './infrastructure/external-services/email/dashboard-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dashboardService = getDashboardService(prisma, metricsCollector);

// Démarrer l'auto-refresh
dashboardService.start();

// Écouter les événements
dashboardService.on('update', (event) => {
  console.log('📊 Dashboard updated:', event.type);
});
```

### Étape 5 : Tester

```bash
# Métriques Prometheus
curl http://localhost:4000/metrics

# Dashboard
curl http://localhost:4000/dashboard

# Summary complet
curl http://localhost:4000/dashboard/summary
```

---

## 🏗️ Composants Phase 2

### 1️⃣ Metrics Collector (Prometheus)

**Fichier :** `metrics-collector.ts`

Collecte et expose des métriques détaillées :

```typescript
import { getMetricsCollector, measureDuration } from './metrics-collector';

const metricsCollector = getMetricsCollector();

// Enregistrer un email envoyé
const getDuration = measureDuration();
// ... envoi de l'email ...
const duration = getDuration();

metricsCollector.recordEmailSent({
  priority: 'normal',
  template: 'bienvenue'
}, duration);

// Enregistrer un échec
metricsCollector.recordEmailFailed({
  priority: 'urgent',
  template: 'reset-password',
  error_type: 'sendgrid_error'
}, duration);

// Mettre à jour la queue
metricsCollector.updateQueueSize('urgent', 'pending', 15);

// Mettre à jour le circuit breaker
metricsCollector.updateCircuitBreakerState('OPEN');
```

**Métriques exposées :**

- `email_sent_total` - Total emails envoyés
- `email_failed_total` - Total emails échoués
- `email_queued_total` - Total emails mis en queue
- `email_queue_size` - Taille actuelle de la queue
- `email_in_progress` - Emails en cours d'envoi
- `email_stuck_count` - Emails bloqués
- `email_circuit_breaker_state` - État du circuit breaker
- `email_send_duration_seconds` - Durée d'envoi (histogram)
- `email_queue_wait_time_seconds` - Temps d'attente en queue

### 2️⃣ Correlation ID Manager

**Fichier :** `correlation-id-manager.ts`

Gère les correlation IDs pour le tracing :

```typescript
import {
  getCorrelationIdManager,
  withCorrelationId,
  getCurrentCorrelationId,
  createCorrelatedLogger
} from './correlation-id-manager';

// Exécuter du code avec un correlation ID
await withCorrelationId(
  { operation: 'send_email', template: 'bienvenue', userId: '123' },
  async () => {
    // Tout le code ici aura le même correlation ID
    await sendEmail();
  }
);

// Récupérer le correlation ID actuel
const correlationId = getCurrentCorrelationId();
console.log('Current ID:', correlationId);

// Logger avec correlation ID
const logger = createCorrelatedLogger();
logger.info('Email sent successfully'); // Inclut automatiquement le correlation ID

// Tracer une opération
const manager = getCorrelationIdManager();
await manager.traceOperation('send_email', async () => {
  await sendEmail();
});
```

**Propagation HTTP :**

Les correlation IDs sont automatiquement :
- Extraits des headers `X-Correlation-ID`
- Ajoutés aux réponses HTTP
- Propagés dans les appels externes

### 3️⃣ Alert System

**Fichier :** `alert-system.ts`

Envoie des alertes vers Slack/Discord :

```typescript
import { AlertSystem, AlertType, AlertSeverity } from './alert-system';

const alertSystem = new AlertSystem({
  enabled: true,
  slack: {
    enabled: true,
    webhookUrl: process.env.SLACK_WEBHOOK_URL!,
    channel: '#alerts',
    username: 'Email System'
  },
  discord: {
    enabled: true,
    webhookUrl: process.env.DISCORD_WEBHOOK_URL!,
    username: 'Email System'
  },
  rateLimit: {
    maxAlertsPerHour: 10,
    cooldownMinutes: 5
  }
});

// Envoyer une alerte
await alertSystem.sendAlert({
  type: AlertType.CIRCUIT_BREAKER_OPEN,
  severity: AlertSeverity.CRITICAL,
  title: 'Circuit Breaker Ouvert',
  message: 'Le circuit breaker est passé en état OPEN suite à 5 échecs consécutifs.',
  details: {
    failures: 5,
    lastError: 'SendGrid API timeout'
  }
});
```

**Types d'alertes disponibles :**

- `CIRCUIT_BREAKER_OPEN` - Circuit breaker ouvert
- `STUCK_EMAILS` - Emails bloqués
- `HIGH_FAILURE_RATE` - Taux d'échec élevé
- `QUEUE_SATURATED` - Queue saturée
- `SENDGRID_ERROR` - Erreur SendGrid
- `WORKER_STOPPED` - Worker arrêté
- `RETRY_EXHAUSTED` - Tentatives épuisées

### 4️⃣ Dashboard Service

**Fichier :** `dashboard-service.ts`

Fournit des données en temps réel pour le dashboard :

```typescript
import { getDashboardService } from './dashboard-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dashboardService = getDashboardService(prisma, metricsCollector);

// Démarrer l'auto-refresh
dashboardService.start();

// Récupérer les données
const data = await dashboardService.getDashboardData();
const summary = await dashboardService.getSummary();
const timeSeries = await dashboardService.getTimeSeriesData(24);
const templateStats = await dashboardService.getTemplateStats(24);

// Écouter les mises à jour
dashboardService.on('update', (event) => {
  // Envoyer vers WebSocket, etc.
});
```

---

## ⚙️ Configuration

### Configuration Minimale

```typescript
// Métriques
const metricsCollector = getMetricsCollector({
  enabled: true,
  prefix: 'email_'
});

// Correlation IDs
const correlationIdManager = getCorrelationIdManager({
  enabled: true,
  headerName: 'X-Correlation-ID',
  prefix: 'email'
});

// Dashboard
const dashboardService = getDashboardService(prisma, metricsCollector, {
  enabled: true,
  refreshInterval: 5000
});
```

### Configuration Complète

```typescript
// Alertes avec tous les paramètres
const alertSystem = new AlertSystem({
  enabled: true,
  slack: {
    enabled: true,
    webhookUrl: process.env.SLACK_WEBHOOK_URL!,
    channel: '#email-alerts',
    username: 'ClubManager Email',
    iconEmoji: ':email:'
  },
  discord: {
    enabled: true,
    webhookUrl: process.env.DISCORD_WEBHOOK_URL!,
    username: 'ClubManager Email',
    avatarUrl: 'https://example.com/avatar.png'
  },
  rateLimit: {
    maxAlertsPerHour: 10,
    cooldownMinutes: 5
  },
  filters: {
    minSeverity: AlertSeverity.WARNING,
    excludedTypes: [AlertType.RETRY_EXHAUSTED]
  }
});
```

---

## 📊 Intégration Prometheus/Grafana

### Configuration Prometheus

Créer `prometheus.yml` :

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'clubmanager-email'
    static_configs:
      - targets: ['localhost:4000']
    metrics_path: '/metrics'
```

Démarrer Prometheus :

```bash
docker run -d -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### Configuration Grafana

1. **Ajouter Prometheus comme source de données**
   - URL : `http://localhost:9090`
   - Access : Server

2. **Créer un dashboard avec ces requêtes :**

```promql
# Taux d'envoi d'emails (par minute)
rate(email_sent_total[5m]) * 60

# Taux d'échec
rate(email_failed_total[5m]) / rate(email_sent_total[5m]) * 100

# Taille de la queue
email_queue_size

# Latence moyenne (p95)
histogram_quantile(0.95, email_send_duration_seconds_bucket)

# Circuit breaker state
email_circuit_breaker_state

# Emails bloqués
email_stuck_count
```

### Dashboard Grafana prêt à l'emploi

Importer le dashboard JSON fourni dans `grafana-dashboard.json` :

```bash
# Télécharger le dashboard
curl -o grafana-dashboard.json \
  https://example.com/grafana-dashboard.json

# Importer dans Grafana
# UI > Dashboards > Import > Upload JSON file
```

---

## 🚨 Alertes Slack/Discord

### Configuration Slack

1. **Créer un Incoming Webhook :**
   - Aller sur https://api.slack.com/apps
   - Créer une nouvelle app
   - Activer "Incoming Webhooks"
   - Créer un webhook pour votre canal

2. **Configurer dans `.env` :**
   ```bash
   SLACK_ALERTS_ENABLED=true
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
   SLACK_CHANNEL=#email-alerts
   ```

3. **Tester :**
   ```typescript
   await alertSystem.sendAlert({
     type: AlertType.HIGH_FAILURE_RATE,
     severity: AlertSeverity.WARNING,
     title: 'Test Alert',
     message: 'This is a test alert'
   });
   ```

### Configuration Discord

1. **Créer un Webhook Discord :**
   - Paramètres du serveur > Intégrations > Webhooks
   - Créer un webhook
   - Copier l'URL

2. **Configurer dans `.env` :**
   ```bash
   DISCORD_ALERTS_ENABLED=true
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/000000000000000000/XXXXXXXXXXXXXXXXXXXX
   ```

### Exemples de Messages

**Slack :**
```
🚨 Circuit Breaker Ouvert
Le circuit breaker est passé en état OPEN suite à 5 échecs consécutifs.

Severity: CRITICAL
Type: circuit_breaker_open
Correlation ID: email-abc123-1234567890

Failures: 5
Last Error: SendGrid API timeout
```

**Discord :**
Un embed coloré avec les mêmes informations, couleur rouge pour CRITICAL.

---

## 📊 Dashboard Admin

### Endpoints Disponibles

```bash
# Vue d'ensemble complète
GET /dashboard

# Résumé avec toutes les statistiques
GET /dashboard/summary

# Séries temporelles (24h par défaut)
GET /dashboard/timeseries?hours=24

# Stats par template
GET /dashboard/templates?hours=24

# Stats par priorité
GET /dashboard/priorities

# Stats de la queue
GET /dashboard/queue

# Stats du worker
GET /dashboard/worker

# Erreurs récentes
GET /dashboard/errors

# Forcer un refresh
POST /dashboard/refresh

# Nettoyer les anciennes métriques
POST /dashboard/cleanup
```

### Exemple de Réponse

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-02-15T10:30:00.000Z",
    "queue": {
      "pending": 42,
      "inProgress": 3,
      "stuck": 0,
      "byPriority": {
        "urgent": 5,
        "normal": 30,
        "low": 7
      }
    },
    "metrics": {
      "sent24h": 1523,
      "failed24h": 12,
      "successRate": 99.22,
      "avgLatency": 2.34
    },
    "circuitBreaker": {
      "state": "CLOSED",
      "failures": 0,
      "successes": 150
    },
    "worker": {
      "active": true,
      "lastProcessed": "2025-02-15T10:29:55.000Z",
      "processingRate": 12
    },
    "recentErrors": []
  }
}
```

### Intégration Frontend

```typescript
// React example
const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/dashboard/summary');
      const result = await response.json();
      setData(result.data);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh toutes les 5s

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>Email System Dashboard</h1>
      {data && (
        <>
          <QueueStats data={data.current.queue} />
          <MetricsChart data={data.timeSeries} />
          <TemplateTable data={data.templates} />
        </>
      )}
    </div>
  );
};
```

---

## 🔍 Troubleshooting

### Métriques ne s'affichent pas

```bash
# Vérifier que le collecteur est activé
curl http://localhost:4000/metrics/status

# Réinitialiser les métriques (dev uniquement)
curl -X POST http://localhost:4000/metrics/reset

# Activer manuellement
curl -X PUT http://localhost:4000/metrics/enable
```

### Correlation IDs manquants

```typescript
// Vérifier que le middleware est installé
const manager = getCorrelationIdManager();
console.log('Enabled:', manager.isEnabled());

// Forcer l'activation
manager.setEnabled(true);
```

### Alertes pas reçues

```bash
# Vérifier la configuration
console.log(process.env.SLACK_WEBHOOK_URL);
console.log(process.env.SLACK_ALERTS_ENABLED);

# Tester manuellement
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{"text": "Test message"}'
```

**Rate limiting :**
Si trop d'alertes sont envoyées, le système les bloque automatiquement.
- Cooldown par défaut : 5 minutes
- Max par heure : 10 alertes

### Dashboard ne se rafraîchit pas

```typescript
// Vérifier que le service est démarré
const dashboardService = getDashboardService(prisma, metricsCollector);
console.log('Enabled:', dashboardService.isEnabled());

// Démarrer manuellement
dashboardService.start();

// Forcer un refresh
await dashboardService.refresh();
```

---

## 📈 Métriques Clés à Surveiller

### Critiques (Alertes CRITICAL)

- ❌ Circuit breaker OPEN
- ❌ Taux d'échec > 10%
- ❌ Emails bloqués > 50
- ❌ Worker arrêté

### Importantes (Alertes WARNING)

- ⚠️ Queue > 1000 emails
- ⚠️ Temps d'attente moyen > 5 minutes
- ⚠️ Latence moyenne > 10 secondes
- ⚠️ Taux d'échec > 5%

### Informatives (Monitoring)

- ℹ️ Taux d'envoi (emails/minute)
- ℹ️ Distribution par priorité
- ℹ️ Distribution par template
- ℹ️ Tendances sur 24h

---

## 🎯 Bonnes Pratiques

### 1. Correlation IDs

```typescript
// ✅ BON : Utiliser withCorrelationId pour les opérations importantes
await withCorrelationId(
  { operation: 'bulk_send', userId: user.id },
  async () => {
    await sendBulkEmails(recipients);
  }
);

// ❌ MAUVAIS : Oublier le contexte
await sendBulkEmails(recipients); // Pas de tracing
```

### 2. Métriques

```typescript
// ✅ BON : Mesurer la durée avec measureDuration
const getDuration = measureDuration();
await sendEmail();
metricsCollector.recordEmailSent({ ... }, getDuration());

// ❌ MAUVAIS : Durée estimée
metricsCollector.recordEmailSent({ ... }, 1.5); // Imprécis
```

### 3. Alertes

```typescript
// ✅ BON : Contexte enrichi
await alertSystem.sendAlert({
  type: AlertType.HIGH_FAILURE_RATE,
  severity: AlertSeverity.WARNING,
  title: 'Taux d\'échec élevé',
  message: `Le taux d'échec est de 15% (30/200 emails)`,
  details: {
    failureRate: '15%',
    failed: 30,
    total: 200,
    period: '5 minutes'
  }
});

// ❌ MAUVAIS : Message vague
await alertSystem.sendAlert({
  title: 'Erreur',
  message: 'Problème détecté'
}); // Pas assez d'infos
```

---

## 🚀 Prochaines Étapes

### Optimisations Phase 2.1

- [ ] Cache Redis pour les métriques
- [ ] Agrégation des métriques par minute
- [ ] Export vers InfluxDB
- [ ] Alertes par email
- [ ] Intégration PagerDuty

### Phase 3 (à venir)

- [ ] Validation email avancée (DNS, typos)
- [ ] Tests automatiques des templates
- [ ] Spam score checker
- [ ] A/B testing des templates

---

## 📚 Ressources

### Documentation

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Discord Webhooks](https://discord.com/developers/docs/resources/webhook)

### Fichiers Importants

- `metrics-collector.ts` - Collecteur de métriques
- `correlation-id-manager.ts` - Gestionnaire de correlation IDs
- `alert-system.ts` - Système d'alertes
- `dashboard-service.ts` - Service de dashboard
- `routes/health/metrics.ts` - Routes métriques
- `routes/health/dashboard.ts` - Routes dashboard

---

## 🎉 Félicitations !

Vous avez implémenté un système de monitoring **de niveau entreprise** ! 🚀

**Avantages Phase 2 :**

- 📊 Visibilité totale avec Prometheus/Grafana
- 🔍 Tracing distribué avec correlation IDs
- 🚨 Alertes automatiques vers Slack/Discord
- 📈 Dashboard admin en temps réel
- 🎯 Debugging facilité
- 💪 Prêt pour la production

**Questions ?**  
Consultez la documentation complète dans `PHASE1_README.md` et `PHASE2_README.md`

---

**Version :** 2.0.0  
**Dernière mise à jour :** Février 2025  
**Statut :** ✅ Production Ready