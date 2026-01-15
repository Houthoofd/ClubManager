# Plan d'Action - Complétion des Modules GraphQL

## 🎯 Objectif

Compléter les 6 modules GraphQL restants pour uniformiser l'architecture du projet ClubManager et permettre une API GraphQL complète et cohérente.

---

## 📊 État Actuel

### ✅ Modules Terminés (2/8)
1. **Paiements** - 100% terminé
2. **Messagerie** - 100% terminé

### ⏳ Modules À Compléter (6/8)
3. **Utilisateurs** - Priorité HAUTE
4. **Magasin** - Priorité HAUTE
5. **Inscription** - Priorité HAUTE
6. **Statistiques** - Priorité MOYENNE
7. **Stock** - Priorité MOYENNE
8. **Verification** - Priorité MOYENNE

---

## 🚀 Plan d'Action Détaillé

### ÉTAPE 1: Compléter le module Utilisateurs (2-3h)

**Priorité:** 🔴 HAUTE (module central)

**Localisation:** `api/src/graphql/utilisateurs/`

**Client DB:** `api/src/db/clients/utilisateurs/utilisateurs.ts` (Legacy - pas de repository)

#### Tâches:
1. [ ] Analyser le client DB legacy `utilisateurs.ts`
2. [ ] Créer `utilisateurs.typeDefs.ts` avec:
   - Type `Utilisateur` complet
   - Type `UtilisateurComplet` avec relations
   - Type `UtilisateurProfile`
   - Queries: `utilisateurs`, `utilisateur(id)`, `utilisateurParEmail(email)`
   - Queries: `rechercherUtilisateurs`, `utilisateursActifs`, `utilisateursProfesseurs`
   - Mutations: `creerUtilisateur`, `mettreAJourUtilisateur`, `supprimerUtilisateur`
   - Mutations: `activerUtilisateur`, `desactiverUtilisateur`
   - Mutations: `changerMotDePasse`, `mettreAJourProfile`
3. [ ] Créer `utilisateurs.resolvers.ts` avec tous les resolvers
4. [ ] Tester les queries/mutations dans GraphQL Playground

**Estimation:** 2-3 heures

---

### ÉTAPE 2: Compléter le module Magasin (2-3h)

**Priorité:** 🔴 HAUTE (fonctionnalité e-commerce)

**Localisation:** `api/src/graphql/magasin/`

**Client DB:** `api/src/db/clients/magasin/magasin.repository.ts` (✅ Repository moderne)

#### Tâches:
1. [ ] Analyser le repository `getMagasinRepository()`
2. [ ] Créer `magasin.typeDefs.ts` avec:
   - Type `Article` avec images et stocks
   - Type `ArticleAvecCategorie`
   - Type `Categorie`, `Taille`, `StockArticle`
   - Type `Commande`, `ArticleCommande`
   - Queries: `articles`, `article(id)`, `articlesParCategorie`
   - Queries: `categories`, `tailles`, `stocksArticle(article_id)`
   - Queries: `rechercherArticles`, `articlesPopulaires`
   - Mutations: `creerArticle`, `mettreAJourArticle`, `supprimerArticle`
   - Mutations: `ajouterStock`, `retirerStock`
   - Mutations: `creerCategorie`, `creerTaille`
3. [ ] Créer `magasin.resolvers.ts` avec tous les resolvers
4. [ ] Tester les queries/mutations dans GraphQL Playground

**Estimation:** 2-3 heures

---

### ÉTAPE 3: Compléter le module Inscription (3-4h)

**Priorité:** 🔴 HAUTE (fonctionnalité cœur)

**Localisation:** `api/src/graphql/inscription/`

**Client DB:** `api/src/db/clients/inscription/inscription.repository.ts` (✅ Repository moderne)

#### Tâches:
1. [ ] Analyser le repository `getInscriptionRepository()`
2. [ ] Créer `inscription.typeDefs.ts` avec:
   - Type `Cours` (ponctuel)
   - Type `CoursRecurrent`
   - Type `Inscription`
   - Type `Presence`
   - Type `PlanningCours`
   - Type `StatistiquesPresence`
   - Queries: `cours`, `coursRecurrents`, `planning`
   - Queries: `inscriptions`, `inscriptionsUtilisateur`, `participantsCours`
   - Queries: `presencesCours`, `statistiquesPresence`
   - Mutations: `creerCours`, `creerCoursRecurrent`, `modifierCours`
   - Mutations: `inscrireUtilisateur`, `desinscrireUtilisateur`
   - Mutations: `marquerPresence`, `annulerPresence`
   - Mutations: `assignerProfesseur`, `retirerProfesseur`
3. [ ] Créer `inscription.resolvers.ts` avec tous les resolvers
4. [ ] Tester les queries/mutations dans GraphQL Playground

**Estimation:** 3-4 heures

---

### ÉTAPE 4: Compléter le module Statistiques (1-2h)

**Priorité:** 🟡 MOYENNE

**Localisation:** `api/src/graphql/statistiques/`

**Client DB:** `api/src/db/clients/statistiques/statistiques.ts` (Legacy)

#### Tâches:
1. [ ] Analyser le client DB legacy `statistiques.ts`
2. [ ] Créer `statistiques.typeDefs.ts` avec:
   - Type `StatistiquesGlobales`
   - Type `StatistiquesUtilisateurs`
   - Type `StatistiquesCours`
   - Type `StatistiquesPaiements`
   - Type `StatistiquesMagasin`
   - Type `KPI`
   - Queries: `statistiquesGlobales`, `statistiquesParModule`
   - Queries: `kpisPrincipaux`, `tendances`
   - Queries: `rapportPeriode(debut, fin)`
3. [ ] Créer `statistiques.resolvers.ts` avec tous les resolvers
4. [ ] Tester les queries dans GraphQL Playground

**Estimation:** 1-2 heures

---

### ÉTAPE 5: Compléter le module Stock (1-2h)

**Priorité:** 🟡 MOYENNE

**Localisation:** `api/src/graphql/stock/`

**Client DB:** `api/src/db/clients/stock/stock.ts` (Legacy)

#### Tâches:
1. [ ] Analyser le client DB legacy `stock.ts`
2. [ ] Créer `stock.typeDefs.ts` avec:
   - Type `Stock`
   - Type `MouvementStock`
   - Type `AlerteStock`
   - Type `Inventaire`
   - Queries: `stocks`, `stock(article_id, taille_id)`
   - Queries: `mouvementsStock`, `alertesStockBas`
   - Queries: `historiqueStock(article_id)`
   - Mutations: `ajouterStock`, `retirerStock`
   - Mutations: `creerMouvement`, `creerInventaire`
3. [ ] Créer `stock.resolvers.ts` avec tous les resolvers
4. [ ] Tester les queries/mutations dans GraphQL Playground

**Estimation:** 1-2 heures

---

### ÉTAPE 6: Compléter le module Verification (1-2h)

**Priorité:** 🟡 MOYENNE

**Localisation:** `api/src/graphql/verification/`

**Client DB:** `api/src/db/clients/verification/verifications.ts` (Legacy)

#### Tâches:
1. [ ] Analyser le client DB legacy `verifications.ts`
2. [ ] Créer `verification.typeDefs.ts` avec:
   - Type `TokenValidation`
   - Type `VerificationEmail`
   - Type `ResetPassword`
   - Queries: `tokenValide(token)`, `verificationEnAttente(utilisateur_id)`
   - Mutations: `creerTokenValidation`, `validerToken`
   - Mutations: `creerTokenResetPassword`, `resetPassword`
   - Mutations: `renvoyerTokenValidation`
3. [ ] Créer `verification.resolvers.ts` avec tous les resolvers
4. [ ] Tester les queries/mutations dans GraphQL Playground

**Estimation:** 1-2 heures

---

### ÉTAPE 7: Intégration GraphQL (1h)

**Priorité:** 🔴 HAUTE

#### Tâches:
1. [ ] Éditer `api/src/graphql/typeDefs.ts`
   ```typescript
   import { paiementsTypeDefs } from './paiements/index.js';
   import { messagerieTypeDefs } from './messagerie/index.js';
   import { utilisateursTypeDefs } from './utilisateurs/index.js';
   import { magasinTypeDefs } from './magasin/index.js';
   import { inscriptionTypeDefs } from './inscription/index.js';
   import { statistiquesTypeDefs } from './statistiques/index.js';
   import { stockTypeDefs } from './stock/index.js';
   import { verificationTypeDefs } from './verification/index.js';

   export const typeDefs = [
     baseTypeDefs,
     paiementsTypeDefs,
     messagerieTypeDefs,
     utilisateursTypeDefs,
     magasinTypeDefs,
     inscriptionTypeDefs,
     statistiquesTypeDefs,
     stockTypeDefs,
     verificationTypeDefs,
   ];
   ```

2. [ ] Éditer `api/src/graphql/resolvers.ts`
   ```typescript
   import { paiementsResolvers } from './paiements/index.js';
   import { messagerieResolvers } from './messagerie/index.js';
   import { utilisateursResolvers } from './utilisateurs/index.js';
   import { magasinResolvers } from './magasin/index.js';
   import { inscriptionResolvers } from './inscription/index.js';
   import { statistiquesResolvers } from './statistiques/index.js';
   import { stockResolvers } from './stock/index.js';
   import { verificationResolvers } from './verification/index.js';

   export const resolvers = mergeResolvers([
     baseResolvers,
     paiementsResolvers,
     messagerieResolvers,
     utilisateursResolvers,
     magasinResolvers,
     inscriptionResolvers,
     statistiquesResolvers,
     stockResolvers,
     verificationResolvers,
   ]);
   ```

3. [ ] Redémarrer le serveur GraphQL
4. [ ] Vérifier que tous les types et resolvers sont chargés
5. [ ] Tester quelques queries de chaque module

**Estimation:** 1 heure

---

### ÉTAPE 8: Tests et Documentation (3-4h)

**Priorité:** 🟡 MOYENNE

#### Tâches:
1. [ ] Créer des tests unitaires pour chaque resolver
2. [ ] Créer des tests d'intégration GraphQL
3. [ ] Documenter chaque module avec des exemples
4. [ ] Créer un guide d'utilisation de l'API GraphQL
5. [ ] Documenter les schémas et relations

**Estimation:** 3-4 heures

---

### ÉTAPE 9: Sécurité et Performance (2-3h)

**Priorité:** 🔴 HAUTE (pour production)

#### Tâches:
1. [ ] Ajouter l'authentification sur toutes les mutations sensibles
2. [ ] Implémenter les guards d'autorisation (rôles/permissions)
3. [ ] Ajouter l'audit logging pour les opérations critiques
4. [ ] Implémenter DataLoader pour éviter les requêtes N+1
5. [ ] Ajouter du caching pour les queries fréquentes
6. [ ] Limiter la profondeur des queries
7. [ ] Ajouter la validation des inputs

**Estimation:** 2-3 heures

---

## 📅 Timeline Proposé

### Option 1: Sprint Intensif (2-3 jours)
- **Jour 1:** Étapes 1-3 (Utilisateurs, Magasin, Inscription)
- **Jour 2:** Étapes 4-6 (Statistiques, Stock, Verification)
- **Jour 3:** Étapes 7-9 (Intégration, Tests, Sécurité)

### Option 2: Sprint Normal (1 semaine)
- **Lundi:** Étape 1 (Utilisateurs)
- **Mardi:** Étape 2 (Magasin)
- **Mercredi:** Étape 3 (Inscription)
- **Jeudi:** Étapes 4-6 (Statistiques, Stock, Verification)
- **Vendredi:** Étapes 7-9 (Intégration, Tests, Sécurité)

### Option 3: Sprint Étalé (2 semaines)
- **Semaine 1:** Étapes 1-6 (Tous les modules)
- **Semaine 2:** Étapes 7-9 (Intégration, Tests, Sécurité)

---

## 🛠️ Ressources et Outils

### Références
- ✅ Modules existants: `professeurs`, `compte`, `messages`
- ✅ Modules terminés: `paiements`, `messagerie`
- 📖 Documentation: `README_NEW_MODULES.md`
- 📊 État d'avancement: `COMPLETION_STATUS.md`

### Outils de développement
- GraphQL Playground: `http://localhost:4000/graphql`
- Apollo Studio: Pour tester et déboguer
- Postman: Pour les requêtes HTTP
- VSCode: Avec extension GraphQL

### Commandes utiles
```bash
# Démarrer le serveur
npm run dev

# Compiler TypeScript
npm run build

# Lancer les tests
npm test

# Vérifier le typage
npm run type-check
```

---

## ✅ Checklist par Module

Utilisez cette checklist pour chaque module:

### Pour chaque module:
- [ ] Analyser le client DB existant
- [ ] Lister toutes les méthodes disponibles
- [ ] Créer le fichier `[module].typeDefs.ts`
  - [ ] Définir tous les types principaux
  - [ ] Définir les types de résultat (Result, WithData, etc.)
  - [ ] Définir les inputs pour les mutations
  - [ ] Définir les queries avec arguments
  - [ ] Définir les mutations avec inputs
  - [ ] Ajouter les commentaires de documentation
- [ ] Créer le fichier `[module].resolvers.ts`
  - [ ] Implémenter tous les resolvers Query
  - [ ] Implémenter tous les resolvers Mutation
  - [ ] Ajouter la gestion d'erreurs
  - [ ] Ajouter les logs appropriés
  - [ ] Typer correctement les arguments
- [ ] Vérifier que `index.ts` exporte correctement
- [ ] Tester dans GraphQL Playground
  - [ ] Tester toutes les queries principales
  - [ ] Tester toutes les mutations principales
  - [ ] Vérifier les cas d'erreur
- [ ] Documenter le module

---

## 🎓 Bonnes Pratiques

### Nommage
- Types GraphQL: `PascalCase` (ex: `Utilisateur`, `CoursRecurrent`)
- Queries: `camelCase` (ex: `utilisateurs`, `utilisateurParId`)
- Mutations: `verbe + Nom` (ex: `creerUtilisateur`, `mettreAJourCours`)
- Inputs: `Create/Update + Entity + Input` (ex: `CreateUtilisateurInput`)

### Structure des resolvers
```typescript
export const [module]Resolvers = {
  Query: {
    [entity]: async (_: any, args: Args, context: GraphQLContext) => {
      try {
        const repository = get[Module]Repository();
        return await repository.[method](args);
      } catch (error) {
        console.error('Erreur description:', error);
        throw new Error('Message utilisateur');
      }
    },
  },
  Mutation: {
    // Même structure
  },
};
```

### Gestion d'erreurs
- Toujours catcher les erreurs dans les resolvers
- Logger les erreurs avec contexte
- Renvoyer des messages utilisateurs clairs
- Ne jamais exposer les détails techniques sensibles

### Performance
- Toujours implémenter la pagination
- Utiliser les index SQL appropriés
- Limiter les données retournées si possible
- Anticiper les requêtes N+1

---

## 🐛 Résolution de Problèmes

### Le serveur GraphQL ne démarre pas
1. Vérifier les imports dans `typeDefs.ts` et `resolvers.ts`
2. Vérifier la syntaxe des schémas GraphQL
3. Vérifier que tous les fichiers exportent correctement
4. Consulter les logs du serveur

### Les queries/mutations ne fonctionnent pas
1. Vérifier que le module est bien importé dans `typeDefs.ts` et `resolvers.ts`
2. Vérifier la syntaxe du schéma GraphQL
3. Vérifier que le resolver est bien implémenté
4. Vérifier les arguments et types
5. Consulter les logs du serveur

### Erreurs TypeScript
1. Vérifier les imports des types
2. Vérifier que les repositories sont correctement typés
3. Utiliser `type` pour les interfaces GraphQL
4. Compiler avec `npm run build` pour voir toutes les erreurs

---

## 📞 Support

En cas de blocage:
1. Consulter les modules existants (professeurs, compte, paiements, messagerie)
2. Consulter la documentation du repository correspondant
3. Vérifier les logs du serveur GraphQL
4. Tester avec des queries simples d'abord
5. Augmenter progressivement la complexité

---

## 🎉 Critères de Succès

Le projet sera considéré comme terminé quand:
- ✅ Les 8 modules GraphQL sont créés et fonctionnels
- ✅ Tous les modules sont intégrés dans le serveur GraphQL
- ✅ Les queries et mutations principales de chaque module fonctionnent
- ✅ Les tests de base passent
- ✅ La documentation est à jour
- ✅ La sécurité de base est en place (auth/authz)
- ✅ Les performances sont acceptables (pas de N+1)

---

**Bon courage ! 🚀**

**Dernière mise à jour:** 2024  
**Durée estimée totale:** 12-20 heures  
**Difficulté:** Moyenne à Avancée