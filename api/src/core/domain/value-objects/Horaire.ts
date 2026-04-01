import { ValidationError } from "../errors/DomainError.js";

/**
 * Value Object représentant un horaire (heure de début et fin)
 *
 * Règles métier:
 * - Format valide HH:MM ou HH:MM:SS
 * - Heure de début avant heure de fin
 * - Heures valides (00:00 à 23:59)
 * - Durée minimale de 15 minutes
 * - Durée maximale de 6 heures
 * - Immuable
 */
export class Horaire {
  private readonly heureDebut: string; // Format HH:MM:SS
  private readonly heureFin: string; // Format HH:MM:SS

  private constructor(heureDebut: string, heureFin: string) {
    // Normaliser au format HH:MM:SS
    this.heureDebut = this.normalizeTime(heureDebut);
    this.heureFin = this.normalizeTime(heureFin);

    // Valider
    this.validate(this.heureDebut, this.heureFin);
  }

  /**
   * Factory method pour créer un Horaire
   */
  public static create(heureDebut: string, heureFin: string): Horaire {
    return new Horaire(heureDebut, heureFin);
  }

  /**
   * Normalise l'heure au format HH:MM:SS
   */
  private normalizeTime(time: string): string {
    const trimmed = time.trim();

    // Si format HH:MM, ajouter :00
    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      return `${trimmed}:00`;
    }

    // Si déjà au format HH:MM:SS
    if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    throw new ValidationError(
      "horaire",
      `Format d'heure invalide: ${time}. Attendu: HH:MM ou HH:MM:SS`,
    );
  }

  /**
   * Valide l'horaire
   */
  private validate(heureDebut: string, heureFin: string): void {
    // Valider le format
    this.validateTimeFormat(heureDebut, "heure de début");
    this.validateTimeFormat(heureFin, "heure de fin");

    // Valider les valeurs
    this.validateTimeValues(heureDebut, "heure de début");
    this.validateTimeValues(heureFin, "heure de fin");

    // Vérifier que début < fin
    if (this.timeToMinutes(heureDebut) >= this.timeToMinutes(heureFin)) {
      throw new ValidationError(
        "horaire",
        `L'heure de début (${heureDebut}) doit être avant l'heure de fin (${heureFin})`,
      );
    }

    // Vérifier la durée minimale (15 minutes)
    const durationMinutes = this.calculateDurationInMinutes(
      heureDebut,
      heureFin,
    );
    if (durationMinutes < 15) {
      throw new ValidationError(
        "horaire",
        `La durée du cours doit être d'au moins 15 minutes (durée actuelle: ${durationMinutes} min)`,
      );
    }

    // Vérifier la durée maximale (6 heures = 360 minutes)
    if (durationMinutes > 360) {
      throw new ValidationError(
        "horaire",
        `La durée du cours ne peut pas dépasser 6 heures (durée actuelle: ${Math.floor(durationMinutes / 60)}h${durationMinutes % 60})`,
      );
    }
  }

  /**
   * Valide le format de l'heure (HH:MM:SS)
   */
  private validateTimeFormat(time: string, label: string): void {
    if (!/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      throw new ValidationError(
        "horaire",
        `Format invalide pour ${label}: ${time}. Attendu: HH:MM:SS`,
      );
    }
  }

  /**
   * Valide les valeurs de l'heure
   */
  private validateTimeValues(time: string, label: string): void {
    const [hours, minutes, seconds] = time.split(":").map(Number);

    if (hours < 0 || hours > 23) {
      throw new ValidationError(
        "horaire",
        `Heures invalides pour ${label}: ${hours}. Doit être entre 00 et 23`,
      );
    }

    if (minutes < 0 || minutes > 59) {
      throw new ValidationError(
        "horaire",
        `Minutes invalides pour ${label}: ${minutes}. Doit être entre 00 et 59`,
      );
    }

    if (seconds < 0 || seconds > 59) {
      throw new ValidationError(
        "horaire",
        `Secondes invalides pour ${label}: ${seconds}. Doit être entre 00 et 59`,
      );
    }
  }

  /**
   * Convertit une heure en minutes depuis minuit
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Calcule la durée en minutes entre deux heures
   */
  private calculateDurationInMinutes(debut: string, fin: string): number {
    return this.timeToMinutes(fin) - this.timeToMinutes(debut);
  }

  // ============== GETTERS ==============

  /**
   * Retourne l'heure de début (format HH:MM:SS)
   */
  public getHeureDebut(): string {
    return this.heureDebut;
  }

  /**
   * Retourne l'heure de fin (format HH:MM:SS)
   */
  public getHeureFin(): string {
    return this.heureFin;
  }

  /**
   * Retourne l'heure de début au format court (HH:MM)
   */
  public getHeureDebutCourt(): string {
    return this.heureDebut.substring(0, 5);
  }

  /**
   * Retourne l'heure de fin au format court (HH:MM)
   */
  public getHeureFinCourt(): string {
    return this.heureFin.substring(0, 5);
  }

  // ============== MÉTHODES MÉTIER ==============

  /**
   * Retourne la durée du cours en minutes
   */
  public getDurationInMinutes(): number {
    return this.calculateDurationInMinutes(this.heureDebut, this.heureFin);
  }

  /**
   * Retourne la durée du cours formatée (ex: "1h30")
   */
  public getFormattedDuration(): string {
    const minutes = this.getDurationInMinutes();
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes}min`;
    }

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h${remainingMinutes}`;
  }

  /**
   * Vérifie si cet horaire chevauche un autre horaire
   */
  public overlaps(other: Horaire): boolean {
    const thisStart = this.timeToMinutes(this.heureDebut);
    const thisEnd = this.timeToMinutes(this.heureFin);
    const otherStart = this.timeToMinutes(other.heureDebut);
    const otherEnd = this.timeToMinutes(other.heureFin);

    // Chevauchement si:
    // - Le début de this est pendant other
    // - La fin de this est pendant other
    // - This englobe complètement other
    return (
      (thisStart >= otherStart && thisStart < otherEnd) || // Début pendant other
      (thisEnd > otherStart && thisEnd <= otherEnd) || // Fin pendant other
      (thisStart <= otherStart && thisEnd >= otherEnd) // Englobe other
    );
  }

  /**
   * Vérifie si cet horaire est adjacent à un autre (avec une tolérance de 15 min)
   *
   * Deux horaires sont considérés adjacents si:
   * - La fin de l'un est proche du début de l'autre (dans la tolérance)
   * - Ou le début de l'un est proche de la fin de l'autre (dans la tolérance)
   *
   * @param other L'autre horaire à comparer
   * @param toleranceMinutes La tolérance en minutes (défaut: 15)
   * @returns true si les horaires sont adjacents
   */
  public isAdjacentTo(other: Horaire, toleranceMinutes: number = 15): boolean {
    const thisStart = this.timeToMinutes(this.heureDebut);
    const thisEnd = this.timeToMinutes(this.heureFin);
    const otherStart = this.timeToMinutes(other.heureDebut);
    const otherEnd = this.timeToMinutes(other.heureFin);

    // Cas 1: this se termine juste avant other commence
    const gapAfter = otherStart - thisEnd;
    if (gapAfter >= 0 && gapAfter <= toleranceMinutes) {
      return true;
    }

    // Cas 2: other se termine juste avant this commence
    const gapBefore = thisStart - otherEnd;
    if (gapBefore >= 0 && gapBefore <= toleranceMinutes) {
      return true;
    }

    return false;
  }

  /**
   * Compare deux horaires pour l'égalité
   *
   * @param other L'autre horaire à comparer
   * @returns true si les horaires sont identiques
   */
  public equals(other: Horaire): boolean {
    if (!other) {
      return false;
    }

    return (
      this.heureDebut === other.heureDebut && this.heureFin === other.heureFin
    );
  }

  /**
   * Retourne une représentation string de l'horaire au format "HH:MM - HH:MM"
   *
   * @returns String formatée de l'horaire
   */
  public toString(): string {
    return `${this.getHeureDebutCourt()} - ${this.getHeureFinCourt()}`;
  }
}
