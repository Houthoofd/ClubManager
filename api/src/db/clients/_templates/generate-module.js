#!/usr/bin/env node

/**
 * Générateur de module avec architecture modulaire
 * Usage: node generate-module.js <module-name>
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const moduleName = process.argv[2];

if (!moduleName) {
  console.error('❌ Usage: node generate-module.js <module-name>');
  process.exit(1);
}

const moduleDir = join(process.cwd(), moduleName);
const pascalCaseName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

// Structure des dossiers
const folders = [
  'docs',
  'queries', 
  'repositories',
  'utils',
  'services',
  '__tests__/repositories',
  '__tests__/queries',
  '__tests__/utils'
];

// Créer la structure
folders.forEach(folder => {
  mkdirSync(join(moduleDir, folder), { recursive: true });
});

// Templates des fichiers
const templates = {
  'types.ts': `/**
 * Types TypeScript pour le module ${pascalCaseName}
 */

export interface ${pascalCaseName} {
  id: string;
  // TODO: Ajouter les propriétés métier
}

export interface ${pascalCaseName}Row {
  id: string | number;
  // TODO: Ajouter les propriétés DB
}

export interface ${pascalCaseName}WithRelations extends ${pascalCaseName} {
  // TODO: Ajouter les relations
}
`,

  'queries/index.ts': `/**
 * Index pour les requêtes SQL du module ${pascalCaseName}
 */

export * from './read.queries.js';
export * from './write.queries.js';
export * from './relations.queries.js';
export * from './search.queries.js';
export * from './validation.queries.js';
`,

  'queries/read.queries.ts': `/**
 * Requêtes de LECTURE pour le module ${pascalCaseName}
 */

export const SELECT_${moduleName.toUpperCase()}_BY_ID = \`
  SELECT * FROM ${moduleName}s 
  WHERE id = ?
\`;

export const SELECT_ALL_${moduleName.toUpperCase()}S = \`
  SELECT * FROM ${moduleName}s 
  ORDER BY created_at DESC
\`;
`,

  'queries/write.queries.ts': `/**
 * Requêtes d'ÉCRITURE pour le module ${pascalCaseName}
 */

export const INSERT_${moduleName.toUpperCase()} = \`
  INSERT INTO ${moduleName}s (name, description)
  VALUES (?, ?)
\`;

export const UPDATE_${moduleName.toUpperCase()} = \`
  UPDATE ${moduleName}s 
  SET name = ?, description = ?, updated_at = NOW()
  WHERE id = ?
\`;

export const DELETE_${moduleName.toUpperCase()} = \`
  DELETE FROM ${moduleName}s 
  WHERE id = ?
\`;
`,

  'utils/index.ts': `/**
 * Utilitaires pour le module ${pascalCaseName}
 */

export * from './parsing.utils.js';
export * from './validation.utils.js';
`,

  'utils/parsing.utils.ts': `/**
 * Utilitaires de parsing pour le module ${pascalCaseName}
 */

import type { ${pascalCaseName}, ${pascalCaseName}Row } from '../types.js';

export function parse${pascalCaseName}Row(row: ${pascalCaseName}Row): ${pascalCaseName} {
  return {
    id: String(row.id),
    // TODO: Mapper les autres propriétés
  };
}

export function parse${pascalCaseName}Rows(rows: ${pascalCaseName}Row[]): ${pascalCaseName}[] {
  return rows.map(parse${pascalCaseName}Row);
}
`,

  'repositories/read.repository.ts': `/**
 * Repository de LECTURE pour le module ${pascalCaseName}
 */

import MysqlConnector from '../../../connector/mysqlconnector.js';
import type { ${pascalCaseName} } from '../types.js';
import * as queries from '../queries/index.js';
import { parse${pascalCaseName}Row } from '../utils/index.js';

export class ${pascalCaseName}ReadRepository {
  private mysql = MysqlConnector.getInstance();

  async findById(id: string): Promise<${pascalCaseName} | null> {
    const rows = await this.mysql.query(queries.SELECT_${moduleName.toUpperCase()}_BY_ID, [id]);
    return rows.length > 0 ? parse${pascalCaseName}Row(rows[0]) : null;
  }

  async findAll(): Promise<${pascalCaseName}[]> {
    const rows = await this.mysql.query(queries.SELECT_ALL_${moduleName.toUpperCase()}S);
    return rows.map(parse${pascalCaseName}Row);
  }
}
`,

  'index.ts': `/**
 * Point d'entrée principal du module ${pascalCaseName}
 */

export * from './types.js';
export * from './repositories/read.repository.js';
// TODO: Exporter les autres repositories
export * from './utils/index.js';
`,

  'docs/ARCHITECTURE.md': `# Architecture - Module ${pascalCaseName}

## Vue d'ensemble
Documentation de l'architecture du module ${pascalCaseName}.

## Structure
- **queries/**: Requêtes SQL organisées par responsabilité
- **repositories/**: Accès aux données
- **utils/**: Utilitaires de parsing et validation
- **services/**: Logique métier (si nécessaire)

## Usage
\`\`\`typescript
import { ${pascalCaseName}ReadRepository } from './${moduleName}/index.js';

const repo = new ${pascalCaseName}ReadRepository();
const item = await repo.findById('123');
\`\`\`
`
};

// Créer tous les fichiers
Object.entries(templates).forEach(([filename, content]) => {
  const filepath = join(moduleDir, filename);
  writeFileSync(filepath, content, 'utf8');
});

console.log(`✅ Module ${moduleName} créé avec succès !`);
console.log(`📁 Structure créée dans: ${moduleDir}`);
console.log(`📝 Prochaines étapes:`);
console.log(`   1. Compléter types.ts avec vos entités`);
console.log(`   2. Ajouter vos requêtes SQL`);
console.log(`   3. Implémenter les repositories`);
console.log(`   4. Écrire les tests`);