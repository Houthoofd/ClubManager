# Auth API Documentation

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Authentification](#authentification)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Account Management](#account-management-endpoints)
- [Codes d'erreur](#codes-derreur)
- [Exemples pratiques](#exemples-pratiques)
- [Gestion des cookies](#gestion-des-cookies)
- [Rate Limiting](#rate-limiting)

---

## Vue d'ensemble

L'API Auth de ClubManager fournit des endpoints pour gérer l'authentification et la gestion des comptes utilisateurs.

**Base URL** : `/api`  
**Version** : 1.0  
**Format** : JSON  
**Encodage** : UTF-8

### Fonctionnalités principales

- ✅ Inscription et connexion utilisateur
- ✅ Gestion des sessions avec JWT
- ✅ Refresh tokens pour sessions longues
- ✅ Réinitialisation de mot de passe
- ✅ Changement de mot de passe (utilisateur authentifié)
- ✅ Rate limiting pour prévenir les abus
- ✅ Audit logging de toutes les tentatives

---

## Authentification

### Types de tokens

#### Access Token (JWT)
- **Durée** : 24 heures
- **Usage** : Authentification des requêtes API
- **Format** : JWT signé avec HS256
- **Header** : `Authorization: Bearer <token>`

#### Refresh Token
- **Durée** : 30 jours
- **Usage** : Renouvellement de l'access token
- **Format** : Token aléatoire sécurisé (hex)
- **Stockage** : Base de données avec métadonnées

### Comment authentifier une requête

```http
GET /api/protected-resource
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Endpoints

### Authentication Endpoints

#### 1. Login (Connexion)

Authentifie un utilisateur et retourne des tokens d'accès.

**Endpoint** : `POST /api/auth/login`  
**Authentification** : ❌ Non requise  
**Rate Limit** : 5 tentatives / 15 minutes par email

##### Requête

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "MySecureP@ssw0rd123"
}
```

##### Paramètres

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `email` | string | ✅ | Email de l'utilisateur |
| `password` | string | ✅ | Mot de passe (min 8 caractères) |

##### Réponse succès (200 OK)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MDk1NjQzMjEsImV4cCI6MTcwOTY1MDcyMX0.xyz123",
    "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "statusId": 1
    }
  }
}
```

##### Réponse erreur (401 Unauthorized)

```json
{
  "success": false,
  "error": "Email ou mot de passe incorrect",
  "code": "INVALID_CREDENTIALS"
}
```

##### Codes d'erreur possibles

| Code HTTP | Code erreur | Description |
|-----------|-------------|-------------|
| 400 | `MISSING_FIELD` | Email ou mot de passe manquant |
| 401 | `INVALID_CREDENTIALS` | Identifiants incorrects |
| 403 | `USER_INACTIVE` | Compte inactif |
| 429 | `TOO_MANY_ATTEMPTS` | Trop de tentatives |

---

#### 2. Logout (Déconnexion)

Révoque le refresh token et invalide la session.

**Endpoint** : `POST /api/auth/logout`  
**Authentification** : ✅ Requise  

##### Requête

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

##### Paramètres

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `refreshToken` | string | ⚠️ | Token à révoquer (optionnel, sinon tous les tokens sont révoqués) |

##### Réponse succès (200 OK)

```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

---

#### 3. Refresh Tokens (Renouvellement)

Renouvelle l'access token en utilisant un refresh token valide.

**Endpoint** : `POST /api/auth/refresh`  
**Authentification** : ❌ Non requise  

##### Requête

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

##### Paramètres

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `refreshToken` | string | ✅ | Refresh token valide |

##### Réponse succès (200 OK)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7",
    "expiresIn": 86400
  }
}
```

##### Codes d'erreur possibles

| Code HTTP | Code erreur | Description |
|-----------|-------------|-------------|
| 400 | `MISSING_TOKEN` | Refresh token manquant |
| 401 | `INVALID_TOKEN` | Token invalide |
| 401 | `EXPIRED_TOKEN` | Token expiré |
| 401 | `REFRESH_TOKEN_REVOKED` | Token révoqué |

---

### Account Management Endpoints

#### 4. Register (Inscription)

Crée un nouveau compte utilisateur.

**Endpoint** : `POST /api/account/register`  
**Authentification** : ❌ Non requise  

##### Requête

```http
POST /api/account/register
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "password": "SecureP@ssw0rd456"
}
```

##### Paramètres

| Champ | Type | Requis | Validation |
|-------|------|--------|------------|
| `firstName` | string | ✅ | Min 2 caractères |
| `lastName` | string | ✅ | Min 2 caractères |
| `email` | string | ✅ | Format email valide |
| `password` | string | ✅ | Min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial |

##### Réponse succès (201 Created)

```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8",
    "user": {
      "id": 2,
      "email": "jane.smith@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "statusId": 1
    }
  }
}
```

##### Codes d'erreur possibles

| Code HTTP | Code erreur | Description |
|-----------|-------------|-------------|
| 400 | `MISSING_FIELD` | Champ requis manquant |
| 400 | `INVALID_EMAIL` | Format email invalide |
| 400 | `PASSWORD_TOO_SHORT` | Mot de passe trop court |
| 400 | `PASSWORD_MISSING_UPPERCASE` | Pas de majuscule |
| 400 | `PASSWORD_MISSING_LOWERCASE` | Pas de minuscule |
| 400 | `PASSWORD_MISSING_NUMBER` | Pas de chiffre |
| 400 | `PASSWORD_MISSING_SPECIAL_CHAR` | Pas de caractère spécial |
| 409 | `EMAIL_ALREADY_EXISTS` | Email déjà utilisé |

---

#### 5. Change Password (Changement de mot de passe)

Change le mot de passe d'un utilisateur authentifié.

**Endpoint** : `POST /api/account/change-password`  
**Authentification** : ✅ Requise  

##### Requête

```http
POST /api/account/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "OldP@ssw0rd123",
  "newPassword": "NewP@ssw0rd456"
}
```

##### Paramètres

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `currentPassword` | string | ✅ | Mot de passe actuel |
| `newPassword` | string | ✅ | Nouveau mot de passe |

##### Réponse succès (200 OK)

```json
{
  "success": true,
  "message": "Mot de passe modifié avec succès"
}
```

**Note** : Tous les refresh tokens sont révoqués après le changement de mot de passe (sécurité).

##### Codes d'erreur possibles

| Code HTTP | Code erreur | Description |
|-----------|-------------|-------------|
| 400 | `INVALID_PASSWORD` | Validation mot de passe échouée |
| 401 | `INCORRECT_PASSWORD` | Mot de passe actuel incorrect |
| 400 | `SAME_PASSWORD` | Nouveau mot de passe identique à l'ancien |

---

#### 6. Request Password Reset (Demande de réinitialisation)

Demande un lien de réinitialisation de mot de passe par email.

**Endpoint** : `POST /api/account/forgot-password`  
**Authentification** : ❌ Non requise  
**Rate Limit** : 3 tentatives / 15 minutes par email

##### Requête

```http
POST /api/account/forgot-password
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

##### Paramètres

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `email` | string | ✅ | Email du compte |

##### Réponse succès (200 OK)

```json
{
  "success": true,
  "message": "Si cet email existe, un lien de récupération a été envoyé"
}
```

**Note de sécurité** : Le message est volontairement générique pour éviter l'énumération d'emails.

##### Codes d'erreur possibles

| Code HTTP | Code erreur | Description |
|-----------|-------------|-------------|
| 429 | `TOO_MANY_ATTEMPTS` | Trop de tentatives |

---

#### 7. Reset Password (Réinitialisation)

Réinitialise le mot de passe avec un token de reset.

**Endpoint** : `POST /api/account/reset-password`  
**Authentification** : ❌ Non requise  

##### Requête

```http
POST /api/account/reset-password
Content-Type: application/json

{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "newPassword": "BrandNewP@ss789"
}
```

##### Paramètres

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `token` | string | ✅ | Token de réinitialisation |
| `newPassword` | string | ✅ | Nouveau mot de passe |

##### Réponse succès (200 OK)

```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

**Note** : Tous les refresh tokens sont révoqués après la réinitialisation.

##### Codes d'erreur possibles

| Code HTTP | Code erreur | Description |
|-----------|-------------|-------------|
| 401 | `INVALID_TOKEN` | Token invalide |
| 401 | `EXPIRED_TOKEN` | Token expiré (1h de validité) |
| 400 | `INVALID_PASSWORD` | Validation mot de passe échouée |

---

## Codes d'erreur

### Format de réponse d'erreur

```json
{
  "success": false,
  "error": "Message d'erreur lisible",
  "code": "ERROR_CODE"
}
```

### Liste complète des codes d'erreur

#### Authentification (4xx)

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email ou mot de passe incorrect |
| `INVALID_TOKEN` | 401 | Token JWT invalide |
| `EXPIRED_TOKEN` | 401 | Token expiré |
| `MISSING_TOKEN` | 401 | Token d'authentification manquant |
| `REFRESH_TOKEN_REVOKED` | 401 | Refresh token révoqué |
| `UNAUTHORIZED` | 401 | Non autorisé |
| `FORBIDDEN` | 403 | Accès interdit |
| `USER_INACTIVE` | 403 | Compte utilisateur inactif |
| `USER_DELETED` | 403 | Compte utilisateur supprimé |
| `ACCOUNT_LOCKED` | 403 | Compte verrouillé |

#### Validation (4xx)

| Code | HTTP | Description |
|------|------|-------------|
| `MISSING_FIELD` | 400 | Champ requis manquant |
| `INVALID_FIELD` | 400 | Champ invalide |
| `INVALID_EMAIL` | 400 | Format email invalide |
| `INVALID_PASSWORD` | 400 | Mot de passe invalide |
| `PASSWORD_TOO_SHORT` | 400 | Mot de passe trop court |
| `PASSWORD_MISSING_UPPERCASE` | 400 | Pas de majuscule dans le mot de passe |
| `PASSWORD_MISSING_LOWERCASE` | 400 | Pas de minuscule dans le mot de passe |
| `PASSWORD_MISSING_NUMBER` | 400 | Pas de chiffre dans le mot de passe |
| `PASSWORD_MISSING_SPECIAL_CHAR` | 400 | Pas de caractère spécial |
| `PASSWORD_MISMATCH` | 400 | Mots de passe ne correspondent pas |
| `SAME_PASSWORD` | 400 | Nouveau mot de passe identique |
| `INCORRECT_PASSWORD` | 401 | Mot de passe actuel incorrect |

#### Conflits (4xx)

| Code | HTTP | Description |
|------|------|-------------|
| `EMAIL_ALREADY_EXISTS` | 409 | Email déjà utilisé |

#### Rate Limiting (4xx)

| Code | HTTP | Description |
|------|------|-------------|
| `TOO_MANY_ATTEMPTS` | 429 | Trop de tentatives |
| `RATE_LIMIT_EXCEEDED` | 429 | Limite de taux dépassée |

#### Serveur (5xx)

| Code | HTTP | Description |
|------|------|-------------|
| `INTERNAL_ERROR` | 500 | Erreur interne du serveur |
| `DATABASE_ERROR` | 500 | Erreur base de données |

---

## Exemples pratiques

### Exemple 1 : Flux complet d'authentification

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'MyP@ssw0rd123'
  })
});

const { data } = await loginResponse.json();
const { accessToken, refreshToken } = data;

// 2. Utiliser l'access token
const profileResponse = await fetch('http://localhost:3000/api/profile', {
  headers: { 
    'Authorization': `Bearer ${accessToken}` 
  }
});

// 3. Renouveler le token (quand il expire)
const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});

const { data: newTokens } = await refreshResponse.json();

// 4. Logout
await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ refreshToken })
});
```

### Exemple 2 : Inscription et auto-login

```javascript
const registerResponse = await fetch('http://localhost:3000/api/account/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    password: 'SecureP@ss123'
  })
});

if (registerResponse.ok) {
  const { data } = await registerResponse.json();
  // Utilisateur automatiquement connecté avec tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
}
```

### Exemple 3 : Réinitialisation mot de passe

```javascript
// Étape 1 : Demander le reset
await fetch('http://localhost:3000/api/account/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com'
  })
});

// L'utilisateur reçoit un email avec un lien contenant le token

// Étape 2 : Réinitialiser avec le token
const resetResponse = await fetch('http://localhost:3000/api/account/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'a1b2c3d4...', // Token depuis l'email
    newPassword: 'NewSecureP@ss789'
  })
});
```

---

## Gestion des cookies

En production (`NODE_ENV=production`), les tokens sont également stockés dans des cookies HttpOnly pour plus de sécurité.

### Configuration des cookies

```javascript
// Cookies définis automatiquement par le serveur
Set-Cookie: accessToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Domain=clubmanager.com
Set-Cookie: refreshToken=a1b2c3...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Domain=clubmanager.com
```

### Attributs de sécurité

| Attribut | Valeur | Description |
|----------|--------|-------------|
| `HttpOnly` | true | Empêche l'accès JavaScript (XSS protection) |
| `Secure` | true | HTTPS uniquement (production) |
| `SameSite` | Strict | Protection CSRF |
| `Max-Age` | 86400 / 2592000 | Durée de vie (24h / 30j) |
| `Domain` | clubmanager.com | Domaine autorisé |

---

## Rate Limiting

### Limites par endpoint

| Endpoint | Limite | Fenêtre | Identifiant |
|----------|--------|---------|-------------|
| `POST /auth/login` | 5 tentatives | 15 minutes | Email |
| `POST /account/forgot-password` | 3 tentatives | 15 minutes | Email |
| Autres endpoints | 100 requêtes | 15 minutes | IP |

### Réponse quand limite dépassée

```json
{
  "success": false,
  "error": "Trop de tentatives. Réessayez dans 15 minutes",
  "code": "TOO_MANY_ATTEMPTS"
}
```

### Headers de réponse

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 2
X-RateLimit-Reset: 1709565000
```

---

## Versioning

L'API utilise le versioning dans l'URL :

- **v1** (actuelle) : `/api/auth/...`
- Future v2 : `/api/v2/auth/...`

Les changements breaking nécessiteront une nouvelle version.

---

## Support et Contact

- **Documentation** : `docs/AUTH_MODULE_REFACTORING.md`
- **Issues** : GitHub Issues
- **Email** : support@clubmanager.com

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024  
**Auteur** : Équipe ClubManager