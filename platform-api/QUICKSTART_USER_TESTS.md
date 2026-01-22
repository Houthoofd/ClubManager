# 🚀 Quick Start - User Service Tests

Guide rapide pour exécuter les tests du User Service.

---

## ⚡ Démarrage en 30 secondes

```bash
# 1. Installer les dépendances
npm ci

# 2. Lancer tous les tests User Service
npm run test:user

# 3. Voir la couverture
npm run test:user:coverage
```

**C'est tout !** 🎉

---

## 📋 Scripts disponibles

### Tests complets

```bash
# Tous les tests User Service (~170 tests, 5-8s)
npm run test:user

# Avec couverture de code
npm run test:user:coverage

# Mode verbose (détails complets)
npm run test:user:verbose

# Mode watch (redémarre automatiquement)
npm run test:user:watch
```

### Tests spécifiques

```bash
# Tests unitaires seulement (services)
npm run test:user:unit

# Tests intégration seulement (routes)
npm run test:user:integration

# UserService façade uniquement
npm run test:user-service

# UserManagerService CRUD uniquement
npm run test:user-manager

# Routes HTTP uniquement
npm run test:user-routes
```

### Script Windows (menu interactif)

```bash
# Double-cliquer ou exécuter:
run-user-tests.bat
```

Menu options:
1. Tous les tests
2. Tests unitaires
3. Tests intégration
4. UserService
5. UserManagerService
6. Routes
7. Avec couverture
8. Mode watch
9. Mode verbose

---

## 📊 Ce qui est testé

### ✅ UserService (55 tests)
- Login/Register délégation → AuthService
- Token generation/validation
- User CRUD délégation → UserManagerService
- Password hashing/verification
- Multi-tenant isolation
- Error propagation

### ✅ UserManagerService (50 tests)
- Create user
- Find user by email/ID
- Update user (partial & full)
- Delete user (soft delete)
- List users (pagination, search, filters)
- Multi-tenant queries
- Edge cases (long names, dates, etc.)

### ✅ User Routes (65 tests)
- `GET /api/users` - Liste avec pagination
- `GET /api/users/:id` - Récupération par ID
- `POST /api/users` - Création
- `PUT /api/users/:id` - Mise à jour
- `DELETE /api/users/:id` - Suppression
- `GET /api/users/stats` - Statistiques
- Authentication & validation
- Error handling (400, 401, 404, 500)

---

## 🎯 Résultats attendus

```
PASS  src/services/members/user/__tests__/user.service.test.ts
  ✓ 55 tests passed

PASS  src/services/members/users/__tests__/user-manager.service.test.ts
  ✓ 50 tests passed

PASS  src/routes/users/__tests__/management.routes.test.ts
  ✓ 65 tests passed

Test Suites: 3 passed, 3 total
Tests:       170 passed, 170 total
Time:        5-8s
```

### Couverture de code

| Fichier | Lines | Branches | Functions |
|---------|-------|----------|-----------|
| user.service.ts | 95% | 90% | 100% |
| user-manager.service.ts | 96% | 92% | 100% |
| routes/users/management.ts | 94% | 88% | 100% |

---

## 🐛 Dépannage rapide

### ❌ Tests échouent

```bash
# 1. Vérifier l'environnement
echo %NODE_ENV%  # Doit être "test"

# 2. Nettoyer et réinstaller
rm -rf node_modules
npm ci

# 3. Relancer les tests
npm run test:user
```

### ❌ Erreurs de mock

```bash
# Vérifier que les mocks sont configurés dans les tests:
# - @jest/globals imported
# - jest.mock() appelé avant les tests
# - jest.clearAllMocks() dans beforeEach()
```

### ❌ Timeout errors

```bash
# Augmenter le timeout dans jest.config.cjs:
testTimeout: 10000  // 10 secondes
```

### ❌ Coverage non générée

```bash
# Vérifier collectCoverageFrom dans jest.config.cjs
# Lancer explicitement:
npm run test:user:coverage
```

---

## 📁 Structure des fichiers

```
platform-api/
├── src/
│   ├── services/members/
│   │   ├── user/
│   │   │   ├── user.service.ts                 ← Façade
│   │   │   └── __tests__/
│   │   │       └── user.service.test.ts        ← 55 tests
│   │   └── users/
│   │       ├── user-manager.service.ts         ← CRUD
│   │       └── __tests__/
│   │           └── user-manager.service.test.ts ← 50 tests
│   └── routes/users/
│       ├── management.ts                       ← API routes
│       └── __tests__/
│           └── management.routes.test.ts       ← 65 tests
├── USER_SERVICE_TESTS.md                       ← Documentation complète
├── QUICKSTART_USER_TESTS.md                    ← Ce fichier
├── run-user-tests.bat                          ← Script Windows
└── package.json                                ← Scripts npm
```

---

## 💡 Exemples d'utilisation

### Développement quotidien

```bash
# Mode watch pendant le développement
npm run test:user:watch

# Tester après modification d'un service
npm run test:user-service

# Tester après modification d'une route
npm run test:user-routes
```

### Avant commit

```bash
# Tous les tests + couverture
npm run test:user:coverage

# Vérifier que couverture >= 90%
```

### Debugging

```bash
# Mode verbose pour voir tous les détails
npm run test:user:verbose

# Tester un fichier spécifique avec pattern
npm test -- user.service.test.ts -t "login"
```

### CI/CD

```bash
# Commande pour CI
npm run test:user:coverage -- --ci --maxWorkers=2
```

---

## 🔧 Configuration requise

### Environnement

```bash
NODE_ENV=test
NODE_OPTIONS=--experimental-vm-modules
```

### Dépendances

- Node.js >= 18
- Jest >= 29
- TypeScript >= 5
- Supertest (routes tests)
- @jest/globals

### Optionnel

- Redis (pour tests d'intégration complets)
- PostgreSQL (pour tests avec vraie DB)

**Note**: Tests actuels utilisent mocks, Redis/PostgreSQL non requis.

---

## 📚 Documentation complète

Pour plus de détails, voir:

- **[USER_SERVICE_TESTS.md](./USER_SERVICE_TESTS.md)** - Documentation exhaustive (821 lignes)
  - Architecture détaillée
  - Liste complète des tests
  - Exemples de code
  - Best practices
  - Troubleshooting avancé
  - Métriques et couverture

- **[PHASE1_PROGRESS.md](./PHASE1_PROGRESS.md)** - Suivi de progression
  - Status Phase 1
  - Prochaines étapes
  - Métriques globales

---

## ✅ Checklist validation

Avant de merger:

- [ ] Tous les tests passent (`npm run test:user`)
- [ ] Couverture >= 90% (`npm run test:user:coverage`)
- [ ] Pas de tests skipped/only
- [ ] Pas de console.log (sauf console.error pour erreurs)
- [ ] Documentation à jour
- [ ] Code review approuvé

---

## 🎉 Succès !

Si vous voyez:

```
✓ 170 tests passed
Coverage: 95%+ all files
```

**Bravo !** Les tests User Service sont au vert ! 🚀

---

## 🆘 Besoin d'aide ?

1. **Documentation**: Lire [USER_SERVICE_TESTS.md](./USER_SERVICE_TESTS.md)
2. **Logs**: Lancer avec `npm run test:user:verbose`
3. **Issues**: Vérifier les erreurs dans la console
4. **Team**: Demander sur le channel Slack/Discord

---

**Version**: 1.0.0  
**Dernière MAJ**: 2024-01-15  
**Temps de lecture**: 3 minutes ⏱️