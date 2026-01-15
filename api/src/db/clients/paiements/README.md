# Module Paiements - ClubManager API

Ce module gère l'ensemble des paiements, échéances et commandes de l'application ClubManager.

## Vue d'ensemble

Le module Paiements suit une **architecture modulaire** avec séparation des responsabilités :

- **Repository Pattern** : Accès aux données via un repository centralisé
- **Type Safety** : TypeScript complet avec types stricts
- **Validation** : Vérifications automatiques des opérations
- **Legacy Support** : Compatibilité avec l'ancien code

## Structure du Module

```
paiements/
├── docs/                        # Documentation (à compléter)
├── queries/
│   ├── read.queries.ts          # Requêtes SELECT
│   ├── write.queries.ts         # Requêtes INSERT/UPDATE/DELETE
│   ├── validation.queries.ts    # Requêtes de validation
│   └── index.ts                 # Export centralisé
├── repositories/                # Repositories modulaires (à implémenter)
├── utils/                       # Utilitaires (à développer)
├── paiements.repository.ts      # Repository principal
├── types.ts                     # Types TypeScript
├── queries.ts                   # Fichier de compatibilité
├── index.ts                     # Point d'entrée du module
├── paiements.ts                 # Client legacy
└── README.md                    # Ce fichier
```

## Installation / Import

### Import du Repository Principal

```typescript
import { getPaiementsRepository } from '@/db/clients/paiements';

const paiementsRepo = getPaiementsRepository();
```

### Import des Types

```typescript
import type {
  Paiement,
  EcheancePaiement,
  CreatePaiementData,
  ConfirmationResult
} from '@/db/clients/paiements';
```

## Fonctionnalités

### 1. Paiements

#### Récupérer tous les paiements

```typescript
const paiements = await paiementsRepo.obtenirLesTousLesPaiements();
```

#### Récupérer les paiements d'un utilisateur

```typescript
const paiements = await paiementsRepo.obtenirPaiementsParUtilisateur(userId);
```

#### Créer un paiement

```typescript
const result = await paiementsRepo.creerPaiement({
  utilisateur_id: 1,
  montant: 50.00,
  methode_paiement: 'carte',
  statut: 'valide',
  stripe_payment_intent_id: 'pi_123',
  abonnement_id: 1
});

if (result.isConfirm) {
  console.log('Paiement créé avec ID:', result.id);
}
```

#### Modifier un paiement

```typescript
const result = await paiementsRepo.modifierPaiement(paiementId, {
  montant: 60.00,
  statut: 'valide',
  notes: 'Paiement ajusté'
});
```

#### Annuler un paiement

```typescript
const result = await paiementsRepo.annulerPaiement(paiementId);
```

### 2. Échéances

#### Récupérer les échéances d'un utilisateur

```typescript
const echeances = await paiementsRepo.obtenirEcheancesUtilisateur(userId);

echeances.forEach(echeance => {
  console.log(`${echeance.montant}€ - ${echeance.date_echeance} - ${echeance.statut}`);
});
```

#### Marquer une échéance comme payée

```typescript
const result = await paiementsRepo.marquerEcheancePayee(echeanceId);

if (result.isConfirm) {
  console.log('Échéance marquée comme payée');
}
```

#### Mettre à jour le statut d'une échéance

```typescript
const result = await paiementsRepo.mettreAJourStatutEcheance(
  echeanceId,
  'en_retard'
);
```

### 3. Commandes

#### Créer une commande avec articles

```typescript
const result = await paiementsRepo.creerCommande({
  utilisateur_id: 1,
  montant_total: 120.50,
  statut: 'en_attente',
  articles: [
    {
      article_id: 10,
      quantite: 2,
      prix_unitaire: 50.00
    },
    {
      article_id: 15,
      quantite: 1,
      prix_unitaire: 20.50
    }
  ]
});
```

#### Traiter une commande après paiement

```typescript
const result = await paiementsRepo.traiterCommandeApresPayment(paiementId);
```

### 4. Stripe

#### Récupérer les détails d'un paiement Stripe

```typescript
const result = await paiementsRepo.obtenirDetailsPaiementStripe(paymentIntentId);

if (result.isFind) {
  console.log('Paiement:', result.data);
}
```

#### Confirmer un paiement Stripe

```typescript
const result = await paiementsRepo.confirmerPaiementStripe(
  paiementId,
  stripeChargeId,
  'valide'
);
```

### 5. Utilitaires

#### Vérifier si c'est le premier paiement

```typescript
const result = await paiementsRepo.estPremierPaiement(userId);

if (result.isPremier) {
  console.log('Premier paiement de cet utilisateur!');
}
```

#### Diagnostiquer un paiement

```typescript
const diagnostic = await paiementsRepo.diagnostiquerPaiement(paymentIntentId);

console.log('Problèmes détectés:', diagnostic.data.problemes_detectes);
console.log('Suggestions:', diagnostic.data.suggestions);
```

## Types Principaux

### Paiement

```typescript
interface Paiement {
  id: number;
  utilisateur_id: number;
  montant: number;
  date_paiement: Date | string;
  methode_paiement: string;
  statut: string;
  stripe_payment_intent_id?: string | null;
  abonnement_id?: number | null;
  commande_id?: number | null;
  echeance_id?: number | null;
  created_at?: Date | string;
}
```

### EcheancePaiement

```typescript
interface EcheancePaiement {
  id: number;
  utilisateur_id: number;
  montant: number;
  date_echeance: Date | string;
  statut: string;
  description?: string | null;
  abonnement_id?: number | null;
  created_at?: Date | string;
}
```

### Commande

```typescript
interface Commande {
  id: number;
  utilisateur_id: number;
  montant_total: number;
  statut: string;
  date_commande: Date | string;
  paiement_id?: number | null;
  notes?: string | null;
  created_at?: Date | string;
}
```

## Enums

### StatutPaiement

```typescript
enum StatutPaiement {
  EN_ATTENTE = "en_attente",
  VALIDE = "valide",
  REFUSE = "refuse",
  ANNULE = "annule",
  REMBOURSE = "rembourse",
}
```

### StatutEcheance

```typescript
enum StatutEcheance {
  EN_ATTENTE = "en_attente",
  PAYEE = "payee",
  EN_RETARD = "en_retard",
  ANNULEE = "annulee",
}
```

### MethodePaiement

```typescript
enum MethodePaiement {
  CARTE = "carte",
  VIREMENT = "virement",
  CHEQUE = "cheque",
  ESPECES = "especes",
  STRIPE = "stripe",
  PAYPAL = "paypal",
}
```

## Gestion des Erreurs

Le repository gère les erreurs et retourne des résultats standardisés :

```typescript
const result = await paiementsRepo.creerPaiement(data);

if (result.isConfirm) {
  // Succès
  console.log('Paiement créé:', result.message);
  console.log('ID:', result.id);
} else {
  // Échec
  console.error('Erreur:', result.message);
}
```

## Validation

Le repository effectue des validations automatiques :

```typescript
// Vérification que le paiement existe avant modification
// Vérification qu'une échéance n'est pas déjà payée
// Vérification qu'un paiement peut être annulé
const result = await paiementsRepo.annulerPaiement(999); // ID inexistant

// result.isConfirm sera false si le paiement ne peut pas être annulé
```

## Migration depuis l'Ancien Code

### Ancien code

```typescript
import { Paiements } from '@/db/clients/paiements/paiements';

const paiementsClient = new Paiements();
const result = await paiementsClient.creerPaiement(...);
```

### Nouveau code

```typescript
import { getPaiementsRepository } from '@/db/clients/paiements';

const paiementsRepo = getPaiementsRepository();
const result = await paiementsRepo.creerPaiement({...});
```

**Note** : L'ancien client `Paiements` reste disponible pour compatibilité mais est déprécié.

## Base de Données

### Tables Utilisées

- `paiements` : Paiements effectués
- `echeances_paiements` : Échéances à venir
- `commandes` : Commandes passées
- `articles_commandes` : Articles des commandes
- `utilisateurs` : Jointure pour informations utilisateurs
- `plans_tarifaires` : Jointure pour informations abonnements

## Schéma Simplifié

```sql
-- Paiements
CREATE TABLE paiements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  utilisateur_id INT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  date_paiement DATETIME NOT NULL,
  methode_paiement VARCHAR(50) NOT NULL,
  statut VARCHAR(50) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  abonnement_id INT,
  commande_id INT,
  echeance_id INT,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

-- Échéances
CREATE TABLE echeances_paiements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  utilisateur_id INT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  date_echeance DATE NOT NULL,
  statut VARCHAR(50) NOT NULL,
  description TEXT,
  abonnement_id INT,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);
```

## Avantages de cette Architecture

1. **Modulaire** et facile à maintenir
2. **Type-safe** avec TypeScript strict
3. **Validations automatiques** avant chaque opération
4. **Rétro-compatible** avec l'ancien code
5. **Singleton Pattern** pour optimisation
6. **Testable** grâce à l'isolation des responsabilités

## TODO

- [ ] Implémenter les repositories modulaires (read, write, validation)
- [ ] Ajouter des statistiques de paiements
- [ ] Créer l'API GraphQL pour les paiements
- [ ] Ajouter des tests unitaires
- [ ] Documenter le module GraphQL
- [ ] Implémenter la gestion des remboursements
- [ ] Ajouter la pagination pour les listes
- [ ] Créer des webhooks Stripe

## Support

Pour toute question ou problème :
1. Consulter ce README
2. Vérifier les exemples ci-dessus
3. Contacter l'équipe de développement

## License

Propriété de ClubManager - Tous droits réservés