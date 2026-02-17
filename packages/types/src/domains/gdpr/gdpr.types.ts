/**
 * Generated TypeScript types for gdpr domain
 * @generated - Do not edit manually
 */

export interface UserConsents {
  id: number;
  user_id: number;
  consent_type: 'photos' | 'newsletter' | 'data_processing' | 'marketing' | 'third_party';
  consent_given: boolean;
  /** Texte du consentement au moment de l'acceptation */
  consent_text?: string;
  given_at?: string;
  withdrawn_at?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserConsentsInsert {
  user_id: number;
  consent_type: 'photos' | 'newsletter' | 'data_processing' | 'marketing' | 'third_party';
  consent_given?: boolean;
  /** Texte du consentement au moment de l'acceptation */
  consent_text?: string;
  given_at?: string;
  withdrawn_at?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface UserConsentsUpdate {
  user_id?: number;
  consent_type?: 'photos' | 'newsletter' | 'data_processing' | 'marketing' | 'third_party';
  consent_given?: boolean;
  /** Texte du consentement au moment de l'acceptation */
  consent_text?: string;
  given_at?: string;
  withdrawn_at?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
}

