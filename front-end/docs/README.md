# 📚 Documentation ClubManager Frontend

Bienvenue dans la documentation technique du projet ClubManager Frontend.

## 📖 Table des Matières

### 🏗️ Architecture & Structure

- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Structure complète du projet
- **[MODULAR_ARCHITECTURE_COMPLETE.md](./MODULAR_ARCHITECTURE_COMPLETE.md)** - Architecture modulaire
- **[MODULAR_COMPONENTS_GENERATED.md](./MODULAR_COMPONENTS_GENERATED.md)** - Composants modulaires générés

### ⚡ Optimisations & Performance

- **[PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)** - Guide des optimisations de performance
- **[APOLLO_OPTIMIZATIONS.md](./APOLLO_OPTIMIZATIONS.md)** - Optimisations Apollo Client & GraphQL

### 🧪 Tests & Qualité

- **[TEST_PLAN.md](./TEST_PLAN.md)** - Plan de tests global
- **[SYSTEME_TESTS_V2_RESUME.md](./SYSTEME_TESTS_V2_RESUME.md)** - Système de tests V2 (Zéro TODO)
- **[NOUVEAUX_OUTILS_TESTS.md](./NOUVEAUX_OUTILS_TESTS.md)** - Nouveaux outils de testing
- **[TEST_TEMPLATES.md](./TEST_TEMPLATES.md)** - Templates de tests
- **[TEST_EXECUTION_SUCCESS.md](./TEST_EXECUTION_SUCCESS.md)** - Résultats d'exécution
- **[TESTS_SUMMARY.md](./TESTS_SUMMARY.md)** - Résumé des tests

### 📊 Coverage

- **[COVERAGE_80_PERCENT_GUIDE.md](./COVERAGE_80_PERCENT_GUIDE.md)** - Guide pour atteindre 80% de coverage
- **[COVERAGE_STRATEGY.md](./COVERAGE_STRATEGY.md)** - Stratégie de coverage
- **[COVERAGE_PROGRESS.md](./COVERAGE_PROGRESS.md)** - Progression du coverage

### 🌍 Internationalisation

- **[I18N_INTEGRATION_GUIDE.md](./I18N_INTEGRATION_GUIDE.md)** - Guide d'intégration i18n

### 📋 Status & Suivi

- **[COMPLETION_STATUS_FINAL.md](./COMPLETION_STATUS_FINAL.md)** - État final de complétion
- **[IMPLEMENTATION_STATUS_FINAL.md](./IMPLEMENTATION_STATUS_FINAL.md)** - État final d'implémentation
- **[ALL_FEATURES_STATUS.md](./ALL_FEATURES_STATUS.md)** - État de toutes les fonctionnalités
- **[REFACTORING_STATUS.md](./REFACTORING_STATUS.md)** - État du refactoring

### 🔄 Sessions de Travail

- **[SESSION_SUMMARY_PRIORITY_2.md](./SESSION_SUMMARY_PRIORITY_2.md)** - Résumé session Priorité 2
- **[PRIORITY_2_REFACTORING_COMPLETE.md](./PRIORITY_2_REFACTORING_COMPLETE.md)** - Refactoring Priorité 2 complet
- **[QUICK_SUMMARY.md](./QUICK_SUMMARY.md)** - Résumé rapide

---

## 🚀 Démarrage Rapide

### Prérequis
```bash
Node.js >= 18
npm >= 9
```

### Installation
```bash
npm install
```

### Développement
```bash
npm run dev
```

### Tests
```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Build
```bash
npm run build         # Production build
npm run preview       # Preview production build
```

---

## 🛠️ Outils & Technologies

- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **State Management:** Redux Toolkit + Zustand
- **API:** Apollo Client (GraphQL)
- **UI Library:** PatternFly React
- **Testing:** Vitest + React Testing Library
- **Storybook:** Documentation composants
- **i18n:** react-i18next
- **Monitoring:** Sentry

---

## 📝 Standards de Code

- **Logger:** Utiliser `@/core/utils/appLogger` uniquement
- **Env Variables:** Utiliser `@/core/config/env`
- **Types:** Préférer les types explicites
- **Tests:** Minimum 80% de coverage
- **Components:** Utiliser les templates générés

---

## 🔗 Liens Utiles

- [Storybook](http://localhost:6006) - Documentation composants
- [Coverage Report](../coverage/index.html) - Rapport de coverage
- [Bundle Analysis](../dist/stats.html) - Analyse du bundle

---

## 📞 Support

Pour toute question ou problème, consultez les fichiers de documentation ci-dessus ou contactez l'équipe de développement.

**Dernière mise à jour:** 2024