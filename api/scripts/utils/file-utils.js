/**
 * 📁 File Utilities - ClubManager API
 *
 * Utilitaires de gestion de fichiers pour les scripts de génération
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vérifie si un fichier existe
 * @param {string} filepath - Le chemin du fichier
 * @returns {boolean} True si le fichier existe
 */
export function fileExists(filepath) {
  try {
    return fs.existsSync(filepath);
  } catch (error) {
    return false;
  }
}

/**
 * Vérifie si un répertoire existe
 * @param {string} dirpath - Le chemin du répertoire
 * @returns {boolean} True si le répertoire existe
 */
export function directoryExists(dirpath) {
  try {
    return fs.existsSync(dirpath) && fs.statSync(dirpath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Crée un répertoire récursivement
 * @param {string} dirpath - Le chemin du répertoire
 * @returns {boolean} True si créé avec succès
 */
export function createDirectory(dirpath) {
  try {
    if (!directoryExists(dirpath)) {
      fs.mkdirSync(dirpath, { recursive: true });
      return true;
    }
    return false;
  } catch (error) {
    console.error(
      `Erreur lors de la création du répertoire ${dirpath}:`,
      error,
    );
    return false;
  }
}

/**
 * Écrit un fichier
 * @param {string} filepath - Le chemin du fichier
 * @param {string} content - Le contenu à écrire
 * @param {object} options - Options d'écriture
 * @returns {boolean} True si écrit avec succès
 */
export function writeFile(filepath, content, options = {}) {
  const { overwrite = false, createDir = true } = options;

  try {
    // Vérifie si le fichier existe déjà
    if (!overwrite && fileExists(filepath)) {
      return false;
    }

    // Crée le répertoire parent si nécessaire
    if (createDir) {
      const dir = path.dirname(filepath);
      createDirectory(dir);
    }

    // Écrit le fichier
    fs.writeFileSync(filepath, content, "utf8");
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'écriture du fichier ${filepath}:`, error);
    return false;
  }
}

/**
 * Lit un fichier
 * @param {string} filepath - Le chemin du fichier
 * @returns {string|null} Le contenu du fichier ou null
 */
export function readFile(filepath) {
  try {
    if (!fileExists(filepath)) {
      return null;
    }
    return fs.readFileSync(filepath, "utf8");
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${filepath}:`, error);
    return null;
  }
}

/**
 * Copie un fichier
 * @param {string} source - Le fichier source
 * @param {string} destination - Le fichier de destination
 * @param {object} options - Options de copie
 * @returns {boolean} True si copié avec succès
 */
export function copyFile(source, destination, options = {}) {
  const { overwrite = false, createDir = true } = options;

  try {
    if (!fileExists(source)) {
      return false;
    }

    if (!overwrite && fileExists(destination)) {
      return false;
    }

    if (createDir) {
      const dir = path.dirname(destination);
      createDirectory(dir);
    }

    fs.copyFileSync(source, destination);
    return true;
  } catch (error) {
    console.error(
      `Erreur lors de la copie de ${source} vers ${destination}:`,
      error,
    );
    return false;
  }
}

/**
 * Supprime un fichier
 * @param {string} filepath - Le chemin du fichier
 * @returns {boolean} True si supprimé avec succès
 */
export function deleteFile(filepath) {
  try {
    if (fileExists(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(
      `Erreur lors de la suppression du fichier ${filepath}:`,
      error,
    );
    return false;
  }
}

/**
 * Liste les fichiers d'un répertoire
 * @param {string} dirpath - Le chemin du répertoire
 * @param {object} options - Options de listage
 * @returns {string[]} La liste des fichiers
 */
export function listFiles(dirpath, options = {}) {
  const { recursive = false, filter = null } = options;

  try {
    if (!directoryExists(dirpath)) {
      return [];
    }

    let files = [];
    const items = fs.readdirSync(dirpath);

    items.forEach((item) => {
      const fullPath = path.join(dirpath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && recursive) {
        files = files.concat(listFiles(fullPath, options));
      } else if (stat.isFile()) {
        if (!filter || filter(fullPath)) {
          files.push(fullPath);
        }
      }
    });

    return files;
  } catch (error) {
    console.error(`Erreur lors du listage du répertoire ${dirpath}:`, error);
    return [];
  }
}

/**
 * Liste les répertoires d'un répertoire
 * @param {string} dirpath - Le chemin du répertoire
 * @returns {string[]} La liste des répertoires
 */
export function listDirectories(dirpath) {
  try {
    if (!directoryExists(dirpath)) {
      return [];
    }

    const items = fs.readdirSync(dirpath);
    return items.filter((item) => {
      const fullPath = path.join(dirpath, item);
      return fs.statSync(fullPath).isDirectory();
    });
  } catch (error) {
    console.error(
      `Erreur lors du listage des répertoires de ${dirpath}:`,
      error,
    );
    return [];
  }
}

/**
 * Résout un chemin relatif au projet
 * @param {...string} segments - Les segments du chemin
 * @returns {string} Le chemin absolu
 */
export function resolveProjectPath(...segments) {
  // Remonte de scripts/utils vers la racine du projet api
  const projectRoot = path.join(__dirname, "..", "..");
  return path.join(projectRoot, ...segments);
}

/**
 * Résout un chemin vers src/routes
 * @param {...string} segments - Les segments du chemin
 * @returns {string} Le chemin absolu
 */
export function resolveRoutesPath(...segments) {
  return resolveProjectPath("src", "routes", ...segments);
}

/**
 * Résout un chemin vers les tests
 * @param {...string} segments - Les segments du chemin
 * @returns {string} Le chemin absolu
 */
export function resolveTestsPath(...segments) {
  // Les tests sont dans src/routes/{domaine}/__tests__/
  if (segments.length > 0) {
    const [domainName, ...rest] = segments;
    return resolveProjectPath(
      "src",
      "routes",
      domainName,
      "__tests__",
      ...rest,
    );
  }
  // Si aucun segment, retourne le dossier routes (pour lister les domaines)
  return resolveProjectPath("src", "routes");
}

/**
 * Obtient le chemin relatif depuis la racine du projet
 * @param {string} absolutePath - Le chemin absolu
 * @returns {string} Le chemin relatif
 */
export function getRelativePath(absolutePath) {
  const projectRoot = resolveProjectPath();
  return path.relative(projectRoot, absolutePath);
}

/**
 * Ajoute une extension si elle n'existe pas
 * @param {string} filepath - Le chemin du fichier
 * @param {string} ext - L'extension (avec le point)
 * @returns {string} Le chemin avec l'extension
 */
export function ensureExtension(filepath, ext) {
  if (!filepath.endsWith(ext)) {
    return filepath + ext;
  }
  return filepath;
}

/**
 * Remplace l'extension d'un fichier
 * @param {string} filepath - Le chemin du fichier
 * @param {string} newExt - La nouvelle extension (avec le point)
 * @returns {string} Le chemin avec la nouvelle extension
 */
export function replaceExtension(filepath, newExt) {
  const parsed = path.parse(filepath);
  return path.join(parsed.dir, parsed.name + newExt);
}

/**
 * Vérifie si un chemin est dans un répertoire
 * @param {string} filepath - Le chemin à vérifier
 * @param {string} dirpath - Le répertoire parent
 * @returns {boolean} True si le chemin est dans le répertoire
 */
export function isInDirectory(filepath, dirpath) {
  const relative = path.relative(dirpath, filepath);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

/**
 * Normalise les séparateurs de chemin
 * @param {string} filepath - Le chemin à normaliser
 * @returns {string} Le chemin normalisé
 */
export function normalizePath(filepath) {
  return filepath.split(path.sep).join("/");
}

/**
 * Lit un fichier JSON
 * @param {string} filepath - Le chemin du fichier JSON
 * @returns {object|null} L'objet JSON ou null
 */
export function readJsonFile(filepath) {
  try {
    const content = readFile(filepath);
    if (!content) return null;
    return JSON.parse(content);
  } catch (error) {
    console.error(`Erreur lors de la lecture du JSON ${filepath}:`, error);
    return null;
  }
}

/**
 * Écrit un fichier JSON
 * @param {string} filepath - Le chemin du fichier JSON
 * @param {object} data - Les données à écrire
 * @param {object} options - Options d'écriture
 * @returns {boolean} True si écrit avec succès
 */
export function writeJsonFile(filepath, data, options = {}) {
  const { indent = 2, ...writeOptions } = options;
  const content = JSON.stringify(data, null, indent);
  return writeFile(filepath, content, writeOptions);
}

export default {
  fileExists,
  directoryExists,
  createDirectory,
  writeFile,
  readFile,
  copyFile,
  deleteFile,
  listFiles,
  listDirectories,
  resolveProjectPath,
  resolveRoutesPath,
  resolveTestsPath,
  getRelativePath,
  ensureExtension,
  replaceExtension,
  isInDirectory,
  normalizePath,
  readJsonFile,
  writeJsonFile,
};
