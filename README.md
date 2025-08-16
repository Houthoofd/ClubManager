# ClubManager

> Plateforme de gestion de club : gestion des membres, des cours, des paiements, du magasin et plus encore.

## Présentation
ClubManager est une application web complète pour la gestion d’un club sportif ou associatif. Elle permet de gérer les utilisateurs (adhérents, administrateurs), les inscriptions aux cours, les paiements, la boutique, la messagerie interne, et bien d’autres fonctionnalités.

## Fonctionnalités principales
- **Gestion des utilisateurs** : création, modification, suppression, connexion, rôles, etc.
- **Gestion des cours** : inscription, ajout de cours, gestion des participants et des professeurs.
- **Paiements** : suivi des paiements, intégration Stripe, gestion des cotisations.
- **Magasin** : gestion des articles, commandes, catégories, panier.
- **Statistiques** : tableaux de bord, graphiques sur les membres et les paiements.
- **Messagerie interne** : chat entre membres.
- **Administration** : interface d’administration, gestion des statuts, abonnements, grades, etc.

## Architecture du projet
- **API (backend)** : Node.js, Express, TypeScript, Socket.io, MySQL, Zod (validation), Stripe (paiement)
- **Front-end** : React, Vite, TypeScript, Patternfly, Redux Toolkit, React Router, Stripe.js
- **Mobile** : (structure prévue, non détaillée ici)
- **Docker** : Conteneurisation du front, back et reverse proxy Nginx

## Installation rapide

### Prérequis
- Node.js >= 18
- npm ou yarn
- Docker (optionnel mais recommandé)

### Lancer avec Docker
```bash
docker-compose up --build
```
L’application sera accessible sur [http://localhost](http://localhost).

### Lancer en local (développement)
#### API
```bash
cd api
npm install
npm run build
npm start
```
#### Front-end
```bash
cd front-end
npm install
npm run dev
```

## Structure des dossiers
- `api/` : Backend Express/TypeScript
- `front-end/` : Frontend React/TypeScript
- `mobile/` : (structure mobile)
- `nginx/` : Configuration du reverse proxy
- `docker-compose.yml` : Orchestration des services

## Technologies principales
- **Backend** : Express, TypeScript, Socket.io, Stripe, MySQL
- **Frontend** : React, Vite, Patternfly, Redux Toolkit
- **Outils** : Docker, Nginx

## Contribution
Les contributions sont les bienvenues !
1. Forkez le projet
2. Créez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commitez vos changements (`git commit -am 'Ajout d’une fonctionnalité'`)
4. Poussez la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

## Licence
Ce projet est sous licence MIT.

# Commandes pour nettoyer et recompiler le projet

Dans chaque dossier : **clubmanager/types** et **clubmanager/api**

1. Supprimez les dossiers et fichiers de cache :
   ```
   rm -rf node_modules
   rm -rf .cache
   rm -rf dist
   rm -f package-lock.json
   ```

2. Nettoyez le cache npm :
   ```
   npm cache clean --force
   ```

3. Réinstallez les dépendances :
   ```
   npm install
   ```

4. Dans `clubmanager/types`, recompilez le package :
   ```
   npm run build
   ```

5. Nettoyez le cache Jest (dans le dossier api) :
   ```
   npx jest --clearCache
   ```

6. Relancez vos tests :
   ```
   npm run test
   ```

**Résumé :**
- Nettoyez tout, réinstallez, recompilez, puis relancez les tests.

# Problème de configuration Jest

Pour résoudre l’erreur :

> Multiple configurations found:
> * jest.config.js
> * jest.config.cjs

**Solution :**
1. Supprimez le fichier de configuration Jest que vous n’utilisez pas.
   - Si vous utilisez `jest.config.cjs`, supprimez `jest.config.js` :
     ```
     rm jest.config.js
     ```
   - Si vous utilisez `jest.config.js`, supprimez `jest.config.cjs` :
     ```
     rm jest.config.cjs
     ```

2. Ou lancez Jest en précisant le fichier de config à utiliser :
   ```
   npx jest --config=jest.config.cjs
   ```
   ou
   ```
   npx jest --config=jest.config.js
   ```

**Résumé :**
- Gardez un seul fichier de configuration Jest dans le dossier.
- Précisez le fichier avec `--config` si besoin.
