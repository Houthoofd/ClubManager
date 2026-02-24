# 🚀 Guide CI/CD - ClubManager

**Configuration complète GitHub Actions + AWS (S3 + EC2) + GitHub Container Registry**

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis AWS](#prérequis-aws)
3. [Configuration GitHub Secrets](#configuration-github-secrets)
4. [Structure Pipeline](#structure-pipeline)
5. [Déploiement](#déploiement)
6. [Badges](#badges)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

### Architecture CI/CD

```
┌─────────────────────────────────────────────────────────────┐
│                     PUSH sur main/develop                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   GitHub Actions Pipeline      │
         └───────────────┬───────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│   FRONT-END      │            │   API/BACK-END   │
├──────────────────┤            ├──────────────────┤
│ 1. Install deps  │            │ 1. Install deps  │
│ 2. Lint          │            │ 2. Lint          │
│ 3. Tests         │            │ 3. Tests (Jest)  │
│ 4. Build Vite    │            │ 4. Build TS      │
│ 5. Deploy → S3   │            │ 5. Docker build  │
│ 6. Invalidate CF │            │ 6. Push → GHCR   │
└──────────────────┘            │ 7. Deploy → EC2  │
                                └──────────────────┘
```

### Stratégie de déploiement

- **Front-end:** S3 + CloudFront (CDN global)
- **API:** Docker image → GitHub Container Registry → EC2
- **Database:** RDS MySQL ou EC2 MySQL
- **Images Docker:** Versionnées et stockées dans GitHub Container Registry

---

## 🔧 Prérequis AWS

### 1. Créer un utilisateur IAM pour CI/CD

**Console AWS → IAM → Users → Add User**

```yaml
User name: github-actions-deployer
Access type: ✅ Programmatic access (Access key)
```

**Permissions nécessaires:**

Créer une policy custom `GitHubActionsPolicy`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3FrontendDeploy",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::clubmanager-frontend/*",
        "arn:aws:s3:::clubmanager-frontend"
      ]
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2BackendDeploy",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus"
      ],
      "Resource": "*"
    }
  ]
}
```

**Sauvegarder les credentials:**
```
AWS_ACCESS_KEY_ID: AKIA...
AWS_SECRET_ACCESS_KEY: wJalr...
```

⚠️ **IMPORTANT:** Ne JAMAIS commiter ces clés dans le code!

---

### 2. Configurer S3 Bucket (Front-end)

**Console AWS → S3 → Create Bucket**

```yaml
Bucket name: clubmanager-frontend
Region: eu-west-1 (ou votre région)
Block all public access: ❌ Désactiver
Bucket Versioning: ✅ Enable
Static website hosting: ✅ Enable
  Index document: index.html
  Error document: index.html (SPA routing)
```

**Bucket Policy (public read):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::clubmanager-frontend/*"
    }
  ]
}
```

**CORS Configuration:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

### 3. Configurer CloudFront (CDN - Optionnel mais recommandé)

**Console AWS → CloudFront → Create Distribution**

```yaml
Origin domain: clubmanager-frontend.s3.eu-west-1.amazonaws.com
Origin path: (vide)
Viewer protocol policy: Redirect HTTP to HTTPS
Allowed HTTP methods: GET, HEAD, OPTIONS
Cache policy: CachingOptimized
Price class: Use only North America and Europe
Alternate domain name (CNAME): app.clubmanager.com (si domaine custom)
SSL certificate: Default CloudFront certificate (ou custom)
Default root object: index.html
```

**Custom error responses (pour SPA routing):**

```yaml
Error code: 403
Response page path: /index.html
HTTP response code: 200

Error code: 404
Response page path: /index.html
HTTP response code: 200
```

**Sauvegarder:**
```
CLOUDFRONT_DISTRIBUTION_ID: E1234567890ABC
```

---

### 4. Configurer EC2 Instance (API)

**Console AWS → EC2 → Launch Instance**

```yaml
Name: clubmanager-api-prod
AMI: Amazon Linux 2023 AMI
Instance type: t3.small (ou t3.micro si budget serré)
Key pair: Créer nouvelle paire (clubmanager-api-key.pem)
Network settings:
  VPC: Default
  Subnet: Default
  Auto-assign public IP: Enable
Security group:
  SSH (22): Your IP
  HTTP (80): 0.0.0.0/0
  HTTPS (443): 0.0.0.0/0
  Custom TCP (4000): 0.0.0.0/0 (API port)
Storage: 20 GB gp3
```

**User data (startup script):**

```bash
#!/bin/bash
# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /home/ec2-user/clubmanager
chown ec2-user:ec2-user /home/ec2-user/clubmanager
```

**Sauvegarder:**
```
EC2_HOST: ec2-12-34-56-78.eu-west-1.compute.amazonaws.com
EC2_USER: ec2-user
EC2_SSH_KEY: (contenu de clubmanager-api-key.pem)
```

---

### 5. Configurer RDS MySQL (Recommandé) ou MySQL sur EC2

**Option A: RDS (Recommandé pour production)**

**Console AWS → RDS → Create Database**

```yaml
Engine: MySQL 8.0
Templates: Free tier (ou Production si budget)
DB instance identifier: clubmanager-db
Master username: admin
Master password: (générer mot de passe fort)
DB instance class: db.t3.micro (free tier) ou db.t3.small
Storage: 20 GB gp3
VPC: Same as EC2
Public access: No (sécurité)
VPC security group: Create new
  Inbound rule: MySQL/Aurora (3306) from EC2 security group
Initial database name: clubmanager
```

**Sauvegarder:**
```
DATABASE_URL: mysql://admin:password@clubmanager-db.xxxxx.eu-west-1.rds.amazonaws.com:3306/clubmanager
```

**Option B: MySQL sur EC2 (Budget serré)**

```bash
# Sur l'EC2
sudo yum install -y mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Sécuriser
sudo mysql_secure_installation

# Créer database
mysql -u root -p
CREATE DATABASE clubmanager;
CREATE USER 'clubmanager'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON clubmanager.* TO 'clubmanager'@'%';
FLUSH PRIVILEGES;
```

---

## 🔐 Configuration GitHub Secrets

**Repository → Settings → Secrets and variables → Actions → New repository secret**

### Secrets AWS

```yaml
AWS_ACCESS_KEY_ID
  Value: AKIA... (de l'utilisateur IAM)

AWS_SECRET_ACCESS_KEY
  Value: wJalr... (de l'utilisateur IAM)

AWS_REGION
  Value: eu-west-1

AWS_S3_BUCKET
  Value: clubmanager-frontend

AWS_CLOUDFRONT_DISTRIBUTION_ID
  Value: E1234567890ABC (si CloudFront configuré)
```

### Secrets EC2

```yaml
EC2_HOST
  Value: ec2-12-34-56-78.eu-west-1.compute.amazonaws.com

EC2_USER
  Value: ec2-user

EC2_SSH_KEY
  Value: |
    -----BEGIN RSA PRIVATE KEY-----
    (contenu complet du fichier .pem)
    -----END RSA PRIVATE KEY-----
```

### Secrets Application

```yaml
DATABASE_URL
  Value: mysql://admin:password@clubmanager-db.xxxxx.rds.amazonaws.com:3306/clubmanager

JWT_SECRET
  Value: (générer token aléatoire 64 caractères)

STRIPE_SECRET_KEY
  Value: sk_live_... ou sk_test_...

SENDGRID_API_KEY
  Value: SG.xxxxx...

SENTRY_DSN
  Value: https://xxx@o123.ingest.sentry.io/456
```

### Secrets GitHub Container Registry

```yaml
GHCR_TOKEN
  Value: (GitHub Personal Access Token)
  
  Comment créer:
  1. GitHub → Settings → Developer settings
  2. Personal access tokens → Tokens (classic)
  3. Generate new token
  4. Scopes: ✅ write:packages, ✅ read:packages, ✅ delete:packages
  5. Copy token
```

---

## 📝 Fichiers de Configuration CI/CD

### 1. Workflow Principal

Créer `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ============================================================================
  # FRONT-END
  # ============================================================================
  frontend-test:
    name: 🎨 Front-end - Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./front-end
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
      
      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: front-end/package-lock.json
      
      - name: 📦 Install dependencies
        run: npm ci
      
      - name: 🔍 Lint
        run: npm run lint
      
      - name: 🧪 Run tests
        run: npm run test:run
      
      - name: 📊 Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./front-end/coverage/lcov.info
          flags: frontend
          name: frontend-coverage

  frontend-build:
    name: 🎨 Front-end - Build
    needs: frontend-test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./front-end
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
      
      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: front-end/package-lock.json
      
      - name: 📦 Install dependencies
        run: npm ci
      
      - name: 🏗️ Build
        run: npm run build
        env:
          VITE_API_BASE_URL: https://api.clubmanager.com
          VITE_STRIPE_PUBLIC_KEY: ${{ secrets.STRIPE_PUBLIC_KEY }}
      
      - name: 📤 Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: front-end/dist
          retention-days: 1

  frontend-deploy:
    name: 🎨 Front-end - Deploy to S3
    needs: frontend-build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - name: 📥 Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: frontend-dist
          path: dist
      
      - name: 🔑 Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: 🚀 Deploy to S3
        run: |
          aws s3 sync dist/ s3://${{ secrets.AWS_S3_BUCKET }}/ \
            --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "index.html" \
            --exclude "*.html"
          
          # HTML files with no cache (SPA routing)
          aws s3 sync dist/ s3://${{ secrets.AWS_S3_BUCKET }}/ \
            --exclude "*" \
            --include "*.html" \
            --cache-control "no-cache"
      
      - name: 🔄 Invalidate CloudFront cache
        if: ${{ secrets.AWS_CLOUDFRONT_DISTRIBUTION_ID }}
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.AWS_CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

  # ============================================================================
  # API/BACK-END
  # ============================================================================
  api-test:
    name: 🔧 API - Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./api
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: clubmanager_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
      
      redis:
        image: redis:alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
      
      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: api/package-lock.json
      
      - name: 📦 Install dependencies
        run: npm ci
      
      - name: 🗄️ Generate Prisma client
        run: npx prisma generate
      
      - name: 🗄️ Run migrations
        run: npx prisma db push
        env:
          DATABASE_URL: mysql://root:test@localhost:3306/clubmanager_test
      
      - name: 🔍 Lint
        run: npm run lint
      
      - name: 🧪 Run tests
        run: npm test
        env:
          NODE_ENV: test
          DATABASE_URL: mysql://root:test@localhost:3306/clubmanager_test
          REDIS_URL: redis://localhost:6379

  api-build:
    name: 🔧 API - Build & Push Docker
    needs: api-test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
      
      - name: 🔑 Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: 📝 Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-api
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: 🏗️ Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./api
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-api:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-api:buildcache,mode=max

  api-deploy:
    name: 🔧 API - Deploy to EC2
    needs: api-build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
      
      - name: 🔑 Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.EC2_SSH_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts
      
      - name: 🚀 Deploy to EC2
        run: |
          ssh ${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }} << 'EOF'
            # Login to GitHub Container Registry
            echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            
            # Pull latest image
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-api:latest
            
            # Stop and remove old container
            docker stop clubmanager-api || true
            docker rm clubmanager-api || true
            
            # Run new container
            docker run -d \
              --name clubmanager-api \
              --restart unless-stopped \
              -p 4000:4000 \
              -e DATABASE_URL="${{ secrets.DATABASE_URL }}" \
              -e JWT_SECRET="${{ secrets.JWT_SECRET }}" \
              -e STRIPE_SECRET_KEY="${{ secrets.STRIPE_SECRET_KEY }}" \
              -e SENDGRID_API_KEY="${{ secrets.SENDGRID_API_KEY }}" \
              -e SENTRY_DSN="${{ secrets.SENTRY_DSN }}" \
              -e NODE_ENV=production \
              ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-api:latest
            
            # Cleanup old images
            docker image prune -af --filter "until=24h"
          EOF
      
      - name: ✅ Verify deployment
        run: |
          sleep 10
          curl -f http://${{ secrets.EC2_HOST }}:4000/health || exit 1
```

---

### 2. Dockerfile API optimisé

Créer `api/Dockerfile`:

```dockerfile
# ============================================================================
# Builder Stage
# ============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ============================================================================
# Production Stage
# ============================================================================
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/graphql-server.js"]
```

---

### 3. Docker Compose pour EC2

Créer `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api:
    image: ghcr.io/[username]/clubmanager-api:latest
    container_name: clubmanager-api
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - SENTRY_DSN=${SENTRY_DSN}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - clubmanager

  redis:
    image: redis:7-alpine
    container_name: clubmanager-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - clubmanager

volumes:
  redis_data:

networks:
  clubmanager:
    driver: bridge
```

---

### 4. Nginx Reverse Proxy (Optionnel mais recommandé)

Si vous voulez avoir `api.clubmanager.com` avec SSL:

Créer `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server clubmanager-api:4000;
    }

    server {
        listen 80;
        server_name api.clubmanager.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.clubmanager.com;

        # SSL certificates (Let's Encrypt)
        ssl_certificate /etc/letsencrypt/live/api.clubmanager.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.clubmanager.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        location / {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /health {
            access_log off;
            proxy_pass http://api/health;
        }
    }
}
```

---

## 🎨 Badges pour README

Ajouter dans `README.md`:

```markdown
# 🏀 ClubManager

[![CI/CD](https://github.com/[username]/ClubManager/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/[username]/ClubManager/actions/workflows/ci-cd.yml)
[![Frontend Coverage](https://codecov.io/gh/[username]/ClubManager/branch/main/graph/badge.svg?flag=frontend)](https://codecov.io/gh/[username]/ClubManager)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/[username]/ClubManager/pkgs/container/clubmanager-api)

Production: https://app.clubmanager.com
API: https://api.clubmanager.com
```

---

## 🚨 Troubleshooting

### Erreur: "Permission denied (publickey)"

```bash
# Vérifier que la clé SSH est correctement configurée
ssh -i ~/.ssh/clubmanager-api-key.pem ec2-user@[EC2_HOST]

# Si erreur permissions:
chmod 600 ~/.ssh/clubmanager-api-key.pem
```

### Erreur: Docker login failed

```bash
# Créer un nouveau Personal Access Token
# GitHub → Settings → Developer settings → Personal access tokens
# Scopes: write:packages, read:packages
# Copier dans secret GHCR_TOKEN
```

### Front-end ne se charge pas après déploiement S3

```bash
# Vérifier CORS
aws s3api get-bucket-cors --bucket clubmanager-frontend

# Vérifier permissions
aws s3api get-bucket-policy --bucket clubmanager-frontend

# Test direct
curl https://clubmanager-frontend.s3.amazonaws.com/index.html
```

### API ne démarre pas sur EC2

```bash
# SSH vers EC2
ssh -i key.pem ec2-user@[EC2_HOST]

# Vérifier logs Docker
docker logs clubmanager-api

# Vérifier variables env
docker inspect clubmanager-api | grep -A 20 Env

# Tester connexion DB
docker exec -it clubmanager-api sh
npx prisma db pull
```

---

## 📊 Coûts AWS Estimés

### Configuration minimale (TFE)

```
EC2 t3.micro:           ~$8/mois
RDS db.t3.micro:        ~$15/mois (ou $0 si MySQL sur EC2)
S3 (50GB + 10k req):    ~$2/mois
CloudFront (10GB):      ~$1/mois (optionnel)
-------------------------------------------
TOTAL:                  ~$26/mois (ou $10 sans RDS)
```

### Configuration recommandée (production)

```
EC2 t3.small:           ~$16/mois
RDS db.t3.small:        ~$30/mois
S3 + CloudFront:        ~$5/mois
Load Balancer:          ~$20/mois
-------------------------------------------
TOTAL:                  ~$70/mois
```

### Free Tier AWS (12 mois)

```
✅ 750h EC2 t2.micro/mois (gratuit)
✅ 750h RDS db.t2.micro/mois (gratuit)
✅ 5GB S3 storage (gratuit)
✅ 20,000 Get requests S3 (gratuit)
```

**Astuce TFE:** Utilisez le free tier pendant 12 mois!

---

## ✅ Checklist Déploiement

```
Préparation:
□ Compte AWS créé
□ Utilisateur IAM configuré
□ Bucket S3 créé
□ EC2 instance lancée
□ RDS database créée (ou MySQL sur EC2)
□ Secrets GitHub configurés

Configuration:
□ Workflow CI/CD créé (.github/workflows/ci-cd.yml)
□ Dockerfile API optimisé
□ docker-compose.prod.yml configuré
□ Variables environnement définies

Tests:
□ Push vers GitHub déclenche pipeline
□ Tests passent (front + API)
□ Build réussit
□ Images Docker créées dans GHCR
□ Déploiement S3 OK
□ Déploiement EC2 OK
□ Application accessible

Production:
□ Domaine configuré (optionnel)
□ SSL/TLS activé
□ CloudFront configuré
□ Monitoring Sentry actif
□ Backups configurés
□ Logs centralisés
```

---

## 📚 Ressources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [AWS S3 Static Website](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Bon déploiement! 🚀**