#!/usr/bin/env node

/**
 * 🚀 Générateur de Domaine - ClubManager Types
 *
 * Ce script génère automatiquement la structure complète d'un nouveau domaine
 * en respectant toutes les conventions architecturales du package @clubmanager/types.
 *
 * Usage:
 *   node scripts/generate-domain.js <nom-domaine> [options]
 *
 * Options:
 *   --with-graphql     Génère les fichiers GraphQL (typedefs + types)
 *   --with-service     Génère le fichier service.ts
 *   --with-database    Génère le fichier database.types.ts
 *   --with-subdomain   Génère un sous-domaine exemple
 *   --skip-validators  Ne génère pas validators.ts (non recommandé)
 *   --dry-run          Affiche ce qui serait généré sans créer les fichiers
 *
 * Exemples:
 *   node scripts/generate-domain.js evenements --with-graphql
 *   node scripts/generate-domain.js stock --with-database --with-service
 *   node scripts/generate-domain.js notifications --with-graphql --with-subdomain
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURATION
// ============================================

const DOMAINS_PATH = path.join(__dirname, '..', 'src', 'domains');
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// ============================================
// UTILITAIRES
// ============================================

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function error(message) {
  log(`❌ ERREUR: ${message}`, 'red');
  process.exit(1);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toUpperSnakeCase(str) {
  return str.toUpperCase().replace(/-/g, '_');
}

// ============================================
// TEMPLATES
// ============================================

const templates = {
  types: (domainName) => {
    const pascalName = toPascalCase(domainName);
    const entityName = pascalName;

    return `/**
 * Types pour le domaine ${pascalName}
 *
 * Conventions:
 * - PascalCase pour les interfaces/types
 * - camelCase pour les propriétés
 * - Commentaires JSDoc obligatoires pour types principaux
 * - Pas de schémas Zod ici (dans validators.ts)
 */

/**
 * Représente une entité ${entityName}
 *
 * @example
 * const ${toCamelCase(domainName)}: ${entityName} = {
 *   id: 1,
 *   name: "Example",
 *   status: "active",
 *   createdAt: new Date(),
 * };
 */
export interface ${entityName} {
  /** Identifiant unique */
  id: number;

  /** Nom de l'entité */
  name: string;

  /** Statut actuel */
  status: ${entityName}Status;

  /** Date de création */
  createdAt: Date;

  /** Date de dernière modification */
  updatedAt?: Date;
}

/**
 * Statuts possibles pour ${entityName}
 */
export type ${entityName}Status = 'active' | 'inactive' | 'pending';

/**
 * Données pour créer un nouveau ${entityName}
 */
export interface Create${entityName}Input {
  name: string;
  status?: ${entityName}Status;
}

/**
 * Données pour mettre à jour un ${entityName}
 */
export interface Update${entityName}Input {
  name?: string;
  status?: ${entityName}Status;
}

/**
 * Résultat d'une opération sur ${entityName}
 */
export interface ${entityName}Result {
  success: boolean;
  ${toCamelCase(domainName)}?: ${entityName};
  error?: string;
}

/**
 * Filtre de recherche pour ${entityName}
 */
export interface ${entityName}Filter {
  status?: ${entityName}Status;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Liste paginée de ${entityName}
 */
export interface ${entityName}List {
  items: ${entityName}[];
  total: number;
  hasMore: boolean;
}
`;
  },

  validators: (domainName) => {
    const pascalName = toPascalCase(domainName);
    const camelName = toCamelCase(domainName);

    return `/**
 * Schémas de validation Zod pour ${pascalName}
 *
 * Conventions:
 * - Nom des schémas en camelCase + "Schema" : create${pascalName}Schema
 * - Types inférés en PascalCase : Create${pascalName}Data
 * - Validation stricte avec messages d'erreur clairs
 */

import { z } from "zod";

/**
 * Schéma de validation pour créer un ${pascalName}
 */
export const create${pascalName}Schema = z.object({
  name: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(255, "Le nom ne peut pas dépasser 255 caractères")
    .trim(),

  status: z
    .enum(["active", "inactive", "pending"])
    .optional()
    .default("pending"),
});

/**
 * Type inféré depuis le schéma de création
 */
export type Create${pascalName}Data = z.infer<typeof create${pascalName}Schema>;

/**
 * Schéma de validation pour mettre à jour un ${pascalName}
 */
export const update${pascalName}Schema = z.object({
  name: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(255, "Le nom ne peut pas dépasser 255 caractères")
    .trim()
    .optional(),

  status: z
    .enum(["active", "inactive", "pending"])
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Au moins un champ doit être fourni pour la mise à jour" }
);

/**
 * Type inféré depuis le schéma de mise à jour
 */
export type Update${pascalName}Data = z.infer<typeof update${pascalName}Schema>;

/**
 * Schéma pour valider l'ID d'un ${pascalName}
 */
export const ${camelName}IdSchema = z
  .string()
  .refine((val) => /^\\d+$/.test(val), {
    message: "ID doit être un nombre positif",
  })
  .transform((val) => parseInt(val, 10))
  .refine((val) => val > 0, {
    message: "ID doit être supérieur à 0",
  });

/**
 * Schéma pour les filtres de recherche
 */
export const ${camelName}FilterSchema = z.object({
  status: z.enum(["active", "inactive", "pending"]).optional(),
  search: z.string().trim().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

/**
 * Type inféré pour les filtres
 */
export type ${pascalName}FilterData = z.infer<typeof ${camelName}FilterSchema>;

/**
 * Fonction helper pour valider un ${pascalName}
 */
export function validate${pascalName}(data: unknown): Create${pascalName}Data {
  return create${pascalName}Schema.parse(data);
}

/**
 * Fonction helper pour valider de manière sûre
 */
export function safeValidate${pascalName}(data: unknown) {
  return create${pascalName}Schema.safeParse(data);
}
`;
  },

  graphqlTypedefs: (domainName) => {
    const pascalName = toPascalCase(domainName);
    const camelName = toCamelCase(domainName);
    const upperName = toUpperSnakeCase(domainName);

    return `/**
 * Schémas GraphQL pour ${pascalName}
 * Définition des types, queries et mutations
 */

import { gql } from "graphql-tag";

export const ${camelName}TypeDefs = gql\`
  # ============================================
  # TYPES
  # ============================================

  """
  Représente une entité ${pascalName}
  """
  type ${pascalName} {
    """Identifiant unique"""
    id: Int!

    """Nom de l'entité"""
    name: String!

    """Statut actuel"""
    status: ${pascalName}Status!

    """Date de création"""
    createdAt: DateTime!

    """Date de dernière modification"""
    updatedAt: DateTime
  }

  """
  Statuts possibles pour ${pascalName}
  """
  enum ${pascalName}Status {
    ACTIVE
    INACTIVE
    PENDING
  }

  """
  Liste paginée de ${pascalName}
  """
  type ${pascalName}List {
    items: [${pascalName}!]!
    total: Int!
    hasMore: Boolean!
  }

  """
  Résultat d'une opération sur ${pascalName}
  """
  type ${pascalName}Result {
    success: Boolean!
    ${camelName}: ${pascalName}
    error: String
  }

  # ============================================
  # INPUTS
  # ============================================

  """
  Données pour créer un nouveau ${pascalName}
  """
  input Create${pascalName}Input {
    name: String!
    status: ${pascalName}Status
  }

  """
  Données pour mettre à jour un ${pascalName}
  """
  input Update${pascalName}Input {
    name: String
    status: ${pascalName}Status
  }

  """
  Filtre de recherche pour ${pascalName}
  """
  input ${pascalName}Filter {
    status: ${pascalName}Status
    search: String
    limit: Int
    offset: Int
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    """Récupérer un ${pascalName} par son ID"""
    get${pascalName}(id: Int!): ${pascalName}

    """Récupérer tous les ${pascalName} avec filtres"""
    get${pascalName}List(filter: ${pascalName}Filter): ${pascalName}List!

    """Rechercher des ${pascalName}"""
    search${pascalName}(search: String!): [${pascalName}!]!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    """Créer un nouveau ${pascalName}"""
    create${pascalName}(input: Create${pascalName}Input!): ${pascalName}Result!

    """Mettre à jour un ${pascalName}"""
    update${pascalName}(id: Int!, input: Update${pascalName}Input!): ${pascalName}Result!

    """Supprimer un ${pascalName}"""
    delete${pascalName}(id: Int!): ${pascalName}Result!
  }
\`;
`;
  },

  graphqlTypes: (domainName) => {
    const pascalName = toPascalCase(domainName);
    const camelName = toCamelCase(domainName);

    return `/**
 * Types TypeScript correspondant aux schémas GraphQL
 * Utilisés par les resolvers
 *
 * Note: Si possible, utiliser GraphQL Code Generator pour générer automatiquement
 */

/**
 * Contexte GraphQL pour ${pascalName}
 */
export interface ${pascalName}Context {
  prisma?: any;
  userId?: number;
  userRole?: string;
  req?: any;
  res?: any;
}

/**
 * Args pour get${pascalName} query
 */
export interface Get${pascalName}Args {
  id: number;
}

/**
 * Args pour get${pascalName}List query
 */
export interface Get${pascalName}ListArgs {
  filter?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  };
}

/**
 * Args pour search${pascalName} query
 */
export interface Search${pascalName}Args {
  search: string;
}

/**
 * Args pour create${pascalName} mutation
 */
export interface Create${pascalName}Args {
  input: {
    name: string;
    status?: string;
  };
}

/**
 * Args pour update${pascalName} mutation
 */
export interface Update${pascalName}Args {
  id: number;
  input: {
    name?: string;
    status?: string;
  };
}

/**
 * Args pour delete${pascalName} mutation
 */
export interface Delete${pascalName}Args {
  id: number;
}

/**
 * Parent type pour resolvers ${pascalName}
 */
export interface ${pascalName}Parent {
  id: number;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}
`;
  },

  service: (domainName) => {
    const pascalName = toPascalCase(domainName);
    const camelName = toCamelCase(domainName);

    return `/**
 * Types pour les services métier de ${pascalName}
 * Interfaces et types pour la couche service
 */

import type { ${pascalName}, Create${pascalName}Input, Update${pascalName}Input } from "./types.js";

/**
 * Interface du service de gestion des ${pascalName}
 */
export interface ${pascalName}Service {
  /**
   * Créer un nouveau ${pascalName}
   */
  create(input: Create${pascalName}Input): Promise<${pascalName}>;

  /**
   * Récupérer un ${pascalName} par son ID
   */
  findById(id: number): Promise<${pascalName} | null>;

  /**
   * Mettre à jour un ${pascalName}
   */
  update(id: number, input: Update${pascalName}Input): Promise<${pascalName}>;

  /**
   * Supprimer un ${pascalName}
   */
  delete(id: number): Promise<boolean>;

  /**
   * Lister tous les ${pascalName}
   */
  findAll(): Promise<${pascalName}[]>;
}

/**
 * Options de configuration pour le service ${pascalName}
 */
export interface ${pascalName}ServiceConfig {
  cacheEnabled?: boolean;
  cacheTTL?: number;
  maxRetries?: number;
}

/**
 * Événements émis par le service ${pascalName}
 */
export type ${pascalName}ServiceEvent =
  | { type: 'created'; ${camelName}: ${pascalName} }
  | { type: 'updated'; ${camelName}: ${pascalName} }
  | { type: 'deleted'; id: number };
`;
  },

  database: (domainName) => {
    const pascalName = toPascalCase(domainName);

    return `/**
 * Types pour la base de données (snake_case Prisma)
 * Correspond aux tables et colonnes de la DB
 */

/**
 * ${pascalName} dans la base de données (snake_case)
 */
export interface ${pascalName}DB {
  id: number;
  name: string;
  status: string;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
}

/**
 * ${pascalName} avec relations
 */
export interface ${pascalName}WithRelationsDB extends ${pascalName}DB {
  user?: {
    id: number;
    email: string;
  };
}

/**
 * Type pour création dans la DB
 */
export interface Create${pascalName}DB {
  name: string;
  status: string;
  user_id?: number;
}

/**
 * Type pour mise à jour dans la DB
 */
export interface Update${pascalName}DB {
  name?: string;
  status?: string;
  updated_at?: Date;
}
`;
  },

  index: (domainName, options) => {
    const pascalName = toPascalCase(domainName);
    const camelName = toCamelCase(domainName);

    let content = `/**
 * ${pascalName} Domain
 * Point d'entrée du domaine ${domainName}
 */

// Base types
export * from "./types.js";
`;

    if (!options.skipValidators) {
      content += `
// Validators
export * from "./validators.js";
`;
    }

    if (options.withService) {
      content += `
// Service types
export * from "./service.js";
`;
    }

    if (options.withDatabase) {
      content += `
// Database types
export * from "./database.types.js";
`;
    }

    if (options.withGraphql) {
      content += `
// GraphQL typedefs
export { ${camelName}TypeDefs } from "./graphql.typedefs.js";
`;
    }

    if (options.withSubdomain) {
      content += `
// Subdomains
export * as Items from "./items/index.js";
`;
    }

    return content;
  },

  readme: (domainName) => {
    const pascalName = toPascalCase(domainName);

    return `# ${pascalName} Domain

## 📝 Description

Domaine gérant les fonctionnalités liées aux ${domainName}.

## 📁 Structure

\`\`\`
${domainName}/
├── index.ts              # Point d'entrée
├── types.ts              # Types métier
├── validators.ts         # Schémas Zod
├── graphql.typedefs.ts   # Schémas GraphQL
├── graphql.types.ts      # Types pour resolvers
└── README.md            # Cette documentation
\`\`\`

## 🚀 Usage

### Import des types

\`\`\`typescript
import { ${pascalName}, Create${pascalName}Input } from '@clubmanager/types';
\`\`\`

### Validation avec Zod

\`\`\`typescript
import { create${pascalName}Schema, validate${pascalName} } from '@clubmanager/types';

const data = validate${pascalName}(userInput);
\`\`\`

### GraphQL

\`\`\`typescript
import { ${toCamelCase(domainName)}TypeDefs } from '@clubmanager/types';
\`\`\`

## 📚 Types Principaux

- \`${pascalName}\` - Entité principale
- \`Create${pascalName}Input\` - Données de création
- \`Update${pascalName}Input\` - Données de mise à jour
- \`${pascalName}Filter\` - Filtres de recherche
- \`${pascalName}List\` - Liste paginée

## ✅ Validators

- \`create${pascalName}Schema\` - Validation création
- \`update${pascalName}Schema\` - Validation mise à jour
- \`${toCamelCase(domainName)}IdSchema\` - Validation ID
- \`${toCamelCase(domainName)}FilterSchema\` - Validation filtres

## 🔄 Dernière mise à jour

${new Date().toISOString().split('T')[0]}
`;
  },

  subdomain: (domainName, subdomainName) => {
    const pascalName = toPascalCase(subdomainName);

    return {
      types: `/**
 * Types pour le sous-domaine ${pascalName}
 */

export interface ${pascalName}Item {
  id: number;
  name: string;
  parentId: number;
  createdAt: Date;
}

export interface Create${pascalName}ItemInput {
  name: string;
  parentId: number;
}
`,
      validators: `/**
 * Validators pour le sous-domaine ${pascalName}
 */

import { z } from "zod";

export const create${pascalName}ItemSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.number().int().positive(),
});

export type Create${pascalName}ItemData = z.infer<typeof create${pascalName}ItemSchema>;
`,
      index: `/**
 * ${pascalName} Subdomain
 */

export * from "./types.js";
export * from "./validators.js";
`,
    };
  },
};

// ============================================
// GÉNÉRATEUR
// ============================================

class DomainGenerator {
  constructor(domainName, options = {}) {
    this.domainName = domainName;
    this.options = {
      withGraphql: options.withGraphql || false,
      withService: options.withService || false,
      withDatabase: options.withDatabase || false,
      withSubdomain: options.withSubdomain || false,
      skipValidators: options.skipValidators || false,
      dryRun: options.dryRun || false,
    };

    this.domainPath = path.join(DOMAINS_PATH, domainName);
    this.filesCreated = [];
  }

  validate() {
    // Vérifier que le nom est valide
    if (!/^[a-z][a-z0-9-]*$/.test(this.domainName)) {
      error('Le nom du domaine doit être en kebab-case (ex: mon-domaine)');
    }

    // Vérifier que le domaine n'existe pas déjà
    if (fs.existsSync(this.domainPath)) {
      error(`Le domaine "${this.domainName}" existe déjà dans ${this.domainPath}`);
    }

    // Vérifier que le dossier domains existe
    if (!fs.existsSync(DOMAINS_PATH)) {
      error(`Le dossier domains n'existe pas: ${DOMAINS_PATH}`);
    }
  }

  createDirectory(dirPath) {
    if (!this.options.dryRun) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    info(`📁 Création du dossier: ${path.relative(DOMAINS_PATH, dirPath)}`);
  }

  createFile(filePath, content) {
    const relativePath = path.relative(DOMAINS_PATH, filePath);

    if (this.options.dryRun) {
      info(`📄 [DRY RUN] Création: ${relativePath}`);
    } else {
      fs.writeFileSync(filePath, content, 'utf-8');
      this.filesCreated.push(relativePath);
      success(`📄 Créé: ${relativePath}`);
    }
  }

  generate() {
    log('\n🚀 Génération du domaine...', 'bright');

    // Créer le dossier principal
    this.createDirectory(this.domainPath);

    // Générer types.ts (obligatoire)
    this.createFile(
      path.join(this.domainPath, 'types.ts'),
      templates.types(this.domainName)
    );

    // Générer validators.ts (sauf si skip)
    if (!this.options.skipValidators) {
      this.createFile(
        path.join(this.domainPath, 'validators.ts'),
        templates.validators(this.domainName)
      );
    }

    // Générer GraphQL (optionnel)
    if (this.options.withGraphql) {
      this.createFile(
        path.join(this.domainPath, 'graphql.typedefs.ts'),
        templates.graphqlTypedefs(this.domainName)
      );

      this.createFile(
        path.join(this.domainPath, 'graphql.types.ts'),
        templates.graphqlTypes(this.domainName)
      );
    }

    // Générer service.ts (optionnel)
    if (this.options.withService) {
      this.createFile(
        path.join(this.domainPath, 'service.ts'),
        templates.service(this.domainName)
      );
    }

    // Générer database.types.ts (optionnel)
    if (this.options.withDatabase) {
      this.createFile(
        path.join(this.domainPath, 'database.types.ts'),
        templates.database(this.domainName)
      );
    }

    // Générer sous-domaine (optionnel)
    if (this.options.withSubdomain) {
      const subdomainPath = path.join(this.domainPath, 'items');
      this.createDirectory(subdomainPath);

      const subdomainFiles = templates.subdomain(this.domainName, 'items');

      this.createFile(
        path.join(subdomainPath, 'types.ts'),
        subdomainFiles.types
      );

      this.createFile(
        path.join(subdomainPath, 'validators.ts'),
        subdomainFiles.validators
      );

      this.createFile(
        path.join(subdomainPath, 'index.ts'),
        subdomainFiles.index
      );
    }

    // Générer index.ts (obligatoire)
    this.createFile(
      path.join(this.domainPath, 'index.ts'),
      templates.index(this.domainName, this.options)
    );

    // Générer README.md
    this.createFile(
      path.join(this.domainPath, 'README.md'),
      templates.readme(this.domainName)
    );
  }

  updateDomainsIndex() {
    const domainsIndexPath = path.join(DOMAINS_PATH, 'index.ts');
    const pascalName = toPascalCase(this.domainName);
    const exportLine = `export * as ${pascalName} from "./${this.domainName}/index.js";`;

    if (this.options.dryRun) {
      info(`\n📝 [DRY RUN] Ajout dans domains/index.ts: ${exportLine}`);
      return;
    }

    if (!fs.existsSync(domainsIndexPath)) {
      warning('domains/index.ts n\'existe pas, création...');
      fs.writeFileSync(domainsIndexPath, '// Domains exports\n\n' + exportLine + '\n', 'utf-8');
      success('✅ domains/index.ts créé et mis à jour');
      return;
    }

    let content = fs.readFileSync(domainsIndexPath, 'utf-8');

    // Vérifier si l'export existe déjà
    if (content.includes(exportLine)) {
      warning('L\'export existe déjà dans domains/index.ts');
      return;
    }

    // Ajouter l'export (alphabétiquement si possible)
    content = content.trimEnd() + '\n' + exportLine + '\n';

    fs.writeFileSync(domainsIndexPath, content, 'utf-8');
    success('✅ domains/index.ts mis à jour');
  }

  updateMainIndex() {
    const mainIndexPath = path.join(__dirname, '..', 'src', 'index.ts');

    if (!this.options.withGraphql) {
      return; // Pas besoin de mettre à jour si pas de GraphQL
    }

    const camelName = toCamelCase(this.domainName);
    const typeDefLine = `  ${camelName}TypeDefs,`;

    if (this.options.dryRun) {
      info(`\n📝 [DRY RUN] Ajout dans src/index.ts: ${typeDefLine}`);
      return;
    }

    if (!fs.existsSync(mainIndexPath)) {
      warning('src/index.ts n\'existe pas, ignoré');
      return;
    }

    let content = fs.readFileSync(mainIndexPath, 'utf-8');

    // Vérifier si déjà présent
    if (content.includes(typeDefLine.trim())) {
      warning('Le typeDef existe déjà dans src/index.ts');
      return;
    }

    info('⚠️  N\'oubliez pas d\'ajouter manuellement dans src/index.ts:');
    log(`   - Import: import { ${camelName}TypeDefs } from "./domains/${this.domainName}/index.js";`, 'yellow');
    log(`   - Dans allTypeDefs: ${typeDefLine}`, 'yellow');
  }

  printSummary() {
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 RÉSUMÉ DE LA GÉNÉRATION', 'bright');
    log('='.repeat(60), 'cyan');

    log(`\n📦 Domaine: ${this.domainName}`, 'bright');
    log(`📁 Chemin: ${this.domainPath}`);

    log('\n📄 Fichiers générés:', 'bright');
    if (this.options.dryRun) {
      log('   (Mode DRY RUN - aucun fichier créé)', 'yellow');
    }

    const files = [
      { name: 'types.ts', required: true },
      { name: 'validators.ts', required: !this.options.skipValidators },
      { name: 'graphql.typedefs.ts', required: this.options.withGraphql },
      { name: 'graphql.types.ts', required: this.options.withGraphql },
      { name: 'service.ts', required: this.options.withService },
      { name: 'database.types.ts', required: this.options.withDatabase },
      { name: 'items/', required: this.options.withSubdomain },
      { name: 'index.ts', required: true },
      { name: 'README.md', required: true },
    ];

    files.forEach(file => {
      if (file.required) {
        log(`   ✅ ${file.name}`, 'green');
      }
    });

    log('\n🎯 Prochaines étapes:', 'bright');
    log('   1. Vérifier les fichiers générés');
    log('   2. Ajuster les types selon vos besoins');
    log('   3. Compiler: npm run build');

    if (this.options.withGraphql) {
      log('   4. Ajouter le typeDef dans src/index.ts');
      const camelName = toCamelCase(this.domainName);
      log(`      - Import: import { ${camelName}TypeDefs } from "./domains/${this.domainName}/index.js";`, 'dim');
      log(`      - allTypeDefs: [..., ${camelName}TypeDefs]`, 'dim');
    }

    log('   5. Tester l\'import: import { ' + toPascalCase(this.domainName) + ' } from \'@clubmanager/types\';');

    log('\n📚 Documentation:', 'bright');
    log(`   ${this.domainPath}/README.md`);

    log('\n' + '='.repeat(60), 'cyan');
    success('✨ Génération terminée avec succès !');
    log('='.repeat(60) + '\n', 'cyan');
  }

  run() {
    try {
      this.validate();
      this.generate();
      this.updateDomainsIndex();
      this.updateMainIndex();
      this.printSummary();
    } catch (err) {
      error(err.message);
    }
  }
}

// ============================================
// CLI
// ============================================

function printUsage() {
  log('\n🚀 Générateur de Domaine - ClubManager Types\n', 'bright');
  log('Usage:', 'cyan');
  log('  node scripts/generate-domain.js <nom-domaine> [options]\n');

  log('Options:', 'cyan');
  log('  --with-graphql     Génère les fichiers GraphQL (typedefs + types)');
  log('  --with-service     Génère le fichier service.ts');
  log('  --with-database    Génère le fichier database.types.ts');
  log('  --with-subdomain   Génère un sous-domaine exemple');
  log('  --skip-validators  Ne génère pas validators.ts (non recommandé)');
  log('  --dry-run          Affiche ce qui serait généré sans créer les fichiers');
  log('  --help, -h         Affiche cette aide\n');

  log('Exemples:', 'cyan');
  log('  node scripts/generate-domain.js evenements --with-graphql');
  log('  node scripts/generate-domain.js stock --with-database --with-service');
  log('  node scripts/generate-domain.js notifications --with-graphql --with-subdomain');
  log('  node scripts/generate-domain.js test-domain --dry-run --with-graphql\n');
}

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const domainName = args[0];
  const options = {
    withGraphql: args.includes('--with-graphql'),
    withService: args.includes('--with-service'),
    withDatabase: args.includes('--with-database'),
    withSubdomain: args.includes('--with-subdomain'),
    skipValidators: args.includes('--skip-validators'),
    dryRun: args.includes('--dry-run'),
  };

  return { domainName, options };
}

// ============================================
// MAIN
// ============================================

function main() {
  log('\n' + '='.repeat(60), 'magenta');
  log('🎨 GÉNÉRATEUR DE DOMAINE - CLUBMANAGER TYPES', 'bright');
  log('='.repeat(60) + '\n', 'magenta');

  const { domainName, options } = parseArgs();

  const generator = new DomainGenerator(domainName, options);
  generator.run();
}

main();
