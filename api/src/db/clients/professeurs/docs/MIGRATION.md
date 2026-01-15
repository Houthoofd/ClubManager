# Guide de Migration - Module Professeurs

## Vue d'ensemble

Ce guide vous accompagne dans la migration du code utilisant l'ancien client `Professeurs` vers la nouvelle architecture modulaire basée sur le `ProfesseursRepository`.

## Pourquoi migrer ?

### Avantages de la nouvelle architecture

✅ **Singleton** - Pas de `new` nécessaire, une seule instance partagée
✅ **Validation automatique** - Toutes les opérations d'écriture sont validées
✅ **Typage fort** - Meilleur support TypeScript et IntelliSense
✅ **Séparation des responsabilités** - Code plus maintenable et testable
✅ **Logs structurés** - Meilleur debugging et monitoring
✅ **API enrichie** - Plus de méthodes et fonctionnalités disponibles
✅ **Cohérence** - Aligné avec les modules `compte`, `messages` et `paiements`

## Table des matières

- [Migration rapide](#migration-rapide)
- [Migration détaillée](#migration-détaillée)
- [Changements de signature](#changements-de-signature)
- [Nouvelles fonctionnalités](#nouvelles-fonctionnalités)
- [Checklist de migration](#checklist-de-migration)

## Migration rapide

### 1. Import

**Avant :**
```typescript
import { Professeurs } from './db/clients/professeurs/professeurs.js';
```

**Après :**
```typescript
import { getProfesseursRepository } from './db/clients/professeurs';
```

### 2. Instanciation

**Avant :**
```typescript
const professeurs = new Professeurs();
```

**Après :**
```typescript
const repository = getProfesseursRepository();
```

### 3. Utilisation

**Avant :**
```typescript
const result = await professeurs.obtenirLesProfesseurs();
```

**Après :**
```typescript
const result = await repository.obtenirLesProfesseurs();
```

## Migration détaillée

### Méthode par méthode

#### 1. `obtenirLesProfesseurs()`

**Avant :**
```typescript
import { Professeurs } from './db/clients/professeurs/professeurs.js';

const professeurs = new Professeurs();
const result = await professeurs.obtenirLesProfesseurs();

if (result.isFind) {
  console.log('Professeurs trouvés:', result.data);
}
```

**Après :**
```typescript
import { getProfesseursRepository } from './db/clients/professeurs';

const repository = getProfesseursRepository();
const result = await repository.obtenirLesProfesseurs();

if (result.isFind) {
  console.log('Professeurs trouvés:', result.data);
}
```

**Changements :**
- ✅ Signature identique
- ✅ Retour identique
- ✅ Migration transparente

---

#### 2. `obtenirProfesseurParId(id: number)`

**Avant :**
```typescript
const professeurs = new Professeurs();
const professeur = await professeurs.obtenirProfesseurParId(123);

if (professeur) {
  console.log(`Professeur: ${professeur.prenom} ${professeur.nom}`);
}
```

**Après :**
```typescript
const repository = getProfesseursRepository();
const professeur = await repository.obtenirProfesseurParId(123);

if (professeur) {
  console.log(`Professeur: ${professeur.prenom} ${professeur.nom}`);
}
```

**Changements :**
- ✅ Signature identique
- ✅ Retour identique
- ✅ Migration transparente

---

#### 3. `modifierStatutProfesseur(id: number, status_id: number)`

**Avant :**
```typescript
const professeurs = new Professeurs();
const result = await professeurs.modifierStatutProfesseur(123, 5);

if (result.isConfirm) {
  console.log('Statut modifié');
}
```

**Après :**
```typescript
const repository = getProfesseursRepository();
const result = await repository.modifierStatutProfesseur(123, 5);

if (result.isConfirm) {
  console.log('Statut modifié');
}
```

**Changements :**
- ✅ Signature identique
- ✅ Retour identique
- ✅ **Nouveau** : Validation automatique de l'existence de l'utilisateur

---

#### 4. `retirerPromotionProfesseur(id: number)`

**Avant :**
```typescript
const professeurs = new Professeurs();
const result = await professeurs.retirerPromotionProfesseur(123);

if (result.isConfirm) {
  console.log('Promotion retirée');
}
```

**Après :**
```typescript
const repository = getProfesseursRepository();
const result = await repository.retirerPromotionProfesseur(123);

if (result.isConfirm) {
  console.log('Promotion retirée');
} else {
  console.error('Erreur:', result.message);
}
```

**Changements :**
- ✅ Signature identique
- ✅ Retour identique
- ✅ **Nouveau** : Validation automatique (existence + pas de cours actifs)

---

#### 5. `ajouterUnProfesseur(userData)`

**Avant :**
```typescript
const professeurs = new Professeurs();

// Un utilisateur
const result = await professeurs.ajouterUnProfesseur({ id: 456 });

// Plusieurs utilisateurs
const result = await professeurs.ajouterUnProfesseur({
  utilisateurs: [456, 789, 101]
});
```

**Après :**
```typescript
const repository = getProfesseursRepository();

// Un utilisateur
const result = await repository.ajouterUnProfesseur({ id: 456 });

// Plusieurs utilisateurs
const result = await repository.ajouterUnProfesseur({
  utilisateurs: [456, 789, 101]
});
```

**Changements :**
- ✅ Signature identique
- ✅ Retour identique
- ✅ **Nouveau** : Validation automatique (existence + pas déjà professeur)
- ✅ **Nouveau** : Meilleurs messages d'erreur

---

#### 6. `obtenirPlanningCoursProfesseur(inputId: number)`

**Avant :**
```typescript
const professeurs = new Professeurs();
const planning = await professeurs.obtenirPlanningCoursProfesseur(123);

if (planning.isFind) {
  planning.data.forEach(cours => {
    console.log(`${cours.type_cours} - ${cours.jour_semaine}`);
  });
}
```

**Après :**
```typescript
const repository = getProfesseursRepository();
const planning = await repository.obtenirPlanningCoursProfesseur(123);

if (planning.isFind) {
  planning.data.forEach(cours => {
    console.log(`${cours.type_cours} - ${cours.jour_semaine}`);
  });
}
```

**Changements :**
- ✅ Signature identique
- ✅ Retour identique
- ✅ Migration transparente

---

#### 7. `obtenirUtilisateurParId(id: number)`

**Avant :**
```typescript
const professeurs = new Professeurs();
const utilisateur = await professeurs.obtenirUtilisateurParId(123);

if (utilisateur) {
  console.log(`Utilisateur: ${utilisateur.first_name} ${utilisateur.last_name}`);
}
```

**Après :**
```typescript
const repository = getProfesseursRepository();
const utilisateur = await repository.obtenirUtilisateurParId(123);

if (utilisateur) {
  console.log(`Utilisateur: ${utilisateur.first_name} ${utilisateur.last_name}`);
}
```

**Changements :**
- ✅ Signature identique
- ✅ Retour identique
- ✅ Migration transparente

---

## Nouvelles fonctionnalités

### Fonctionnalités disponibles uniquement dans la nouvelle API

#### 1. Recherche de professeurs

```typescript
const repository = getProfesseursRepository();

// Rechercher par nom, prénom ou email
const result = await repository.rechercherProfesseurs("dupont", 20, 0);
console.log(`${result.total} professeurs trouvés`);
```

#### 2. Comptage de professeurs

```typescript
const count = await repository.compterProfesseurs();
console.log(`Total: ${count} professeurs`);
```

#### 3. Validations exposées

```typescript
// Vérifier l'existence
const exists = await repository.utilisateurExiste(123);
const isProfesseur = await repository.professeurExiste(123);
const isAlready = await repository.estDejaProfesseur(123);

// Vérifier les cours
const hasActiveCours = await repository.aProfesseurDesCoursActifs(123);
const coursCount = await repository.compterCoursProfesseur(123);

// Vérifier les dépendances
const deps = await repository.verifierDependancesProfesseur(123);
console.log(`Cours: ${deps.coursCount}, Ponctuels: ${deps.coursPonctuelsCount}`);
```

#### 4. Gestion des cours

```typescript
// Assigner à un cours
await repository.assignerProfesseurACours(coursId, professeurId);

// Retirer d'un cours
await repository.retirerProfesseurDuCours(coursId, professeurId);

// Retirer de tous les cours
await repository.retirerProfesseurDeTousLesCours(professeurId);
```

#### 5. Mise à jour d'informations

```typescript
// Mise à jour complète
await repository.mettreAJourUtilisateur(
  userId,
  "Jean",
  "Dupont",
  "jean.dupont@example.com",
  1, // genre_id
  "1980-05-15",
  5 // grade_id
);

// Mise à jour email uniquement
await repository.mettreAJourEmail(userId, "nouveau@example.com");

// Mise à jour grade uniquement
await repository.mettreAJourGrade(userId, 6);
```

## Changements de signature

### Aucun changement majeur

Toutes les méthodes existantes dans l'ancien client conservent leur signature :
- ✅ `obtenirLesProfesseurs()` - identique
- ✅ `obtenirProfesseurParId(id)` - identique
- ✅ `modifierStatutProfesseur(id, status_id)` - identique
- ✅ `retirerPromotionProfesseur(id)` - identique
- ✅ `ajouterUnProfesseur(userData)` - identique
- ✅ `obtenirPlanningCoursProfesseur(inputId)` - identique
- ✅ `obtenirUtilisateurParId(id)` - identique

## Exemples de migration complets

### Exemple 1 : Service de gestion des professeurs

**Avant :**
```typescript
// professeurs.service.ts (ancien)
import { Professeurs } from './db/clients/professeurs/professeurs.js';

export class ProfesseursService {
  private professeursClient: Professeurs;

  constructor() {
    this.professeursClient = new Professeurs();
  }

  async getAllProfesseurs() {
    return await this.professeursClient.obtenirLesProfesseurs();
  }

  async promouvoir(userId: number) {
    return await this.professeursClient.ajouterUnProfesseur({ id: userId });
  }

  async retrograder(userId: number) {
    return await this.professeursClient.retirerPromotionProfesseur(userId);
  }
}
```

**Après :**
```typescript
// professeurs.service.ts (nouveau)
import { getProfesseursRepository } from './db/clients/professeurs';

export class ProfesseursService {
  private repository = getProfesseursRepository();

  async getAllProfesseurs() {
    return await this.repository.obtenirLesProfesseurs();
  }

  async promouvoir(userId: number) {
    // Validation automatique incluse
    return await this.repository.ajouterUnProfesseur({ id: userId });
  }

  async retrograder(userId: number) {
    // Validation automatique incluse
    return await this.repository.retirerPromotionProfesseur(userId);
  }

  // Nouvelles méthodes possibles
  async rechercherProfesseurs(terme: string) {
    return await this.repository.rechercherProfesseurs(terme);
  }

  async verifierCoursActifs(professeurId: number) {
    return await this.repository.aProfesseurDesCoursActifs(professeurId);
  }
}
```

### Exemple 2 : Resolver GraphQL

**Avant :**
```typescript
// professeurs.resolvers.ts (ancien)
import { Professeurs } from './db/clients/professeurs/professeurs.js';

export const professeursResolvers = {
  Query: {
    professeurs: async () => {
      const client = new Professeurs();
      return await client.obtenirLesProfesseurs();
    },
    professeur: async (_, { id }) => {
      const client = new Professeurs();
      return await client.obtenirProfesseurParId(id);
    }
  },
  Mutation: {
    promouvoirProfesseur: async (_, { id }) => {
      const client = new Professeurs();
      return await client.ajouterUnProfesseur({ id });
    }
  }
};
```

**Après :**
```typescript
// professeurs.resolvers.ts (nouveau)
import { getProfesseursRepository } from './db/clients/professeurs';

const repository = getProfesseursRepository();

export const professeursResolvers = {
  Query: {
    professeurs: async () => {
      return await repository.obtenirLesProfesseurs();
    },
    professeur: async (_, { id }) => {
      return await repository.obtenirProfesseurParId(id);
    },
    rechercherProfesseurs: async (_, { terme, limit, offset }) => {
      return await repository.rechercherProfesseurs(terme, limit, offset);
    }
  },
  Mutation: {
    promouvoirProfesseur: async (_, { id }) => {
      return await repository.ajouterUnProfesseur({ id });
    },
    retrograderProfesseur: async (_, { id }) => {
      return await repository.retirerPromotionProfesseur(id);
    }
  }
};
```

## Checklist de migration

### Phase 1 : Préparation

- [ ] Lire ce guide de migration
- [ ] Lire le fichier ARCHITECTURE.md
- [ ] Lire le README.md du module
- [ ] Identifier tous les fichiers utilisant `Professeurs`
- [ ] Évaluer l'impact de la migration

### Phase 2 : Migration du code

- [ ] Remplacer les imports
  ```typescript
  // Remplacer
  import { Professeurs } from './db/clients/professeurs/professeurs.js';
  // Par
  import { getProfesseursRepository } from './db/clients/professeurs';
  ```

- [ ] Remplacer les instanciations
  ```typescript
  // Remplacer
  const professeurs = new Professeurs();
  // Par
  const repository = getProfesseursRepository();
  ```

- [ ] Mettre à jour les appels de méthodes
  ```typescript
  // Remplacer
  await professeurs.obtenirLesProfesseurs()
  // Par
  await repository.obtenirLesProfesseurs()
  ```

- [ ] Profiter des nouvelles fonctionnalités
  - [ ] Ajouter des validations où nécessaire
  - [ ] Utiliser les nouvelles méthodes de recherche
  - [ ] Utiliser les méthodes de gestion des cours

### Phase 3 : Tests

- [ ] Exécuter les tests unitaires
- [ ] Exécuter les tests d'intégration
- [ ] Tester manuellement les fonctionnalités critiques
- [ ] Vérifier les logs et messages d'erreur

### Phase 4 : Validation

- [ ] Vérifier que toutes les fonctionnalités fonctionnent
- [ ] Vérifier les performances
- [ ] Valider avec l'équipe
- [ ] Déployer en staging
- [ ] Tester en staging
- [ ] Déployer en production

## FAQ

### Q: Dois-je migrer tout le code en une fois ?

**R:** Non, vous pouvez migrer progressivement. Les deux APIs (legacy et nouvelle) coexistent. Migrez fichier par fichier ou module par module.

### Q: Que se passe-t-il si je continue à utiliser l'ancien client ?

**R:** L'ancien client `Professeurs` reste disponible pour la compatibilité. Cependant :
- ❌ Pas de validation automatique
- ❌ Pas de nouvelles fonctionnalités
- ❌ Support limité à l'avenir
- ⚠️ Déprécié, sera supprimé dans une version future

### Q: Les performances sont-elles impactées ?

**R:** Non, les performances sont identiques voire meilleures grâce au singleton et aux optimisations.

### Q: Puis-je utiliser les deux APIs en même temps ?

**R:** Oui, mais ce n'est pas recommandé. Migrez progressivement vers la nouvelle API.

### Q: Comment gérer les erreurs ?

**R:** La nouvelle API fournit des messages d'erreur plus explicites :
```typescript
const result = await repository.ajouterUnProfesseur({ id: 999 });
if (!result.isConfirm) {
  console.error('Erreur:', result.message);
  // "L'utilisateur avec l'ID 999 n'existe pas."
}
```

### Q: Les types TypeScript sont-ils meilleurs ?

**R:** Oui, la nouvelle API utilise des types plus stricts et explicites :
```typescript
import type { 
  Professeur, 
  ProfesseurComplet, 
  ConfirmationResult 
} from './db/clients/professeurs';
```

## Support

Si vous rencontrez des problèmes durant la migration :
1. Consultez ce guide
2. Consultez ARCHITECTURE.md
3. Consultez README.md
4. Consultez les exemples dans les tests
5. Contactez l'équipe de développement

## Conclusion

La migration vers la nouvelle architecture `ProfesseursRepository` est simple et apporte de nombreux avantages. Suivez ce guide étape par étape et n'hésitez pas à demander de l'aide.

**Bon courage ! 🚀**