================================================================================
TESTS D'INTÉGRATION - MODULE COURS
================================================================================

Ce dossier contient une suite complète de tests pour le module Cours,
incluant des tests unitaires avec DI et des tests d'intégration avec DB réelle.

================================================================================
FICHIERS DE TESTS
================================================================================

1. cours.test.ts
   - Tests de base (happy path)
   - Fonctionnalités principales du service Cours
   - Tests des méthodes CRUD de base

2. cours.unit.exemple.test.ts
   - Tests unitaires avec injection de dépendance (DI)
   - Exemple d'utilisation des mocks
   - Pattern recommandé pour les tests rapides
   - Tests sans connexion DB réelle

3. cours.handlers-db.test.ts ⭐ NOUVEAU
   - Tests d'intégration réels avec handlers complets
   - Utilise des mocks intelligents du client Cours
   - 80+ tests couvrant tous les handlers
   - Validation, sécurité, et cas limites

4. cours.integration.test.ts
   - Tests d'intégration entre composants
   - Cycles de vie complets (inscription → validation)
   - Scénarios multi-étapes

5. cours.real-integration.test.ts
   - Tests d'intégration avec vraie base de données MySQL
   - Utilise Prisma et une DB de test
   - Tests de performance et concurrence
   - ⚠️ Ignoré par défaut (pattern .integration.test.ts)

6. cours.validation.test.ts
   - Tests de validation des données Zod
   - Formats dates