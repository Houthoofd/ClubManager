# Tests Services - Quick Start Guide

> **Démarrage rapide en 2 minutes** ⚡

## 🚀 Commandes Essentielles

### Générer des tests

```bash
# Un seul service
npm run test:generate:services -- src/core/services/auth.service.ts

# Tous les services
npm run test:generate:services:all

# Preview sans créer de fichiers
npm run test:generate:services:all -- --dry-run
```

### Lancer les tests

```bash
# Tous les tests
npm test

# Tests services uniquement
npm test -- --run src/core/services/

# Un service spécifique
npm test -- auth.service.test.ts

# Avec couverture
npm run test:coverage
```

---

## 📝 Workflow en 5 Étapes

### 1. Créer un nouveau service

```bash
touch src/features/my-feature/services/my.service.ts
```

### 2. Écrire le code du service

```typescript
// src/features/my-feature/services/my.service.ts
export const getData = (): string | null => {
  return localStorage.getItem('data');
};

export const setData = (value: string): void => {
  localStorage.setItem('data', value);
};

export const isValid = (data: string): boolean => {
  return data.length > 0;
};
```

### 3. Générer les tests automatiquement

```bash
npm run test:generate:services -- src/features/my-feature/services/my.service.ts
```

**Résultat:** Fichier `my.service.test.ts` créé avec ~10-15 tests

### 4. Lancer les tests

```bash
npm test -- my.service.test.ts
```

**Si des tests échouent:** Ajuster les mocks dans le fichier `.test.ts`

### 5. Ajouter des tests métier spécifiques (optionnel)

```typescript
// À la fin du fichier généré, ajouter :
describe('Business Logic', () => {
  it('should handle complex business scenario', () => {
    // Votre test métier spécifique
  });
});
```

---

## 🎯 Exemples Rapides

### Exemple 1: Service simple (localStorage)

**Service:**
```typescript
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};
```

**Commande:**
```bash
npm run test:generate:services -- src/core/services/auth.service.ts
```

**Tests générés:**
```typescript
it('should retrieve value from localStorage', () => { ... });
it('should return null when value does not exist', () => { ... });
```

### Exemple 2: Service avec validation

**Service:**
```typescript
export const isAdmin = (user: User): boolean => {
  return user?.role === 'admin';
};
```

**Tests générés:**
```typescript
it('should return boolean value', () => { ... });
it('should handle null/undefined input', () => { ... });
```

### Exemple 3: Service avec calcul

**Service:**
```typescript
export const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};
```

**Tests générés:**
```typescript
it('should calculate correct result', () => { ... });
it('should handle zero values', () => { ... });
```

---

## 🐛 Problèmes Courants

### "Test file already exists"

```bash
# Solution: Utiliser --force pour régénérer
npm run test:generate:services:all -- --force
```

### Tests échouent avec "is not a function"

**Problème:** Mock incomplet

**Solution:** Compléter le mock dans le fichier `.test.ts`
```typescript
vi.mock('@/core/services/auth.service', () => ({
  default: {
    getCurrentUser: vi.fn(),
    clearAuthSession: vi.fn(), // ← Ajouter les fonctions manquantes
  },
}));
```

### Tests échouent avec localStorage

**Solution:** Déjà géré automatiquement ! Le générateur ajoute :
```typescript
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
```

---

## 📊 Vérifier la Couverture

```bash
# Couverture complète
npm run test:coverage

# Couverture d'un service
npm run test:coverage -- auth.service

# Voir le rapport HTML
open coverage/index.html
```

**Objectif:** 80% minimum de couverture

---

## 🎨 Personnaliser les Tests

### Ajouter des mocks personnalisés

**Au début du fichier test:**
```typescript
const mockUser = {
  id: 1,
  name: 'John Doe',
  role: 'admin',
};

const mockProduct = {
  id: 1,
  name: 'Product',
  price: 99.99,
};
```

### Ajouter des tests d'intégration

**À la fin du fichier test:**
```typescript
describe('Integration Tests', () => {
  it('should handle complete workflow', () => {
    // Login
    setAuthToken('token');
    
    // Get user
    const user = getCurrentUser();
    
    // Verify
    expect(user).toBeDefined();
  });
});
```

---

## 📚 Documentation Complète

- **Guide Complet:** `scripts/generators/tests/SERVICE_TESTS_GUIDE.md`
- **Rapport Détaillé:** `SERVICE_TESTS_REPORT.md`
- **Résumé:** `SERVICE_TESTS_SUMMARY.md`

---

## ✅ Checklist Avant Commit

```bash
- [ ] Tests générés pour le nouveau service
- [ ] Tous les tests passent (npm test)
- [ ] Couverture > 80% (npm run test:coverage)
- [ ] Mocks complets (pas de "is not a function")
- [ ] Tests métier spécifiques ajoutés
- [ ] Documentation à jour
```

---

## 💡 Trucs & Astuces

### Génération rapide pour un dossier

```bash
npm run test:generate:services:all -- --path src/features/shop
```

### Mode verbose pour debug

```bash
npm run test:generate:services:all -- --verbose
```

### Régénérer tous les tests

```bash
npm run test:generate:services:all -- --force
```

### Lancer les tests en watch mode

```bash
npm test
# (mode watch par défaut, relance auto à chaque changement)
```

---

## 🎯 Résultat Attendu

Après génération automatique:

- ✅ **80%+ de tests** passent sans modification
- ✅ **75-85% de couverture** automatiquement
- ✅ **Gain de temps:** 87% vs écriture manuelle
- ✅ **Tests de qualité:** Gestion erreurs, edge cases, etc.

---

## 🚀 C'est Tout !

Vous êtes prêt à générer des tests automatiquement ! 

**Commande la plus utile:**
```bash
npm run test:generate:services:all
```

**Besoin d'aide ?** Consultez `SERVICE_TESTS_GUIDE.md`

---

**Happy Testing! 🎉**