/**
 * 🔤 String Utilities - ClubManager API
 *
 * Utilitaires de manipulation de chaînes pour les scripts de génération
 */

/**
 * Convertit une chaîne en PascalCase
 * @param {string} str - La chaîne à convertir
 * @returns {string} La chaîne en PascalCase
 *
 * @example
 * toPascalCase('mon-module') // => 'MonModule'
 * toPascalCase('mon_module') // => 'MonModule'
 * toPascalCase('monModule') // => 'MonModule'
 */
export function toPascalCase(str) {
  return str
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convertit une chaîne en camelCase
 * @param {string} str - La chaîne à convertir
 * @returns {string} La chaîne en camelCase
 *
 * @example
 * toCamelCase('mon-module') // => 'monModule'
 * toCamelCase('mon_module') // => 'monModule'
 */
export function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convertit une chaîne en kebab-case
 * @param {string} str - La chaîne à convertir
 * @returns {string} La chaîne en kebab-case
 *
 * @example
 * toKebabCase('MonModule') // => 'mon-module'
 * toKebabCase('monModule') // => 'mon-module'
 */
export function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convertit une chaîne en snake_case
 * @param {string} str - La chaîne à convertir
 * @returns {string} La chaîne en snake_case
 *
 * @example
 * toSnakeCase('MonModule') // => 'mon_module'
 * toSnakeCase('monModule') // => 'mon_module'
 */
export function toSnakeCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Convertit une chaîne en UPPER_SNAKE_CASE
 * @param {string} str - La chaîne à convertir
 * @returns {string} La chaîne en UPPER_SNAKE_CASE
 *
 * @example
 * toUpperSnakeCase('mon-module') // => 'MON_MODULE'
 */
export function toUpperSnakeCase(str) {
  return toSnakeCase(str).toUpperCase();
}

/**
 * Convertit une chaîne au pluriel (français)
 * @param {string} str - La chaîne à convertir
 * @returns {string} La chaîne au pluriel
 *
 * @example
 * toPlural('utilisateur') // => 'utilisateurs'
 * toPlural('cours') // => 'cours'
 * toPlural('commande') // => 'commandes'
 */
export function toPlural(str) {
  // Cas spéciaux français
  const irregulars = {
    'cours': 'cours',
    'prix': 'prix',
    'choix': 'choix',
    'voix': 'voix',
    'paiement': 'paiements',
    'evenement': 'evenements',
    'événement': 'événements',
  };

  const lower = str.toLowerCase();
  if (irregulars[lower]) {
    return irregulars[lower];
  }

  // Règles générales
  if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z')) {
    return str;
  }

  if (str.endsWith('au') || str.endsWith('eau')) {
    return str + 'x';
  }

  if (str.endsWith('al')) {
    return str.slice(0, -2) + 'aux';
  }

  return str + 's';
}

/**
 * Convertit une chaîne au singulier (français)
 * @param {string} str - La chaîne à convertir
 * @returns {string} La chaîne au singulier
 *
 * @example
 * toSingular('utilisateurs') // => 'utilisateur'
 * toSingular('cours') // => 'cours'
 */
export function toSingular(str) {
  // Cas spéciaux
  const irregulars = {
    'cours': 'cours',
    'prix': 'prix',
    'choix': 'choix',
    'voix': 'voix',
    'paiements': 'paiement',
    'evenements': 'evenement',
    'événements': 'événement',
  };

  const lower = str.toLowerCase();
  if (irregulars[lower]) {
    return irregulars[lower];
  }

  if (str.endsWith('aux')) {
    return str.slice(0, -3) + 'al';
  }

  if (str.endsWith('s')) {
    return str.slice(0, -1);
  }

  return str;
}

/**
 * Capitalise la première lettre
 * @param {string} str - La chaîne à capitaliser
 * @returns {string} La chaîne capitalisée
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Décapitalise la première lettre
 * @param {string} str - La chaîne à décapitaliser
 * @returns {string} La chaîne décapitalisée
 */
export function uncapitalize(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Indente un texte
 * @param {string} text - Le texte à indenter
 * @param {number} spaces - Le nombre d'espaces d'indentation
 * @returns {string} Le texte indenté
 */
export function indent(text, spaces = 2) {
  const indentation = ' '.repeat(spaces);
  return text.split('\n').map(line => indentation + line).join('\n');
}

/**
 * Génère un nom de fichier de test
 * @param {string} filename - Le nom du fichier
 * @param {string} type - Le type de test (unit, integration, e2e, etc.)
 * @returns {string} Le nom du fichier de test
 */
export function toTestFilename(filename, type = 'test') {
  const ext = filename.split('.').pop();
  const base = filename.replace(`.${ext}`, '');
  return `${base}.${type}.${ext}`;
}

/**
 * Génère un nom de variable descriptif
 * @param {string} domain - Le domaine
 * @param {string} type - Le type (service, resolver, etc.)
 * @returns {string} Le nom de variable
 */
export function toVariableName(domain, type) {
  return toCamelCase(`${domain}-${type}`);
}

/**
 * Génère un nom de classe descriptif
 * @param {string} domain - Le domaine
 * @param {string} type - Le type (Service, Resolver, etc.)
 * @returns {string} Le nom de classe
 */
export function toClassName(domain, type) {
  return toPascalCase(`${domain}-${type}`);
}

/**
 * Nettoie un nom de domaine
 * @param {string} domain - Le nom du domaine
 * @returns {string} Le nom nettoyé
 */
export function cleanDomainName(domain) {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Valide un nom de domaine
 * @param {string} domain - Le nom du domaine
 * @returns {boolean} True si valide
 */
export function isValidDomainName(domain) {
  return /^[a-z][a-z0-9-_]*$/.test(domain);
}

/**
 * Génère un commentaire de documentation
 * @param {string} description - La description
 * @param {number} width - La largeur maximale
 * @returns {string} Le commentaire formaté
 */
export function toDocComment(description, width = 80) {
  const words = description.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length > width - 3) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines.map(line => ` * ${line}`).join('\n');
}

export default {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  toUpperSnakeCase,
  toPlural,
  toSingular,
  capitalize,
  uncapitalize,
  indent,
  toTestFilename,
  toVariableName,
  toClassName,
  cleanDomainName,
  isValidDomainName,
  toDocComment,
};
