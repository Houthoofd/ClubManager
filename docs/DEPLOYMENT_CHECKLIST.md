# ✅ Deployment Checklist - ClubManager

Guide complet pour configurer et déployer ClubManager sur AWS avec GitHub Actions.

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration AWS](#configuration-aws)
3. [Configuration GitHub](#configuration-github)
4. [Tests Locaux](#tests-locaux)
5. [Premier Déploiement](#premier-déploiement)
6. [Vérification Post-Déploiement](#vérification-post-déploiement)
7. [Configuration Optionnelle](#configuration-optionnelle)

---

## 🎯 Prérequis

### Comptes & Accès

- [ ] Compte AWS actif avec carte bancaire
- [ ] Compte GitHub avec droits admin sur le repository
- [ ] AWS CLI installé localement (`aws --version`)
- [ ] GitHub CLI installé (`gh --version`)
- [ ] Node.js ≥ 18 installé (`node --version`)
- [ ] Docker installé (`docker --version`)
- [ ] Git configuré avec SSH keys

### Connaissances Recommandées

- [ ] Bases de Git/GitHub
- [ ] Connaissance de base d'AWS
- [ ] Compréhension de Docker
- [ ] Familiarité avec CI/CD

---

## ☁️ Configuration AWS

### Étape 1 : Configuration Initiale

- [ ] **Créer un compte AWS** ou utiliser un compte existant
- [ ] **Activer MFA** sur le compte root
- [ ] **Configurer AWS CLI** :
  ```bash
  aws configure
  # AWS Access Key ID: [Votre clé]
  # AWS Secret Access Key: [Votre clé secrète]
  # Default region name: us-east-1
  # Default output format: json
  ```
- [ ] **Vérifier la connexion** :
  ```bash
  aws sts get-caller-identity
  ```

### Étape 2 : Créer le Bucket S3 (Frontend)

- [ ] **Choisir un nom de bucket** (unique globalement)
  - Format recommandé : `clubmanager-frontend-prod`
  - Région : `us-east-1` (ou votre choix)

- [ ] **Créer le bucket** :
  ```bash
  export BUCKET_NAME="clubmanager-frontend-prod"
  export AWS_REGION="us-east-1"
  
  aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION
  ```

- [ ] **Activer l'hébergement web statique** :
  ```bash
  aws s3 website s3://$BUCKET_NAME \
    --index-document index.html \
    --error-document index.html
  ```

- [ ] **Configurer la bucket policy** (accès public) :
  ```bash
  cat > /tmp/bucket-policy.json << EOF
  {
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }]
  }
  EOF
  
  aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file:///tmp/bucket-policy.json
  ```

- [ ] **Désactiver le blocage d'accès public** :
  ```bash
  aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
      BlockPublicAcls=false,\
      IgnorePublicAcls=false,\
      BlockPublicPolicy=false,\
      RestrictPublicBuckets=false
  ```

- [ ] **Activer le versioning** (pour rollback) :
  ```bash
  aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled
  ```

### Étape 3 : Créer la Distribution CloudFront

**Option A : Via la Console AWS (Recommandé pour débutants)**

- [ ] Aller sur **AWS Console → CloudFront → Create Distribution**
- [ ] **Origin Settings** :
  - Origin Domain : Sélectionner votre bucket S3
  - Origin Path : (laisser vide)
  - Name : S3-clubmanager-frontend
- [ ] **Default Cache Behavior** :
  - Viewer Protocol Policy : **Redirect HTTP to HTTPS**
  - Allowed HTTP Methods : **GET, HEAD**
  - Compress Objects Automatically : **Yes**
- [ ] **Distribution Settings** :
  - Price Class : **Use Only US, Canada and Europe** (ou All pour global)
  - Alternate Domain Names (CNAMEs) : `app.clubmanager.com` (si domaine custom)
  - SSL Certificate : **Default CloudFront Certificate** (ou custom via ACM)
  - Default Root Object : **index.html**
- [ ] **Custom Error Responses** :
  - Créer deux règles :
    1. HTTP Error Code : **404** → Response Page Path : **/index.html** → HTTP Response Code : **200**
    2. HTTP Error Code : **403** → Response Page Path : **/index.html** → HTTP Response Code : **200**
- [ ] **Cliquer sur "Create Distribution"**
- [ ] **Noter l'ID de distribution** (format : `E1234567890ABC`)
- [ ] **Noter le domaine CloudFront** (format : `d111111abcdef8.cloudfront.net`)

**Option B : Via AWS CLI**

- [ ] Créer le fichier de configuration (voir docs/AWS_DEPLOYMENT_SETUP.md)
- [ ] Exécuter la commande de création

### Étape 4 : Créer un Utilisateur IAM pour GitHub Actions

- [ ] **Créer l'utilisateur** :
  ```bash
  aws iam create-user --user-name github-actions-clubmanager
  ```

- [ ] **Créer une policy pour S3 + CloudFront** :
  ```bash
  cat > /tmp/github-policy.json << 'EOF'
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
  ```

- [ ] **Créer la policy dans IAM** :
  ```bash
  aws iam create-policy \
    --policy-name GitHubActionsClubManagerPolicy \
    --policy-document file:///tmp/github-policy.json
  ```
  **Noter l'ARN retourné** (format : `arn:aws:iam::123456789012:policy/GitHubActionsClubManagerPolicy`)

- [ ] **Attacher la policy à l'utilisateur** :
  ```bash
  # Remplacer YOUR_ACCOUNT_ID par votre Account ID AWS
  aws iam attach-user-policy \
    --user-name github-actions-clubmanager \
    --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/GitHubActionsClubManagerPolicy
  ```

- [ ] **Créer les access keys** :
  ```bash
  aws iam create-access-key --user-name github-actions-clubmanager
  ```
  **⚠️ IMPORTANT : Sauvegarder les clés affichées immédiatement !**
  - AccessKeyId : `AKIAIOSFODNN7EXAMPLE`
  - SecretAccessKey : `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

### Étape 5 : Configuration EC2 (Backend)

**Option A : Lancer une instance EC2**

- [ ] **Créer une instance EC2** :
  - AMI : Ubuntu Server 22.04 LTS
  - Instance Type : `t3.small` (ou `t3.micro` pour démarrer)
  - Key Pair : Créer ou utiliser une existante
  - Security Group : 
    - SSH (22) : Votre IP
    - HTTP (80) : 0.0.0.0/0
    - HTTPS (443) : 0.0.0.0/0
    - Custom TCP (4000) : 0.0.0.0/0 (API)
  - Storage : 20-30 GB gp3

- [ ] **Se connecter à l'instance** :
  ```bash
  ssh -i your-key.pem ubuntu@ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com
  ```

- [ ] **Installer Docker** :
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker ubuntu
  
  # Se déconnecter et reconnecter
  exit
  ssh -i your-key.pem ubuntu@...
  
  # Vérifier
  docker --version
  ```

- [ ] **Noter les informations** :
  - IP publique ou DNS : `ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com`
  - Utilisateur SSH : `ubuntu`
  - Clé privée SSH : Contenu du fichier `.pem`

### Étape 6 : Configuration RDS MySQL (Base de données)

- [ ] **Créer une instance RDS** :
  - Engine : MySQL 8.0
  - Template : Free tier (ou Production)
  - DB Instance Identifier : `clubmanager-db`
  - Master Username : `admin`
  - Master Password : (choisir un mot de passe fort)
  - Instance Class : `db.t3.micro`
  - Storage : 20 GB gp3
  - VPC : Default (ou custom)
  - Public Access : **Yes** (si EC2 dans VPC différent)
  - Security Group : Autoriser port 3306 depuis EC2

- [ ] **Noter la connection string** :
  ```
  mysql://admin:PASSWORD@clubmanager-db.xxxxx.us-east-1.rds.amazonaws.com:3306/clubmanager
  ```

---

## 🐙 Configuration GitHub

### Étape 1 : Secrets Repository

Aller dans **GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret**

#### Secrets AWS (Frontend)

- [ ] `AWS_ACCESS_KEY_ID` = La clé d'accès IAM
- [ ] `AWS_SECRET_ACCESS_KEY` = La clé secrète IAM
- [ ] `AWS_REGION` = `us-east-1` (ou votre région)
- [ ] `S3_BUCKET_NAME` = `clubmanager-frontend-prod`
- [ ] `CLOUDFRONT_DISTRIBUTION_ID` = `E1234567890ABC` (votre ID CloudFront)
- [ ] `CLOUDFRONT_DOMAIN` = `d111111abcdef8.cloudfront.net` (ou domaine custom)

#### Secrets Frontend (Build)

- [ ] `VITE_API_BASE_URL` = `https://api.clubmanager.com` (ou `http://EC2-IP:4000`)
- [ ] `VITE_STRIPE_PUBLIC_KEY` = `pk_test_51xxxxx` (clé Stripe publique)
- [ ] `VITE_SENTRY_DSN` = `https://xxxxx@sentry.io/123456` (optionnel)

#### Secrets Backend (EC2)

- [ ] `EC2_HOST` = `ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com`
- [ ] `EC2_USER` = `ubuntu`
- [ ] `EC2_SSH_PRIVATE_KEY` = (contenu entier du fichier .pem)
  ```
  -----BEGIN RSA PRIVATE KEY-----
  MIIEpAIBAAKCAQEA...
  ...
  -----END RSA PRIVATE KEY-----
  ```

#### Secrets Application

- [ ] `DATABASE_URL` = `mysql://admin:PASSWORD@HOST:3306/clubmanager`
- [ ] `JWT_SECRET` = (générer avec `openssl rand -base64 32`)
- [ ] `STRIPE_SECRET_KEY` = `sk_test_51xxxxx` (clé Stripe secrète)
- [ ] `REDIS_URL` = `redis://localhost:6379` (ou ElastiCache)
- [ ] `SENTRY_DSN` = `https://xxxxx@sentry.io/123456` (optionnel, backend)

### Étape 2 : Variables Repository

Aller dans **Secrets and variables → Actions → Variables → New repository variable**

- [ ] `DEPLOY_TARGET` = `EC2` (ou `ECS`)

### Étape 3 : Branch Protection

- [ ] **Activer la protection de la branche `main`** :
  - Settings → Branches → Add rule
  - Branch name pattern : `main`
  - ✅ Require a pull request before merging
  - ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Status checks : Sélectionner les jobs de CI

---

## 🧪 Tests Locaux

### Étape 1 : Test du Build Frontend

- [ ] **Cloner le repository** :
  ```bash
  git clone https://github.com/your-org/ClubManager.git
  cd ClubManager/front-end
  ```

- [ ] **Installer les dépendances** :
  ```bash
  npm ci
  ```

- [ ] **Créer un fichier .env.local** :
  ```bash
  VITE_API_BASE_URL=http://localhost:4000
  VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
  ```

- [ ] **Lancer les tests** :
  ```bash
  npm run lint
  npm run test
  npm run test:coverage
  ```

- [ ] **Build de production** :
  ```bash
  npm run build
  ```

- [ ] **Vérifier que le dossier `dist/` existe et contient des fichiers**

### Étape 2 : Test du Déploiement S3 Local

- [ ] **Copier le fichier d'environnement** :
  ```bash
  cd .. # Retour à la racine
  cp .env.aws.example .env.aws
  ```

- [ ] **Éditer `.env.aws`** avec vos valeurs :
  ```bash
  # AWS Configuration
  S3_BUCKET_PROD=clubmanager-frontend-prod
  CLOUDFRONT_DISTRIBUTION_ID_PROD=E1234567890ABC
  AWS_REGION=us-east-1
  ```

- [ ] **Tester le script de déploiement** (dry-run) :
  ```bash
  # Vérifier que le script est exécutable
  chmod +x scripts/deploy-to-s3.sh
  
  # Test sans déploiement réel
  DRY_RUN=true ./scripts/deploy-to-s3.sh prod
  ```

- [ ] **Déploiement réel** (si test OK) :
  ```bash
  ./scripts/deploy-to-s3.sh prod
  ```

### Étape 3 : Vérifier le Déploiement Frontend

- [ ] **Accéder au site via CloudFront** :
  ```bash
  # Ouvrir dans le navigateur
  https://d111111abcdef8.cloudfront.net
  ```

- [ ] **Vérifier** :
  - [ ] Le site s'affiche correctement
  - [ ] Les assets (CSS/JS/images) se chargent
  - [ ] Le routing fonctionne (refresh sur une sous-page)
  - [ ] HTTPS est activé

---

## 🚀 Premier Déploiement

### Étape 1 : Vérifier le Workflow

- [ ] **Vérifier que le workflow existe** :
  ```bash
  ls -la .github/workflows/ci-cd-aws.yml
  ```

- [ ] **Examiner le fichier** pour comprendre les étapes

### Étape 2 : Tester sur une Branche de Développement

- [ ] **Créer une branche de test** :
  ```bash
  git checkout -b test/deployment-setup
  ```

- [ ] **Faire un petit changement** (ex: README) :
  ```bash
  echo "Test deployment" >> README.md
  git add README.md
  git commit -m "test: verify CI/CD setup"
  ```

- [ ] **Push vers GitHub** :
  ```bash
  git push origin test/deployment-setup
  ```

- [ ] **Vérifier que le workflow se lance** :
  - Aller sur GitHub → Actions
  - Observer l'exécution du workflow
  - Vérifier que les tests passent

### Étape 3 : Premier Déploiement en Production

- [ ] **Merge vers main** (via PR ou direct) :
  ```bash
  git checkout main
  git merge test/deployment-setup
  git push origin main
  ```

- [ ] **Suivre le déploiement** :
  - GitHub → Actions → Workflow en cours
  - Observer chaque job :
    - ✅ frontend-test
    - ✅ frontend-build
    - ✅ frontend-docker
    - ✅ deploy-s3
    - ✅ api-test
    - ✅ api-build
    - ✅ api-docker
    - ✅ deploy-api
    - ✅ notify

- [ ] **Attendre la fin** (environ 8-10 minutes)

---

## ✅ Vérification Post-Déploiement

### Frontend

- [ ] **Accéder au site** :
  ```
  https://d111111abcdef8.cloudfront.net
  ou
  https://app.clubmanager.com
  ```

- [ ] **Vérifier** :
  - [ ] Page d'accueil s'affiche
  - [ ] Console browser sans erreurs
  - [ ] Assets chargés depuis CloudFront (vérifier dans Network tab)
  - [ ] Navigation fonctionne
  - [ ] Refresh sur sous-page ne donne pas 404

### Backend

- [ ] **Vérifier l'API** :
  ```bash
  curl http://EC2-IP:4000/health
  # Doit retourner : {"status":"healthy"}
  ```

- [ ] **Se connecter à EC2 et vérifier** :
  ```bash
  ssh -i your-key.pem ubuntu@EC2-IP
  
  # Vérifier que le container tourne
  docker ps
  
  # Vérifier les logs
  docker logs clubmanager-api
  
  # Vérifier la base de données
  docker exec clubmanager-api npx prisma db push --skip-generate
  ```

### Images Docker

- [ ] **Vérifier les images sur GHCR** :
  - Aller sur : `https://github.com/YOUR_ORG?tab=packages`
  - Vérifier que les packages existent :
    - `clubmanager/frontend`
    - `clubmanager/api`
  - Vérifier les tags : `latest`, `main-xxxxxx`

### Monitoring

- [ ] **CloudWatch Logs** (si configuré) :
  - AWS Console → CloudWatch → Log groups
  - Vérifier les logs de l'API

- [ ] **Sentry** (si configuré) :
  - Vérifier qu'aucune erreur n'est remontée

---

## 🎁 Configuration Optionnelle

### DNS Personnalisé (Route 53)

- [ ] **Acheter un domaine** ou utiliser un existant
- [ ] **Créer une Hosted Zone** dans Route 53
- [ ] **Créer un record A** :
  - Name : `app` (pour app.clubmanager.com)
  - Type : A - Alias
  - Alias Target : Votre distribution CloudFront
- [ ] **Mettre à jour CloudFront** :
  - Ajouter le CNAME dans Alternate Domain Names
  - Créer/attacher un certificat SSL via ACM

### Certificat SSL Custom (ACM)

- [ ] **Demander un certificat** :
  - AWS Certificate Manager (us-east-1 obligatoire pour CloudFront)
  - Domain name : `*.clubmanager.com` et `clubmanager.com`
  - Validation method : DNS
- [ ] **Valider le domaine** via les records DNS fournis
- [ ] **Attacher le certificat** à la distribution CloudFront

### ElastiCache Redis

- [ ] **Créer un cluster Redis** :
  - Engine : Redis 7
  - Node Type : cache.t3.micro
  - Number of replicas : 0 (ou 1 pour HA)
- [ ] **Noter l'endpoint** :
  ```
  redis://clustercfg.xxxxx.cache.amazonaws.com:6379
  ```
- [ ] **Mettre à jour le secret GitHub** `REDIS_URL`

### CloudWatch Alarms

- [ ] **Créer une alarme pour erreurs 4xx** :
  ```bash
  aws cloudwatch put-metric-alarm \
    --alarm-name clubmanager-high-4xx-errors \
    --metric-name 4xxErrorRate \
    --namespace AWS/CloudFront \
    --statistic Average \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2
  ```

- [ ] **Créer une alarme pour CPU EC2** :
  ```bash
  aws cloudwatch put-metric-alarm \
    --alarm-name clubmanager-ec2-high-cpu \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold
  ```

### Sentry Integration

- [ ] **Créer un compte Sentry** (sentry.io)
- [ ] **Créer un projet** pour le frontend (React)
- [ ] **Créer un projet** pour le backend (Node.js)
- [ ] **Copier les DSN** et les ajouter aux secrets GitHub
- [ ] **Vérifier l'intégration** en déclenchant une erreur de test

### Backup Automatisé

- [ ] **Activer les snapshots RDS automatiques** :
  - Retention period : 7-30 jours
  - Backup window : Heure creuse

- [ ] **Créer un bucket S3 pour backups** :
  ```bash
  aws s3 mb s3://clubmanager-backups
  ```

- [ ] **Configurer lifecycle policy** pour nettoyer les vieux backups

---

## 📝 Documentation Équipe

### À Documenter

- [ ] **Créer un Runbook** avec :
  - Procédure de déploiement
  - Procédure de rollback
  - Contacts d'urgence
  - Informations d'accès (sans secrets!)

- [ ] **Créer un document "Architecture"** :
  - Schéma de l'infrastructure
  - Explications des composants
  - Flux de données

- [ ] **Documenter les secrets** :
  - Liste des secrets nécessaires (sans valeurs!)
  - Où les trouver en cas de besoin
  - Procédure de rotation

---

## 🎉 Félicitations !

Si vous avez coché toutes les cases obligatoires, votre infrastructure est prête !

### Prochaines Étapes

1. **Former l'équipe** sur le workflow de déploiement
2. **Configurer les environnements** staging et development
3. **Mettre en place le monitoring** et alerting
4. **Planifier les backups** et disaster recovery
5. **Optimiser les coûts** en fonction de l'usage réel

### Ressources

- [Documentation Complète](./AWS_DEPLOYMENT_SETUP.md)
- [Quick Start Guide](./QUICKSTART_AWS_DEPLOYMENT.md)
- [Comparaison Options](./DEPLOYMENT_COMPARISON.md)
- [CI/CD Overview](./CI_CD_OVERVIEW.md)

### Support

En cas de problème, consultez :
1. Les logs GitHub Actions
2. La section Troubleshooting dans AWS_DEPLOYMENT_SETUP.md
3. Les logs CloudWatch
4. La communauté GitHub Discussions

---

**Happy Deploying! 🚀**