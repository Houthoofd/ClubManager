# Architecture du Module Paiements

## Vue d'ensemble

Le module Paiements suit une architecture modulaire qui sépare les responsabilités en couches distinctes. Cette architecture facilite la maintenance, les tests et l'évolution du code.

## Structure des Dossiers

```
paiements/
├── docs/                      # Documentation
│   └── ARCHITECTURE.md       # Ce fichier
├── queries/                  # Requêtes SQL modulaires
│   ├── read.queries.ts      # Requêtes SELECT (490 lignes)
│   ├── write.queries.ts     # Requêtes INSERT/UPDATE/DELETE (331 lignes)
│   ├── validation.queries.ts # Requêtes de validation (388 lignes)
│   └── index.ts             # Export centralisé
├── repositories/            # Repositories modulaires (à implémenter)
│   ├── read.repository.ts   # Opérations de lecture
│   ├── write.repository.ts  # Opérations d'écriture
│   └── validation.repository.ts # Opérations de validation
├── utils/                   # Utilitaires et helpers
├── paiements.repository.ts  # Repository principal (orchestrateur - 957 lignes)
├── types.ts                 # Types TypeScript (597 lignes)
├── queries.ts              # Fichier de compatibilité
├── index.ts                # Point d'entrée du module
├── paiements.ts            # Client legacy (compatibilité)
└── README.md               # Documentation utilisateur
```

## Couches d'Architecture

### 1. Types (`types.ts`)

Définit tous les types TypeScript du module:
- **Entités**: Représentations métier (Paiement, EcheancePaiement, Commande, etc.)
- **SQL Rows**: Structures brutes de la base de données
- **DTOs**: Objets de transfert de données
- **Résultats**: Structures de retour standardisées
- **Enums**: Énumérations (StatutPaiement, StatutEcheance, MethodePaiement, etc.)
- **Type Guards**: Fonctions de validation de types

### 2. Requêtes SQL (`queries/`)

Séparation des requêtes SQL par responsabilité:

#### `read.queries.ts` (490 lignes)
- Toutes les requêtes SELECT
- Récupération des paiements, échéances, commandes
- Statistiques et comptages
- Jointures avec utilisateurs et plans tarifaires

#### `write.queries.ts` (331 lignes)
- Requêtes INSERT, UPDATE, DELETE
- Création et modification des paiements, échéances, commandes
- Gestion des articles de commande
- Mise à jour des statuts

#### `validation.queries.ts` (388 lignes)
- Requêtes de vérification (CHECK, EXISTS)
- Validation de l'existence des entités
- Vérification des permissions et états
- Validation Stripe et doublons

### 3. Repository Principal (`paiements.repository.ts`)

**Pattern**: Orchestrateur + Singleton

**Responsabilités**:
- Orchestration des opérations de base de données
- Validation métier avant opérations
- Gestion des erreurs et logs
- Formatage des réponses standardisées

**Structure**:
```typescript
class PaiementsRepository {
  private mysqlConnector: MysqlConnector;
  
  // === PAIEMENTS - LECTURE ===
  async obtenirLesTousLesPaiements(): Promise<PaiementAvecDetails[]>
  async obtenirPaiementsParUtilisateur(userId: number): Promise<PaiementAvecDetails[]>
  async obtenirPaiementParId(id: number): Promise<Paiement | null>
  async obtenirDetailsPaiementStripe(intentId: string): Promise<SearchResult>
  
  // === PAIEMENTS - ÉCRITURE ===
  async creerPaiement(data: CreatePaiementData): Promise<CreatePaiementResult>
  async modifierPaiement(id: number, data: UpdatePaiementData): Promise<ConfirmationResult>
  async mettreAJourStatutPaiement(id: number, statut: string): Promise<ConfirmationResult>
  async annulerPaiement(id: number): Promise<ConfirmationResult>
  async supprimerPaiement(id: number): Promise<ConfirmationResult>
  async enregistrerPaiement(userId: number, montant: number, methode: string): Promise<ConfirmationResult>
  async confirmerPaiementStripe(id: number, chargeId: string, statut: string): Promise<ConfirmationResult>
  
  // === ÉCHÉANCES ===
  async obtenirEcheancesUtilisateur(userId: number): Promise<EcheanceAvecDetails[]>
  async obtenirEcheancesPourUtilisateur(userId: number): Promise<EcheancePaiement[]>
  async marquerEcheancePayee(id: number): Promise<ConfirmationResult>
  async mettreAJourStatutEcheance(id: number, statut: string): Promise<ConfirmationResult>
  
  // === COMMANDES ===
  async creerCommande(data: CreateCommandeData): Promise<ConfirmationResult>
  async traiterCommandeApresPayment(paiementId: number): Promise<ConfirmationResult>
  
  // === VALIDATIONS PRIVÉES ===
  private async verifierPaiementExiste(id: number): Promise<boolean>
  private async verifierPaiementPeutEtreAnnule(id: number): Promise<boolean>
  private async verifierEcheanceExiste(id: number): Promise<boolean>
  private async verifierEcheanceEstPayee(id: number): Promise<boolean>
  
  // === UTILITAIRES ===
  async estPremierPaiement(userId: number): Promise<PremierPaiementResult>
  async diagnostiquerPaiement(intentId: string): Promise<DiagnosticResult>
}
```

**Singleton**:
```typescript
let repositoryInstance: PaiementsRepository | null = null;

export function getPaiementsRepository(): PaiementsRepository {
  if (!repositoryInstance) {
    repositoryInstance = new PaiementsRepository();
  }
  return repositoryInstance;
}
```

### 4. Point d'entrée (`index.ts`)

Expose l'API publique du module:
```typescript
// Repository principal
export { PaiementsRepository, getPaiementsRepository } from './paiements.repository.js';

// Types
export * from './types.js';

// Queries (pour compatibilité)
export * as queries from './queries.js';

// Client legacy
export { Paiements } from './paiements.js';
```

## Flux de Données

### Lecture (Query Flow)
```
Client → Repository Principal → Query → Database
                                   ↓
Client ← Entité TypeScript ← Results
```

### Écriture (Command Flow)
```
Client → Repository Principal
           ↓
        Validation (vérifications)
           ↓
        Write Query → Database
           ↓
        Retour (Success/Failure)
```

## Principes de Conception

### 1. Séparation des Responsabilités (SRP)
- Requêtes séparées par type d'opération (read/write/validation)
- Chaque méthode a une responsabilité unique
- Validations isolées dans des méthodes privées

### 2. DRY (Don't Repeat Yourself)
- Requêtes SQL centralisées et réutilisables
- Méthodes de validation privées partagées
- Types partagés dans `types.ts`

### 3. Type Safety
- Tous les types SQL et entités sont typés
- Type guards pour validation runtime
- Interfaces strictes pour les DTOs

### 4. Gestion des Erreurs
- Try-catch dans les méthodes principales
- Logs détaillés des erreurs
- Retours standardisés (isConfirm, message, data)

### 5. Validations Automatiques
- Vérification d'existence avant modification
- Vérification des états avant changement
- Protection contre les doublons

### 6. Testabilité
- Méthodes isolées et testables
- Dépendances injectables
- Isolation des responsabilités

## Usage

### Import du module
```typescript
import { getPaiementsRepository } from '@/db/clients/paiements';

const paiementsRepo = getPaiementsRepository();
```

### Opérations courantes

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
  console.log('Paiement créé, ID:', result.id);
}
```

#### Récupérer les paiements d'un utilisateur
```typescript
const paiements = await paiementsRepo.obtenirPaiementsParUtilisateur(userId);

paiements.forEach(p => {
  console.log(`${p.montant}€ - ${p.methode_paiement} - ${p.statut}`);
});
```

#### Gérer les échéances
```typescript
const echeances = await paiementsRepo.obtenirEcheancesUtilisateur(userId);

// Marquer comme payée
const result = await paiementsRepo.marquerEcheancePayee(echeanceId);
```

## Entités Principales

### Paiement
Représente un paiement effectué par un utilisateur.

**Attributs principaux**:
- `id`: Identifiant unique
- `utilisateur_id`: Lien vers l'utilisateur
- `montant`: Montant du paiement
- `methode_paiement`: Mode de paiement (carte, virement, etc.)
- `statut`: État du paiement (valide, en_attente, refuse, etc.)
- `stripe_payment_intent_id`: ID Stripe pour paiements en ligne
- `abonnement_id`: Lien vers l'abonnement (optionnel)
- `commande_id`: Lien vers une commande (optionnel)
- `echeance_id`: Lien vers une échéance (optionnel)

### Échéance de Paiement
Représente une échéance à payer.

**Attributs principaux**:
- `id`: Identifiant unique
- `utilisateur_id`: Lien vers l'utilisateur
- `montant`: Montant à payer
- `date_echeance`: Date limite de paiement
- `statut`: État (en_attente, payee, en_retard, annulee)
- `description`: Description optionnelle
- `abonnement_id`: Lien vers l'abonnement

### Commande
Représente une commande passée par un utilisateur.

**Attributs principaux**:
- `id`: Identifiant unique
- `utilisateur_id`: Lien vers l'utilisateur
- `montant_total`: Montant total de la commande
- `statut`: État de la commande
- `paiement_id`: Lien vers le paiement
- `articles`: Liste des articles commandés

## Intégration Stripe

Le module supporte l'intégration avec Stripe :

```typescript
// Créer un paiement Stripe
const result = await paiementsRepo.creerPaiement({
  utilisateur_id: 1,
  montant: 50.00,
  methode_paiement: 'stripe',
  stripe_payment_intent_id: paymentIntent.id,
  statut: 'en_attente'
});

// Confirmer après succès Stripe
const confirmation = await paiementsRepo.confirmerPaiementStripe(
  result.id,
  charge.id,
  'valide'
);

// Récupérer les détails
const details = await paiementsRepo.obtenirDetailsPaiementStripe(paymentIntent.id);
```

## Statistiques et Diagnostics

### Vérifier premier paiement
```typescript
const result = await paiementsRepo.estPremierPaiement(userId);

if (result.isPremier) {
  // Appliquer une réduction pour premier paiement
}
```

### Diagnostiquer un paiement
```typescript
const diagnostic = await paiementsRepo.diagnostiquerPaiement(paymentIntentId);

if (diagnostic.isFind) {
  console.log('Problèmes:', diagnostic.data.problemes_detectes);
  console.log('Suggestions:', diagnostic.data.suggestions);
}
```

## Migration depuis l'Ancien Code

### Ancien code (paiements.ts)
```typescript
import { Paiements } from '@/db/clients/paiements/paiements';
const paiementsClient = new Paiements();
const result = await paiementsClient.creerPaiement(...);
```

### Nouveau code (repository)
```typescript
import { getPaiementsRepository } from '@/db/clients/paiements';
const paiementsRepo = getPaiementsRepository();
const result = await paiementsRepo.creerPaiement({...});
```

**Note**: L'ancien client reste disponible pour compatibilité mais est déprécié.

## Compatibilité

### Fichier Legacy
- `paiements.ts` est conservé pour compatibilité
- Exporté depuis `index.ts`
- À migrer progressivement vers le nouveau repository

### Queries
- `queries.ts` redirige vers `queries/index.ts`
- Anciens imports restent fonctionnels
- Nouveaux imports recommandés depuis `queries/read.queries.ts`, etc.

## Avantages de cette Architecture

1. **Maintenabilité**: Code organisé et facile à localiser
2. **Scalabilité**: Ajout facile de nouvelles fonctionnalités
3. **Testabilité**: Isolation des responsabilités
4. **Type Safety**: TypeScript complet avec types stricts
5. **Réutilisabilité**: Requêtes et logique partagées
6. **Validation**: Vérifications automatiques avant opérations
7. **Performance**: Pattern Singleton pour optimisation
8. **Documentation**: Structure auto-documentée

## Évolutions Futures

### Court terme
- [ ] Implémenter les repositories modulaires (read, write, validation)
- [ ] Ajouter des tests unitaires pour toutes les méthodes
- [ ] Créer l'API GraphQL pour les paiements
- [ ] Documenter tous les cas d'usage

### Moyen terme
- [ ] Ajouter des statistiques avancées de paiements
- [ ] Implémenter la gestion des remboursements
- [ ] Créer des webhooks Stripe pour synchronisation
- [ ] Ajouter la pagination pour les grandes listes
- [ ] Implémenter un cache pour optimisation

### Long terme
- [ ] Support de plusieurs passerelles de paiement
- [ ] Système de facturation automatique
- [ ] Gestion des abonnements récurrents
- [ ] Exports comptables (CSV, PDF)
- [ ] Dashboard de statistiques temps réel
- [ ] Notifications automatiques pour échéances

## Bonnes Pratiques

### 1. Toujours vérifier les résultats
```typescript
const result = await paiementsRepo.creerPaiement(data);
if (!result.isConfirm) {
  throw new Error(result.message);
}
```

### 2. Utiliser les validations
```typescript
// Le repository valide automatiquement
const result = await paiementsRepo.annulerPaiement(999);
// Retourne false si le paiement ne peut pas être annulé
```

### 3. Gérer les cas d'erreur
```typescript
try {
  const result = await paiementsRepo.creerPaiement(data);
  // Traiter le succès
} catch (error) {
  console.error('Erreur création paiement:', error);
  // Gérer l'erreur
}
```

### 4. Utiliser les types
```typescript
import type { CreatePaiementData, StatutPaiement } from '@/db/clients/paiements';

const data: CreatePaiementData = {
  utilisateur_id: 1,
  montant: 50.00,
  methode_paiement: 'carte',
  statut: StatutPaiement.VALIDE
};
```

## Sécurité

### Validation des montants
```typescript
// Les montants négatifs sont rejetés
// Les montants invalides génèrent une erreur
```

### Protection contre les doublons
```typescript
// Le système vérifie les doublons de paiement par période
// Les échéances en double sont détectées
```

### Vérification des permissions
```typescript
// Vérifier que l'utilisateur existe et est actif
// Vérifier que l'utilisateur peut effectuer l'opération
```

## Ressources

- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
- [Patterns Repository](https://martinfowler.com/eaaCatalog/repository.html)
- [Documentation Stripe](https://stripe.com/docs/api)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## Support

Pour toute question sur l'architecture :
1. Consulter ce document
2. Consulter le README.md pour les exemples d'usage
3. Consulter le code des types dans types.ts
4. Contacter l'équipe de développement