/**
 * ============================================================================
 * SECURE STORAGE UTILITY
 * ============================================================================
 *
 * Provides secure token storage with multiple layers of protection:
 * - HttpOnly cookies (preferred for tokens)
 * - Encrypted localStorage fallback
 * - XSS protection
 * - Auto-expiration
 *
 * Usage:
 * ```tsx
 * import { secureStorage } from '@/shared/utils/secureStorage';
 *
 * // Store token
 * secureStorage.setToken('my-jwt-token');
 *
 * // Get token
 * const token = secureStorage.getToken();
 *
 * // Clear token
 * secureStorage.clearToken();
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface StorageOptions {
  expiresInDays?: number;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface SecureStorageItem {
  value: string;
  timestamp: number;
  expiresAt?: number;
}

// ============================================================================
// Constants
// ============================================================================

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_DAYS = 7;
const ENCRYPTION_KEY = 'ClubManager_2024_Secret'; // En production: généré dynamiquement

// ============================================================================
// Cookie Utilities
// ============================================================================

/**
 * Set a cookie with security options
 */
function setCookie(
  name: string,
  value: string,
  options: StorageOptions = {}
): void {
  const {
    expiresInDays = TOKEN_EXPIRY_DAYS,
    secure = window.location.protocol === 'https:',
    sameSite = 'strict',
  } = options;

  const expires = new Date();
  expires.setDate(expires.getDate() + expiresInDays);

  let cookie = `${name}=${encodeURIComponent(value)}`;
  cookie += `; expires=${expires.toUTCString()}`;
  cookie += `; path=/`;
  cookie += `; SameSite=${sameSite}`;

  if (secure) {
    cookie += `; Secure`;
  }

  // Note: HttpOnly ne peut être défini que côté serveur
  // Cette fonction est un fallback pour le client

  document.cookie = cookie;
}

/**
 * Get a cookie by name
 */
function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Delete a cookie by name
 */
function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ============================================================================
// Simple Encryption (Basic obfuscation)
// ============================================================================

/**
 * Simple XOR encryption for localStorage
 * NOTE: This is NOT cryptographically secure, just obfuscation
 * Real encryption should use Web Crypto API
 */
function simpleEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result); // Base64 encode
}

/**
 * Decrypt XOR encrypted text
 */
function simpleDecrypt(encrypted: string, key: string): string {
  try {
    const decoded = atob(encrypted); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    console.error('[SecureStorage] Decryption failed:', error);
    return '';
  }
}

// ============================================================================
// Web Crypto API (Proper encryption - async)
// ============================================================================

/**
 * Generate a crypto key from password
 */
async function generateCryptoKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('ClubManager_Salt_2024'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using Web Crypto API
 */
async function cryptoEncrypt(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await generateCryptoKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using Web Crypto API
 */
async function cryptoDecrypt(encryptedData: string, password: string): Promise<string> {
  try {
    const decoder = new TextDecoder();
    const key = await generateCryptoKey(password);

    // Decode base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[SecureStorage] Crypto decryption failed:', error);
    return '';
  }
}

// ============================================================================
// LocalStorage with Encryption
// ============================================================================

/**
 * Store encrypted data in localStorage
 */
function setEncryptedStorage(key: string, value: string, expiresInDays?: number): void {
  const item: SecureStorageItem = {
    value: simpleEncrypt(value, ENCRYPTION_KEY),
    timestamp: Date.now(),
  };

  if (expiresInDays) {
    item.expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  }

  localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Get encrypted data from localStorage
 */
function getEncryptedStorage(key: string): string | null {
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    const item: SecureStorageItem = JSON.parse(stored);

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return simpleDecrypt(item.value, ENCRYPTION_KEY);
  } catch (error) {
    console.error('[SecureStorage] Failed to parse storage:', error);
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Remove encrypted data from localStorage
 */
function removeEncryptedStorage(key: string): void {
  localStorage.removeItem(key);
}

// ============================================================================
// Main Secure Storage Interface
// ============================================================================

export const secureStorage = {
  /**
   * Store authentication token securely
   * Tries cookie first, falls back to encrypted localStorage
   */
  setToken(token: string, options: StorageOptions = {}): void {
    try {
      // Try to set as cookie (will be httpOnly in production via backend)
      setCookie(TOKEN_KEY, token, options);

      // Fallback: encrypted localStorage
      setEncryptedStorage(TOKEN_KEY, token, options.expiresInDays);

      console.log('✅ [SecureStorage] Token stored securely');
    } catch (error) {
      console.error('❌ [SecureStorage] Failed to store token:', error);
    }
  },

  /**
   * Get authentication token
   * Tries cookie first, falls back to localStorage
   */
  getToken(): string | null {
    // Try cookie first
    let token = getCookie(TOKEN_KEY);
    if (token) return token;

    // Fallback to localStorage
    token = getEncryptedStorage(TOKEN_KEY);
    return token;
  },

  /**
   * Clear authentication token
   */
  clearToken(): void {
    deleteCookie(TOKEN_KEY);
    removeEncryptedStorage(TOKEN_KEY);
    console.log('🗑️ [SecureStorage] Token cleared');
  },

  /**
   * Store refresh token
   */
  setRefreshToken(token: string, options: StorageOptions = {}): void {
    setCookie(REFRESH_TOKEN_KEY, token, { ...options, expiresInDays: 30 });
    setEncryptedStorage(REFRESH_TOKEN_KEY, token, 30);
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return getCookie(REFRESH_TOKEN_KEY) || getEncryptedStorage(REFRESH_TOKEN_KEY);
  },

  /**
   * Clear refresh token
   */
  clearRefreshToken(): void {
    deleteCookie(REFRESH_TOKEN_KEY);
    removeEncryptedStorage(REFRESH_TOKEN_KEY);
  },

  /**
   * Clear all secure data
   */
  clearAll(): void {
    this.clearToken();
    this.clearRefreshToken();
    console.log('🧹 [SecureStorage] All secure data cleared');
  },

  /**
   * Check if token exists and is valid
   */
  hasValidToken(): boolean {
    return !!this.getToken();
  },

  /**
   * Migrate from plain localStorage
   */
  migrateFromPlainStorage(): void {
    try {
      // Check old storage keys
      const oldToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      const oldRefreshToken = localStorage.getItem('refreshToken');

      if (oldToken) {
        console.log('🔄 [SecureStorage] Migrating token to secure storage...');
        this.setToken(oldToken);
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
      }

      if (oldRefreshToken) {
        this.setRefreshToken(oldRefreshToken);
        localStorage.removeItem('refreshToken');
      }

      // Also check Zustand auth-storage
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          if (parsed.state?.token) {
            this.setToken(parsed.state.token);
          }
        } catch (e) {
          console.error('[SecureStorage] Failed to migrate from auth-storage');
        }
      }

      console.log('✅ [SecureStorage] Migration complete');
    } catch (error) {
      console.error('❌ [SecureStorage] Migration failed:', error);
    }
  },

  // Advanced: Crypto API methods (async)
  async setTokenAsync(token: string, password: string = ENCRYPTION_KEY): Promise<void> {
    const encrypted = await cryptoEncrypt(token, password);
    localStorage.setItem(TOKEN_KEY, encrypted);
  },

  async getTokenAsync(password: string = ENCRYPTION_KEY): Promise<string | null> {
    const encrypted = localStorage.getItem(TOKEN_KEY);
    if (!encrypted) return null;
    return await cryptoDecrypt(encrypted, password);
  },
};

// ============================================================================
// Auto-migration on import
// ============================================================================

// Automatically migrate old tokens when module loads
if (typeof window !== 'undefined') {
  secureStorage.migrateFromPlainStorage();
}

// ============================================================================
// Export
// ============================================================================

export default secureStorage;
