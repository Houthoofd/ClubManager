# Tests du Module Inscription

Ce document décrit la suite complète de tests pour le module d'inscription.

## 📊 Vue d'ensemble

Le module inscription dispose d'une **couverture de tests complète** inspirée des modules `informations` et `echeances`, avec **12 fichiers de tests** couvrant tous les aspects du système.

## 🗂️ Structure des Tests

```
__tests__/
├── inscription.test.ts                    # Tests unitaires des handlers
├── inscription.validation.test.ts         # Tests de validation Zod
├── inscription.service.test.ts            # Tests unitaires du service
├── inscription.security.test.ts           # Tests de sécurité
├── inscription.edge-cases.test.ts         # Tests des cas limites
├── inscription.errors.test.ts             # Tests de gestion d'erreurs
├── inscription.http-e2e.test.ts           # Tests E2E HTTP (Supertest)
├── inscription.integration.test.ts        # Tests d'intégration (mockés)
├── inscription.real-integration.test.ts   # Tests d'intégration réels (DB)
├── inscription.performance.test.ts        # Tests de performance
├── inscription.service-branches.test.ts   # Tests de couverture des branches
└── inscription.validators-advanced.test.ts # Tests avancés des validateurs
```

## 📝 Description des Fichiers

### 1. `inscription.test.ts`
**Tests unitaires des handlers**
- Tests des routes `/verification` et `/validation`
- Mock des services et dépendances
- Validation des codes HTTP et réponses JSON
- Tests d'erreurs et cas nominaux

### 2. `inscription.validation.test.ts`
**Tests de validation Zod**
- Validation des schémas `emailVerificationSchema` et `inscriptionSchema`
- Tests des transformations (trim, lowercase)
- Validation des règles métier (âge, format email, mot de passe)
- Tests des messages d'erreur

### 3. `inscription.service.test.ts`
**Tests unitaires du service d'inscription**
- Tests de `verifierEmail()`
- Tests de `hashPassword()` (bcrypt)
- Tests de `validerAge()`
- Tests de `inscrireUtilisateur()`
- Tests de `evaluerForceMotDePasse()`
- Tests de `sanitizeUserData()`

### 4. `inscription.security.test.ts`
**Tests de sécurité**
- Protection contre les injections SQL
- Protection contre les attaques XSS
- Validation contre les mass assignments
- Tests de timing attacks
- Non-exposition des mots de passe
- Validation des entrées malveillantes

### 5. `inscription.edge-cases.test.ts`
**Tests des cas limites**
- Valeurs minimales et maximales (longueurs, âges)
- Caractères spéciaux et Unicode
- Espaces et whitespace
- Données malformées
- Formats inhabituels mais valides

### 6. `inscription.errors.test.ts`
**Tests de gestion d'erreurs**
- Erreurs de validation
- Erreurs de base de données
- Erreurs de duplication (email existant)
- Erreurs de sécurité
- Erreurs de hashage
- Codes de statut HTTP appropriés
- Messages d'erreur clairs et sécurisés

### 7. `inscription.http-e2e.test.ts`
**Tests E2E HTTP avec Supertest**
- Tests de bout en bout simulant de vraies requêtes HTTP
- Tests des headers HTTP
- Tests de flux complets (vérification → inscription)
- Tests de concurrence
- Tests de sécurité HTTP
- Tests de performance HTTP

### 8. `inscription.integration.test.ts`
**Tests d'intégration (mockés)**
- Tests avec dépendances mockées pour isolation
- Tests du flux complet d'inscription
- Mock du client `Utilisateurs`
- Tests de la chaîne handlers → service → DB
- Tests de normalisation des données

### 9. `inscription.real-integration.test.ts`
**Tests d'intégration réels (avec DB)**
- Tests avec une vraie base de données de test
- Configuration via `DATABASE_URL` (.env.test)
- Tests de vérification email réels
- Tests d'inscription complète avec hashage réel
- Tests de concurrence et performance réels
- Nettoyage automatique après les tests

⚠️ **Important**: Ces tests nécessitent :
- Variable d'environnement `DATABASE_URL` configurée
- Base de données de test accessible
- Peuvent être désactivés avec `SKIP_REAL_DB_TESTS=true`

### 10. `inscription.performance.test.ts`
**Tests de performance**
- Mesure des temps de réponse
- Tests de charge (1000+ validations)
- Benchmarks des opérations (hashage, validation)
- Tests de concurrence
- Tests de dégradation
- Tests d'utilisation mémoire

### 11. `inscription.service-branches.test.ts`
**Tests de couverture des branches**
- Couverture de 100% des branches du service
- Tests de tous les chemins d'exécution
- Tests des conditions if/else
- Tests des cas d'erreur et d'exception
- Tests des ajustements d'âge (anniversaire)

### 12. `inscription.validators-advanced.test.ts`
**Tests avancés des validateurs Zod**
- Tests approfondis des transformations
- Tests de la chaîne trim → lowercase → validate
- Tests des messages d'erreur personnalisés
- Tests des champs requis/optionnels
- Tests de rejection des champs supplémentaires
- Edge cases avancés

## 🚀 Exécution des Tests

### Tous les tests du module inscription
```bash
npm test -- --testPathPattern="inscription"
```

### Tests unitaires uniquement
```bash
npm test -- inscription.test.ts inscription.service.test.ts inscription.validation.test.ts
```

### Tests de sécurité
```bash
npm test -- inscription.security.test.ts
```

### Tests d'intégration (mockés)
```bash
npm test -- inscription.integration.test.ts
```

### Tests d'intégration réels (avec DB)
```bash
# Configurer .env.test avec DATABASE_URL
npm test -- inscription.real-integration.test.ts
```

### Tests E2E HTTP
```bash
npm test -- inscription.http-e2e.test.ts
```

### Tests de performance
```bash
npm test -- inscription.performance.test.ts
```

### Tests avec couverture
```bash
npm test -- --coverage --testPathPattern="inscription"
```

## 📈 Couverture Attendue

La suite de tests vise les objectifs suivants :

- **Statements**: > 95%
- **Branches**: > 90%
- **Functions**: > 95%
- **Lines**: > 95%

### Par composant

| Composant | Couverture Cible |
|-----------|------------------|
| Handlers | 100% |
| Services | 100% |
| Validators | 100% |
| Routes | 100% |

## 🔧 Configuration

### Variables d'environnement pour les tests

Créer un fichier `.env.test` :

```env
DATABASE_URL=mysql://user:password@localhost:3306/clubmanager_test
SKIP_REAL_DB_TESTS=false  # true pour désactiver les tests DB réels
```

### Configuration Jest

Les tests utilisent :
- `jest.config.js` pour les tests unitaires/intégration mockés
- `jest.real-integration.config.cjs` pour les tests DB réels

## 📋 Checklist de Validation

Avant de merger des modifications :

- [ ] Tous les tests passent
- [ ] Couverture maintenue > 95%
- [ ] Pas de régression sur les tests existants
- [ ] Tests de sécurité passent
- [ ] Tests E2E passent
- [ ] Tests réels passent (si DB disponible)
- [ ] Performance acceptable (benchmarks)

## 🎯 Points Clés Testés

### Validation
- ✅ Format email (RFC 5322)
- ✅ Longueur email (5-255 caractères)
- ✅ Normalisation (trim, lowercase)
- ✅ Format nom/prénom (lettres, accents, traits d'union, apostrophes, espaces)
- ✅ Longueur nom/prénom (1-100 caractères)
- ✅ Force mot de passe (8+ caractères, majuscule, minuscule, chiffre, spécial)
- ✅ Format date (YYYY-MM-DD)
- ✅ Validation âge (5-120 ans)
- ✅ Années bissextiles
- ✅ Abonnement/Genre (entiers positifs)

### Sécurité
- ✅ Hashage bcrypt (salt rounds = 10)
- ✅ Non-exposition des mots de passe
- ✅ Protection injection SQL
- ✅ Protection XSS
- ✅ Sanitization des erreurs DB
- ✅ Validation stricte des entrées

### Business Logic
- ✅ Vérification unicité email
- ✅ Validation âge avec ajustement anniversaire
- ✅ Évaluation force mot de passe (score 0-4)
- ✅ Nettoyage données sensibles
- ✅ Messages d'erreur clairs

### Performance
- ✅ Vérification email < 500ms
- ✅ Inscription complète < 2s
- ✅ Hashage bcrypt < 500ms
- ✅ Validation âge < 50ms
- ✅ Gestion concurrence (10+ requêtes simultanées)

## 🔍 Debugging

Pour déboguer un test spécifique :

```bash
# Avec logs détaillés
npm test -- inscription.test.ts --verbose

# Un seul test
npm test -- inscription.test.ts -t "devrait inscrire un utilisateur"

# Avec détection de fuites mémoire
npm test -- inscription.test.ts --detectLeaks

# Avec détection de handles ouverts
npm test -- inscription.test.ts --detectOpenHandles
```

## 📚 Ressources

- [Documentation Zod](https://zod.dev/)
- [Documentation bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- [Documentation Supertest](https://github.com/visionmedia/supertest)
- [Documentation Jest](https://jestjs.io/)

## 🤝 Contribution

Lors de l'ajout de nouvelles fonctionnalités :

1. Ajouter les tests correspondants
2. Maintenir la couverture > 95%
3. Suivre les patterns existants
4. Mettre à jour ce README si nécessaire

## 📊 Statistiques

- **Nombre total de tests** : ~500+
- **Fichiers de tests** : 12
- **Temps d'exécution** : ~30-60s (sans tests DB réels)
- **Temps avec tests DB** : ~2-5 minutes