# 🚀 Quick Start - Phase 1 : Système d'Email Robuste

**Temps estimé :** 15 minutes  
**Prérequis :** API fonctionnelle avec Prisma configuré

---

## ✅ Checklist Rapide

- [ ] Appliquer la migration SQL
- [ ] Générer le client Prisma
- [ ] Intégrer le worker au démarrage
- [ ] Ajouter les routes health check
- [ ] Tester !

---

## 📋 Étape 1 : Migration Base de Données (2 min)

### Option A : Avec Prisma CLI

```bash
cd api
npx prisma migrate deploy
```

### Option B : Manuellement (si DATABASE_URL pas configuré)

```bash
# Connectez-vous à MySQL
mysql -u root -p votre_base

# Exécutez la migration
source prisma/migrations/20250215_add_email_queue/migration.sql
```

### ✅ Vérification

```sql
-- Vérifier que la table existe
SHOW TABLES LIKE 'email_queue';

-- Devrait afficher : email_queue
```

---

## 📋 Étape 2 : Générer Prisma Client (1 min)

```bash
cd api
npx prisma generate
```

**Attendez que ça affiche :**
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

---

## 📋 Étape 3 : Intégrer le Worker (5 min)

### Trouvez votre fichier serveur principal

Cherchez : `src/server.ts`, `src/index.ts`, ou `src/app.ts`

### Ajoutez ces imports en haut du fichier

```typescript
import { startEmailQueueWorker } from './infrastructure/external-services/email/email-queue-worker';
import { emailClient } from './infrastructure/external-services/email/email-client';
```

### Ajoutez cette fonction avant `app.listen()`

```typescript
async function startEmailSystem() {
  console.log('📬 Starting email queue worker...');
  
  await startEmailQueueWorker(
    async (request) => {
      return await emailClient.send(request);
    },
    {
      pollInterval: 5000,
      batchSize: 10,
      maxAttempts: 5,
    }
  );
  
  console.log('✅ Email queue worker started');
}
```

### Appelez-la au démarrage

**AVANT :**
```typescript
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**APRÈS :**
```typescript
async function start() {
  await startEmailSystem();  // ← Ajoutez ceci
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();  // ← Au lieu de app.listen() direct
```

---

## 📋 Étape 4 : Ajouter Health Check Routes (2 min)

### Dans votre fichier de routes (ex: `src/routes/index.ts`)

```typescript
import healthEmailRouter from './health/email';

// Ajoutez cette ligne
app.use('/health', healthEmailRouter);
```

---

## 📋 Étape 5 : Rebuild & Restart (2 min)

```bash
cd api
npm run build
npm run dev
```

---

## 🧪 Étape 6 : Tester ! (3 min)

### Test 1 : Health Check

```bash
curl http://localhost:4000/health/email
```

**Attendez de voir :**
```json
{
  "status": "healthy",
  "checks": {
    "sendgrid": { "ok": true },
    "queue": { "ok": true },
    "circuitBreaker": { "ok": true }
  }
}
```

### Test 2 : Ajouter un Email à la Queue

**Dans votre code :**

```typescript
import { emailQueueService } from './infrastructure/external-services/email/email-queue-service';

// Au lieu de :
// await emailClient.send({ to: 'user@example.com', ... });

// Utilisez maintenant :
await emailQueueService.addToQueue({
  to: 'user@example.com',
  templateTitle: 'bienvenue',
  variables: { userName: 'Test User' },
});
```

### Test 3 : Vérifier que le Worker Traite

**Regardez vos logs serveur :**

Vous devriez voir :
```
📬 Email Queue Worker démarré
📧 [EmailQueueWorker] Processing 1 emails...
📤 [EmailQueueWorker] Processing email #1...
✅ [EmailQueueWorker] Email #1 sent successfully
```

---

## ✅ C'est Tout !

Votre système d'email est maintenant **ultra-robuste** avec :

✅ **Queue persistante** → Aucun email perdu  
✅ **Circuit breaker** → Détection pannes automatique  
✅ **Health check** → Monitoring temps réel  

---

## 🎯 Utilisation Quotidienne

### Envoyer un email normal

```typescript
await emailQueueService.addToQueue({
  to: 'user@example.com',
  templateTitle: 'bienvenue',
  variables: { userName: 'John' },
});
```

### Envoyer un email URGENT

```typescript
await emailQueueService.addUrgentToQueue({
  to: 'admin@example.com',
  templateTitle: 'reset-password',
  variables: { resetUrl: 'https://...' },
});
```

### Envoyer un email PLUS TARD

```typescript
await emailQueueService.scheduleEmail(
  {
    to: 'user@example.com',
    templateTitle: 'rappel',
    variables: { ... },
  },
  new Date('2024-12-25 09:00:00')
);
```

### Envoyer en MASSE

```typescript
await emailQueueService.addBulkToQueue([
  { to: 'user1@example.com', templateTitle: 'newsletter', variables: {...} },
  { to: 'user2@example.com', templateTitle: 'newsletter', variables: {...} },
  { to: 'user3@example.com', templateTitle: 'newsletter', variables: {...} },
]);
```

---

## 🔍 Monitoring

### Vérifier la santé

```bash
curl http://localhost:4000/health/email
```

### Voir les statistiques

```bash
curl http://localhost:4000/health/email/detailed
```

### Voir l'état du worker

```bash
curl http://localhost:4000/health/email/worker
```

---

## ❓ Problèmes ?

### ❌ "Cannot find module '@prisma/client'"

```bash
npx prisma generate
npm run build
```

### ❌ "Worker not running"

Vérifiez que vous avez bien ajouté `await startEmailSystem()` au démarrage.

### ❌ "Emails restent en PENDING"

Vérifiez vos logs. Le worker devrait afficher :
```
📬 Email Queue Worker démarré
```

Si absent, le worker n'a pas démarré correctement.

---

## 📚 Documentation Complète

Pour plus de détails, voir :
- `src/infrastructure/external-services/email/PHASE1_README.md` (Guide complet)
- `src/infrastructure/external-services/email/integration-example.ts` (Exemples)

---

## 🎉 Félicitations !

Vous avez un système d'email de **niveau entreprise** en 15 minutes ! 🚀

**Prochaines étapes :**
- Phase 2 : Métriques avancées & Correlation IDs
- Phase 3 : Validation stricte & Tests automatisés

**Questions ?** N'hésitez pas ! 😊