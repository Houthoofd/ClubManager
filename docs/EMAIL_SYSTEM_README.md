# 📧 Système d'Envoi d'Emails - Documentation

## 🎯 Architecture Unifiée

Le système d'email a été **unifié et simplifié** pour être plus robuste et facile à utiliser.

### Principes clés

- ✅ **Templates HTML** : Tous les templates sont des fichiers `.html` dans `resources/templates/emails/`
- ✅ **Validation automatique** : Vérification des variables manquantes avant envoi
- ✅ **Retry automatique** : 3 tentatives avec backoff exponentiel (2s, 4s, 8s)
- ✅ **Rate limiting** : Maximum 50 emails/heure par destinataire
- ✅ **Logs structurés** : Tous les événements sont loggés pour debugging
- ✅ **Fallbacks robustes** : HTML inline si le template échoue

---

## 📁 Structure des Fichiers

```
api/
├── resources/
│   └── templates/
│       └── emails/              # Templates HTML
│           ├── bienvenue.html
│           ├── reset-password.html
│           ├── confirmation-commande.html
│           └── ...
│
└── src/
    └── infrastructure/
        └── external-services/
            └── email/
                ├── email-client.ts           # 🎯 Façade principale (UTILISEZ CELUI-CI)
                ├── sendgrid-sender.ts        # Envoi via SendGrid + retry
                ├── template-loader.ts        # Chargement des templates HTML
                ├── variables-preparator.ts   # Préparation des variables
                └── README.md                 # Ce fichier
```

---

## 🚀 Utilisation

### 1. Envoi d'email simple

```typescript
import { emailClient } from '@/infrastructure/external-services/email/email-client.js';

// Avec template
await emailClient.sendEmail({
  to: 'user@example.com',
  subject: 'Bienvenue !',
  message: '', // Sera rempli par le template
  templateTitle: 'bienvenue',
  variables: {
    userName: 'Jean Dupont',
    clubName: 'Club Manager',
  },
  saveToDb: true,
  utilisateurId: 123,
});

// Sans template (message direct)
await emailClient.sendEmail({
  to: 'user@example.com',
  subject: 'Notification',
  message: '<p>Votre message HTML ici</p>',
  saveToDb: true,
  utilisateurId: 123,
});
```

### 2. Emails spécialisés

```typescript
// Email de bienvenue
await emailClient.sendWelcomeEmail(user, {
  variables: { customMessage: 'Message personnalisé' }
});

// Réinitialisation de mot de passe
await emailClient.sendPasswordResetEmail(
  'user@example.com',
  'Jean',
  'reset-token-123'
);

// Promotion professeur
await emailClient.sendPromotionEmail(user);

// Confirmation de commande
await emailClient.sendOrderConfirmationEmail(
  'user@example.com',
  userId,
  {
    userName: 'Jean Dupont',
    numeroCommande: 'CMD-001',
    dateCommande: '01/01/2024',
    statutCommande: 'Confirmée',
    nbArticles: '3',
    totalCommande: '49.99',
  }
);
```

### 3. Preview & Debugging

```typescript
// Prévisualiser un template sans l'envoyer
const preview = await emailClient.previewTemplate('bienvenue', {
  userName: 'Test User',
  clubName: 'Club Manager',
});

console.log('Subject:', preview.subject);
console.log('HTML:', preview.html);
console.log('Validation:', preview.validation);
// {
//   isValid: true,
//   missingVariables: [],
//   unusedVariables: ['extraVar']
// }

// Lister tous les templates disponibles
const templates = await emailClient.listTemplates();
console.log('Templates:', templates);
// ['bienvenue', 'reset-password', 'confirmation-commande', ...]

// Vérifier si un template existe
const exists = await emailClient.templateExists('bienvenue');
console.log('Existe:', exists); // true
```

---

## 📝 Créer un Nouveau Template

### 1. Créer le fichier HTML

Créez `resources/templates/emails/mon-template.html` :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{sujetEmail}} - {{clubName}}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: #4CAF50; color: white; padding: 20px; }
        .content { padding: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{titre}}</h1>
    </div>
    <div class="content">
        <p>Bonjour <strong>{{userName}}</strong>,</p>
        <p>{{message}}</p>
        <p>Cordialement,<br>L'équipe {{clubName}}</p>
    </div>
    <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
        <p>© {{currentYear}} {{clubName}} - Tous droits réservés</p>
    </div>
</body>
</html>
```

### 2. Utiliser le template

```typescript
await emailClient.sendEmail({
  to: 'user@example.com',
  subject: '', // Sera extrait du <title>
  message: '',
  templateTitle: 'mon-template',
  variables: {
    sujetEmail: 'Notification importante',
    titre: 'Information',
    userName: 'Jean Dupont',
    message: 'Votre message personnalisé ici.',
    clubName: 'Club Manager',
    currentYear: new Date().getFullYear().toString(),
  },
});
```

### 3. Tester le template

```bash
# Script de vérification
npm run email:check-templates

# Ou en code
const preview = await emailClient.previewTemplate('mon-template', variables);
console.log(preview.validation);
```

---

## 🔧 Configuration

### Variables d'environnement requises

```env
# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@clubmanager.com

# Frontend (pour liens de reset password, etc.)
FRONTEND_URL=http://localhost:5173

# Infos club (variables communes aux templates)
CLUB_NAME=Club Manager
CLUB_WEBSITE=https://clubmanager.com
SUPPORT_EMAIL=support@clubmanager.com
```

### Tester la configuration

```typescript
import { emailService } from '@/infrastructure/services/emailService.js';

const result = await emailService.testerConfiguration();
console.log(result);
// { success: true, message: 'Configuration email OK - 23 templates disponibles' }
```

---

## 🛡️ Fonctionnalités de Robustesse

### 1. Validation automatique

Avant chaque envoi :
- ✅ Format d'email validé (`email@domain.com`)
- ✅ Configuration SendGrid vérifiée
- ✅ Variables manquantes détectées et loggées
- ✅ Variables non remplacées signalées

### 2. Retry automatique

```typescript
// 3 tentatives automatiques avec backoff exponentiel
// Tentative 1 → Échec → Attente 2s
// Tentative 2 → Échec → Attente 4s
// Tentative 3 → Échec → Attente 8s
// → Échec final + fallback si activé
```

**Ne retry PAS si** :
- Email invalide
- Configuration manquante
- Erreur d'authentification SendGrid

### 3. Rate Limiting

Protection contre les abus :
- **50 emails/heure** par destinataire (configurable)
- Cache en mémoire (réinitialisé au redémarrage)
- Logs d'avertissement si limite approchée

```typescript
// Pour ajuster la limite (dans sendgrid-sender.ts)
private readonly maxSendsPerHour: number = 50;
```

### 4. Logs Structurés

Tous les événements sont loggés :

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "SendGridSender",
  "action": "SUCCESS",
  "to": "user@example.com",
  "subject": "Bienvenue",
  "duration": 234,
  "statusCode": 202
}
```

Types d'événements :
- `VALIDATION` : Validation avant envoi
- `SEND` : Tentative d'envoi
- `RETRY` : Nouvelle tentative après échec
- `SUCCESS` : Envoi réussi
- `ERROR` : Erreur fatale

### 5. Fallbacks HTML

Si le template échoue, un HTML inline est utilisé automatiquement :

```typescript
// Fallback automatique pour reset-password
// Fallback automatique pour bienvenue
// Fallback automatique pour confirmation-commande
// etc.
```

### 6. Sauvegarde en base de données

Tous les emails envoyés/échoués sont sauvegardés :

```typescript
// Table: emails
{
  id: 1,
  to: 'user@example.com',
  subject: 'Bienvenue',
  content: '<html>...</html>',
  status: 'SENT', // ou 'FAILED'
  provider: 'sendgrid',
  messageId: 'x-message-id-123',
  utilisateurId: 123,
  error: null, // ou message d'erreur si échec
  createdAt: '2024-01-15T10:30:00.000Z'
}
```

---

## 🔍 Debugging

### 1. Activer les logs détaillés

En développement, les logs sont automatiquement plus verbeux :

```typescript
// .env
NODE_ENV=development  # Logs colorés et détaillés
NODE_ENV=production   # Logs JSON structurés
```

### 2. Tester un envoi

```typescript
const result = await emailClient.sendEmail({
  to: 'test@example.com',
  subject: 'Test',
  message: '<p>Test message</p>',
});

console.log('Success:', result.success);
console.log('MessageId:', result.messageId);
console.log('Error:', result.error);
console.log('Details:', result.details);
```

### 3. Vérifier les templates

```bash
# Script de vérification
npm run email:check-templates

# Résultat attendu :
# ✅ 23 template(s) trouvé(s)
# ✅ bienvenue.html - OK
# ✅ reset-password.html - OK
# ✅ confirmation-commande.html - OK
# ...
```

### 4. Inspecter la base de données

```sql
-- Derniers emails envoyés
SELECT * FROM emails 
WHERE status = 'SENT' 
ORDER BY createdAt DESC 
LIMIT 10;

-- Emails en erreur
SELECT * FROM emails 
WHERE status = 'FAILED' 
ORDER BY createdAt DESC 
LIMIT 10;

-- Statistiques
SELECT 
  status, 
  COUNT(*) as count,
  DATE(createdAt) as date
FROM emails
GROUP BY status, DATE(createdAt)
ORDER BY date DESC;
```

---

## 📊 Monitoring & Stats

### Statistiques d'envoi

```typescript
import { sendGridSender } from '@/infrastructure/external-services/email/sendgrid-sender.js';

const stats = sendGridSender.getStats();
console.log(stats);
// {
//   totalEmailsTracked: 150,
//   emailsInLastHour: 12,
//   topSenders: [
//     { email: 'user1@example.com', count: 5 },
//     { email: 'user2@example.com', count: 3 },
//     ...
//   ]
// }
```

### Réinitialiser le rate limiting

```typescript
// Utile pour les tests
sendGridSender.resetRateLimit();
```

---

## 🚨 Gestion des Erreurs

### Types d'erreurs

```typescript
enum EmailErrorType {
  INVALID_EMAIL = 'INVALID_EMAIL',           // Format email invalide
  SENDGRID_ERROR = 'SENDGRID_ERROR',         // Erreur API SendGrid
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED', // Trop d'envois
  NETWORK_ERROR = 'NETWORK_ERROR',           // Erreur réseau
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR', // Config manquante
  DATABASE_ERROR = 'DATABASE_ERROR',         // Erreur sauvegarde BDD
}
```

### Gérer les erreurs

```typescript
const result = await emailClient.sendEmail({ ... });

if (!result.success) {
  console.error('Erreur:', result.error);
  
  // Vérifier le type d'erreur
  if (result.details?.errorType === 'INVALID_EMAIL') {
    // L'email est invalide, corriger l'adresse
  }
  
  if (result.details?.errorType === 'CONFIGURATION_ERROR') {
    // Vérifier les variables d'environnement
  }
  
  if (result.details?.errorType === 'NETWORK_ERROR') {
    // Problème réseau, réessayer plus tard
  }
}
```

---

## 📚 Migration depuis l'Ancien Système

### Avant (emailTemplateService)

```typescript
// ❌ Ancien système (supprimé)
import { emailTemplateService } from '@/infrastructure/services/emailTemplateService.js';

const template = await emailTemplateService.getTemplateByTitle('bienvenue');
const processed = emailTemplateService.processTemplate(template.content, variables);
await sendGridSender.send(to, processed.subject, processed.html);
```

### Après (emailClient unifié)

```typescript
// ✅ Nouveau système
import { emailClient } from '@/infrastructure/external-services/email/email-client.js';

await emailClient.sendEmail({
  to: 'user@example.com',
  templateTitle: 'bienvenue',
  variables: { userName: 'Jean' },
  saveToDb: true,
  utilisateurId: 123,
});
```

### Changements clés

1. **Plus de templates en mémoire** → Tous les templates sont des fichiers HTML
2. **Plus de `emailTemplateService`** → Utilisez `emailClient` directement
3. **Validation automatique** → Plus besoin de valider manuellement
4. **Retry intégré** → Plus besoin de gérer les tentatives
5. **Rate limiting intégré** → Protection automatique

---

## 🎓 Bonnes Pratiques

### ✅ À FAIRE

- Utiliser `emailClient` pour tous les envois
- Prévisualiser les templates avec `previewTemplate()` en dev
- Toujours fournir `utilisateurId` si disponible
- Activer `saveToDb: true` pour les emails importants
- Utiliser des variables communes via `variablesPreparator`
- Tester les templates après modification

### ❌ À ÉVITER

- Ne pas utiliser `sendGridSender` directement (sauf cas spécial)
- Ne pas hardcoder les URLs dans les templates (utiliser variables)
- Ne pas envoyer d'emails en boucle sans délai (rate limiting)
- Ne pas ignorer les résultats d'envoi (vérifier `result.success`)
- Ne pas stocker d'API keys dans le code (utiliser .env)

---

## 🔗 Liens Utiles

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [HTML Email Best Practices](https://www.campaignmonitor.com/dev-resources/guides/coding/)
- [Email Template Testing Tools](https://www.emailonacid.com/)

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez la configuration : `emailService.testerConfiguration()`
2. Vérifiez les templates : `npm run email:check-templates`
3. Consultez les logs : `SELECT * FROM emails WHERE status = 'FAILED'`
4. Testez en preview : `emailClient.previewTemplate()`

---

**Dernière mise à jour** : Janvier 2024  
**Version du système** : 2.0 (Unifié)