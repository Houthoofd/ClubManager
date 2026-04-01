# Exemples d'utilisation des Repositories - Module Cours

Ce fichier contient des exemples pratiques et concrets d'utilisation des repositories du module Cours.

## Table des matières

1. [CoursRepository - Exemples de base](#coursrepository---exemples-de-base)
2. [CoursRecurrentRepository - Exemples de base](#coursrecurrentrepository---exemples-de-base)
3. [InscriptionRepository - Exemples de base](#inscriptionrepository---exemples-de-base)
4. [Exemples de cas d'usage réels](#exemples-de-cas-dusage-réels)
5. [Gestion des erreurs](#gestion-des-erreurs)

---

## CoursRepository - Exemples de base

### Créer un nouveau cours

```typescript
import { CoursRepository } from '@/infrastructure/database/repositories';
import { Cours } from '@/core/domain/entities/Cours';
import { Horaire } from '@/core/domain/value-objects/Horaire';

const coursRepo = new CoursRepository();

// Créer un cours de Yoga
const yogaCours = Cours.create({
  dateCours: new Date('2024-02-15'),
  typeCours: 'Yoga',
  horaire: Horaire.create('09:00', '10:30'),
  coursRecurrentId: 1,
});

const created = await coursRepo.save(yogaCours);
console.log(`Cours créé avec l'ID: ${created.id}`);
```

### Trouver un cours par ID

```typescript
const coursRepo = new CoursRepository();

const cours = await coursRepo.findById(1);

if (cours) {
  console.log(`Cours trouvé: ${cours.typeCours} le ${cours.dateCours}`);
  console.log(`Horaire: ${cours.horaire.toString()}`);
  console.log(`Durée: ${cours.getDureeFormatee()}`);
} else {
  console.log('Cours non trouvé');
}
```

### Trouver tous les cours d'une date

```typescript
const coursRepo = new CoursRepository();

// Cours d'aujourd'hui
const coursAujourdhui = await coursRepo.findByDate(new Date());

console.log(`${coursAujourdhui.length} cours trouvés pour aujourd'hui:`);
coursAujourdhui.forEach(cours => {
  console.log(`- ${cours.typeCours} de ${cours.heureDebut} à ${cours.heureFin}`);
});
```

### Trouver les cours d'une période

```typescript
const coursRepo = new CoursRepository();

const debut = new Date('2024-02-01');
const fin = new Date('2024-02-29');

const coursDuMois = await coursRepo.findByDateRange(debut, fin);

console.log(`${coursDuMois.length} cours en février 2024`);
```

### Trouver les cours d'un participant

```typescript
const coursRepo = new CoursRepository();
const participantId = 5;

// Prochains cours du participant (max 12)
const prochainsCours = await coursRepo.findForParticipant(participantId);

console.log(`Prochains cours de l'utilisateur ${participantId}:`);
prochainsCours.forEach(cours => {
  console.log(`- ${cours.dateCours.toLocaleDateString()}: ${cours.typeCours}`);
});

// Avec limite personnalisée
const top5 = await coursRepo.findForParticipant(participantId, 5);
```

### Trouver les cours d'une semaine

```typescript
const coursRepo = new CoursRepository();
const participantId = 5;
const weekNumber = 7; // Semaine 7 de l'année

const coursSemaine = await coursRepo.findByWeek(participantId, weekNumber);

console.log(`Cours de la semaine ${weekNumber}:`);
coursSemaine.forEach(cours => {
  console.log(`- ${cours.dateCours.toLocaleDateString()}: ${cours.typeCours}`);
});
```

### Mettre à jour un cours

```typescript
const coursRepo = new CoursRepository();

// Récupérer le cours
const cours = await coursRepo.findById(1);

if (cours) {
  // Annuler le cours
  cours.annuler();
  
  // Sauvegarder les modifications
  const updated = await coursRepo.update(cours);
  
  console.log(`Cours ${updated.id} annulé avec succès`);
}
```

### Supprimer un cours

```typescript
const coursRepo = new CoursRepository();

const success = await coursRepo.delete(1);

if (success) {
  console.log('Cours supprimé avec succès');
} else {
  console.log('Cours non trouvé ou erreur lors de la suppression');
}
```

---

## CoursRecurrentRepository - Exemples de base

### Créer un cours récurrent avec professeurs

```typescript
import { CoursRecurrentRepository } from '@/infrastructure/database/repositories';
import { CoursRecurrent } from '@/core/domain/entities/CoursRecurrent';
import { Horaire } from '@/core/domain/value-objects/Horaire';
import { JourSemaine } from '@/core/domain/value-objects/JourSemaine';

const coursRecRepo = new CoursRecurrentRepository();

// Créer un cours de Pilates le lundi
const pilatesCours = CoursRecurrent.create({
  typeCours: 'Pilates',
  jourSemaine: JourSemaine.fromNom('Lundi'),
  horaire: Horaire.create('18:00', '19:30'),
  active: true,
  professeurs: [1, 2], // IDs des professeurs
});

const created = await coursRecRepo.save(pilatesCours);
console.log(`Cours récurrent créé avec l'ID: ${created.id}`);
```

### Trouver les cours d'un jour

```typescript
const coursRecRepo = new CoursRecurrentRepository();

// Tous les cours du lundi (jour 1)
const coursLundi = await coursRecRepo.findByJourSemaine(1);

console.log(`Cours récurrents le lundi:`);
coursLundi.forEach(cours => {
  console.log(`- ${cours.typeCours} de ${cours.horaire.toString()}`);
  console.log(`  Professeurs: ${cours.professeurs.length}`);
});
```

### Trouver tous les cours actifs

```typescript
const coursRecRepo = new CoursRecurrentRepository();

const coursActifs = await coursRecRepo.findActive();

console.log(`${coursActifs.length} cours récurrents actifs:`);
coursActifs.forEach(cours => {
  console.log(`- ${cours.jourSemaine.getNom()}: ${cours.typeCours}`);
  console.log(`  ${cours.horaire.toString()}`);
});
```

### Modifier un cours récurrent

```typescript
const coursRecRepo = new CoursRecurrentRepository();

// Récupérer le cours
const cours = await coursRecRepo.findById(1);

if (cours) {
  // Désactiver le cours
  cours.desactiver();
  
  // Ajouter un professeur
  cours.ajouterProfesseur(3);
  
  // Sauvegarder
  const updated = await coursRecRepo.update(cours);
  
  console.log('Cours récurrent mis à jour');
}
```

### Supprimer un cours récurrent

```typescript
const coursRecRepo = new CoursRecurrentRepository();

// La suppression supprime aussi les associations professeurs
const success = await coursRecRepo.delete(1);

if (success) {
  console.log('Cours récurrent et ses associations supprimés');
}
```

---

## InscriptionRepository - Exemples de base

### Créer une inscription

```typescript
import { InscriptionRepository } from '@/infrastructure/database/repositories';
import { Inscription } from '@/core/domain/entities/Inscription';

const inscriptionRepo = new InscriptionRepository();

// Créer une nouvelle inscription
const inscription = Inscription.create({
  cours_id: 1,
  utilisateur_id: 5,
  is_present: null,
  is_validate: null,
});

const created = await inscriptionRepo.save(inscription);
console.log(`Inscription créée avec l'ID: ${created.id}`);
console.log(`Status: ${created.status}`); // EN_ATTENTE par défaut
```

### Vérifier si un utilisateur est déjà inscrit

```typescript
const inscriptionRepo = new InscriptionRepository();

const coursId = 1;
const utilisateurId = 5;

const existing = await inscriptionRepo.findByCoursAndUtilisateur(
  coursId,
  utilisateurId
);

if (existing) {
  console.log('Utilisateur déjà inscrit à ce cours');
  console.log(`Status: ${existing.status}`);
} else {
  console.log('Utilisateur non inscrit');
}
```

### Trouver toutes les inscriptions d'un cours

```typescript
const inscriptionRepo = new InscriptionRepository();

const inscriptions = await inscriptionRepo.findByCours(1);

console.log(`${inscriptions.length} inscriptions pour ce cours:`);
inscriptions.forEach(inscription => {
  console.log(`- Utilisateur ${inscription.utilisateur_id}: ${inscription.status}`);
});
```

### Trouver toutes les inscriptions d'un utilisateur

```typescript
const inscriptionRepo = new InscriptionRepository();

const inscriptions = await inscriptionRepo.findByUtilisateur(5);

console.log(`${inscriptions.length} inscriptions pour cet utilisateur:`);
inscriptions.forEach(inscription => {
  console.log(`- Cours ${inscription.cours_id}: ${inscription.status}`);
});
```

### Confirmer une inscription

```typescript
const inscriptionRepo = new InscriptionRepository();

const inscription = await inscriptionRepo.findById(1);

if (inscription) {
  // Confirmer l'inscription
  inscription.confirmer();
  
  // Sauvegarder
  const updated = await inscriptionRepo.update(inscription);
  
  console.log(`Inscription confirmée: ${updated.status}`);
}
```

### Marquer la présence

```typescript
const inscriptionRepo = new InscriptionRepository();

const inscription = await inscriptionRepo.findById(1);

if (inscription) {
  // Marquer comme présent
  inscription.marquerPresent();
  
  // Sauvegarder
  const updated = await inscriptionRepo.update(inscription);
  
  console.log(`Présence marquée: ${updated.is_present}`);
  console.log(`Status: ${updated.status}`); // PRESENTE
}
```

---

## Exemples de cas d'usage réels

### Cas 1: Inscrire un utilisateur à un cours

```typescript
import { 
  CoursRepository, 
  InscriptionRepository 
} from '@/infrastructure/database/repositories';
import { Inscription } from '@/core/domain/entities/Inscription';

async function inscrireUtilisateur(coursId: number, utilisateurId: number) {
  const coursRepo = new CoursRepository();
  const inscriptionRepo = new InscriptionRepository();
  
  // 1. Vérifier que le cours existe
  const cours = await coursRepo.findById(coursId);
  if (!cours) {
    throw new Error('Cours non trouvé');
  }
  
  // 2. Vérifier que le cours n'est pas annulé
  if (cours.annule) {
    throw new Error('Ce cours est annulé');
  }
  
  // 3. Vérifier que le cours n'est pas passé
  if (cours.estPasse()) {
    throw new Error('Ce cours est déjà passé');
  }
  
  // 4. Vérifier que l'utilisateur n'est pas déjà inscrit
  const existing = await inscriptionRepo.findByCoursAndUtilisateur(
    coursId,
    utilisateurId
  );
  
  if (existing && !existing.isAnnulee()) {
    throw new Error('Utilisateur déjà inscrit à ce cours');
  }
  
  // 5. Créer l'inscription
  const inscription = Inscription.create({
    cours_id: coursId,
    utilisateur_id: utilisateurId,
    is_present: null,
    is_validate: null,
  });
  
  // 6. Sauvegarder
  const created = await inscriptionRepo.save(inscription);
  
  return created;
}

// Utilisation
try {
  const inscription = await inscrireUtilisateur(1, 5);
  console.log(`Inscription créée: ${inscription.id}`);
} catch (error) {
  console.error(error.message);
}
```

### Cas 2: Obtenir le planning d'un participant pour une semaine

```typescript
import { CoursRepository } from '@/infrastructure/database/repositories';

async function getPlanningHebdomadaire(participantId: number, weekNumber: number) {
  const coursRepo = new CoursRepository();
  
  // Récupérer tous les cours de la semaine
  const cours = await coursRepo.findByWeek(participantId, weekNumber);
  
  // Organiser par jour
  const planning = cours.reduce((acc, c) => {
    const jour = c.dateCours.toLocaleDateString('fr-FR', { weekday: 'long' });
    
    if (!acc[jour]) {
      acc[jour] = [];
    }
    
    acc[jour].push({
      id: c.id,
      type: c.typeCours,
      horaire: c.horaire.toString(),
      annule: c.annule,
    });
    
    return acc;
  }, {} as Record<string, any[]>);
  
  return planning;
}

// Utilisation
const planning = await getPlanningHebdomadaire(5, 7);
console.log('Planning de la semaine 7:');
console.log(JSON.stringify(planning, null, 2));
```

### Cas 3: Générer des cours à partir d'un cours récurrent

```typescript
import { 
  CoursRecurrentRepository, 
  CoursRepository 
} from '@/infrastructure/database/repositories';
import { Cours } from '@/core/domain/entities/Cours';

async function genererCoursPourMois(
  coursRecurrentId: number,
  annee: number,
  mois: number
) {
  const coursRecRepo = new CoursRecurrentRepository();
  const coursRepo = new CoursRepository();
  
  // 1. Récupérer le cours récurrent
  const coursRec = await coursRecRepo.findById(coursRecurrentId);
  if (!coursRec) {
    throw new Error('Cours récurrent non trouvé');
  }
  
  if (!coursRec.active) {
    throw new Error('Ce cours récurrent est inactif');
  }
  
  // 2. Trouver tous les jours du mois correspondant au jour de la semaine
  const dates = [];
  const premierJour = new Date(annee, mois - 1, 1);
  const dernierJour = new Date(annee, mois, 0);
  
  for (let date = new Date(premierJour); date <= dernierJour; date.setDate(date.getDate() + 1)) {
    // getDay() retourne 0-6 (Dimanche=0), on veut 1-7 (Lundi=1)
    const jourSemaine = date.getDay() === 0 ? 7 : date.getDay();
    
    if (jourSemaine === coursRec.jourSemaine.getNumero()) {
      dates.push(new Date(date));
    }
  }
  
  // 3. Créer un cours pour chaque date
  const coursCreated = [];
  for (const date of dates) {
    const cours = Cours.create({
      dateCours: date,
      typeCours: coursRec.typeCours,
      horaire: coursRec.horaire,
      coursRecurrentId: coursRec.id!,
    });
    
    const created = await coursRepo.save(cours);
    coursCreated.push(created);
  }
  
  return coursCreated;
}

// Utilisation
const cours = await genererCoursPourMois(1, 2024, 2);
console.log(`${cours.length} cours générés pour février 2024`);
```

### Cas 4: Obtenir les statistiques d'un cours

```typescript
import { 
  CoursRepository, 
  InscriptionRepository 
} from '@/infrastructure/database/repositories';

async function getStatistiquesCours(coursId: number) {
  const coursRepo = new CoursRepository();
  const inscriptionRepo = new InscriptionRepository();
  
  // Récupérer le cours
  const cours = await coursRepo.findById(coursId);
  if (!cours) {
    throw new Error('Cours non trouvé');
  }
  
  // Récupérer toutes les inscriptions
  const inscriptions = await inscriptionRepo.findByCours(coursId);
  
  // Calculer les statistiques
  const stats = {
    cours: {
      id: cours.id,
      type: cours.typeCours,
      date: cours.dateCours,
      horaire: cours.horaire.toString(),
      annule: cours.annule,
    },
    inscriptions: {
      total: inscriptions.length,
      confirmees: inscriptions.filter(i => i.isConfirmee()).length,
      enAttente: inscriptions.filter(i => i.isEnAttente()).length,
      annulees: inscriptions.filter(i => i.isAnnulee()).length,
    },
    presence: {
      presents: inscriptions.filter(i => i.isPresent()).length,
      absents: inscriptions.filter(i => i.isAbsent()).length,
      nonMarques: inscriptions.filter(i => !i.hasPresenceMarquee()).length,
    },
  };
  
  return stats;
}

// Utilisation
const stats = await getStatistiquesCours(1);
console.log('Statistiques du cours:');
console.log(JSON.stringify(stats, null, 2));
```

### Cas 5: Annuler un cours et notifier les participants

```typescript
import { 
  CoursRepository, 
  InscriptionRepository 
} from '@/infrastructure/database/repositories';

async function annulerCours(coursId: number) {
  const coursRepo = new CoursRepository();
  const inscriptionRepo = new InscriptionRepository();
  
  // 1. Récupérer le cours
  const cours = await coursRepo.findById(coursId);
  if (!cours) {
    throw new Error('Cours non trouvé');
  }
  
  // 2. Vérifier qu'il peut être annulé
  if (!cours.peutEtreAnnule()) {
    throw new Error('Ce cours ne peut pas être annulé (déjà passé)');
  }
  
  // 3. Annuler le cours
  cours.annuler();
  const updated = await coursRepo.update(cours);
  
  // 4. Récupérer toutes les inscriptions confirmées
  const inscriptions = await inscriptionRepo.findByCours(coursId);
  const inscriptionsConfirmees = inscriptions.filter(i => i.isConfirmee());
  
  // 5. Annuler toutes les inscriptions confirmées
  for (const inscription of inscriptionsConfirmees) {
    inscription.annuler();
    await inscriptionRepo.update(inscription);
  }
  
  // 6. Retourner les IDs des utilisateurs à notifier
  const utilisateursANotifier = inscriptionsConfirmees.map(
    i => i.utilisateur_id
  );
  
  return {
    cours: updated,
    participantsANotifier: utilisateursANotifier,
  };
}

// Utilisation
try {
  const result = await annulerCours(1);
  console.log(`Cours ${result.cours.id} annulé`);
  console.log(`${result.participantsANotifier.length} participants à notifier`);
  
  // TODO: Envoyer les notifications
} catch (error) {
  console.error(error.message);
}
```

---

## Gestion des erreurs

### Erreur: Cours non trouvé

```typescript
const coursRepo = new CoursRepository();

try {
  const cours = await coursRepo.findById(999);
  
  if (!cours) {
    console.log('Cours non trouvé');
    // Gérer le cas où le cours n'existe pas
  }
} catch (error) {
  console.error('Erreur lors de la recherche:', error.message);
  // Gérer les erreurs de base de données
}
```

### Erreur: Validation lors de la création

```typescript
import { Cours } from '@/core/domain/entities/Cours';
import { Horaire } from '@/core/domain/value-objects/Horaire';
import { ValidationError } from '@/core/domain/errors/DomainError';

try {
  // Cette création va échouer (horaire invalide)
  const cours = Cours.create({
    dateCours: new Date('2024-02-15'),
    typeCours: 'Yoga',
    horaire: Horaire.create('25:00', '26:00'), // Erreur!
    coursRecurrentId: 1,
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Erreur de validation: ${error.message}`);
    console.error(`Champ: ${error.field}`);
  }
}
```

### Erreur: Mise à jour d'un cours sans ID

```typescript
const coursRepo = new CoursRepository();

try {
  const cours = Cours.create({
    dateCours: new Date('2024-02-15'),
    typeCours: 'Yoga',
    horaire: Horaire.create('09:00', '10:30'),
    coursRecurrentId: 1,
  });
  
  // Cette mise à jour va échouer (pas d'ID)
  await coursRepo.update(cours);
} catch (error) {
  console.error('Erreur:', error.message);
  // "Impossible de mettre à jour un cours sans ID"
}
```

### Erreur: Contrainte d'intégrité (clé étrangère)

```typescript
import { Inscription } from '@/core/domain/entities/Inscription';

const inscriptionRepo = new InscriptionRepository();

try {
  // Cette inscription va échouer si le cours 999 n'existe pas
  const inscription = Inscription.create({
    cours_id: 999, // Cours inexistant
    utilisateur_id: 5,
    is_present: null,
    is_validate: null,
  });
  
  await inscriptionRepo.save(inscription);
} catch (error) {
  console.error('Erreur lors de la sauvegarde:', error.message);
  // Gérer l'erreur de contrainte d'intégrité
}
```

---

## Conseils et bonnes pratiques

### 1. Toujours vérifier l'existence avant mise à jour

```typescript
const cours = await coursRepo.findById(id);
if (!cours) {
  throw new Error('Cours non trouvé');
}
cours.annuler();
await coursRepo.update(cours);
```

### 2. Utiliser les méthodes métier de l'entité

```typescript
// ❌ Mauvais
const cours = await coursRepo.findById(id);
// Modifier directement n'est pas possible (propriétés readonly)

// ✅ Bon
const cours = await coursRepo.findById(id);
cours.annuler(); // Utiliser les méthodes métier
await coursRepo.update(cours);
```

### 3. Gérer les cas NULL

```typescript
const cours = await coursRepo.findById(id);

// ✅ Toujours vérifier
if (!cours) {
  // Gérer le cas NULL
  return;
}

// Maintenant cours est de type Cours (non null)
console.log(cours.typeCours);
```

### 4. Utiliser les Value Objects correctement

```typescript
// ✅ Bon
const horaire = Horaire.create('09:00', '10:30');
const jourSemaine = JourSemaine.fromNom('Lundi');

// ❌ Éviter de manipuler les strings directement
const heureDebut = '09:00'; // Pas de validation
```

---

## Ressources supplémentaires

- Voir `README.md` pour la documentation complète
- Voir les tests unitaires pour plus d'exemples
- Voir les interfaces dans `core/domain/interfaces/` pour tous les contrats