# 🏆 ClubManager - Plateforme Complète de Gestion de Club

**Épreuve Intégrée 2025 - Benoit Houthoofd**

![Architecture](https://img.shields.io/badge/Architecture-Full--Stack-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20React%20Native-61dafb)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Database](https://img.shields.io/badge/Database-MySQL-orange)
![AWS](https://img.shields.io/badge/Cloud-AWS%20RDS-ff9900)

## 🎯 Vue d'ensemble du Projet

**ClubManager** est une solution complète de gestion de club sportif (Jiu-Jitsu Brésilien) développée dans le cadre d'une épreuve intégrée. Le système offre une gestion complète des membres, cours, paiements, magasin en ligne et communication interne.

### 🚀 Technologies Utilisées

#### **Backend (API)**
- **Runtime**: Node.js avec TypeScript
- **Framework**: Express.js
- **Base de données**: MySQL avec pool de connexions
- **ORM/Requêtes**: MySQL natif avec classe MysqlConnector singleton
- **Authentification**: JWT (jsonwebtoken)
- **Paiements**: Stripe API
- **Upload de fichiers**: Multer
- **Communication temps réel**: Socket.io
- **Tests**: Jest avec Supertest

#### **Frontend Web**
- **Framework**: React avec TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **Styles**: CSS modules/Tailwind (à confirmer)
- **État**: Context API/Redux (à confirmer)

#### **Frontend Mobile**
- **Framework**: React Native avec Expo
- **Navigation**: Expo Router (file-based routing)
- **État**: Redux Toolkit

#### **Base de Données**
- **SGBD**: MySQL 8.0
- **Cloud**: AWS RDS (Production)
- **Local**: XAMPP/WAMP (Développement)
- **Features**: 
  - Triggers automatiques
  - Procédures stockées
  - Event Scheduler
  - Contraintes d'intégrité référentielle

#### **Infrastructure & Déploiement**
- **Cloud Provider**: AWS
- **Database**: AWS RDS MySQL
- **Environment Management**: dotenv avec .env.production/.env.development
- **Process Management**: PM2 (suggéré par les scripts)

---

## 🏗️ Architecture du Projet
📱 FRONTEND MOBILE 🖥️ FRONTEND WEB 👨‍💼 ADMIN PANEL React Native React + Vite Web Management │ │ │ └──────────────────────┼────────────────────┘ │ ⚡ API BACKEND (Node.js) GraphQL + REST JWT Auth + Middleware │ 🗄️ BASE DE DONNÉES MYSQL Triggers + Procédures + Events

ClubManager/ ├── 🚀 api/ # Backend Node.js + TypeScript │ ├── src/routes/ # API REST endpoints │ ├── src/db/ # Connexions MySQL │ ├── schema.graphql # Schéma GraphQL │ └── scripts/ # Scripts maintenance │ ├── 🖥️ front-end/ # Interface Web React │ ├── src/components/ # Composants React │ ├── src/pages/ # Pages application │ └── vite.config.ts # Config Vite build │ ├── 📱 mobile/ # App Mobile React Native │ ├── android/ # Build Android natif │ ├── ios/ # Build iOS natif │ └── App.tsx # Point d'entrée mobile │ ├── 🌐 web/ # Version Expo Web │ ├── app/ # Navigation screens │ └── redux/ # State management │ ├── 🗄️ db/ # Base de données complète │ ├── creation/ # Scripts création tables │ ├── procedures/ # Procédures stockées │ ├── triggers/ # Triggers automatiques │ └── event_scheduler/ # Tâches programmées │ ├── 🔧 shared/ # Code partagé ├── 🐳 nginx/ # Reverse proxy └── 📊 scripts/ # Outils maintenance


