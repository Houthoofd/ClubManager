/**
 * Utilitaires de manipulation de chaînes pour le module Auth
 * Responsabilité : Masquage, normalisation, sanitization
 */

export class StringUtils {
  /**
   * Normalise un email (trim et lowercase)
   * @param email - Email à normaliser
   * @returns Email normalisé
   */
  static normaliserEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }
    return email.trim().toLowerCase();
  }

  /**
   * Masque un email pour affichage sécurisé
   * @param email - Email à masquer
   * @returns Email masqué (ex: j***@example.com)
   */
  static masquerEmail(email: string): string {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return '***';
    }

    const [local, domain] = email.split('@');

    if (local.length <= 1) {
      return `*@${domain}`;
    }

    if (local.length === 2) {
      return `${local[0]}*@${domain}`;
    }

    const maskedLocal = `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`;
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Masque partiellement un nom (prénom ou nom de famille)
   * @param name - Nom à masquer
   * @returns Nom masqué (ex: "Jean" => "J***")
   */
  static masquerNom(name: string): string {
    if (!name || typeof name !== 'string') {
      return '***';
    }

    const trimmed = name.trim();
    if (trimmed.length <= 1) {
      return '*';
    }

    return `${trimmed[0]}${'*'.repeat(Math.min(trimmed.length - 1, 3))}`;
  }

  /**
   * Masque un numéro de téléphone
   * @param phone - Numéro de téléphone à masquer
   * @returns Numéro masqué (ex: "+33612345678" => "+336****5678")
   */
  static masquerTelephone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      return '***';
    }

    const cleaned = phone.replace(/\s/g, '');

    if (cleaned.length < 8) {
      return '***';
    }

    const prefix = cleaned.substring(0, 4);
    const suffix = cleaned.substring(cleaned.length - 4);
    const maskedMiddle = '*'.repeat(cleaned.length - 8);

    return `${prefix}${maskedMiddle}${suffix}`;
  }

  /**
   * Sanitize une chaîne pour éviter les injections
   * @param input - Chaîne à nettoyer
   * @param maxLength - Longueur maximale (défaut: 255)
   * @returns Chaîne nettoyée
   */
  static sanitizeInput(input: string, maxLength: number = 255): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/[<>]/g, '') // Supprimer les balises HTML
      .replace(/[\x00-\x1F\x7F]/g, '') // Supprimer les caractères de contrôle
      .substring(0, maxLength);
  }

  /**
   * Échappe les caractères HTML
   * @param input - Chaîne à échapper
   * @returns Chaîne échappée
   */
  static echapperHTML(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return input.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
  }

  /**
   * Tronque une chaîne avec ellipse
   * @param text - Texte à tronquer
   * @param maxLength - Longueur maximale
   * @param ellipsis - Caractère(s) d'ellipse (défaut: "...")
   * @returns Texte tronqué
   */
  static tronquer(text: string, maxLength: number, ellipsis: string = '...'): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength - ellipsis.length) + ellipsis;
  }

  /**
   * Capitalise la première lettre d'une chaîne
   * @param text - Texte à capitaliser
   * @returns Texte capitalisé
   */
  static capitaliser(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Capitalise chaque mot d'une chaîne
   * @param text - Texte à capitaliser
   * @returns Texte avec chaque mot capitalisé
   */
  static capitaliserMots(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .split(' ')
      .map(word => this.capitaliser(word))
      .join(' ');
  }

  /**
   * Génère un slug à partir d'une chaîne
   * @param text - Texte à convertir en slug
   * @returns Slug
   */
  static genererSlug(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9\s-]/g, '') // Garder uniquement lettres, chiffres, espaces et tirets
      .trim()
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/-+/g, '-'); // Supprimer tirets multiples
  }

  /**
   * Supprime les espaces multiples
   * @param text - Texte à nettoyer
   * @returns Texte avec espaces simples
   */
  static supprimerEspacesMultiples(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Extrait les initiales d'un nom complet
   * @param fullName - Nom complet (ex: "Jean Dupont")
   * @returns Initiales (ex: "JD")
   */
  static extraireInitiales(fullName: string): string {
    if (!fullName || typeof fullName !== 'string') {
      return '';
    }

    return fullName
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0].toUpperCase())
      .join('');
  }

  /**
   * Formate un nom complet
   * @param firstName - Prénom
   * @param lastName - Nom de famille
   * @returns Nom formaté (ex: "Dupont Jean")
   */
  static formaterNomComplet(firstName: string, lastName: string): string {
    const first = this.capitaliser(firstName?.trim() || '');
    const last = this.capitaliser(lastName?.trim() || '');

    if (!first && !last) {
      return '';
    }

    if (!first) {
      return last;
    }

    if (!last) {
      return first;
    }

    return `${last} ${first}`;
  }

  /**
   * Vérifie si une chaîne contient uniquement des lettres
   * @param text - Texte à vérifier
   * @returns true si uniquement des lettres
   */
  static estUniquementLettres(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    return /^[a-zA-ZÀ-ÿ\s-]+$/.test(text);
  }

  /**
   * Vérifie si une chaîne contient uniquement des chiffres
   * @param text - Texte à vérifier
   * @returns true si uniquement des chiffres
   */
  static estUniquementChiffres(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    return /^\d+$/.test(text);
  }

  /**
   * Compte le nombre de mots dans une chaîne
   * @param text - Texte à analyser
   * @returns Nombre de mots
   */
  static compterMots(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Génère un nom d'utilisateur à partir d'un email
   * @param email - Email
   * @returns Nom d'utilisateur (partie avant @)
   */
  static extraireNomUtilisateur(email: string): string {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return '';
    }

    return email.split('@')[0];
  }

  /**
   * Masque partiellement une chaîne (garde début et fin)
   * @param text - Texte à masquer
   * @param startChars - Nombre de caractères à garder au début (défaut: 2)
   * @param endChars - Nombre de caractères à garder à la fin (défaut: 2)
   * @returns Texte masqué
   */
  static masquerPartiel(text: string, startChars: number = 2, endChars: number = 2): string {
    if (!text || typeof text !== 'string') {
      return '***';
    }

    if (text.length <= startChars + endChars) {
      return '*'.repeat(text.length);
    }

    const start = text.substring(0, startChars);
    const end = text.substring(text.length - endChars);
    const maskedMiddle = '*'.repeat(text.length - startChars - endChars);

    return `${start}${maskedMiddle}${end}`;
  }
}
