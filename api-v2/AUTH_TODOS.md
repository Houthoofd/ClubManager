# Auth Module - TODOs et Résolution

## 📋 Résumé

Ce document liste tous les TODOs du module Auth et fournit un guide de résolution.

**Statut global** : ✅ Module fonctionnel - TODOs non-bloquants  
**TODOs totaux** : 6  
**TODOs bloquants** : 0  
**TODOs optionnels** : 6

---

## 🎯 TODOs par priorité

### 🔴 Priorité HAUTE (Fonctionnalités importantes)

#### TODO #1 : Envoi email reset password

**Fichier** : `src/core/use-cases/auth/account/RequestPasswordResetUseCase.ts:107`

**Code actuel** :
```typescript
// TODO: Envoyer l'email avec le lien de réinitialisation
// Dans une implémentation complète, on utiliserait un événement ou un service d'email
// Exemple: await this.emailService.sendPasswordResetEmail(user.email, resetToken);
```

**Impact** :
- ❌ Le token de reset est créé mais PAS envoyé par email
- ⚠️ Actuellement le token est retourné dans la réponse API (dev only)
- 🔒 En production, l'utilisateur ne peut pas recevoir le lien

**Statut actuel** :
- ✅ Interface `IEmailService` créée
- ⏳ Implémentation du service email en attente
- ⏳ Intégration dans le use case en attente

**Résolution** :

1. **Créer l'implémentation EmailService** :

```typescript
// infrastructure/services/EmailService.ts
import { IEmailService, PasswordResetEmailData } from '../../core/domain/interfaces/auth/index.js';

export class EmailService implements IEmailService {
  private frontendUrl: string;
  
  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }
  
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    const resetLink = `${this.frontendUrl}/reset-password?token=${data.resetToken}`;
    
    const subject = 'Réinitialisation de votre mot de passe';
    const html = `
      <h1>Bonjour ${data.firstName},</h1>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Ce lien expire dans ${data.expiresInHours} heure(s).</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    `;
    
    // Mode développement : console
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 [Email] Password Reset');
      console.log(`   To: ${data.email}`);
      console.log(`   Link: ${resetLink}`);
      return;
    }
    
    // Production : utiliser le provider configuré (SendGrid, NodeMailer, etc.)
    await this.sendEmail(data.email, subject, html);
  }
  
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    // TODO: Implémenter
  }
  
  async sendEmailVerification(data: EmailVerificationData): Promise<void> {
    // TODO: Implémenter
  }
  
  async sendPasswordChangedNotification(data: PasswordChangedEmailData): Promise<void> {
    // TODO: Implémenter
  }
  
  async sendNewLoginNotification(email: string, firstName: string, loginData: any): Promise<void> {
    // TODO: Implémenter
  }
  
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    // Utiliser SendGrid, NodeMailer, ou autre provider
    throw new Error('Email provider not configured');
  }
}
```

2. **Mettre à jour le Use Case** :

```typescript
// RequestPasswordResetUseCase.ts
export class RequestPasswordResetUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private passwordResetTokenRepository: IPasswordResetTokenRepository,
    private securityRepository: ISecurityRepository,
    private emailService: IEmailService  // ✅ Ajouter la dépendance
  ) {}
  
  async execute(input: RequestPasswordResetInput): Promise<RequestPasswordResetResponse> {
    // ... code existant ...
    
    // ✅ Envoyer l'email
    await this.emailService.sendPasswordResetEmail({
      email: user.email,
      firstName: user.firstName,
      resetToken: resetToken.getValue(),
      expiresInHours: 1
    });
    
    // ❌ NE PLUS retourner le token en production
    return {
      success: true,
      message: 'Si cet email existe, un lien de récupération a été envoyé',
      // resetToken: undefined  // Ne jamais retourner en production
    };
  }
}
```

3. **Mettre à jour le Container** :

```typescript
// container.ts
private _emailService: IEmailService | null = null;

get emailService(): IEmailService {
  if (!this._emailService) {
    this._emailService = new EmailService();
    console.log('✅ [Container] EmailService instancié');
  }
  return this._emailService;
}

get requestPasswordResetUseCase(): RequestPasswordResetUseCase {
  if (!this._requestPasswordResetUseCase) {
    this._requestPasswordResetUseCase = new RequestPasswordResetUseCase(
      this.authRepository,
      this.passwordResetTokenRepository,
      this.securityRepository,
      this.emailService  // ✅ Injecter
    );
    console.log('✅ [Container] RequestPasswordResetUseCase instancié');
  }
  return this._requestPasswordResetUseCase;
}
```

**Temps estimé** : 2-3 heures  
**Dépendances** : Choix du provider email (SendGrid, NodeMailer, AWS SES)

---

### 🟡 Priorité MOYENNE (Améliorations)

#### TODO #2 : Implémenter SendGrid

**Fichier** : `src/container.ts:223`

**Impact** : Permet l'envoi d'emails en production via SendGrid

**Résolution** :

1. Installer SendGrid :
```bash
npm install @sendgrid/mail
npm install --save-dev @types/sendgrid__mail
```

2. Configurer `.env` :
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxx
FROM_EMAIL=noreply@clubmanager.com
```

3. Implémenter dans EmailService :
```typescript
import sgMail from '@sendgrid/mail';

class EmailService implements IEmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }
  
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('⚠️ SendGrid API key not configured');
      return;
    }
    
    await sgMail.send({
      to,
      from: process.env.FROM_EMAIL || 'noreply@clubmanager.com',
      subject,
      html,
    });
  }
}
```

**Temps estimé** : 1 heure  
**Coût** : SendGrid gratuit jusqu'à 100 emails/jour

---

#### TODO #3 : Implémenter NodeMailer

**Fichier** : `src/container.ts:243`

**Impact** : Permet l'envoi d'emails via SMTP (plus flexible que SendGrid)

**Résolution** :

1. Installer NodeMailer :
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

2. Configurer `.env` :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@clubmanager.com
```

3. Implémenter dans EmailService :
```typescript
import nodemailer from 'nodemailer';

class EmailService implements IEmailService {
  private transporter?: nodemailer.Transporter;
  
  constructor() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
  }
  
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      console.warn('⚠️ SMTP not configured');
      return;
    }
    
    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@clubmanager.com',
      to,
      subject,
      html,
    });
  }
}
```

**Temps estimé** : 1 heure  
**Coût** : Gratuit (utilise votre propre serveur SMTP)

---

### 🟢 Priorité BASSE (Nice to have)

#### TODO #4 : Email de bienvenue après inscription

**Impact** : Meilleure expérience utilisateur

**Résolution** :
Ajouter dans `RegisterUseCase.ts` :

```typescript
// Après création utilisateur
await this.emailService.sendWelcomeEmail({
  email: user.email,
  firstName: user.firstName,
  verificationToken: verificationToken?.getValue()
});
```

**Temps estimé** : 30 minutes

---

#### TODO #5 : Email de notification changement mot de passe

**Impact** : Sécurité - notifie l'utilisateur si quelqu'un change son mot de passe

**Résolution** :
Ajouter dans `ChangePasswordUseCase.ts` et `ResetPasswordUseCase.ts` :

```typescript
// Après changement mot de passe
await this.emailService.sendPasswordChangedNotification({
  email: user.email,
  firstName: user.firstName,
  changedAt: new Date(),
  ipAddress: metadata?.ipAddress
});
```

**Temps estimé** : 30 minutes

---

#### TODO #6 : Vérification d'email

**Fichier** : `src/routes/auth/core/handlers/confirm-email.handler.ts:5`

**Impact** : Permet de vérifier l'email après inscription

**Résolution** :

1. Créer `VerifyEmailUseCase` :
```typescript
export class VerifyEmailUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private emailVerificationTokenRepository: IEmailVerificationTokenRepository
  ) {}
  
  async execute(token: string): Promise<{ success: boolean; message: string }> {
    // Vérifier le token
    const tokenEntity = await this.emailVerificationTokenRepository.findByToken(token);
    if (!tokenEntity || tokenEntity.isExpired()) {
      throw AuthError.expiredToken('Token de vérification');
    }
    
    // Mettre à jour l'utilisateur
    await this.authRepository.markEmailAsVerified(tokenEntity.userId);
    
    // Marquer le token comme utilisé
    await this.emailVerificationTokenRepository.markAsUsed(tokenEntity.id);
    
    return { success: true, message: 'Email vérifié avec succès' };
  }
}
```

**Temps estimé** : 2 heures

---

## 📊 Résumé des actions

### Immédiat (Sprint actuel)
- [x] ✅ Interface IEmailService créée
- [ ] ⏳ Implémenter EmailService de base (TODO #1)
- [ ] ⏳ Intégrer dans RequestPasswordResetUseCase
- [ ] ⏳ Tester l'envoi d'email en dev

### Court terme (1-2 semaines)
- [ ] Choisir provider email (SendGrid vs NodeMailer)
- [ ] Implémenter provider choisi (TODO #2 ou #3)
- [ ] Ajouter templates email HTML professionnels
- [ ] Tester en production

### Moyen terme (1 mois)
- [ ] Email de bienvenue (TODO #4)
- [ ] Email notification changement password (TODO #5)
- [ ] Vérification d'email (TODO #6)
- [ ] Notification nouvelle connexion

### Long terme (Backlog)
- [ ] Templates email avec variables (Handlebars/Pug)
- [ ] Préférences de notification utilisateur
- [ ] Emails multilingues (i18n)
- [ ] Analytics emails (ouverture, clics)

---

## 🔧 Configuration requise

### Variables d'environnement à ajouter

```env
# Frontend URL (pour les liens dans les emails)
FRONTEND_URL=https://clubmanager.com

# Email générique
FROM_EMAIL=noreply@clubmanager.com

# Option 1: SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxx

# Option 2: SMTP (NodeMailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Option 3: AWS SES
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=xxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxx
```

---

## ✅ Checklist de résolution

### Phase 1 : Fonctionnement de base (2-3 heures)
- [ ] Créer `infrastructure/services/EmailService.ts`
- [ ] Implémenter `sendPasswordResetEmail()`
- [ ] Ajouter `IEmailService` au Container
- [ ] Mettre à jour `RequestPasswordResetUseCase`
- [ ] Tester en mode console (dev)
- [ ] Vérifier que le lien fonctionne côté frontend

### Phase 2 : Production (1-2 heures)
- [ ] Choisir provider (SendGrid recommandé pour simplicité)
- [ ] Installer dépendances
- [ ] Configurer variables d'environnement
- [ ] Implémenter méthode `sendEmail()` avec provider
- [ ] Tester envoi réel en staging
- [ ] Déployer en production

### Phase 3 : Amélioration (2-3 heures)
- [ ] Créer templates HTML professionnels
- [ ] Ajouter logo et branding
- [ ] Implémenter autres notifications email
- [ ] Ajouter gestion d'erreurs robuste
- [ ] Logger les envois d'emails (audit)

---

## 🎯 Recommandations

### Provider email recommandé : **SendGrid**

**Pourquoi SendGrid ?**
- ✅ Simple à configurer (1 clé API)
- ✅ Gratuit jusqu'à 100 emails/jour (suffisant pour démarrer)
- ✅ Excellent deliverability
- ✅ Dashboard analytics
- ✅ Templates visuels
- ✅ Support technique

**Alternative : NodeMailer + Gmail**
- ✅ Gratuit illimité
- ✅ Pas de dépendance externe
- ⚠️ Limite 500 emails/jour (Gmail)
- ⚠️ Risque de spam filter
- ⚠️ Configuration plus complexe

### Templates email recommandés

Utiliser un framework de templates email responsive :
- **MJML** (recommandé) - Markup pour emails responsive
- **Foundation for Emails** - Framework Zurb
- **Maizzle** - Tailwind CSS pour emails

---

## 📝 Notes importantes

1. **Sécurité** : Ne JAMAIS retourner le reset token dans la réponse API en production
2. **Rate Limiting** : Déjà implémenté (3 tentatives / 15 min)
3. **Logs** : Logger tous les envois d'emails pour audit
4. **Tests** : Tester l'envoi en dev ET staging avant production
5. **Fallback** : Avoir un plan B si le provider email est down

---

## 🐛 Dépannage

### Email non reçu
1. Vérifier spam/courrier indésirable
2. Vérifier configuration SMTP/API key
3. Vérifier logs serveur
4. Tester avec un autre email

### Erreur SendGrid
- Vérifier API key valide
- Vérifier sender email vérifié dans SendGrid
- Vérifier quota non dépassé

### Erreur NodeMailer
- Vérifier credentials SMTP
- Vérifier firewall/port ouvert
- Activer "Less secure apps" (Gmail)
- Utiliser App Password au lieu du mot de passe

---

**Dernière mise à jour** : 2024  
**Statut** : ✅ Module fonctionnel - TODOs optionnels  
**Prochaine révision** : Après implémentation EmailService