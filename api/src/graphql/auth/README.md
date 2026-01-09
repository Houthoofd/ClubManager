# GraphQL Auth API - Guide Complet

Guide d'utilisation de l'API GraphQL pour l'authentification et la gestion des comptes dans ClubManager.

## 📚 Table des Matières

- [Introduction](#introduction)
- [Avantages GraphQL](#avantages-graphql)
- [Configuration](#configuration)
- [Types GraphQL](#types-graphql)
- [Queries](#queries)
- [Mutations](#mutations)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Gestion des erreurs](#gestion-des-erreurs)
- [Sécurité](#sécurité)
- [REST vs GraphQL](#rest-vs-graphql)

## 🚀 Introduction

L'API GraphQL Auth offre une interface moderne et flexible pour :
- ✅ Authentification utilisateur
- ✅ Création de comptes
- ✅ Gestion des mots de passe
- ✅ Récupération de mot de passe
- ✅ Validation en temps réel
- ✅ Statistiques de sécurité

**Endpoint GraphQL** : `http://localhost:5000/graphql`

## 💡 Avantages GraphQL

### 1. **Requêtes Flexibles**
Demandez exactement les champs dont vous avez besoin :

```graphql
# Récupérer uniquement l'email
query {
  me {
    email
  }
}

# Récupérer toutes les infos
query {
  me {
    id
    firstName
    lastName
    email
    statusId
  }
}
```

### 2. **Pas d'Over-fetching**
Contrairement au REST, vous ne recevez que ce que vous demandez.

### 3. **Une Seule Requête pour Plusieurs Ressources**
```graphql
query {
  me {
    id
    email
  }
  securityInfo(userId: 1) {
    nbPaiements
    nbInscriptions
  }
}
```

### 4. **Documentation Auto-générée**
GraphQL génère automatiquement la documentation de votre API.

### 5. **Type Safety**
Les types sont vérifiés à la compilation et à l'exécution.

## ⚙️ Configuration

### Installation du Client GraphQL

**Option 1 : Apollo Client (React)**
```bash
npm install @apollo/client graphql
```

**Option 2 : urql (léger)**
```bash
npm install urql graphql
```

**Option 3 : fetch natif**
Pas d'installation nécessaire, utilisez `fetch()`.

### Configuration Apollo Client

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:5000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

export default client;
```

## 📊 Types GraphQL

### AuthPayload
Résultat d'une authentification réussie.

```graphql
type AuthPayload {
  token: String!          # Token JWT
  user: AuthUser!         # Utilisateur authentifié
  expiresAt: DateTime!    # Date d'expiration
  tokenType: String!      # Type de token ("Bearer")
}
```

### AuthUser
Informations utilisateur.

```graphql
type AuthUser {
  id: Int!
  firstName: String!
  lastName: String!
  fullName: String!
  email: String!
  statusId: Int!
  gradeId: Int
  dateInscription: DateTime
}
```

### SecurityInfo
Informations de sécurité détaillées.

```graphql
type SecurityInfo {
  id: Int!
  email: String!
  lastName: String!
  firstName: String!
  dateOfBirth: DateTime
  dateInscription: DateTime
  nbPaiements: Int!
  nbInscriptions: Int!
  dernierPaiement: DateTime
}
```

### PasswordValidation
Résultat de validation de mot de passe.

```graphql
type PasswordValidation {
  valid: Boolean!         # Mot de passe valide ?
  errors: [String!]!      # Liste des erreurs
  strength: Int           # Force (0-100)
}
```

### SecurityStats
Statistiques de sécurité.

```graphql
type SecurityStats {
  recentLoginAttempts: Int!
  recentRecoveryAttempts: Int!
  isBlocked: Boolean!
  blockedUntilMinutes: Int
}
```

## 🔍 Queries

### me
Récupère l'utilisateur actuellement authentifié.

**Authentification** : Requise

```graphql
query GetCurrentUser {
  me {
    id
    firstName
    lastName
    fullName
    email
    statusId
  }
}
```

**Réponse** :
```json
{
  "data": {
    "me": {
      "id": 123,
      "firstName": "Jean",
      "lastName": "Dupont",
      "fullName": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "statusId": 1
    }
  }
}
```

### emailExists
Vérifie si un email existe déjà.

```graphql
query CheckEmail($email: String!) {
  emailExists(email: $email)
}
```

**Variables** :
```json
{
  "email": "test@example.com"
}
```

**Réponse** :
```json
{
  "data": {
    "emailExists": true
  }
}
```

### validatePassword
Valide un mot de passe selon les règles de sécurité.

```graphql
query ValidatePassword($password: String!) {
  validatePassword(password: $password) {
    valid
    errors
    strength
  }
}
```

**Variables** :
```json
{
  "password": "MyPassword123!"
}
```

**Réponse** :
```json
{
  "data": {
    "validatePassword": {
      "valid": true,
      "errors": [],
      "strength": 85
    }
  }
}
```

### securityInfo
Récupère les informations de sécurité d'un utilisateur.

**Authentification** : Requise

```graphql
query GetSecurityInfo($userId: Int!) {
  securityInfo(userId: $userId) {
    id
    email
    firstName
    lastName
    nbPaiements
    nbInscriptions
    dernierPaiement
  }
}
```

### securityStats
Récupère les statistiques de sécurité pour un email.

```graphql
query GetSecurityStats($email: String!) {
  securityStats(email: $email) {
    recentLoginAttempts
    recentRecoveryAttempts
    isBlocked
    blockedUntilMinutes
  }
}
```

**Utilisation** : Vérifier les blocages avant tentative de connexion.

### verifyResetToken
Vérifie la validité d'un token de récupération.

```graphql
query VerifyToken($token: String!) {
  verifyResetToken(token: $token)
}
```

## ✏️ Mutations

### login
Authentifie un utilisateur.

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user {
      id
      firstName
      lastName
      email
    }
    expiresAt
    tokenType
  }
}
```

**Variables** :
```json
{
  "input": {
    "email": "jean.dupont@example.com",
    "password": "MyPassword123!",
    "rememberMe": false
  }
}
```

**Réponse** :
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 123,
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean.dupont@example.com"
      },
      "expiresAt": "2024-02-01T10:00:00Z",
      "tokenType": "Bearer"
    }
  }
}
```

### logout
Déconnecte l'utilisateur actuel.

**Authentification** : Requise

```graphql
mutation Logout {
  logout {
    success
    message
  }
}
```

### createAccount
Crée un nouveau compte utilisateur.

```graphql
mutation CreateAccount($input: CreateAccountInput!) {
  createAccount(input: $input) {
    success
    message
    userId
  }
}
```

**Variables** :
```json
{
  "input": {
    "firstName": "Marie",
    "lastName": "Martin",
    "email": "marie.martin@example.com",
    "password": "SecurePass123!",
    "passwordConfirm": "SecurePass123!",
    "dateOfBirth": "1990-05-15",
    "genderId": 2
  }
}
```

### changePassword
Modifie le mot de passe de l'utilisateur authentifié.

**Authentification** : Requise

```graphql
mutation ChangePassword($input: ChangePasswordInput!) {
  changePassword(input: $input) {
    success
    message
  }
}
```

**Variables** :
```json
{
  "input": {
    "oldPassword": "OldPass123!",
    "newPassword": "NewPass456!",
    "newPasswordConfirm": "NewPass456!"
  }
}
```

### requestPasswordReset
Demande la récupération de mot de passe.

```graphql
mutation RequestReset($input: RequestPasswordResetInput!) {
  requestPasswordReset(input: $input) {
    success
    message
  }
}
```

**Variables** :
```json
{
  "input": {
    "email": "jean.dupont@example.com"
  }
}
```

### resetPassword
Réinitialise le mot de passe avec un token.

```graphql
mutation ResetPassword($input: ResetPasswordInput!) {
  resetPassword(input: $input) {
    success
    message
  }
}
```

**Variables** :
```json
{
  "input": {
    "token": "abc123def456...",
    "newPassword": "NewSecurePass123!",
    "newPasswordConfirm": "NewSecurePass123!"
  }
}
```

### refreshToken
Rafraîchit le token JWT actuel.

**Authentification** : Requise

```graphql
mutation RefreshToken {
  refreshToken {
    token
    user {
      id
      email
    }
    expiresAt
    tokenType
  }
}
```

### cleanupSecurityData
Nettoie les données de sécurité obsolètes.

**Authentification** : Requise (Admin)

```graphql
mutation Cleanup($days: Int) {
  cleanupSecurityData(daysToKeep: $days) {
    success
    message
  }
}
```

## 💻 Exemples d'Utilisation

### React + Apollo Client

#### Connexion

```typescript
import { gql, useMutation } from '@apollo/client';

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        firstName
        lastName
        email
      }
      expiresAt
    }
  }
`;

function LoginForm() {
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { data } = await login({
        variables: {
          input: {
            email: 'user@example.com',
            password: 'password123',
            rememberMe: false
          }
        }
      });

      // Sauvegarder le token
      localStorage.setItem('token', data.login.token);
      
      // Rediriger
      navigate('/dashboard');
    } catch (err) {
      console.error('Erreur de connexion:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      {loading && <p>Connexion en cours...</p>}
      {error && <p>Erreur : {error.message}</p>}
    </form>
  );
}
```

#### Récupérer l'utilisateur courant

```typescript
import { gql, useQuery } from '@apollo/client';

const ME_QUERY = gql`
  query GetMe {
    me {
      id
      firstName
      lastName
      email
      statusId
    }
  }
`;

function UserProfile() {
  const { loading, error, data } = useQuery(ME_QUERY);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error.message}</p>;

  return (
    <div>
      <h1>Bonjour {data.me.firstName} !</h1>
      <p>Email : {data.me.email}</p>
    </div>
  );
}
```

#### Validation de mot de passe en temps réel

```typescript
import { gql, useLazyQuery } from '@apollo/client';
import { useState, useEffect } from 'react';

const VALIDATE_PASSWORD = gql`
  query ValidatePassword($password: String!) {
    validatePassword(password: $password) {
      valid
      errors
      strength
    }
  }
`;

function PasswordInput() {
  const [password, setPassword] = useState('');
  const [validatePassword, { data }] = useLazyQuery(VALIDATE_PASSWORD);

  useEffect(() => {
    if (password.length > 0) {
      const timer = setTimeout(() => {
        validatePassword({ variables: { password } });
      }, 500); // Debounce

      return () => clearTimeout(timer);
    }
  }, [password]);

  const validation = data?.validatePassword;

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      {validation && (
        <div>
          <PasswordStrengthBar strength={validation.strength} />
          {validation.errors.map(error => (
            <p key={error} className="error">{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### JavaScript Vanilla (fetch)

```javascript
async function login(email, password) {
  const query = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        token
        user {
          id
          firstName
          email
        }
      }
    }
  `;

  const response = await fetch('http://localhost:5000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        input: { email, password, rememberMe: false }
      }
    })
  });

  const { data, errors } = await response.json();

  if (errors) {
    throw new Error(errors[0].message);
  }

  // Sauvegarder le token
  localStorage.setItem('token', data.login.token);

  return data.login;
}
```

## ⚠️ Gestion des Erreurs

GraphQL utilise des codes d'erreur standardisés :

### Codes d'Erreur

| Code | Description | Action |
|------|-------------|--------|
| `UNAUTHENTICATED` | Non authentifié | Rediriger vers login |
| `FORBIDDEN` | Permissions insuffisantes | Afficher message d'erreur |
| `NOT_FOUND` | Ressource non trouvée | Vérifier les données |
| `AUTHENTICATION_FAILED` | Identifiants incorrects | Réessayer |
| `TOO_MANY_ATTEMPTS` | Trop de tentatives | Attendre 15 minutes |
| `PASSWORDS_MISMATCH` | Mots de passe différents | Corriger la saisie |
| `INVALID_PASSWORD` | Mot de passe invalide | Voir les erreurs détaillées |
| `INVALID_TOKEN` | Token invalide/expiré | Redemander un token |
| `INTERNAL_SERVER_ERROR` | Erreur serveur | Contacter support |

### Exemple de Gestion d'Erreur

```typescript
try {
  const { data } = await login({ variables: { input } });
  // Succès
} catch (error) {
  if (error.graphQLErrors) {
    error.graphQLErrors.forEach(({ message, extensions }) => {
      switch (extensions.code) {
        case 'AUTHENTICATION_FAILED':
          setError('Email ou mot de passe incorrect');
          break;
        case 'TOO_MANY_ATTEMPTS':
          setError('Trop de tentatives. Réessayez dans 15 minutes.');
          break;
        case 'INVALID_PASSWORD':
          setErrors(extensions.errors);
          break;
        default:
          setError(message);
      }
    });
  }
}
```

## 🔒 Sécurité

### 1. **Protection CSRF**
GraphQL nécessite des requêtes POST avec `Content-Type: application/json`, ce qui protège contre les CSRF.

### 2. **Rate Limiting**
- Maximum 5 tentatives de connexion en 15 minutes
- Maximum 3 tentatives de récupération en 15 minutes

### 3. **Validation Stricte**
Tous les inputs sont validés :
- Format email
- Force du mot de passe
- Correspondance des mots de passe

### 4. **Tokens Sécurisés**
- Tokens JWT avec expiration
- Tokens de récupération cryptographiquement sécurisés
- Expiration automatique après 1 heure

### 5. **Protection des Données**
- Mots de passe hashés avec bcrypt (12 rounds)
- Emails normalisés (lowercase, trim)
- Pas d'exposition d'informations sensibles dans les erreurs

## 📊 REST vs GraphQL

### Comparaison Connexion

**REST** :
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "pass123"
}

Response: { token, user { id, firstName, lastName, email, statusId, gradeId, ... } }
```
❌ Over-fetching : vous recevez tous les champs même si vous n'en avez besoin que de 2.

**GraphQL** :
```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user {
      id
      firstName
    }
  }
}
```
✅ Vous recevez uniquement ce que vous demandez.

### Comparaison Données Utilisateur

**REST** :
```http
GET /api/users/me
GET /api/users/123/security-info
GET /api/users/123/stats
```
❌ 3 requêtes HTTP nécessaires.

**GraphQL** :
```graphql
query {
  me { id firstName email }
  securityInfo(userId: 123) { nbPaiements }
  securityStats(email: "user@example.com") { isBlocked }
}
```
✅ 1 seule requête HTTP pour tout.

### Tableau Comparatif

| Critère | REST | GraphQL |
|---------|------|---------|
| **Requêtes** | Multiples endpoints | Un seul endpoint |
| **Over-fetching** | ❌ Oui | ✅ Non |
| **Under-fetching** | ❌ Oui | ✅ Non |
| **Documentation** | Manuelle | ✅ Auto-générée |
| **Versionning** | /v1, /v2... | ✅ Évolutif sans version |
| **Type Safety** | ❌ Non (sauf TypeScript) | ✅ Oui (natif) |
| **Flexibilité** | ❌ Rigide | ✅ Très flexible |
| **Courbe d'apprentissage** | ✅ Facile | ⚠️ Moyenne |
| **Caching** | ✅ HTTP natif | ⚠️ Nécessite bibliothèque |

## 🎓 Bonnes Pratiques

### 1. **Nommer les Queries et Mutations**
```graphql
# ✅ BON
query GetCurrentUser {
  me { id email }
}

# ❌ MAUVAIS
query {
  me { id email }
}
```

### 2. **Utiliser des Variables**
```graphql
# ✅ BON
mutation Login($input: LoginInput!) {
  login(input: $input) { token }
}

# ❌ MAUVAIS
mutation {
  login(input: { email: "hard@coded.com", password: "hardcoded" }) {
    token
  }
}
```

### 3. **Gérer les Erreurs Proprement**
```typescript
// ✅ BON
catch (error) {
  if (error.graphQLErrors) {
    error.graphQLErrors.forEach(handleGraphQLError);
  }
  if (error.networkError) {
    handleNetworkError(error.networkError);
  }
}
```

### 4. **Optimiser les Requêtes**
```graphql
# ✅ BON - Demander uniquement ce qui est nécessaire
query {
  me {
    id
    email
  }
}

# ❌ MAUVAIS - Demander trop de choses
query {
  me {
    id
    firstName
    lastName
    email
    statusId
    gradeId
    dateInscription
    dateOfBirth
    # ... 20 autres champs inutilisés
  }
}
```

### 5. **Utiliser le Cache**
```typescript
// Apollo Client cache automatiquement par ID
const { data } = useQuery(ME_QUERY, {
  fetchPolicy: 'cache-first' // Utiliser le cache si disponible
});
```

## 🚀 Aller Plus Loin

### Playground GraphQL
Accédez à `http://localhost:5000/graphql` pour tester l'API interactivement.

### Introspection
```graphql
query {
  __schema {
    types {
      name
      description
    }
  }
}
```

### Subscriptions (Future)
```graphql
subscription OnUserLogin {
  userLoggedIn {
    id
    email
    timestamp
  }
}
```

## 📚 Ressources

- [GraphQL Official](https://graphql.org/)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [How to GraphQL](https://www.howtographql.com/)

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024  
**Auteurs** : ClubManager Team