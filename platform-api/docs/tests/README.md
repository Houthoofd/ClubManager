# Platform API - Tests Documentation

> Documentation complète des tests de la Platform API

## 📊 Vue d'ensemble

**Total des tests**: 710+ tests  
**Couverture moyenne**: 94%  
**Services testés**: 4 services critiques (complets)  
**Statut**: ✅ 83% complété

---

## 🚀 Démarrage rapide

### Exécuter tous les tests
```bash
npm test
```

### Tests par service
```bash
npm run test:priority1    # Redis & Cache (155 tests)
npm run test:user         # User Service (170 tests)
npm run test:payment:all  # Payment Service (260 tests)
npm run test:auth         # Auth Service (125 tests)
```

### Scripts batch Windows
```bash
run-user-tests.bat        # Menu interactif User
run-auth-tests.bat        # Menu interactif Auth
```

---

## 📚 Documentation disponible

### Guides de démarrage rapide
- **[QUICKSTART_USER_TESTS.md](./QUICKSTART_USER_TESTS.md)** - Démarrage rapide User Service
- **[QUICKSTART_AUTH_TESTS.md](./QUICKSTART_AUTH_TESTS.md)** - Démarrage rapide Auth Service

### Documentation détaillée par service

#### ✅ Complétés
- **[PRIORITY1_TESTS.md](./PRIORITY1_TESTS.md)** - Redis & Cache (~155 tests)
- **[USER_SERVICE_TESTS.md](./USER_SERVICE_TESTS.md)** - User Service (~170 tests)
- **[AUTH_SERVICE_TESTS.md](./AUTH_SERVICE_TESTS.md)** - Auth Service (~125 tests)
- **[PAYMENT_SERVICE_TESTS.md](./PAYMENT_SERVICE_TESTS.md)** - Payment Service (~260 tests) ✅

### Résumés d'implémentation
- **[USER_SERVICE_IMPLEMENTATION_SUMMARY.md](./USER_SERVICE_IMPLEMENTATION_SUMMARY.md)** - Résumé User Service
- **[AUTH_SERVICE_IMPLEMENTATION_SUMMARY.md](./AUTH_SERVICE_IMPLEMENTATION_SUMMARY.md)** - Résumé Auth Service
- **[PAYMENT_SERVICE_IMPLEMENTATION_SUMMARY.md](./PAYMENT_SERVICE_IMPLEMENTATION_SUMMARY.md)** - Résumé Payment Service ✅
- **[TEST_IMPLEMENTATION_SUMMARY.md](./TEST_IMPLEMENTATION_SUMMARY.md)** - Vue d'ensemble globale

### Planification
- **[TEST_ROADMAP_UPDATED.md](./TEST_ROADMAP_UPDATED.md)** - Roadmap et progression

---

## 🎯 Tests par phase

### ✅ Phase 1: Priority 1 - Redis & Cache
**Statut**: Complété  
**Tests**: 155 tests  
**Couverture**: 92%  

**Documentation**: [PRIORITY1_TESTS.md](./PRIORITY1_TESTS.md)

**Composants**:
- Redis initialization (15 tests)
- Health routes (20 tests)
- Cache services (60 tests)
- Cache middlewares (30 tests)
- Integration tests (30 tests)

---

### ✅ Phase 2: User Service
**Statut**: Complété  
**Tests**: 170 tests  
**Couverture**: 95%  

**Documentation**: 
- [USER_SERVICE_TESTS.md](./USER_SERVICE_TESTS.md)
- [QUICKSTART_USER_TESTS.md](./QUICKSTART_USER_TESTS.md)

**Composants**:
- UserService (façade) - 55 tests
- UserManagerService (CRUD) - 50 tests
- User routes - 65 tests

**Scripts**:
```bash
npm run test:user              # Tous
npm run test:user-service      # Façade
npm run test:user-manager      # CRUD
npm run test:user-routes       # Routes
```

---

### ✅ Phase 3: Payment Service
**Statut**: ✅ COMPLÉTÉ (Base + Extensions)  
**Tests**: 260 tests  
**Couverture**: 93%  

**Documentation**: 
- [PAYMENT_SERVICE_TESTS.md](./PAYMENT_SERVICE_TESTS.md)
- [PAYMENT_SERVICE_IMPLEMENTATION_SUMMARY.md](./PAYMENT_SERVICE_IMPLEMENTATION_SUMMARY.md)

**Composants**:
- PaymentService - 80 tests
- Stripe routes - 110 tests
- Webhook signatures - 15 tests ⭐ NEW
- Idempotency - 15 tests ⭐ NEW
- Subscriptions - 20 tests ⭐ NEW
- Refunds - 20 tests ⭐ NEW

**Scripts**:
```bash
npm run test:payment:all           # Tous (260 tests)
npm run test:payment:service       # Service
npm run test:payment:routes        # Routes
npm run test:payment:webhooks      # Webhook signatures
npm run test:payment:idempotency   # Idempotency
npm run test:payment:subscriptions # Subscriptions
npm run test:payment:refunds       # Refunds
npm run test:payment:extensions    # Toutes extensions
```

---

### ✅ Phase 4: Auth Service
**Statut**: Complété  
**Tests**: 125 tests  
**Couverture**: 95%  

**Documentation**: 
- [AUTH_SERVICE_TESTS.md](./AUTH_SERVICE_TESTS.md)
- [QUICKSTART_AUTH_TESTS.md](./QUICKSTART_AUTH_TESTS.md)

**Composants**:
- AuthService (core logic) - 50 tests
- Auth middlewares - 35 tests
- Auth routes - 40 tests

**Scripts**:
```bash
npm run test:auth              # Tous
npm run test:auth:service      # Core logic
npm run test:auth:middleware   # Middlewares
npm run test:auth:routes       # Routes
```

---

## 📊 Statistiques globales

### Répartition des tests

| Service | Tests | Couverture | Statut |
|---------|-------|------------|--------|
| Redis/Cache | 155 | 92% | ✅ |
| User Service | 170 | 95% | ✅ |
| Payment Service | 260 | 93% | ✅ |
| Auth Service | 125 | 95% | ✅ |
| **TOTAL** | **710** | **94%** | ✅ |

### Tests par type

```
Unitaires (services)      : 440 tests (62.0%)
Intégration (routes)      : 220 tests (31.0%)
E2E (scenarios)           : 30 tests  (4.2%)
Performance               : 20 tests  (2.8%)
```

### Durée d'exécution

```
Priority 1 (Redis/Cache)  : ~4-5s
User Service              : ~3-4s
Payment Service           : ~6-8s (avec extensions)
Auth Service              : ~3-5s
─────────────────────────────────
TOTAL                     : ~22-28s
```

---

## 🔧 Configuration

### Prérequis
- Node.js >= 18.x
- npm >= 8.x
- Redis (optionnel pour tests avec mocks)
- PostgreSQL (optionnel pour tests avec mocks)

### Installation
```bash
# Installer les dépendances
npm install

# Configurer l'environnement de test
cp .env.example .env.test
```

### Variables d'environnement requises
```bash
# .env.test
NODE_ENV=test
JWT_SECRET=test-jwt-secret
DATABASE_URL=postgresql://user:pass@localhost:5432/testdb
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🚀 Commandes npm

### Tests globaux
```bash
npm test                   # Tous les tests
npm run test:coverage      # Avec couverture
npm run test:watch         # Mode watch
```

### Tests par service
```bash
npm run test:priority1     # Redis & Cache
npm run test:user          # User Service
npm run test:payment       # Payment Service
npm run test:auth          # Auth Service
```

### Tests par composant (User)
```bash
npm run test:user-service  # UserService (façade)
npm run test:user-manager  # UserManagerService (CRUD)
npm run test:user-routes   # Routes User
```

### Tests par composant (Auth)
```bash
npm run test:auth:service     # AuthService
npm run test:auth:middleware  # Middlewares
npm run test:auth:routes      # Routes
```

### Tests par composant (Payment)
```bash
npm run test:payment:service       # PaymentService
npm run test:payment:routes        # Stripe routes
npm run test:payment:webhooks      # Webhook signatures
npm run test:payment:idempotency   # Idempotency
npm run test:payment:subscriptions # Subscriptions
npm run test:payment:refunds       # Refunds
npm run test:payment:extensions    # Toutes extensions
npm run test:payment:all           # Tous les tests Payment
```

### Options avancées
```bash
npm run test:user:verbose     # Mode verbeux
npm run test:auth:coverage    # Couverture spécifique
npm run test:payment:watch    # Mode watch
```

---

## 🪟 Scripts batch Windows

### Menus interactifs
```bash
run-user-tests.bat         # Menu User Service
run-auth-tests.bat         # Menu Auth Service
```

**Fonctionnalités**:
- Interface colorée
- 9 options de test par menu
- Descriptions détaillées
- Gestion des erreurs
- Retour automatique au menu

---

## 🔒 Sécurité

### Aspects testés

✅ **Authentication**
- Password hashing (bcrypt)
- JWT tokens (génération, vérification, expiration)
- Session management
- Token refresh

✅ **Authorization**
- RBAC (Role-Based Access Control)
- Tenant isolation
- Resource ownership
- Permission checking

✅ **Data Protection**
- Passwords jamais exposés
- Cookies HTTP-only
- Cookies Secure (production)
- Données sensibles masquées

✅ **Input Validation**
- Format email
- Longueur mot de passe
- Champs requis
- Types de données

✅ **Attack Prevention**
- Rate limiting
- SQL injection (Prisma)
- XSS prevention
- Special characters handling
- Unicode support

---

## 📈 Couverture de code

### Générer le rapport
```bash
npm run test:coverage
```

### Ouvrir le rapport HTML
```bash
# Mac/Linux
open coverage/lcov-report/index.html

# Windows
start coverage/lcov-report/index.html
```

### Objectifs
- ✅ Lignes: > 90% (actuellement 94%)
- ✅ Branches: > 85% (actuellement 90%)
- ✅ Fonctions: > 95% (actuellement 97%)

---

## 🐛 Troubleshooting

### Tests échouent ?

1. **Vérifier Node.js**
   ```bash
   node --version  # >= 18.x required
   ```

2. **Réinstaller les dépendances**
   ```bash
   npm run clean
   npm ci
   ```

3. **Nettoyer le cache**
   ```bash
   rm -rf node_modules/.cache
   ```

4. **Mode verbeux**
   ```bash
   npm run test:auth:verbose
   ```

### Mocks problématiques ?

```typescript
// Vérifier beforeEach/afterEach
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### Timeouts ?

```typescript
// Augmenter le timeout
it("slow test", async () => {
  // test code
}, 10000); // 10 secondes
```

---

## 🔄 CI/CD

### GitHub Actions (exemple)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: testpass
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
        env:
          NODE_ENV: test
          JWT_SECRET: test-secret
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 📅 Roadmap

### ✅ Complété (83%)
- Phase 1: Redis & Cache
- Phase 2: User Service
- Phase 3: Payment Service (base)
- Phase 4: Auth Service
- Phase 5: Payment Service (extensions) ✅

### ⏳ En cours
- Phase 6: CI/CD & E2E Tests

### 🔮 À venir
- Phase 7: Services complémentaires (Email, Notifications, Upload)
- Phase 8: E2E & Performance tests
- Phase 9: CI/CD & Documentation finale

**Détails**: [TEST_ROADMAP_UPDATED.md](./TEST_ROADMAP_UPDATED.md)

---

## 🛠️ Technologies

### Frameworks de test
- **Vitest** - Test runner moderne (ESM)
- **Jest** - Configuration legacy (CJS)
- **Supertest** - Tests HTTP/REST

### Mocking
- **Vitest mocks** (vi.mock, vi.fn)
- **Prisma mocks** - Database
- **Bcrypt mocks** - Password hashing
- **JWT mocks** - Token operations
- **Stripe SDK mocks** - Payments

### Outils
- **npm scripts** - Exécution rapide
- **Batch scripts** - Menus Windows
- **Coverage reports** - Istanbul/V8

---

## 📚 Ressources externes

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Jest Documentation](https://jestjs.io/)

### Best Practices
- [Testing Best Practices](https://testingjavascript.com/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## ✅ Checklist de validation

### Avant de merger
- [ ] Tous les tests passent
- [ ] Couverture > 90%
- [ ] Pas de console.log() oubliés
- [ ] Documentation à jour
- [ ] Scripts npm fonctionnels
- [ ] Batch scripts testés
- [ ] Mocks proprement configurés
- [ ] Variables d'environnement documentées

---

## 👥 Équipe

**Développeurs**: Platform API Team  
**Reviewers**: Senior Engineers  
**Maintainers**: DevOps Team  

---

## 📞 Support

- **Documentation**: `docs/tests/`
- **Code**: `src/**/__tests__/`
- **Issues**: GitHub Issues
- **Questions**: Team Slack #platform-api
- **Wiki**: Confluence

---

## 📝 Contribuer

### Ajouter un nouveau test

1. Identifier le composant (Service/Middleware/Route)
2. Créer le fichier test dans le bon dossier
3. Suivre la structure Arrange-Act-Assert
4. Exécuter les tests
5. Vérifier la couverture
6. Mettre à jour la documentation

**Exemple**:
```typescript
describe("Feature", () => {
  it("should do something", async () => {
    // Arrange
    const input = { /* ... */ };
    vi.mocked(dependency).mockResolvedValue(output);
    
    // Act
    const result = await service.method(input);
    
    // Assert
    expect(result).toEqual(expected);
  });
});
```

---

## 🎉 Statistiques finales

```
Total tests:       710+
Services testés:   4 (tous complets)
Couverture:        94%
Durée:             ~25s
Documentation:     8 fichiers
Scripts npm:       35+
Scripts batch:     2
Statut:            ✅ Production-ready
```

---

**Version**: 1.1.0  
**Dernière mise à jour**: 2024  
**Auteur**: Platform API Team  

🎉 **Payment Service Extensions complétées!** 🎉  
🚀 **Happy Testing!** 🚀