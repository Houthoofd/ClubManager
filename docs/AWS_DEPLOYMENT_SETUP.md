# 🚀 AWS S3 + CloudFront Deployment Setup

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Prérequis](#prérequis)
3. [Configuration AWS](#configuration-aws)
4. [Configuration GitHub](#configuration-github)
5. [Configuration du CI/CD](#configuration-du-cicd)
6. [Déploiement](#déploiement)
7. [Rollback](#rollback)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Test       │  │   Build      │  │   Docker     │     │
│  │   Frontend   │→ │   Frontend   │→ │   Image      │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
│                                              │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                    ┌──────────────────────────┼──────────────┐
                    │                          ↓              │
                    │              ┌──────────────────┐       │
                    │              │  GitHub Container│       │
                    │              │  Registry (GHCR) │       │
                    │              └──────────────────┘       │
                    │                     (Backup/Rollback)   │
                    └──────────────────────────────────────────┘
                                               │
        ┌──────────────────────────────────────┼──────────────┐
        │                AWS                   ↓              │
        │                                                      │
        │  ┌────────────────┐         ┌──────────────────┐   │
        │  │   S3 Bucket    │←────────│  CloudFront      │   │
        │  │  (Static Host) │         │  (CDN + HTTPS)   │   │
        │  └────────────────┘         └──────────────────┘   │
        │                                      │              │
        │                              ┌───────┴────────┐     │
        │                              │   Route 53     │     │
        │                              │ (DNS - optional)│    │
        │                              └────────────────┘     │
        └───────────────────────────────────────────────────────┘
                                       │
                                       ↓
                                 🌐 Users
```

### Flux de déploiement

1. **Commit → GitHub** : Push sur `main` ou `develop`
2. **Tests** : Linting + Unit tests + Coverage
3. **Build** : Compilation Vite (frontend)
4. **Docker Image** : Création et push vers GHCR (backup/versioning)
5. **S3 Sync** : Upload des fichiers statiques vers S3
6. **CloudFront Invalidation** : Cache invalidé pour mise à jour instantanée
7. **Notification** : Résumé du déploiement

---

## ✅ Prérequis

### Localement

- **Node.js** ≥ 18
- **AWS CLI** v2 installé et configuré
- **Git**
- Compte **GitHub** avec droits admin sur le repo
- Compte **AWS** avec droits IAM appropriés

### Dans AWS

- Budget estimé : **~$1-5/mois** (S3 + CloudFront pour un petit site)
- Région recommandée : `us-east-1` ou `eu-west-1`

---

## ⚙️ Configuration AWS

### 1️⃣ Créer un bucket S3

```bash
# Nom du bucket (doit être unique globalement)
BUCKET_NAME="clubmanager-frontend-prod"
AWS_REGION="us-east-1"

# Créer le bucket
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

# Configurer pour hébergement web statique
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html
```

### 2️⃣ Configurer les permissions S3

**Policy du bucket** (pour CloudFront) :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::clubmanager-frontend-prod/*"
    }
  ]
}
```

Appliquer la policy :

```bash
cat > bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::clubmanager-frontend-prod/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file://bucket-policy.json
```

**Désactiver le blocage d'accès public** :

```bash
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    BlockPublicAcls=false,\
    IgnorePublicAcls=false,\
    BlockPublicPolicy=false,\
    RestrictPublicBuckets=false
```

### 3️⃣ Créer une distribution CloudFront

**Via la console AWS** :

1. Allez dans **CloudFront** → **Create Distribution**
2. **Origin Domain** : Sélectionnez votre bucket S3
3. **Origin Access** : Public (ou OAI si vous préférez plus de sécurité)
4. **Viewer Protocol Policy** : Redirect HTTP to HTTPS
5. **Allowed HTTP Methods** : GET, HEAD
6. **Cache Policy** : CachingOptimized
7. **Compress objects automatically** : Yes
8. **Alternate Domain Names (CNAMEs)** : `app.clubmanager.com` (optionnel)
9. **Custom SSL Certificate** : Créer via ACM (optionnel)
10. **Default Root Object** : `index.html`
11. **Custom Error Responses** :
    - 404 → `/index.html` (code 200) pour SPA routing
    - 403 → `/index.html` (code 200)

**Via AWS CLI** :

```bash
# Créer la distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json

# Récupérer l'ID de la distribution
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?DomainName=='$BUCKET_NAME.s3.amazonaws.com']].Id" \
  --output text)

echo "Distribution ID: $DISTRIBUTION_ID"
```

**cloudfront-config.json** :

```json
{
  "CallerReference": "clubmanager-cf-2024",
  "Comment": "ClubManager Frontend Distribution",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-clubmanager-frontend",
        "DomainName": "clubmanager-frontend-prod.s3.us-east-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-clubmanager-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "Compress": true,
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      },
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "DefaultRootObject": "index.html"
}
```

### 4️⃣ Créer un utilisateur IAM pour GitHub Actions

```bash
# Créer l'utilisateur
aws iam create-user --user-name github-actions-clubmanager

# Créer une policy pour S3 + CloudFront
cat > github-actions-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::clubmanager-frontend-prod"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::clubmanager-frontend-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Créer la policy
aws iam create-policy \
  --policy-name GitHubActionsClubManagerPolicy \
  --policy-document file://github-actions-policy.json

# Attacher la policy à l'utilisateur
aws iam attach-user-policy \
  --user-name github-actions-clubmanager \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/GitHubActionsClubManagerPolicy

# Créer des access keys
aws iam create-access-key --user-name github-actions-clubmanager
```

**⚠️ Sauvegardez les clés d'accès retournées !**

---

## 🔐 Configuration GitHub

### Secrets GitHub

Allez dans **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### Secrets obligatoires pour S3 :

| Secret                          | Description                                      | Exemple                                              |
|---------------------------------|--------------------------------------------------|------------------------------------------------------|
| `AWS_ACCESS_KEY_ID`             | ID de la clé d'accès IAM                         | `AKIAIOSFODNN7EXAMPLE`                               |
| `AWS_SECRET_ACCESS_KEY`         | Clé secrète IAM                                  | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`           |
| `AWS_REGION`                    | Région AWS                                       | `us-east-1`                                          |
| `S3_BUCKET_NAME`                | Nom du bucket S3                                 | `clubmanager-frontend-prod`                          |
| `CLOUDFRONT_DISTRIBUTION_ID`    | ID de la distribution CloudFront                 | `E1234567890ABC`                                     |

#### Secrets optionnels :

| Secret                       | Description                                      |
|------------------------------|--------------------------------------------------|
| `CLOUDFRONT_DOMAIN`          | Domaine CloudFront ou custom                     |
| `VITE_API_BASE_URL`          | URL de votre API backend                         |
| `VITE_STRIPE_PUBLIC_KEY`     | Clé publique Stripe                              |
| `VITE_SENTRY_DSN`            | DSN Sentry pour monitoring                       |

#### Pour l'API (EC2 ou ECS) :

| Secret                       | Description                                      |
|------------------------------|--------------------------------------------------|
| `EC2_HOST`                   | IP ou hostname de votre EC2                      |
| `EC2_USER`                   | Utilisateur SSH (ex: `ubuntu`, `ec2-user`)       |
| `EC2_SSH_PRIVATE_KEY`        | Clé privée SSH (format PEM)                      |
| `DATABASE_URL`               | URL de connexion à la base de données            |
| `JWT_SECRET`                 | Secret pour les tokens JWT                       |
| `STRIPE_SECRET_KEY`          | Clé secrète Stripe                               |
| `REDIS_URL`                  | URL de connexion Redis                           |
| `SENTRY_DSN`                 | DSN Sentry backend                               |

### Variables GitHub

Allez dans **Settings** → **Secrets and variables** → **Actions** → **Variables** → **New repository variable**

| Variable                     | Valeur                                           |
|------------------------------|--------------------------------------------------|
| `DEPLOY_TARGET`              | `EC2` ou `ECS` (selon votre infrastructure)      |

---

## 🚀 Configuration du CI/CD

### Structure des workflows

```
.github/workflows/
├── ci-cd-aws.yml          # Workflow principal (S3 + GHCR)
├── ci.yml                 # Tests uniquement
└── cd-release.yml         # Release manuelle
```

### Workflow principal : `ci-cd-aws.yml`

Ce workflow s'exécute sur :
- **Push** vers `main` ou `develop`
- **Pull Request** vers ces branches
- **Déclenchement manuel** (`workflow_dispatch`)

**Jobs :**

1. ✅ **frontend-test** : Lint + Tests + Coverage
2. 🏗️ **frontend-build** : Build production
3. 🐳 **frontend-docker** : Image Docker → GHCR
4. 🚀 **deploy-s3** : Déploiement S3 + CloudFront invalidation
5. 🔧 **api-test** : Tests API
6. 🔨 **api-build** : Build API
7. 🐳 **api-docker** : Image Docker API → GHCR
8. 🚀 **deploy-api** : Déploiement API (EC2 ou ECS)
9. 📢 **notify** : Résumé du déploiement

### Stratégie de cache

**Assets (JS/CSS/Images)** :
- Cache-Control: `public, max-age=31536000, immutable`
- Fichiers avec hash dans le nom → cache perpétuel

**HTML** :
- Cache-Control: `public, max-age=0, must-revalidate`
- Toujours récupéré depuis S3 (via CloudFront)

**JSON/Service Workers** :
- Cache-Control: `public, max-age=3600, must-revalidate`
- Cache de 1h

---

## 📦 Déploiement

### Déploiement automatique

**Sur chaque push vers `main`** :

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
```

Le workflow se déclenchera automatiquement et :
1. Testera le code
2. Buildra les artefacts
3. Créera les images Docker
4. Déploiera sur S3 + CloudFront
5. Déploiera l'API

### Déploiement manuel

Via l'interface GitHub :

1. Allez dans **Actions**
2. Sélectionnez le workflow **CI/CD - AWS S3 + GHCR**
3. Cliquez sur **Run workflow**
4. Sélectionnez la branche
5. Cliquez sur **Run workflow**

Via GitHub CLI :

```bash
gh workflow run "CI/CD - AWS S3 + GHCR" --ref main
```

### Vérification du déploiement

```bash
# Vérifier les fichiers sur S3
aws s3 ls s3://clubmanager-frontend-prod/ --recursive

# Vérifier CloudFront
aws cloudfront get-distribution --id $DISTRIBUTION_ID

# Tester l'URL
curl -I https://your-cloudfront-domain.cloudfront.net
```

---

## 🔄 Rollback

### Option 1 : Via S3 Versioning (recommandé)

**Activer le versioning** :

```bash
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled
```

**Rollback** :

```bash
# Lister les versions
aws s3api list-object-versions \
  --bucket $BUCKET_NAME \
  --prefix index.html

# Restaurer une version spécifique
aws s3api copy-object \
  --bucket $BUCKET_NAME \
  --copy-source $BUCKET_NAME/index.html?versionId=VERSION_ID \
  --key index.html
```

### Option 2 : Via GHCR (Docker)

Les images Docker sont stockées dans GHCR avec tags :
- `latest` : Dernier déploiement sur main
- `main-abc1234` : Commit SHA
- `develop` : Branche develop

**Redéployer une version précédente** :

1. Trouvez le SHA du commit à restaurer
2. Re-déclenchez le workflow sur ce commit :

```bash
git checkout abc1234
gh workflow run "CI/CD - AWS S3 + GHCR" --ref abc1234
```

Ou utilisez l'image Docker directement :

```bash
# Pull image d'une version spécifique
docker pull ghcr.io/YOUR_ORG/clubmanager/frontend:main-abc1234

# Extraire les fichiers statiques et uploader vers S3
docker create --name temp ghcr.io/YOUR_ORG/clubmanager/frontend:main-abc1234
docker cp temp:/app/dist ./dist-rollback
docker rm temp

# Upload vers S3
aws s3 sync ./dist-rollback s3://$BUCKET_NAME --delete

# Invalider CloudFront
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Option 3 : Revert Git + Redéploiement

```bash
git revert <commit-sha>
git push origin main
# Le workflow se redéclenchera automatiquement
```

---

## 🐛 Troubleshooting

### Problème : Les changements ne sont pas visibles

**Cause** : Cache CloudFront

**Solution** :

```bash
# Invalider tout le cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

# Invalider un fichier spécifique
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/index.html" "/assets/*"
```

### Problème : 403 Forbidden sur S3

**Causes possibles** :
1. Bucket policy incorrecte
2. Blocage d'accès public activé

**Solutions** :

```bash
# Vérifier la policy
aws s3api get-bucket-policy --bucket $BUCKET_NAME

# Vérifier le blocage d'accès public
aws s3api get-public-access-block --bucket $BUCKET_NAME

# Désactiver si nécessaire
aws s3api delete-public-access-block --bucket $BUCKET_NAME
```

### Problème : SPA routing (404 sur refresh)

**Cause** : CloudFront retourne 404 pour les routes React Router

**Solution** : Configurer les Custom Error Responses (voir section CloudFront)

### Problème : Déploiement GitHub Actions échoue

**Vérifications** :

```bash
# Tester les credentials AWS localement
aws s3 ls s3://$BUCKET_NAME
aws cloudfront list-distributions

# Vérifier les secrets GitHub
gh secret list

# Vérifier les logs du workflow
gh run list
gh run view <run-id>
```

### Problème : Image Docker trop volumineuse

**Solution** : Optimiser le Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Problème : Coûts AWS élevés

**Optimisations** :

1. **S3** :
   - Lifecycle policies pour nettoyer les anciennes versions
   - Compression activée

2. **CloudFront** :
   - Utiliser `PriceClass_100` (US, Canada, Europe)
   - Activer la compression

3. **Monitoring** :

```bash
# Vérifier les coûts S3
aws s3api list-objects --bucket $BUCKET_NAME \
  --query "sum(Contents[].Size)" \
  --output text | awk '{print $1/1024/1024 " MB"}'

# CloudFront data transfer
aws cloudfront get-distribution-statistics \
  --distribution-id $DISTRIBUTION_ID
```

---

## 📊 Monitoring et Logs

### CloudWatch Logs

Activer les logs CloudFront :

```bash
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config file://distribution-config-with-logs.json
```

### Sentry (optionnel)

Ajoutez Sentry pour le monitoring frontend :

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

### Health checks

Créez un endpoint de santé :

```typescript
// public/health.json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

## 🔗 Ressources

- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [GitHub Actions AWS](https://github.com/aws-actions)
- [GHCR Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

---

## 📝 Checklist de déploiement

- [ ] Bucket S3 créé et configuré
- [ ] CloudFront distribution créée
- [ ] Certificat SSL créé (optionnel, via ACM)
- [ ] DNS configuré (optionnel, via Route 53)
- [ ] Utilisateur IAM créé avec permissions appropriées
- [ ] Secrets GitHub configurés
- [ ] Workflow testé sur une branche de développement
- [ ] Health checks en place
- [ ] Monitoring configuré (CloudWatch, Sentry)
- [ ] Documentation d'équipe mise à jour

---

**🎉 Votre pipeline CI/CD est prêt !**

Pour toute question, consultez les logs GitHub Actions ou créez une issue.