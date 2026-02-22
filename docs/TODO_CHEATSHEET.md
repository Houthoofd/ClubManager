# 📋 CHEAT SHEET - TODOs Tests (1 Page)

**Projet:** ClubManager Frontend | **Date:** 22/02/2026 | **Objectif:** 50% → 80% coverage

---

## 🎯 EN BREF

| Métrique | Valeur |
|----------|--------|
| **Fichiers de tests** | 239 |
| **TODOs à compléter** | ~3,500 |
| **Temps estimé** | 6-10 jours |
| **Coverage cible** | 80% |

---

## 🔥 TOP 5 PRIORITAIRES

| # | Fichier | TODOs | Impact | Temps |
|---|---------|-------|--------|-------|
| 1 | `auth.service.test.ts` | 12 | 🔴 Critique | 4h |
| 2 | `order.service.test.ts` | 12 | 🔴 Critique | 4h |
| 3 | `user-formatters.test.ts` | 110 | 🟠 Élevé | 6h |
| 4 | `product-formatters.test.ts` | 101 | 🟠 Élevé | 6h |
| 5 | `PaymentForm.test.tsx` | 45 | 🔴 Critique | 8h |

---

## 🚀 QUICK START (30 min)

```bash
# 1. Setup
mkdir -p front-end/src/__test-utils__/{factories,mocks,helpers}
npm install -D @faker-js/faker
git checkout -b feature/complete-test-todos

# 2. Créer UserFactory
cat > front-end/src/__test-utils__/factories/user.factory.ts << 'EOF'
import { faker } from '@faker-js/faker';
export const UserFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    role: 'MEMBER',
    status: 'ACTIVE',
    ...overrides
  })
};
EOF

# 3. Tester
npm test -- auth.service.test.ts --watch
```

---

## 📊 PLANNING 10 JOURS

| Jour | Tâches | Coverage | ✓ |
|------|--------|----------|---|
| 1-2 | auth + order + user services | 58% | ☐ |
| 3-4 | user + product formatters | 68% | ☐ |
| 5 | PaymentForm | 73% | ☐ |
| 6-7 | course + message formatters | 77% | ☐ |
| 8-9 | Layout components | 79% | ☐ |
| 10 | UI components + polish | 80% ✅ | ☐ |

---

## 💡 PATTERNS ESSENTIELS

### Formatter Test (Copy-Paste)
```typescript
import { UserFactory } from '@/__test-utils__/factories';

describe('formatUserFullName', () => {
  it('should format correctly', () => {
    const user = UserFactory.build({ 
      firstName: 'Jean', 
      lastName: 'Dupont' 
    });
    expect(formatUserFullName(user)).toBe('Jean Dupont');
  });

  it('should handle null values', () => {
    expect(formatUserFullName({ 
      firstName: null, 
      lastName: null 
    })).toBe('');
  });
});
```

### Service Test (Copy-Paste)
```typescript
const mockLogin = {
  request: { 
    query: LOGIN_MUTATION, 
    variables: { email: 'test@test.com', password: 'pass' } 
  },
  result: { 
    data: { login: { token: 'mock-token' } } 
  }
};

it('should login successfully', async () => {
  const result = await authService.login('test@test.com', 'pass');
  expect(result.token).toBe('mock-token');
});
```

### Component Test (Copy-Paste)
```typescript
import { renderWithProviders } from '@/__test-utils__/helpers/render';

it('should submit on click', async () => {
  const onSubmit = vi.fn();
  renderWithProviders(<Form onSubmit={onSubmit} />);
  
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(onSubmit).toHaveBeenCalled();
});
```

---

## 🔧 COMMANDES ESSENTIELLES

```bash
# Test un fichier
npm test -- auth.service.test.ts

# Coverage d'un fichier
npm test -- auth.service.test.ts --coverage

# Watch mode
npm test -- --watch

# Coverage global
npm run test:coverage

# UI mode (visual)
npm test -- --ui

# Ouvrir rapport HTML
npm run test:coverage -- --reporter=html
# Puis ouvrir: coverage/index.html
```

---

## ⚠️ TOP 5 PIÈGES

| ❌ Éviter | ✅ Faire |
|----------|----------|
| Copier-coller sans adapter | Utiliser factories avec overrides |
| Tester implémentation | Tester comportement utilisateur |
| Mocks trop complexes | Mocker au bon niveau |
| Tests flaky (timing) | Utiliser `waitFor()` |
| Coverage vanity (100%) | Focus sur critical paths |

---

## 📚 DOCUMENTATION

| Document | Usage |
|----------|-------|
| **TODO_EXECUTIVE_SUMMARY.md** | Vue d'ensemble + planning |
| **TODO_ANALYSIS_REPORT.md** | Analyse complète + estimation |
| **TODO_COMPLETION_GUIDE.md** | Exemples de code complets |
| **TODO_DOCUMENTATION_INDEX.md** | Navigation entre docs |

---

## ✅ CHECKLIST JOUR 1

- [ ] Lire TODO_EXECUTIVE_SUMMARY.md (10 min)
- [ ] Setup factories (30 min)
- [ ] Créer branche git
- [ ] Compléter `auth.service.test.ts` (4h)
- [ ] Vérifier tests passent ✅
- [ ] Commit + push
- [ ] Vérifier coverage (+3%)

---

## 🎯 MÉTRIQUES DE SUCCÈS

| Métrique | Baseline | Cible |
|----------|----------|-------|
| Coverage global | 50% | 80% |
| Statements | 45% | 70% |
| Branches | 40% | 60% |
| Functions | 48% | 75% |

---

## 📞 SUPPORT

- **Docs complètes:** `ClubManager/docs/TODO_*.md`
- **Slack:** #frontend-tests
- **Email:** frontend-team@clubmanager.com

---

**🚀 READY? → Commencez par `auth.service.test.ts` !**