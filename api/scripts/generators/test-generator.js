/**
 * 🧪 Test Generator - ClubManager API
 *
 * Générateur de tests pour les routes GraphQL
 */

import path from 'path';
import {
  createDirectory,
  writeFile,
  fileExists,
  resolveTestsPath,
} from '../utils/file-utils.js';
import {
  unitServiceTestTemplate,
  unitResolverTestTemplate,
  integrationTestTemplate,
  securityTestTemplate,
  advancedTestTemplate,
  e2eTestTemplate,
  testIndexTemplate,
} from '../templates/test-templates.js';
import {
  fileCreated,
  fileSkipped,
  fileUpdated,
  subsection,
  warning,
  step,
} from '../utils/logger.js';

/**
 * Types de tests disponibles
 */
export const TEST_TYPES = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  SECURITY: 'security',
  ADVANCED: 'advanced',
  EDGE: 'edge', // Alias pour advanced
  E2E: 'e2e',
  ALL: 'all',
};

/**
 * Génère tous les tests pour un domaine
 * @param {string} domainName - Le nom du domaine
 * @param {object} options - Options de génération
 * @returns {object} Statistiques de génération
 */
export async function generateTests(domainName, options = {}) {
  const {
    dryRun = false,
    overwrite = false,
    testTypes = [TEST_TYPES.ALL],
  } = options;

  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  subsection(`Génération des tests pour ${domainName}`);

  try {
    // Créer la structure de répertoires
    const basePath = resolveTestsPath(domainName);

    if (!dryRun) {
      createDirectory(basePath);
    }

    // Déterminer quels tests générer
    const typesToGenerate = testTypes.includes(TEST_TYPES.ALL)
      ? [TEST_TYPES.UNIT, TEST_TYPES.INTEGRATION, TEST_TYPES.SECURITY, TEST_TYPES.ADVANCED, TEST_TYPES.E2E]
      : testTypes;

    // Générer les tests unitaires
    if (typesToGenerate.includes(TEST_TYPES.UNIT)) {
      step(1, 'Génération des tests unitaires');
      const unitStats = await generateUnitTests(domainName, { dryRun, overwrite });
      mergeStats(stats, unitStats);
    }

    // Générer les tests d'intégration
    if (typesToGenerate.includes(TEST_TYPES.INTEGRATION)) {
      step(2, 'Génération des tests d\'intégration');
      const integrationStats = await generateIntegrationTests(domainName, { dryRun, overwrite });
      mergeStats(stats, integrationStats);
    }

    // Générer les tests de sécurité
    if (typesToGenerate.includes(TEST_TYPES.SECURITY)) {
      step(3, 'Génération des tests de sécurité');
      const securityStats = await generateSecurityTests(domainName, { dryRun, overwrite });
      mergeStats(stats, securityStats);
    }

    // Générer les tests avancés (edge cases)
    if (typesToGenerate.includes(TEST_TYPES.ADVANCED) || typesToGenerate.includes(TEST_TYPES.EDGE)) {
      step(4, 'Génération des tests avancés');
      const advancedStats = await generateAdvancedTests(domainName, { dryRun, overwrite });
      mergeStats(stats, advancedStats);
    }

    // Générer les tests E2E
    if (typesToGenerate.includes(TEST_TYPES.E2E)) {
      step(5, 'Génération des tests E2E');
      const e2eStats = await generateE2ETests(domainName, { dryRun, overwrite });
      mergeStats(stats, e2eStats);
    }

    // Générer l'index des tests
    step(6, 'Génération de l\'index des tests');
    const indexPath = path.join(basePath, 'index.ts');
    const indexResult = await generateFile(
      indexPath,
      testIndexTemplate(domainName),
      { dryRun, overwrite }
    );
    updateStats(stats, indexResult);

    return stats;
  } catch (error) {
    console.error(`Erreur lors de la génération des tests pour ${domainName}:`, error);
    stats.errors++;
    return stats;
  }
}

/**
 * Génère les tests unitaires
 */
async function generateUnitTests(domainName, options = {}) {
  const { dryRun = false, overwrite = false } = options;
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };

  const basePath = resolveTestsPath(domainName, 'unit');

  if (!dryRun) {
    createDirectory(basePath);
  }

  // Test unitaire du service
  const servicePath = path.join(basePath, `${domainName}.service.unit.test.ts`);
  const serviceResult = await generateFile(
    servicePath,
    unitServiceTestTemplate(domainName),
    { dryRun, overwrite }
  );
  updateStats(stats, serviceResult);

  // Test unitaire des resolvers
  const resolversPath = path.join(basePath, `${domainName}.resolvers.unit.test.ts`);
  const resolversResult = await generateFile(
    resolversPath,
    unitResolverTestTemplate(domainName),
    { dryRun, overwrite }
  );
  updateStats(stats, resolversResult);

  return stats;
}

/**
 * Génère les tests d'intégration
 */
async function generateIntegrationTests(domainName, options = {}) {
  const { dryRun = false, overwrite = false } = options;
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };

  const basePath = resolveTestsPath(domainName, 'integration');

  if (!dryRun) {
    createDirectory(basePath);
  }

  const testPath = path.join(basePath, `${domainName}.integration.test.ts`);
  const result = await generateFile(
    testPath,
    integrationTestTemplate(domainName),
    { dryRun, overwrite }
  );
  updateStats(stats, result);

  return stats;
}

/**
 * Génère les tests de sécurité
 */
async function generateSecurityTests(domainName, options = {}) {
  const { dryRun = false, overwrite = false } = options;
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };

  const basePath = resolveTestsPath(domainName, 'security');

  if (!dryRun) {
    createDirectory(basePath);
  }

  const testPath = path.join(basePath, `${domainName}.security.test.ts`);
  const result = await generateFile(
    testPath,
    securityTestTemplate(domainName),
    { dryRun, overwrite }
  );
  updateStats(stats, result);

  return stats;
}

/**
 * Génère les tests avancés
 */
async function generateAdvancedTests(domainName, options = {}) {
  const { dryRun = false, overwrite = false } = options;
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };

  const basePath = resolveTestsPath(domainName, 'advanced');

  if (!dryRun) {
    createDirectory(basePath);
  }

  const testPath = path.join(basePath, `${domainName}.advanced.test.ts`);
  const result = await generateFile(
    testPath,
    advancedTestTemplate(domainName),
    { dryRun, overwrite }
  );
  updateStats(stats, result);

  return stats;
}

/**
 * Génère les tests E2E
 */
async function generateE2ETests(domainName, options = {}) {
  const { dryRun = false, overwrite = false } = options;
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };

  const basePath = resolveTestsPath(domainName, 'e2e');

  if (!dryRun) {
    createDirectory(basePath);
  }

  const testPath = path.join(basePath, `${domainName}.e2e.test.ts`);
  const result = await generateFile(
    testPath,
    e2eTestTemplate(domainName),
    { dryRun, overwrite }
  );
  updateStats(stats, result);

  return stats;
}

/**
 * Génère un fichier unique
 * @param {string} filepath - Le chemin du fichier
 * @param {string} content - Le contenu du fichier
 * @param {object} options - Options
 * @returns {string} Le résultat ('created', 'updated', 'skipped')
 */
async function generateFile(filepath, content, options = {}) {
  const { dryRun = false, overwrite = false } = options;

  if (dryRun) {
    fileCreated(filepath);
    return 'created';
  }

  const exists = fileExists(filepath);

  if (exists && !overwrite) {
    fileSkipped(filepath);
    return 'skipped';
  }

  const success = writeFile(filepath, content, { overwrite: true });

  if (success) {
    if (exists) {
      fileUpdated(filepath);
      return 'updated';
    } else {
      fileCreated(filepath);
      return 'created';
    }
  }

  warning(`Échec de l'écriture: ${filepath}`);
  return 'error';
}

/**
 * Met à jour les statistiques
 * @param {object} stats - Les statistiques
 * @param {string} result - Le résultat de l'opération
 */
function updateStats(stats, result) {
  if (result === 'created') {
    stats.created++;
  } else if (result === 'updated') {
    stats.updated++;
  } else if (result === 'skipped') {
    stats.skipped++;
  } else if (result === 'error') {
    stats.errors++;
  }
}

/**
 * Fusionne deux objets de statistiques
 * @param {object} target - L'objet cible
 * @param {object} source - L'objet source
 */
function mergeStats(target, source) {
  target.created += source.created || 0;
  target.updated += source.updated || 0;
  target.skipped += source.skipped || 0;
  target.errors += source.errors || 0;
}

/**
 * Vérifie si des tests existent pour un domaine
 * @param {string} domainName - Le nom du domaine
 * @returns {boolean} True si des tests existent
 */
export function testsExist(domainName) {
  const basePath = resolveTestsPath(domainName);
  return fileExists(basePath);
}

/**
 * Liste tous les domaines ayant des tests
 * @returns {string[]} La liste des noms de domaines
 */
export function listTestedDomains() {
  const testsPath = resolveTestsPath();
  const { listDirectories } = require('../utils/file-utils.js');
  return listDirectories(testsPath).filter(dir =>
    !dir.startsWith('.') && !dir.startsWith('_')
  );
}

export default {
  generateTests,
  generateUnitTests,
  generateIntegrationTests,
  generateSecurityTests,
  generateAdvancedTests,
  generateE2ETests,
  testsExist,
  listTestedDomains,
  TEST_TYPES,
};
