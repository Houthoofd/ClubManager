#!/bin/bash

# ============================================================================
# ClubManager - Deploy Frontend to AWS S3
# ============================================================================
# This script deploys the frontend to AWS S3 and invalidates CloudFront cache
# Usage: ./scripts/deploy-to-s3.sh [environment]
# Environments: dev, staging, prod (default: dev)
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Configuration
# ============================================================================

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/front-end"

# Load environment-specific configuration
case $ENVIRONMENT in
  prod)
    S3_BUCKET="${S3_BUCKET_PROD:-clubmanager-frontend-prod}"
    CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID_PROD}"
    API_BASE_URL="${API_BASE_URL_PROD:-https://api.clubmanager.com}"
    ;;
  staging)
    S3_BUCKET="${S3_BUCKET_STAGING:-clubmanager-frontend-staging}"
    CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID_STAGING}"
    API_BASE_URL="${API_BASE_URL_STAGING:-https://api-staging.clubmanager.com}"
    ;;
  dev)
    S3_BUCKET="${S3_BUCKET_DEV:-clubmanager-frontend-dev}"
    CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID_DEV}"
    API_BASE_URL="${API_BASE_URL_DEV:-http://localhost:4000}"
    ;;
  *)
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "Usage: $0 [dev|staging|prod]"
    exit 1
    ;;
esac

# ============================================================================
# Functions
# ============================================================================

print_header() {
  echo -e "${BLUE}"
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║         ClubManager - S3 Deployment Script                ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

print_step() {
  echo -e "${GREEN}▶ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✖ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✔ $1${NC}"
}

check_dependencies() {
  print_step "Checking dependencies..."

  local missing_deps=()

  if ! command -v node &> /dev/null; then
    missing_deps+=("node")
  fi

  if ! command -v npm &> /dev/null; then
    missing_deps+=("npm")
  fi

  if ! command -v aws &> /dev/null; then
    missing_deps+=("aws-cli")
  fi

  if [ ${#missing_deps[@]} -ne 0 ]; then
    print_error "Missing dependencies: ${missing_deps[*]}"
    exit 1
  fi

  print_success "All dependencies found"
}

check_aws_credentials() {
  print_step "Checking AWS credentials..."

  if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
  fi

  local aws_account=$(aws sts get-caller-identity --query Account --output text)
  local aws_user=$(aws sts get-caller-identity --query Arn --output text)

  print_info "AWS Account: $aws_account"
  print_info "AWS User: $aws_user"
  print_success "AWS credentials valid"
}

check_s3_bucket() {
  print_step "Checking S3 bucket..."

  if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
    print_error "S3 bucket '$S3_BUCKET' not found or not accessible"
    exit 1
  fi

  print_success "S3 bucket accessible: $S3_BUCKET"
}

build_frontend() {
  print_step "Building frontend..."

  cd "$FRONTEND_DIR"

  # Install dependencies if node_modules doesn't exist
  if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm ci
  fi

  # Clean previous build
  if [ -d "dist" ]; then
    print_info "Cleaning previous build..."
    rm -rf dist
  fi

  # Build
  print_info "Running production build..."
  VITE_API_BASE_URL="$API_BASE_URL" \
  VITE_STRIPE_PUBLIC_KEY="${VITE_STRIPE_PUBLIC_KEY}" \
  VITE_SENTRY_DSN="${VITE_SENTRY_DSN}" \
  NODE_ENV=production \
  npm run build

  # Check if build was successful
  if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    print_error "Build failed or dist directory is empty"
    exit 1
  fi

  print_success "Frontend built successfully"

  # Show build size
  local build_size=$(du -sh dist | cut -f1)
  print_info "Build size: $build_size"
}

create_backup() {
  print_step "Creating backup of current S3 content..."

  local backup_dir="$PROJECT_ROOT/backup/s3-backup-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$backup_dir"

  if aws s3 sync "s3://$S3_BUCKET" "$backup_dir" --quiet 2>/dev/null; then
    print_success "Backup created: $backup_dir"
    echo "$backup_dir" > "$PROJECT_ROOT/.last-s3-backup"
  else
    print_warning "Backup skipped (bucket might be empty)"
  fi
}

deploy_to_s3() {
  print_step "Deploying to S3..."

  cd "$FRONTEND_DIR"

  # Upload assets with long-term caching (JS, CSS, images, fonts)
  print_info "Uploading assets with long-term cache..."
  aws s3 sync ./dist "s3://$S3_BUCKET" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "*.json" \
    --exclude "service-worker.js" \
    --exclude "*.txt" \
    --metadata-directive REPLACE

  # Upload HTML files with no-cache
  print_info "Uploading HTML files with no-cache..."
  aws s3 sync ./dist "s3://$S3_BUCKET" \
    --exclude "*" \
    --include "*.html" \
    --cache-control "public, max-age=0, must-revalidate" \
    --content-type "text/html; charset=utf-8" \
    --metadata-directive REPLACE

  # Upload JSON files and service workers with short caching
  print_info "Uploading JSON and service workers..."
  aws s3 sync ./dist "s3://$S3_BUCKET" \
    --exclude "*" \
    --include "*.json" \
    --include "service-worker.js" \
    --cache-control "public, max-age=3600, must-revalidate" \
    --metadata-directive REPLACE

  # Upload text files (robots.txt, etc.)
  if ls ./dist/*.txt 1> /dev/null 2>&1; then
    print_info "Uploading text files..."
    aws s3 sync ./dist "s3://$S3_BUCKET" \
      --exclude "*" \
      --include "*.txt" \
      --cache-control "public, max-age=86400" \
      --content-type "text/plain; charset=utf-8" \
      --metadata-directive REPLACE
  fi

  print_success "Files uploaded to S3"
}

invalidate_cloudfront() {
  if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    print_warning "CloudFront Distribution ID not set, skipping invalidation"
    return 0
  fi

  print_step "Invalidating CloudFront cache..."

  local invalidation_id=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

  if [ $? -eq 0 ]; then
    print_success "CloudFront invalidation created: $invalidation_id"
    print_info "Waiting for invalidation to complete..."

    aws cloudfront wait invalidation-completed \
      --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
      --id "$invalidation_id" &

    local wait_pid=$!
    local elapsed=0

    while kill -0 $wait_pid 2>/dev/null; do
      sleep 2
      elapsed=$((elapsed + 2))
      printf "\rWaiting... ${elapsed}s"
    done

    echo ""
    print_success "CloudFront cache invalidated"
  else
    print_error "Failed to create CloudFront invalidation"
    return 1
  fi
}

verify_deployment() {
  print_step "Verifying deployment..."

  # Get S3 website endpoint
  local s3_website_endpoint=$(aws s3api get-bucket-website \
    --bucket "$S3_BUCKET" \
    --query '[WebsiteConfiguration.IndexDocument.Suffix]' \
    --output text 2>/dev/null)

  if [ -n "$s3_website_endpoint" ]; then
    local s3_url="http://$S3_BUCKET.s3-website-$(aws configure get region).amazonaws.com"
    print_info "S3 Website URL: $s3_url"
  fi

  # Get CloudFront URL
  if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    local cf_domain=$(aws cloudfront get-distribution \
      --id "$CLOUDFRONT_DISTRIBUTION_ID" \
      --query 'Distribution.DomainName' \
      --output text)

    if [ -n "$cf_domain" ]; then
      print_info "CloudFront URL: https://$cf_domain"

      # Test CloudFront endpoint
      print_info "Testing CloudFront endpoint..."
      local status_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$cf_domain" -m 10)

      if [ "$status_code" = "200" ]; then
        print_success "CloudFront endpoint is accessible (HTTP $status_code)"
      else
        print_warning "CloudFront returned HTTP $status_code"
      fi
    fi
  fi

  # Show deployed files count
  local files_count=$(aws s3 ls "s3://$S3_BUCKET" --recursive | wc -l)
  print_info "Total files deployed: $files_count"
}

print_summary() {
  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║              Deployment Summary                            ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BLUE}Environment:${NC}    $ENVIRONMENT"
  echo -e "  ${BLUE}S3 Bucket:${NC}      $S3_BUCKET"
  echo -e "  ${BLUE}API URL:${NC}        $API_BASE_URL"

  if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "  ${BLUE}CloudFront:${NC}     $CLOUDFRONT_DISTRIBUTION_ID"

    local cf_domain=$(aws cloudfront get-distribution \
      --id "$CLOUDFRONT_DISTRIBUTION_ID" \
      --query 'Distribution.DomainName' \
      --output text 2>/dev/null)

    if [ -n "$cf_domain" ]; then
      echo ""
      echo -e "  ${GREEN}🌐 Application URL:${NC}"
      echo -e "     https://$cf_domain"
    fi
  fi

  echo ""
  print_success "Deployment completed successfully! 🎉"
  echo ""
}

rollback() {
  print_step "Rolling back to previous version..."

  if [ ! -f "$PROJECT_ROOT/.last-s3-backup" ]; then
    print_error "No backup found. Cannot rollback."
    exit 1
  fi

  local backup_dir=$(cat "$PROJECT_ROOT/.last-s3-backup")

  if [ ! -d "$backup_dir" ]; then
    print_error "Backup directory not found: $backup_dir"
    exit 1
  fi

  print_info "Restoring from: $backup_dir"

  aws s3 sync "$backup_dir" "s3://$S3_BUCKET" --delete

  if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    invalidate_cloudfront
  fi

  print_success "Rollback completed"
}

# ============================================================================
# Main
# ============================================================================

main() {
  print_header

  # Check for rollback flag
  if [ "$1" = "--rollback" ] || [ "$2" = "--rollback" ]; then
    rollback
    exit 0
  fi

  print_info "Deploying to environment: $ENVIRONMENT"
  echo ""

  # Pre-deployment checks
  check_dependencies
  check_aws_credentials
  check_s3_bucket

  echo ""

  # Confirm deployment for production
  if [ "$ENVIRONMENT" = "prod" ]; then
    echo -e "${YELLOW}⚠ WARNING: You are about to deploy to PRODUCTION!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
      print_info "Deployment cancelled"
      exit 0
    fi
  fi

  # Build and deploy
  create_backup
  build_frontend
  deploy_to_s3
  invalidate_cloudfront
  verify_deployment

  # Summary
  print_summary
}

# Run main function
main "$@"
