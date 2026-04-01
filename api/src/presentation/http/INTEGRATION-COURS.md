# Guide d'Intégration Rapide - Module Cours

Ce guide vous montre comment intégrer rapidement la couche Presentation du module Cours dans votre application Express.

## ✅ Fichiers créés

```
presentation/http/
├── controllers/
│   ├── CoursController.ts              ✅ Créé
│   ├── CoursRecurrentController.ts     ✅ Créé (placeholders)
│   └── index.ts                        ✅ Créé
├── routes/
│   ├── cours.routes.ts                 ✅ Créé
│   ├── cours-recurrents.routes.ts      ✅ Créé
│   └── index.ts                        ✅ Créé
└── README-COURS.md                      ✅ Documentation complète
```

## 🚀 Intégration en 5 étapes

### Étape 1 : Installer les dépendances (si nécessaire)

```bash
npm install express
npm install --save-dev @types/express
```

### Étape 2 : Créer le conteneur d'injection de dépendances

Créez ou modifiez votre fichier `container.ts` ou `di-container.ts` :

```typescript
// api/src/container.ts (ou di-container.ts)

import { DataSource } from 'typeorm';

// ============== REPOSITORIES ==============
import { CoursRepository } from './infrastructure/database/repositories/CoursRepository.js';
import { InscriptionRepository } from './infrastructure/database/repositories/InscriptionRepository.js';
import { UserRepository } from './infrastructure/database/repositories/UserRepository.js';
import { CoursRecurrentRepository } from './infrastructure/database/repositories/CoursRecurrentRepository.js';

// ============== USE CASES ==============
import {
  CreateCoursUseCase,
  GetCoursUseCase,
  GetCoursForParticipantUseCase,
  GetCoursParSemaineUseCase,
  CreateInscriptionUseCase,
  AnnulerInscriptionUseCase,
  MarquerPresenceUseCase,
} from './core/use-cases/cours/index.js';

// ============== CONTROLLERS ==============
import {
  CoursController,
  createCoursController,
  CoursRecurrentController,
  createCoursRecurrentController,
} from './presentation/http/controllers/index.js';

export class DependencyContainer {
  private static instance: DependencyContainer;
  
  // Repositories
  public readonly coursRepository: CoursRepository;
  public readonly inscriptionRepository: InscriptionRepository;
  public readonly userRepository: UserRepository;
  public readonly coursRecurrentRepository: CoursRecurrentRepository;
  
  // Use Cases
  public readonly createCoursUseCase: CreateCoursUseCase;
  public readonly getCoursUseCase: GetCoursUseCase;
  public readonly getCoursForParticipantUseCase: GetCoursForParticipantUseCase;
  public readonly getCoursParSemaineUseCase: GetCoursParSemaineUseCase;
  public readonly createInscriptionUseCase: CreateInscriptionUseCase;
  public readonly annulerInscriptionUseCase: AnnulerInscriptionUseCase;
  public readonly marquerPresenceUseCase: MarquerPresenceUseCase;
  
  // Controllers
  public readonly coursController: CoursController;
  public readonly coursRecurrentController: CoursRecurrentController;

  private constructor(dataSource: DataSource) {
    // Initialiser les repositories
    this.coursRepository = new CoursRepository(dataSource);
    this.inscriptionRepository = new InscriptionRepository(dataSource);
    this.userRepository = new UserRepository(dataSource);
    this.coursRecurrentRepository = new CoursRecurrentRepository(dataSource);

    // Initialiser les use cases
    this.createCoursUseCase = new CreateCoursUseCase(
      this.coursRepository,
      this.coursRecurrentRepository
    );

    this.getCoursUseCase = new GetCoursUseCase(this.coursRepository);

    this.getCoursForParticipantUseCase = new GetCoursForParticipantUseCase(
      this.coursRepository
    );

    this.getCoursParSemaineUseCase = new GetCoursParSemaineUseCase(
      this.coursRepository
    );

    this.createInscriptionUseCase = new CreateInscriptionUseCase(
      this.inscriptionRepository,
      this.coursRepository,
      this.userRepository,
      { maxInscriptionsParCours: 20 } // Configuration
    );

    this.annulerInscriptionUseCase = new AnnulerInscriptionUseCase(
      this.inscriptionRepository,
      this.coursRepository
    );

    this.marquerPresenceUseCase = new MarquerPresenceUseCase(
      this.inscriptionRepository,
      this.coursRepository
    );

    // Initialiser les controllers
    this.coursController = createCoursController(
      this.createCoursUseCase,
      this.getCoursUseCase,
      this.getCoursForParticipantUseCase,
      this.getCoursParSemaineUseCase,
      this.createInscriptionUseCase,
      this.annulerInscriptionUseCase,
      this.marquerPresenceUseCase
    );

    this.coursRecurrentController = createCoursRecurrentController();
  }

  public static initialize(dataSource: DataSource): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer(dataSource);
    }
    return DependencyContainer.instance;
  }

  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      throw new Error('DependencyContainer must be initialized first');
    }
    return DependencyContainer.instance;
  }
}
```

### Étape 3 : Créer les middlewares d'authentification

Créez `presentation/http/middlewares/auth.middleware.ts` :

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware d'authentification JWT
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification manquant',
        code: 'NO_TOKEN',
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Format du token invalide',
        code: 'INVALID_TOKEN_FORMAT',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (req as any).user = decoded; // Attacher l'utilisateur à la requête
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Middleware pour vérifier le rôle Admin
 */
export function requireAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Utilisateur non authentifié',
      code: 'NOT_AUTHENTICATED',
    });
  }
  
  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes - Rôle admin requis',
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  }
  
  next();
}

/**
 * Middleware pour vérifier le rôle Professeur ou Admin
 */
export function requireProfesseurOrAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Utilisateur non authentifié',
      code: 'NOT_AUTHENTICATED',
    });
  }
  
  if (user.role !== 'professeur' && user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes - Rôle professeur ou admin requis',
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  }
  
  next();
}
```

### Étape 4 : Monter les routes dans l'application

Modifiez votre fichier principal (ex: `app.ts` ou `server.ts`) :

```typescript
// api/src/app.ts

import express from 'express';
import { DataSource } from 'typeorm';
import { DependencyContainer } from './container.js';
import { createCoursRoutes, createCoursRecurrentsRoutes } from './presentation/http/routes/index.js';
import { errorMiddleware, notFoundMiddleware } from './presentation/http/middlewares/error.middleware.js';

export async function createApp(dataSource: DataSource) {
  const app = express();

  // Middlewares globaux
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialiser le conteneur de dépendances
  const container = DependencyContainer.initialize(dataSource);

  // ============== ROUTES ==============
  
  // Routes Cours
  const coursRoutes = createCoursRoutes(container.coursController);
  app.use('/api/cours', coursRoutes);

  // Routes Cours Récurrents (admin only)
  const coursRecurrentsRoutes = createCoursRecurrentsRoutes(container.coursRecurrentController);
  app.use('/api/cours-recurrents', coursRecurrentsRoutes);

  // Route de santé
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ============== GESTION DES ERREURS ==============
  
  // 404 - Route non trouvée
  app.use(notFoundMiddleware);

  // Middleware d'erreur global
  app.use(errorMiddleware);

  return app;
}
```

### Étape 5 : Activer les middlewares dans les routes

Dans `presentation/http/routes/cours.routes.ts`, **décommentez** les lignes de middlewares :

```typescript
// AVANT
router.get(
  '/me',
  // authMiddleware, // ❌ Commenté
  asyncHandler(coursController.getMesCours.bind(coursController))
);

// APRÈS
import { authMiddleware, requireAdminMiddleware, requireProfesseurOrAdminMiddleware } from '../middlewares/auth.middleware.js';

router.get(
  '/me',
  authMiddleware, // ✅ Activé
  asyncHandler(coursController.getMesCours.bind(coursController))
);

router.post(
  '/',
  authMiddleware, // ✅ Activé
  requireAdminMiddleware, // ✅ Activé
  asyncHandler(coursController.createCours.bind(coursController))
);
```

Faites de même pour `presentation/http/routes/cours-recurrents.routes.ts`.

## 🧪 Tester l'intégration

### 1. Démarrer le serveur

```bash
npm run dev
```

### 2. Tester avec curl ou Postman

**Récupérer un cours (public) :**
```bash
curl http://localhost:3000/api/cours/1
```

**S'inscrire à un cours (authentifié) :**
```bash
curl -X POST http://localhost:3000/api/cours/1/inscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Créer un cours (admin) :**
```bash
curl -X POST http://localhost:3000/api/cours \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "date_cours": "2024-01-15",
    "type_cours": "Bachata",
    "heure_debut": "19:00",
    "heure_fin": "20:00",
    "cours_recurrent_id": 1
  }'
```

## ⚠️ TODO : Actions restantes

### 1. Créer les Use Cases pour Cours Récurrents

Le `CoursRecurrentController` est prêt mais nécessite ces use cases :

```
api/src/core/use-cases/cours-recurrents/
├── GetAllCoursRecurrents.usecase.ts
├── GetActiveCoursRecurrents.usecase.ts
├── CreateCoursRecurrent.usecase.ts
├── UpdateCoursRecurrent.usecase.ts
├── ActivateCoursRecurrent.usecase.ts
├── DeactivateCoursRecurrent.usecase.ts
└── index.ts
```

### 2. Améliorer la route `/cours/semaine/:weekNumber`

Le use case `GetCoursParSemaineUseCase` nécessite actuellement un `participantId`.

**Option A :** Créer un nouveau use case `GetAllCoursParSemaineUseCase` (recommandé)
**Option B :** Rendre le `participantId` optionnel dans le use case existant

### 3. Ajouter la validation avec Zod

```bash
npm install zod
```

Créez `presentation/http/validators/cours.validator.ts` :

```typescript
import { z } from 'zod';

export const CreateCoursSchema = z.object({
  date_cours: z.string().datetime(),
  type_cours: z.string().min(1).max(50),
  heure_debut: z.string().regex(/^\d{2}:\d{2}$/),
  heure_fin: z.string().regex(/^\d{2}:\d{2}$/),
  cours_recurrent_id: z.number().int().positive(),
});

export const InscriptionSchema = z.object({
  notes: z.string().optional(),
});

export const MarquerPresenceSchema = z.object({
  present: z.boolean(),
});
```

### 4. Ajouter les tests

Créez `presentation/http/controllers/__tests__/CoursController.test.ts`

## 📊 Récapitulatif des endpoints

| Endpoint | Méthode | Auth | Rôle | Status |
|----------|---------|------|------|--------|
| `/api/cours/:id` | GET | ❌ | - | ✅ Fonctionnel |
| `/api/cours/me` | GET | ✅ | Tous | ✅ Fonctionnel |
| `/api/cours/semaine/:weekNumber` | GET | ⚠️ | Tous | ⚠️ Nécessite auth actuellement |
| `/api/cours` | POST | ✅ | Admin | ✅ Fonctionnel |
| `/api/cours/:id/inscription` | POST | ✅ | Tous | ✅ Fonctionnel |
| `/api/cours/inscription/:id` | DELETE | ✅ | Tous | ✅ Fonctionnel |
| `/api/cours/inscription/:id/presence` | PATCH | ✅ | Prof/Admin | ✅ Fonctionnel |
| `/api/cours-recurrents` | GET | ✅ | Admin | ⚠️ Use case manquant |
| `/api/cours-recurrents/actifs` | GET | ✅ | Admin | ⚠️ Use case manquant |
| `/api/cours-recurrents` | POST | ✅ | Admin | ⚠️ Use case manquant |
| `/api/cours-recurrents/:id` | PUT | ✅ | Admin | ⚠️ Use case manquant |
| `/api/cours-recurrents/:id/activate` | PATCH | ✅ | Admin | ⚠️ Use case manquant |
| `/api/cours-recurrents/:id/deactivate` | PATCH | ✅ | Admin | ⚠️ Use case manquant |

## 🎉 Terminé !

La couche Presentation pour le module Cours est maintenant intégrée. 

**Pour plus de détails :** Consultez `README-COURS.md`

---

**Questions ?** Référez-vous à la documentation complète ou au pattern utilisé dans `UserController.ts`.