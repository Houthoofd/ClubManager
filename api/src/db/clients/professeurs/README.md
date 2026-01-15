# Module Professeurs

Module de gestion des professeurs pour l'application ClubManager.

## Table des matières

- [Installation](#installation)
- [Utilisation rapide](#utilisation-rapide)
- [API](#api)
  - [Opérations de lecture](#opérations-de-lecture)
  - [Opérations d'écriture](#opérations-décriture)
  - [Opérations de validation](#opérations-de-validation)
- [Types](#types)
- [Exemples](#exemples)
- [Migration du code legacy](#migration-du-code-legacy)
- [Architecture](#architecture)
- [Tests](#tests)

## Installation

Le module est disponible dans le projet ClubManager :

```typescript
import { getProfesseursRepository } from './db/clients/professeurs';
```

## Utilisation rapide

```typescript
import { getProfesseursRepository } from './db/clients/professeurs';

// Obtenir l'instance du repository (singleton)
const repository = getProfesseursRepository();

// Récupérer tous les professeurs
const professeurs = await repository.obtenirLesProfesseurs();

// Récupérer un professeur par ID
const professeur = await repository.obtenirProfesseurParId(123);

// Promouvoir un utilisateur en professeur
const result = await repository.ajouterUnProfesseur({ id: 456 });

// Récupérer le planning d'un professeur
const planning = await repository.obtenirPlanningCoursProfesseur(123);
```

## API

### Opérations de lecture

#### `obtenirLesProfesseurs()`

Récupère la liste de tous les professeurs.

```typescript
const result = await repository.obtenirLesProfesseurs();

// Retour: VerifyResultWithData<Professeur[]>
// {
//   isFind: true,
//   message: "Professeurs trouvés",
//   data: [{ id, nom, prenom, email, ... }]
// }
```

#### `obtenirProfesseurParId(id: number)`

Récupère un professeur par son ID.

```typescript
const professeur = await repository.obtenirProfesseurParId(123);

// Retour: ProfesseurComplet | null
// {
//   id: 123,
//   nom: "Dupont",
//   prenom: "Jean",
//   email: "jean.dupont@example.com",
//   genre_id: 1,
//   date_naissance: "1980-05-15",
//   grade_id: 5,
//   status_id: 5
// }
```

#### `obtenirUtilisateurParId(id: number)`

Récupère un utilisateur par son ID (peu importe son statut).

```typescript
const utilisateur = await repository.obtenirUtilisateurParId(456);

// Retour: Utilisateur | null
```

#### `obtenirPlanningCoursProfesseur(inputId: number)`

Récupère le planning des cours d'un professeur.

```typescript
const planning = await repository.obtenirPlanningCoursProfesseur(123);

// Retour: VerifyResultWithData<CoursRecurrent[]>
// {
//   isFind: true,
//   message: "Planning des cours trouvé",
//   data: [
//     {
//       cours_recurrent_id: 1,
//       type_cours: "Judo",
//       jour_semaine: 1, // Lundi
//       heure_debut: "18:00",
//       heure_fin: "19:00",
//       est_recurrent_actif: true,
//       professeur_id: 123,
//       professeur_nom: "Dupont",
//       professeur_prenom: "Jean"
//     }
//   ]
// }
```

#### `rechercherProfesseurs(searchTerm: string, limit?: number, offset?: number)`

Recherche des professeurs par nom, prénom ou email.

```typescript
const result = await repository.rechercherProfesseurs("dupont", 20, 0);

// Retour: ProfesseursSearchResult
// {
//   professeurs: [...],
//   total: 5
// }
```

#### `compterProfesseurs()`

Compte le nombre total de professeurs.

```typescript
const count = await repository.compterProfesseurs();
// Retour: number (ex: 42)
```

### Opérations d'écriture

#### `ajouterUnProfesseur(userData)`

Ajoute/promeut un ou plusieurs utilisateurs en professeurs.

**Un seul utilisateur :**

```typescript
const result = await repository.ajouterUnProfesseur({ id: 456 });

// Retour: ConfirmationResult
// {
//   isConfirm: true,
//   message: "Tous les utilisateurs ont été promus professeurs."
// }
```

**Plusieurs utilisateurs (batch) :**

```typescript
const result = await repository.ajouterUnProfesseur({
  utilisateurs: [456, 789, 101]
});

// ou avec objets
const result = await repository.ajouterUnProfesseur({
  utilisateurs: [{ id: 456 }, { id: 789 }, { id: 101 }]
});
```

#### `modifierStatutProfesseur(id: number, status_id: number)`

Modifie le statut d'un professeur/utilisateur.

```typescript
const result = await repository.modifierStatutProfesseur(123, 5);

// Retour: ConfirmationResult
// {
//   isConfirm: true,
//   message: "Statut modifié avec succès."
// }
```

#### `retirerPromotionProfesseur(id: number)`

Retire la promotion professeur d'un utilisateur (rétrograde au statut utilisateur).

```typescript
const result = await repository.retirerPromotionProfesseur(123);

// Retour: ConfirmationResult
// {
//   isConfirm: true,
//   message: "Promotion retirée avec succès. Le professeur a été retiré de tous ses cours."
// }
```

**Note :** Cette opération échoue si le professeur a des cours actifs.

#### `assignerProfesseurACours(coursId: number, professeurId: number)`

Assigne un professeur à un cours récurrent.

```typescript
const result = await repository.assignerProfesseurACours(10, 123);

// Retour: ConfirmationResult
```

#### `retirerProfesseurDuCours(coursId: number, professeurId: number)`

Retire un professeur d'un cours récurrent.

```typescript
const result = await repository.retirerProfesseurDuCours(10, 123);

// Retour: ConfirmationResult
```

#### `retirerProfesseurDeTousLesCours(professeurId: number)`

Retire un professeur de tous ses cours récurrents.

```typescript
const result = await repository.retirerProfesseurDeTousLesCours(123);

// Retour: ConfirmationResult
```

#### `mettreAJourUtilisateur(userId, firstName, lastName, email, genreId, dateOfBirth, gradeId)`

Met à jour les informations complètes d'un utilisateur/professeur.

```typescript
const result = await repository.mettreAJourUtilisateur(
  123,
  "Jean",
  "Dupont",
  "jean.dupont@example.com",
  1,
  "1980-05-15",
  5
);

// Retour: ConfirmationResult
```

#### `mettreAJourEmail(userId: number, email: string)`

Met à jour uniquement l'email d'un utilisateur.

```typescript
const result = await repository.mettreAJourEmail(123, "nouveau.email@example.com");

// Retour: ConfirmationResult
```

#### `mettreAJourGrade(userId: number, gradeId: number)`

Met à jour uniquement le grade d'un utilisateur.

```typescript
const result = await repository.mettreAJourGrade(123, 6);

// Retour: ConfirmationResult
```

### Opérations de validation

#### `utilisateurExiste(userId: number)`

Vérifie si un utilisateur existe.

```typescript
const exists = await repository.utilisateurExiste(123);
// Retour: boolean
```

#### `professeurExiste(userId: number)`

Vérifie si un professeur existe.

```typescript
const exists = await repository.professeurExiste(123);
// Retour: boolean
```

#### `estDejaProfesseur(userId: number)`

Vérifie si un utilisateur est déjà professeur.

```typescript
const isProfesseur = await repository.estDejaProfesseur(123);
// Retour: boolean
```

#### `aProfesseurDesCoursActifs(professeurId: number)`

Vérifie si un professeur a des cours actifs.

```typescript
const hasActiveCours = await repository.aProfesseurDesCoursActifs(123);
// Retour: boolean
```

#### `compterCoursProfesseur(professeurId: number)`

Compte le nombre de cours d'un professeur.

```typescript
const count = await repository.compterCoursProfesseur(123);
// Retour: number
```

#### `emailEstUnique(email: string)`

Vérifie si un email est unique dans le système.

```typescript
const isUnique = await repository.emailEstUnique("test@example.com");
// Retour: boolean
```

#### `verifierDependancesProfesseur(professeurId: number)`

Vérifie les dépendances d'un professeur (cours récurrents et ponctuels).

```typescript
const deps = await repository.verifierDependancesProfesseur(123);

// Retour:
// {
//   coursCount: 5,
//   coursPonctuelsCount: 2,
//   hasDependencies: true
// }
```

## Types

### Professeur

```typescript
interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  nom_utilisateur: string;
  email: string;
  genre_id: number;
  date_naissance: Date | string;
  grade_id: number;
}
```

### ProfesseurComplet

```typescript
interface ProfesseurComplet extends Professeur {
  first_name?: string;
  last_name?: string;
  date_of_birth?: Date | string;
  status_id: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}
```

### CoursRecurrent

```typescript
interface CoursRecurrent {
  cours_recurrent_id: number;
  type_cours: string;
  jour_semaine: number; // 0=Dimanche, 1=Lundi, ..., 6=Samedi
  heure_debut: string;
  heure_fin: string;
  est_recurrent_actif: boolean | number;
  professeur_id: number;
  professeur_nom: string;
  professeur_prenom: string;
}
```

### ConfirmationResult

```typescript
interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
}
```

### VerifyResultWithData

```typescript
interface VerifyResultWithData<T = any> {
  isFind: boolean;
  message: string;
  data: T;
}
```

## Exemples

### Exemple complet : Gestion d'un professeur

```typescript
import { getProfesseursRepository } from './db/clients/professeurs';

async function gererProfesseur() {
  const repository = getProfesseursRepository();

  // 1. Vérifier si l'utilisateur existe
  const userExists = await repository.utilisateurExiste(456);
  if (!userExists) {
    console.error("Utilisateur non trouvé");
    return;
  }

  // 2. Vérifier s'il est déjà professeur
  const isProfesseur = await repository.estDejaProfesseur(456);
  if (isProfesseur) {
    console.log("Utilisateur déjà professeur");
    return;
  }

  // 3. Promouvoir l'utilisateur
  const result = await repository.ajouterUnProfesseur({ id: 456 });
  if (result.isConfirm) {
    console.log("✅ Promotion réussie!");
    
    // 4. Récupérer les informations du nouveau professeur
    const professeur = await repository.obtenirProfesseurParId(456);
    console.log(`Professeur: ${professeur?.prenom} ${professeur?.nom}`);
    
    // 5. Assigner à un cours
    const assignResult = await repository.assignerProfesseurACours(10, 456);
    if (assignResult.isConfirm) {
      console.log("✅ Professeur assigné au cours");
    }
  } else {
    console.error("❌ Erreur:", result.message);
  }
}
```

### Exemple : Promotion en batch

```typescript
import { getProfesseursRepository } from './db/clients/professeurs';

async function promouvoirPlusieurs() {
  const repository = getProfesseursRepository();
  
  const utilisateurs = [456, 789, 101, 202];
  
  const result = await repository.ajouterUnProfesseur({
    utilisateurs: utilisateurs
  });
  
  console.log(result.message);
  
  if (result.isConfirm) {
    // Vérifier le nombre total de professeurs
    const count = await repository.compterProfesseurs();
    console.log(`Total de professeurs: ${count}`);
  }
}
```

### Exemple : Retirer la promotion avec vérification

```typescript
import { getProfesseursRepository } from './db/clients/professeurs';

async function retirerPromotion(professeurId: number) {
  const repository = getProfesseursRepository();
  
  // Vérifier si le professeur a des cours actifs
  const hasActiveCours = await repository.aProfesseurDesCoursActifs(professeurId);
  
  if (hasActiveCours) {
    console.log("⚠️ Le professeur a des cours actifs");
    
    // Obtenir les détails
    const deps = await repository.verifierDependancesProfesseur(professeurId);
    console.log(`Cours récurrents: ${deps.coursCount}`);
    console.log(`Cours ponctuels: ${deps.coursPonctuelsCount}`);
    
    // Retirer de tous les cours d'abord
    const removeResult = await repository.retirerProfesseurDeTousLesCours(professeurId);
    if (!removeResult.isConfirm) {
      console.error("Erreur lors du retrait des cours");
      return;
    }
  }
  
  // Retirer la promotion
  const result = await repository.retirerPromotionProfesseur(professeurId);
  if (result.isConfirm) {
    console.log("✅ Promotion retirée avec succès");
  } else {
    console.error("❌ Erreur:", result.message);
  }
}
```

### Exemple : Recherche et filtrage

```typescript
import { getProfesseursRepository } from './db/clients/professeurs';

async function rechercherEtAfficher(terme: string) {
  const repository = getProfesseursRepository();
  
  // Rechercher
  const result = await repository.rechercherProfesseurs(terme, 10, 0);
  
  console.log(`${result.total} professeurs trouvés`);
  
  // Afficher les résultats
  for (const prof of result.professeurs) {
    console.log(`- ${prof.prenom} ${prof.nom} (${prof.email})`);
    
    // Récupérer le planning de chaque professeur
    const planning = await repository.obtenirPlanningCoursProfesseur(prof.id);
    console.log(`  ${planning.data.length} cours`);
  }
}
```

## Migration du code legacy

Si vous utilisez l'ancien client `Professeurs`, voici comment migrer :

### Avant (legacy)

```typescript
import { Professeurs } from './db/clients/professeurs/professeurs.js';

const professeurs = new Professeurs();
const result = await professeurs.obtenirLesProfesseurs();
const professeur = await professeurs.obtenirProfesseurParId(123);
const ajout = await professeurs.ajouterUnProfesseur({ id: 456 });
```

### Après (nouveau)

```typescript
import { getProfesseursRepository } from './db/clients/professeurs';

const repository = getProfesseursRepository();
const result = await repository.obtenirLesProfesseurs();
const professeur = await repository.obtenirProfesseurParId(123);
const ajout = await repository.ajouterUnProfesseur({ id: 456 });
```

**Différences :**
- ✅ Pas de `new` nécessaire (singleton)
- ✅ Validation automatique avant les opérations d'écriture
- ✅ Meilleur typage TypeScript
- ✅ API plus riche (plus de méthodes disponibles)

**Compatibilité :**
Le client legacy reste disponible pour la compatibilité, mais son utilisation est découragée.

## Architecture

Ce module suit une architecture modulaire en couches :

```
professeurs/
├── types.ts                    # Types, DTOs, enums
├── queries/                    # Requêtes SQL
│   ├── read.queries.ts
│   ├── write.queries.ts
│   └── validation.queries.ts
├── repositories/               # Accès aux données
│   ├── read.repository.ts
│   ├── write.repository.ts
│   └── validation.repository.ts
├── professeurs.repository.ts   # Repository principal
└── index.ts                    # Point d'entrée
```

Pour plus de détails, consultez [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Tests

### Tests unitaires

```typescript
import { getProfesseursRepository } from './db/clients/professeurs';

describe('ProfesseursRepository', () => {
  let repository: ProfesseursRepository;

  beforeAll(() => {
    repository = getProfesseursRepository();
  });

  it('devrait récupérer tous les professeurs', async () => {
    const result = await repository.obtenirLesProfesseurs();
    expect(result.isFind).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('devrait promouvoir un utilisateur', async () => {
    const result = await repository.ajouterUnProfesseur({ id: 456 });
    expect(result.isConfirm).toBe(true);
  });

  it('devrait valider l\'existence d\'un professeur', async () => {
    const exists = await repository.professeurExiste(123);
    expect(typeof exists).toBe('boolean');
  });
});
```

## Constantes

### Statuts utilisateur

```typescript
import { UserStatus, PROFESSEUR_STATUS_ID, UTILISATEUR_STATUS_ID } from './db/clients/professeurs';

// PROFESSEUR_STATUS_ID = 5
// UTILISATEUR_STATUS_ID = 1

// Enum UserStatus
UserStatus.UTILISATEUR = 1
UserStatus.ADMIN = 2
UserStatus.MODERATEUR = 3
UserStatus.ELEVE = 4
UserStatus.PROFESSEUR = 5
```

### Jours de la semaine

```typescript
import { JourSemaine } from './db/clients/professeurs';

JourSemaine.DIMANCHE = 0
JourSemaine.LUNDI = 1
JourSemaine.MARDI = 2
JourSemaine.MERCREDI = 3
JourSemaine.JEUDI = 4
JourSemaine.VENDREDI = 5
JourSemaine.SAMEDI = 6
```

## Gestion des erreurs

Le module gère les erreurs de manière cohérente :

- **Opérations de lecture :** Retournent `null` ou tableau vide si non trouvé, lancent une exception si erreur DB
- **Opérations d'écriture :** Retournent `ConfirmationResult` avec `isConfirm: false` en cas d'erreur
- **Validations :** Retournent des booléens ou objets de validation

```typescript
// Exemple de gestion d'erreur
try {
  const result = await repository.ajouterUnProfesseur({ id: 456 });
  if (!result.isConfirm) {
    console.error("Erreur:", result.message);
    // Gérer l'erreur métier
  }
} catch (error) {
  console.error("Erreur technique:", error);
  // Gérer l'erreur technique (DB, réseau, etc.)
}
```

## Logs

Le module utilise des logs structurés :

- ✅ Succès : `console.log('✅ ...')`
- ⚠️ Avertissements : `console.log('⚠️ ...')`
- ❌ Erreurs : `console.error('Erreur ...')`

## Bonnes pratiques

1. **Toujours valider avant d'écrire**
   ```typescript
   const exists = await repository.utilisateurExiste(userId);
   if (!exists) return;
   ```

2. **Utiliser le singleton**
   ```typescript
   const repository = getProfesseursRepository(); // ✅
   const repository = new ProfesseursRepository(); // ❌
   ```

3. **Gérer les erreurs**
   ```typescript
   const result = await repository.ajouterUnProfesseur({ id: 456 });
   if (!result.isConfirm) {
     // Gérer l'erreur
   }
   ```

4. **Vérifier les dépendances avant suppression**
   ```typescript
   const deps = await repository.verifierDependancesProfesseur(id);
   if (deps.hasDependencies) {
     // Nettoyer les dépendances d'abord
   }
   ```

## Support

Pour toute question ou problème :
1. Consultez ce README
2. Consultez [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
3. Consultez les exemples de code
4. Contactez l'équipe de développement

## Licence

Propriétaire - ClubManager