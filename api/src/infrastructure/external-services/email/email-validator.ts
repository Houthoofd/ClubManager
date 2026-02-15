/**
 * 📧 Advanced Email Validator
 *
 * Validation email avancée avec :
 * - Vérification syntaxe RFC 5322
 * - Vérification DNS MX records
 * - Détection emails jetables (disposable)
 * - Détection comptes rôle (role accounts)
 * - Suggestions de correction typos
 * - Score de qualité 0-100
 *
 * @module email-validator
 * @since Phase 3
 */

import { promises as dns } from 'dns';
import type {
  EmailValidationConfig,
  EmailValidationResult,
  EmailValidationIssue,
  EmailTypoSuggestion,
  EmailDomain
} from '@clubmanager/types';

/**
 * Liste des domaines jetables courants
 */
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'throwaway.email',
  'yopmail.com',
  'maildrop.cc',
  'temp-mail.org',
  'trashmail.com',
  'fakeinbox.com',
  'dispostable.com',
  'getnada.com',
  'mohmal.com',
  'sharklasers.com',
  'spam4.me',
  'mintemail.com',
  'mytemp.email',
  'emailondeck.com'
]);

/**
 * Liste des comptes rôle courants
 */
const ROLE_ACCOUNTS = new Set([
  'abuse',
  'admin',
  'administrator',
  'contact',
  'hello',
  'help',
  'info',
  'mail',
  'noreply',
  'no-reply',
  'postmaster',
  'root',
  'sales',
  'security',
  'support',
  'webmaster',
  'hostmaster',
  'marketing',
  'team',
  'office'
]);

/**
 * Typos courants de domaines populaires
 */
const DOMAIN_TYPOS: Record<string, string[]> = {
  'gmail.com': ['gmial.com', 'gmai.com', 'gmil.com', 'gmail.co', 'gamil.com', 'gmaul.com'],
  'hotmail.com': ['hotmial.com', 'hotmai.com', 'hotmil.com', 'hotmail.co', 'hotnail.com'],
  'outlook.com': ['outlok.com', 'outlock.com', 'outlook.co', 'ooutlook.com'],
  'yahoo.com': ['yahou.com', 'yaho.com', 'yahho.com', 'yahoo.co', 'yhoo.com'],
  'icloud.com': ['icoud.com', 'iclud.com', 'icloude.com', 'icloud.co'],
  'live.com': ['live.co', 'liv.com', 'livr.com'],
  'msn.com': ['mns.com', 'msm.com', 'msn.co'],
  'aol.com': ['aol.co', 'ail.com', 'aol.con']
};

/**
 * TLD (Top Level Domains) valides courants
 */
const VALID_TLDS = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  'be', 'fr', 'de', 'uk', 'nl', 'es', 'it', 'eu',
  'io', 'co', 'app', 'dev', 'tech', 'online', 'site',
  'info', 'biz', 'name', 'mobi', 'pro'
]);

/**
 * Validateur email avancé
 */
export class EmailValidator {
  private config: EmailValidationConfig;
  private dnsCache: Map<string, { exists: boolean; timestamp: number }> = new Map();
  private readonly DNS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

  constructor(config: Partial<EmailValidationConfig> = {}) {
    this.config = {
      enabled: true,
      checkMxRecords: true,
      checkDisposable: true,
      checkTypos: true,
      checkRoleAccounts: true,
      strictMode: false,
      timeout: 5000,
      ...config
    };
  }

  /**
   * Valide une adresse email complète
   */
  async validate(email: string): Promise<EmailValidationResult> {
    if (!this.config.enabled) {
      return this.createBasicResult(email, true);
    }

    const normalized = email.toLowerCase().trim();
    const issues: EmailValidationIssue[] = [];
    let score = 100;

    // 1. Vérification syntaxe
    const syntaxValid = this.validateSyntax(normalized);
    if (!syntaxValid) {
      issues.push({
        type: 'syntax',
        severity: 'error',
        message: 'Invalid email syntax'
      });
      return this.createResult(email, normalized, false, issues, 0);
    }

    const [username, domain] = normalized.split('@');

    // 2. Vérification domaine jetable
    if (this.config.checkDisposable) {
      const isDisposable = this.isDisposableDomain(domain);
      if (isDisposable) {
        issues.push({
          type: 'disposable',
          severity: this.config.strictMode ? 'error' : 'warning',
          message: 'Disposable email address detected'
        });
        score -= this.config.strictMode ? 100 : 50;
      }
    }

    // 3. Vérification compte rôle
    if (this.config.checkRoleAccounts) {
      const isRole = this.isRoleAccount(username);
      if (isRole) {
        issues.push({
          type: 'role_account',
          severity: this.config.strictMode ? 'error' : 'warning',
          message: 'Role account detected (e.g., info@, support@)'
        });
        score -= this.config.strictMode ? 100 : 30;
      }
    }

    // 4. Vérification typos
    if (this.config.checkTypos) {
      const typoSuggestion = this.checkTypos(domain);
      if (typoSuggestion) {
        issues.push({
          type: 'typo',
          severity: 'warning',
          message: `Possible typo detected in domain`,
          suggestion: `${username}@${typoSuggestion.suggested}`
        });
        score -= 20;
      }
    }

    // 5. Vérification DNS MX records
    let mxValid = true;
    if (this.config.checkMxRecords) {
      mxValid = await this.checkMxRecords(domain);
      if (!mxValid) {
        issues.push({
          type: 'mx_records',
          severity: 'error',
          message: 'Domain has no valid MX records'
        });
        score -= 100;
      }
    }

    // Calculer le résultat final
    const valid = score >= (this.config.strictMode ? 80 : 50);
    const recommendation = this.getRecommendation(score);

    return this.createResult(
      email,
      normalized,
      valid,
      issues,
      Math.max(0, score),
      {
        mxRecords: mxValid,
        disposable: this.isDisposableDomain(domain),
        roleAccount: this.isRoleAccount(username),
        typoSuggestion: this.checkTypos(domain)?.suggested,
        domain,
        provider: this.detectProvider(domain)
      },
      recommendation
    );
  }

  /**
   * Valide la syntaxe de l'email selon RFC 5322 (simplifié)
   */
  private validateSyntax(email: string): boolean {
    if (!email || email.length > 320) {
      return false;
    }

    // Regex simplifiée mais robuste
    const regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

    if (!regex.test(email)) {
      return false;
    }

    const [username, domain] = email.split('@');

    // Vérifications supplémentaires
    if (!username || !domain) return false;
    if (username.length > 64) return false;
    if (domain.length > 255) return false;
    if (username.startsWith('.') || username.endsWith('.')) return false;
    if (username.includes('..')) return false;
    if (domain.startsWith('-') || domain.endsWith('-')) return false;
    if (!domain.includes('.')) return false;

    return true;
  }

  /**
   * Vérifie si le domaine est jetable
   */
  private isDisposableDomain(domain: string): boolean {
    return DISPOSABLE_DOMAINS.has(domain);
  }

  /**
   * Vérifie si c'est un compte rôle
   */
  private isRoleAccount(username: string): boolean {
    return ROLE_ACCOUNTS.has(username);
  }

  /**
   * Vérifie les typos courants dans le domaine
   */
  private checkTypos(domain: string): EmailTypoSuggestion | null {
    // Vérifier les typos directs
    for (const [correct, typos] of Object.entries(DOMAIN_TYPOS)) {
      if (typos.includes(domain)) {
        return {
          original: domain,
          suggested: correct,
          confidence: 90,
          type: 'domain'
        };
      }
    }

    // Vérifier les typos de TLD
    const parts = domain.split('.');
    const tld = parts[parts.length - 1];

    if (!VALID_TLDS.has(tld)) {
      // Suggestions TLD courantes
      const tldSuggestions: Record<string, string> = {
        'co': 'com',
        'con': 'com',
        'cpm': 'com',
        'vom': 'com',
        'ogr': 'org',
        'rog': 'org',
        'ent': 'net',
        'ten': 'net'
      };

      if (tldSuggestions[tld]) {
        parts[parts.length - 1] = tldSuggestions[tld];
        return {
          original: domain,
          suggested: parts.join('.'),
          confidence: 85,
          type: 'tld'
        };
      }
    }

    // Vérifier distance Levenshtein pour domaines populaires
    const suggestion = this.findClosestDomain(domain);
    if (suggestion) {
      return suggestion;
    }

    return null;
  }

  /**
   * Trouve le domaine le plus proche (distance Levenshtein)
   */
  private findClosestDomain(domain: string): EmailTypoSuggestion | null {
    const popularDomains = Object.keys(DOMAIN_TYPOS);
    let closest: { domain: string; distance: number } | null = null;

    for (const popular of popularDomains) {
      const distance = this.levenshteinDistance(domain, popular);

      // Si distance <= 2, c'est probablement une typo
      if (distance <= 2 && distance > 0) {
        if (!closest || distance < closest.distance) {
          closest = { domain: popular, distance };
        }
      }
    }

    if (closest) {
      const confidence = Math.max(50, 100 - (closest.distance * 20));
      return {
        original: domain,
        suggested: closest.domain,
        confidence,
        type: 'domain'
      };
    }

    return null;
  }

  /**
   * Calcule la distance de Levenshtein entre deux chaînes
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Vérifie les enregistrements MX DNS
   */
  private async checkMxRecords(domain: string): Promise<boolean> {
    try {
      // Vérifier le cache
      const cached = this.dnsCache.get(domain);
      if (cached && (Date.now() - cached.timestamp) < this.DNS_CACHE_TTL) {
        return cached.exists;
      }

      // Vérifier les MX records avec timeout
      const records = await Promise.race([
        dns.resolveMx(domain),
        this.timeout(this.config.timeout!)
      ]);

      const exists = Array.isArray(records) && records.length > 0;

      // Mettre en cache
      this.dnsCache.set(domain, {
        exists,
        timestamp: Date.now()
      });

      return exists;
    } catch (error) {
      // En cas d'erreur DNS, considérer comme invalide en mode strict
      if (this.config.strictMode) {
        return false;
      }

      // En mode normal, donner le bénéfice du doute
      return true;
    }
  }

  /**
   * Détecte le fournisseur email
   */
  private detectProvider(domain: string): string | undefined {
    const providers: Record<string, string> = {
      'gmail.com': 'Gmail',
      'googlemail.com': 'Gmail',
      'outlook.com': 'Outlook',
      'hotmail.com': 'Hotmail',
      'live.com': 'Microsoft Live',
      'yahoo.com': 'Yahoo',
      'yahoo.fr': 'Yahoo',
      'icloud.com': 'iCloud',
      'me.com': 'iCloud',
      'aol.com': 'AOL',
      'protonmail.com': 'ProtonMail',
      'zoho.com': 'Zoho',
      'mail.com': 'Mail.com',
      'gmx.com': 'GMX',
      'yandex.com': 'Yandex'
    };

    return providers[domain];
  }

  /**
   * Obtient une recommandation basée sur le score
   */
  private getRecommendation(score: number): 'accept' | 'review' | 'reject' {
    if (score >= 80) return 'accept';
    if (score >= 50) return 'review';
    return 'reject';
  }

  /**
   * Crée un résultat de validation complet
   */
  private createResult(
    email: string,
    normalized: string,
    valid: boolean,
    issues: EmailValidationIssue[],
    score: number,
    details?: any,
    recommendation?: 'accept' | 'review' | 'reject'
  ): EmailValidationResult {
    return {
      valid,
      email,
      normalized,
      issues,
      score,
      recommendation: recommendation || this.getRecommendation(score),
      details: {
        syntax: true,
        ...details
      }
    };
  }

  /**
   * Crée un résultat basique (validation désactivée)
   */
  private createBasicResult(email: string, valid: boolean): EmailValidationResult {
    return {
      valid,
      email,
      normalized: email.toLowerCase().trim(),
      issues: [],
      score: valid ? 100 : 0,
      recommendation: valid ? 'accept' : 'reject',
      details: {
        syntax: valid
      }
    };
  }

  /**
   * Promise timeout utility
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('DNS lookup timeout')), ms);
    });
  }

  /**
   * Analyse un domaine email
   */
  async analyzeDomain(domain: string): Promise<EmailDomain> {
    const mxRecords = await this.getMxRecords(domain);
    const disposable = this.isDisposableDomain(domain);
    const provider = this.detectProvider(domain);

    let category: EmailDomain['category'] = 'unknown';
    if (disposable) {
      category = 'disposable';
    } else if (provider) {
      category = 'personal';
    } else if (mxRecords.length > 0) {
      category = 'business';
    }

    return {
      domain,
      provider,
      category,
      mxRecords,
      verified: mxRecords.length > 0,
      reputation: this.calculateDomainReputation(domain, category, disposable)
    };
  }

  /**
   * Récupère les enregistrements MX
   */
  private async getMxRecords(domain: string): Promise<string[]> {
    try {
      const records = await dns.resolveMx(domain);
      return records.map(r => r.exchange).sort((a, b) => {
        const recordA = records.find(r => r.exchange === a);
        const recordB = records.find(r => r.exchange === b);
        return (recordA?.priority || 0) - (recordB?.priority || 0);
      });
    } catch {
      return [];
    }
  }

  /**
   * Calcule la réputation d'un domaine (0-100)
   */
  private calculateDomainReputation(
    domain: string,
    category: EmailDomain['category'],
    disposable: boolean
  ): number {
    if (disposable) return 10;
    if (category === 'personal' && this.detectProvider(domain)) return 90;
    if (category === 'business') return 70;
    return 50;
  }

  /**
   * Valide un lot d'emails
   */
  async validateBatch(emails: string[]): Promise<EmailValidationResult[]> {
    return Promise.all(emails.map(email => this.validate(email)));
  }

  /**
   * Nettoie le cache DNS
   */
  clearCache(): void {
    this.dnsCache.clear();
  }

  /**
   * Active ou désactive le validateur
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Vérifie si le validateur est activé
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(config: Partial<EmailValidationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): EmailValidationConfig {
    return { ...this.config };
  }
}

/**
 * Instance singleton du validateur
 */
let emailValidatorInstance: EmailValidator | null = null;

/**
 * Récupère ou crée l'instance singleton
 */
export function getEmailValidator(config?: Partial<EmailValidationConfig>): EmailValidator {
  if (!emailValidatorInstance) {
    emailValidatorInstance = new EmailValidator(config);
  }
  return emailValidatorInstance;
}

/**
 * Réinitialise l'instance singleton
 */
export function resetEmailValidator(): void {
  if (emailValidatorInstance) {
    emailValidatorInstance.clearCache();
    emailValidatorInstance = null;
  }
}

/**
 * Helper pour valider rapidement un email
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  const validator = getEmailValidator();
  return validator.validate(email);
}

/**
 * Helper pour valider un lot d'emails
 */
export async function validateEmailBatch(emails: string[]): Promise<EmailValidationResult[]> {
  const validator = getEmailValidator();
  return validator.validateBatch(emails);
}
