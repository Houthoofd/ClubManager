# ClubManager

> 🏋️ Plateforme de gestion de club de sport (Krav Maga, Fitness, etc.)

## 📊 Vue d'Ensemble du Projet

ClubManager est une application complète de gestion de club sportif incluant :
- Gestion des membres et professeurs
- Planification des cours et sessions
- Système d'inscriptions
- Paiements en ligne (Stripe)
- Boutique d'équipements
- Statistiques et rapports

---

## 📦 Structure du Projet

```
ClubManager/
├── api/              # Backend API (Node.js/Express)
├── front-end/        # Frontend V1 (legacy)
├── front-end-v2/     # ⭐ Frontend V2 (FSD - en cours)
├── mobile/           # Application mobile
├── packages/         # Packages partagés
├── db/              # Scripts database
└── tests/           # Tests end-to-end
```

---

## 🚀 Front-End V2 (Architecture Moderne)

### Status Actuel
- ✅ **30% Complété** (Infrastructure + 2 features)
- 🟡 **70% Restant** (10 features à créer)
- 📅 **Timeline**: Janvier - Avril 2025

### Documentation Complète

**Démarrage Rapide**:
- 📖 [README.md](./front-end-v2/README.md) - Architecture complète (490 lignes)
- 🚀 [QUICK_START.md](./front-end-v2/QUICK_START.md) - Installation en 5 min (397 lignes)
- 📋 [RESUME_1_PAGE.md](./front-end-v2/RESUME_1_PAGE.md) - Vue d'ensemble 1 page ⭐

**Planning & Stratégie**:
- 🗺️ [ROADMAP.md](./front-end-v2/ROADMAP.md) - Timeline 4 mois (545 lignes)
- 📊 [EXECUTIVE_SUMMARY.md](./front-end-v2/EXECUTIVE_SUMMARY.md) - Résumé exécutif (357 lignes)
- 🎯 [ACTION_PLAN.md](./front-end-v2/ACTION_PLAN.md) - Plan d'action immédiat (635 lignes)

**Technique & Refactoring**:
- 🔍 [ANALYSE_REFACTORING.md](./front-end-v2/ANALYSE_REFACTORING.md) - Analyse domaines FR (569 lignes)
- 📋 [REFACTORING_TODO.md](./front-end-v2/REFACTORING_TODO.md) - TODO détaillé (844 lignes)
- 📈 [PROGRESS.md](./front-end-v2/PROGRESS.md) - Suivi progression (339 lignes)

**Référence**:
- 📚 [DOCS_INDEX.md](./front-end-v2/DOCS_INDEX.md) - Index complet documentation (322 lignes)
- ✨ [FEATURES.md](./front-end-v2/FEATURES.md) - Catalogue features (517 lignes)
- 📝 [CHANGELOG.md](./front-end-v2/CHANGELOG.md) - Historique versions (538 lignes)

**Total**: 8500+ lignes de documentation ! 📚

---

## 🛠️ Technologies

### Front-End V2
- **Architecture**: Feature-Sliced Design (FSD)
- **Framework**: React 18 + TypeScript 5.8
- **Build**: Vite 6
- **State**: TanStack Query v5
- **Routing**: React Router v7
- **UI**: PatternFly 6

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT
- **Payment**: Stripe

---

## 🚀 Démarrage Rapide

### Front-End V2

```bash
# Installation
cd front-end-v2
npm install

# Configuration
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# Lancement
npm run dev
```

**Documentation**: Voir [front-end-v2/QUICK_START.md](./front-end-v2/QUICK_START.md)

### Backend API

```bash
cd api
npm install
npm run dev
```

---

## 📊 Progression Front-End V2

| Catégorie | Actuel | Objectif | Progrès |
|-----------|--------|----------|---------|
| Infrastructure | ✅ | ✅ | 100% |
| Features | 2 | 12 | 17% |
| Pages | 10 | 25 | 40% |
| Composants UI | 2 | 20 | 10% |
| Tests | 0% | 80% | 0% |

**Features Complétées**:
- ✅ Authentication (login, register, profile, security)
- ✅ Professors Management (CRUD complet)

**Prochaines Features**:
- 🔴 Courses (gestion cours)
- 🔴 Enrollment (inscriptions)
- 🔴 Sessions (calendrier)
- 🟡 Payment (Stripe)
- 🟡 Products (boutique)

---

## 🎯 Objectifs 2025

### Q1 (Janvier-Mars)
- [x] Infrastructure FSD complète ✅
- [x] Feature Auth ✅
- [x] Feature Professors ✅
- [ ] Features Core Business (Courses, Enrollment, Sessions)
- [ ] Payment Integration (Stripe)

### Q2 (Avril-Juin)
- [ ] Advanced Features (Notifications, Messages, Dashboard)
- [ ] Tests (80%+ coverage)
- [ ] Production Deployment
- [ ] Migration v1 → v2

---

## 📞 Support & Contribution

### Documentation
- **Front-End V2**: Voir [front-end-v2/DOCS_INDEX.md](./front-end-v2/DOCS_INDEX.md)
- **Migration Guide**: [front-end/MIGRATION_GUIDE.md](./front-end/MIGRATION_GUIDE.md)

### Démarrer
1. Lire [front-end-v2/QUICK_START.md](./front-end-v2/QUICK_START.md)
2. Étudier exemples: `front-end-v2/src/features/auth/`
3. Suivre [front-end-v2/ACTION_PLAN.md](./front-end-v2/ACTION_PLAN.md)

---

## 📄 License

Voir [LICENSE](./LICENSE)

---

**Status Global**: ✅ On Track | **Version**: 2.0.0-alpha | **Last Update**: Janvier 2025
