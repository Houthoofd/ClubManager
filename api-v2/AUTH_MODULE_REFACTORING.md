# Auth Module - Clean Architecture Refactoring

## 📋 Vue d'ensemble

Ce document décrit la refactorisation complète du module **Auth** (Authentification) vers une architecture Clean/Hexagonale, suivant le même pattern que les modules Users et Cours.

**Date de refactorisation** : 2024  
**Modules refactorés** : Users ✅ | Cours ✅ | **Auth ✅**  
**Modules restants** : Paiements, Magasin, Messagerie, Professeurs, etc.

---

## 🎯 Objectifs de la refactorisation

1. ✅ **Séparation des responsabilités** - Domain, Use Cases, Infrastructure, Presentation
2. ✅ **Testabilité** - Code testable avec injection de dépendances
3. ✅ **Maintenabilité** - Code organisé et facile à comprendre
4. ✅ **Sécurité** - Meilleure gestion des tokens, rate limiting, audit
5. ✅ **Scalabilité** - Architecture prête pour de futures évolutions

---

## 📁 Nouvelle structure du module Auth

```
api/src/
├── core/
│   ├── domain/
│   │   ├── entities/auth/
│   │   │   ├── RefreshToken.ts           # Entité Refresh Token
│   │   │   ├── PasswordResetToken.ts     # Entité Password Reset Token
│   │   │   ├── AuthAttempt.ts            # Entité Tentative d'authentification
│   │   │   └── index.ts
│   │   ├── value-objects/auth/
│   │   │   ├── Email.ts                  # VO Email validé et normalisé
│   │   │   ├── Password.ts               # VO Password avec hashing bcrypt
│   │   │   ├── Token.ts                  # VO Token (JWT + secure random)
│   │   │   └── index.ts
│   │   ├── interfaces/auth/
│   │   │   ├── IAuthRepository.ts        # Interface repository authentification
│   │   │   ├── IRefreshTokenRepository.ts
│   │   │   ├── IPasswordResetTokenRepository.ts
│   │   │   ├── ISecurityRepository.ts    # Interface repository sécurité/audit
│   │   │   └── index.ts
│   │   └── errors/auth/
│   │       └── AuthError.ts              # Erreurs du domaine Auth
│   │
│   └── use-cases/auth/
│       ├── authentication/
│       │   ├── LoginUseCase.ts           # UC: Connexion utilisateur
│       │   ├── LogoutUseCase.ts          # UC: Déconnexion
│       │   ├── RefreshTokensUseCase.ts   # UC: Renouvellement tokens
│       │   └── index.ts
│       ├── account/
│       │   ├── RegisterUseCase.ts        # UC: Création de compte
│       │   ├── ChangePasswordUseCase.ts  # UC: Changement mot de passe
│       │   ├── RequestPasswordResetUseCase.ts  # UC: Demande reset
│       │   ├── ResetPasswordUseCase.ts   # UC: Reset mot de passe
│       │   └── index.ts
│       └── index.ts
│
├── infrastructure/
│   └── repositories/auth/
│       ├── AuthRepository.ts             # Implémentation Prisma/MySQL
│       ├── RefreshTokenRepository.ts
│       ├── PasswordResetTokenRepository.ts
│       ├── SecurityRepository.ts
│       ├── README.md
│       └── index.ts
│
├── presentation/http/
│   ├── controllers/auth/
│   │   ├── AuthController.ts             # Contrôleur authentification
│   │   ├── AccountController.ts          # Contrôleur gestion de compte
│   │   └── index.ts
│   └── routes/auth/
│       ├── auth.routes.ts                # Routes /auth (login, logout, refresh)
│       ├── account.routes.ts             # Routes /account (register, reset pwd)
│       └── index.ts
│
└── container.ts                          # DI Container (Auth intégré)
```

---

## 🔄 Migration de l'ancienne structure

### Ancien code (avant refactorisation)

```
api/src/
├── services/auth/
│   ├── auth.service.ts                   # ❌ Logique métier mélangée avec infra
│   └── core/
│       ├── authentication/index.ts
│       ├── password/index.ts
│       └── tokens/index.ts
│
└── routes/auth/
    ├── auth.routes.ts                    # ❌ Logique dans les routes
    └── core/handlers/                    # ❌ Handlers avec logique métier
```

### Nouveau code (après refactorisation)

✅ **Domain** : Entités, Value Objects, Interfaces  
✅ **Use Cases** : Logique métier pure (Login, Register, Reset Password, etc.)  
✅ **Infrastructure** : Repositories Prisma (accès DB)  
✅ **Presentation** : Controllers Express (HTTP) + Routes  
✅ **Container** : Injection de dépendances centralisée

---

## 🏗️ Architecture Clean - Couches

### 1️⃣ Domain Layer (Core Business)

**Value Objects** - Objets immuables avec validation

```typescript
// Email.ts - Normalise et valide les emails
const email = Email.create('user@example.com'); // john@example.com → normalized
console.log(email.getValue()); // "john@example.com"
console.log(email.toMasked());  // "j***n@example.com"

// Password.ts - Hash et validation sécurisée
const password = await Password.create('MyP@ssw0rd123'); // Valide + hash bcrypt
const isValid = await password.verify('MyP@ssw0rd123'); // true

// Token.ts - JWT et tokens sécurisés
const accessToken = Token.createJWT({ id: 1, email: 'user@ex.com' }, 'access', '24h');
const resetToken = Token.createSecure('password-reset', 1, 32); // random hex
```

**Entités** - Objets métier avec logique

```typescript
// RefreshToken - Gestion des refresh tokens
const refreshToken = RefreshToken.create({
  userId: 1,
  tokenValue: Token.createSecure('refresh', 720), // 30 jours
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

if (refreshToken.isValid()) {
  // Token valide (non expiré, non révoqué)
}

refreshToken.revoke(); // Révoque le token
```

**Interfaces** - Contrats pour l'infrastructure

```typescript
interface IAuthRepository {
  findUserByEmail(email: Email): Promise<User | null>;
  createUser(data: CreateUserData): Promise<User>;
  updatePassword(userId: number, password: Password): Promise<void>;
  checkEmailExists(email: Email): Promise<boolean>;
  recordAuthAttempt(attempt: AuthAttempt): Promise<void>;
}
```

---

### 2️⃣ Use Cases Layer (Application Business Logic)

**Pattern** : 1 Use Case = 1 Action métier

```typescript
// LoginUseCase.ts
class LoginUseCase {
  constructor(
    private authRepo: IAuthRepository,
    private refreshTokenRepo: IRefreshTokenRepository,
    private securityRepo: ISecurityRepository
  ) {}

  async execute(input: LoginInput): Promise<LoginResponse> {
    // 1. Valider input avec Value Objects
    const email = Email.create(input.email);
    
    // 2. Rate limiting
    const attempts = await this.securityRepo.getRecentAuthAttempts(email, 15);
    if (attempts >= 5) throw AuthError.tooManyAttempts();
    
    // 3. Authentifier
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) throw AuthError.invalidCredentials();
    
    const password = Password.fromHash(user.password);
    const isValid = await password.verify(input.password);
    if (!isValid) throw AuthError.invalidCredentials();
    
    // 4. Créer tokens
    const accessToken = Token.createJWT({ id: user.id, email }, 'access', '24h');
    const refreshToken = await this.refreshTokenRepo.create(user.id, ...);
    
    // 5. Enregistrer tentative
    await this.authRepo.recordAuthAttempt(...);
    
    return { success: true, accessToken, refreshToken, user };
  }
}
```

**Use Cases disponibles** :
- ✅ `LoginUseCase` - Connexion
- ✅ `LogoutUseCase` - Déconnexion
- ✅ `RefreshTokensUseCase` - Renouvellement tokens
- ✅ `RegisterUseCase` - Inscription
- ✅ `ChangePasswordUseCase` - Changement mot de passe
- ✅ `RequestPasswordResetUseCase` - Demande reset
- ✅ `ResetPasswordUseCase` - Reset mot de passe

---

### 3️⃣ Infrastructure Layer (Database Access)

**Repositories** - Implémentations Prisma

```typescript
// AuthRepository.ts
class AuthRepository implements IAuthRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findUserByEmail(email: Email): Promise<User | null> {
    const dbUser = await this.prisma.utilisateurs.findFirst({
      where: { email: email.getValue() }
    });
    
    if (!dbUser) return null;
    
    // Convertir DB → Domain Entity
    return this.toDomain(dbUser);
  }
  
  private toDomain(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      password: dbUser.password,
      // ... autres champs
    };
  }
}
```

---

### 4️⃣ Presentation Layer (HTTP Controllers)

**Controllers** - Gestion des requêtes HTTP

```typescript
// AuthController.ts
class AuthController {
  constructor(
    private loginUseCase: LoginUseCase,
    private logoutUseCase: LogoutUseCase,
    private refreshTokensUseCase: RefreshTokensUseCase
  ) {}
  
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      // Extraction metadata
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];
      
      // Appeler le Use Case
      const result = await this.loginUseCase.execute({
        email,
        password,
        ipAddress,
        userAgent
      });
      
      // Définir cookies (production)
      if (process.env.NODE_ENV === 'production') {
        res.cookie('accessToken', result.accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000 // 24h
        });
      }
      
      res.json({ success: true, data: result });
      
    } catch (error) {
      if (AuthError.isAuthError(error)) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({ success: false, error: 'Erreur serveur' });
      }
    }
  }
}
```

**Routes** - Déclaration des endpoints

```typescript
// auth.routes.ts
export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();
  
  // Public routes
  router.post('/login', asyncHandler(authController.login.bind(authController)));
  router.post('/refresh', asyncHandler(authController.refresh.bind(authController)));
  
  // Protected routes
  router.post('/logout', verifyToken, asyncHandler(authController.logout.bind(authController)));
  
  return router;
}
```

---

## 🔌 Intégration dans l'application

### Étape 1 : Container DI (déjà fait ✅)

Le container `container.ts` a été mis à jour avec tous les composants Auth :
- Repositories : `authRepository`, `refreshTokenRepository`, `passwordResetTokenRepository`, `securityRepository`
- Use Cases : `loginUseCase`, `registerUseCase`, etc.
- Controllers : `authController`, `accountController`

### Étape 2 : Monter les routes dans `app.ts`

```typescript
// app.ts
import { container } from './container.js';
import { createAuthRoutes } from './presentation/http/routes/auth/auth.routes.js';
import { createAccountRoutes } from './presentation/http/routes/auth/account.routes.js';

// Récupérer les controllers depuis le container
const authController = container.authController;
const accountController = container.accountController;

// Créer les routes
const authRoutes = createAuthRoutes(authController);
const accountRoutes = createAccountRoutes(accountController);

// Monter les routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
```

### Étape 3 : Variables d'environnement

Ajouter dans `.env` :

```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=30d

# Rate Limiting
MAX_LOGIN_ATTEMPTS=5
LOGIN_ATTEMPTS_WINDOW=15

# Cookies (Production)
NODE_ENV=production
COOKIE_DOMAIN=clubmanager.com
COOKIE_SECURE=true
```

---

## 📡 API Endpoints

### Authentication Endpoints (`/api/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/login` | Connexion utilisateur | ❌ Public |
| `POST` | `/logout` | Déconnexion | ✅ Protected |
| `POST` | `/refresh` | Renouvellement tokens | ❌ Public |

### Account Endpoints (`/api/account`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/register` | Inscription | ❌ Public |
| `POST` | `/change-password` | Changement mot de passe | ✅ Protected |
| `POST` | `/forgot-password` | Demande reset | ❌ Public |
| `POST` | `/reset-password` | Reset mot de passe | ❌ Public |

### Exemples de requêtes

**Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "MyP@ssw0rd123"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6...",
    "user": {
      "id": 1,
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Register**
```bash
POST /api/account/register
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "password": "SecureP@ss123"
}
```

**Change Password**
```bash
POST /api/account/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldP@ss123",
  "newPassword": "NewP@ss456"
}
```

---

## 🧪 Tests

### Tests Unitaires (Use Cases)

```typescript
// LoginUseCase.test.ts
describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockAuthRepo: jest.Mocked<IAuthRepository>;
  let mockRefreshTokenRepo: jest.Mocked<IRefreshTokenRepository>;
  let mockSecurityRepo: jest.Mocked<ISecurityRepository>;
  
  beforeEach(() => {
    mockAuthRepo = createMockAuthRepository();
    mockRefreshTokenRepo = createMockRefreshTokenRepository();
    mockSecurityRepo = createMockSecurityRepository();
    
    loginUseCase = new LoginUseCase(
      mockAuthRepo,
      mockRefreshTokenRepo,
      mockSecurityRepo
    );
  });
  
  it('should login successfully with valid credentials', async () => {
    // Arrange
    const input = {
      email: 'john@example.com',
      password: 'ValidP@ss123'
    };
    
    mockSecurityRepo.getRecentAuthAttempts.mockResolvedValue(0);
    mockAuthRepo.findUserByEmail.mockResolvedValue(mockUser);
    
    // Act
    const result = await loginUseCase.execute(input);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe('john@example.com');
  });
  
  it('should throw error with invalid credentials', async () => {
    // Arrange
    mockAuthRepo.findUserByEmail.mockResolvedValue(null);
    
    // Act & Assert
    await expect(loginUseCase.execute({ email: 'wrong@example.com', password: 'wrong' }))
      .rejects.toThrow(AuthError);
  });
});
```

### Tests d'intégration (Repositories)

```typescript
// AuthRepository.test.ts
describe('AuthRepository (Integration)', () => {
  let authRepository: AuthRepository;
  let prisma: PrismaClient;
  
  beforeAll(async () => {
    prisma = new PrismaClient();
    authRepository = new AuthRepository(prisma);
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  it('should find user by email', async () => {
    const email = Email.create('test@example.com');
    const user = await authRepository.findUserByEmail(email);
    expect(user).toBeDefined();
  });
});
```

---

## 🔒 Sécurité

### Fonctionnalités implémentées

✅ **Rate Limiting** - 5 tentatives par 15 minutes  
✅ **Password Hashing** - bcrypt avec 12 rounds  
✅ **JWT Tokens** - Access (24h) + Refresh (30d)  
✅ **Token Rotation** - Refresh token révoqué après utilisation  
✅ **Audit Logging** - Toutes les tentatives enregistrées  
✅ **Cookie Security** - httpOnly, secure, sameSite  
✅ **Email Enumeration Protection** - Messages génériques  

### Best Practices

- ❌ Ne jamais logger les mots de passe en clair
- ✅ Toujours valider les inputs avec Value Objects
- ✅ Utiliser des messages d'erreur génériques (éviter "email n'existe pas")
- ✅ Révoquer tous les refresh tokens lors du changement de mot de passe
- ✅ Vérifier le statut utilisateur (actif/inactif) à chaque connexion

---

## 📝 TODOs / Prochaines étapes

### Court terme
- [ ] Écrire les tests unitaires pour tous les Use Cases
- [ ] Écrire les tests d'intégration pour les Repositories
- [ ] Créer les migrations Prisma pour les nouvelles tables (si nécessaire)
- [ ] Implémenter email de vérification (envoi réel)
- [ ] Ajouter middleware de vérification de rôle (admin, professeur, etc.)

### Moyen terme
- [ ] Implémenter Two-Factor Authentication (2FA)
- [ ] Ajouter OAuth2 (Google, Facebook)
- [ ] Créer dashboard admin pour gérer les sessions
- [ ] Implémenter session management (liste des appareils connectés)
- [ ] Ajouter logs structurés (Winston/Pino)

### Long terme
- [ ] Implémenter RBAC (Role-Based Access Control) complet
- [ ] Ajouter monitoring et alertes (Sentry, DataDog)
- [ ] Créer métriques auth (Prometheus/Grafana)
- [ ] Implémenter webhooks pour événements auth
- [ ] Ajouter support SSO (Single Sign-On)

---

## 📚 Documentation complémentaire

- **API Documentation** : Voir `src/presentation/http/README-AUTH.md`
- **Repository README** : Voir `src/infrastructure/repositories/auth/README.md`
- **Architecture Guide** : Voir `ARCHITECTURE_CLEAN.md`
- **Testing Guide** : Voir `TESTING_GUIDE.md` (à créer)

---

## 🎓 Ressources

### Clean Architecture
- [The Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

### Sécurité
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Auteur** : Équipe ClubManager  
**Dernière mise à jour** : 2024  
**Version** : 1.0.0