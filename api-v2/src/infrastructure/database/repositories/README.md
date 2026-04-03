# Repositories - Infrastructure Database

Ce dossier contient les implémentations des repositories pour la couche infrastructure, responsables de la persistence des données dans MySQL.

## Vue d'ensemble

Les repositories implémentent le pattern Repository, qui :
- **Découple** la logique métier de la persistence
- **Abstrait** les détails de la base de données
- **Facilite** les tests (mock/stub des interfaces)
- **Respecte** le principe d'inversion de dépendance (SOLID)

## Architecture

```
Domain (Core)                    Infrastructure
┌─────────────────┐             ┌──────────────────────┐
│  IRepository    │◄────────────│  Repository (MySQL)  │
│  (Interface)    │             │  (Implémentation)    │
└─────────────────┘             └──────────────────────┘
        ▲                                  │
        │                                  │
        │                                  ▼
   ┌────┴─────┐                   ┌───────────────┐
   │ Use Case │                   │ MysqlConnector│
   └──────────┘                   └───────────────┘
```

## Repositories disponibles

### 1. UserRepository
**Fichier:** `UserRepository.ts`  
**Interface:** `IUserRepository`  
**Entité:** `User`

Gère la persistence des utilisateurs.

### 2. CoursRepository
**Fichier:** `CoursRepository.ts`  
**Interface:** `ICoursRepository`  
**Entité:** `Cours`  
**Table DB:** `cours`

Gère la persistence des cours (instances spécifiques de cours).

**Méthodes:**
- `findById(id)` - Trouve un cours par son ID
- `findByDate(date)` - Trouve tous les cours d'une date spécifique
- `findByDateRange(debut, fin)` - Trouve tous les cours dans une plage de dates
- `findByWeek(participantId, weekNumber)` - Trouve les cours d'un participant pour une semaine
- `findForParticipant(participantId, limit?)` - Trouve les cours d'un participant avec limite optionnelle
- `findAll()` - Trouve tous les cours
- `save(cours)` - Crée un nouveau cours
- `update(cours)` - Met à jour un cours existant
- `delete(id)` - Supprime un cours

### 3. CoursRecurrentRepository
**Fichier:** `CoursRecurrentRepository.ts`  
**Interface:** `ICoursRecurrentRepository`  
**Entité:** `CoursRecurrent`  
**Tables DB:** `cours_recurrent`, `cours_recurrent_professeur`

Gère la persistence des cours récurrents (templates de cours) et leurs associations avec les professeurs.

**Méthodes:**
- `findById(id)` - Trouve un cours récurrent par son ID
- `findByJourSemaine(jour)` - Trouve tous les cours récurrents pour un jour (1-7)
- `findAll()` - Trouve tous les cours récurrents
- `findActive()` - Trouve tous les cours récurrents actifs uniquement
- `save(coursRecurrent)` - Crée un nouveau cours récurrent
- `update(coursRecurrent)` - Met à jour un cours récurrent existant
- `delete(id)` - Supprime un cours récurrent

**Particularités:**
- Gère automatiquement les associations avec les professeurs
- La suppression supprime aussi les associations dans `cours_recurrent_professeur`
- La mise à jour remplace complètement la liste des professeurs

### 4. InscriptionRepository
**Fichier:** `InscriptionRepository.ts`  
**Interface:** `IInscriptionRepository`  
**Entité:** `Inscription`  
**Table DB:** `inscriptions`

Gère la persistence des inscriptions d'utilisateurs aux cours.

**Méthodes:**
- `findById(id)` - Trouve une inscription par son ID
- `findByCours(coursId)` - Trouve toutes les inscriptions pour un cours
- `findByUtilisateur(utilisateurId)` - Trouve toutes les inscriptions d'un utilisateur
- `findByCoursAndUtilisateur(coursId, utilisateurId)` - Trouve une inscription spécifique
- `save(inscription)` - Crée une nouvelle inscription
- `update(inscription)` - Met à jour une inscription existante
- `delete(id)` - Supprime une inscription

## Utilisation

### Exemple 1: Créer un cours

```typescript
import { CoursRepository } from '@/infrastructure/database/repositories';
import { Cours } from '@/core/domain/entities/Cours';
import { Horaire } from '@/core/domain/value-objects/Horaire';

const coursRepo = new CoursRepository();

// Créer un cours
const nouveauCours = Cours.create({
  dateCours: new Date('2024-01-15'),
  typeCours: 'Yoga',
  horaire: Horaire.create('09:00', '10:30'),
  coursRecurrentId: 1,
});

const coursCreated = await coursRepo.save(nouveauCours);
console.log(`Cours créé avec l'ID: ${coursCreated.id}`);
```

### Exemple 2: Rechercher des cours

```typescript
import { CoursRepository } from '@/infrastructure/database/repositories';

const coursRepo = new CoursRepository();

// Trouver les cours d'un participant
const coursDuParticipant = await coursRepo.findForParticipant(participantId, 10);

// Trouver les cours d'une date
const coursAujourdhui = await coursRepo.findByDate(new Date());

// Trouver les cours d'une semaine
const coursDeLaSemaine = await coursRepo.findByWeek(participantId, 5);
```

### Exemple 3: Gérer un cours récurrent avec professeurs

```typescript
import { CoursRecurrentRepository } from '@/infrastructure/database/repositories';
import { CoursRecurrent } from '@/core/domain/entities/CoursRecurrent';
import { Horaire } from '@/core/domain/value-objects/Horaire';
import { JourSemaine } from '@/core/domain/value-objects/JourSemaine';

const coursRecRepo = new CoursRecurrentRepository();

// Créer un cours récurrent
const nouveauCoursRec = CoursRecurrent.create({
  typeCours: 'Pilates',
  jourSemaine: JourSemaine.fromNom('Lundi'),
  horaire: Horaire.create('18:00', '19:30'),
  active: true,
  professeurs: [1, 2], // IDs des professeurs
});

const created = await coursRecRepo.save(nouveauCoursRec);

// Trouver les cours actifs du lundi
const coursLundi = await coursRecRepo.findByJourSemaine(1);
```

### Exemple 4: Gérer les inscriptions

```typescript
import { InscriptionRepository } from '@/infrastructure/database/repositories';
import { Inscription } from '@/core/domain/entities/Inscription';

const inscriptionRepo = new InscriptionRepository();

// Créer une inscription
const nouvelleInscription = Inscription.create({
  cours_id: 1,
  utilisateur_id: 5,
  is_present: null,
  is_validate: null,
});

const inscriptionCreated = await inscriptionRepo.save(nouvelleInscription);

// Vérifier si un utilisateur est déjà inscrit
const existing = await inscriptionRepo.findByCoursAndUtilisateur(coursId, utilisateurId);
if (existing) {
  console.log('Utilisateur déjà inscrit');
}

// Trouver toutes les inscriptions d'un cours
const inscriptions = await inscriptionRepo.findByCours(coursId);
```

## Pattern de mapping

Tous les repositories suivent le même pattern pour convertir les données :

### DB → Entité (mapRowToEntity)

```typescript
private mapRowToEntity(row: CoursRow): Cours {
  // 1. Créer les Value Objects
  const horaire = Horaire.create(row.heure_debut, row.heure_fin);
  
  // 2. Utiliser fromPersistence pour reconstruire l'entité
  return Cours.fromPersistence({
    id: row.id,
    dateCours: new Date(row.date_cours),
    typeCours: row.type_cours,
    horaire: horaire,
    coursRecurrentId: row.cours_recurrent_id,
    annule: row.annule === 1,
    createdAt: new Date(row.created_at),
  });
}
```

### Entité → DB (dans save/update)

```typescript
const params = [
  cours.dateCours,
  cours.typeCours,
  cours.horaire.getHeureDebut(),
  cours.horaire.getHeureFin(),
  cours.coursRecurrentId,
  cours.annule ? 1 : 0,
];
```

## Gestion des erreurs

Tous les repositories gèrent les erreurs de manière cohérente :

```typescript
try {
  const cours = await coursRepo.findById(1);
  if (!cours) {
    // Cours non trouvé
  }
} catch (error) {
  // Erreur de base de données ou de mapping
  console.error(error.message);
}
```

## Transactions (non implémenté actuellement)

Pour des opérations complexes nécessitant plusieurs repositories, envisager d'ajouter un support de transactions :

```typescript
// TODO: Implémenter le support des transactions
// await transaction(async (repos) => {
//   await repos.cours.save(cours);
//   await repos.inscription.save(inscription);
// });
```

## Tests

Pour tester les use cases sans dépendre de la DB :

1. **Créer un mock du repository:**

```typescript
class MockCoursRepository implements ICoursRepository {
  async findById(id: number): Promise<Cours | null> {
    // Retourner des données de test
    return testCours;
  }
  // ... autres méthodes
}
```

2. **Injecter le mock dans le use case:**

```typescript
const mockRepo = new MockCoursRepository();
const useCase = new GetCoursUseCase(mockRepo);
```

## Bonnes pratiques

1. **Toujours utiliser les interfaces** dans les use cases, jamais les implémentations directes
2. **Utiliser fromPersistence** pour reconstruire les entités depuis la DB
3. **Convertir les Value Objects** correctement (Horaire, JourSemaine, etc.)
4. **Gérer les valeurs NULL** de MySQL (booléens, dates, etc.)
5. **Utiliser les Promises** avec async/await pour la lisibilité
6. **Gérer les erreurs** de manière appropriée
7. **Documenter les méthodes** avec JSDoc

## Maintenance

### Ajouter un nouveau repository

1. Créer l'interface dans `core/domain/interfaces/`
2. Créer l'implémentation dans `infrastructure/database/repositories/`
3. Suivre le pattern des repositories existants
4. Ajouter l'export dans `index.ts`
5. Documenter dans ce README

### Modifier un repository existant

1. Vérifier que l'interface du domaine est à jour
2. Mettre à jour l'implémentation
3. Tester avec les use cases existants
4. Mettre à jour la documentation

## Dépendances

- `mysql2` - Driver MySQL
- `MysqlConnector` - Singleton pour la connexion DB
- Entités du domaine (`Cours`, `CoursRecurrent`, `Inscription`, etc.)
- Value Objects (`Horaire`, `JourSemaine`, `Email`, etc.)

## Conventions de nommage

- **Fichiers**: `{Entity}Repository.ts` (PascalCase)
- **Classes**: `{Entity}Repository` (PascalCase)
- **Méthodes**: `findBy{Criteria}`, `save`, `update`, `delete` (camelCase)
- **Paramètres SQL**: Utiliser `?` pour les paramètres préparés
- **Tables DB**: `snake_case` (ex: `cours_recurrent`)

## Références

- [Pattern Repository](https://martinfowler.com/eaaCatalog/repository.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)