#!/bin/bash

# Script d'exécution des tests d'authentification - Linux/macOS
# Usage: ./run-auth-tests.sh [option]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME_TEST="clubmanager_test"
DB_NAME_PROD="clubmanager"

# Functions
print_header() {
    echo -e "\n${BLUE}==================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if MySQL is running
check_mysql() {
    print_info "Vérification de MySQL..."

    if command -v mysql &> /dev/null; then
        if mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} -e "SELECT 1;" &> /dev/null; then
            print_success "MySQL est accessible"
            return 0
        else
            print_error "MySQL n'est pas accessible"
            return 1
        fi
    else
        print_error "Commande mysql non trouvée"
        return 1
    fi
}

# Setup test database
setup_test_db() {
    print_header "Configuration de la base de données de test"

    if ! check_mysql; then
        print_error "MySQL n'est pas disponible. Veuillez le démarrer."
        print_info "Ubuntu/Debian: sudo systemctl start mysql"
        print_info "macOS: brew services start mysql"
        exit 1
    fi

    # Drop and create test database
    print_info "Création de la base de données $DB_NAME_TEST..."
    mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} -e "DROP DATABASE IF EXISTS $DB_NAME_TEST; CREATE DATABASE $DB_NAME_TEST CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
        print_error "Impossible de créer la base de données"
        exit 1
    }
    print_success "Base de données créée"

    # Import schema from production database
    print_info "Import du schéma depuis la base de production..."
    if [ -f "../db/clubmanager.sql" ]; then
        mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME_TEST" < ../db/clubmanager.sql || {
            print_error "Impossible d'importer le schéma"
            exit 1
        }
        print_success "Schéma importé"
    else
        print_warning "Fichier db/clubmanager.sql non trouvé, utilisation du dump"
        mysqldump -h"$DB_HOST" -u"$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} --no-data "$DB_NAME_PROD" | mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME_TEST" || {
            print_error "Impossible de copier le schéma"
            exit 1
        }
        print_success "Schéma copié depuis la base de production"
    fi

    # Apply migrations
    print_info "Application des migrations..."
    if [ -f "prisma/migrations/20250101000000_add_auth_attempts_table/migration.sql" ]; then
        mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME_TEST" < prisma/migrations/20250101000000_add_auth_attempts_table/migration.sql || {
            print_warning "Migration auth_attempts déjà appliquée ou erreur"
        }
        print_success "Migrations appliquées"
    else
        print_warning "Fichier de migration non trouvé"
    fi

    print_success "Base de données de test configurée"
}

# Clean test database
clean_test_db() {
    print_header "Nettoyage de la base de données de test"

    if check_mysql; then
        print_info "Suppression des données de test..."
        mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME_TEST" -e "
            SET FOREIGN_KEY_CHECKS = 0;
            TRUNCATE TABLE utilisateurs;
            TRUNCATE TABLE auth_attempts;
            TRUNCATE TABLE password_reset_tokens;
            TRUNCATE TABLE password_reset_attempts;
            TRUNCATE TABLE manual_recovery_requests;
            SET FOREIGN_KEY_CHECKS = 1;
        " 2>/dev/null || print_warning "Certaines tables n'existent peut-être pas"
        print_success "Base de données nettoyée"
    else
        print_warning "MySQL non accessible, nettoyage ignoré"
    fi
}

# Seed test data
seed_test_db() {
    print_header "Insertion des données de test"

    print_info "Création d'utilisateurs de test..."
    mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME_TEST" -e "
        -- Insérer un utilisateur de test
        INSERT INTO utilisateurs (first_name, last_name, email, password, status_id, date_inscription)
        VALUES
            ('Test', 'User', 'test@example.com', '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5pVzgKvvW.Yty', 1, NOW()),
            ('John', 'Doe', 'john.doe@example.com', '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5pVzgKvvW.Yty', 1, NOW());
    " || {
        print_error "Impossible d'insérer les données de test"
        exit 1
    }

    print_success "Données de test insérées"
}

# Run unit tests only
run_unit_tests() {
    print_header "Exécution des tests unitaires (182 tests)"

    export NODE_ENV=test
    export NODE_OPTIONS=--experimental-vm-modules

    npm test -- routes/auth/__tests__/ --testPathIgnorePatterns=integration || {
        print_error "Tests unitaires échoués"
        exit 1
    }

    print_success "Tests unitaires réussis"
}

# Run integration tests
run_integration_tests() {
    print_header "Exécution des tests d'intégration (27 tests)"

    if ! check_mysql; then
        print_error "MySQL requis pour les tests d'intégration"
        exit 1
    fi

    export NODE_ENV=test
    export NODE_OPTIONS=--experimental-vm-modules
    export DATABASE_URL="mysql://$DB_USER${DB_PASSWORD:+:$DB_PASSWORD}@$DB_HOST:3306/$DB_NAME_TEST"

    npm test -- routes/auth/__tests__/auth.integration.test.ts || {
        print_error "Tests d'intégration échoués"
        exit 1
    }

    print_success "Tests d'intégration réussis"
}

# Run all tests
run_all_tests() {
    print_header "Exécution de tous les tests (209 tests)"

    export NODE_ENV=test
    export NODE_OPTIONS=--experimental-vm-modules
    export DATABASE_URL="mysql://$DB_USER${DB_PASSWORD:+:$DB_PASSWORD}@$DB_HOST:3306/$DB_NAME_TEST"

    npm test -- routes/auth/__tests__/ || {
        print_error "Tests échoués"
        exit 1
    }

    print_success "Tous les tests réussis"
}

# Run tests with coverage
run_coverage() {
    print_header "Exécution des tests avec couverture de code"

    export NODE_ENV=test
    export NODE_OPTIONS=--experimental-vm-modules

    npm test -- routes/auth/__tests__/ --coverage --testPathIgnorePatterns=integration || {
        print_error "Tests avec couverture échoués"
        exit 1
    }

    print_success "Tests avec couverture réussis"
}

# Full workflow
full_workflow() {
    print_header "Workflow complet - Tests d'authentification"

    setup_test_db
    seed_test_db
    run_all_tests
    clean_test_db

    print_success "Workflow complet terminé avec succès!"
}

# Display help
show_help() {
    cat << EOF
${BLUE}Script d'exécution des tests d'authentification - ClubManager${NC}

${GREEN}Usage:${NC}
    ./run-auth-tests.sh [option]

${GREEN}Options:${NC}
    ${YELLOW}unit${NC}          Exécute uniquement les tests unitaires (182 tests, rapide)
    ${YELLOW}integration${NC}   Exécute uniquement les tests d'intégration (27 tests, nécessite MySQL)
    ${YELLOW}all${NC}           Exécute tous les tests (209 tests)
    ${YELLOW}coverage${NC}      Exécute les tests avec couverture de code
    ${YELLOW}setup${NC}         Configure la base de données de test
    ${YELLOW}seed${NC}          Insère des données de test
    ${YELLOW}clean${NC}         Nettoie la base de données de test
    ${YELLOW}full${NC}          Workflow complet (setup + seed + tests + clean)
    ${YELLOW}help${NC}          Affiche cette aide

${GREEN}Variables d'environnement:${NC}
    ${YELLOW}DB_HOST${NC}       Hôte MySQL (défaut: localhost)
    ${YELLOW}DB_USER${NC}       Utilisateur MySQL (défaut: root)
    ${YELLOW}DB_PASSWORD${NC}   Mot de passe MySQL (défaut: vide)

${GREEN}Exemples:${NC}
    # Tests unitaires (recommandé pour le développement)
    ./run-auth-tests.sh unit

    # Tests complets (CI/CD)
    ./run-auth-tests.sh full

    # Tests avec mot de passe MySQL
    DB_PASSWORD=secret ./run-auth-tests.sh full

    # Configuration manuelle
    ./run-auth-tests.sh setup
    ./run-auth-tests.sh seed
    ./run-auth-tests.sh all

${GREEN}Résultats attendus:${NC}
    ${BLUE}Tests unitaires:${NC}       182/182 passés (~5s)
    ${BLUE}Tests d'intégration:${NC}   27/27 passés (~2s)
    ${BLUE}Total:${NC}                  209/209 passés (~7s)

${GREEN}Prérequis:${NC}
    - Node.js et npm installés
    - MySQL installé et démarré (pour tests d'intégration)
    - Dépendances npm installées (npm install)

${GREEN}Documentation:${NC}
    Voir: src/routes/auth/__tests__/README.md

EOF
}

# Main script
main() {
    case "${1:-help}" in
        unit)
            run_unit_tests
            ;;
        integration)
            setup_test_db
            seed_test_db
            run_integration_tests
            ;;
        all)
            run_all_tests
            ;;
        coverage)
            run_coverage
            ;;
        setup)
            setup_test_db
            ;;
        seed)
            seed_test_db
            ;;
        clean)
            clean_test_db
            ;;
        full)
            full_workflow
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
