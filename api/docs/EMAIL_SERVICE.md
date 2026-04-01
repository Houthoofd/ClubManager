# Service Email - Documentation

## 📧 Vue d'ensemble

Le `EmailService` est une implémentation flexible qui supporte plusieurs fournisseurs d'email :
- **Console** (mode développement par défaut)
- **SendGrid** (service cloud)
- **NodeMailer** (SMTP générique)
- **Custom** (votre service existant)

Le service détecte automatiquement le provider à utiliser en fonction des variables d'environnement configurées.

## 🔧 Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` selon le provider choisi :

#### Option 1 : Mode Console (Développement)
```env
# Aucune configuration requise
# Par défaut, les emails sont affichés dans la console
FRONTEND_URL=http://localhost:3000
```

#### Option 2 : SendGrid
```env
# Configuration SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@clubmanager.com
FRONTEND_URL=http://localhost:3000
```

**Installation requise :**
```bash
npm install @sendgrid/mail
```

#### Option 3 : NodeMailer (SMTP)
```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASSWORD=your_password
FROM_EMAIL=noreply@clubmanager.com
FRONTEND_URL=http://localhost:3000
```

**Installation requise :**
```bash
npm install nodemailer
```

**Exemples de configuration SMTP :**

**Gmail :**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_application
```
⚠️ **Note:** Utilisez un [mot de passe d'application](https://support.google.com/accounts/answer/185833) pour Gmail.

**Outlook/Hotmail :**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@outlook.com
SMTP_PASSWORD=votre_mot_de_passe
```

**Office 365 :**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@votredomaine.com
SMTP_PASSWORD=votre_mot_de_passe
```

#### Option 4 : Service Custom
```env
# Configuration pour votre service existant
CUSTOM_EMAIL_SERVICE=true
FROM_EMAIL=noreply@clubmanager.com
FRONTEND_URL=http://localhost:3000
```

## 🚀 Utilisation

### Dans les Use Cases

Le service est automatiquement injecté via le container :

```typescript
// Exemple dans CreateUserUseCase
const user = await this.userRepository.create(userData);

// Envoi de l'email de bienvenue
await this.emailService.sendWelcomeEmail(
  user.email,
  user.nom,
  verificationToken // optionnel
);
```

### Ajout de nouveaux types d'emails

Pour ajouter un nouveau type d'email (ex: réinitialisation de mot de passe), modifiez l'interface et la classe :

```typescript
// Dans l'interface IEmailService
interface IEmailService {
  sendWelcomeEmail(email: string, name: string, token?: string): Promise<void>;
  sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void>;
}

// Dans la classe EmailService
async sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<void> {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Réinitialisation de votre mot de passe';
    const textContent = this.buildPasswordResetTextContent(name, resetUrl);
    const htmlContent = this.buildPasswordResetHtmlContent(name, resetUrl);

    switch (this.provider) {
      case 'sendgrid':
        await this.sendViaSendGrid(email, subject, textContent, htmlContent);
        break;
      case 'nodemailer':
        await this.sendViaNodeMailer(email, subject, textContent, htmlContent);
        break;
      // ... autres cas
    }
  } catch (error) {
    console.error('❌ [EmailService] Erreur lors de l\'envoi:', error);
  }
}

private buildPasswordResetTextContent(name: string, resetUrl: string): string {
  return `Bonjour ${name},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur ce lien : ${resetUrl}\n\nÀ bientôt,\nL'équipe ClubManager`;
}

private buildPasswordResetHtmlContent(name: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Réinitialisation de mot de passe</h1>
        <p>Bonjour ${name},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Réinitialiser mon mot de passe
        </a>
      </body>
    </html>
  `;
}
```

## 🔍 Détection du Provider

La détection se fait dans l'ordre suivant :

1. **SendGrid** : Si `SENDGRID_API_KEY` est défini
2. **NodeMailer** : Si `SMTP_HOST` est défini
3. **Custom** : Si `CUSTOM_EMAIL_SERVICE=true` est défini
4. **Console** : Par défaut si aucune variable n'est définie

## 📝 Templates Email

### Email de Bienvenue

Le template inclut :
- Message de bienvenue personnalisé avec le nom de l'utilisateur
- Lien de vérification d'email (si un token est fourni)
- Design responsive HTML
- Version texte brut (fallback)

### Personnalisation

Pour personnaliser les templates, modifiez les méthodes `buildTextContent` et `buildHtmlContent` dans la classe `EmailService`.

## 🧪 Tests

### Test en mode Console

Par défaut, sans configuration, les emails sont affichés dans la console :

```bash
npm run dev
# Lors de la création d'un utilisateur, vous verrez :
# 📧 [EmailService] Email envoyé à user@example.com
#    Sujet: Bienvenue sur ClubManager !
#    🔗 Lien de vérification: http://localhost:3000/verify-email?token=xxx
```

### Test avec un vrai provider

1. Configurez les variables d'environnement
2. Créez un utilisateur via l'API
3. Vérifiez la réception de l'email

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "User",
    "email": "test@example.com",
    "motDePasse": "Password123!",
    "role": "participant"
  }'
```

## 🔐 Sécurité

### Bonnes pratiques

1. **Ne jamais commiter les credentials** : Utilisez `.env` et ajoutez-le au `.gitignore`
2. **Utiliser des mots de passe d'application** : Pour Gmail et autres services
3. **TLS/SSL** : Activez `SMTP_SECURE=true` pour les connexions sécurisées
4. **Rate limiting** : Configurez des limites pour éviter le spam
5. **Validation des emails** : Toujours valider les adresses email avant l'envoi

### Variables sensibles

Les variables suivantes ne doivent JAMAIS être commitées :
- `SENDGRID_API_KEY`
- `SMTP_PASSWORD`
- Toute clé d'API ou credential

## 🐛 Dépannage

### Les emails ne sont pas envoyés

1. Vérifiez les logs de la console pour voir quel provider est détecté
2. Vérifiez que les variables d'environnement sont bien chargées :
   ```typescript
   console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Défini' : '❌ Non défini');
   ```

### Erreurs SendGrid

```
Error: Unauthorized
```
➡️ Vérifiez que votre `SENDGRID_API_KEY` est valide et a les permissions d'envoi

### Erreurs SMTP

```
Error: Invalid login
```
➡️ Vérifiez vos identifiants SMTP

```
Error: Connection timeout
```
➡️ Vérifiez le `SMTP_HOST` et `SMTP_PORT`

```
Error: Self signed certificate
```
➡️ Pour les serveurs avec des certificats auto-signés (développement uniquement) :
```typescript
// Dans la configuration NodeMailer
tls: {
  rejectUnauthorized: false
}
```

## 📚 Ressources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [NodeMailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Email Best Practices](https://sendgrid.com/blog/email-best-practices/)

## 🎯 Roadmap

Fonctionnalités à venir :
- [ ] Support des templates avec variables dynamiques
- [ ] File d'attente pour les envois massifs
- [ ] Retry automatique en cas d'échec
- [ ] Webhooks pour le tracking (ouvertures, clics)
- [ ] Support des pièces jointes
- [ ] Multi-langues automatique

## 💡 Contribution

Pour améliorer le service email :

1. Ajoutez de nouveaux providers dans la détection
2. Créez de nouveaux templates
3. Améliorez la gestion d'erreurs
4. Ajoutez des tests unitaires

Exemple d'ajout d'un provider (Mailgun) :

```typescript
constructor() {
  if (process.env.MAILGUN_API_KEY) {
    this.provider = 'mailgun';
  } else if (process.env.SENDGRID_API_KEY) {
    this.provider = 'sendgrid';
  }
  // ... etc
}

private async sendViaMailgun(
  email: string,
  subject: string,
  text: string,
  html: string
): Promise<void> {
  // Implémentation Mailgun
}
```
