# 🚀 BACKEND INTEGRATION - DB v4.1 PLAN D'ACTION

**Branche** : `feature/backend-db-integration-v4.1`  
**Date** : 2025-01-25  
**Objectif** : Intégrer les changements DB v4.1/v4.2 dans le backend

---

## 📋 PRIORITÉS (Dans l'ordre)

### ✅ 1. SOFT DELETE USER (RGPD) - PRIORITÉ HAUTE
**Fichiers à modifier** :
- `api/src/db/clients/utilisateurs/utilisateurs.ts`
- `api/src/routes/utilisateurs.ts`
- `api/src/__tests__/routes/utilisateurs.test.ts`

**Tâches** :
- [ ] Créer méthode `softDeleteUser(userId, deletedBy, reason)` → `CALL safe_delete_user()`
- [ ] Créer méthode `restoreUser(userId, restoredBy)` → `CALL restore_deleted_user()`
- [ ] Modifier route `DELETE /utilisateurs/:id` pour utiliser `softDeleteUser()`
- [ ] Ajouter route `POST /utilisateurs/:id/restore` (admin only)
- [ ] Mettre à jour les tests

**Temps estimé** : 3-4 heures

---

### ✅ 2. UTILISER VUE utilisateurs_actifs - PRIORITÉ HAUTE
**Fichiers à modifier** :
- `api/src/db/clients/utilisateurs/utilisateurs.ts`

**Tâches** :
- [ ] Modifier `obtenirTousLesUtilisateurs()` → `SELECT * FROM utilisateurs_actifs`
- [ ] Modifier `obtenirUnUtilisateur()` → `SELECT * FROM utilisateurs_actifs`
- [ ] Modifier `rechercherUtilisateursParEmail()` → `SELECT * FROM utilisateurs_actifs`
- [ ] Créer méthode `obtenirUtilisateursArchives()` → `SELECT * FROM utilisateurs_archives`

**Temps estimé** : 2 heures

---

### ✅ 3. HASHER TOKENS (SHA-256) - PRIORITÉ HAUTE
**Fichiers à créer/modifier** :
- `api/src/utils/token-hasher.ts` (NOUVEAU)
- `api/src/db/clients/auth/auth.ts`
- `api/src/routes/auth.ts`
- `api/src/services/emailValidationService.ts`

**Tâches** :
- [ ] Créer fonction `hashToken(token: string): string` (SHA-256)
- [ ] Modifier génération tokens : stocker `token_hash` au lieu de `token`
- [ ] Modifier validation tokens : hasher token reçu et comparer avec `token_hash`
- [ ] Mettre à jour tables : `email_validation_tokens`, `password_reset_tokens`, `validation_tokens`

**Temps estimé** : 3-4 heures

---

### ✅ 4. TESTS D'INTÉGRATION - PRIORITÉ MOYENNE
**Fichiers à créer/modifier** :
- `api/src/__tests__/integration/soft-delete.test.ts` (NOUVEAU)
- `api/src/__tests__/integration/token-hashing.test.ts` (NOUVEAU)
- `api/src/__tests__/routes/utilisateurs.test.ts`

**Tâches** :
- [ ] Test soft delete : vérifier anonymisation
- [ ] Test restore : vérifier restauration (si pas anonymisé)
- [ ] Test restore impossible : après anonymisation
- [ ] Test vue utilisateurs_actifs : exclut supprimés
- [ ] Test token hashing : création + validation

**Temps estimé** : 4-5 heures

---

### ✅ 5. FIX ERREURS TYPESCRIPT - PRIORITÉ BASSE
**Tâches** :
- [ ] Exécuter `npm run build` et corriger erreurs
- [ ] Exécuter `npm run lint` et corriger warnings
- [ ] Vérifier types pour nouvelles méthodes

**Temps estimé** : 2 heures

---

## 📁 STRUCTURE PROPOSÉE (SIMPLE - Pour TFE)

```
api/src/
├── db/
│   ├── clients/
│   │   └── utilisateurs/
│   │       └── utilisateurs.ts          # Méthodes SQL + procédures
│   │
│   └── procedures/                      # 🆕 Wrappers procédures
│       ├── safe-delete-user.ts          # CALL safe_delete_user()
│       ├── restore-user.ts              # CALL restore_deleted_user()
│       └── index.ts
│
├── utils/
│   ├── token-hasher.ts                  # 🆕 SHA-256 hashing
│   └── password-hasher.ts               # bcrypt (existe déjà?)
│
└── routes/
    ├── utilisateurs.ts                  # Routes users
    └── admin.ts                         # 🆕 Routes admin (restore, etc.)
```

---

## 🔧 SNIPPETS CODE

### 1. Token Hasher (`api/src/utils/token-hasher.ts`)
```typescript
import crypto from 'crypto';

/**
 * Hash un token avec SHA-256
 * @param token - Token en clair
 * @returns Hash SHA-256 (64 caractères hex)
 */
export function hashToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

/**
 * Vérifie un token contre son hash
 * @param token - Token en clair
 * @param hash - Hash SHA-256 stocké
 * @returns true si le token correspond au hash
 */
export function verifyToken(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}
```

### 2. Soft Delete User (`api/src/db/clients/utilisateurs/utilisateurs.ts`)
```typescript
async softDeleteUser(
  userId: number,
  deletedBy: number,
  reason: string
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve, reject) => {
    const sql = 'CALL safe_delete_user(?, ?, ?)';
    
    this.mysqlConnector.query(sql, [userId, deletedBy, reason], (error, results) => {
      if (error) {
        console.error('[softDeleteUser] Erreur:', error);
        return reject(error);
      }
      
      resolve({
        success: true,
        message: 'Utilisateur supprimé et anonymisé (RGPD conforme)'
      });
    });
  });
}

async restoreUser(
  userId: number,
  restoredBy: number
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve, reject) => {
    const sql = 'CALL restore_deleted_user(?, ?)';
    
    this.mysqlConnector.query(sql, [userId, restoredBy], (error, results) => {
      if (error) {
        console.error('[restoreUser] Erreur:', error);
        return reject(error);
      }
      
      resolve({
        success: true,
        message: 'Utilisateur restauré avec succès'
      });
    });
  });
}
```

### 3. Route Soft Delete (`api/src/routes/utilisateurs.ts`)
```typescript
// Remplacer la route DELETE existante (ligne ~697)
router.delete('/supprimer/:id', authMiddleware, roleMiddleware('admin'), async (req: any, res: any) => {
  try {
    const utilisateurId = Number(req.params.id);
    const deletedBy = req.user.id; // ID de l'admin connecté
    const reason = req.body.reason || 'Suppression administrateur';

    if (!utilisateurId || isNaN(utilisateurId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID utilisateur invalide." 
      });
    }

    const client = new Utilisateurs();
    const result = await client.softDeleteUser(utilisateurId, deletedBy, reason);

    res.status(200).json({
      success: true,
      message: result.message,
      rgpdCompliant: true
    });
  } catch (error) {
    console.error("Erreur soft delete:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression RGPD' 
    });
  }
});

// 🆕 Nouvelle route RESTORE
router.post('/restore/:id', authMiddleware, roleMiddleware('admin'), async (req: any, res: any) => {
  try {
    const utilisateurId = Number(req.params.id);
    const restoredBy = req.user.id;

    if (!utilisateurId || isNaN(utilisateurId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID utilisateur invalide." 
      });
    }

    const client = new Utilisateurs();
    const result = await client.restoreUser(utilisateurId, restoredBy);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error("Erreur restore:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erreur lors de la restauration' 
    });
  }
});
```

### 4. Utiliser Vue utilisateurs_actifs
```typescript
// Modifier obtenirTousLesUtilisateurs()
obtenirTousLesUtilisateurs(includeInactive: boolean = false): Promise<any> {
  return new Promise((resolve, reject) => {
    // Utiliser la vue pour exclure automatiquement les supprimés
    let sql = includeInactive 
      ? `SELECT * FROM utilisateurs ORDER BY date_inscription DESC`
      : `SELECT * FROM utilisateurs_actifs ORDER BY date_inscription DESC`;

    this.mysqlConnector.query(sql, (error, results) => {
      if (error) {
        return reject(error);
      }
      
      if (results.length > 0) {
        resolve({ 
          isFind: true, 
          message: "Utilisateurs trouvés", 
          data: results 
        });
      } else {
        resolve({ 
          isFind: false, 
          message: "Aucun utilisateur trouvé", 
          data: [] 
        });
      }
    });
  });
}
```

---

## ✅ CHECKLIST FINALE

### Phase 1 : Soft Delete (Jour 1)
- [ ] Créer méthodes `softDeleteUser()` et `restoreUser()`
- [ ] Modifier route DELETE
- [ ] Ajouter route POST restore
- [ ] Tester manuellement

### Phase 2 : Vues (Jour 1)
- [ ] Modifier `obtenirTousLesUtilisateurs()`
- [ ] Modifier `obtenirUnUtilisateur()`
- [ ] Tester manuellement

### Phase 3 : Token Hashing (Jour 2)
- [ ] Créer `token-hasher.ts`
- [ ] Modifier génération tokens (auth.ts)
- [ ] Modifier validation tokens
- [ ] Tester manuellement

### Phase 4 : Tests (Jour 3)
- [ ] Écrire tests unitaires
- [ ] Écrire tests d'intégration
- [ ] Fix erreurs TypeScript

### Phase 5 : Documentation (Jour 4)
- [ ] Documenter nouvelles routes (Swagger?)
- [ ] Mettre à jour README API
- [ ] Commit + Push

---

## 🎯 TEMPS TOTAL ESTIMÉ

**Minimum (fonctionnel)** : 2-3 jours  
**Complet (avec tests)** : 4-5 jours  
**Optimal (avec doc + refacto)** : 1 semaine

---

## 📝 NOTES IMPORTANTES

### ⚠️ Middleware requis
Pour les routes admin (soft delete, restore), il faut :
```typescript
// Vérifier que ces middleware existent
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

// Si non, à créer rapidement
```

### ⚠️ Token hashing - Migration
Si des tokens existent déjà en DB en clair :
1. **Option A** : Invalider tous les tokens existants (plus simple)
2. **Option B** : Script migration pour hasher tokens existants

**Recommandation** : Option A (plus sûr pour TFE)

### ⚠️ Tests
Focus sur les tests critiques :
- Soft delete + anonymisation
- Restauration (possible + impossible)
- Vue utilisateurs_actifs
- Token hashing (création + validation)

---

## 🚀 ON COMMENCE PAR QUOI ?

**Ma recommandation** : Commencer par **Soft Delete** (plus visible, plus impactant pour le jury)

1. Créer méthodes dans `utilisateurs.ts`
2. Modifier route DELETE
3. Ajouter route restore
4. Tester manuellement avec Postman/Insomnia

**Prêt à démarrer ?** 💪