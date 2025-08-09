
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
