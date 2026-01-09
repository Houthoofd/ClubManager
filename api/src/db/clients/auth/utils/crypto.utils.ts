/**
 * Utilitaires cryptographiques pour le module Auth
 * Responsabilité : Hashing, génération de tokens, encryption
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';

export class CryptoUtils {
  /**
   * Génère un token sécurisé aléatoire
   * @param length - Longueur du token en bytes (défaut: 32)
   * @returns Token hexadécimal
   */
  static genererTokenSecurise(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash un mot de passe avec bcrypt
   * @param password - Mot de passe en clair
   * @param saltRounds - Nombre de rounds pour le salt (défaut: 12)
   * @returns Hash du mot de passe
   */
  static async hasherMotDePasse(password: string, saltRounds: number = 12): Promise<string> {
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Vérifie un mot de passe contre son hash
   * @param password - Mot de passe en clair
   * @param hash - Hash à vérifier
   * @returns true si le mot de passe correspond
   */
  static async verifierMotDePasse(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      return false;
    }
  }

  /**
   * Génère un code de vérification numérique (6 chiffres)
   * @returns Code de vérification
   */
  static genererCodeVerification(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Génère un hash SHA256 d'une chaîne
   * @param input - Chaîne à hasher
   * @returns Hash SHA256 en hexadécimal
   */
  static hashSHA256(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Génère un UUID v4
   * @returns UUID
   */
  static genererUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Encode une chaîne en base64
   * @param input - Chaîne à encoder
   * @returns Chaîne encodée en base64
   */
  static encodeBase64(input: string): string {
    return Buffer.from(input).toString('base64');
  }

  /**
   * Décode une chaîne base64
   * @param input - Chaîne base64 à décoder
   * @returns Chaîne décodée
   */
  static decodeBase64(input: string): string {
    try {
      return Buffer.from(input, 'base64').toString('utf-8');
    } catch (error) {
      console.error('Erreur lors du décodage base64:', error);
      return '';
    }
  }

  /**
   * Génère un salt cryptographiquement sécurisé
   * @param length - Longueur du salt en bytes (défaut: 16)
   * @returns Salt en hexadécimal
   */
  static genererSalt(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Chiffre une chaîne avec AES-256-CBC (symétrique)
   * @param text - Texte à chiffrer
   * @param key - Clé de chiffrement (32 bytes en hex)
   * @returns Texte chiffré (format: iv:encrypted)
   */
  static chiffrerAES(text: string, key: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const keyBuffer = Buffer.from(key, 'hex');
      const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);

      let encrypted = cipher.update(text, 'utf-8', 'hex');
      encrypted += cipher.final('hex');

      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Erreur lors du chiffrement:', error);
      throw error;
    }
  }

  /**
   * Déchiffre une chaîne AES-256-CBC
   * @param encryptedText - Texte chiffré (format: iv:encrypted)
   * @param key - Clé de déchiffrement (32 bytes en hex)
   * @returns Texte déchiffré
   */
  static dechiffrerAES(encryptedText: string, key: string): string {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const keyBuffer = Buffer.from(key, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
      decrypted += decipher.final('utf-8');

      return decrypted;
    } catch (error) {
      console.error('Erreur lors du déchiffrement:', error);
      throw error;
    }
  }

  /**
   * Génère une clé de chiffrement AES-256 (32 bytes)
   * @returns Clé en hexadécimal
   */
  static genererCleChiffrement(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Compare deux chaînes de manière sécurisée (timing attack safe)
   * @param a - Première chaîne
   * @param b - Deuxième chaîne
   * @returns true si les chaînes sont identiques
   */
  static compareSecurise(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);

      if (bufA.length !== bufB.length) {
        return false;
      }

      return crypto.timingSafeEqual(bufA, bufB);
    } catch (error) {
      return false;
    }
  }

  /**
   * Génère un HMAC SHA256
   * @param data - Données à signer
   * @param secret - Secret pour le HMAC
   * @returns Signature HMAC en hexadécimal
   */
  static genererHMAC(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Vérifie un HMAC SHA256
   * @param data - Données originales
   * @param signature - Signature à vérifier
   * @param secret - Secret pour le HMAC
   * @returns true si la signature est valide
   */
  static verifierHMAC(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.genererHMAC(data, secret);
    return this.compareSecurise(expectedSignature, signature);
  }
}
