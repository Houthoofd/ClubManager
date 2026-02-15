/**
 * 🚫 Spam Score Checker
 *
 * Analyse le contenu des emails pour détecter :
 * - Mots spam courants
 * - Majuscules excessives
 * - Trop de liens
 * - Liens suspects
 * - Absence de lien de désabonnement
 * - Sujets trompeurs
 *
 * Score : 0-10 (0 = bon, 10 = très spam)
 *
 * @module spam-score-checker
 * @since Phase 3
 */

import type {
  SpamScoreConfig,
  SpamScoreResult,
  SpamScoreIssue
} from '@clubmanager/types';

/**
 * Mots spam courants (en minuscules)
 */
const SPAM_WORDS = new Set([
  // Urgence et pression
  'urgent', 'act now', 'limited time', 'expires today', 'hurry',
  'don\'t miss out', 'last chance', 'once in a lifetime', 'instant',

  // Argent
  'free money', 'cash bonus', 'extra income', 'earn $', 'make money fast',
  'million dollars', 'get rich', 'financial freedom', 'no investment',

  // Gratuit
  'free', 'absolutely free', 'risk-free', 'no cost', 'no fees',
  'free trial', 'free gift', 'free access', 'claim your free',

  // Gagnant
  'winner', 'you won', 'congratulations', 'selected', 'you\'ve been chosen',
  'prize', 'jackpot', 'lottery', 'sweepstakes',

  // Clickbait
  'click here', 'click now', 'click below', 'open immediately',
  'this is not spam', 'not junk', 'dear friend',

  // Santé et médical
  'lose weight', 'weight loss', 'diet', 'viagra', 'cialis',
  'miracle cure', 'all natural', 'doctor approved',

  // Légal et financier
  'unsecured credit', 'consolidate debt', 'lower your rates',
  'pre-approved', 'refinance', 'eliminate debt',

  // Autre
  'mlm', 'multi-level marketing', 'work from home', 'be your own boss',
  'hidden charges', 'satisfaction guaranteed', 'money back guarantee',
  'no obligation', 'no strings attached', 'unsubscribe below'
]);

/**
 * Phrases spam (expressions complètes)
 */
const SPAM_PHRASES = [
  'act now and get',
  'as seen on',
  'call now',
  'cancel at any time',
  'click here to remove',
  'double your income',
  'earn extra cash',
  'for instant access',
  'get it now',
  'great offer',
  'increase sales',
  'limited time offer',
  'no credit check',
  'order now',
  'please read',
  'reverses aging',
  'save big',
  'this is not a scam',
  'what are you waiting for'
];

/**
 * Extensions de fichiers suspects
 */
const SUSPICIOUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
  '.jar', '.msi', '.app', '.deb', '.rpm', '.dmg', '.pkg'
]);

/**
 * Domaines suspects pour les liens
 */
const SUSPICIOUS_DOMAINS = new Set([
  'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co',
  'youtu.be', 'is.gd', 'buff.ly', 'adf.ly'
]);

/**
 * Checker de score spam
 */
export class SpamScoreChecker {
  private config: SpamScoreConfig;

  constructor(config: Partial<SpamScoreConfig> = {}) {
    this.config = {
      enabled: true,
      threshold: 5,
      checkContent: true,
      checkSubject: true,
      checkLinks: true,
      checkImages: true,
      strictMode: false,
      ...config
    };
  }

  /**
   * Analyse un email complet
   */
  async analyze(email: {
    subject?: string;
    content: string;
    htmlContent?: string;
  }): Promise<SpamScoreResult> {
    if (!this.config.enabled) {
      return this.createPassResult();
    }

    const issues: SpamScoreIssue[] = [];
    let totalScore = 0;

    // 1. Analyser le sujet
    if (this.config.checkSubject && email.subject) {
      const subjectIssues = this.analyzeSubject(email.subject);
      issues.push(...subjectIssues);
      totalScore += subjectIssues.reduce((sum, issue) => sum + issue.impact, 0);
    }

    // 2. Analyser le contenu
    if (this.config.checkContent) {
      const contentIssues = this.analyzeContent(email.content);
      issues.push(...contentIssues);
      totalScore += contentIssues.reduce((sum, issue) => sum + issue.impact, 0);
    }

    // 3. Analyser les liens
    if (this.config.checkLinks) {
      const linkIssues = this.analyzeLinks(email.htmlContent || email.content);
      issues.push(...linkIssues);
      totalScore += linkIssues.reduce((sum, issue) => sum + issue.impact, 0);
    }

    // 4. Analyser les images
    if (this.config.checkImages && email.htmlContent) {
      const imageIssues = this.analyzeImages(email.htmlContent);
      issues.push(...imageIssues);
      totalScore += imageIssues.reduce((sum, issue) => sum + issue.impact, 0);
    }

    // 5. Vérifier le lien de désabonnement
    const unsubscribeIssue = this.checkUnsubscribeLink(email.htmlContent || email.content);
    if (unsubscribeIssue) {
      issues.push(unsubscribeIssue);
      totalScore += unsubscribeIssue.impact;
    }

    // Limiter le score à 10
    const finalScore = Math.min(10, totalScore);
    const level = this.getScoreLevel(finalScore);
    const passed = finalScore <= (this.config.threshold || 5);

    return {
      score: parseFloat(finalScore.toFixed(2)),
      level,
      passed,
      issues,
      recommendations: this.generateRecommendations(issues),
      details: {
        contentScore: this.calculateContentScore(email.content),
        subjectScore: email.subject ? this.calculateSubjectScore(email.subject) : 0,
        linksScore: this.calculateLinksScore(email.htmlContent || email.content),
        imagesScore: email.htmlContent ? this.calculateImagesScore(email.htmlContent) : 0,
        overallAssessment: this.getOverallAssessment(finalScore, level)
      }
    };
  }

  /**
   * Analyse le sujet de l'email
   */
  private analyzeSubject(subject: string): SpamScoreIssue[] {
    const issues: SpamScoreIssue[] = [];

    // Majuscules excessives (> 50%)
    const upperCaseRatio = this.calculateUpperCaseRatio(subject);
    if (upperCaseRatio > 0.5) {
      issues.push({
        type: 'excessive_caps',
        severity: 'high',
        message: `Subject has ${(upperCaseRatio * 100).toFixed(0)}% uppercase characters`,
        impact: upperCaseRatio > 0.7 ? 2 : 1,
        suggestion: 'Use normal capitalization in subject lines'
      });
    }

    // Points d'exclamation multiples
    const exclamationCount = (subject.match(/!/g) || []).length;
    if (exclamationCount > 1) {
      issues.push({
        type: 'misleading_subject',
        severity: 'medium',
        message: `Subject contains ${exclamationCount} exclamation marks`,
        impact: Math.min(2, exclamationCount * 0.5),
        suggestion: 'Use exclamation marks sparingly (max 1)'
      });
    }

    // Mots spam dans le sujet
    const spamWordCount = this.countSpamWords(subject);
    if (spamWordCount > 0) {
      issues.push({
        type: 'spam_words',
        severity: 'high',
        message: `Subject contains ${spamWordCount} spam word(s)`,
        impact: Math.min(3, spamWordCount * 1.5),
        suggestion: 'Avoid using spam trigger words in subject'
      });
    }

    // Sujet trop court (< 3 caractères)
    if (subject.trim().length < 3) {
      issues.push({
        type: 'misleading_subject',
        severity: 'medium',
        message: 'Subject is too short',
        impact: 1,
        suggestion: 'Use descriptive subject lines (at least 10 characters)'
      });
    }

    // Sujet trop long (> 100 caractères)
    if (subject.length > 100) {
      issues.push({
        type: 'misleading_subject',
        severity: 'low',
        message: 'Subject is too long',
        impact: 0.5,
        suggestion: 'Keep subject lines under 60 characters for best results'
      });
    }

    return issues;
  }

  /**
   * Analyse le contenu de l'email
   */
  private analyzeContent(content: string): SpamScoreIssue[] {
    const issues: SpamScoreIssue[] = [];

    // Majuscules excessives
    const upperCaseRatio = this.calculateUpperCaseRatio(content);
    if (upperCaseRatio > 0.3) {
      issues.push({
        type: 'excessive_caps',
        severity: upperCaseRatio > 0.5 ? 'high' : 'medium',
        message: `Content has ${(upperCaseRatio * 100).toFixed(0)}% uppercase characters`,
        impact: upperCaseRatio > 0.5 ? 2 : 1,
        suggestion: 'Avoid excessive use of capital letters'
      });
    }

    // Mots spam
    const spamWordCount = this.countSpamWords(content);
    if (spamWordCount > 2) {
      issues.push({
        type: 'spam_words',
        severity: spamWordCount > 5 ? 'critical' : 'high',
        message: `Content contains ${spamWordCount} spam word(s)`,
        impact: Math.min(4, spamWordCount * 0.5),
        suggestion: 'Remove or replace spam trigger words'
      });
    }

    // Phrases spam
    const spamPhraseCount = this.countSpamPhrases(content);
    if (spamPhraseCount > 0) {
      issues.push({
        type: 'spam_words',
        severity: 'high',
        message: `Content contains ${spamPhraseCount} spam phrase(s)`,
        impact: Math.min(3, spamPhraseCount * 1),
        suggestion: 'Avoid using common spam phrases'
      });
    }

    // Contenu trop court (< 50 caractères)
    if (content.trim().length < 50) {
      issues.push({
        type: 'other',
        severity: 'medium',
        message: 'Email content is too short',
        impact: 1,
        suggestion: 'Provide meaningful content (at least 100 characters)'
      });
    }

    return issues;
  }

  /**
   * Analyse les liens dans l'email
   */
  private analyzeLinks(content: string): SpamScoreIssue[] {
    const issues: SpamScoreIssue[] = [];

    // Extraire les liens
    const links = this.extractLinks(content);

    // Trop de liens
    if (links.length > 10) {
      issues.push({
        type: 'too_many_links',
        severity: links.length > 20 ? 'high' : 'medium',
        message: `Email contains ${links.length} links`,
        impact: Math.min(3, links.length * 0.1),
        suggestion: 'Limit the number of links (recommended: max 5-10)'
      });
    }

    // Liens suspects
    const suspiciousLinks = links.filter(link => this.isSuspiciousLink(link));
    if (suspiciousLinks.length > 0) {
      issues.push({
        type: 'suspicious_links',
        severity: 'critical',
        message: `Email contains ${suspiciousLinks.length} suspicious link(s)`,
        impact: Math.min(5, suspiciousLinks.length * 2),
        suggestion: 'Avoid using URL shorteners and suspicious domains'
      });
    }

    // Liens avec extensions de fichiers suspects
    const dangerousLinks = links.filter(link => this.hasSuspiciousExtension(link));
    if (dangerousLinks.length > 0) {
      issues.push({
        type: 'suspicious_links',
        severity: 'critical',
        message: `Email contains ${dangerousLinks.length} link(s) to executable files`,
        impact: 5,
        suggestion: 'Never link to executable files in emails'
      });
    }

    // Tous les liens sont identiques (link farming)
    if (links.length > 3) {
      const uniqueLinks = new Set(links);
      if (uniqueLinks.size === 1) {
        issues.push({
          type: 'suspicious_links',
          severity: 'medium',
          message: 'All links point to the same URL',
          impact: 1,
          suggestion: 'Vary your link destinations or reduce link count'
        });
      }
    }

    return issues;
  }

  /**
   * Analyse les images dans l'email
   */
  private analyzeImages(htmlContent: string): SpamScoreIssue[] {
    const issues: SpamScoreIssue[] = [];

    // Extraire les images
    const images = this.extractImages(htmlContent);

    // Trop d'images
    if (images.length > 15) {
      issues.push({
        type: 'other',
        severity: 'medium',
        message: `Email contains ${images.length} images`,
        impact: Math.min(2, images.length * 0.05),
        suggestion: 'Limit the number of images (recommended: max 10)'
      });
    }

    // Ratio texte/image
    const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();
    const textLength = textContent.length;
    const imageCount = images.length;

    if (imageCount > 0 && textLength < 100) {
      issues.push({
        type: 'other',
        severity: 'high',
        message: 'Email is mostly images with little text',
        impact: 2,
        suggestion: 'Include sufficient text content (not just images)'
      });
    }

    return issues;
  }

  /**
   * Vérifie la présence d'un lien de désabonnement
   */
  private checkUnsubscribeLink(content: string): SpamScoreIssue | null {
    const unsubscribePatterns = [
      /unsubscribe/i,
      /opt[- ]out/i,
      /remove me/i,
      /stop receiving/i,
      /manage preferences/i,
      /update preferences/i
    ];

    const hasUnsubscribe = unsubscribePatterns.some(pattern => pattern.test(content));

    if (!hasUnsubscribe) {
      return {
        type: 'missing_unsubscribe',
        severity: 'high',
        message: 'Email does not contain an unsubscribe link',
        impact: 2,
        suggestion: 'Always include an unsubscribe link (required by law)'
      };
    }

    return null;
  }

  /**
   * Calcule le ratio de majuscules
   */
  private calculateUpperCaseRatio(text: string): number {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length === 0) return 0;

    const upperCase = text.replace(/[^A-Z]/g, '');
    return upperCase.length / letters.length;
  }

  /**
   * Compte les mots spam
   */
  private countSpamWords(text: string): number {
    const lowerText = text.toLowerCase();
    let count = 0;

    for (const word of SPAM_WORDS) {
      if (lowerText.includes(word)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Compte les phrases spam
   */
  private countSpamPhrases(text: string): number {
    const lowerText = text.toLowerCase();
    let count = 0;

    for (const phrase of SPAM_PHRASES) {
      if (lowerText.includes(phrase)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Extrait les liens d'un contenu
   */
  private extractLinks(content: string): string[] {
    const links: string[] = [];

    // URLs dans le texte
    const urlRegex = /https?:\/\/[^\s<>"]+/gi;
    const textLinks = content.match(urlRegex) || [];
    links.push(...textLinks);

    // Liens HTML
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
      links.push(match[1]);
    }

    return links;
  }

  /**
   * Extrait les images d'un contenu HTML
   */
  private extractImages(htmlContent: string): string[] {
    const images: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;

    while ((match = imgRegex.exec(htmlContent)) !== null) {
      images.push(match[1]);
    }

    return images;
  }

  /**
   * Vérifie si un lien est suspect
   */
  private isSuspiciousLink(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return SUSPICIOUS_DOMAINS.has(urlObj.hostname);
    } catch {
      return false;
    }
  }

  /**
   * Vérifie si un lien a une extension suspecte
   */
  private hasSuspiciousExtension(url: string): boolean {
    const urlLower = url.toLowerCase();
    return Array.from(SUSPICIOUS_EXTENSIONS).some(ext => urlLower.endsWith(ext));
  }

  /**
   * Calcule le score du contenu
   */
  private calculateContentScore(content: string): number {
    let score = 0;
    score += this.countSpamWords(content) * 0.5;
    score += this.countSpamPhrases(content) * 1;
    score += this.calculateUpperCaseRatio(content) > 0.3 ? 1 : 0;
    return Math.min(10, score);
  }

  /**
   * Calcule le score du sujet
   */
  private calculateSubjectScore(subject: string): number {
    let score = 0;
    score += this.countSpamWords(subject) * 1.5;
    score += this.calculateUpperCaseRatio(subject) > 0.5 ? 2 : 0;
    score += ((subject.match(/!/g) || []).length > 1) ? 1 : 0;
    return Math.min(10, score);
  }

  /**
   * Calcule le score des liens
   */
  private calculateLinksScore(content: string): number {
    const links = this.extractLinks(content);
    let score = 0;
    score += links.length > 10 ? (links.length * 0.1) : 0;
    score += links.filter(l => this.isSuspiciousLink(l)).length * 2;
    score += links.filter(l => this.hasSuspiciousExtension(l)).length * 5;
    return Math.min(10, score);
  }

  /**
   * Calcule le score des images
   */
  private calculateImagesScore(htmlContent: string): number {
    const images = this.extractImages(htmlContent);
    const textLength = htmlContent.replace(/<[^>]*>/g, '').trim().length;
    let score = 0;
    score += images.length > 15 ? (images.length * 0.05) : 0;
    score += (images.length > 0 && textLength < 100) ? 2 : 0;
    return Math.min(10, score);
  }

  /**
   * Obtient le niveau du score
   */
  private getScoreLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score <= 2) return 'low';
    if (score <= 5) return 'medium';
    if (score <= 8) return 'high';
    return 'critical';
  }

  /**
   * Génère des recommandations
   */
  private generateRecommendations(issues: SpamScoreIssue[]): string[] {
    const recommendations = new Set<string>();

    for (const issue of issues) {
      if (issue.suggestion) {
        recommendations.add(issue.suggestion);
      }
    }

    // Recommandations générales
    if (issues.length === 0) {
      recommendations.add('Email looks good! Low spam score.');
    } else if (issues.some(i => i.severity === 'critical')) {
      recommendations.add('Critical issues detected. Review and fix before sending.');
    }

    return Array.from(recommendations);
  }

  /**
   * Obtient l'évaluation globale
   */
  private getOverallAssessment(score: number, level: string): string {
    if (score <= 2) {
      return 'Excellent - Very low spam score';
    } else if (score <= 5) {
      return 'Good - Acceptable spam score';
    } else if (score <= 8) {
      return 'Warning - High spam score, deliverability may be affected';
    } else {
      return 'Critical - Very high spam score, email likely to be blocked';
    }
  }

  /**
   * Crée un résultat "pass" par défaut
   */
  private createPassResult(): SpamScoreResult {
    return {
      score: 0,
      level: 'low',
      passed: true,
      issues: [],
      recommendations: ['Spam checking is disabled'],
      details: {
        contentScore: 0,
        subjectScore: 0,
        linksScore: 0,
        imagesScore: 0,
        overallAssessment: 'Not checked'
      }
    };
  }

  /**
   * Active ou désactive le checker
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Vérifie si le checker est activé
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(config: Partial<SpamScoreConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): SpamScoreConfig {
    return { ...this.config };
  }
}

/**
 * Instance singleton du checker
 */
let spamScoreCheckerInstance: SpamScoreChecker | null = null;

/**
 * Récupère ou crée l'instance singleton
 */
export function getSpamScoreChecker(config?: Partial<SpamScoreConfig>): SpamScoreChecker {
  if (!spamScoreCheckerInstance) {
    spamScoreCheckerInstance = new SpamScoreChecker(config);
  }
  return spamScoreCheckerInstance;
}

/**
 * Réinitialise l'instance singleton
 */
export function resetSpamScoreChecker(): void {
  spamScoreCheckerInstance = null;
}

/**
 * Helper pour analyser rapidement un email
 */
export async function checkSpamScore(email: {
  subject?: string;
  content: string;
  htmlContent?: string;
}): Promise<SpamScoreResult> {
  const checker = getSpamScoreChecker();
  return checker.analyze(email);
}
