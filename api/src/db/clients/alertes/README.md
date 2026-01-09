# Module Alertes

Module de gestion des alertes du système ClubManager. Ce module permet de détecter, gérer et résoudre des alertes liées aux utilisateurs du club.

## 📁 Structure

```
alertes/
├── README.md                    # Ce fichier
├── index.ts                     # Point d'entrée / barrel exports
├── alertes.ts                   # Classe principale (composition)
├── alertes.repository.ts        # Récupération des données
├── alertes.service.ts           # Logique métier (actions)
├── queries.ts                   # Requêtes SQL
└── types.ts                     # Types et interfaces TypeScript
```

## 🎯 Responsabilités

### 📦 `alertes.ts` - Classe Principale
Point d'entrée unifié qui compose le repository et le service. C'est la classe à utiliser dans votre code.

**Responsabilité** : Façade/API publique du module

### 📖 `alertes.repository.ts` - Repository
Gestion des opérations de **lecture** (queries SELECT).

**Responsabilité** : Récupération et mapping des données depuis la base

**Méthodes** :
- `obtenirDashboard()` - Dashboard avec vue d'ensemble
- `obtenirAlertesActives()` - Liste des alertes actives
- `obtenirAlertesUtilisateur(userId)` - Alertes d'un utilisateur
- `obtenirStatistiques()` - Statistiques globales

### ⚙️ `alertes.service.ts` - Service
Gestion des opérations d'**écriture** et des actions métier (INSERT, UPDATE, DELETE).

**Responsabilité** : Logique métier et mutations

**Méthodes** :
- `detecterAlertes()` - Détection automatique des alertes
- `resoudreAlerte(params)` - Résolution d'une alerte
- `ignorerAlerte(params)` - Ignorement d'une alerte
- `resoudreAlerteSimple(alerteId)` - Résolution simple
- `reactiverAlerte(alerteId)` - Réactivation d'une alerte

### 📝 `queries.ts` - Requêtes SQL
Toutes les requêtes SQL du module, organisées en constantes.

**Avantages** :
- Centralisation des requêtes
- Réutilisabilité
- Facilite les tests et le débogage
- Évite la duplication

### 🏷️ `types.ts` - Types TypeScript
Interfaces, enums et types pour tout le module.

**Contient** :
- `StatutAlerte` - Enum des statuts (active, resolue, ignoree)
- `PrioriteAlerte` - Enum des priorités (critique, haute, normale, basse)
- `AlerteType`, `AlerteUtilisateur`, `AlerteActive` - Interfaces de données
- `DashboardAlerte`, `StatistiquesAlertes` - Interfaces de résultats
- `ResoudreAlerteParams`, `IgnorerAlerteParams` - Paramètres d'actions

## 🚀 Usage

### Import Basique

```typescript
import { Alerte } from './db/clients/alertes';

const alerteClient = new Alerte();
```

### Récupérer le Dashboard

```typescript
const dashboard = await alerteClient.obtenirDashboardAlertes();
console.log(dashboard.data); // DashboardAlerte[]
```

### Récupérer les Alertes Actives

```typescript
const alertes = await alerteClient.obtenirAlertesActives();
console.log(alertes.data); // AlerteActive[]
```

### Récupérer les Alertes d'un Utilisateur

```typescript
const userId = 123;
const alertesUser = await alerteClient.obtenirAlertesUtilisateur(userId);
console.log(alertesUser.data);
```

### Détecter les Alertes (Automatique)

```typescript
// Déclenche la détection pour tous les utilisateurs
const result = await alerteClient.detecterAlertes();
console.log(result.message); // "Détection des alertes effectuée avec succès"
```

### Résoudre une Alerte

```typescript
const result = await alerteClient.resoudreAlerte(
  alerteId: 456,
  notes: "Problème résolu après contact téléphonique",
  effectuePar: 789 // ID de l'admin qui résout
);
console.log(result.isConfirm); // true
```

### Ignorer une Alerte

```typescript
const result = await alerteClient.ignorerAlerte(
  alerteId: 456,
  notes: "Fausse alerte - utilisateur en vacances"
);
console.log(result.message); // "Alerte ignorée avec succès"
```

### Obtenir les Statistiques

```typescript
const stats = await alerteClient.obtenirStatistiquesAlertes();
console.log(stats.data);
// {
//   total_alertes: 150,
//   alertes_actives: 23,
//   alertes_resolues: 120,
//   alertes_critiques: 5
// }
```

## 🔧 Usage Avancé

### Import Sélectif pour Tests

```typescript
import { AlertesRepository, AlertesService } from './db/clients/alertes';

// Tester uniquement le repository
const repo = new AlertesRepository();
const alertes = await repo.obtenirAlertesActives();

// Tester uniquement le service
const service = new AlertesService();
await service.resoudreAlerteSimple(123);
```

### Utilisation des Types

```typescript
import { StatutAlerte, PrioriteAlerte, AlerteActive } from './db/clients/alertes';

function traiterAlerte(alerte: AlerteActive) {
  if (alerte.priorite === PrioriteAlerte.CRITIQUE) {
    // Traitement urgent
  }
}
```

### Mock pour Tests Unitaires

```typescript
import { AlertesRepository } from './db/clients/alertes';

// Mock du repository
jest.mock('./db/clients/alertes/alertes.repository');

const mockRepo = AlertesRepository as jest.MockedClass<typeof AlertesRepository>;
mockRepo.prototype.obtenirAlertesActives.mockResolvedValue({
  isFind: true,
  message: "Success",
  data: []
});
```

## 🗄️ Base de Données

### Tables Utilisées

- **`alertes_utilisateurs`** - Alertes liées aux utilisateurs
- **`alertes_types`** - Types d'alertes configurables
- **`utilisateurs`** - Informations utilisateurs

### Stored Procedures

- `obtenir_dashboard_alertes()` - Dashboard optimisé
- `obtenir_alertes_utilisateur(userId)` - Alertes par utilisateur
- `detecter_alertes_utilisateurs()` - Détection automatique
- `resoudre_alerte(alerteId, notes, effectuePar)` - Résolution avec tracking

## ✅ Avantages de cette Architecture

1. **Séparation des Responsabilités**
   - Repository = Lecture
   - Service = Écriture/Actions
   - Queries = SQL isolé

2. **Testabilité**
   - Chaque classe peut être testée indépendamment
   - Mock facile des dépendances
   - Queries testables séparément

3. **Maintenabilité**
   - Code organisé et lisible
   - Modifications localisées
   - Évolution facile

4. **Réutilisabilité**
   - Repository et Service réutilisables
   - Queries partagées
   - Types réutilisables

5. **Type Safety**
   - Types TypeScript complets
   - Autocomplétion IDE
   - Détection d'erreurs à la compilation

## 🔄 Migration depuis l'Ancien Code

Si vous utilisez l'ancienne classe `Alerte`, **aucun changement n'est nécessaire** ! L'API publique reste identique :

```typescript
// Ancien code (fonctionne toujours)
const alerte = new Alerte();
await alerte.obtenirDashboardAlertes();
await alerte.resoudreAlerte(id, notes, effectuePar);

// ✅ Aucune modification nécessaire
```

## 📊 Exemples Complets

### Dashboard Admin

```typescript
async function afficherDashboard() {
  const alerte = new Alerte();
  
  const [dashboard, stats, actives] = await Promise.all([
    alerte.obtenirDashboardAlertes(),
    alerte.obtenirStatistiquesAlertes(),
    alerte.obtenirAlertesActives()
  ]);
  
  return {
    dashboard: dashboard.data,
    stats: stats.data,
    alertesCritiques: actives.data.filter(
      a => a.priorite === PrioriteAlerte.CRITIQUE
    )
  };
}
```

### Traitement d'Alerte

```typescript
async function traiterAlerte(alerteId: number, adminId: number) {
  const alerte = new Alerte();
  
  try {
    // Résoudre l'alerte
    const result = await alerte.resoudreAlerte(
      alerteId,
      "Traité automatiquement",
      adminId
    );
    
    if (result.isConfirm) {
      // Recharger les alertes actives
      const actives = await alerte.obtenirAlertesActives();
      return actives.data;
    }
  } catch (error) {
    console.error("Erreur lors du traitement:", error);
    throw error;
  }
}
```

### Cron Job de Détection

```typescript
import { Alerte } from './db/clients/alertes';
import cron from 'node-cron';

// Détection automatique toutes les heures
cron.schedule('0 * * * *', async () => {
  const alerte = new Alerte();
  
  try {
    const result = await alerte.detecterAlertes();
    console.log(`[CRON] ${result.message}`);
    
    // Récupérer les nouvelles alertes critiques
    const actives = await alerte.obtenirAlertesActives();
    const critiques = actives.data.filter(
      a => a.priorite === PrioriteAlerte.CRITIQUE
    );
    
    if (critiques.length > 0) {
      // Notifier les admins
      console.warn(`⚠️ ${critiques.length} alertes critiques détectées !`);
    }
  } catch (error) {
    console.error('[CRON] Erreur détection alertes:', error);
  }
});
```

## 🧪 Tests

### Exemple de Test Unitaire (Repository)

```typescript
import { AlertesRepository } from './alertes.repository';
import MysqlConnector from '../../connector/mysqlconnector';

jest.mock('../../connector/mysqlconnector');

describe('AlertesRepository', () => {
  let repository: AlertesRepository;
  
  beforeEach(() => {
    repository = new AlertesRepository();
  });
  
  it('devrait récupérer les alertes actives', async () => {
    const mockData = [{ id: 1, type_alerte: 'Test' }];
    
    (MysqlConnector.getInstance as jest.Mock).mockReturnValue({
      query: jest.fn((sql, params, callback) => {
        callback(null, mockData);
      })
    });
    
    const result = await repository.obtenirAlertesActives();
    
    expect(result.isFind).toBe(true);
    expect(result.data).toEqual(mockData);
  });
});
```

## 🚧 TODO / Améliorations Futures

- [ ] Ajouter cache Redis pour les statistiques
- [ ] Implémenter pagination pour `obtenirAlertesActives`
- [ ] Ajouter filtres avancés (par priorité, date, type)
- [ ] WebSocket pour notifications temps réel
- [ ] Export des alertes en CSV/PDF
- [ ] Historique des résolutions
- [ ] Tableau de bord avec graphiques

## 📚 Voir Aussi

- [Documentation Types ClubManager](../../types/README.md)
- [MysqlConnector](../../connector/README.md)
- [Architecture du Projet](../../../../../docs/ARCHITECTURE.md)

---

**Dernière mise à jour** : 2024
**Auteur** : ClubManager Team