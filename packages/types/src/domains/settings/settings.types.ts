/**
 * Generated TypeScript types for settings domain
 * @generated - Do not edit manually
 */

export interface Settings {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type?: 'string' | 'number' | 'boolean' | 'json';
  /** Catégorie du paramètre */
  category?: string;
  description?: string;
  /** 1 si visible publiquement, 0 sinon */
  is_public?: boolean;
  updated_at?: string;
}

export interface SettingsInsert {
  setting_key: string;
  setting_value: string;
  setting_type?: 'string' | 'number' | 'boolean' | 'json';
  /** Catégorie du paramètre */
  category?: string;
  description?: string;
  /** 1 si visible publiquement, 0 sinon */
  is_public?: boolean;
}

export interface SettingsUpdate {
  setting_key?: string;
  setting_value?: string;
  setting_type?: 'string' | 'number' | 'boolean' | 'json';
  /** Catégorie du paramètre */
  category?: string;
  description?: string;
  /** 1 si visible publiquement, 0 sinon */
  is_public?: boolean;
  updated_at?: string;
}

