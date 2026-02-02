# Email Client - Architecture Refactorisée

## 📁 Structure

```
clients/email/
├── email-client.ts          # Client principal (façade)
├── template-loader.ts       # Chargement et traitement des templates
├── variables-preparator.ts  # Préparation des variables
├── sendgrid-sender.ts       # Service d'envoi SendGrid
├── index.ts                 # Exports
└── __tests__/              # Tests unitaires
    ├── email-client.test.ts
    ├── template-loader.test.ts
    └── variables-preparator.test.ts
```

## 🔧 Utilisation

### Import

```typescript
import { emailClient } from './clients/email';
```

### Email Simple

```typescript
await emailClient.sendEmail({
  to: 'user@example.com',
  subject: 'Bonjour',
  message: '<h1>Hello World</h1>',
  isHtml: true,
  saveToDb: true,
  utilisateurId: 123,
});
```

### Email de Promotion

```typescript
await emailClient.sendPromotionEmail(
  user,
  {
    templateName: 'promotion-professeur',
    variables: {
      customMessage: 'Félicitations pour votre promotion!',
    },
  }
);
```

### Email de Bienvenue

```typescript
await emailClient.sendWelcomeEmail(user);
```

### Email de Confirmation de Commande

```typescript
await emailClient.sendOrderConfirmationEmail(
  'user@example.com',
  userId,
  {
    userName: 'John Doe',
    numeroCommande: 'CMD-12345',
    dateCommande: '24/01/2026',
    statutCommande: 'confirmée',
    nbArticles: '3',
    totalCommande: '49.99',
  }
);
```

## 🧪 Tests

Exécuter les tests :

```bash
npm run test:windows -- clients/__tests__
```

## 📦 Types

Les types sont définis dans `packages/types/src/email.ts` :

- `EmailSendRequest`
- `EmailSendResult`
- `EmailTemplateVariables`
- `PromotionEmailOptions`
- `OrderConfirmationVariables`

## ✅ Avantages du Refactoring

1. **Séparation des responsabilités** : Chaque fichier a une responsabilité unique
2. **Testabilité** : Tests unitaires pour chaque module
3. **Réutilisabilité** : Les modules peuvent être utilisés indépendamment
4. **Maintenabilité** : Code plus court et plus facile à comprendre
5. **Type-safety** : Types centralisés dans `@clubmanager/types`

## 🔄 Migration depuis l'ancien code

Ancien :
```typescript
import { emailClient } from './clients/emailClient';
```

Nouveau :
```typescript
import { emailClient } from './clients/email';
```

L'API reste identique, seule l'implémentation interne a changé.
