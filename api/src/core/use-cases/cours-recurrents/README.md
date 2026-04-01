# Use Cases - Cours Récurrents

Ce dossier contient les **Use Cases** (cas d'utilisation) pour la gestion des cours récurrents dans l'application ClubManager.

## 📋 Table des matières

- [Introduction](#introduction)
- [Architecture](#architecture)
- [Use Cases disponibles](#use-cases-disponibles)
  - [GetAllCoursRecurrents](#getallcoursrecurrents)
  - [GetActiveCoursRecurrents](#getactivecoursrecurrents)
  - [CreateCoursRecurrent](#createcoursrecurrent)
- [Patterns et bonnes pratiques](#patterns-et-bonnes-pratiques)
- [Gestion des erreurs](#gestion-des-erreurs)

## Introduction

Les **Use Cases** représentent la logique métier de l'application. Ils orchestrent les interactions entre les entités du domaine, les value objects, et les repositories, tout en restant indépendants des détails techniques (base de données, framework web, etc.).

### Principe de responsabilité unique

Chaque Use Case a une responsabilité claire et unique :
- **GetAllCoursRecurrents** : Récupérer tous les cours récurrents avec pagination
- **GetActiveCoursRecurrents** : Récupérer uniquement les cours actifs
- **CreateCoursRecurrent** : Créer un nouveau cours récurrent avec validation

## Architecture

```
┌─────────────────┐
│   Controllers   │  (Couche Présentation)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Use Cases     │  (Couche Application) ◄── Vous êtes ici
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Entities + Value Objects       │  (Couche Domaine)
│  - CoursRecurrent               │
│  - JourSemaine                  │
│  - Horaire                      │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Repositories   │  (Couche Infrastructure)
└─────────────────┘
```

## Use Cases disponibles

### GetAllCoursRecurrents

Récupère tous les cours récurrents (actifs et inactifs) avec pagination et tri.

#### Responsabilités
1. Valider les paramètres de pagination (page, limit)
2. Récupérer tous les cours récurrents
3. Appliquer le tri selon les critères spécifiés
4. Calculer les métadonnées de pagination
5. Retourner le résultat paginé

#### DTO (Data Transfer Object)

```typescript
interface GetAllCoursRecurrentsDTO {
  page?: number;        // Numéro de page (défaut: 1, min: 1)
  limit?: number;       // Éléments par page (défaut: 20, min: 1, max: 100)
  sortBy?: string;      // Champ de tri (défaut: 'jour_semaine')
  sortOrder?: 'ASC' | 'DESC';  // Ordre de tri (défaut: 'ASC')
}
```

#### Champs de tri disponibles
- `jour_semaine` : Trier par jour de la semaine (1=Lundi, 7=Dimanche)
- `heure_debut` : Trier par heure de début
- `heure_fin` : Trier par heure de fin
- `type_cours` : Trier par type de cours (alphabétique)
- `active` : Trier par statut (actifs en premier)
- `created_at` : Trier par date de création
- `updated_at` : Trier par date de mise à jour

#### Résultat

```typescript
interface PaginatedResult<CoursRecurrent> {
  data: CoursRecurrent[];  // Les cours de la page demandée
  total: number;           // Nombre total de cours
  page: number;            // Page actuelle
  limit: number;           // Limite par page
  totalPages: number;      // Nombre total de pages
}
```

#### Exemple d'utilisation

```typescript
import { GetAllCoursRecurrentsUseCase } from './GetAllCoursRecurrents.usecase';

// Injection de dépendances
const useCase = new GetAllCoursRecurrentsUseCase(coursRecurrentRepository);

// Exécution avec pagination
const result = await useCase.execute({
  page: 2,
  limit: 10,
  sortBy: 'jour_semaine',
  sortOrder: 'ASC'
});

console.log(result);
// {
//   data: [...],
//   total: 42,
//   page: 2,
//   limit: 10,
//   totalPages: 5
// }
```

#### Erreurs possibles

- `ValidationError` : Si `page < 1` ou `limit` hors de la plage [1, 100]

---

### GetActiveCoursRecurrents

Récupère uniquement les cours récurrents actifs, triés selon les critères spécifiés.

#### Responsabilités
1. Valider les paramètres de tri
2. Récupérer les cours récurrents actifs via le repository
3. Appliquer le tri
4. Retourner la liste complète (sans pagination)

#### DTO

```typescript
interface GetActiveCoursRecurrentsDTO {
  sortBy?: string;             // Champ de tri (défaut: 'jour_semaine')
  sortOrder?: 'ASC' | 'DESC';  // Ordre de tri (défaut: 'ASC')
}
```

#### Particularités

- Retourne **tous** les cours actifs (pas de pagination)
- Tri par défaut : jour de semaine puis heure de début
- Utilisé pour afficher le planning hebdomadaire

#### Exemple d'utilisation

```typescript
import { GetActiveCoursRecurrentsUseCase } from './GetActiveCoursRecurrents.usecase';

const useCase = new GetActiveCoursRecurrentsUseCase(coursRecurrentRepository);

// Récupérer tous les cours actifs triés par jour
const coursActifs = await useCase.execute({
  sortBy: 'jour_semaine',
  sortOrder: 'ASC'
});

// Grouper par jour de semaine pour affichage
const parJour = coursActifs.reduce((acc, cours) => {
  const jour = cours.jourSemaine.getNom();
  if (!acc[jour]) acc[jour] = [];
  acc[jour].push(cours);
  return acc;
}, {});
```

#### Erreurs possibles

- `ValidationError` : Si `sortOrder` n'est pas 'ASC' ou 'DESC'

---

### CreateCoursRecurrent

Crée un nouveau cours récurrent avec validation complète et vérification de chevauchement.

#### Responsabilités
1. Valider les données d'entrée (type_cours, jour_semaine, horaires, professeurs)
2. Créer les Value Objects (JourSemaine, Horaire)
3. Vérifier qu'il n'y a pas de chevauchement avec d'autres cours actifs
4. Créer l'entité CoursRecurrent
5. Persister dans la base de données
6. Retourner le cours créé avec son ID

#### DTO

```typescript
interface CreateCoursRecurrentDTO {
  type_cours: string;               // Type de cours (min: 3 caractères)
  jour_semaine: string | number;    // Jour (1-7 ou "lundi", "mardi", etc.)
  heure_debut: string;              // Format "HH:MM" ou "HH:MM:SS"
  heure_fin: string;                // Format "HH:MM" ou "HH:MM:SS"
  professeurs?: number[];           // IDs des professeurs (optionnel)
}
```

#### Règles métier appliquées

1. **Type de cours**
   - Obligatoire
   - Minimum 3 caractères
   - Maximum 255 caractères
   - Trimé automatiquement

2. **Jour de semaine**
   - Accepte nombre (1-7) ou nom ("lundi", "mardi", etc.)
   - Validation via Value Object `JourSemaine`

3. **Horaires**
   - Format valide requis
   - Heure de début < Heure de fin
   - Validation via Value Object `Horaire`

4. **Professeurs**
   - Optionnel (tableau vide par défaut)
   - IDs valides uniquement (entiers > 0)
   - Pas de doublons

5. **Chevauchement**
   - Vérifie les cours actifs du même jour
   - Rejette si chevauchement détecté

6. **Statut**
   - Créé actif par défaut

#### Exemple d'utilisation

```typescript
import { CreateCoursRecurrentUseCase } from './CreateCoursRecurrent.usecase';

const useCase = new CreateCoursRecurrentUseCase(coursRecurrentRepository);

// Créer un cours récurrent
const nouveauCours = await useCase.execute({
  type_cours: 'Yoga Débutant',
  jour_semaine: 1,  // ou "lundi"
  heure_debut: '18:00',
  heure_fin: '19:30',
  professeurs: [42, 123]
});

console.log(nouveauCours.id); // 15
console.log(nouveauCours.isActive()); // true
console.log(nouveauCours.toString()); 
// "Yoga Débutant - Lundi 18:00 - 19:30"
```

#### Erreurs possibles

- `ValidationError` : Données invalides
  - `type_cours` : Vide, trop court (<3), ou trop long (>255)
  - `jour_semaine` : Valeur invalide
  - `heure_debut` ou `heure_fin` : Format invalide ou vide
  - `professeurs` : IDs invalides ou doublons
  - `horaire` : Chevauchement détecté

- `HoraireInvalideError` : Heure de début >= Heure de fin

- `JourSemaineInvalideError` : Jour hors de la plage [1, 7]

## Patterns et bonnes pratiques

### 1. Séparation des responsabilités

Chaque Use Case a une responsabilité unique et bien définie. Pas de code technique (SQL, HTTP, etc.) dans les Use Cases.

### 2. Injection de dépendances

```typescript
// ✅ Bon : Dépendances injectées via constructeur
export class CreateCoursRecurrentUseCase {
  constructor(
    private readonly coursRecurrentRepository: ICoursRecurrentRepository
  ) {}
}

// ❌ Mauvais : Dépendances instanciées directement
export class CreateCoursRecurrentUseCase {
  private repository = new CoursRecurrentRepository();
}
```

### 3. DTOs typés

Les DTOs définissent clairement les données attendues :

```typescript
// ✅ Bon : DTO typé et documenté
export interface CreateCoursRecurrentDTO {
  type_cours: string;
  jour_semaine: string | number;
  // ...
}

// ❌ Mauvais : Paramètres non structurés
execute(typeCours: string, jour: any, debut: string, ...)
```

### 4. Validation en couches

1. **Validation DTO** : Format et présence des données
2. **Validation Value Objects** : Règles métier des valeurs
3. **Validation Entité** : Règles métier complexes
4. **Validation Use Case** : Règles transversales (chevauchement, etc.)

### 5. Documentation JSDoc

Chaque Use Case et méthode importante est documentée :

```typescript
/**
 * Exécute le use case de création de cours récurrent
 *
 * @param dto - DTO contenant les données du cours récurrent à créer
 * @returns Le cours récurrent créé avec son ID
 * @throws ValidationError si les données sont invalides
 * @throws HoraireInvalideError si les horaires sont invalides
 */
async execute(dto: CreateCoursRecurrentDTO): Promise<CoursRecurrent>
```

## Gestion des erreurs

### Hiérarchie des erreurs

```
DomainError (base)
├── ValidationError
├── HoraireInvalideError
├── JourSemaineInvalideError
└── CoursRecurrentNotFoundError
```

### Erreurs opérationnelles vs programmation

- **Erreurs opérationnelles** : Attendues et gérées (ValidationError, etc.)
- **Erreurs de programmation** : Bugs à corriger (TypeError, etc.)

### Bonnes pratiques

```typescript
// ✅ Bon : Erreurs spécifiques et informatives
throw new ValidationError(
  'type_cours',
  'Le type de cours doit contenir au moins 3 caractères'
);

// ❌ Mauvais : Erreurs génériques
throw new Error('Invalid data');
```

### Gestion dans les contrôleurs

```typescript
try {
  const result = await useCase.execute(dto);
  return res.status(201).json({ success: true, data: result });
} catch (error) {
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }
  // Erreur inattendue
  throw error;
}
```

## Tests recommandés

Pour chaque Use Case, tester :

1. **Cas nominal** : Fonctionnement normal avec données valides
2. **Validation** : Chaque règle de validation
3. **Règles métier** : Chevauchement, contraintes, etc.
4. **Cas limites** : Valeurs limites, tableaux vides, etc.
5. **Erreurs** : Chaque type d'erreur levée

Exemple :

```typescript
describe('CreateCoursRecurrentUseCase', () => {
  it('should create a cours recurrent with valid data', async () => {
    // Arrange
    const dto = { type_cours: 'Yoga', jour_semaine: 1, ... };
    
    // Act
    const result = await useCase.execute(dto);
    
    // Assert
    expect(result.id).toBeDefined();
    expect(result.typeCours).toBe('Yoga');
  });

  it('should throw ValidationError if type_cours is too short', async () => {
    const dto = { type_cours: 'AB', ... };
    
    await expect(useCase.execute(dto))
      .rejects.toThrow(ValidationError);
  });
});
```

---

**Note** : Cette documentation évolue avec le projet. N'hésitez pas à la mettre à jour lors de l'ajout de nouveaux Use Cases.