# TODO - Module Cours - Refactorisation V2

## 📋 État actuel

### ✅ Fait
- [x] Structure de dossiers créée (queries/, repositories/, utils/, docs/, graphql/)
- [x] Types TypeScript complets (`types.ts`)
- [x] GraphQL typeDefs (`graphql/cours/cours.typeDefs.ts`)
- [x] GraphQL index (`graphql/cours/index.ts`)
- [x] README principal avec documentation complète
- [x] Ancien fichier `cours.ts` marqué comme deprecated

### 🚧 En cours / À faire

## 1. Queries SQL (queries/)

### Priorité HAUTE
- [ ] **read.queries.ts** - Requêtes de lecture
  ```typescript
  - FIND_ALL_COURS
  - FIND_COURS_BY_ID
  - FIND_COURS_BY_WEEK
  - FIND_COURS_RECURRENT_BY_ID
  - FIND_ALL_COURS_RECURRENTS
  - GET_JOURS_DE_COURS
  - GET_PARTICIPANTS_BY_COURS
  - GET_SEMAINES_AVEC_COURS
  ```

- [ ] **write.queries.ts** - Requêtes d'écriture
  ```typescript
  - INSERT_COURS_RECURRENT
  - UPDATE_COURS_RECURRENT
  - DELETE_COURS_RECURRENT
  - INSERT_COURS
  - UPDATE_COURS
  - DELETE_COURS
  - GENERATE_COURS_FROM_RECURRENT
  ```

- [ ] **inscriptions.queries.ts** - Gestion inscriptions
  ```typescript
  - INSERT_INSCRIPTION
  - DELETE_INSCRIPTION
  - UPDATE_PRESENCE
  - CHECK_INSCRIPTION_EXISTS
  - FIND_INSCRIPTIONS_BY_USER
  - FIND_INSCRIPTIONS_BY_COURS
  - COUNT_INSCRIPTIONS
  ```

- [ ] **statistics.queries.ts** - Statistiques
  ```typescript
  - GET_STATS_PRESENCE_COURS
  - GET_STATS_PRESENCE_USER
  - GET_STATS_GLOBALES
  - GET_TAUX_PRESENCE_MOYEN
  ```

- [ ] **professeurs.queries.ts** - Gestion professeurs
  ```typescript
  - FIND_PROFESSEURS_BY_COURS
  - INSERT_PROFESSEUR_COURS
  - DELETE_PROFESSEUR_COURS
  - FIND_PROFESSEUR_BY_NAME
  ```

- [ ] **index.ts** - Exports centralisés

## 2. Repositories (repositories/)

### Priorité HAUTE
- [ ] **read.repository.ts** - Repository de lecture
  ```typescript
  class CoursReadRepository {
    - findById(id)
    - findAll()
    - findByWeek(week, year)
    - findCoursRecurrentById(id)
    - getAllCoursRecurrents()
    - getJoursDeCoursParSemaine()
    - getSemainesAvecCours()
  }
  ```

- [ ] **write.repository.ts** - Repository d'écriture
  ```typescript
  class CoursWriteRepository {
    - ajouterCoursRecurrent(data)
    - modifierCoursRecurrent(id, data)
    - supprimerCoursRecurrent(id)
    - ajouterCours(data)
    - modifierCours(id, data)
    - supprimerCours(id)
  }
  ```

- [ ] **inscriptions.repository.ts** - Repository inscriptions
  ```typescript
  class CoursInscriptionsRepository {
    - inscrireUtilisateur(userId, coursId, notes?)
    - desinscrireUtilisateur(inscriptionId)
    - verifierInscription(userId, coursId)
    - marquerPresence(inscriptionId, present)
    - getInscriptionsByUser(userId)
    - getInscriptionsByCours(coursId)
    - countInscriptions(coursId)
  }
  ```

- [ ] **statistics.repository.ts** - Repository statistiques
  ```typescript
  class CoursStatisticsRepository {
    - getStatistiquesPresenceCours(coursId)
    - getStatistiquesPresenceUtilisateur(userId)
    - getStatistiquesGlobales()
    - getTauxPresenceMoyen()
  }
  ```

- [ ] **professeurs.repository.ts** - Repository professeurs
  ```typescript
  class CoursProfesseursRepository {
    - getProfesseursByCours(coursId)
    - associerProfesseurs(coursRecurrentId, professeurs[])
    - supprimerProfesseur(coursRecurrentId, professeurNom)
    - findProfesseurByName(nom, prenom)
  }
  ```

## 3. Repository Agrégateur

### Priorité HAUTE
- [ ] **cours.repository.ts** - Facade principale
  ```typescript
  class CoursRepository {
    private readRepo: CoursReadRepository
    private writeRepo: CoursWriteRepository
    private inscriptionsRepo: CoursInscriptionsRepository
    private statsRepo: CoursStatisticsRepository
    private profsRepo: CoursProfesseursRepository
    
    // Délégation vers les repositories spécialisés
    // + méthodes de composition si nécessaire
  }
  
  export function getCoursRepository(): CoursRepository
  ```

## 4. Utilitaires (utils/)

### Priorité MOYENNE
- [ ] **parsing.utils.ts** - Parsing de données
  ```typescript
  - parseCoursRow(row)
  - parseCoursRecurrentRow(row)
  - parseInscriptionRow(row)
  - parseProfesseurRow(row)
  - parseStatistiquesRow(row)
  - parseJourDeCoursRow(row)
  ```

- [ ] **validation.utils.ts** - Validation
  ```typescript
  - validateCoursData(data)
  - validateTimeFormat(time)
  - validateJourSemaine(jour)
  - validateDateRange(dateDebut, dateFin)
  - validateCapaciteMax(capacite)
  ```

- [ ] **date.utils.ts** - Manipulation de dates
  ```typescript
  - getWeekNumber(date)
  - getWeekDates(week, year)
  - getJourSemaineNumber(jourName)
  - getJourSemaineName(jourNum)
  - getNextDayOfWeek(startDate, targetDay)
  - generateCoursFromRecurrent(recurrent, dateDebut, dateFin)
  ```

- [ ] **index.ts** - Exports centralisés

## 5. GraphQL Resolvers

### Priorité HAUTE
- [ ] **cours.resolvers.ts** - Resolvers GraphQL
  ```typescript
  export const coursResolvers = {
    Query: {
      cours: async () => { ... }
      coursById: async (_, { id }) => { ... }
      coursParSemaine: async (_, { semaine, annee }) => { ... }
      planningHebdomadaire: async (_, { semaine, annee }) => { ... }
      coursRecurrents: async () => { ... }
      mesInscriptions: async (_, { utilisateurId }) => { ... }
      coursDisponibles: async (_, { utilisateurId }) => { ... }
      participantsCours: async (_, { coursId }) => { ... }
      searchCours: async (_, { filters }) => { ... }
      verifierInscription: async (_, { utilisateurId, coursId }) => { ... }
      disponibiliteCours: async (_, { coursId }) => { ... }
      semainesAvecCours: async () => { ... }
      resumeHebdomadaire: async (_, { semaine, annee }) => { ... }
      statistiquesCours: async (_, { coursId }) => { ... }
      statistiquesUtilisateur: async (_, { utilisateurId }) => { ... }
      statistiquesGlobales: async () => { ... }
    },
    Mutation: {
      ajouterCoursRecurrent: async (_, { data }) => { ... }
      modifierCoursRecurrent: async (_, { id, data }) => { ... }
      supprimerCoursRecurrent: async (_, { id }) => { ... }
      ajouterCours: async (_, { data }) => { ... }
      modifierCours: async (_, { id, data }) => { ... }
      supprimerCours: async (_, { id }) => { ... }
      inscrireUtilisateur: async (_, { utilisateurId, coursId, notes }) => { ... }
      desinscrireUtilisateur: async (_, { inscriptionId }) => { ... }
      marquerPresence: async (_, { inscriptionId, present }) => { ... }
      validerPresence: async (_, { inscriptionId }) => { ... }
      annulerPresence: async (_, { inscriptionId }) => { ... }
      associerProfesseurs: async (_, { coursRecurrentId, professeurs }) => { ... }
      supprimerProfesseur: async (_, { coursRecurrentId, professeurNom }) => { ... }
    },
    Cours: {
      professeurs: async (parent) => { ... }
      participants: async (parent) => { ... }
      places_disponibles: async (parent) => { ... }
      complet: async (parent) => { ... }
    }
  }
  ```

## 6. Documentation (docs/)

### Priorité MOYENNE
- [ ] **ARCHITECTURE_V2.md** - Architecture complète
  - Description des couches
  - Patterns utilisés
  - Flux de données
  - Diagrammes

- [ ] **MIGRATION_GUIDE.md** - Guide de migration
  - Migration V1 → V2
  - Exemples avant/après
  - Tableau de correspondance des méthodes
  - Pièges à éviter

- [ ] **CHANGELOG.md** - Historique des changements
  - Version 2.0.0
  - Changements majeurs
  - Nouvelles fonctionnalités
  - Deprecated items

- [ ] **API_REFERENCE.md** - Référence API
  - Liste complète des méthodes
  - Paramètres et types de retour
  - Exemples d'utilisation
  - Codes d'erreur

## 7. Tests

### Priorité MOYENNE
- [ ] **tests/repositories/** - Tests des repositories
  - read.repository.test.ts
  - write.repository.test.ts
  - inscriptions.repository.test.ts
  - statistics.repository.test.ts
  - professeurs.repository.test.ts

- [ ] **tests/utils/** - Tests des utilitaires
  - parsing.utils.test.ts
  - validation.utils.test.ts
  - date.utils.test.ts

- [ ] **tests/graphql/** - Tests GraphQL
  - cours.resolvers.test.ts
  - Integration tests

- [ ] **tests/integration/** - Tests d'intégration
  - Scénarios complets
  - End-to-end tests

## 8. Dépréciation progressive

### Priorité BASSE
- [ ] **Marquer cours.ts comme deprecated** ✅ (Fait)
- [ ] **Créer fichier de compatibilité** si nécessaire
- [ ] **Migrer les routes REST** vers nouveau repository
- [ ] **Migrer les tests existants**
- [ ] **Planifier suppression V3.0.0**

## 9. Intégration GraphQL

### Priorité HAUTE
- [ ] **Intégrer dans server.ts**
  ```typescript
  import { coursTypeDefs, coursResolvers } from './graphql/cours';
  
  const typeDefs = [
    baseTypeDefs,
    alertesTypeDefs,
    commandesTypeDefs,
    compteTypeDefs,
    coursTypeDefs, // ← Ajouter
  ];
  
  const resolvers = mergeResolvers([
    baseResolvers,
    alertesResolvers,
    commandesResolvers,
    compteResolvers,
    coursResolvers, // ← Ajouter
  ]);
  ```

## 10. Service Layer (Optionnel mais recommandé)

### Priorité BASSE
- [ ] **CoursService** - Logique métier
  ```typescript
  class CoursService {
    - validateAndCreateCours(data)
    - validateAndUpdateCours(id, data)
    - checkCapaciteBeforeInscription(coursId)
    - sendNotificationInscription(userId, coursId)
    - handleRecurrentGeneration(recurrentId, dateDebut, dateFin)
  }
  ```

## 📊 Estimation du travail

- **Queries** : ~4-6 heures
- **Repositories** : ~8-10 heures
- **Utilitaires** : ~3-4 heures
- **GraphQL Resolvers** : ~6-8 heures
- **Documentation** : ~4-6 heures
- **Tests** : ~8-12 heures
- **Intégration** : ~2-3 heures

**Total estimé** : 35-50 heures de développement

## 🎯 Plan d'action suggéré

### Phase 1 (Priorité critique) - Semaine 1
1. Créer toutes les queries SQL
2. Créer tous les repositories
3. Créer le repository agrégateur
4. Tests basiques des repositories

### Phase 2 (Fonctionnel) - Semaine 2
1. Créer les utilitaires
2. Créer les resolvers GraphQL
3. Intégrer dans le serveur GraphQL
4. Tests d'intégration

### Phase 3 (Documentation) - Semaine 3
1. Documentation complète (ARCHITECTURE, MIGRATION, etc.)
2. Tests unitaires complets
3. Code review
4. Déploiement staging

### Phase 4 (Finition) - Semaine 4
1. Tests end-to-end
2. Performance tuning
3. Migration du code existant
4. Déploiement production

## 📝 Notes importantes

- Suivre le même pattern que `compte` et `commandes`
- Utiliser les types TypeScript stricts partout
- Toutes les requêtes SQL doivent être paramétrées
- Ajouter des tests pour chaque nouvelle fonctionnalité
- Documenter au fur et à mesure
- Faire des commits atomiques

## 🔗 Références

- Module compte : `api/src/db/clients/compte/`
- Module commandes : `api/src/db/clients/commandes/`
- GraphQL compte : `api/src/graphql/compte/`
- GraphQL commandes : `api/src/graphql/commandes/`

## ✅ Checklist de validation

Avant de considérer le module terminé :

- [ ] Tous les fichiers queries créés et testés
- [ ] Tous les repositories créés et testés
- [ ] Repository agrégateur fonctionnel
- [ ] Utilitaires créés et testés
- [ ] GraphQL resolvers implémentés
- [ ] GraphQL intégré au serveur
- [ ] Documentation complète rédigée
- [ ] Tests unitaires > 80% coverage
- [ ] Tests d'intégration passent
- [ ] Code review effectué
- [ ] Performance validée
- [ ] Ancien code marqué deprecated
- [ ] Migration guide validé par l'équipe

---

**Status actuel** : 🟡 En cours (20% complété)  
**Dernière mise à jour** : 2024-01-XX  
**Responsable** : Équipe Dev