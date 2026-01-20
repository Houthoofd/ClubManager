# 🚀 Guide de Migration - Architecture AWS avec S3

**Objectif :** Passer de EC2+Aurora (45$/mois) à S3+Lambda/EC2+RDS (15-25$/mois)  
**Économie :** 45-65% (20-30$/mois économisés)  
**Durée migration :** 4-6 heures  
**Difficulté :** ⭐⭐ Moyenne

---

## 📊 Architecture Cible

```
AVANT (45$/mois)                    APRÈS (15-25$/mois)
┌─────────────┐                     ┌─────────────┐
│   EC2       │                     │ S3 + CF     │ $2-3/mois
│  Frontend   │ $15-20/mois    →    │  Frontend   │
│  + Backend  │                     └─────────────┘
└─────────────┘                              +
      +                               ┌─────────────┐
┌─────────────┐                     │Lambda/EC2   │ $5-8/mois
│   Aurora    │ $25-30/mois    →    │  Backend    │
│   MySQL     │                     └─────────────┘
└─────────────┘                              +
                                      ┌─────────────┐
                                      │ RDS MySQL   │ $15/mois
                                      │ t4g.micro   │
                                      └─────────────┘
                                              +
                                      ┌─────────────┐
                                      │ S3 Files    │ $2/mois
                                      │ Images/Docs │
                                      └─────────────┘
```

---

## 🎯 Plan de Migration en 4 Étapes

### ✅ **Étape 1 : Préparation (30 min)**

#### 1.1 Backup complet

```bash
# 1. Backup base de données Aurora
aws rds create-db-snapshot \
  --db-instance-identifier clubmanager-aurora \
  --db-snapshot-identifier clubmanager-backup-$(date +%Y%m%d)

# 2. Backup code EC2
ssh ubuntu@votre-ec2.amazonaws.com
cd /home/ubuntu/ClubManager
tar -czf clubmanager-backup-$(date +%Y%m%d).tar.gz .
aws s3 cp clubmanager-backup-*.tar.gz s3://clubmanager-backups/

# 3. Export variables d'environnement actuelles
cat /home/ubuntu/ClubManager/.env.production > env-backup.txt
```

#### 1.2 Créer les ressources S3

```bash
# Bucket Frontend
aws s3api create-bucket \
  --bucket clubmanager-frontend \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1

# Bucket Fichiers (images, documents)
aws s3api create-bucket \
  --bucket clubmanager-files \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1

# Activer versioning (sécurité)
aws s3api put-bucket-versioning \
  --bucket clubmanager-frontend \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-versioning \
  --bucket clubmanager-files \
  --versioning-configuration Status=Enabled

# Activer chiffrement
aws s3api put-bucket-encryption \
  --bucket clubmanager-frontend \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

#### 1.3 Créer CloudFront Distribution

```bash
# Créer fichier de config
cat > cloudfront-config.json <<'EOF'
{
  "CallerReference": "clubmanager-frontend-2025",
  "Comment": "ClubManager Frontend Distribution",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-clubmanager-frontend",
      "DomainName": "clubmanager-frontend.s3.eu-west-1.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      }
    }]
  },
  "DefaultRootObject": "index.html",
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
    "Quantity": 1,
    "Items": [{
      "ErrorCode": 404,
      "ResponseCode": "200",
      "ResponsePagePath": "/index.html"
    }]
  },
  "PriceClass": "PriceClass_100"
}
EOF

# Créer la distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json

# Noter le DISTRIBUTION_ID et DOMAIN_NAME
```

---

### ✅ **Étape 2 : Migration Base de Données (1h30)**

#### 2.1 Créer RDS MySQL t4g.micro

```bash
# Créer subnet group si nécessaire
aws rds create-db-subnet-group \
  --db-subnet-group-name clubmanager-subnet \
  --db-subnet-group-description "ClubManager RDS Subnet" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Créer security group
aws ec2 create-security-group \
  --group-name clubmanager-rds-sg \
  --description "Security group for ClubManager RDS" \
  --vpc-id vpc-xxxxx

# Autoriser accès MySQL depuis backend
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 3306 \
  --source-group sg-backend-xxxxx

# Créer instance RDS
aws rds create-db-instance \
  --db-instance-identifier clubmanager-mysql \
  --db-instance-class db.t4g.micro \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username admin \
  --master-user-password "VotreMotDePasseSecure123!" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name clubmanager-subnet \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --storage-encrypted \
  --no-multi-az \
  --publicly-accessible false

# Attendre que l'instance soit disponible (10-15 min)
aws rds wait db-instance-available \
  --db-instance-identifier clubmanager-mysql

# Récupérer l'endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier clubmanager-mysql \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "RDS Endpoint: $RDS_ENDPOINT"
```

#### 2.2 Migrer les données

```bash
# 1. Exporter depuis Aurora
mysqldump -h votre-aurora.rds.amazonaws.com \
  -u admin -p \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  clubmanager > clubmanager-export.sql

# 2. Importer vers nouveau RDS
mysql -h $RDS_ENDPOINT \
  -u admin -p \
  clubmanager < clubmanager-export.sql

# 3. Vérifier les données
mysql -h $RDS_ENDPOINT -u admin -p clubmanager -e "
  SELECT 'utilisateurs' as table_name, COUNT(*) as count FROM utilisateurs
  UNION ALL
  SELECT 'inscriptions', COUNT(*) FROM inscriptions
  UNION ALL
  SELECT 'paiements', COUNT(*) FROM paiements
  UNION ALL
  SELECT 'cours', COUNT(*) FROM cours;
"

# 4. Créer base de données si nécessaire
mysql -h $RDS_ENDPOINT -u admin -p -e "
  CREATE DATABASE IF NOT EXISTS clubmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"
```

#### 2.3 Test de connexion

```javascript
// test-rds-connection.js
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.RDS_ENDPOINT,
      user: 'admin',
      password: process.env.DB_PASSWORD,
      database: 'clubmanager'
    });

    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM utilisateurs');
    console.log('✅ Connexion réussie:', rows[0].count, 'utilisateurs');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erreur connexion:', error.message);
  }
}

testConnection();
```

---

### ✅ **Étape 3 : Déployer Frontend sur S3 (1h)**

#### 3.1 Préparer le build React

```bash
cd front-end

# Mettre à jour vite.config.ts
cat > vite.config.ts <<'EOF'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@redux': resolve(__dirname, './src/redux')
      }
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'import.meta.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(env.VITE_STRIPE_PUBLIC_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'react-router-dom'],
            'redux': ['@reduxjs/toolkit', 'react-redux'],
            'ui': ['@patternfly/react-core']
          }
        }
      }
    }
  }
})
EOF

# Créer .env.production
cat > .env.production <<EOF
VITE_API_BASE_URL=https://api.clubmanager.com
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
VITE_APP_VERSION=1.0.0
EOF

# Build optimisé
npm run build

# Vérifier la taille
du -sh dist/
ls -lh dist/assets/
```

#### 3.2 Déployer sur S3

```bash
# Utiliser le script de déploiement
chmod +x ../scripts/deploy-frontend-s3.sh
../scripts/deploy-frontend-s3.sh production

# OU manuellement:
aws s3 sync dist/ s3://clubmanager-frontend/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "index.html"

# HTML sans cache
aws s3 cp dist/index.html s3://clubmanager-frontend/index.html \
  --cache-control "public, max-age=0, must-revalidate" \
  --content-type "text/html"

# Invalider CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1234ABCD5678 \
  --paths "/*"
```

#### 3.3 Configurer domaine personnalisé

```bash
# Dans Route 53, créer un record A alias
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234ABCD5678 \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.clubmanager.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d1234abcd5678.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'

# Certificat SSL (dans CloudFront)
# 1. Aller dans AWS Certificate Manager (us-east-1 OBLIGATOIRE)
# 2. Demander un certificat pour clubmanager.com et www.clubmanager.com
# 3. Valider par DNS
# 4. Attacher à CloudFront
```

---

### ✅ **Étape 4 : Backend - 2 Options**

#### **Option A : Lambda (Serverless) - Recommandé si < 500k requêtes/mois**

```bash
# Installer Serverless Framework
npm install -g serverless

cd api

# Créer serverless.yml
cat > serverless.yml <<'EOF'
service: clubmanager-api

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: eu-west-1
  stage: ${opt:stage, 'production'}
  timeout: 30
  memorySize: 512
  
  environment:
    NODE_ENV: production
    DB_HOST: ${env:RDS_ENDPOINT}
    DB_USER: admin
    DB_PASSWORD: ${env:DB_PASSWORD}
    DB_NAME: clubmanager
    JWT_SECRET: ${env:JWT_SECRET}
    STRIPE_SECRET_KEY: ${env:STRIPE_SECRET_KEY}
    S3_BUCKET_FILES: clubmanager-files
    
  vpc:
    securityGroupIds:
      - sg-xxxxx  # Security group avec accès RDS
    subnetIds:
      - subnet-xxxxx
      - subnet-yyyyy
      
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - s3:PutObject
            - s3:GetObject
            - s3:DeleteObject
          Resource: "arn:aws:s3:::clubmanager-files/*"

functions:
  api:
    handler: dist/lambda.handler
    events:
      - httpApi:
          path: /{proxy+}
          method: ANY
      - httpApi:
          path: /
          method: ANY

plugins:
  - serverless-offline

custom:
  serverless-offline:
    httpPort: 5000
EOF

# Adapter le code Express pour Lambda
cat > src/lambda.ts <<'EOF'
import serverless from 'serverless-http';
import app from './server';

export const handler = serverless(app);
EOF

# Compiler et déployer
npm run build
serverless deploy --stage production

# Noter l'URL de l'API
# Exemple: https://abc123xyz.execute-api.eu-west-1.amazonaws.com
```

**Coût Lambda :** ~$5-8/mois pour 100k-500k requêtes

#### **Option B : EC2 t4g.micro ARM (Simple)**

```bash
# Lancer instance EC2
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t4g.micro \
  --key-name your-key \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=clubmanager-backend}]'

# Attendre que l'instance démarre
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=clubmanager-backend" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Récupérer l'IP publique
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

# Se connecter
ssh ubuntu@$PUBLIC_IP

# Sur l'instance EC2
sudo apt update
sudo apt install -y docker.io docker-compose git

# Cloner le projet
git clone https://github.com/your-username/ClubManager.git
cd ClubManager

# Créer .env.production
cat > .env.production <<EOF
NODE_ENV=production
DB_HOST=$RDS_ENDPOINT
DB_USER=admin
DB_PASSWORD=VotreMotDePasseSecure123!
DB_NAME=clubmanager
JWT_SECRET=votre_jwt_secret_secure
STRIPE_SECRET_KEY=sk_live_xxxxx
S3_BUCKET_FILES=clubmanager-files
AWS_REGION=eu-west-1
EOF

# Docker Compose backend uniquement
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
    restart: always
EOF

# Configurer Nginx
mkdir -p nginx
cat > nginx/nginx.conf <<'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;

    server {
        listen 80;
        server_name api.clubmanager.com;

        # Headers sécurité
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;

        # API Backend
        location / {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check
        location /health {
            access_log off;
            proxy_pass http://backend/health;
        }
    }
}
EOF

# Lancer les services
docker-compose up -d

# Installer Certbot pour SSL
sudo snap install --classic certbot
sudo certbot --nginx -d api.clubmanager.com
```

**Coût EC2 t4g.micro :** $6-7/mois

---

## 🔧 Étape 5 : Migration Fichiers vers S3 (30 min)

```javascript
// api/src/services/S3Service.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-west-1' });
const BUCKET = process.env.S3_BUCKET_FILES || 'clubmanager-files';

export class S3Service {
  /**
   * Upload un fichier vers S3
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    const key = `${folder}/${Date.now()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'max-age=31536000', // 1 an
      Metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      }
    });

    await s3Client.send(command);
    
    // Retourner l'URL publique ou CloudFront
    return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    // ou avec CloudFront: `https://files.clubmanager.com/${key}`
  }

  /**
   * Générer URL signée (accès temporaire)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Supprimer un fichier
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key
    });

    await s3Client.send(command);
  }
}
```

```javascript
// Modifier les routes d'upload
// api/src/routes/upload.ts
import { Router } from 'express';
import multer from 'multer';
import { S3Service } from '../services/S3Service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const s3Service = new S3Service();

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const url = await s3Service.uploadFile(req.file, 'product-images');
    
    res.json({ 
      success: true, 
      url,
      filename: req.file.originalname 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
```

---

## 🧪 Étape 6 : Tests et Validation (1h)

### 6.1 Checklist de tests

```bash
# Test Frontend
curl -I https://www.clubmanager.com
# Vérifier: 200 OK, Content-Type: text/html

# Test Backend API
curl https://api.clubmanager.com/health
# Attendu: {"status":"OK"}

# Test connexion DB
curl https://api.clubmanager.com/api/v1/cours
# Vérifier: liste des cours

# Test upload fichiers
curl -X POST https://api.clubmanager.com/api/v1/upload \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "file=@test.jpg"
# Vérifier: URL S3 retournée
```

### 6.2 Tests de charge

```bash
# Installer Apache Bench
sudo apt install apache2-utils

# Test frontend (via CloudFront)
ab -n 1000 -c 10 https://www.clubmanager.com/

# Test API
ab -n 100 -c 10 https://api.clubmanager.com/api/v1/cours
```

### 6.3 Monitoring

```javascript
// api/src/routes/health.ts
import { Router } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      s3: 'unknown'
    }
  };

  try {
    // Test DB
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    await connection.execute('SELECT 1');
    await connection.end();
    health.checks.database = 'OK';
  } catch (error) {
    health.checks.database = 'ERROR';
    health.status = 'DEGRADED';
  }

  res.status(health.status === 'OK' ? 200 : 503).json(health);
});

export default router;
```

---

## 🗑️ Étape 7 : Nettoyage (après 7 jours de tests)

```bash
# Une fois la nouvelle architecture validée et stable

# 1. Supprimer EC2 ancien
aws ec2 terminate-instances --instance-ids i-old-instance-id

# 2. Supprimer Aurora (ATTENTION: backup avant!)
aws rds delete-db-instance \
  --db-instance-identifier clubmanager-aurora \
  --final-db-snapshot-identifier clubmanager-aurora-final-snapshot \
  --skip-final-snapshot  # Uniquement si vous avez déjà un backup

# 3. Supprimer Load Balancer si existant
aws elbv2 delete-load-balancer --load-balancer-arn arn:aws:...

# 4. Libérer Elastic IP si non utilisée
aws ec2 release-address --allocation-id eipalloc-xxxxx
```

---

## 💰 Récapitulatif des Coûts

### Avant Migration (45$/mois)
```
EC2 (t3.small ou t3.micro)    : $15-20/mois
Aurora MySQL                   : $25-30/mois
EBS Volumes                    : $3-5/mois
Elastic IP                     : $3.60/mois (si non utilisée)
─────────────────────────────────────────
TOTAL                          : $45-58/mois
```

### Après Migration - Option Lambda (18-25$/mois)
```
S3 Frontend (stockage + requêtes) : $1-2/mois
CloudFront CDN                     : $1-2/mois
Lambda + API Gateway               : $5-8/mois
RDS MySQL t4g.micro                : $15/mois
S3 Fichiers                        : $2-3/mois
─────────────────────────────────────────
TOTAL                              : $24-30/mois
ÉCONOMIE                           : 40-45% ($20/mois)
```

### Après Migration - Option EC2 (20-25$/mois)
```
S3 Frontend                    : $1-2/mois
CloudFront CDN                 : $1-2/mois
EC2 t4g.micro                  : $6-7/mois
RDS MySQL t4g.micro            : $15/mois
S3 Fichiers                    : $2-3/mois
─────────────────────────────────────────
TOTAL                          : $25-29/mois
ÉCONOMIE                       : 40-45% ($20/mois)
```

---

## 📊 Tableau Comparatif Final

| Critère | Avant | Après (Lambda) | Après (EC2) |
|---------|-------|----------------|-------------|
| **Coût mensuel** | $45 | $24-30 | $25-29 |
| **Frontend** | EC2 | S3+CloudFront | S3+CloudFront |
| **Backend** | EC2 | Lambda | EC2 t4g.micro |
| **Database** | Aurora | RDS MySQL | RDS MySQL |
| **CDN** | ❌ | ✅ Global | ✅ Global |
| **Auto-scaling** | ❌ | ✅ Auto | ⚠️ Manuel |
| **Maintenance** | ⚠️ Haute | ✅ Faible | ⚠️ Moyenne |
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## ✅ Checklist Post-Migration

- [ ] Frontend accessible via CloudFront
- [ ] API répond correctement
- [ ] Base de données RDS connectée
- [ ] Upload fichiers vers S3 fonctionne
- [ ] SSL/HTTPS actif
- [ ] Monitoring configuré (CloudWatch)
- [ ] Backups automatiques RDS activés
- [ ] Variables d'environnement sécurisées
- [ ] Tests de charge passés
- [ ] Documentation mise à jour
- [ ] Ancien EC2 terminé (après 7 jours)
- [ ] Aurora supprimée (après backup final)

---

## 🚨 Rollback en Cas de Problème

```bash
# Si problème critique, revenir à l'ancien système

# 1. Redémarrer l'EC2 arrêté
aws ec2 start-instances --instance-ids i-old-instance-id

# 2. Pointer le DNS vers l'ancienne IP
aws route53 change-resource-record-sets ...

# 3. Restaurer Aurora depuis snapshot
aws rds restore-db-instance-from-db-snapshot ...

# 4. Garder les nouveaux buckets S3 comme backup
```

---

## 📞 Support & Ressources

### Documentation AWS
- [S3 Static Website](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Setup](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.html)
- [RDS MySQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_MySQL.html)
- [Lambda + API Gateway](https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html)

### Outils Utiles
- **AWS CLI** : https://aws.amazon.com/cli/
- **Serverless Framework** : https://www.serverless.com/
- **AWS Cost Explorer** : Surveillez vos coûts en temps réel

### Scripts Créés
- `scripts/deploy-frontend-s3.sh` : Déploiement automatique frontend
- `scripts/backup-rds.sh` : Backup automatique RDS
- `scripts/monitor-costs.sh` : Surveillance des coûts

---

## 🎉 Résultat Final

✅ **Économie : 40-50% ($20/mois)**  
✅ **Performance améliorée** (CDN global)  
✅ **Maintenance réduite** (serverless)  
✅ **Scalabilité automatique**  
✅ **Meilleure sécurité** (S3 + CloudFront)  

**Temps de migration : 4-6 heures**  
**Période de test : 7 jours**  
**ROI : Immédiat**

🚀 **Bonne migration !**