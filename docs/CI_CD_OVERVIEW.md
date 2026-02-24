# 🚀 CI/CD Overview - ClubManager AWS Deployment

## 📖 Introduction

Ce document présente la stratégie CI/CD complète pour ClubManager, utilisant **GitHub Actions**, **AWS S3**, **CloudFront** et **GitHub Container Registry (GHCR)**.

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────┐
│                           GitHub Repository                          │
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Frontend   │    │   Backend    │    │   Workflows  │          │
│  │  (React/Vite)│    │  (Node.js)   │    │   (.github)  │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │ Push/PR
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub Actions                               │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Stage 1: Tests & Quality                                     │  │
│  │  ├─ Lint (ESLint)                                            │  │
│  │  ├─ Unit Tests (Vitest/Jest)                                 │  │
│  │  ├─ Coverage Check (>70%)                                    │  │
│  │  └─ Security Scan                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                │                                      │
│                                ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Stage 2: Build                                               │  │
│  │  ├─ Frontend: Vite Build (dist/)                             │  │
│  │  ├─ Backend: TypeScript Compile                              │  │
│  │  └─ Environment Variables Injection                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                │                                      │
│                                ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Stage 3: Docker Images                                       │  │
│  │  ├─ Build Multi-Stage Dockerfile                             │  │
│  │  ├─ Tag: latest, main-{sha}, {branch}                        │  │
│  │  └─ Push to GHCR (ghcr.io)                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                │                                      │
│                                ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Stage 4: Deploy                                              │  │
│  │  ├─ Frontend → AWS S3                                        │  │
│  │  ├─ CloudFront Invalidation                                  │  │
│  │  └─ Backend → EC2/ECS (Docker)                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────┬───────────────┬───────────────────────────────┘
                        │               │
                        ▼               ▼
        ┌───────────────────────┐   ┌──────────────────────┐
        │  GHCR                 │   │  AWS Cloud           │
        │  ├─ Frontend Image    │   │  ├─ S3 Bucket        │
        │  └─ Backend Image     │   │  ├─ CloudFront       │
        │                       │   │  ├─ EC2/ECS          │
        │  (Backup/Versioning)  │   │  └─ Route 53 (DNS)   │
        └───────────────────────┘   └──────────────────────┘
                                            │
                                            ▼
                                      🌐 End Users
```

---

## 🎯 Stratégie de Déploiement

### Frontend (React/Vite)

**Hébergement :** AWS S3 + CloudFront CDN

**Pourquoi S3 + CloudFront ?**
- ✅ **Coût très faible** (~$1-5/mois pour un petit site)
- ✅ **Performance globale** (CDN avec points de présence mondiaux)
- ✅ **Scalabilité automatique** (gère des millions de requêtes)
- ✅ **HTTPS gratuit** (via CloudFront + ACM)
- ✅ **Pas de serveur à gérer** (serverless)

**Flux de déploiement :**
```
Code Push → Tests → Build → Docker Image (GHCR) → S3 Sync → CloudFront Invalidation
```

**Stratégie de cache :**
- **Assets (JS/CSS/images)** : Cache 1 an (`max-age=31536000`)
- **HTML** : Pas de cache (`max-age=0`)
- **JSON/SW** : Cache 1h (`max-age=3600`)

### Backend (Node.js/Express)

**Hébergement :** EC2 avec Docker (ou ECS/Fargate)

**Pourquoi EC2 + Docker ?**
- ✅ **Contrôle total** sur l'environnement
- ✅ **Images versionnées** dans GHCR
- ✅ **Rollback facile** (pull image précédente)
- ✅ **Déploiement cohérent** (même image en dev/staging/prod)

**Flux de déploiement :**
```
Code Push → Tests → Build → Docker Image (GHCR) → Pull sur EC2 → Restart Container → Health Check
```

---

## 📂 Structure des Workflows

```
.github/workflows/
├── ci-cd-aws.yml           # 🚀 Workflow principal (RECOMMANDÉ)
│                           # - Tests + Build + Docker + Deploy S3/EC2
│                           # - Déclenché sur push vers main/develop
│
├── ci.yml                  # ✅ Tests uniquement
│                           # - Tests frontend + backend
│                           # - Déclenché sur tous les PR
│
├── cd-release.yml          # 📦 Release manuelle
│                           # - Déploiement manuel avec confirmation
│
└── auth-tests.yml          # 🔐 Tests d'authentification
                            # - Tests spécifiques auth
```

---

## 🔄 Workflow Principal : `ci-cd-aws.yml`

### Déclencheurs

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:  # Déclenchement manuel
```

### Jobs et Dépendances

```
frontend-test ──┐
                ├─→ frontend-build ──→ frontend-docker ──┐
                                                          ├─→ deploy-s3 ──┐
api-test ───────┐                                         │               │
                ├─→ api-build ──────→ api-docker ─────────┴─→ deploy-api ─┤
                                                                           │
                                                                           ├─→ notify
                                                                           │
                                                                           └─→ 📧 Success/Fail
```

### Détails des Jobs

#### 1️⃣ **frontend-test**
- Checkout code
- Setup Node.js 18
- Install dependencies (`npm ci`)
- Lint (`npm run lint`)
- Run tests with coverage (`npm run test:coverage`)
- Upload coverage to Codecov
- **Condition de succès :** Coverage ≥ 70%

#### 2️⃣ **frontend-build**
- Build production (`npm run build`)
- Inject environment variables :
  - `VITE_API_BASE_URL`
  - `VITE_STRIPE_PUBLIC_KEY`
  - `VITE_SENTRY_DSN`
- Upload artifacts (dist/)
- **Retention :** 30 jours

#### 3️⃣ **frontend-docker**
- Build Docker image (Nginx + static files)
- Tag avec :
  - `latest` (si branche main)
  - `main-{sha}` (commit SHA)
  - `{branch}` (nom de branche)
- Push vers GHCR
- **Utilité :** Backup, rollback, versioning

#### 4️⃣ **deploy-s3**
- Download build artifacts
- Configure AWS credentials
- Sync vers S3 avec cache headers optimisés
- Invalidate CloudFront cache
- Verify deployment
- **Condition :** Uniquement sur branche `main`

#### 5️⃣ **api-test**
- Setup MySQL + Redis (services containers)
- Run Prisma migrations
- Seed test database
- Run tests
- Upload coverage

#### 6️⃣ **api-build**
- Build TypeScript (`npm run build`)
- Generate Prisma Client

#### 7️⃣ **api-docker**
- Build Docker image (Node.js + compiled API)
- Tag et push vers GHCR

#### 8️⃣ **deploy-api**
- **Option A - EC2 :**
  - SSH vers EC2
  - Login GHCR
  - Pull latest image
  - Stop old container
  - Run new container
  - Run migrations (`prisma migrate deploy`)
  - Health check
  
- **Option B - ECS :**
  - Update ECS service
  - Force new deployment
  - Health check

#### 9️⃣ **notify**
- Generate deployment summary
- Post to GitHub Actions summary
- Optionnel : Slack/Discord notification

---

## 🔐 Secrets GitHub

### AWS Secrets (obligatoires pour S3)

| Secret | Description | Exemple |
|--------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | Clé d'accès IAM | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Clé secrète IAM | `wJalrXUtnFEMI/K7MDENG...` |
| `AWS_REGION` | Région AWS | `us-east-1` |
| `S3_BUCKET_NAME` | Nom du bucket S3 | `clubmanager-frontend-prod` |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID CloudFront | `E1234567890ABC` |

### Frontend Secrets

| Secret | Description |
|--------|-------------|
| `VITE_API_BASE_URL` | URL de l'API backend |
| `VITE_STRIPE_PUBLIC_KEY` | Clé publique Stripe |
| `VITE_SENTRY_DSN` | DSN Sentry pour monitoring |

### Backend Secrets (EC2/ECS)

| Secret | Description |
|--------|-------------|
| `EC2_HOST` | IP/DNS de l'instance EC2 |
| `EC2_USER` | Utilisateur SSH (`ubuntu`, `ec2-user`) |
| `EC2_SSH_PRIVATE_KEY` | Clé privée SSH (format PEM) |
| `DATABASE_URL` | URL MySQL/PostgreSQL |
| `JWT_SECRET` | Secret pour tokens JWT |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `REDIS_URL` | URL Redis |
| `SENTRY_DSN` | DSN Sentry backend |

### Variables GitHub

| Variable | Valeurs possibles | Description |
|----------|-------------------|-------------|
| `DEPLOY_TARGET` | `EC2` ou `ECS` | Cible de déploiement API |

---

## 🌍 Gestion des Environnements

### Approche recommandée : 3 environnements

```
┌─────────────┬──────────────────────────────┬─────────────────────────┐
│ Environment │ S3 Bucket                    │ CloudFront Domain       │
├─────────────┼──────────────────────────────┼─────────────────────────┤
│ Development │ clubmanager-frontend-dev     │ d111111.cloudfront.net  │
│ Staging     │ clubmanager-frontend-staging │ d222222.cloudfront.net  │
│ Production  │ clubmanager-frontend-prod    │ app.clubmanager.com     │
└─────────────┴──────────────────────────────┴─────────────────────────┘
```

### Configuration avec GitHub Environments

**Avantages :**
- Secrets spécifiques par environnement
- Protection de branche (approvals pour prod)
- Historique de déploiement
- Rollback facile

**Setup :**
1. GitHub → Settings → Environments
2. Créer `development`, `staging`, `production`
3. Configurer les secrets par environnement
4. Ajouter des protection rules :
   - Production : Require reviewers (1-2 personnes)
   - Production : Delay deployment (optionnel)

**Modifier le workflow :**
```yaml
deploy-s3:
  environment: production  # ou ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
  # ...
```

---

## 🐳 GitHub Container Registry (GHCR)

### Pourquoi utiliser GHCR ?

1. **Backup/Versioning** : Toutes les versions buildées sont sauvegardées
2. **Rollback rapide** : Pull une image précédente
3. **Multi-environnement** : Même image en dev/staging/prod
4. **Gratuit** : Pour les repos publics (500MB) ou privés (2GB)
5. **Intégration GitHub** : Pas de credentials supplémentaires

### Structure des images

```
ghcr.io/YOUR_ORG/clubmanager/frontend:latest
ghcr.io/YOUR_ORG/clubmanager/frontend:main
ghcr.io/YOUR_ORG/clubmanager/frontend:main-abc1234
ghcr.io/YOUR_ORG/clubmanager/frontend:develop

ghcr.io/YOUR_ORG/clubmanager/api:latest
ghcr.io/YOUR_ORG/clubmanager/api:main
ghcr.io/YOUR_ORG/clubmanager/api:main-abc1234
ghcr.io/YOUR_ORG/clubmanager/api:develop
```

### Utilisation pour rollback

```bash
# Lister les versions disponibles
gh api /user/packages/container/clubmanager%2Ffrontend/versions

# Pull une version spécifique
docker pull ghcr.io/YOUR_ORG/clubmanager/frontend:main-abc1234

# Extraire les fichiers
docker create --name temp ghcr.io/YOUR_ORG/clubmanager/frontend:main-abc1234
docker cp temp:/usr/share/nginx/html ./dist-rollback
docker rm temp

# Redéployer vers S3
aws s3 sync ./dist-rollback s3://clubmanager-frontend-prod --delete
aws cloudfront create-invalidation --distribution-id E123456 --paths "/*"
```

---

## 🔄 Stratégies de Rollback

### Méthode 1 : Git Revert (Recommandé pour prod)

```bash
# Identifier le commit problématique
git log --oneline

# Revert le commit
git revert <commit-sha>

# Push (déclenche auto le redéploiement)
git push origin main
```

**Avantages :** Historique Git propre, audit trail complet

### Méthode 2 : Script de rollback local

```bash
./scripts/deploy-to-s3.sh --rollback
```

**Avantages :** Rollback immédiat sans nouveau commit

### Méthode 3 : GHCR Image précédente

```bash
# Via workflow manuel avec input
gh workflow run deploy --ref main --field image_tag=main-abc1234
```

**Avantages :** Précis, testé, identique à la version déployée

### Méthode 4 : S3 Versioning

```bash
# Restaurer une version d'objet S3
aws s3api list-object-versions --bucket clubmanager-frontend-prod
aws s3api copy-object --bucket clubmanager-frontend-prod \
  --copy-source clubmanager-frontend-prod/index.html?versionId=VERSION_ID \
  --key index.html
```

**Avantages :** Granularité fichier par fichier

---

## 📊 Monitoring et Observabilité

### Métriques clés à surveiller

#### Frontend (S3 + CloudFront)
- ✅ **4xx Error Rate** (CloudFront) : < 1%
- ✅ **5xx Error Rate** : < 0.1%
- ✅ **Cache Hit Rate** : > 90%
- ✅ **Total Requests** : Tendance
- ✅ **Data Transfer** : Coûts

#### Backend (API)
- ✅ **Response Time** : < 200ms (p95)
- ✅ **Error Rate** : < 0.5%
- ✅ **Request Rate** : Tendance
- ✅ **Database Connections** : < 80% du pool
- ✅ **Memory Usage** : < 80%

### Outils recommandés

1. **CloudWatch** (AWS natif)
   - Logs CloudFront
   - S3 metrics
   - EC2/ECS metrics
   - Alarms

2. **Sentry** (Monitoring applicatif)
   - Error tracking
   - Performance monitoring
   - Release tracking

3. **GitHub Actions Insights**
   - Workflow duration
   - Success rate
   - Resource usage

### Alertes recommandées

```bash
# CloudWatch Alarm - High 4xx rate
aws cloudwatch put-metric-alarm \
  --alarm-name clubmanager-high-4xx \
  --metric-name 4xxErrorRate \
  --namespace AWS/CloudFront \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alerts

# CloudWatch Alarm - API health check failed
aws cloudwatch put-metric-alarm \
  --alarm-name clubmanager-api-down \
  --metric-name HealthCheckStatus \
  --namespace AWS/Route53 \
  --statistic Minimum \
  --period 60 \
  --threshold 1 \
  --comparison-operator LessThanThreshold
```

---

## 💰 Optimisation des Coûts

### S3
- ✅ Utiliser **Intelligent-Tiering** pour les archives
- ✅ Lifecycle policies : supprimer les anciennes versions après 30j
- ✅ Compression Gzip activée

### CloudFront
- ✅ **PriceClass_100** (US + Europe) au lieu de All
- ✅ Compression activée
- ✅ Cache optimisé (moins de requêtes vers S3)

### GHCR
- ✅ Supprimer les anciennes images (> 90 jours)
- ✅ Garder uniquement : latest, dernières 10 versions

### Workflow GitHub Actions
- ✅ Cache npm (`cache: 'npm'`)
- ✅ Cache Docker layers (`cache-from: type=gha`)
- ✅ Ne pas runner sur tous les commits (squash)

**Script de nettoyage GHCR :**
```bash
# Supprimer les images de plus de 90 jours
gh api /user/packages/container/clubmanager%2Ffrontend/versions \
  --jq '.[] | select(.created_at < now - 90*86400) | .id' \
  | xargs -I {} gh api -X DELETE /user/packages/container/clubmanager%2Ffrontend/versions/{}
```

---

## 🔒 Sécurité - Best Practices

### GitHub
- ✅ **Branch Protection** : Require PR reviews pour main
- ✅ **CODEOWNERS** : Review obligatoire pour fichiers sensibles
- ✅ **Dependabot** : Mises à jour auto des dépendances
- ✅ **Secret Scanning** : Détection de secrets committés
- ✅ **2FA** : Obligatoire pour tous les contributeurs

### AWS
- ✅ **IAM Least Privilege** : Permissions minimales
- ✅ **MFA** : Sur compte root et utilisateurs admin
- ✅ **S3 Encryption** : At rest (AES-256)
- ✅ **CloudFront WAF** : Protection DDoS/XSS (optionnel)
- ✅ **VPC** : Isolation réseau pour EC2/RDS

### Application
- ✅ **Secrets Manager** : Stockage sécurisé des secrets
- ✅ **HTTPS Only** : Redirect HTTP → HTTPS
- ✅ **CORS** : Configuré strictement
- ✅ **Rate Limiting** : Protection API
- ✅ **JWT** : Tokens avec expiration courte

### CI/CD
- ✅ **Secrets Rotation** : Tous les 90 jours
- ✅ **Signed Commits** : GPG signature
- ✅ **Image Scanning** : Vulnerabilités Docker
- ✅ **SBOM** : Software Bill of Materials

---

## 📚 Documentation Associée

- 📖 [Guide Complet AWS Setup](./AWS_DEPLOYMENT_SETUP.md)
- 🚀 [Quick Start Guide](./QUICKSTART_AWS_DEPLOYMENT.md)
- 🔧 [Script de Déploiement](../scripts/deploy-to-s3.sh)
- 📋 [Template Variables d'Environnement](../.env.aws.example)

---

## 🎓 Ressources Externes

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [GHCR Documentation](https://docs.github.com/packages)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html)

---

## 🆘 Support et Contribution

### Problèmes courants
- Consultez la section **Troubleshooting** dans [AWS_DEPLOYMENT_SETUP.md](./AWS_DEPLOYMENT_SETUP.md)
- Vérifiez les logs GitHub Actions
- Testez localement avec le script `deploy-to-s3.sh`

### Contribuer
1. Créer une branche feature : `git checkout -b feature/nouvelle-feature`
2. Commit avec conventional commits : `feat:`, `fix:`, `docs:`
3. Push et créer une PR
4. Attendre review + CI pass
5. Merge vers `develop` puis `main`

---

## ✅ Checklist de Mise en Production

### Infrastructure
- [ ] S3 bucket créé et configuré
- [ ] CloudFront distribution active
- [ ] SSL/TLS certificat configuré (ACM)
- [ ] DNS configuré (Route 53 ou autre)
- [ ] Utilisateur IAM créé avec permissions minimales

### GitHub
- [ ] Tous les secrets configurés
- [ ] Branch protection activée sur `main`
- [ ] Environments configurés (dev, staging, prod)
- [ ] Workflow testé sur `develop`

### Application
- [ ] Variables d'environnement validées
- [ ] Build frontend testé
- [ ] Tests passent à 100%
- [ ] Coverage ≥ 70%

### Monitoring
- [ ] Sentry configuré
- [ ] CloudWatch alarms créées
- [ ] Health checks configurés
- [ ] Logs centralisés

### Sécurité
- [ ] S3 encryption activée
- [ ] HTTPS forcé
- [ ] WAF configuré (optionnel)
- [ ] Secrets rotés récemment

### Documentation
- [ ] README à jour
- [ ] Runbook de déploiement écrit
- [ ] Procédure de rollback testée
- [ ] Équipe formée

---

**🎉 Votre pipeline CI/CD est prêt pour la production !**

Pour commencer, suivez le [Quick Start Guide](./QUICKSTART_AWS_DEPLOYMENT.md).