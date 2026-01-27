# Tests d'authentification - Guide d'exécution

## 📊 État actuel des tests

- ✅ **182 tests unitaires** - 100% de réussite
- ⏳ **27 tests d'intégration** - Nécessitent MySQL

## 🧪 Types de tests

### Tests unitaires (182 tests)
Tests qui ne nécessitent pas de base de données réelle. Ils utilisent des mocks pour tester la logique métier.

**Fichiers de tests :**
- `auth.test.ts` - Tests de base (authentification, création de compte, etc.)
- `auth.edge-cases.test.ts` - Cas limites et erreurs
- `auth.validation.test.ts` - Validation des données
- `auth.errors.test.ts` - Gestion des erreurs
- `auth.security.test.ts` - Tests de sécurité
- `auth.performance.test.ts` - Tests de performance
- `auth.schema.test.ts` - Validation des schémas de données

### Tests d'intégration (27 tests)
Tests qui nécessitent une base de données MySQL réelle pour valider le comportement de bout en bout.

**Fichier de tests :**
- `auth.integration.test.ts` - Tests d'intégration avec DB

## 🚀 Exécution des tests

### Option 1 : Tests unitaires uniquement (recommandé pour le développement)

```bash
# Depuis le dossier api/
npm test -- routes/auth/__tests__/auth.test.ts
npm test -- routes/auth/__tests__/auth.validation.test.ts
npm test -- routes/auth/__tests__/auth.security.test.ts
# ... ou tous sauf integration :
npm test -- routes/auth/__tests__/ --testPathIgnorePatterns=integration
```

### Option 2 : Tous les tests (unitaires + intégration)

**Prérequis :**
1. MySQL doit être installé et démarré
2. Les variables d'environnement de test doivent être configurées

**Étapes :**

#### Windows (XAMPP/WAMP)

```powershell
# 1. Démarrer MySQL (XAMPP Control Panel ou services Windows)

# 2. Depuis le dossier api/ en PowerShell :
.\manage-test-db.ps1 setup

# 3. Lancer les tests
npm test -- routes/auth/__tests__/

# Ou workflow complet automatique :
.\manage-test-db.ps1 all
```

#### Linux/macOS

```bash
# 1. S'assurer que MySQL est démarré
sudo systemctl start mysql  # Linux
# ou
brew services start mysql  # macOS

# 2. Créer la base de données de test
mysql -uroot -p -e "DROP DATABASE IF EXISTS clubmanager_test; CREATE DATABASE clubmanager_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Appliquer le schéma
mysql -uroot -p clubmanager_test < ../db/clubmanager.sql

# 4. Appliquer la migration auth_attempts
mysql -uroot -p clubmanager_test < prisma/migrations/20250101000000_add_auth_attempts_table/migration.sql

# 5. Lancer les tests
npm test -- routes/auth/__tests__/
```

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env.test` dans le dossier `api/` :

```env
DATABASE_URL="mysql://root@localhost:3306/clubmanager_test"
NODE_ENV=test
```

### Structure de la base de données de test

La base de données de test `clubmanager_test` doit contenir :

1. **Tables principales** (depuis `db/clubmanager.sql`) :
   - `utilisateurs`
   - `status`
   - `password_reset_tokens`
   - `password_reset_attempts`
   - `manual_recovery_requests`

2. **Table supplémentaire** (migration Prisma) :
   - `auth_attempts` - pour l'audit des tentatives de connexion

## 📋 Scripts PowerShell disponibles (Windows)

### `manage-test-db.ps1`

Script principal pour gérer la base de données de test.

```powershell
# Commandes disponibles :
.\manage-test-db.ps1 setup      # Configure la DB de test
.\manage-test-db.ps1 reset      # Réinitialise la DB
.\manage-test-db.ps1 seed       # Insère des données de test
.\manage-test-db.ps1 clean      # Nettoie les données
.\manage-test-db.ps1 test       # Lance les tests
.\manage-test-db.ps1 all        # Workflow complet
.\manage-test-db.ps1 help       # Affiche l'aide
```

### `setup-test-db.ps1`

Script de configuration initial (appelé par `manage-test-db.ps1`).

## 🐛 Résolution des problèmes

### Erreur : "Can't connect to MySQL server"

**Cause :** MySQL n'est pas démarré.

**Solution :**
- Windows : Démarrer XAMPP/WAMP et activer MySQL
- Linux : `sudo systemctl start mysql`
- macOS : `brew services start mysql`

### Erreur : "Access denied for user 'root'"

**Cause :** Mot de passe MySQL incorrect.

**Solution :**
1. Modifier les scripts pour inclure votre mot de passe MySQL
2. Ou configurer MySQL sans mot de passe pour root en local (développement uniquement)

### Erreur : "Table 'auth_attempts' doesn't exist"

**Cause :** La migration n'a pas été appliquée.

**Solution :**
```bash
# Appliquer manuellement la migration
mysql -uroot -p clubmanager_test < prisma/migrations/20250101000000_add_auth_attempts_table/migration.sql
```

### Erreur : "Database 'clubmanager_test' doesn't exist"

**Cause :** La base de données de test n'existe pas.

**Solution :**
```powershell
# Windows PowerShell
.\manage-test-db.ps1 setup

# Ou manuellement
mysql -uroot -e "CREATE DATABASE clubmanager_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## 📊 Détails des tests

### Couverture par catégorie

| Catégorie | Tests | Description |
|-----------|-------|-------------|
| Base | 7 | Authentification, création de compte |
| Edge cases | 28 | Cas limites et validation stricte |
| Validation | 34 | Validation des entrées utilisateur |
| Erreurs | 24 | Gestion des erreurs et exceptions |
| Sécurité | 30 | Protection contre les attaques |
| Performance | 32 | Charges et concurrence |
| Schéma | 27 | Validation des types de données |
| **Intégration** | **27** | **Tests avec DB réelle** |
| **TOTAL** | **209** | |

### Tests de sécurité couverts

- ✅ Protection contre les attaques par force brute
- ✅ Protection contre les injections SQL
- ✅ Protection contre les attaques XSS
- ✅ Stockage sécurisé des mots de passe (bcrypt)
- ✅ Gestion sécurisée des tokens
- ✅ Protection contre l'énumération des utilisateurs
- ✅ Validation stricte des mots de passe
- ✅ Protection des sessions
- ✅ Audit et traçabilité
- ✅ Protection contre les attaques par timing
- ✅ Protection des données sensibles

## 🎯 Recommandations

### Pour le développement quotidien

1. **Exécuter uniquement les tests unitaires** (rapides, sans MySQL)
   ```bash
   npm test -- routes/auth/__tests__/ --testPathIgnorePatterns=integration
   ```

2. **Utiliser le mode watch** pour le développement
   ```bash
   npm test -- routes/auth/__tests__/ --watch --testPathIgnorePatterns=integration
   ```

### Avant de commiter

1. **Exécuter tous les tests unitaires**
   ```bash
   npm test -- routes/auth/__tests__/ --testPathIgnorePatterns=integration
   ```

2. **Vérifier la couverture de code**
   ```bash
   npm test -- routes/auth/__tests__/ --coverage --testPathIgnorePatterns=integration
   ```

### Avant de merger (CI/CD)

1. **Exécuter TOUS les tests** (unitaires + intégration)
   ```bash
   # S'assurer que MySQL est démarré
   .\manage-test-db.ps1 all  # Windows
   # ou
   npm test -- routes/auth/__tests__/  # Linux/macOS avec MySQL démarré
   ```

## 📚 Documentation complémentaire

- [Guide des tests Jest](https://jestjs.io/docs/getting-started)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Stratégie de tests du projet](../../../tests/README.md)

## 🔄 Workflow CI/CD recommandé

```yaml
# Exemple pour GitHub Actions
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- routes/auth/__tests__/ --testPathIgnorePatterns=integration
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: clubmanager_test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- routes/auth/__tests__/auth.integration.test.ts
```

## ✅ Résultat attendu

Quand tout fonctionne correctement :

```
Test Suites: 8 passed, 8 total
Tests:       209 passed, 209 total
Snapshots:   0 total
Time:        ~6-8s
```

---

**Dernière mise à jour :** Janvier 2025  
**Mainteneur :** Équipe ClubManager