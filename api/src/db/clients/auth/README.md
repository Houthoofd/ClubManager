# Module Auth

Module de gestion de l'authentification et de la sécurité du système ClubManager. Ce module permet l'authentification des utilisateurs, la gestion des comptes, et la récupération de mot de passe.

## 📁 Structure

```
auth/
├── README.md                    # Ce fichier
├── index.ts                     # Point d'entrée / barrel exports
├── auth.ts                      # Classe principale (composition)
├── auth.repository.ts           # Récupération des données
├── queries.ts                   # Requêtes SQL
├── types.ts                     # Types et interfaces TypeScript
└── utils.ts                     # Utilitaires (validation, hashing, tokens)
```

**Service associé** : `api/src/services/authService.ts` (logique métier)

## 🎯 Responsabilités

### 📦 `auth.ts` - Classe Principale
Point d'entrée unifié qui compose le repository et le service. C'est la classe à utiliser dans votre code.

**Responsabilité** : Façade/API publique du module

### 📖 `auth.repository.ts` - Repository
Gestion des opérations de **lecture** (queries SELECT).

**Responsabilité** : Récupération et mapping des données depuis la base

**Méthodes** :
- `rechercherUtilisateurParEmail(email)` - Recherche utilisateur
- `rechercherUtilisateurActifParEmail(email)` - Recherche utilisateur actif uniquement
- `emailExiste(email)` - Vérifie si email existe
- `obtenirInformationsSecurite(userId)` - Infos de sécurité utilisateur
- `verifierTokenRecuperation(token)` - Vérifie un token de récupération
- `verifierTentativesRecuperationRecentes(email, minutes)` - Compte tentatives
- `obtenirTentativesConnexionRecentes(email, minutes)` - Compte connexions
- `listerTokensUtilisateur(userId)` - Liste les tokens actifs
- `compterUtilisateursActifs()` - Statistiques

### ⚙️ `authService.ts` - Service (dans `services/`)
Gestion des opérations d'**écriture** et des actions métier (INSERT, UPDATE, DELETE).

**Responsabilité** : Logique métier et mutations

**Méthodes** :
- `authentifierUtilisateur(email, password)` - Authentification
- `creerCompteUtilisateur(userData)` - Création de compte
- `modifierMotDePasse(userId, newPasswordHash)` - Modification mot de passe
- `creerTokenRecuperation(userId, token, expiresAt)` - Créer token récupération
- `marquerTokenUtilise(token)` - Marquer token comme utilisé
- `reinitialiserMotDePasseAvecToken(token, newPasswordHash)` - Réinitialiser mot de passe
- `nettoyerTokensExpires()` - Nettoyage tokens expirés
- `enregistrerTentativeRecuperation(email, success)` - Audit tentative récupération
- `enregistrerTentativeConnexion(email, success)` - Audit tentative connexion
- `creerDemandeRecuperationManuelle(userId, raison, infos)` - Demande manuelle
- `validerEtHasherMotDePasse(password)` - Validation + hashing

### 🛠️ `utils.ts` - Utilitaires
Méthodes statiques pour validation, hashing, génération de tokens.

**Méthodes** :
- `genererTokenSecurise(length)` - Génère token hex sécurisé
- `hasherMotDePasse(password)` - Hash bcrypt
- `verifierMotDePasse(password, hash)` - Vérifie hash
- `validerEmail(email)` - Valide format email
- `validerMotDePasse(password)` - Valide force mot de passe
- `validerMotDePasseSimple(password)` - Validation simplifiée
- `normaliserEmail(email)` - Trim + lowercase
- `masquerEmail(email)` - Masque email pour affichage
- `genererDateExpiration(hours)` - Génère date expiration
- `genererDateExpirationJours(days)` - Expiration en jours
- `calculerDatePassee(minutes)` - Date dans le passé
- `estExpire(expiresAt)` - Vérifie si expiré
- `genererCodeVerification()` - Code 6 chiffres
- `validerCodeVerification(code)` - Valide code
- `sanitizeInput(input)` - Nettoie input

### 📝 `queries.ts` - Requêtes SQL
Toutes les requêtes SQL du module, organisées en constantes.

### 🏷️ `types.ts` - Types TypeScript
Interfaces, enums et types pour tout le module.

**Contient** :
- `UtilisateurAuth` - Données utilisateur
- `ResultatAuthentification` - Résultat connexion
- `CreerCompteParams` - Paramètres création compte
- `TokenRecuperation` - Token récupération mot de passe
- `InformationsSecurite` - Infos sécurité utilisateur
- `DemandeRecuperationManuelle` - Demande manuelle
- `ResultatValidationMotDePasse` - Validation mot de passe
- `TentativeAuth` - Tentative authentification

## 🚀 Usage

### Import Basique

```typescript
import { Auth } from './db/clients/auth';

const authClient = new Auth();
```

### Authentifier un Utilisateur

```typescript
const result = await authClient.authentifierUtilisateur(
  'user@example.com',
  'Password123!'
);

if (result.success) {
  console.log('Utilisateur authentifié:', result.user);
  // { id, first_name, last_name, email }
} else {
  console.log('Échec:', result.message);
}
```

### Créer un Compte

```typescript
const password = 'SecurePass123!';
const passwordHash = await Auth.hasherMotDePasse(password);

const result = await authClient.creerCompteUtilisateur({
  first_name: 'Jean',
  last_name: 'Dupont',
  email: 'jean.dupont@example.com',
  password_hash: passwordHash
});

console.log(result.message); // "Compte créé avec succès"
```

### Récupération de Mot de Passe

```typescript
// 1. Utilisateur demande récupération
const email = 'user@example.com';
const user = await authClient.rechercherUtilisateurParEmail(email);

if (user) {
  // 2. Générer token sécurisé
  const token = Auth.genererTokenSecurise();
  const expiresAt = new Date(Date.now() + 3600000); // 1 heure

  // 3. Créer le token en base
  await authClient.creerTokenRecuperation(user.id, token, expiresAt);

  // 4. Envoyer email avec lien contenant le token
  const resetLink = `https://example.com/reset-password?token=${token}`;
  // Envoyer email...
}
```

### Réinitialiser Mot de Passe avec Token

```typescript
const token = 'token-from-email-link';
const newPassword = 'NewSecurePass123!';

// Valider et hasher le nouveau mot de passe
const validation = await authClient.validerEtHasherMotDePasse(newPassword);

if (validation.success) {
  const result = await authClient.reinitialiserMotDePasseAvecToken(
    token,
    validation.hash!
  );

  if (result.isConfirm) {
    console.log('Mot de passe réinitialisé avec succès');
  } else {
    console.log('Token invalide ou expiré');
  }
} else {
  console.log('Mot de passe invalide:', validation.errors);
}
```

### Vérifier Email Existant

```typescript
const exists = await authClient.emailExiste('test@example.com');
if (exists) {
  console.log('Cet email est déjà utilisé');
}
```

### Protection Anti-Spam

```typescript
const email = 'user@example.com';
const tentatives = await authClient.verifierTentativesRecuperationRecentes(email, 15);

if (tentatives >= 3) {
  console.log('Trop de tentatives récentes. Veuillez réessayer plus tard.');
} else {
  // Autoriser la demande de récupération
}
```

## 🔧 Usage Avancé

### Utilisation des Utilitaires

```typescript
import { AuthUtils } from './db/clients/auth';

// Valider email
const isValid = AuthUtils.validerEmail('test@example.com'); // true

// Valider mot de passe
const validation = AuthUtils.validerMotDePasse('Pass123!');
if (!validation.valid) {
  console.log('Erreurs:', validation.errors);
}

// Masquer email
const masked = AuthUtils.masquerEmail('jean.dupont@example.com');
console.log(masked); // "j***t@example.com"

// Générer code vérification
const code = AuthUtils.genererCodeVerification(); // "123456"

// Normaliser email
const normalized = AuthUtils.normaliserEmail('  User@EXAMPLE.com  ');
// "user@example.com"
```

### Méthodes Statiques

```typescript
// Hash un mot de passe
const hash = await Auth.hasherMotDePasse('Password123!');

// Vérifier un mot de passe
const isValid = await Auth.verifierMotDePasse('Password123!', hash);

// Valider email
const isEmailValid = Auth.validerEmail('test@example.com');

// Valider mot de passe
const passwordValidation = Auth.validerMotDePasse('Pass123!');

// Générer token
const token = Auth.genererTokenSecurise(32);

// Normaliser email
const normalized = Auth.normaliserEmail('User@Example.com');

// Masquer email
const masked = Auth.masquerEmail('user@example.com');
```

### Tests Unitaires - Mock Repository

```typescript
import { AuthRepository } from './db/clients/auth';

jest.mock('./db/clients/auth/auth.repository');

const mockRepo = AuthRepository as jest.MockedClass<typeof AuthRepository>;
mockRepo.prototype.rechercherUtilisateurParEmail.mockResolvedValue({
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  status_id: 1
});
```

### Tests Unitaires - Mock Service

```typescript
import { AuthService } from './services/authService';

jest.mock('./services/authService');

const mockService = AuthService as jest.MockedClass<typeof AuthService>;
mockService.prototype.authentifierUtilisateur.mockResolvedValue({
  success: true,
  user: { id: 1, first_name: 'Test', last_name: 'User', email: 'test@example.com' }
});
```

## 🗄️ Base de Données

### Tables Utilisées

- **`utilisateurs`** - Comptes utilisateurs
  - `id`, `first_name`, `last_name`, `email`, `password_hash`, `status_id`
  
- **`password_reset_tokens`** - Tokens de récupération
  - `id`, `user_id`, `token`, `expires_at`, `created_at`
  
- **`password_reset_attempts`** - Audit tentatives récupération
  - `id`, `email`, `success`, `attempted_at`
  
- **`auth_attempts`** - Audit tentatives connexion
  - `id`, `email`, `success`, `attempted_at`
  
- **`manual_recovery_requests`** - Demandes manuelles
  - `id`, `user_id`, `reason`, `verification_data`, `status`, `created_at`, `expires_at`

### Colonnes Importantes

```sql
-- utilisateurs
email VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL  -- Ou 'password' selon schéma
status_id INT DEFAULT 1              -- 1 = actif

-- password_reset_tokens
user_id INT NOT NULL                 -- Référence utilisateurs.id
token VARCHAR(255) UNIQUE NOT NULL
expires_at DATETIME NOT NULL
```

## ✅ Avantages de cette Architecture

1. **Séparation des Responsabilités**
   - Repository = Lecture des données
   - Service = Logique métier et mutations
   - Utils = Fonctions utilitaires réutilisables
   - Queries = SQL isolé et testable

2. **Sécurité Renforcée**
   - Validation stricte des emails et mots de passe
   - Hashing bcrypt avec salt
   - Tokens sécurisés cryptographiques
   - Protection anti-spam
   - Audit des tentatives

3. **Testabilité**
   - Chaque classe testable indépendamment
   - Mock facile des dépendances
   - Utilitaires testables en isolation

4. **Maintenabilité**
   - Code organisé et lisible
   - Modifications localisées
   - Évolution facile
   - Documentation complète

5. **Type Safety**
   - Types TypeScript complets
   - Autocomplétion IDE
   - Détection d'erreurs à la compilation

## 🔒 Bonnes Pratiques de Sécurité

### Validation des Mots de Passe

```typescript
// ✅ BON - Validation stricte
const validation = AuthUtils.validerMotDePasse(password);
if (!validation.valid) {
  return { error: validation.errors };
}
const hash = await Auth.hasherMotDePasse(password);

// ❌ MAUVAIS - Pas de validation
const hash = await Auth.hasherMotDePasse(password);
```

### Gestion des Tokens

```typescript
// ✅ BON - Token sécurisé avec expiration courte
const token = Auth.genererTokenSecurise(32);
const expiresAt = new Date(Date.now() + 3600000); // 1 heure
await authClient.creerTokenRecuperation(userId, token, expiresAt);

// ❌ MAUVAIS - Token prévisible ou expiration longue
const token = `${userId}-${Date.now()}`;
const expiresAt = new Date(Date.now() + 86400000 * 365); // 1 an
```

### Protection Anti-Brute Force

```typescript
// ✅ BON - Vérifier les tentatives avant d'authentifier
const tentatives = await authClient.obtenirTentativesConnexionRecentes(email, 15);
if (tentatives >= 5) {
  return { error: 'Trop de tentatives. Réessayez dans 15 minutes.' };
}

const result = await authClient.authentifierUtilisateur(email, password);

// ❌ MAUVAIS - Pas de limitation
const result = await authClient.authentifierUtilisateur(email, password);
```

### Masquage des Emails

```typescript
// ✅ BON - Masquer l'email dans les logs/réponses
const maskedEmail = Auth.masquerEmail(user.email);
console.log(`Email de récupération envoyé à ${maskedEmail}`);

// ❌ MAUVAIS - Exposer l'email complet
console.log(`Email de récupération envoyé à ${user.email}`);
```

## 📊 Exemples Complets

### Workflow Complet d'Inscription

```typescript
async function inscrireUtilisateur(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const authClient = new Auth();

  // 1. Valider l'email
  if (!Auth.validerEmail(data.email)) {
    return { error: "Format d'email invalide" };
  }

  // 2. Vérifier si l'email existe déjà
  const exists = await authClient.emailExiste(data.email);
  if (exists) {
    return { error: "Cet email est déjà utilisé" };
  }

  // 3. Valider et hasher le mot de passe
  const validation = await authClient.validerEtHasherMotDePasse(data.password);
  if (!validation.success) {
    return { error: validation.errors };
  }

  // 4. Créer le compte
  const result = await authClient.creerCompteUtilisateur({
    first_name: data.firstName,
    last_name: data.lastName,
    email: Auth.normaliserEmail(data.email),
    password_hash: validation.hash!
  });

  return { success: result.isConfirm, message: result.message };
}
```

### Workflow Complet de Récupération

```typescript
async function demanderRecuperationMotDePasse(email: string) {
  const authClient = new Auth();

  // 1. Vérifier les tentatives récentes (anti-spam)
  const tentatives = await authClient.verifierTentativesRecuperationRecentes(email, 15);
  if (tentatives >= 3) {
    await authClient.enregistrerTentativeRecuperation(email, false);
    return { error: 'Trop de tentatives. Réessayez dans 15 minutes.' };
  }

  // 2. Rechercher l'utilisateur
  const user = await authClient.rechercherUtilisateurParEmail(email);
  if (!user) {
    // Ne pas révéler que l'utilisateur n'existe pas (sécurité)
    await authClient.enregistrerTentativeRecuperation(email, false);
    return { 
      success: true, 
      message: 'Si cet email existe, un lien de récupération a été envoyé.' 
    };
  }

  // 3. Vérifier le statut du compte
  if (user.status_id !== 1) {
    await authClient.enregistrerTentativeRecuperation(email, false);
    return { error: 'Ce compte est désactivé.' };
  }

  // 4. Générer token sécurisé
  const token = Auth.genererTokenSecurise(32);
  const expiresAt = new Date(Date.now() + 3600000); // 1 heure

  // 5. Créer le token en base
  await authClient.creerTokenRecuperation(user.id, token, expiresAt);

  // 6. Enregistrer tentative réussie
  await authClient.enregistrerTentativeRecuperation(email, true);

  // 7. Envoyer email
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  // await emailService.sendPasswordResetEmail(user.email, resetLink);

  const maskedEmail = Auth.masquerEmail(user.email);
  return { 
    success: true, 
    message: `Email de récupération envoyé à ${maskedEmail}` 
  };
}
```

### Middleware d'Authentification Express

```typescript
import { Auth } from './db/clients/auth';
import jwt from 'jsonwebtoken';

async function authenticateMiddleware(req: any, res: any, next: any) {
  try {
    // 1. Extraire le token JWT
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    // 2. Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // 3. Vérifier que l'utilisateur existe toujours
    const authClient = new Auth();
    const user = await authClient.rechercherUtilisateurParEmail(decoded.email);

    if (!user || user.status_id !== 1) {
      return res.status(401).json({ error: 'Utilisateur invalide' });
    }

    // 4. Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}
```

## 🧪 Tests

### Exemple de Test Unitaire (Utils)

```typescript
import { AuthUtils } from './utils';

describe('AuthUtils', () => {
  describe('validerEmail', () => {
    it('devrait valider un email correct', () => {
      expect(AuthUtils.validerEmail('test@example.com')).toBe(true);
    });

    it('devrait rejeter un email invalide', () => {
      expect(AuthUtils.validerEmail('invalid')).toBe(false);
      expect(AuthUtils.validerEmail('test@')).toBe(false);
      expect(AuthUtils.validerEmail('@example.com')).toBe(false);
    });
  });

  describe('validerMotDePasse', () => {
    it('devrait valider un mot de passe fort', () => {
      const result = AuthUtils.validerMotDePasse('Pass123!@#');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter un mot de passe faible', () => {
      const result = AuthUtils.validerMotDePasse('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('masquerEmail', () => {
    it('devrait masquer un email correctement', () => {
      const masked = AuthUtils.masquerEmail('jean.dupont@example.com');
      expect(masked).toBe('j*********t@example.com');
    });
  });
});
```

### Exemple de Test d'Intégration

```typescript
import { Auth } from './auth';

describe('Auth Integration', () => {
  let authClient: Auth;

  beforeEach(() => {
    authClient = new Auth();
  });

  it('devrait créer un compte et authentifier', async () => {
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    // Créer compte
    const hash = await Auth.hasherMotDePasse(password);
    const createResult = await authClient.creerCompteUtilisateur({
      first_name: 'Test',
      last_name: 'User',
      email,
      password_hash: hash
    });

    expect(createResult.isConfirm).toBe(true);

    // Authentifier
    const authResult = await authClient.authentifierUtilisateur(email, password);
    expect(authResult.success).toBe(true);
    expect(authResult.user?.email).toBe(email);
  });
});
```

## 🔄 Migration depuis l'Ancien Code

L'API publique reste identique, **aucun changement n'est nécessaire** dans votre code existant :

```typescript
// Ancien code (fonctionne toujours)
const auth = new Auth();
await auth.authentifierUtilisateur(email, password);
await auth.creerCompteUtilisateur(userData);
await auth.rechercherUtilisateurParEmail(email);

// ✅ Aucune modification nécessaire
```

## 🚧 TODO / Améliorations Futures

- [ ] Ajouter authentification à deux facteurs (2FA)
- [ ] Implémenter sessions Redis
- [ ] Ajouter OAuth2 (Google, Facebook, etc.)
- [ ] Rate limiting avancé par IP
- [ ] Webhook pour événements auth (connexion, échec, etc.)
- [ ] Export logs d'audit
- [ ] Dashboard de monitoring sécurité
- [ ] Détection d'activité suspecte (ML)
- [ ] Support biométrique (future)

## 📚 Voir Aussi

- [Documentation Types ClubManager](../../types/README.md)
- [MysqlConnector](../../connector/README.md)
- [AuthService](../../../services/authService.ts)
- [Architecture du Projet](../../../../../docs/ARCHITECTURE.md)

---

**Dernière mise à jour** : 2024  
**Auteur** : ClubManager Team