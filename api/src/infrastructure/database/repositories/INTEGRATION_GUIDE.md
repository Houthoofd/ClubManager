# Guide d'intégration - Repositories Module Cours

Ce guide vous accompagne pas à pas pour vérifier et intégrer les repositories du module Cours dans votre application.

---

## 📋 Checklist de vérification

Avant de commencer l'intégration, vérifiez que tous les éléments sont en place :

### ✅ Fichiers créés

- [ ] `CoursRepository.ts` - Repository pour les cours
- [ ] `CoursRecurrentRepository.ts` - Repository pour les cours récurrents
- [ ] `InscriptionRepository.ts` - Repository pour les inscriptions
- [ ] `index.ts` - Point d'entrée centralisé
- [ ] `README.md` - Documentation complète
- [ ] `EXAMPLES.md` - Exemples pratiques

### ✅ Dépendances du domaine

- [ ] Interface `ICoursRepository` existe dans `core/domain/interfaces/`
- [ ] Interface `ICoursRecurrentRepository` existe dans `core/domain/interfaces/`
- [ ] Interface `IInscriptionRepository` existe dans `core/domain/interfaces/`
- [ ] Entité `Cours` existe dans `core/domain/entities/`
- [ ] Entité `CoursRecurrent` existe dans `core/domain/entities/`
- [ ] Entité `Inscription` existe dans `core/domain/entities/`
- [ ] Value Object `Horaire` existe dans `core/domain/value-objects/`
- [ ] Value Object `JourSemaine` existe dans `core/domain/value-objects/`

### ✅ Infrastructure

- [ ] `MysqlConnector` est accessible depuis `db/connector/mysqlconnector.js`
- [ ] Les tables de base de données existent :
  - `cours`
  - `cours_recurrent`
  - `cours_recurrent_professeur`
  - `inscriptions`

---

## 🔍 Vérification des tables de base de données

### 1. Vérifier que les tables existent

Connectez-vous à MySQL et exécutez :

```sql
-- Vérifier l'existence des tables
SHOW TABLES LIKE 'cours%';
SHOW TABLES LIKE 'inscriptions';

-- Vérifier la structure de la table cours
DESCRIBE cours;

-- Vérifier la structure de la table cours_recurrent
DESCRIBE cours_recurrent;

-- Vérifier la structure de la table cours_recurrent_professeur
DESCRIBE cours_recurrent_professeur;

-- Vérifier la structure de la table inscriptions
DESCRIBE inscriptions;
```

### 2. Vérifier les colonnes requises

#### Table `cours`
```sql
-- Colonnes attendues
id                  INT
date_cours          DATE
type_cours          VARCHAR
heure_debut         TIME
heure_fin           TIME
cours_recurrent_id  INT
annule              TINYINT(1)
created_at          TIMESTAMP
```

#### Table `cours_recurrent`
```sql
-- Colonnes attendues
id              INT
type_cours      VARCHAR
jour_semaine    INT
heure_debut     TIME
heure_fin       TIME
active          TINYINT(1)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### Table `cours_recurrent_professeur`
```sql
-- Colonnes attendues
cours_recurrent_id  INT
professeur_id       INT
```

#### Table `inscriptions`
```sql
-- Colonnes attendues
id              INT
cours_id        INT
utilisateur_id  INT
is_present      TINYINT(1) NULL
is_validate     TINYINT(1) NULL
status          VARCHAR
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### 3. Script de vérification SQL

```sql
-- Script complet de vérification
SELECT 
    'cours' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'cours'
AND table_schema = DATABASE()

UNION ALL

SELECT 
    'cours_recurrent',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'cours_recurrent'
AND table_schema = DATABASE()

UNION ALL

SELECT 
    'cours_recurrent_professeur',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'cours_recurrent_professeur'
AND table_schema = DATABASE()

UNION ALL

SELECT 
    'inscriptions',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'inscriptions'
AND table_schema = DATABASE();
```

---

## 🧪 Tests de base

### Test 1: Importer les repositories

Créez un fichier `test-repositories.ts` :

```typescript
import { 
  CoursRepository,
  CoursRecurrentRepository,
  InscriptionRepository
} from './infrastructure/database/repositories/index.js';

console.log('✅ Imports réussis');

const coursRepo = new CoursRepository();
const coursRecRepo = new CoursRecurrentRepository();
const inscriptionRepo = new InscriptionRepository();

console.log('✅ Instances créées avec succès');
```

Exécutez :
```bash
npx ts-node test-repositories.ts
```

### Test 2: Test de connexion à la base de données

```typescript
import { CoursRepository } from './infrastructure/database/repositories/index.js';

async function testConnection() {
  try {
    const coursRepo = new CoursRepository();
    const cours = await coursRepo.findAll();
    console.log(`✅ Connexion réussie - ${cours.length} cours trouvés`);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  }
}

testConnection();
```

### Test 3: Test CRUD complet

```typescript
import { CoursRepository } from './infrastructure/database/repositories/index.js';
import { Cours } from './core/domain/entities/Cours.js';
import { Horaire } from './core/domain/value-objects/Horaire.js';

async function testCRUD() {
  const coursRepo = new CoursRepository();
  
  try {
    // CREATE
    console.log('Test CREATE...');
    const nouveauCours = Cours.create({
      dateCours: new Date('2024-12-31'),
      typeCours: 'Test Repository',
      horaire: Horaire.create('10:00', '11:30'),
      coursRecurrentId: 1,
    });
    
    const created = await coursRepo.save(nouveauCours);
    console.log(`✅ CREATE - Cours créé avec ID: ${created.id}`);
    
    // READ
    console.log('Test READ...');
    const found = await coursRepo.findById(created.id!);
    console.log(`✅ READ - Cours trouvé: ${found?.typeCours}`);
    
    // UPDATE
    console.log('Test UPDATE...');
    found!.annuler();
    const updated = await coursRepo.update(found!);
    console.log(`✅ UPDATE - Cours annulé: ${updated.annule}`);
    
    // DELETE
    console.log('Test DELETE...');
    const deleted = await coursRepo.delete(created.id!);
    console.log(`✅ DELETE - Cours supprimé: ${deleted}`);
    
    console.log('\n✅ Tous les tests CRUD ont réussi !');
  } catch (error) {
    console.error('❌ Erreur lors des tests CRUD:', error.message);
  }
}

testCRUD();
```

---

## 🔗 Intégration dans l'application

### Étape 1: Créer le conteneur de dépendances (DI Container)

Créez un fichier `src/infrastructure/di/container.ts` :

```typescript
import { CoursRepository } from '../database/repositories/CoursRepository.js';
import { CoursRecurrentRepository } from '../database/repositories/CoursRecurrentRepository.js';
import { InscriptionRepository } from '../database/repositories/InscriptionRepository.js';

/**
 * Conteneur d'injection de dépendances
 * Centralise la création des instances de repositories
 */
export class DIContainer {
  private static coursRepository: CoursRepository;
  private static coursRecurrentRepository: CoursRecurrentRepository;
  private static inscriptionRepository: InscriptionRepository;

  static getCoursRepository(): CoursRepository {
    if (!this.coursRepository) {
      this.coursRepository = new CoursRepository();
    }
    return this.coursRepository;
  }

  static getCoursRecurrentRepository(): CoursRecurrentRepository {
    if (!this.coursRecurrentRepository) {
      this.coursRecurrentRepository = new CoursRecurrentRepository();
    }
    return this.coursRecurrentRepository;
  }

  static getInscriptionRepository(): InscriptionRepository {
    if (!this.inscriptionRepository) {
      this.inscriptionRepository = new InscriptionRepository();
    }
    return this.inscriptionRepository;
  }
}
```

### Étape 2: Créer les Use Cases

Créez `src/core/application/use-cases/cours/GetCoursUseCase.ts` :

```typescript
import { Cours } from '../../../domain/entities/Cours.js';
import { ICoursRepository } from '../../../domain/interfaces/ICoursRepository.js';
import { CoursNotFoundError } from '../../../domain/errors/CoursError.js';

export class GetCoursUseCase {
  constructor(private coursRepository: ICoursRepository) {}

  async execute(id: number): Promise<Cours> {
    const cours = await this.coursRepository.findById(id);
    
    if (!cours) {
      throw new CoursNotFoundError(id);
    }
    
    return cours;
  }
}
```

Créez `src/core/application/use-cases/cours/CreateCoursUseCase.ts` :

```typescript
import { Cours } from '../../../domain/entities/Cours.js';
import { ICoursRepository } from '../../../domain/interfaces/ICoursRepository.js';
import { Horaire } from '../../../domain/value-objects/Horaire.js';

export interface CreateCoursDTO {
  dateCours: Date;
  typeCours: string;
  heureDebut: string;
  heureFin: string;
  coursRecurrentId: number;
}

export class CreateCoursUseCase {
  constructor(private coursRepository: ICoursRepository) {}

  async execute(dto: CreateCoursDTO): Promise<Cours> {
    // Créer le cours avec validation
    const horaire = Horaire.create(dto.heureDebut, dto.heureFin);
    
    const cours = Cours.create({
      dateCours: dto.dateCours,
      typeCours: dto.typeCours,
      horaire: horaire,
      coursRecurrentId: dto.coursRecurrentId,
    });
    
    // Persister
    return await this.coursRepository.save(cours);
  }
}
```

### Étape 3: Créer les Controllers

Créez `src/presentation/controllers/CoursController.ts` :

```typescript
import { Request, Response } from 'express';
import { DIContainer } from '../../infrastructure/di/container.js';
import { GetCoursUseCase } from '../../core/application/use-cases/cours/GetCoursUseCase.js';
import { CreateCoursUseCase } from '../../core/application/use-cases/cours/CreateCoursUseCase.js';

export class CoursController {
  /**
   * GET /api/cours/:id
   */
  async getCours(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      const coursRepo = DIContainer.getCoursRepository();
      const useCase = new GetCoursUseCase(coursRepo);
      
      const cours = await useCase.execute(id);
      
      res.json({
        success: true,
        data: cours.toPublicObject(),
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/cours
   */
  async createCours(req: Request, res: Response): Promise<void> {
    try {
      const coursRepo = DIContainer.getCoursRepository();
      const useCase = new CreateCoursUseCase(coursRepo);
      
      const cours = await useCase.execute(req.body);
      
      res.status(201).json({
        success: true,
        data: cours.toPublicObject(),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/cours/participant/:id
   */
  async getCoursForParticipant(req: Request, res: Response): Promise<void> {
    try {
      const participantId = parseInt(req.params.id, 10);
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      
      const coursRepo = DIContainer.getCoursRepository();
      const cours = await coursRepo.findForParticipant(participantId, limit);
      
      res.json({
        success: true,
        data: cours.map(c => c.toPublicObject()),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
```

### Étape 4: Créer les Routes

Créez `src/presentation/routes/cours.routes.ts` :

```typescript
import { Router } from 'express';
import { CoursController } from '../controllers/CoursController.js';

const router = Router();
const coursController = new CoursController();

// Routes Cours
router.get('/cours/:id', (req, res) => coursController.getCours(req, res));
router.post('/cours', (req, res) => coursController.createCours(req, res));
router.get('/cours/participant/:id', (req, res) => coursController.getCoursForParticipant(req, res));

export default router;
```

### Étape 5: Enregistrer les routes dans l'application

Dans `src/app.ts` ou `src/server.ts` :

```typescript
import express from 'express';
import coursRoutes from './presentation/routes/cours.routes.js';

const app = express();

app.use(express.json());

// Enregistrer les routes
app.use('/api', coursRoutes);

export default app;
```

---

## 🐛 Résolution des problèmes courants

### Problème 1: "Cannot find module 'mysql2'"

**Solution:** Installer les dépendances
```bash
npm install mysql2
npm install --save-dev @types/mysql2
```

### Problème 2: Erreur de connexion à la base de données

**Vérifications:**
1. Le serveur MySQL est démarré
2. Les credentials sont corrects dans `MysqlConnector`
3. La base de données existe
4. L'utilisateur a les permissions nécessaires

**Test de connexion MySQL:**
```bash
mysql -u votre_user -p
USE votre_database;
SHOW TABLES;
```

### Problème 3: "Table doesn't exist"

**Solution:** Vérifier que toutes les tables sont créées

```sql
-- Si les tables n'existent pas, les créer
CREATE TABLE IF NOT EXISTS cours (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date_cours DATE NOT NULL,
  type_cours VARCHAR(100) NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  cours_recurrent_id INT NOT NULL,
  annule TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Problème 4: Erreur de Value Object

**Exemple:** "Format d'heure invalide"

**Solution:** Vérifier le format des heures
```typescript
// ❌ Incorrect
Horaire.create('9:00', '10:30');

// ✅ Correct
Horaire.create('09:00', '10:30');
// ou
Horaire.create('09:00:00', '10:30:00');
```

### Problème 5: TypeScript ne trouve pas les types

**Solution:** Vérifier tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true
  }
}
```

---

## 📊 Monitoring et Logs

### Ajouter des logs dans les repositories

```typescript
import { Cours } from '../../../core/domain/entities/Cours.js';
import { ICoursRepository } from '../../../core/domain/interfaces/ICoursRepository.js';

export class CoursRepository implements ICoursRepository {
  // ... code existant
  
  async save(cours: Cours): Promise<Cours> {
    console.log(`[CoursRepository] Sauvegarde du cours: ${cours.typeCours}`);
    
    try {
      // ... logique de sauvegarde
      const created = await this.db.query(/* ... */);
      
      console.log(`[CoursRepository] Cours créé avec ID: ${created.id}`);
      return created;
    } catch (error) {
      console.error(`[CoursRepository] Erreur lors de la sauvegarde:`, error);
      throw error;
    }
  }
}
```

### Métriques à surveiller

- Temps de réponse des requêtes
- Nombre de requêtes par minute
- Taux d'erreurs
- Connexions actives à la DB

---

## 🎯 Checklist finale

Avant de considérer l'intégration comme terminée :

- [ ] Tous les tests passent
- [ ] Les routes sont accessibles
- [ ] Les Use Cases fonctionnent
- [ ] Les erreurs sont correctement gérées
- [ ] La documentation est à jour
- [ ] Les logs sont en place
- [ ] Les performances sont acceptables
- [ ] Le code est reviewé

---

## 📚 Ressources supplémentaires

- **Documentation API:** Voir `README.md`
- **Exemples d'utilisation:** Voir `EXAMPLES.md`
- **Architecture:** Voir `COURS_REPOSITORIES_SUMMARY.md`
- **Support:** Contacter l'équipe de développement

---

**Dernière mise à jour:** Janvier 2024  
**Version:** 1.0.0