#!/bin/bash

#############################################
# Script de validation d'un domaine généré
# Vérifie la conformité architecturale
#############################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAINS_DIR="$SCRIPT_DIR/../src/domains"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# Compteurs
ERRORS=0
WARNINGS=0
CHECKS=0

#############################################
# Fonctions utilitaires
#############################################

print_header() {
  echo -e "${CYAN}${BOLD}"
  echo "============================================"
  echo "$1"
  echo "============================================"
  echo -e "${RESET}"
}

print_success() {
  echo -e "  ${GREEN}✓${RESET} $1"
  ((CHECKS++))
}

print_error() {
  echo -e "  ${RED}✗${RESET} $1"
  ((ERRORS++))
  ((CHECKS++))
}

print_warning() {
  echo -e "  ${YELLOW}⚠${RESET} $1"
  ((WARNINGS++))
  ((CHECKS++))
}

print_info() {
  echo -e "  ${BLUE}ℹ${RESET} $1"
}

#############################################
# Fonctions de validation
#############################################

validate_domain_exists() {
  local domain=$1
  local domain_path="$DOMAINS_DIR/$domain"

  if [ ! -d "$domain_path" ]; then
    print_error "Le domaine '$domain' n'existe pas dans $DOMAINS_DIR"
    return 1
  fi

  print_success "Le domaine '$domain' existe"
  return 0
}

validate_required_files() {
  local domain=$1
  local domain_path="$DOMAINS_DIR/$domain"

  echo ""
  echo -e "${BOLD}Fichiers obligatoires:${RESET}"

  # types.ts (OBLIGATOIRE)
  if [ -f "$domain_path/types.ts" ]; then
    print_success "types.ts présent"
  else
    print_error "types.ts MANQUANT (OBLIGATOIRE)"
  fi

  # validators.ts (OBLIGATOIRE)
  if [ -f "$domain_path/validators.ts" ]; then
    print_success "validators.ts présent"
  else
    print_error "validators.ts MANQUANT (OBLIGATOIRE)"
  fi

  # index.ts (OBLIGATOIRE)
  if [ -f "$domain_path/index.ts" ]; then
    print_success "index.ts présent"
  else
    print_error "index.ts MANQUANT (OBLIGATOIRE)"
  fi

  # README.md (RECOMMANDÉ)
  if [ -f "$domain_path/README.md" ]; then
    print_success "README.md présent"
  else
    print_warning "README.md manquant (recommandé)"
  fi
}

validate_graphql_consistency() {
  local domain=$1
  local domain_path="$DOMAINS_DIR/$domain"

  echo ""
  echo -e "${BOLD}Consistance GraphQL:${RESET}"

  local has_typedefs=false
  local has_types=false

  if [ -f "$domain_path/graphql.typedefs.ts" ]; then
    has_typedefs=true
  fi

  if [ -f "$domain_path/graphql.types.ts" ]; then
    has_types=true
  fi

  if [ "$has_typedefs" = true ] && [ "$has_types" = true ]; then
    print_success "Pattern C: typedefs + types présents"
  elif [ "$has_typedefs" = true ] && [ "$has_types" = false ]; then
    print_warning "Pattern A: seulement typedefs (types manquant)"
  elif [ "$has_typedefs" = false ] && [ "$has_types" = true ]; then
    print_error "Pattern B: seulement types (typedefs manquant - NON CONFORME)"
  else
    print_info "Pas de GraphQL (OK si pas nécessaire)"
  fi
}

validate_zod_separation() {
  local domain=$1
  local domain_path="$DOMAINS_DIR/$domain"

  echo ""
  echo -e "${BOLD}Séparation Zod:${RESET}"

  if [ ! -f "$domain_path/types.ts" ]; then
    print_warning "types.ts manquant, impossible de vérifier"
    return
  fi

  # Chercher des imports Zod dans types.ts
  if grep -q "from ['\"]zod['\"]" "$domain_path/types.ts" 2>/dev/null || \
     grep -q "import.*zod" "$domain_path/types.ts" 2>/dev/null || \
     grep -q "z\\.object\\|z\\.string\\|z\\.number" "$domain_path/types.ts" 2>/dev/null; then
    print_error "Schémas Zod trouvés dans types.ts (DOIT être dans validators.ts)"
  else
    print_success "Aucun schéma Zod dans types.ts"
  fi

  # Vérifier que validators.ts contient bien Zod
  if [ -f "$domain_path/validators.ts" ]; then
    if grep -q "from ['\"]zod['\"]" "$domain_path/validators.ts" 2>/dev/null; then
      print_success "validators.ts contient des schémas Zod"
    else
      print_warning "validators.ts ne semble pas contenir de schémas Zod"
    fi
  fi
}

validate_index_exports() {
  local domain=$1
  local domain_path="$DOMAINS_DIR/$domain"

  echo ""
  echo -e "${BOLD}Exports index.ts:${RESET}"

  if [ ! -f "$domain_path/index.ts" ]; then
    print_error "index.ts manquant"
    return
  fi

  # Vérifier export de types.ts
  if grep -q "export.*from.*['\"]\\./types\\.js['\"]" "$domain_path/index.ts" 2>/dev/null; then
    print_success "Export de types.ts présent"
  else
    print_error "Export de types.ts manquant ou incorrect"
  fi

  # Vérifier export de validators.ts (si fichier existe)
  if [ -f "$domain_path/validators.ts" ]; then
    if grep -q "export.*from.*['\"]\\./validators\\.js['\"]" "$domain_path/index.ts" 2>/dev/null; then
      print_success "Export de validators.ts présent"
    else
      print_error "Export de validators.ts manquant"
    fi
  fi

  # Vérifier export de graphql.typedefs.ts (si fichier existe)
  if [ -f "$domain_path/graphql.typedefs.ts" ]; then
    if grep -q "TypeDefs.*from.*['\"]\\./graphql\\.typedefs\\.js['\"]" "$domain_path/index.ts" 2>/dev/null; then
      print_success "Export de graphql.typedefs.ts présent"
    else
      print_warning "Export de graphql.typedefs.ts manquant ou incorrect"
    fi
  fi
}

validate_typescript_syntax() {
  local domain=$1
  local domain_path="$DOMAINS_DIR/$domain"

  echo ""
  echo -e "${BOLD}Syntaxe TypeScript:${RESET}"

  # Vérifier que les imports utilisent .js
  local bad_imports=0

  for file in "$domain_path"/*.ts; do
    if [ -f "$file" ] && [ "$(basename "$file")" != "index.ts" ]; then
      if grep -q "from ['\"]\\./[^'\"]*['\"]" "$file" 2>/dev/null | grep -qv "\\.js['\"]"; then
        # Vérifier si des imports locaux n'ont pas .js
        if grep -E "from ['\"]\\./[a-zA-Z]" "$file" 2>/dev/null | grep -qv "\\.js['\"]"; then
          ((bad_imports++))
        fi
      fi
    fi
  done

  if [ $bad_imports -eq 0 ]; then
    print_success "Tous les imports locaux utilisent .js"
  else
    print_warning "$bad_imports fichier(s) avec imports sans .js (peut causer des erreurs)"
  fi
}

validate_naming_conventions() {
  local domain=$1
  local domain_path="$DOMAINS_DIR/$domain"

  echo ""
  echo -e "${BOLD}Conventions de nommage:${RESET}"

  # Vérifier kebab-case pour le nom du domaine
  if [[ "$domain" =~ ^[a-z][a-z0-9-]*$ ]]; then
    print_success "Nom du domaine en kebab-case"
  else
    print_error "Nom du domaine devrait être en kebab-case"
  fi

  # Vérifier les noms de fichiers
  local invalid_files=0
  for file in "$domain_path"/*.ts; do
    if [ -f "$file" ]; then
      local filename=$(basename "$file")
      # Fichiers autorisés: *.ts, *.types.ts, graphql.*.ts
      if [[ ! "$filename" =~ ^[a-z][a-z0-9\.-]*\.ts$ ]]; then
        ((invalid_files++))
      fi
    fi
  done

  if [ $invalid_files -eq 0 ]; then
    print_success "Tous les noms de fichiers sont conformes"
  else
    print_warning "$invalid_files fichier(s) avec noms non conformes"
  fi
}

validate_jsdoc_presence() {
  local domain=$1
  local domain_path="$DOMAINS_DIR/$domain"

  echo ""
  echo -e "${BOLD}Documentation JSDoc:${RESET}"

  local files_with_jsdoc=0
  local total_files=0

  for file in "$domain_path"/{types,validators,service,graphql.types}.ts; do
    if [ -f "$file" ]; then
      ((total_files++))
      if grep -q "/\\*\\*" "$file" 2>/dev/null; then
        ((files_with_jsdoc++))
      fi
    fi
  done

  if [ $total_files -eq 0 ]; then
    print_info "Aucun fichier à vérifier"
  elif [ $files_with_jsdoc -eq $total_files ]; then
    print_success "Tous les fichiers principaux ont du JSDoc"
  elif [ $files_with_jsdoc -gt 0 ]; then
    print_warning "$files_with_jsdoc/$total_files fichiers avec JSDoc"
  else
    print_warning "Aucun JSDoc trouvé (recommandé pour documentation)"
  fi
}

check_domains_index_export() {
  local domain=$1
  local domains_index="$DOMAINS_DIR/index.ts"

  echo ""
  echo -e "${BOLD}Export dans domains/index.ts:${RESET}"

  if [ ! -f "$domains_index" ]; then
    print_warning "domains/index.ts n'existe pas"
    return
  fi

  # Convertir le nom en PascalCase pour vérifier l'export
  local pascal_name=$(echo "$domain" | sed -r 's/(^|-)([a-z])/\U\2/g')

  if grep -q "export.*as $pascal_name.*from.*['\"]\\.\/$domain" "$domains_index" 2>/dev/null; then
    print_success "Export présent dans domains/index.ts"
  else
    print_warning "Export manquant dans domains/index.ts (ajouter manuellement)"
  fi
}

#############################################
# Fonction principale
#############################################

main() {
  local domain=$1

  if [ -z "$domain" ]; then
    echo -e "${RED}Usage: $0 <nom-domaine>${RESET}"
    echo ""
    echo "Exemple: $0 evenements"
    exit 1
  fi

  print_header "VALIDATION DU DOMAINE: $domain"

  # Validation existence
  if ! validate_domain_exists "$domain"; then
    exit 1
  fi

  # Validations
  validate_required_files "$domain"
  validate_graphql_consistency "$domain"
  validate_zod_separation "$domain"
  validate_index_exports "$domain"
  validate_typescript_syntax "$domain"
  validate_naming_conventions "$domain"
  validate_jsdoc_presence "$domain"
  check_domains_index_export "$domain"

  # Résumé
  echo ""
  print_header "RÉSUMÉ DE VALIDATION"

  echo -e "${BOLD}Domaine:${RESET} $domain"
  echo -e "${BOLD}Checks effectués:${RESET} $CHECKS"
  echo ""

  if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ VALIDATION RÉUSSIE !${RESET}"
    echo -e "  Aucune erreur, aucun avertissement"
    exit 0
  elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}${BOLD}⚠ VALIDATION AVEC AVERTISSEMENTS${RESET}"
    echo -e "  ${YELLOW}Avertissements:${RESET} $WARNINGS"
    echo ""
    echo "Le domaine est conforme mais certaines améliorations sont recommandées."
    exit 0
  else
    echo -e "${RED}${BOLD}✗ VALIDATION ÉCHOUÉE${RESET}"
    echo -e "  ${RED}Erreurs:${RESET} $ERRORS"
    echo -e "  ${YELLOW}Avertissements:${RESET} $WARNINGS"
    echo ""
    echo "Corrigez les erreurs avant de compiler."
    exit 1
  fi
}

main "$@"
