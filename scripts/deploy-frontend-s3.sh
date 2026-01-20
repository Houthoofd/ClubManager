#!/bin/bash

# 🚀 Script de déploiement Frontend ClubManager vers S3 + CloudFront
# Usage: ./scripts/deploy-frontend-s3.sh [environment]
# Exemple: ./scripts/deploy-frontend-s3.sh production

set -e  # Exit on error

# ========================================
# CONFIGURATION
# ========================================

ENVIRONMENT=${1:-production}
FRONTEND_DIR="front-end"
BUILD_DIR="$FRONTEND_DIR/dist"

# Variables S3/CloudFront (à configurer dans .env ou GitHub Secrets)
S3_BUCKET="${S3_BUCKET:-clubmanager-frontend-${ENVIRONMENT}}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID}"
AWS_REGION="${AWS_REGION:-eu-west-1}"

# Couleurs pour logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# FONCTIONS UTILITAIRES
# ========================================

log_info() {
    echo -e "${BLUE}ℹ️  [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}❌ [ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Vérification des dépendances..."

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI n'est pas installé"
        echo "Installez-le via: https://aws.amazon.com/cli/"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi

    log_success "Toutes les dépendances sont présentes"
}

check_aws_credentials() {
    log_info "Vérification des credentials AWS..."

    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "Credentials AWS invalides ou manquantes"
        echo "Configurez-les via: aws configure"
        exit 1
    fi

    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log_success "Connecté au compte AWS: $ACCOUNT_ID"
}

check_s3_bucket() {
    log_info "Vérification du bucket S3: $S3_BUCKET..."

    if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
        log_warning "Le bucket $S3_BUCKET n'existe pas"
        read -p "Voulez-vous le créer ? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            create_s3_bucket
        else
            log_error "Bucket S3 requis pour le déploiement"
            exit 1
        fi
    else
        log_success "Bucket S3 trouvé"
    fi
}

create_s3_bucket() {
    log_info "Création du bucket S3: $S3_BUCKET..."

    # Créer le bucket
    if [ "$AWS_REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION"
    else
        aws s3api create-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION"
    fi

    # Activer le versioning
    aws s3api put-bucket-versioning \
        --bucket "$S3_BUCKET" \
        --versioning-configuration Status=Enabled

    # Activer le chiffrement
    aws s3api put-bucket-encryption \
        --bucket "$S3_BUCKET" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'

    # Configurer pour website hosting
    aws s3 website "s3://$S3_BUCKET/" \
        --index-document index.html \
        --error-document index.html

    # Politique publique pour CloudFront
    cat > /tmp/bucket-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "AllowCloudFrontAccess",
        "Effect": "Allow",
        "Principal": {
            "Service": "cloudfront.amazonaws.com"
        },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }]
}
EOF

    aws s3api put-bucket-policy \
        --bucket "$S3_BUCKET" \
        --policy file:///tmp/bucket-policy.json

    rm /tmp/bucket-policy.json

    log_success "Bucket S3 créé et configuré"
}

build_frontend() {
    log_info "Build du frontend React (environment: $ENVIRONMENT)..."

    cd "$FRONTEND_DIR"

    # Installer les dépendances si nécessaire
    if [ ! -d "node_modules" ]; then
        log_info "Installation des dépendances..."
        npm ci --prefer-offline --no-audit
    fi

    # Build avec variables d'environnement
    log_info "Compilation du frontend..."

    if [ "$ENVIRONMENT" = "production" ]; then
        NODE_ENV=production npm run build
    else
        NODE_ENV=development npm run build
    fi

    cd ..

    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Le dossier de build n'existe pas: $BUILD_DIR"
        exit 1
    fi

    # Afficher la taille du build
    BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    log_success "Build terminé (taille: $BUILD_SIZE)"
}

optimize_build() {
    log_info "Optimisation du build..."

    # Compresser les fichiers pour S3
    find "$BUILD_DIR" -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" \) \
        -exec gzip -9 -k {} \;

    log_success "Fichiers compressés avec gzip"
}

sync_to_s3() {
    log_info "Synchronisation vers S3: s3://$S3_BUCKET..."

    # Backup de la version actuelle (optionnel)
    if aws s3 ls "s3://$S3_BUCKET/index.html" &> /dev/null; then
        log_info "Création d'un backup de la version actuelle..."
        BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
        aws s3 sync "s3://$S3_BUCKET/" "s3://$S3_BUCKET-backup-$BACKUP_DATE/" --quiet
        log_success "Backup créé: s3://$S3_BUCKET-backup-$BACKUP_DATE/"
    fi

    # Sync avec cache-control optimisé
    log_info "Upload des fichiers..."

    # HTML files - pas de cache (max-age=0)
    aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET/" \
        --exclude "*" \
        --include "*.html" \
        --cache-control "public, max-age=0, must-revalidate" \
        --content-type "text/html" \
        --metadata-directive REPLACE \
        --delete

    # CSS/JS files - cache 1 an (versionné par Vite)
    aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET/" \
        --exclude "*" \
        --include "*.css" \
        --include "*.js" \
        --cache-control "public, max-age=31536000, immutable" \
        --metadata-directive REPLACE \
        --delete

    # Images - cache 1 mois
    aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET/" \
        --exclude "*" \
        --include "*.png" \
        --include "*.jpg" \
        --include "*.jpeg" \
        --include "*.gif" \
        --include "*.svg" \
        --include "*.webp" \
        --cache-control "public, max-age=2592000" \
        --metadata-directive REPLACE \
        --delete

    # Autres fichiers
    aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET/" \
        --exclude "*.html" \
        --exclude "*.css" \
        --exclude "*.js" \
        --exclude "*.png" \
        --exclude "*.jpg" \
        --exclude "*.jpeg" \
        --exclude "*.gif" \
        --exclude "*.svg" \
        --exclude "*.webp" \
        --cache-control "public, max-age=86400" \
        --metadata-directive REPLACE \
        --delete

    log_success "Synchronisation terminée"
}

invalidate_cloudfront() {
    if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        log_warning "CLOUDFRONT_DISTRIBUTION_ID non défini, skip invalidation"
        return
    fi

    log_info "Invalidation du cache CloudFront..."

    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)

    log_success "Invalidation créée: $INVALIDATION_ID"
    log_info "Le cache sera vidé dans ~5-10 minutes"
}

print_deployment_info() {
    echo ""
    echo "========================================"
    log_success "🎉 DÉPLOIEMENT TERMINÉ"
    echo "========================================"
    echo ""
    echo "📦 Bucket S3:      s3://$S3_BUCKET"
    echo "🌍 Region:         $AWS_REGION"
    echo "🌐 Environment:    $ENVIRONMENT"

    if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
            --id "$CLOUDFRONT_DISTRIBUTION_ID" \
            --query 'Distribution.DomainName' \
            --output text)
        echo "☁️  CloudFront:     https://$CLOUDFRONT_DOMAIN"
    fi

    echo ""
    echo "🔗 URL S3 Direct:  http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
    echo ""
    echo "⏱️  Temps écoulé:   ${SECONDS}s"
    echo "========================================"
}

# ========================================
# SCRIPT PRINCIPAL
# ========================================

main() {
    echo "========================================"
    echo "🚀 Déploiement Frontend ClubManager"
    echo "========================================"
    echo ""

    # Vérifications
    check_dependencies
    check_aws_credentials
    check_s3_bucket

    # Build & Deploy
    build_frontend
    # optimize_build  # Optionnel: décommentez pour activer gzip
    sync_to_s3
    invalidate_cloudfront

    # Résumé
    print_deployment_info
}

# Exécuter le script
main

exit 0
