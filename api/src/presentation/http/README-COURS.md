# Documentation - Couche Presentation : Module Cours

Cette documentation décrit la couche Presentation pour le module Cours, incluant les controllers, routes, et leur intégration dans l'application.

## 📁 Structure

```
presentation/http/
├── controllers/
│   ├── CoursController.ts            # Controller REST pour les cours
│   └── CoursRecurrentController.ts   # Controller REST pour les cours récurrents
└── routes/
    ├── cours.routes.ts                # Routes pour les cours
    └── cours-recurrents.routes.ts     # Routes pour les cours récurrents
```

## 🎯 Architecture

La couche Presentation suit le pattern **Controller → Use Case → Repository** :

```
Request → Route → Controller → Use Case → Domain Logic → Repository → Database
                                    ↓
Response ← Controller ← Result ← Use Case
```

### Responsabilités

#### Controllers
- ✅ Valider les données d'entrée (validation basique uniquement)
- ✅ Extraire les paramètres de la requête (params, query, body)
- ✅ Appeler les use cases appropriés
- ✅ Transformer les réponses en JSON standardisé
- ✅ Gérer les codes HTTP (200, 201, 400, 401, 403, 404, etc.)
- ❌ **NE CONTIENT PAS** de logique métier (déléguée aux use cases)

#### Routes
- ✅ Définir les endpoints HTTP
- ✅ Appliquer les middlewares (auth, validation, etc.)
- ✅ Mapper les routes aux méthodes du controller
- ✅ Documenter les endpoints (params, body, réponses)

## 🚀 Endpoints disponibles

### Module Cours (`/api/cours`)

| Méthode | Endpoint | Description | Auth | Rôle |
|---------|----------|-------------|------|------|
| `GET` | `/cours/semaine/:weekNumber` | Cours d'une semaine | ⚠️ Oui* | Tous |
| `GET` | `/cours/me` | Mes cours (inscriptions) | ✅ Oui | Tous |
| `GET` | `/cours/:id` | Détails d'un cours | ❌ Non | - |
| `POST` | `/cours` | Créer un cours | ✅ Oui | Admin |
| `POST` | `/cours/:id/inscription` | S'inscrire à un cours | ✅ Oui | Tous |
| `DELETE` | `/cours/inscription/:inscriptionId` | Annuler inscription | ✅ Oui | Tous |
| `PATCH` | `/cours/inscription/:inscriptionId/presence` | Marquer présence | ✅ Oui | Professeur/Admin |

> ⚠️ *Actuellement, `/cours/semaine/:weekNumber` nécessite une authentification en raison de la structure du use case. Un nouveau use case devrait être créé pour permettre l'accès public.

### Module Cours Récurrents (`/api/cours-recurrents`)

| Méthode | Endpoint | Description | Auth | Rôle |
|---------|----------|-------------|------|------|
| `GET` | `/cours-recurrents` | Liste des cours récurrents | ✅ Oui | Admin |
| `GET` | `/cours-recurrents/actifs` | Cours récurrents actifs | ✅ Oui | Admin |
| `POST` | `/cours-recurrents` | Créer un cours récurrent | ✅ Oui | Admin |
| `PUT` | `/cours-recurrents/:id` | Modifier un cours récurrent | ✅ Oui | Admin |
| `PATCH` | `/cours-recurrents/:id/activate` | Activer un cours | ✅ Oui | Admin |
| `PATCH` | `/cours-recurrents/:id/deactivate` | Désactiver un cours | ✅ Oui | Admin |

> ⚠️ **Note importante** : Les use cases pour les cours récurrents doivent être créés dans `core/use-cases/cours-recurrents/`. Le controller contient actuellement des placeholders.

## 📝 Exemples d'utilisation

### Exemple 1 : Récupérer un cours

**Requête :**
```http
GET /api/cours/123
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "date_cours": "2024-01-15T00:00:00.000Z",
    "type_cours": "Bachata",
    "horaire": {
      "debut": "19:00",
      "fin": "20:00"
    },
    "cours_recurrent_id": 5,
    "inscriptions": [...],
    "created_at": "2024-01-01T10:00:00.000Z",
    "updated_at": "2024-01-01T10:00:00.000Z"
  }
}
```

### Exemple 2 : S'inscrire à un cours

**Requête :**
```http
POST /api/cours/123/inscription
Authorization: Bearer <token>
```

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Inscription au cours réussie",
  "data": {
    "id": 456,
    "cours_id": 123,
    "participant_id": 789,
    "statut": "confirmee",
    "present": false,
    "created_at": "2024-01-15T18:30:00.000Z"
  }
}
```

### Exemple 3 : Marquer la présence

**Requête :**
```http
PATCH /api/cours/inscription/456/presence
Authorization: Bearer <token>
Content-Type: application/json

{
  "present": true
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Présence marquée avec succès",
  "data": {
    "id": 456,
    "cours_id": 123,
    "participant_id": 789,
    "statut": "confirmee",
    "present": true,
    "date_presence": "2024-01-15T20:05:00.000Z"
  }
}
```

## 🔧 Intégration dans l'application

### Étape 1 : Créer les dépendances (Use Cases)

```typescript
// Dans un fichier de configuration des dépendances (ex: di-container.ts)

import { CoursRepository } from '../../infrastructure/repositories/CoursRepository';
import { InscriptionRepository } from '../../infrastructure/repositories/InscriptionRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { CoursRecurrentRepository } from '../../infrastructure/repositories/CoursRecurrentRepository';

// Use Cases Cours
import {
  CreateCoursUseCase,
  GetCoursUseCase,
  GetCoursForParticipantUseCase,
  GetCoursParSemaineUseCase,
  CreateInscriptionUseCase,
  AnnulerInscriptionUseCase,
  MarquerPresenceUseCase,
} from '../core/use-cases/cours';

// Repositories
const coursRepository = new CoursRepository(dataSource);
const inscriptionRepository = new InscriptionRepository(dataSource);
const userRepository = new UserRepository(dataSource);
const coursRecurrentRepository = new CoursRecurrentRepository(dataSource);

// Use Cases
const createCoursUseCase = new CreateCoursUseCase(
  coursRepository,
  coursRecurrentRepository
);

const getCoursUseCase = new GetCoursUseCase(coursRepository);

const getCoursForParticipantUseCase = new GetCoursForParticipantUseCase(
  coursRepository
);

const getCoursParSemaineUseCase = new GetCoursParSemaineUseCase(
  coursRepository
);

const createInscriptionUseCase = new CreateInscriptionUseCase(
  inscriptionRepository,
  coursRepository,
  userRepository,
  { maxInscriptionsParCours: 20 } // Configuration
);

const annulerInscriptionUseCase = new AnnulerInscriptionUseCase(
  inscriptionRepository,
  coursRepository
);

const marquerPresenceUseCase = new MarquerPresenceUseCase(
  inscriptionRepository,
  coursRepository
);
```

### Étape 2 : Créer le controller

```typescript
import { createCoursController } from './presentation/http/controllers/CoursController';

const coursController = createCoursController(
  createCoursUseCase,
  getCoursUseCase,
  getCoursForParticipantUseCase,
  getCoursParSemaineUseCase,
  createInscriptionUseCase,
  annulerInscriptionUseCase,
  marquerPresenceUseCase
);
```

### Étape 3 : Créer et monter les routes

```typescript
import express from 'express';
import { createCoursRoutes } from './presentation/http/routes/cours.routes';

const app = express();

// Monter les routes
const coursRoutes = createCoursRoutes(coursController);
app.use('/api/cours', coursRoutes);
```

### Étape 4 : Ajouter les middlewares d'authentification

```typescript
// middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token invalide',
      code: 'INVALID_TOKEN'
    });
  }
}

export function requireAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  next();
}

export function requireProfesseurOrAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (user?.role !== 'professeur' && user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  next();
}
```

Ensuite, décommentez les lignes dans les fichiers de routes :

```typescript
// Dans cours.routes.ts
router.get(
  '/me',
  authMiddleware, // ✅ Décommenter
  asyncHandler(coursController.getMesCours.bind(coursController))
);

router.post(
  '/',
  authMiddleware, // ✅ Décommenter
  requireAdminMiddleware, // ✅ Décommenter
  asyncHandler(coursController.createCours.bind(coursController))
);
```

## ⚠️ Points d'attention

### 1. Use Cases manquants (Cours Récurrents)

Le `CoursRecurrentController` est prêt mais nécessite les use cases suivants :

- `GetAllCoursRecurrentsUseCase`
- `GetActiveCoursRecurrentsUseCase`
- `CreateCoursRecurrentUseCase`
- `UpdateCoursRecurrentUseCase`
- `ActivateCoursRecurrentUseCase`
- `DeactivateCoursRecurrentUseCase`

**Action :** Créer ces use cases dans `core/use-cases/cours-recurrents/`

### 2. Route `/cours/semaine/:weekNumber`

Le use case `GetCoursParSemaineUseCase` nécessite actuellement un `participantId`, ce qui force l'authentification. 

**Solutions possibles :**
1. Créer un nouveau use case `GetAllCoursParSemaineUseCase` (recommandé)
2. Rendre le `participantId` optionnel dans le use case existant

### 3. Middlewares d'authentification

Les middlewares sont actuellement commentés dans les routes. Il faut :

1. Créer les middlewares d'authentification
2. Les importer dans les fichiers de routes
3. Décommenter les lignes correspondantes

### 4. Validation avancée

Pour une validation plus robuste, envisager d'utiliser une bibliothèque comme :
- **Zod** (recommandé)
- **Joi**
- **class-validator**

Exemple avec Zod :

```typescript
import { z } from 'zod';

const CreateCoursSchema = z.object({
  date_cours: z.string().datetime(),
  type_cours: z.string().min(1),
  heure_debut: z.string().regex(/^\d{2}:\d{2}$/),
  heure_fin: z.string().regex(/^\d{2}:\d{2}$/),
  cours_recurrent_id: z.number().int().positive(),
});

// Dans le controller
const validatedData = CreateCoursSchema.parse(req.body);
```

## 🧪 Tests

### Exemple de test pour un endpoint

```typescript
import request from 'supertest';
import { app } from '../app';

describe('GET /api/cours/:id', () => {
  it('should return a cours by id', async () => {
    const response = await request(app)
      .get('/api/cours/123')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: 123,
        type_cours: expect.any(String),
        // ...
      }
    });
  });

  it('should return 404 if cours not found', async () => {
    const response = await request(app)
      .get('/api/cours/99999')
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      code: 'COURS_NOT_FOUND'
    });
  });

  it('should return 400 for invalid id', async () => {
    const response = await request(app)
      .get('/api/cours/invalid')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      code: 'INVALID_COURS_ID'
    });
  });
});
```

## 📚 Ressources

- [Express.js Documentation](https://expressjs.com/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [REST API Best Practices](https://restfulapi.net/)

## 🤝 Contribution

Lors de l'ajout de nouveaux endpoints :

1. ✅ Créer le use case d'abord (logique métier)
2. ✅ Ajouter la méthode au controller (validation basique)
3. ✅ Définir la route avec la documentation
4. ✅ Ajouter les middlewares nécessaires
5. ✅ Écrire les tests
6. ✅ Mettre à jour cette documentation

---

**Dernière mise à jour :** Janvier 2024  
**Auteur :** Équipe ClubManager