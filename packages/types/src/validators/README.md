# Validators Zod

Ce dossier contient tous les **schémas de validation Zod** utilisés dans l'application ClubManager.

## 📁 Structure

```
validators/
├── common/
│   └── common.validators.ts   # Validators réutilisables (ID, dates, pagination)
├── users/
│   ├── user.validators.ts     # Validators pour les utilisateurs
│   └── auth.validators.ts     # Validators pour l'authentification
├── index.ts                   # Exports centralisés
└── README.md                  # Ce fichier
```

## 🎯 Objectif

Les validators Zod permettent de :
- ✅ **Valider les données** avant de les envoyer à la DB
- ✅ **Typer automatiquement** avec TypeScript
- ✅ **Centraliser les règles** de validation (une seule source de vérité)
- ✅ **Garantir la cohérence** entre frontend et backend

## 📖 Utilisation

### Import

```typescript
import {
  createUserSchema,
  loginSchema,
  paginationSchema,
} from "@clubmanager/types";
```

### Validation simple

```typescript
import { createUserSchema } from "@clubmanager/types";

// Valider des données
const result = createUserSchema.safeParse({
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  password: "SecureP@ss123",
  date_of_birth: "2000-01-15",
  genre_id: 1,
});

if (result.success) {
  console.log("✅ Données valides:", result.data);
} else {
  console.error("❌ Erreurs:", result.error.errors);
}
```

### Validation avec exception

```typescript
import { loginSchema } from "@clubmanager/types";

try {
  const validatedData = loginSchema.parse({
    email: "user@example.com",
    password: "MyPassword123",
  });
  
  // Utiliser les données validées
  await loginUser(validatedData);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Erreurs de validation:", error.errors);
  }
}
```

### Middleware Express

```typescript
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Middleware de validation pour Express
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: result.error.errors,
      });
    }
    
    // Remplacer req.body par les données validées
    req.body = result.data;
    next();
  };
};

// Utilisation dans une route
app.post("/register", validate(registerSchema), async (req, res) => {
  // req.body est maintenant typé et validé
  const user = await createUser(req.body);
  res.json({ success: true, data: user });
});
```

### Types inférés

```typescript
import { z } from "zod";
import { createUserSchema, type CreateUserInput } from "@clubmanager/types";

// Option 1 : Utiliser le type exporté
function createUser(data: CreateUserInput) {
  // data est typé automatiquement
}

// Option 2 : Inférer directement
type CreateUserData = z.infer<typeof createUserSchema>;
```

## 📚 Validators disponibles

### Common Validators

| Schema | Description | Type inféré |
|--------|-------------|-------------|
| `idSchema` | ID numérique positif | `number` |
| `idStringSchema` | ID en string (converti en number) | `number` |
| `userIdSchema` | Format U-YYYY-XXXX | `string` |
| `dateISOSchema` | Date ISO (YYYY-MM-DD) | `string` |
| `ageValidationSchema` | Date de naissance (5-120 ans) | `string` |
| `paginationSchema` | Pagination (page, limit) | `PaginationParams` |
| `searchQuerySchema` | Recherche par texte | `string` |
| `sortOrderSchema` | Ordre de tri (asc/desc) | `'asc' \| 'desc'` |

### User Validators

| Schema | Description |
|--------|-------------|
| `createUserSchema` | Créer un utilisateur |
| `updateUserSchema` | Mettre à jour un utilisateur |
| `softDeleteUserSchema` | Supprimer (soft delete) un utilisateur |
| `restoreUserSchema` | Restaurer un utilisateur supprimé |
| `updatePasswordSchema` | Changer le mot de passe |
| `updateEmailSchema` | Changer l'email |
| `updateProfileSchema` | Mettre à jour le profil |
| `anonymizeUserSchema` | Anonymiser (RGPD) |

### Auth Validators

| Schema | Description |
|--------|-------------|
| `loginSchema` | Connexion par email |
| `loginByUserIdSchema` | Connexion par userId |
| `registerSchema` | Inscription |
| `registerWithConfirmSchema` | Inscription avec confirmation password |
| `validateEmailTokenSchema` | Valider token email |
| `passwordResetRequestSchema` | Demander reset password |
| `passwordResetSchema` | Reset password |
| `passwordResetWithConfirmSchema` | Reset avec confirmation |
| `changePasswordSchema` | Changer password (utilisateur connecté) |
| `refreshTokenSchema` | Refresh JWT token |

## 🔧 Exemples avancés

### Validation partielle

```typescript
import { updateUserSchema } from "@clubmanager/types";

// Mettre à jour uniquement certains champs
const partialUpdate = updateUserSchema.parse({
  id: 42,
  first_name: "Jane", // Seulement le prénom
});
```

### Validation de query params

```typescript
import { paginationQuerySchema } from "@clubmanager/types";

// Dans une route Express
app.get("/users", (req, res) => {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  
  // page et limit sont maintenant des numbers validés
  const users = await getUsersPaginated(page, limit);
  res.json({ success: true, data: users });
});
```

### Validation personnalisée

```typescript
import { z } from "zod";
import { createUserSchema } from "@clubmanager/types";

// Étendre un schéma existant
const createUserWithReferralSchema = createUserSchema.extend({
  referral_code: z.string().length(8, "Le code doit faire 8 caractères"),
});

// Ajouter une validation custom
const createUserWithPasswordConfirmSchema = createUserSchema.extend({
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  }
);
```

### Transform et preprocessing

```typescript
import { z } from "zod";

// Nettoyer l'email avant validation
const loginWithCleanEmailSchema = z.object({
  email: z.string()
    .toLowerCase()
    .trim()
    .email("Email invalide"),
  password: z.string().min(8),
});
```

## 🚀 Bonnes pratiques

### ✅ À FAIRE

- ✅ Toujours valider les données entrantes (body, query, params)
- ✅ Utiliser `safeParse()` pour gérer les erreurs gracieusement
- ✅ Réutiliser les validators communs
- ✅ Exporter les types inférés
- ✅ Valider côté frontend ET backend

### ❌ À ÉVITER

- ❌ Ne pas valider les données sensibles
- ❌ Dupliquer les règles de validation
- ❌ Oublier de valider les query params
- ❌ Utiliser `any` au lieu des types inférés
- ❌ Faire confiance aux données frontend sans validation backend

## 🔗 Ressources

- [Documentation Zod](https://zod.dev)
- [Zod Error Handling](https://zod.dev/ERROR_HANDLING)
- [TypeScript Integration](https://zod.dev/?id=type-inference)

## 📝 Notes

- Les validators sont basés sur les **contraintes DB réelles** (v4.1/v4.2)
- Les constants de validation sont dans `constants/validation.constants.ts`
- Tous les validators respectent les CHECK constraints de la DB
- Les messages d'erreur sont en français pour l'expérience utilisateur

---

**Prochaine étape** : Intégrer ces validators dans les routes Express du backend ! 🚀