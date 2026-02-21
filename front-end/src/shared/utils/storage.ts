/**
 * Utility pour gérer localStorage de manière sécurisée et typée
 */

import type { UserData } from '@clubmanager/types';

// Clés de stockage
const STORAGE_KEYS = {
  USER_DATA: 'userData',
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

/**
 * Récupère les données utilisateur depuis localStorage
 */
export const getUser = (): UserData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!data) return null;

    const parsed = JSON.parse(data);

    // Supporte les deux formats possibles (data ou direct)
    return parsed.first_name && parsed.last_name ? parsed : parsed.data;
  } catch (error) {
    console.error('Erreur lors de la lecture des données utilisateur:', error);
    return null;
  }
};

/**
 * Sauvegarde les données utilisateur dans localStorage
 */
export const setUser = (userData: UserData): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données utilisateur:', error);
  }
};

/**
 * Supprime les données utilisateur de localStorage
 */
export const removeUser = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Erreur lors de la suppression des données utilisateur:', error);
  }
};

/**
 * Récupère le token d'authentification
 */
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Erreur lors de la lecture du token:', error);
    return null;
  }
};

/**
 * Sauvegarde le token d'authentification
 */
export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du token:', error);
  }
};

/**
 * Supprime le token d'authentification
 */
export const removeAuthToken = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Erreur lors de la suppression du token:', error);
  }
};

/**
 * Récupère le refresh token
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Erreur lors de la lecture du refresh token:', error);
    return null;
  }
};

/**
 * Sauvegarde le refresh token
 */
export const setRefreshToken = (token: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du refresh token:', error);
  }
};

/**
 * Supprime le refresh token
 */
export const removeRefreshToken = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Erreur lors de la suppression du refresh token:', error);
  }
};

/**
 * Nettoie toutes les données d'authentification
 */
export const clearAuth = (): void => {
  removeUser();
  removeAuthToken();
  removeRefreshToken();
};

/**
 * Vérifie si l'utilisateur est connecté
 */
export const isAuthenticated = (): boolean => {
  return getUser() !== null || getAuthToken() !== null;
};

/**
 * Récupère une valeur générique depuis localStorage avec parsing JSON
 */
export const getItem = <T>(key: string, defaultValue: T | null = null): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Sauvegarde une valeur générique dans localStorage avec stringify JSON
 */
export const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
  }
};

/**
 * Supprime une valeur de localStorage
 */
export const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Erreur lors de la suppression de ${key}:`, error);
  }
};
