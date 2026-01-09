# TODO - Intégration du Module Commandes

## ✅ Fait

- [x] Refactorisation complète du module commandes
- [x] Architecture en couches (Repository, Service, Façade, GraphQL)
- [x] Types TypeScript complets
- [x] Requêtes SQL paramétrées
- [x] Utilitaires de parsing et validation
- [x] Services métier (commandesService, stockService)
- [x] Façade avec backward compatibility
- [x] Module GraphQL complet (typeDefs + resolvers)
- [x] Documentation exhaustive (README, ARCHITECTURE, guides)
- [x] Exemples de code et d'utilisation

## 🔴 Actions prioritaires (à faire immédiatement)

### 1. Intégrer GraphQL au serveur Apollo

**Fichier** : `api/src/graphql/server.ts`

```typescript
// Ajouter l'import
import { commandesTypeDefs, commandesResolvers } from './commandes/index.js';

// Dans la fusion des typeDefs
const typeDefs = mergeTypeDefs([
  baseTypeDefs,
  authTypeDefs,
  alertesTypeDefs,
  commandesTypeDefs, // 👈 AJOUTER
]);

// Dans la fusion des resolvers
const resolvers = mergeResolvers([
  authResolvers,
  alertesResolvers,
  commandesResolvers, // 👈 AJOUTER
]);
```

**Temps estimé** : 5 minutes

---

### 2. Tester l'API GraphQL

**Actions** :
1. Démarrer le serveur
   ```bash
   npm run dev
   ```

2. Ouvrir Apollo Studio : `http://localhost:4000/graphql`

3. Tester une query simple :
   ```graphql
   query {
     commandes {
       commande_id
       statut
       total
     }
   }
   ```

4. Tester une mutation :
   ```graphql
   mutation {
     createCommande(data: {
       commande_id: "TEST-001"
       utilisateur_id: 1
       total: 99.99
       articles: [{
         article_id: "ART-001"
         nom: "Test"
         quantite: 1
         prix_unitaire: 99.99
         prix_total: 99.99
       }]
     }) {
       commande_id
       statut
     }
   }
   ```

**Temps estimé** : 15 minutes

---

### 3. Mettre à jour les imports dans le code existant (optionnel)

Si vous utilisez déjà `CommandesClient` ailleurs dans le projet :

**Avant** :
```typescript
import { CommandesClient } from '@/db/clients/commandes/commandes.ts';
```

**Après** (recommandé) :
```typescript
import { Commandes } from '@/db/clients/commandes';
// ou
import Commandes from '@/db/clients/commandes';
```

**Note** : L'ancien code continue de fonctionner, cette étape n'est pas obligatoire.

**Temps estimé** : 10 minutes (selon le nombre de fichiers)

---

## 🟡 Actions importantes (court terme - cette semaine)

### 4. Connecter le StockService au vrai module stock

**Fichier** : `api/src/services/commandes/stockService.ts`

**Actions** :
- Remplacer les placeholders par de vraies requêtes
- Intégrer avec le client `stock` existant
- Implémenter les méthodes :
  - `getStockInfo(articleId)`
  - `reserveArticle(articleId, quantite, commandeId)`
  - `releaseArticle(articleId, quantite, commandeId)`
  - `confirmArticleOut(articleId, quantite, commandeId)`
  - `restockArticle(articleId, quantite, commandeId)`

**Exemple** :
```typescript
import { StockClient } from '@/db/clients/stock';

async getStockInfo(articleId: string): Promise<StockArticle | null> {
  const stock = await StockClient.findByArticleId(articleId);
  if (!stock) return null;
  
  return {
    article_id: stock.article_id,
    nom: stock.nom,
    quantite_disponible: stock.quantite,
    quantite_reservee: stock.quantite_reservee || 0,
    seuil_alerte: stock.seuil_alerte || 10,
  };
}
```

**Temps estimé** : 2-3 heures

---

### 5. Écrire les tests

#### Tests unitaires des utils

**Fichier** : `api/src/db/clients/commandes/utils/__tests__/validation.utils.test.ts`

```typescript
import { validateArticle, validateCreateCommandeData } from '../validation.utils';

describe('validateArticle', () => {
  it('should validate a valid article', () => {
    const result = validateArticle({
      article_id: 'ART-001',
      nom: 'T-shirt',
      quantite: 2,
      prix_unitaire: 24.99,
      prix_total: 49.98,
    });
    expect(result.isValid).toBe(true);
  });
  
  it('should reject negative quantity', () => {
    const result = validateArticle({
      article_id: 'ART-001',
      nom: 'T-shirt',
      quantite: -1,
      prix_unitaire: 24.99,
      prix_total: -24.99,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Quantité invalide (doit être un entier positif)');
  });
});
```

#### Tests du service

**Fichier** : `api/src/services/commandes/__tests__/commandesService.test.ts`

```typescript
import { CommandesService } from '../commandesService';

describe('CommandesService', () => {
  let service: CommandesService;
  let mockRepository: any;
  
  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      userExists: jest.fn(),
      exists: jest.fn(),
    };
    
    service = new CommandesService();
    service.repository = mockRepository;
  });
  
  it('should create a commande', async () => {
    mockRepository.userExists.mockResolvedValue(true);
    mockRepository.exists.mockResolvedValue(false);
    mockRepository.create.mockResolvedValue('CMD-123');
    mockRepository.findById.mockResolvedValue({ commande_id: 'CMD-123' });
    
    const result = await service.createCommande({
      commande_id: 'CMD-123',
      utilisateur_id: 1,
      total: 99.99,
      articles: [/* ... */],
    });
    
    expect(result.commande_id).toBe('CMD-123');
  });
});
```

**Temps estimé** : 4-6 heures

---

### 6. Ajouter les notifications email

**Fichier** : `api/src/services/commandes/notificationService.ts` (à créer)

```typescript
import { EmailService } from '@/services/emailService';
import type { Commande } from '@/db/clients/commandes/types';

export class CommandeNotificationService {
  private emailService: EmailService;
  
  constructor() {
    this.emailService = new EmailService();
  }
  
  async notifyCommandeCreated(commande: Commande): Promise<void> {
    await this.emailService.send({
      to: commande.email,
      subject: `Commande ${commande.commande_id} confirmée`,
      template: 'commande-created',
      data: { commande },
    });
  }
  
  async notifyStatusChange(commande: Commande, oldStatus: string): Promise<void> {
    await this.emailService.send({
      to: commande.email,
      subject: `Commande ${commande.commande_id} - Statut mis à jour`,
      template: 'commande-status-changed',
      data: { commande, oldStatus },
    });
  }
}
```

**Intégration dans le service** :
```typescript
// Dans commandesService.ts
import { CommandeNotificationService } from './notificationService';

async createCommande(data: CreateCommandeData): Promise<Commande> {
  const commande = await this.repository.create(data);
  
  // Envoyer la notification
  const notificationService = new CommandeNotificationService();
  await notificationService.notifyCommandeCreated(commande);
  
  return commande;
}
```

**Temps estimé** : 3-4 heures

---

## 🟢 Actions secondaires (moyen terme - ce mois-ci)

### 7. Implémenter DataLoader pour GraphQL

**Fichier** : `api/src/graphql/commandes/dataLoaders.ts` (à créer)

```typescript
import DataLoader from 'dataloader';
import { getCommandesRepository } from '@/db/clients/commandes/commandes.repository';

export function createCommandesDataLoader() {
  return new DataLoader(async (commandeIds: string[]) => {
    const repository = getCommandesRepository();
    const commandes = await Promise.all(
      commandeIds.map(id => repository.findById(id))
    );
    return commandes;
  });
}
```

**Temps estimé** : 2 heures

---

### 8. Ajouter le cache Redis pour les statistiques

**Fichier** : `api/src/services/commandes/cacheService.ts` (à créer)

```typescript
import Redis from 'ioredis';

export class CommandesCacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async getStatistiques() {
    const cached = await this.redis.get('commandes:stats');
    if (cached) return JSON.parse(cached);
    
    const repository = getCommandesRepository();
    const stats = await repository.getStatistiques();
    
    // Cache pendant 5 minutes
    await this.redis.setex('commandes:stats', 300, JSON.stringify(stats));
    
    return stats;
  }
}
```

**Temps estimé** : 2-3 heures

---

### 9. Créer les subscriptions GraphQL (temps réel)

**Fichier** : `api/src/graphql/commandes/commandes.subscriptions.ts` (à créer)

```typescript
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

export const commandesSubscriptions = {
  Subscription: {
    commandeCreated: {
      subscribe: () => pubsub.asyncIterator(['COMMANDE_CREATED']),
    },
    commandeStatusChanged: {
      subscribe: () => pubsub.asyncIterator(['COMMANDE_STATUS_CHANGED']),
    },
  },
};

// Dans le service, publier les événements
export function publishCommandeCreated(commande: Commande) {
  pubsub.publish('COMMANDE_CREATED', { commandeCreated: commande });
}
```

**Temps estimé** : 3-4 heures

---

### 10. Ajouter l'intégration Stripe webhooks

**Fichier** : `api/src/routes/webhooks/stripe.ts`

```typescript
import Stripe from 'stripe';
import { Commandes } from '@/db/clients/commandes';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await Commandes.updateStatut(
        paymentIntent.metadata.commande_id,
        'confirmee'
      );
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await Commandes.updateStatut(
        failedPayment.metadata.commande_id,
        'annulee'
      );
      break;
  }
  
  res.json({ received: true });
}
```

**Temps estimé** : 4-5 heures

---

## 🔵 Actions long terme (ce trimestre)

### 11. Migration vers Prisma

**Actions** :
1. Créer le schéma Prisma pour commandes
2. Créer `PrismaCommandesRepository`
3. Remplacer progressivement le repository SQL
4. Migrer les données

**Temps estimé** : 2-3 jours

---

### 12. Ajouter l'historique des modifications

**Table DB** :
```sql
CREATE TABLE commandes_historique (
  id INT AUTO_INCREMENT PRIMARY KEY,
  commande_id VARCHAR(255) NOT NULL,
  champ_modifie VARCHAR(100),
  ancienne_valeur TEXT,
  nouvelle_valeur TEXT,
  utilisateur_id INT,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (commande_id) REFERENCES commandes(commande_id)
);
```

**Temps estimé** : 1-2 jours

---

### 13. Ajouter les codes promo / réductions

**Extensions du modèle** :
- Table `codes_promo`
- Champ `reduction_appliquee` dans commandes
- Logique de calcul dans le service

**Temps estimé** : 3-4 jours

---

## 📝 Checklist de déploiement

Avant de déployer en production :

- [ ] Tests unitaires passent (>80% coverage)
- [ ] Tests d'intégration passent
- [ ] GraphQL testé manuellement
- [ ] Documentation à jour
- [ ] Variables d'environnement configurées
- [ ] Indexes DB créés
- [ ] Logs configurés
- [ ] Monitoring activé (Sentry, etc.)
- [ ] Rate limiting configuré
- [ ] CORS configuré
- [ ] Backup DB configuré

---

## 🐛 Bugs connus / À vérifier

- [ ] Vérifier la gestion des transactions (créer commande + réserver stock = atomique ?)
- [ ] Tester les cas limites (quantité 0, prix négatif, etc.)
- [ ] Vérifier les permissions GraphQL (qui peut voir quoi ?)
- [ ] Tester la charge (100+ commandes simultanées)
- [ ] Vérifier les race conditions (2 commandes en même temps pour même stock)

---

## 📞 Support

En cas de problème :

1. Consulter la documentation :
   - [README Commandes](./api/src/db/clients/commandes/README.md)
   - [Architecture](./api/src/db/clients/commandes/ARCHITECTURE.md)
   - [Guide GraphQL](./api/src/graphql/commandes/README.md)

2. Vérifier les logs serveur

3. Tester avec Apollo Studio (introspection)

4. Contacter l'équipe dev

---

## 🎯 Métriques de succès

Après intégration complète, vérifier :

- ✅ API GraphQL fonctionnelle (queries + mutations)
- ✅ Tests passent (>80% coverage)
- ✅ Performance acceptable (<200ms pour queries simples)
- ✅ Aucune régression dans l'ancien code
- ✅ Documentation complète et à jour
- ✅ Monitoring activé
- ✅ Zéro bug critique en production

---

**Dernière mise à jour** : 2024
**Version** : 1.0.0
**Statut** : 🟡 En cours d'intégration