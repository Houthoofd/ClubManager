/**
 * Utilitaires de manipulation de dates pour le module Auth
 * Responsabilité : Génération dates expiration, calculs temporels
 */

export class DateUtils {
  /**
   * Génère une date d'expiration pour un token (en heures)
   * @param hours - Nombre d'heures avant expiration (défaut: 1)
   * @returns Date d'expiration
   */
  static genererDateExpiration(hours: number = 1): Date {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  /**
   * Génère une date d'expiration en jours
   * @param days - Nombre de jours avant expiration
   * @returns Date d'expiration
   */
  static genererDateExpirationJours(days: number): Date {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  /**
   * Génère une date d'expiration en minutes
   * @param minutes - Nombre de minutes avant expiration
   * @returns Date d'expiration
   */
  static genererDateExpirationMinutes(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  /**
   * Calcule une date dans le passé (pour vérification de tentatives)
   * @param minutes - Nombre de minutes dans le passé
   * @returns Date dans le passé
   */
  static calculerDatePassee(minutes: number): Date {
    return new Date(Date.now() - minutes * 60 * 1000);
  }

  /**
   * Calcule une date dans le passé en heures
   * @param hours - Nombre d'heures dans le passé
   * @returns Date dans le passé
   */
  static calculerDatePasseeHeures(hours: number): Date {
    return new Date(Date.now() - hours * 60 * 60 * 1000);
  }

  /**
   * Calcule une date dans le passé en jours
   * @param days - Nombre de jours dans le passé
   * @returns Date dans le passé
   */
  static calculerDatePasseeJours(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  /**
   * Vérifie si un token est expiré
   * @param expiresAt - Date d'expiration
   * @returns true si le token est expiré
   */
  static estExpire(expiresAt: Date | string): boolean {
    const expireDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return expireDate < new Date();
  }

  /**
   * Vérifie si une date est dans le futur
   * @param date - Date à vérifier
   * @returns true si la date est dans le futur
   */
  static estFutur(date: Date | string): boolean {
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    return checkDate > new Date();
  }

  /**
   * Calcule le nombre de minutes entre deux dates
   * @param date1 - Première date
   * @param date2 - Deuxième date (défaut: maintenant)
   * @returns Nombre de minutes
   */
  static differenceEnMinutes(date1: Date, date2: Date = new Date()): number {
    const diff = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diff / (1000 * 60));
  }

  /**
   * Calcule le nombre d'heures entre deux dates
   * @param date1 - Première date
   * @param date2 - Deuxième date (défaut: maintenant)
   * @returns Nombre d'heures
   */
  static differenceEnHeures(date1: Date, date2: Date = new Date()): number {
    const diff = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diff / (1000 * 60 * 60));
  }

  /**
   * Calcule le nombre de jours entre deux dates
   * @param date1 - Première date
   * @param date2 - Deuxième date (défaut: maintenant)
   * @returns Nombre de jours
   */
  static differenceEnJours(date1: Date, date2: Date = new Date()): number {
    const diff = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Formate une date en ISO 8601
   * @param date - Date à formater
   * @returns Date en format ISO
   */
  static formaterISO(date: Date = new Date()): string {
    return date.toISOString();
  }

  /**
   * Formate une date au format FR (DD/MM/YYYY)
   * @param date - Date à formater
   * @returns Date formatée
   */
  static formaterDateFR(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Formate une date et heure au format FR (DD/MM/YYYY HH:mm:ss)
   * @param date - Date à formater
   * @returns Date et heure formatées
   */
  static formaterDateHeureFR(date: Date): string {
    const dateStr = this.formaterDateFR(date);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Arrondit une date au début de la journée (00:00:00)
   * @param date - Date à arrondir
   * @returns Date arrondie
   */
  static debutJournee(date: Date = new Date()): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Arrondit une date à la fin de la journée (23:59:59)
   * @param date - Date à arrondir
   * @returns Date arrondie
   */
  static finJournee(date: Date = new Date()): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Obtient le timestamp Unix (en secondes)
   * @param date - Date (défaut: maintenant)
   * @returns Timestamp en secondes
   */
  static obtenirTimestamp(date: Date = new Date()): number {
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * Crée une date à partir d'un timestamp Unix (en secondes)
   * @param timestamp - Timestamp en secondes
   * @returns Date
   */
  static depuisTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }

  /**
   * Vérifie si une date est valide
   * @param date - Date à vérifier
   * @returns true si la date est valide
   */
  static estDateValide(date: any): boolean {
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }

    if (typeof date === 'string' || typeof date === 'number') {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }

    return false;
  }

  /**
   * Parse une date de manière sécurisée
   * @param dateString - Chaîne représentant une date
   * @returns Date ou null si invalide
   */
  static parserDate(dateString: string): Date | null {
    try {
      const date = new Date(dateString);
      return this.estDateValide(date) ? date : null;
    } catch {
      return null;
    }
  }

  /**
   * Ajoute un nombre de jours à une date
   * @param date - Date de départ
   * @param days - Nombre de jours à ajouter
   * @returns Nouvelle date
   */
  static ajouterJours(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Ajoute un nombre d'heures à une date
   * @param date - Date de départ
   * @param hours - Nombre d'heures à ajouter
   * @returns Nouvelle date
   */
  static ajouterHeures(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  /**
   * Ajoute un nombre de minutes à une date
   * @param date - Date de départ
   * @param minutes - Nombre de minutes à ajouter
   * @returns Nouvelle date
   */
  static ajouterMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  /**
   * Retourne une description relative du temps écoulé
   * @param date - Date à comparer avec maintenant
   * @returns Description (ex: "il y a 5 minutes")
   */
  static tempsRelatif(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'à l\'instant';
    } else if (diffMinutes < 60) {
      return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return this.formaterDateFR(date);
    }
  }

  /**
   * Vérifie si deux dates sont le même jour
   * @param date1 - Première date
   * @param date2 - Deuxième date
   * @returns true si même jour
   */
  static estMemeJour(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Obtient le nombre de jours dans un mois
   * @param year - Année
   * @param month - Mois (0-11)
   * @returns Nombre de jours
   */
  static joursDAnsLeMois(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Vérifie si une année est bissextile
   * @param year - Année à vérifier
   * @returns true si l'année est bissextile
   */
  static estAnneeBissextile(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }
}
