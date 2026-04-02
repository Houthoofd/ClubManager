# 🚀 Quick Start Guide - ClubManager Frontend V2

Guide de démarrage rapide pour lancer le nouveau front-end en moins de 5 minutes.

---

## ⚡ Installation Express

```bash
# 1. Naviguer vers le projet
cd front-end-v2

# 2. Installer les dépendances
npm install

# 3. Copier les variables d'environnement
cp .env.example .env.local

# 4. Configurer .env.local
# Ouvrir .env.local et remplir les valeurs
```

---

## 🔧 Configuration Minimale

Éditez `.env.local` avec ces valeurs **minimales** :

```env
# API Backend
VITE_API_BASE_URL=http://localhost:3000

# Stripe (utilisez votre clé de test)
VITE_STRIPE_PUBLIC_KEY=pk_test_votre_cle_ici
```

⚠️ **Important** : Remplacez `pk_test_votre_cle_ici` par votre vraie clé Stripe de test !

---

## 🎯 Lancer l'Application

```bash
npm run dev
```

✅ L'application sera disponible sur : **http://localhost:5173**

---

## 📋 Commandes Essentielles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarre le serveur de développement |
| `npm run build` | Build pour production |
| `npm run lint` | Vérifie le code |
| `npm run type-check` | Vérifie les types TypeScript |

---

## 🧪 Premier Test

1. **Ouvrir** http://localhost:5173
2. **Vous devriez voir** la page de connexion
3. **Tester la navigation** vers `/auth/register`

---

## 📂 Structure Simplifiée

```
src/
├── app/          # Configuration app (providers, router)
├── pages/        # Pages complètes (LoginPage, Dashboard...)
├── features/     # Fonctionnalités métier (auth, courses...)
├── shared/       # Code partagé (API client, UI components...)
└── main.tsx      # Point d'entrée
```

---

## 🔑 Authentification

### Routes disponibles

- `/auth/login` - Connexion
- `/auth/register` - Inscription
- `/auth/forgot-password` - Mot de passe oublié
- `/dashboard` - Tableau de bord (protégé)

### Utiliser l'authentification

```typescript
import { useAuth, useLogin } from '@features/auth';

function MyComponent() {
  const { user, isLoading } = useAuth();
  const loginMutation = useLogin();

  const handleLogin = async () => {
    const result = await loginMutation.mutateAsync({
      email: 'user@example.com',
      password: 'password123',
    });

    if (result.isOk()) {
      console.log('Connecté !', result.value);
    } else {
      console.error('Erreur:', result.error);
    }
  };

  return <div>{user ? `Hello ${user.name}` : 'Non connecté'}</div>;
}
```

---

## 🎨 Créer un Composant

### Composant dans `shared/ui`

```typescript
// src/shared/ui/MyButton/MyButton.tsx
import React from 'react';
import { Button as PFButton } from '@patternfly/react-core';

export interface MyButtonProps {
  label: string;
  onClick: () => void;
}

export const MyButton: React.FC<MyButtonProps> = ({ label, onClick }) => {
  return (
    <PFButton variant="primary" onClick={onClick}>
      {label}
    </PFButton>
  );
};
```

```typescript
// src/shared/ui/MyButton/index.ts
export { MyButton } from './MyButton';
export type { MyButtonProps } from './MyButton';
```

---

## 🌐 Appeler l'API

```typescript
import { apiClient } from '@shared/api/client';

// GET request
const result = await apiClient.get<User>('/users/me');

if (result.isOk()) {
  const user = result.value;
  console.log(user);
} else {
  console.error(result.error.message);
}

// POST request
const result = await apiClient.post<LoginResponse>('/auth/login', {
  email: 'user@example.com',
  password: 'password123',
});
```

---

## 🧩 Ajouter une Nouvelle Feature

### 1. Créer la structure

```bash
src/features/
└── ma-feature/
    ├── api/
    │   └── maFeatureApi.ts
    ├── model/
    │   ├── types.ts
    │   └── useMaFeature.ts
    ├── ui/
    │   └── MaFeatureForm.tsx
    └── index.ts
```

### 2. Définir les types

```typescript
// features/ma-feature/model/types.ts
export interface MaFeature {
  id: string;
  name: string;
}
```

### 3. Créer l'API

```typescript
// features/ma-feature/api/maFeatureApi.ts
import { apiClient } from '@shared/api/client';
import type { MaFeature } from '../model/types';

export const maFeatureApi = {
  getAll: () => apiClient.get<MaFeature[]>('/ma-feature'),
  getById: (id: string) => apiClient.get<MaFeature>(`/ma-feature/${id}`),
  create: (data: Omit<MaFeature, 'id'>) => 
    apiClient.post<MaFeature>('/ma-feature', data),
};
```

### 4. Créer le hook

```typescript
// features/ma-feature/model/useMaFeature.ts
import { useQuery } from '@tanstack/react-query';
import { maFeatureApi } from '../api/maFeatureApi';

export const useMaFeature = (id: string) => {
  return useQuery({
    queryKey: ['ma-feature', id],
    queryFn: async () => {
      const result = await maFeatureApi.getById(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });
};
```

### 5. Créer le composant UI

```typescript
// features/ma-feature/ui/MaFeatureForm.tsx
import React from 'react';
import { Button } from '@shared/ui';

export const MaFeatureForm: React.FC = () => {
  return (
    <form>
      <h2>Ma Feature</h2>
      <Button variant="primary">Soumettre</Button>
    </form>
  );
};
```

### 6. Exporter depuis index.ts

```typescript
// features/ma-feature/index.ts
export { maFeatureApi } from './api/maFeatureApi';
export { useMaFeature } from './model/useMaFeature';
export { MaFeatureForm } from './ui/MaFeatureForm';
export type { MaFeature } from './model/types';
```

---

## 🛣️ Ajouter une Route

```typescript
// src/app/App.tsx
import { MaFeaturePage } from '@pages/ma-feature/MaFeaturePage';

// Dans Routes:
<Route
  path="/ma-feature"
  element={
    <ProtectedRoute>
      <MaFeaturePage />
    </ProtectedRoute>
  }
/>
```

---

## 🎯 Path Aliases

Utilisez les path aliases pour des imports propres :

```typescript
// ❌ Mauvais
import { Button } from '../../../shared/ui/Button';

// ✅ Bon
import { Button } from '@shared/ui';
```

Aliases disponibles :
- `@app/*` → `src/app/*`
- `@pages/*` → `src/pages/*`
- `@features/*` → `src/features/*`
- `@entities/*` → `src/entities/*`
- `@shared/*` → `src/shared/*`

---

## 🔍 Debugging

### React Query DevTools

Activées automatiquement en développement. Ouvrez le panneau en bas à droite.

### Logs de l'API

Les appels API sont automatiquement loggés en développement :

```
🔧 [Vite Config] CONFIGURATION FORCÉE: {...}
✅ GET /users/me - 200 OK
❌ POST /auth/login - 401 Unauthorized
```

### Variables d'environnement

```typescript
import { env, isDevelopment } from '@shared/config';

console.log(env.VITE_API_BASE_URL);
console.log('Mode dev ?', isDevelopment);
```

---

## ⚠️ Erreurs Courantes

### 1. "Cannot find module '@shared/...'"

**Solution** : Redémarrer le serveur Vite après avoir modifié `tsconfig.json`

```bash
# Ctrl+C puis
npm run dev
```

### 2. Variables d'environnement non reconnues

**Solution** : Les variables doivent commencer par `VITE_`

```env
# ❌ Mauvais
API_URL=http://localhost:3000

# ✅ Bon
VITE_API_BASE_URL=http://localhost:3000
```

### 3. "Module has no default export"

**Solution** : Vérifier l'import/export

```typescript
// Si export nommé
export const MyComponent = () => { ... };

// Importer avec
import { MyComponent } from './MyComponent';
```

---

## 📚 Ressources Utiles

- **Documentation FSD** : https://feature-sliced.design/
- **React Query** : https://tanstack.com/query/latest
- **PatternFly** : https://www.patternfly.org/v4/
- **Vite** : https://vitejs.dev/

---

## 🆘 Besoin d'Aide ?

1. **Vérifier les logs** dans la console du navigateur
2. **Vérifier le terminal** où `npm run dev` tourne
3. **Consulter** `README.md` pour plus de détails
4. **Regarder** le code de la feature `auth` comme exemple

---

## ✅ Checklist de Démarrage

- [ ] `npm install` effectué
- [ ] `.env.local` créé et configuré
- [ ] `npm run dev` fonctionne
- [ ] Page de login accessible
- [ ] DevTools React Query visible
- [ ] Pas d'erreurs dans la console

---

**Prêt à coder ! 🚀**