/**
 * 🏗️ Route Generator - ClubManager API
 *
 * Générateur de structure de routes GraphQL
 */

import path from 'path';
import {
  createDirectory,
  writeFile,
  fileExists,
  resolveRoutesPath,
} from '../utils/file-utils.js';
import {
  indexTemplate,
  resolversTemplate,
  resolversIndexTemplate,
  serviceTemplate,
  handlersTemplate,
  typesTemplate,
} from '../templates/route-templates.js';
import {
  fileCreated,
  fileSkipped,
  fileUpdated,
  subsection,
  warning,
} from '../utils/logger.js';

/**
 * Génère la structure complète d'une route GraphQL
 * @param {string} domainName - Le nom du domaine
 * @param {object} options - Options de génération
 * @returns {object} Statistiques de génération
 */
export async function generateRoute(domainName, options = {}) {
  const {
    dryRun = false,
    overwrite = false,
    withHandlers = false,
    withTypes = false,
    skipService = false,
  } = options;

  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  subsection(`Génération de la route ${domainName}`);

  try {
    // Créer la structure de répertoires
    const basePath = resolveRoutesPath(domainName);
    const corePath = path.join(basePath, 'core');
    const resolversPath = path.join(corePath, 'resolvers');
    const servicesPath = path.join(corePath, 'services');
    const handlersPath = path.join(corePath, 'handlers');
    const typesPath = path.join(corePath, 'types');

    if (!dryRun) {
      createDirectory(basePath);
      createDirectory(corePath);
      createDirectory(resolversPath);
      if (!skipService) {
        createDirectory(servicesPath);
      }
      if (withHandlers) {
        createDirectory(handlersPath);
      }
      if (withTypes) {
        createDirectory(typesPath);
      }
    }

    // Générer l'index principal
    const indexPath = path.join(basePath, 'index.ts');
    const indexResult = await generateFile(
      indexPath,
      indexTemplate(domainName),
      { dryRun, overwrite }
    );
    updateStats(stats, indexResult);

    // Générer les resolvers
    const resolversFilePath = path.join(resolversPath, `${domainName}.resolvers.ts`);
    const resolversResult = await generateFile(
      resolversFilePath,
      resolversTemplate(domainName),
      { dryRun, overwrite }
    );
    updateStats(stats, resolversResult);

    // Générer l'index des resolvers
    const resolversIndexPath = path.join(resolversPath, 'index.ts');
    const resolversIndexResult = await generateFile(
      resolversIndexPath,
      resolversIndexTemplate(domainName),
      { dryRun, overwrite }
    );
    updateStats(stats, resolversIndexResult);

    // Générer le service
    if (!skipService) {
      const servicePath = path.join(servicesPath, `${domainName}.service.ts`);
      const serviceResult = await generateFile(
        servicePath,
        serviceTemplate(domainName),
        { dryRun, overwrite }
      );
      updateStats(stats, serviceResult);
    }

    // Générer les handlers si demandé
    if (withHandlers) {
      const handlersFilePath = path.join(handlersPath, `${domainName}.handlers.ts`);
      const handlersResult = await generateFile(
        handlersFilePath,
        handlersTemplate(domainName),
        { dryRun, overwrite }
      );
      updateStats(stats, handlersResult);
    }

    // Générer les types si demandé
    if (withTypes) {
      const typesFilePath = path.join(typesPath, `${domainName}.types.ts`);
      const typesResult = await generateFile(
        typesFilePath,
        typesTemplate(domainName),
        { dryRun, overwrite }
      );
      updateStats(stats, typesResult);
    }

    return stats;
  } catch (error) {
    console.error(`Erreur lors de la génération de la route ${domainName}:`, error);
    stats.errors++;
    return stats;
  }
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
 * Vérifie si une route existe déjà
 * @param {string} domainName - Le nom du domaine
 * @returns {boolean} True si la route existe
 */
export function routeExists(domainName) {
  const basePath = resolveRoutesPath(domainName);
  return fileExists(basePath);
}

/**
 * Liste toutes les routes existantes
 * @returns {string[]} La liste des noms de routes
 */
export function listRoutes() {
  const routesPath = resolveRoutesPath();
  const { listDirectories } = require('../utils/file-utils.js');
  return listDirectories(routesPath).filter(dir =>
    !dir.startsWith('.') && !dir.startsWith('_')
  );
}

export default {
  generateRoute,
  routeExists,
  listRoutes,
};
