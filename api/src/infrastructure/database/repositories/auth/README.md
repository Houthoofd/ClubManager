# Auth Repositories

This directory contains the Prisma/MySQL implementations of the Auth module repositories. These repositories handle persistence operations for authentication, security, and user management.

## 📁 Repository Files

- `AuthRepository.ts` - User authentication and account management
- `RefreshTokenRepository.ts` - JWT refresh token lifecycle management
- `PasswordResetTokenRepository.ts` - Password reset token management
- `SecurityRepository.ts` - Security analytics and audit data
- `index.ts` - Central export point for all repositories

## 📚 Repository Descriptions

### 1. AuthRepository

Implements `IAuthRepository` interface for user authentication and account operations.

**Responsibilities:**
- User lookup by email or ID
- User account creation
- Password updates
- Email existence checks
- Authentication attempt logging for audit

**Key Methods:**
```typescript
findUserByEmail(email: Email): Promise<User | null>
findUserById(id: number): Promise<User | null>
createUser(data: {...}): Promise<User>
updatePassword(userId: number, password: Password): Promise<void>
checkEmailExists(email: Email): Promise<boolean>
recordAuthAttempt(attempt: AuthAttempt): Promise<void>
```

**Database Tables:**
- `utilisateurs` - Main user data
- `auth_attempts` - Authentication audit log

**Domain Mapping:**
- Converts `status_id` (1-4) to `UserRole` enum (MEMBRE, PROFESSEUR, ADMIN, INVITE)
- Derives `UserStatus` from `active` and `email_verified` flags
- Uses both `Email` VOs: `auth/Email` for interfaces, `Email` for User entity

---

### 2. RefreshTokenRepository

Implements `IRefreshTokenRepository` interface for managing JWT refresh tokens.

**Responsibilities:**
- Refresh token creation with metadata (IP, User-Agent)
- Token lookup and validation
- Token revocation (single or all for user)
- Cleanup of expired tokens
- Active token retrieval

**Key Methods:**
```typescript
create(userId: number, token: Token, metadata?: RefreshTokenMetadata): Promise<RefreshToken>
findByToken(token: string): Promise<RefreshToken | null>
revoke(tokenId: number): Promise<void>
revokeAllForUser(userId: number): Promise<number>
findActiveByUser(userId: number): Promise<RefreshToken[]>
deleteExpired(daysRetention?: number): Promise<number>
```

**Database Table:**
- `refresh_tokens` - Refresh token storage with metadata

**Features:**
- Automatic expiration checking
- Revocation tracking (`revoked_at`)
- Token replacement chain tracking (`replaced_by`)
- IP and User-Agent logging for security

---

### 3. PasswordResetTokenRepository

Implements `IPasswordResetTokenRepository` interface for password reset workflows.

**Responsibilities:**
- Password reset token generation
- Token validation and lookup
- Token usage tracking
- Cleanup operations
- Reset attempt auditing

**Key Methods:**
```typescript
create(userId: number, token: Token): Promise<PasswordResetToken>
findByToken(token: string): Promise<PasswordResetToken | null>
markAsUsed(tokenId: number): Promise<void>
deleteAllForUser(userId: number): Promise<void>
deleteExpired(): Promise<number>
recordResetAttempt(email: string, success: boolean): Promise<void>
```

**Database Tables:**
- `password_reset_tokens` - Reset tokens with expiration
- `password_reset_attempts` - Reset attempt audit log

**Security Features:**
- One-time use enforcement (`used_at`)
- Expiration validation
- Attempt rate limiting support
- Automatic cleanup of old tokens

---

### 4. SecurityRepository

Implements `ISecurityRepository` interface for security analytics and auditing.

**Responsibilities:**
- User security profile aggregation
- Authentication statistics
- Rate limiting support (recent attempts counting)
- Security dashboard data

**Key Methods:**
```typescript
getSecurityInfo(userId: number): Promise<SecurityInfo | null>
getAuthStats(): Promise<AuthStats>
getRecentAuthAttempts(email: Email, minutes: number): Promise<number>
getRecentResetAttempts(email: string, minutes: number): Promise<number>
```

**Database Tables (Read-Only):**
- `utilisateurs` - User data
- `paiements` - Payment history
- `inscriptions` - Enrollment history
- `auth_attempts` - Auth attempt logs
- `password_reset_attempts` - Reset attempt logs
- `password_reset_tokens` - Active reset tokens

**Analytics Provided:**
- Total and active user counts
- Daily authentication metrics
- Success/failure rates
- Active reset token count
- User payment/enrollment history

---

## 🔧 Usage Examples

### Basic User Authentication Flow

```typescript
import { PrismaClient } from '@prisma/client';
import { AuthRepository } from './auth/AuthRepository.js';
import { Email } from '../../../core/domain/value-objects/auth/Email.js';
import { Password } from '../../../core/domain/value-objects/auth/Password.js';

const prisma = new PrismaClient();
const authRepo = new AuthRepository(prisma);

// 1. Check if email exists
const email = Email.create('user@example.com');
const exists = await authRepo.checkEmailExists(email);

if (!exists) {
  // 2. Create new user
  const password = await Password.create('SecurePass123!');
  const user = await authRepo.createUser({
    email,
    password,
    nom: 'Doe',
    prenom: 'John',
    dateNaissance: new Date('1990-01-01'),
  });
  console.log('User created:', user.id);
} else {
  // 3. Find existing user
  const user = await authRepo.findUserByEmail(email);
  console.log('User found:', user?.getFullName());
}

// 4. Record login attempt
await authRepo.recordAuthAttempt({
  id: 0,
  email: email.getValue(),
  success: true,
  attemptedAt: new Date(),
});
```

### Refresh Token Management

```typescript
import { RefreshTokenRepository } from './auth/RefreshTokenRepository.js';
import { Token } from '../../../core/domain/value-objects/auth/Token.js';

const refreshTokenRepo = new RefreshTokenRepository(prisma);

// 1. Create refresh token
const token = Token.createJWT(
  { id: user.id!, email: user.email.getValue() },
  'refresh',
  '7d'
);

const refreshToken = await refreshTokenRepo.create(
  user.id!,
  token,
  {
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
  }
);

// 2. Validate token
const storedToken = await refreshTokenRepo.findByToken(token.getValue());
if (storedToken && !storedToken.revokedAt && new Date() < storedToken.expiresAt) {
  console.log('Token is valid');
}

// 3. Revoke all tokens on logout
const revokedCount = await refreshTokenRepo.revokeAllForUser(user.id!);
console.log(`Revoked ${revokedCount} tokens`);

// 4. Cleanup expired tokens (run periodically)
const deletedCount = await refreshTokenRepo.deleteExpired(30); // Keep 30 days
console.log(`Cleaned up ${deletedCount} expired tokens`);
```

### Password Reset Flow

```typescript
import { PasswordResetTokenRepository } from './auth/PasswordResetTokenRepository.js';

const resetRepo = new PasswordResetTokenRepository(prisma);

// 1. Request password reset
const resetToken = Token.createSecure('password-reset', 1); // 1 hour
const passwordResetToken = await resetRepo.create(user.id!, resetToken);

// Send email with token...

// 2. Validate reset token
const storedResetToken = await resetRepo.findByToken(resetToken.getValue());
if (storedResetToken && !storedResetToken.usedAt && new Date() < storedResetToken.expiresAt) {
  // 3. Reset password
  const newPassword = await Password.create('NewSecurePass456!');
  await authRepo.updatePassword(storedResetToken.userId, newPassword);
  
  // 4. Mark token as used
  await resetRepo.markAsUsed(storedResetToken.id);
  
  // 5. Record successful reset
  await resetRepo.recordResetAttempt(user.email.getValue(), true);
  
  // 6. Revoke all refresh tokens for security
  await refreshTokenRepo.revokeAllForUser(user.id!);
}

// Cleanup expired tokens daily
await resetRepo.deleteExpired();
```

### Security Analytics

```typescript
import { SecurityRepository } from './auth/SecurityRepository.js';

const securityRepo = new SecurityRepository(prisma);

// 1. Get user security profile
const securityInfo = await securityRepo.getSecurityInfo(user.id!);
console.log(`User has ${securityInfo?.nbPaiements} payments`);
console.log(`Last payment: ${securityInfo?.dernierPaiement}`);

// 2. Check rate limiting
const recentAttempts = await securityRepo.getRecentAuthAttempts(email, 15);
if (recentAttempts > 5) {
  throw new Error('Too many login attempts. Please try again later.');
}

// 3. Get system-wide stats
const stats = await securityRepo.getAuthStats();
console.log(`Total users: ${stats.totalUsers}`);
console.log(`Active users: ${stats.activeUsers}`);
console.log(`Auth success rate today: ${stats.successRate}%`);
console.log(`Failed auth attempts today: ${stats.failedAuthsToday}`);

// 4. Check password reset attempts
const resetAttempts = await securityRepo.getRecentResetAttempts(
  user.email.getValue(),
  60
);
if (resetAttempts > 3) {
  throw new Error('Too many reset attempts. Please contact support.');
}
```

---

## 🏗️ Architecture Patterns

### Dependency Injection

All repositories use constructor injection for testability:

```typescript
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaClient) {}
  // ...
}
```

**Benefits:**
- Easy to mock in tests
- Single PrismaClient instance shared across repos
- Clear dependencies

### Domain Conversion

Repositories handle conversion between DB and Domain:

```typescript
// DB → Domain (in mapToEntity)
const email = new Email(dbUser.email);        // VO creation
const user = User.fromPersistence({...});     // Entity reconstruction

// Domain → DB (in createUser)
email: email.getValue(),                      // VO to string
password: password.getHash(),                 // VO to hash
```

### Error Handling

```typescript
try {
  // Prisma operation
} catch (error) {
  throw new Error(`Context-specific message: ${error.message}`);
}
```

**Audit operations** (logging) catch errors without rethrowing to avoid blocking main flow:

```typescript
try {
  await this.prisma.auth_attempts.create({...});
} catch (error) {
  console.error('[Repository] Audit failed:', error);
  // Don't throw - audit shouldn't block auth
}
```

---

## 🔒 Security Considerations

### Password Handling
- Passwords are **never** stored in plain text
- Only hashed values via `Password` VO
- Password validation in domain layer

### Token Security
- Refresh tokens stored with IP and User-Agent for forensics
- One-time use for reset tokens
- Automatic expiration checking
- Revocation support for compromised tokens

### Rate Limiting
- `getRecentAuthAttempts()` supports login rate limiting
- `getRecentResetAttempts()` supports reset rate limiting
- Configurable time windows (minutes parameter)

### Audit Trail
- All auth attempts logged (success/failure)
- Reset attempts tracked
- IP and User-Agent captured
- Timestamps for all operations

---

## 🧪 Testing

### Unit Tests Example

```typescript
import { PrismaClient } from '@prisma/client';
import { AuthRepository } from './AuthRepository.js';
import { Email } from '../../../core/domain/value-objects/auth/Email.js';

// Mock Prisma
const prismaMock = {
  utilisateurs: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  auth_attempts: {
    create: jest.fn(),
  },
} as unknown as PrismaClient;

describe('AuthRepository', () => {
  const repo = new AuthRepository(prismaMock);
  
  it('should find user by email', async () => {
    const email = Email.create('test@example.com');
    prismaMock.utilisateurs.findFirst.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      // ... other fields
    });
    
    const user = await repo.findUserByEmail(email);
    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
  });
});
```

---

## 🛠️ Maintenance

### Cleanup Jobs

Run these periodically (cron jobs):

```typescript
// Daily: Clean expired tokens
await refreshTokenRepo.deleteExpired(30);      // Keep 30 days
await resetTokenRepo.deleteExpired();          // Delete immediately

// Weekly: Archive old auth attempts (if needed)
// Implement custom cleanup based on retention policy
```

### Database Indexes

These tables should have indexes (already in schema):

```sql
-- auth_attempts
INDEX idx_auth_email_time (email, attempted_at)
INDEX idx_auth_ip_time (ip_address, attempted_at)

-- refresh_tokens
INDEX idx_refresh_user_id (utilisateur_id)
INDEX idx_refresh_token (token)
INDEX idx_refresh_expires (expires_at)

-- password_reset_tokens
INDEX idx_token (token)
INDEX idx_utilisateur_id (utilisateur_id)
INDEX idx_expires_at (expires_at)

-- password_reset_attempts
INDEX idx_email_time (email, attempted_at)
```

---

## 📦 Dependencies

- **@prisma/client** - Database ORM
- **@clubmanager/types** - Shared type definitions
- **Domain Layer** - Entities and Value Objects

---

## 🔄 Migration Guide

If migrating from legacy repositories:

1. **Update imports** - Change from old repo to new:
   ```typescript
   // Old
   import { AuthService } from '../services/auth.service.js';
   
   // New
   import { AuthRepository } from '../repositories/auth/AuthRepository.js';
   ```

2. **Inject Prisma** - Pass PrismaClient to constructor:
   ```typescript
   import { prisma } from '../database/prisma-client.js';
   const authRepo = new AuthRepository(prisma);
   ```

3. **Update method calls** - Use Value Objects:
   ```typescript
   // Old
   await authService.findByEmail('user@example.com');
   
   // New
   const email = Email.create('user@example.com');
   await authRepo.findUserByEmail(email);
   ```

---

## 📝 Notes

- **Email VO Dual Usage**: The codebase has two `Email` VOs. Auth interfaces use `auth/Email`, but the User entity uses the base `Email`. The repository handles this conversion internally.

- **User ID Generation**: New users get a unique `userId` string (format: `U{timestamp}{random}`). This is auto-generated and separate from the numeric `id`.

- **Status Mapping**: The DB uses `status_id` (1-4) which maps to roles. The User entity's `status` is derived from `active` and `email_verified` flags.

- **Nullable Fields**: Many User fields (telephone, adresse, etc.) are not in the current DB schema and are set to `undefined`. Update the schema if these fields are needed.

---

## 📞 Support

For questions or issues:
1. Check the interface definitions in `core/domain/interfaces/auth/`
2. Review Use Cases that consume these repositories
3. Consult the Domain Entity documentation for `User`

---

**Last Updated:** 2024
**Version:** 1.0.0