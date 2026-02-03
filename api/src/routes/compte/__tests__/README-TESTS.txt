================================================================================
TESTS D'INTÉGRATION - MODULE COMPTE
================================================================================

Ce dossier contient une suite complète de tests pour le module Compte,
organisée selon les mêmes patterns que le module Cours (avec DI).

================================================================================
FICHIERS DE TESTS
================================================================================

1. compte.test.ts
   - Tests de base (happy path)
   - Fonctionnalités principales du service Compte
   - Tests des méthodes CRUD de base

2. compte.unit.exemple.test.ts ⭐ NOUVEAU
   - Tests unitaires avec injection de dépendance (DI)
   - Exemple d'utilisation des mocks
   - Pattern identique à cours.unit.exemple.test.ts
   - 23 tests couvrant tous les handlers

3. compte.integration.test.ts
   - Tests d'intégration entre composants
   - Cycles de vie complets (création → modification)
   - Scénarios multi-étapes

4. compte.real-integration.test.ts
   - Tests d'intégration avec vraie base de données MySQL
   - Utilise Prisma et une DB de test
   - Tests de performance et concurrence

5. compte.validation.test.ts
   - Tests de validation des données
   - Formats email, dates, IDs
   - Conversions de types

6. compte.edge-cases.test.ts
   - Tests de cas limites
   - Caractères spéciaux, longueurs max/min
   - Valeurs extrêmes

7. compte.errors.test.ts
   - Tests de gestion d'erreurs
   - Erreurs DB, timeout, contraintes
   - Messages d'erreur appropriés

8. compte.security.test.ts
   - Tests de sécurité
   - Protection injection SQL
   - Hashage des mots de passe

9. compte.performance.test.ts
   - Tests de performance
   - Charge et concurrence
   - Temps de réponse

10. compte.schema.test.ts
    - Tests de schémas Zod
    - Validation des structures de données

11. compte.graphql.integration.test.ts
    - Tests d'intégration GraphQL (si applicable)

12. migration-di.guide.ts
    - Guide de migration vers DI
    - Exemples et bonnes pratiques

================================================================================
MIGRATION VERS INJECTION DE DÉPENDANCE (DI)
================================================================================

✅ HANDLERS MODIFIÉS POUR SUPPORTER DI :
-----------------------------------------

Tous les handlers acceptent maintenant un paramètre optionnel compteClient :

1. getInformations(req, res, compteClient?: Compte)
   - Obtenir informations utilisateur par prénom/nom
   - Retourne 200 avec données ou 404 si non trouvé

2. createPassword(req, res, compteClient?: Compte)
   - Créer un mot de passe initial
   - Hash automatique avec bcrypt
   - Retourne 200 si créé, 400 si déjà existant

3. changePassword(req, res, compteClient?: Compte)
   - Modifier un mot de passe existant
   - Hash automatique avec bcrypt
   - Retourne 200 si modifié, 400 si pas de password existant

4. updateAccount(req, res, compteClient?: Compte)
   - Mettre à jour informations compte
   - Conversion automatique (genres, grades, etc.)
   - Gestion des échéances si abonnement change


PATTERN D'UTILISATION DU DI :
------------------------------

// Dans le handler
const client = compteClient || new Compte();

// Avantages :
- ✅ Compatible avec code production (pas d'injection)
- ✅ Testable unitairement (injection de mocks)
- ✅ Pas de connexion DB dans les tests unitaires
- ✅ Tests rapides et déterministes

================================================================================
EXEMPLE D'UTILISATION DES MOCKS
================================================================================

// Configuration dans beforeEach
let mockCompteClient: Partial<Compte>;

beforeEach(() => {
  mockCompteClient = {
    obtenirInformationsUtilisateur: jest.fn(),
    mettreAJourMotDePasse: jest.fn(),
    mettreAJourUtilisateurAvecConversion: jest.fn(),
  };
});

// Exemple de test avec mock
it('devrait retourner les informations utilisateur', async () => {
  // Arrange
  mockRequest.body = { prenom: 'John', nom: 'Doe' };

  (mockCompteClient.obtenirInformationsUtilisateur as jest.Mock)
    .mockResolvedValue({
      isFind: true,
      data: { id: 1, first_name: 'John', last_name: 'Doe' }
    });

  // Act
  await getInformations(
    mockRequest as Request,
    mockResponse as Response,
    mockCompteClient as Compte
  );

  // Assert
  expect(statusMock).toHaveBeenCalledWith(200);
  expect(jsonMock).toHaveBeenCalledWith({
    success: true,
    utilisateur: expect.objectContaining({
      first_name: 'John'
    })
  });
});

================================================================================
CONTRAT D'INTERFACE MOCK
================================================================================

Les méthodes mockées doivent respecter ces signatures :

1. obtenirInformationsUtilisateur(prenom: string, nom: string)
   → Promise<VerifyResultWithData>
   Structure retour : { isFind: boolean, message: string, data: any }

2. mettreAJourMotDePasse(id: number, hash: string, isCreation: boolean)
   → Promise<ConfirmationResult>
   Structure retour : { isConfirm: boolean, message: string }

3. mettreAJourUtilisateurAvecConversion(id: number, updateData: any)
   → Promise<ConfirmationResult>
   Structure retour : { isConfirm: boolean, message: string }

================================================================================
EXÉCUTION DES TESTS
================================================================================

# Tous les tests compte
npm run test:api -- api/src/routes/compte/__tests__

# Tests unitaires avec DI uniquement
npm run test:api -- api/src/routes/compte/__tests__/compte.unit.exemple.test.ts

# Tests d'intégration réels (nécessite MySQL)
npm run test:api -- api/src/routes/compte/__tests__/compte.real-integration.test.ts

# Tests de validation
npm run test:api -- api/src/routes/compte/__tests__/compte.validation.test.ts

# Tests de sécurité
npm run test:api -- api/src/routes/compte/__tests__/compte.security.test.ts

================================================================================
RÉSULTATS ACTUELS
================================================================================

✅ compte.unit.exemple.test.ts : 23/23 tests passent
   - getInformations : 4 tests
   - createPassword : 4 tests
   - changePassword : 3 tests
   - updateAccount : 8 tests
   - Scénarios intégration : 2 tests
   - Validation et sécurité : 2 tests

Total : Suite complète de tests fonctionnelle avec DI

================================================================================
PROCHAINES ÉTAPES RECOMMANDÉES
================================================================================

1. ✅ Ajouter des tests pour d'autres endpoints si nécessaire
2. ⏳ Améliorer la couverture de code (viser 90%+)
3. ⏳ Ajouter des tests de charge/stress
4. ⏳ Documenter les cas d'usage métier spécifiques
5. ⏳ Créer des tests E2E avec Supertest

================================================================================
NOTES IMPORTANTES
================================================================================

- Les tests utilisent .env.test pour la configuration
- bcrypt est mocké dans les tests unitaires pour performance
- Les tests réels nécessitent une DB MySQL de test configurée
- Le pattern DI permet de tester sans connexions DB réelles
- Tous les mots de passe sont hashés avec bcrypt (10 rounds)

================================================================================
RÉFÉRENCES
================================================================================

- Thread DI migration : voir documentation Cours Unit Tests DI Migration
- Contrat mock : voir migration-di.guide.ts
- Exemples cours : api/src/routes/cours/__tests__/

================================================================================
AUTEUR & DATE
================================================================================

Créé le : 2025
Basé sur : Patterns de tests du module Cours
Inspiré par : Migration DI et refactorisation suite de tests Cours

================================================================================
