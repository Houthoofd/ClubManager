# 🔌 Implémentations Complètes - Service Email

Ce document contient les implémentations **prêtes à l'emploi** pour SendGrid et NodeMailer. Copiez-collez directement dans votre code !

---

## 📮 SendGrid - Implémentation Complète

### Étape 1 : Installation

```bash
npm install @sendgrid/mail
npm install --save-dev @types/sendgrid__mail
```

### Étape 2 : Configuration `.env`

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@clubmanager.com
FRONTEND_URL=http://localhost:3000
```

### Étape 3 : Code à décommenter dans `container.ts`

Remplacez la méthode `sendViaSendGrid()` par :

```typescript
private async sendViaSendGrid(
  email: string,
  subject: string,
  text: string,
  html: string,
): Promise<void> {
  const sgMail = await import('@sendgrid/mail');
  sgMail.default.setApiKey(process.env.SENDGRID_API_KEY!);
  
  try {
    await sgMail.default.send({
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@clubmanager.com',
      subject,
      text,
      html,
    });
    console.log(`✅ [EmailService/SendGrid] Email envoyé à ${email}`);
  } catch (error: any) {
    console.error(`❌ [EmailService/SendGrid] Erreur:`, error.response?.body || error);
    throw error;
  }
}
```

### Version avec gestion d'erreurs avancée

```typescript
private async sendViaSendGrid(
  email: string,
  subject: string,
  text: string,
  html: string,
): Promise<void> {
  try {
    const sgMail = await import('@sendgrid/mail');
    sgMail.default.setApiKey(process.env.SENDGRID_API_KEY!);
    
    const message = {
      to: email,
      from: {
        email: process.env.FROM_EMAIL || 'noreply@clubmanager.com',
        name: 'ClubManager'
      },
      subject,
      text,
      html,
      // Options avancées
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
      replyTo: process.env.REPLY_TO_EMAIL || undefined,
    };
    
    const [response] = await sgMail.default.send(message);
    
    console.log(`✅ [EmailService/SendGrid] Email envoyé à ${email}`);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Message ID: ${response.headers['x-message-id']}`);
    
  } catch (error: any) {
    console.error(`❌ [EmailService/SendGrid] Erreur lors de l'envoi à ${email}`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.statusCode}`);
      console.error(`   Body:`, error.response.body);
      
      // Erreurs spécifiques
      if (error.response.statusCode === 401) {
        console.error('   → Clé API invalide ou expirée');
      } else if (error.response.statusCode === 403) {
        console.error('   → Permissions insuffisantes');
      } else if (error.response.statusCode === 413) {
        console.error('   → Email trop volumineux');
      }
    } else {
      console.error(`   Message:`, error.message);
    }
    
    throw error;
  }
}
```

### Test SendGrid

```typescript
// Fichier: test-sendgrid.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const testEmail = async () => {
  try {
    await sgMail.send({
      to: 'votre-email@example.com',
      from: process.env.FROM_EMAIL || 'noreply@clubmanager.com',
      subject: 'Test SendGrid',
      text: 'Ceci est un email de test',
      html: '<strong>Ceci est un email de test</strong>',
    });
    console.log('✅ Email de test envoyé avec succès !');
  } catch (error: any) {
    console.error('❌ Erreur:', error.response?.body || error);
  }
};

testEmail();
```

Exécutez :
```bash
npx tsx test-sendgrid.ts
```

---

## 📧 NodeMailer - Implémentation Complète

### Étape 1 : Installation

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Étape 2 : Configuration `.env`

#### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
FROM_EMAIL=votre.email@gmail.com
FRONTEND_URL=http://localhost:3000
```

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@outlook.com
SMTP_PASSWORD=votre_mot_de_passe
FROM_EMAIL=votre.email@outlook.com
FRONTEND_URL=http://localhost:3000
```

#### Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@votredomaine.com
SMTP_PASSWORD=votre_mot_de_passe
FROM_EMAIL=votre.email@votredomaine.com
FRONTEND_URL=http://localhost:3000
```

#### Serveur SMTP Custom
```env
SMTP_HOST=smtp.votreserveur.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=username
SMTP_PASSWORD=password
FROM_EMAIL=noreply@votredomaine.com
FRONTEND_URL=http://localhost:3000
```

### Étape 3 : Code à décommenter dans `container.ts`

Remplacez la méthode `sendViaNodeMailer()` par :

```typescript
private async sendViaNodeMailer(
  email: string,
  subject: string,
  text: string,
  html: string,
): Promise<void> {
  const nodemailer = await import('nodemailer');
  
  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
  });
  
  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@clubmanager.com',
      to: email,
      subject,
      text,
      html,
    });
    console.log(`✅ [EmailService/NodeMailer] Email envoyé à ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ [EmailService/NodeMailer] Erreur:`, error);
    throw error;
  }
}
```

### Version avec gestion d'erreurs avancée

```typescript
private async sendViaNodeMailer(
  email: string,
  subject: string,
  text: string,
  html: string,
): Promise<void> {
  try {
    const nodemailer = await import('nodemailer');
    
    const transportConfig: any = {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASSWORD!,
      },
      // Options avancées
      pool: true, // Utiliser un pool de connexions
      maxConnections: 5,
      maxMessages: 100,
    };
    
    // Pour Gmail spécifiquement
    if (process.env.SMTP_HOST?.includes('gmail')) {
      transportConfig.service = 'gmail';
    }
    
    // Pour le développement avec certificats auto-signés (à éviter en prod)
    if (process.env.NODE_ENV === 'development') {
      transportConfig.tls = {
        rejectUnauthorized: false,
      };
    }
    
    const transporter = nodemailer.default.createTransport(transportConfig);
    
    // Vérifier la connexion avant d'envoyer
    await transporter.verify();
    console.log(`✅ [EmailService/NodeMailer] Connexion SMTP vérifiée`);
    
    const mailOptions = {
      from: {
        name: 'ClubManager',
        address: process.env.FROM_EMAIL || 'noreply@clubmanager.com',
      },
      to: email,
      subject,
      text,
      html,
      // Options avancées
      replyTo: process.env.REPLY_TO_EMAIL || undefined,
      priority: 'normal',
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ [EmailService/NodeMailer] Email envoyé à ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    
  } catch (error: any) {
    console.error(`❌ [EmailService/NodeMailer] Erreur lors de l'envoi à ${email}`);
    console.error(`   Message:`, error.message);
    
    // Erreurs spécifiques
    if (error.code === 'EAUTH') {
      console.error('   → Authentification échouée - Vérifiez SMTP_USER et SMTP_PASSWORD');
    } else if (error.code === 'ECONNECTION') {
      console.error('   → Connexion impossible - Vérifiez SMTP_HOST et SMTP_PORT');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   → Timeout - Le serveur SMTP ne répond pas');
    }
    
    throw error;
  }
}
```

### Version avec singleton (optimisé)

Si vous envoyez beaucoup d'emails, utilisez un singleton pour réutiliser le transporter :

```typescript
class EmailService implements IEmailService {
  private readonly provider: "console" | "sendgrid" | "nodemailer" | "custom";
  private nodemailerTransporter?: any; // Singleton pour NodeMailer
  
  constructor() {
    // ... détection du provider
  }
  
  private async getNodeMailerTransporter() {
    if (this.nodemailerTransporter) {
      return this.nodemailerTransporter;
    }
    
    const nodemailer = await import('nodemailer');
    
    this.nodemailerTransporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASSWORD!,
      },
      pool: true,
    });
    
    // Vérifier la connexion
    await this.nodemailerTransporter.verify();
    console.log(`✅ [EmailService/NodeMailer] Transporter créé et vérifié`);
    
    return this.nodemailerTransporter;
  }
  
  private async sendViaNodeMailer(
    email: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<void> {
    try {
      const transporter = await this.getNodeMailerTransporter();
      
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@clubmanager.com',
        to: email,
        subject,
        text,
        html,
      });
      
      console.log(`✅ [EmailService/NodeMailer] Email envoyé à ${email} (${info.messageId})`);
    } catch (error) {
      console.error(`❌ [EmailService/NodeMailer] Erreur:`, error);
      throw error;
    }
  }
}
```

### Test NodeMailer

```typescript
// Fichier: test-nodemailer.ts
import nodemailer from 'nodemailer';

const testEmail = async () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
  });
  
  try {
    // Vérifier la connexion
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie');
    
    // Envoyer un email de test
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: 'votre-email@example.com',
      subject: 'Test NodeMailer',
      text: 'Ceci est un email de test',
      html: '<strong>Ceci est un email de test</strong>',
    });
    
    console.log('✅ Email de test envoyé avec succès !');
    console.log('   Message ID:', info.messageId);
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  }
};

testEmail();
```

Exécutez :
```bash
npx tsx test-nodemailer.ts
```

---

## 🔧 Service Custom - Implémentation avec messageClient

Si vous avez déjà un service existant comme `messageClient` :

```typescript
private async sendViaCustomService(
  email: string,
  subject: string,
  text: string,
  html: string,
): Promise<void> {
  try {
    // Importer votre client existant
    const { messageClient } = await import('./db/clients/messagerie/messageClient.js');
    
    // Adapter selon l'API de votre service
    await messageClient.envoyerEmail({
      destinataire: email,
      sujet: subject,
      contenuTexte: text,
      contenuHtml: html,
      expediteur: process.env.FROM_EMAIL || 'noreply@clubmanager.com',
    });
    
    console.log(`✅ [EmailService/Custom] Email envoyé via messageClient à ${email}`);
  } catch (error) {
    console.error(`❌ [EmailService/Custom] Erreur:`, error);
    throw error;
  }
}
```

---

## 🧪 Tests Complets

### Test avec Jest

```typescript
// Fichier: __tests__/EmailService.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('EmailService', () => {
  let emailService: EmailService;
  
  beforeEach(() => {
    emailService = new EmailService();
  });
  
  describe('sendWelcomeEmail', () => {
    it('devrait envoyer un email de bienvenue sans token', async () => {
      await expect(
        emailService.sendWelcomeEmail('test@example.com', 'Jean Dupont')
      ).resolves.not.toThrow();
    });
    
    it('devrait envoyer un email de bienvenue avec token', async () => {
      await expect(
        emailService.sendWelcomeEmail('test@example.com', 'Jean Dupont', 'token123')
      ).resolves.not.toThrow();
    });
    
    it('ne devrait pas crasher si l\'envoi échoue', async () => {
      // Mock qui échoue
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // L'erreur est capturée, pas de throw
      await expect(
        emailService.sendWelcomeEmail('invalid@', 'Test')
      ).resolves.not.toThrow();
    });
  });
});
```

### Test d'intégration

```typescript
// Fichier: test-email-integration.ts
import 'dotenv/config';

const testEmailService = async () => {
  console.log('🧪 Test du Service Email\n');
  
  // Vérifier les variables d'environnement
  console.log('📋 Variables d\'environnement:');
  console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Défini' : '❌ Non défini');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST ? '✅ Défini' : '❌ Non défini');
  console.log('   FROM_EMAIL:', process.env.FROM_EMAIL || '❌ Non défini');
  console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || '❌ Non défini');
  console.log('');
  
  // Créer le service
  const { container } = await import('./container.js');
  const emailService = container.emailService;
  
  // Test 1: Email sans token
  console.log('📧 Test 1: Email de bienvenue sans token...');
  try {
    await emailService.sendWelcomeEmail(
      'test@example.com',
      'Jean Test'
    );
    console.log('✅ Test 1 réussi\n');
  } catch (error) {
    console.error('❌ Test 1 échoué:', error);
  }
  
  // Test 2: Email avec token
  console.log('📧 Test 2: Email de bienvenue avec token...');
  try {
    await emailService.sendWelcomeEmail(
      'test@example.com',
      'Jean Test',
      'test-token-123'
    );
    console.log('✅ Test 2 réussi\n');
  } catch (error) {
    console.error('❌ Test 2 échoué:', error);
  }
  
  console.log('✅ Tests terminés !');
};

testEmailService();
```

Exécutez :
```bash
npx tsx test-email-integration.ts
```

---

## 🚀 Migration Pas-à-Pas

### De Console vers SendGrid

1. **Installer SendGrid**
   ```bash
   npm install @sendgrid/mail
   ```

2. **Obtenir la clé API**
   - Inscrivez-vous sur sendgrid.com
   - Créez une clé API
   - Copiez-la

3. **Configurer `.env`**
   ```env
   SENDGRID_API_KEY=SG.votre_cle
   FROM_EMAIL=noreply@clubmanager.com
   ```

4. **Décommenter le code**
   Remplacez le contenu de `sendViaSendGrid()` par le code ci-dessus

5. **Tester**
   ```bash
   npm run dev
   # Créer un utilisateur et vérifier l'email
   ```

### De Console vers NodeMailer (Gmail)

1. **Installer NodeMailer**
   ```bash
   npm install nodemailer
   ```

2. **Obtenir un mot de passe d'application Gmail**
   - Activer 2FA sur Gmail
   - Générer un mot de passe d'application
   - Copier le mot de passe (16 caractères)

3. **Configurer `.env`**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=votre@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   FROM_EMAIL=votre@gmail.com
   ```

4. **Décommenter le code**
   Remplacez le contenu de `sendViaNodeMailer()` par le code ci-dessus

5. **Tester**
   ```bash
   npm run dev
   # Créer un utilisateur et vérifier l'email
   ```

---

## 📊 Comparaison des Providers

| Critère | Console | SendGrid | NodeMailer | Custom |
|---------|---------|----------|------------|--------|
| Facilité | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Variable |
| Coût | Gratuit | Freemium | Gratuit | Variable |
| Fiabilité | N/A | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Variable |
| Analytics | ❌ | ✅ | ❌ | Variable |
| Scalabilité | N/A | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Variable |
| Setup | Aucun | 5 min | 10 min | Variable |

---

## 🎯 Recommandations

### Pour le Développement Local
👉 **Utilisez Console** (par défaut, aucune config)

### Pour le Staging/Tests
👉 **Utilisez NodeMailer avec Gmail** (gratuit, facile à configurer)

### Pour la Production
👉 **Utilisez SendGrid** (professionnel, fiable, analytics)

---

## 🔐 Checklist Sécurité

- [ ] `.env` dans `.gitignore`
- [ ] Pas de credentials hardcodés
- [ ] Mots de passe d'application pour Gmail (pas le vrai mot de passe)
- [ ] Clés API avec permissions minimales
- [ ] TLS/SSL activé en production
- [ ] Rate limiting configuré
- [ ] Logs sans credentials sensibles

---

## 🆘 Support

En cas de problème, vérifiez :

1. **Les variables d'environnement sont-elles chargées ?**
   ```typescript
   console.log('SendGrid:', !!process.env.SENDGRID_API_KEY);
   console.log('SMTP:', !!process.env.SMTP_HOST);
   ```

2. **Le provider est-il correctement détecté ?**
   Regardez les logs au démarrage : `📧 [EmailService] Initialisé avec provider: xxx`

3. **Les credentials sont-ils valides ?**
   Testez avec les scripts de test fournis ci-dessus

4. **Y a-t-il des erreurs dans les logs ?**
   Cherchez les `❌` dans la console

---

**Bon envoi d'emails ! 🚀📧**