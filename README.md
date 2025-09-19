# ClubManager

## Description du projet
ClubManager est une application conçue pour faciliter la gestion des clubs sportifs. Elle permet aux administrateurs de gérer les membres, les événements, les inscriptions, et bien plus encore.

## Objectifs
- Simplifier la gestion des clubs sportifs.
- Offrir une interface intuitive pour les administrateurs et les membres.
- Automatiser les tâches répétitives comme les inscriptions et les paiements.

## Fonctionnalités principales
- Gestion des membres :
  - Ajout, modification et suppression des membres.
  - Suivi des informations personnelles et des cotisations.
- Gestion des événements :
  - Création et planification des événements.
  - Gestion des inscriptions aux événements.
- Rapports :
  - Génération de statistiques sur les membres et les événements.
  - Suivi des paiements et des finances.
- Gestion des rôles et permissions :
  - Attribution de rôles (administrateur, membre, entraîneur) avec des niveaux d'accès spécifiques.
- Notifications :
  - Envoi d'e-mails ou de notifications push pour rappeler les événements ou les paiements.
- Gestion des équipements :
  - Suivi des équipements disponibles dans le club.
- Calendrier partagé :
  - Affichage d'un calendrier interactif pour les événements et les entraînements.
- Paiements en ligne :
  - Intégration d'une passerelle de paiement pour les cotisations et les inscriptions.
- Forum ou messagerie interne :
  - Communication entre les membres et les administrateurs.

## Technologies utilisées
- **Frontend** : [Précisez ici, par exemple React, Angular, etc.]
- **Backend** : [Précisez ici, par exemple Node.js, Django, etc.]
- **Base de données** : [Précisez ici, par exemple MySQL, MongoDB, etc.]

## Architecture
- **Modèle MVC** : Séparation claire entre les modèles, les vues et les contrôleurs.
- **API REST** : Communication entre le frontend et le backend.

## Étapes de développement
1. Analyse des besoins.
2. Conception de l'architecture.
3. Développement des fonctionnalités principales.
4. Tests et débogage.
5. Déploiement.

## Utilisation
1. Clonez le dépôt :
   ```bash
   git clone [URL du dépôt]
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez l'application :
   ```bash
   npm start
   ```

## Auteur
Guillaume Houthoofd

## Licence
Ce projet est sous licence [Précisez ici, par exemple MIT, GPL, etc.].

## Contact
Pour toute question ou suggestion, veuillez contacter [votre email ou autre moyen de contact].
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
