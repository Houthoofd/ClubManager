# 🚀 Quick Start - AWS S3 Deployment avec GitHub Actions

Guide rapide pour déployer ClubManager sur AWS S3 avec GitHub Actions et GHCR.

---

## ⚡ Déploiement en 5 minutes

### 1️⃣ Créer le bucket S3

```bash
# Définir les variables
export BUCKET_NAME="clubmanager-frontend-prod"
export AWS_REGION="us-east-1"

# Créer le bucket
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

# Activer l'hébergement web statique
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

# Rendre le bucket public
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
  }]
}'
```

### 2️⃣ Créer CloudFront (optionnel mais recommandé)

```bash
# Via la console AWS :
# 1. CloudFront → Create Distribution
# 2. Origin: Sélectionner votre bucket S3
# 3. Viewer Protocol Policy: Redirect HTTP to HTTPS
# 4. Default Root Object: index.html
# 5. Custom Error Responses: 404 → /index.html (200)

# Récupérer l'ID de distribution
export DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[0].Id" \
  --output text)

echo "Distribution ID: $DISTRIBUTION_ID"
```

### 3️⃣ Créer un utilisateur IAM pour GitHub Actions

```bash
# Créer l'utilisateur
aws iam create-user --user-name github-actions-clubmanager

# Créer et attacher une policy
cat > /tmp/policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:*"],
      "Resource": [
        "arn:aws:s3:::clubmanager-frontend-prod",
        "arn:aws:s3:::clubmanager-frontend-prod/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-user-policy \
  --user-name github-actions-clubmanager \
  --policy-name S3CloudFrontAccess \
  --policy-document file:///tmp/policy.json

# Créer les access keys
aws iam create-access-key --user-name github-actions-clubmanager
```

**⚠️ Sauvegardez les clés affichées !**

### 4️⃣ Configurer les secrets GitHub

Allez dans votre repo GitHub : **Settings → Secrets and variables → Actions → New repository secret**

Ajoutez ces secrets :

| Secret | Valeur |
|--------|--------|
| `AWS_ACCESS_KEY_ID` | La clé d'accès IAM |
| `AWS_SECRET_ACCESS_KEY` | La clé secrète IAM |
| `AWS_REGION` | `us-east-1` (ou votre région) |
| `S3_BUCKET_NAME` | `clubmanager-frontend-prod` |
| `CLOUDFRONT_DISTRIBUTION_ID` | L'ID de votre distribution CloudFront |

**Secrets optionnels pour le frontend :**

| Secret | Description |
|--------|-------------|
| `VITE_API_BASE_URL` | URL de votre API (ex: `https://api.clubmanager.com`) |
| `VITE_STRIPE_PUBLIC_KEY` | Clé publique Stripe |
| `VITE_SENTRY_DSN` | DSN Sentry pour monitoring |

### 5️⃣ Activer le workflow GitHub Actions

Le workflow `.github/workflows/ci-cd-aws.yml` est déjà configuré !

**Déployer maintenant :**

```bash
# Commit et push vers main
git add .
git commit -m "feat: configure AWS S3 deployment"
git push origin main
```

Le déploiement se lancera automatiquement ! 🎉

---

## 📦 Workflow de déploiement

```
┌─────────────────────┐
│  Push vers main     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  1. Tests Frontend  │
│  2. Build Frontend  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  3. Docker → GHCR   │ (backup/versioning)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  4. Upload → S3     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  5. Invalider CF    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ✅ Déployé !       │
└─────────────────────┘
```

---

## 🧪 Tester localement avant GitHub Actions

### Option 1 : Script de déploiement

```bash
# Rendre le script exécutable
chmod +x scripts/deploy-to-s3.sh

# Créer un fichier .env.aws avec vos credentials
cp .env.aws.example .env.aws
# Éditer .env.aws avec vos valeurs

# Déployer en dev
./scripts/deploy-to-s3.sh dev

# Déployer en production (avec confirmation)
./scripts/deploy-to-s3.sh prod
```

### Option 2 : Commandes manuelles

```bash
# Se placer dans le répertoire frontend
cd front-end

# Build
npm run build

# Sync vers S3
aws s3 sync ./dist s3://clubmanager-frontend-prod --delete

# Invalider CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

---

## 🔄 Environnements multiples

### Structure recommandée

```
dev      → clubmanager-frontend-dev      → d111111abcdef8.cloudfront.net
staging  → clubmanager-frontend-staging  → d222222abcdef8.cloudfront.net
prod     → clubmanager-frontend-prod     → app.clubmanager.com
```

### Configuration dans GitHub

**Utiliser des environnements GitHub :**

1. **Settings → Environments → New environment**
2. Créer `development`, `staging`, `production`
3. Ajouter des secrets spécifiques à chaque environnement
4. Configurer des protection rules pour `production`

**Modifier le workflow pour utiliser les environnements :**

```yaml
deploy-s3:
  name: 🚀 Deploy to AWS S3
  runs-on: ubuntu-latest
  environment: production  # <- Ajouter ceci
  needs: [frontend-build, frontend-docker]
  # ... reste du job
```

---

## 🎯 Déploiement API (Backend)

### Option A : EC2 avec Docker

**1. Préparer l'instance EC2 :**

```bash
# Se connecter à EC2
ssh -i your-key.pem ubuntu@ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Se déconnecter et reconnecter
exit
```

**2. Configurer les secrets GitHub pour EC2 :**

| Secret | Valeur |
|--------|--------|
| `EC2_HOST` | IP publique ou DNS de l'instance |
| `EC2_USER` | `ubuntu` (ou `ec2-user` pour Amazon Linux) |
| `EC2_SSH_PRIVATE_KEY` | Contenu de votre clé `.pem` |
| `DATABASE_URL` | URL de connexion MySQL |
| `JWT_SECRET` | Secret pour JWT |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `REDIS_URL` | URL Redis |

**3. Configurer la variable :**

Dans **Settings → Secrets and variables → Actions → Variables** :

| Variable | Valeur |
|----------|--------|
| `DEPLOY_TARGET` | `EC2` |

### Option B : ECS/Fargate

**1. Créer un cluster ECS :**

```bash
aws ecs create-cluster --cluster-name clubmanager-cluster
```

**2. Configurer les secrets :**

| Secret | Valeur |
|--------|--------|
| `ECS_CLUSTER_NAME` | `clubmanager-cluster` |
| `ECS_SERVICE_NAME` | `clubmanager-api-service` |

**3. Variable de déploiement :**

| Variable | Valeur |
|----------|--------|
| `DEPLOY_TARGET` | `ECS` |

---

## 🔐 Sécurité - Checklist

- [ ] ✅ Utiliser HTTPS via CloudFront
- [ ] ✅ Activer S3 encryption at rest
- [ ] ✅ Utiliser IAM roles avec privilèges minimaux
- [ ] ✅ Activer CloudFront WAF (optionnel)
- [ ] ✅ Configurer CORS correctement
- [ ] ✅ Activer CloudWatch Logs
- [ ] ✅ Utiliser AWS Secrets Manager pour les secrets sensibles
- [ ] ✅ Activer MFA sur le compte AWS
- [ ] ✅ Configurer S3 bucket policies restrictives
- [ ] ✅ Activer versioning S3 pour rollback

---

## 💰 Estimation des coûts

### Petit site (< 10k visiteurs/mois)

| Service | Coût estimé |
|---------|-------------|
| S3 Storage (5 GB) | ~$0.12/mois |
| S3 Requests | ~$0.05/mois |
| CloudFront (10 GB transfer) | ~$1.00/mois |
| Route 53 (optionnel) | ~$0.50/mois |
| **Total** | **~$1.70/mois** |

### Site moyen (100k visiteurs/mois)

| Service | Coût estimé |
|---------|-------------|
| S3 Storage (10 GB) | ~$0.24/mois |
| S3 Requests | ~$0.50/mois |
| CloudFront (100 GB transfer) | ~$8.50/mois |
| Route 53 | ~$0.50/mois |
| **Total** | **~$9.74/mois** |

**💡 Astuce : Utiliser `PriceClass_100` (US + Europe) réduit les coûts CloudFront de ~30%**

---

## 🐛 Troubleshooting rapide

### Problème : 403 Forbidden

```bash
# Vérifier la bucket policy
aws s3api get-bucket-policy --bucket $BUCKET_NAME

# Vérifier le blocage d'accès public
aws s3api get-public-access-block --bucket $BUCKET_NAME

# Corriger si nécessaire
aws s3api delete-public-access-block --bucket $BUCKET_NAME
```

### Problème : Les changements ne sont pas visibles

```bash
# Invalider le cache CloudFront
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Problème : 404 sur refresh (SPA routing)

**Solution :** Configurer les Custom Error Responses dans CloudFront :
- Error Code: `404`
- Response Page Path: `/index.html`
- HTTP Response Code: `200`

### Problème : GitHub Actions échoue

```bash
# Vérifier les secrets localement
aws sts get-caller-identity

# Tester l'accès S3
aws s3 ls s3://$BUCKET_NAME

# Voir les logs du workflow
gh run list
gh run view <run-id> --log
```

---

## 📊 Monitoring

### CloudWatch Metrics

```bash
# Créer un dashboard CloudWatch
aws cloudwatch put-dashboard \
  --dashboard-name ClubManager \
  --dashboard-body file://cloudwatch-dashboard.json
```

### Logs CloudFront

Activer les logs dans la console CloudFront → Edit Distribution → Logging.

### Alerts

```bash
# Créer une alarme pour les erreurs 4xx
aws cloudwatch put-metric-alarm \
  --alarm-name clubmanager-high-4xx-errors \
  --metric-name 4xxErrorRate \
  --namespace AWS/CloudFront \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

---

## 🔄 Rollback en cas de problème

### Méthode 1 : Via script

```bash
./scripts/deploy-to-s3.sh --rollback
```

### Méthode 2 : Via GHCR

```bash
# Lister les versions disponibles
gh api /user/packages/container/clubmanager%2Ffrontend/versions

# Redéployer une version précédente
docker pull ghcr.io/YOUR_ORG/clubmanager/frontend:main-abc1234
# Extraire et uploader vers S3
```

### Méthode 3 : Via S3 Versioning

```bash
# Activer le versioning (si pas déjà fait)
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Lister les versions
aws s3api list-object-versions --bucket $BUCKET_NAME

# Restaurer une version
aws s3api copy-object \
  --bucket $BUCKET_NAME \
  --copy-source $BUCKET_NAME/index.html?versionId=VERSION_ID \
  --key index.html
```

---

## 🎓 Ressources supplémentaires

- 📖 [Documentation complète](./AWS_DEPLOYMENT_SETUP.md)
- 🐙 [GitHub Actions Documentation](https://docs.github.com/actions)
- ☁️ [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- 🌐 [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- 🐳 [GHCR Documentation](https://docs.github.com/packages)

---

## ✅ Checklist complète de déploiement

### Infrastructure AWS
- [ ] Bucket S3 créé
- [ ] Hébergement web statique activé sur S3
- [ ] Bucket policy configurée (public read)
- [ ] CloudFront distribution créée
- [ ] Custom Error Responses configurées (404 → index.html)
- [ ] SSL/TLS activé (HTTPS)
- [ ] Utilisateur IAM créé pour GitHub Actions
- [ ] Access keys générées

### GitHub Configuration
- [ ] Secrets configurés (`AWS_ACCESS_KEY_ID`, etc.)
- [ ] Workflow testé sur une branche de dev
- [ ] Protection de branche `main` activée
- [ ] Environnements GitHub configurés (optionnel)

### Application
- [ ] Variables d'environnement configurées (`VITE_API_BASE_URL`, etc.)
- [ ] Build frontend testé localement
- [ ] Tests passent en CI
- [ ] Linting configuré

### Monitoring & Sécurité
- [ ] Sentry configuré (optionnel)
- [ ] CloudWatch logs activés
- [ ] S3 encryption activée
- [ ] CloudFront logging activé
- [ ] Versioning S3 activé (pour rollback)

### Documentation
- [ ] README mis à jour
- [ ] Runbook de déploiement documenté
- [ ] Procédure de rollback documentée

---

## 🚀 C'est parti !

Vous êtes prêt à déployer ! Faites un push vers `main` et regardez la magie opérer :

```bash
git add .
git commit -m "chore: configure AWS S3 deployment"
git push origin main
```

Allez dans **GitHub → Actions** pour suivre le déploiement en temps réel ! 🎉

---

**Questions ? Problèmes ?** Consultez la [documentation complète](./AWS_DEPLOYMENT_SETUP.md) ou les logs GitHub Actions.