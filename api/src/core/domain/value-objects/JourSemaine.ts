import { DayOfWeek, DAY_OF_WEEK_NAMES } from "@clubmanager/types";
import { JourSemaineInvalideError } from "../errors/CoursError.js";

/**
 * Value Object représentant un jour de la semaine
 *
 * Règles métier:
 * - Accepte soit un nombre (1-7) soit un string ("lundi", "mardi", etc.)
 * - Normalise en nombre (1=Lundi, 7=Dimanche)
 * - Immuable
 * - Validation stricte des valeurs
 */
export class JourSemaine {
  private readonly numero: number; // 1-7 (1=Lundi, 7=Dimanche)

  private constructor(numero: number) {
    this.numero = numero;
    this.validate(this.numero);
  }

  /**
   * Factory method pour créer un JourSemaine à partir d'un nombre
   */
  public static fromNumero(numero: number): JourSemaine {
    return new JourSemaine(numero);
  }

  /**
   * Factory method pour créer un JourSemaine à partir d'un nom
   * Accepte: "lundi", "Lundi", "LUNDI", etc.
   */
  public static fromNom(nom: string): JourSemaine {
    const nomNormalized = nom.trim().toLowerCase();

    // Chercher le numéro correspondant au nom
    for (const [numero, nomJour] of Object.entries(DAY_OF_WEEK_NAMES) as [
      string,
      string,
    ][]) {
      if (nomJour.toLowerCase() === nomNormalized) {
        return new JourSemaine(parseInt(numero, 10));
      }
    }

    throw new JourSemaineInvalideError(0);
  }

  /**
   * Factory method générique qui accepte nombre ou string
   */
  public static create(value: number | string): JourSemaine {
    if (typeof value === "number") {
      return JourSemaine.fromNumero(value);
    }

    if (typeof value === "string") {
      // Essayer d'abord de parser comme nombre
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) {
        return JourSemaine.fromNumero(parsed);
      }

      // Sinon traiter comme nom
      return JourSemaine.fromNom(value);
    }

    throw new JourSemaineInvalideError(0);
  }

  /**
   * Valide le numéro du jour
   */
  private validate(numero: number): void {
    if (!Number.isInteger(numero) || numero < 1 || numero > 7) {
      throw new JourSemaineInvalideError(numero);
    }
  }

  // ============== GETTERS ==============

  /**
   * Retourne le numéro du jour (1-7)
   */
  public getNumero(): number {
    return this.numero;
  }

  /**
   * Retourne le nom du jour ("Lundi", "Mardi", etc.)
   */
  public getNom(): string {
    return DAY_OF_WEEK_NAMES[this.numero];
  }

  /**
   * Retourne le nom du jour en minuscules ("lundi", "mardi", etc.)
   */
  public getNomLowerCase(): string {
    return this.getNom().toLowerCase();
  }

  /**
   * Retourne le nom du jour en majuscules ("LUNDI", "MARDI", etc.)
   */
  public getNomUpperCase(): string {
    return this.getNom().toUpperCase();
  }

  /**
   * Retourne l'enum DayOfWeek correspondant
   */
  public getEnum(): DayOfWeek {
    return this.numero as DayOfWeek;
  }

  // ============== MÉTHODES MÉTIER ==============

  /**
   * Vérifie si c'est un jour de week-end (Samedi ou Dimanche)
   */
  public isWeekend(): boolean {
    return (
      this.numero === DayOfWeek.SAMEDI || this.numero === DayOfWeek.DIMANCHE
    );
  }

  /**
   * Vérifie si c'est un jour de semaine (Lundi à Vendredi)
   */
  public isWeekday(): boolean {
    return !this.isWeekend();
  }

  /**
   * Retourne le jour suivant
   */
  public nextDay(): JourSemaine {
    const nextNumero = this.numero === 7 ? 1 : this.numero + 1;
    return new JourSemaine(nextNumero);
  }

  /**
   * Retourne le jour précédent
   */
  public previousDay(): JourSemaine {
    const prevNumero = this.numero === 1 ? 7 : this.numero - 1;
    return new JourSemaine(prevNumero);
  }

  /**
   * Calcule le nombre de jours entre ce jour et un autre
   * Retourne un nombre entre -6 et 6
   */
  public daysUntil(other: JourSemaine): number {
    let diff = other.numero - this.numero;

    // Normaliser pour avoir le plus court chemin
    if (diff > 3) {
      diff -= 7;
    } else if (diff < -3) {
      diff += 7;
    }

    return diff;
  }

  /**
   * Vérifie si ce jour vient avant un autre jour dans la semaine
   */
  public isBefore(other: JourSemaine): boolean {
    return this.numero < other.numero;
  }

  /**
   * Vérifie si ce jour vient après un autre jour dans la semaine
   */
  public isAfter(other: JourSemaine): boolean {
    return this.numero > other.numero;
  }

  /**
   * Compare deux jours pour l'égalité
   */
  public equals(other: JourSemaine): boolean {
    if (!other) {
      return false;
    }

    return this.numero === other.numero;
  }

  /**
   * Retourne une représentation string du jour
   */
  public toString(): string {
    return this.getNom();
  }

  /**
   * Retourne une représentation JSON
   */
  public toJSON(): { numero: number; nom: string } {
    return {
      numero: this.numero,
      nom: this.getNom(),
    };
  }
}
