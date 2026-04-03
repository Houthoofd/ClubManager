# Route Alertes

Ce module gère toutes les opérations liées aux alertes du système.

## Structure

```
alertes/
├── core/                       # Logique métier
│   ├── handlers/              # Handlers des requêtes
│   │   └── alertes.handlers.ts
│   └── index.ts               # Exports du core
├── __tests__/                 # Tests
│   └── alertes.test.ts
├── alertes.routes.ts          # Définition des routes Express
└── index.ts                   # Export du router
```

## Endpoints

### GET /alertes/dashboard
Récupère le dashboard des alertes avec les statistiques globales.

**Authentification**: Super-administrateur requis

**Réponse**:
```json
{
  "success": true,
  "data": {
    "totalAlertes": 10,
    "alertesCritiques": 2,
    "alertesEnAttente": 8
  }
}
```

### GET /alertes/actives
Récupère toutes les alertes actives du système.

**Authentification**: Super-administrateur requis

**Réponse**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "paiement",
      "message": "Paiement en retard",
      "statut": "actif"
    }
  ]
}
```

### GET /alertes/utilisateur/:userId
Récupère les alertes d'un utilisateur spécifique.

**Authentification**: Super-administrateur requis

**Paramètres**:
- `userId` (number): ID de l'utilisateur

**Réponse**:
```json
{
  "success": true,
  "data": [...]
}
```

### POST /alertes/detecter
Déclenche manuellement la détection des alertes dans le système.

**Authentification**: Super-administrateur requis

**Réponse**:
```json
{
  "success": true,
  "message": "Détection des alertes effectuée avec succès"
}
```

### PUT /alertes/:alerteId/resoudre
Marque une alerte comme résolue.

**Authentification**: Super-administrateur requis

**Paramètres**:
- `alerteId` (number): ID de l'alerte

**Body**:
```json
{
  "notes": "Problème résolu"
}
```

**Réponse**:
```json
{
  "success": true,
  "message": "Alerte résolue avec succès"
}
```

### PUT /alertes/:alerteId/ignorer
Ignore une alerte.

**Authentification**: Super-administrateur requis

**Paramètres**:
- `alerteId` (number): ID de l'alerte

**Body**:
```json
{
  "notes": "Alerte ignorée"
}
```

**Réponse**:
```json
{
  "success": true,
  "message": "Alerte ignorée avec succès"
}
```

## Architecture

### Handlers
Les handlers dans `core/handlers/` contiennent la logique métier pure des endpoints. Ils sont séparés des routes pour faciliter les tests et la réutilisation.

### Routes
Le fichier `alertes.routes.ts` définit uniquement les routes Express et fait appel aux handlers appropriés.

### Tests
Les tests unitaires et d'intégration sont placés dans `__tests__/` à proximité du code testé.

## Utilisation

```typescript
import { alertesRouter } from './alertes/index.js';

app.use('/alertes', alertesRouter);
```
