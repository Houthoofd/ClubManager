/**
 * Utility pour logger uniquement en développement
 * En production, tous les logs sont supprimés automatiquement
 */

const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Log standard (remplace console.log)
 */
export const log = (...args: any[]): void => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * Log d'erreur (remplace console.error)
 */
export const error = (...args: any[]): void => {
  if (isDevelopment) {
    console.error(...args);
  }
};

/**
 * Log de warning (remplace console.warn)
 */
export const warn = (...args: any[]): void => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

/**
 * Log d'information (remplace console.info)
 */
export const info = (...args: any[]): void => {
  if (isDevelopment) {
    console.info(...args);
  }
};

/**
 * Log de debug avec préfixe
 */
export const debug = (component: string, ...args: any[]): void => {
  if (isDevelopment) {
    console.log(`🔧 [${component}]`, ...args);
  }
};

/**
 * Log de succès avec préfixe
 */
export const success = (message: string, ...args: any[]): void => {
  if (isDevelopment) {
    console.log(`✅ ${message}`, ...args);
  }
};

/**
 * Log avec groupe collapsible
 */
export const group = (label: string, callback: () => void): void => {
  if (isDevelopment) {
    console.group(label);
    callback();
    console.groupEnd();
  }
};

/**
 * Log de table (utile pour les arrays/objects)
 */
export const table = (data: any): void => {
  if (isDevelopment) {
    console.table(data);
  }
};

/**
 * Mesure de performance
 */
export const time = (label: string): void => {
  if (isDevelopment) {
    console.time(label);
  }
};

export const timeEnd = (label: string): void => {
  if (isDevelopment) {
    console.timeEnd(label);
  }
};

/**
 * Export par défaut pour usage simplifié
 */
export default {
  log,
  error,
  warn,
  info,
  debug,
  success,
  group,
  table,
  time,
  timeEnd,
};
