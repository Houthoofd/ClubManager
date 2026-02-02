# ⚠️ CE SERVICE EST DÉPRÉCIÉ

## 🚫 Ne Plus Utiliser

Le service `Verification` dans ce dossier est **déprécié** et ne doit plus être utilisé.

Toutes ses fonctionnalités ont été migrées vers les services modernes utilisant **Prisma**.

---

## 📍 Où Trouver les Fonctionnalités

### ✅ Vérifications Utilisateurs
**Ancien :** `Verifiation.checkUtilisateurByEmail(email)`  
**Nouveau :** `UtilisateursService.verifierEmailExiste(email)`  
**Fichier :** `api/src/services/utilisateurs/utilisateurs.service.ts`

**Ancien :** `Verifiation.checkUtilisateurByPrenomNom(prenom, nom)`  
**Nouveau :** `UtilisateursService.verifierUtilisateurExiste(email)`  
**Fichier :** `api/src/services/utilisateurs/utilisateurs.service.ts`

**Ancien :** `Verifiation.verifierExistenceUtilisateur(email)`  
**Nouveau :** `UtilisateursService.utilisateurExiste(id)`  
**Fichier :** `api/src/services/utilisateurs/utilisateurs.service.ts`

### ✅ Vérifications Cours
**Ancien :** `Verifiation.checkCoursPlanning(...)`  
**Nouveau :** `CoursService.verifierConflitHoraire(params)`  
**Fichier :** `api/src/services/cours/core/recurrents/verifications.ts`

**Ancien :** `Verifiation.verifierConflitHoraire(...)`  
**Nouveau :** `CoursService.verifierConflitHoraire(params)`  
**Fichier :** `api/src/services/cours/core/recurrents/verifications.ts`

**Ancien :** `Verifiation.verifierCapaciteCours(coursId)`  
**Nouveau :** `CoursService.verifierCapaciteCours(coursId)`  
**Fichier :** `api/src/services/cours/core/recurrents/verifications.ts`

### ✅ Vérifications Magasin
**Ancien :** `Verifiation.checkArticleByNom(nom)`  
**Nouveau :** `MagasinService.verifierArticleExiste(nom)`  
**Fichier :** `api/src/services/magasin/core/articles/verifications.ts`

**Ancien :** `Verifiation.checkArticleByNomAndCategorie(nom, categorie_id)`  
**Nouveau :** `MagasinService.verifierArticleExisteParCategorie(nom, categorieId)`  
**Fichier :** `api/src/services/magasin/core/articles/verifications.ts`

### ✅ Vérifications Professeurs
**Ancien :** `Verifiation.checkUtilisateursSontProfesseurs(utilisateurs)`  
**Nouveau :** `ProfesseursService.estProfesseur(utilisateurId)` (pour chaque utilisateur)  
**Fichier :** `api/src/services/professeurs/professeurs.service.ts`

---

## 📖 Documentation de Migration

Pour un guide complet de migration, consultez :
- **Guide de migration** : `api/docs/MIGRATION_VERIFICATION.md`
- **Table de correspondance** : `api/docs/VERIFICATION_SERVICE_MAPPING.md`

---

## 🗑️ Suppression Planifiée

Ce dossier sera **supprimé** une fois que toutes les références auront été migrées vers les services modernes.

### Vérifier les références restantes :
```bash
grep -r "Verifiation" api/src/ --include="*.ts" --exclude-dir=verification
grep -r "from.*verification" api/src/ --include="*.ts" --exclude-dir=verification
```

Si aucune référence n'est trouvée, vous pouvez supprimer ce dossier en toute sécurité :
```bash
rm -rf api/src/db/clients/verification/
```

---

## ⚡ Pourquoi cette Migration ?

1. **Utilisation de Prisma** au lieu de requêtes SQL brutes
2. **Meilleure sécurité** contre les injections SQL
3. **Type-safety** avec TypeScript
4. **Code plus maintenable** et testable
5. **Séparation des responsabilités** par domaine métier
6. **Tests automatisés** complets (100% de couverture)

---

**Date de dépréciation** : Janvier 2026  
**Statut** : ⚠️ DÉPRÉCIÉ - NE PLUS UTILISER  
**Action requise** : Migrer vers les services modernes