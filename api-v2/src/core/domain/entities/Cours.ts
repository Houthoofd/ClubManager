import { Course } from "@clubmanager/types";
import { Horaire } from "../value-objects/Horaire.js";
import { CoursPasseError, CoursNotFoundError } from "../errors/CoursError.js";
import { ValidationError } from "../errors/DomainError.js";

/**
 * Interface pour les propriétés du Cours
 */
export interface CoursProps {
  id?: number;
  dateCours: Date;
  typeCours: string;
  horaire: Horaire;
  coursRecurrentId: number;
  annule: boolean;
  createdAt?: Date;
}

/**
 * Entité Cours - Représente une instance spécifique d'un cours
 *
 * Cette classe contient:
 * - Les propriétés du cours
 * - La logique métier (validation, règles)
 * - Les méthodes de manipulation (annulation, réactivation, etc.)
 *
 * Règles métier:
 * - La date du cours ne peut pas être dans le passé (sauf lors de la reconstruction depuis la DB)
 * - Un cours passé ne peut pas être modifié
 * - Un cours peut être annulé et réactivé
 * - L'horaire doit être valide (géré par le Value Object Horaire)
 */
export class Cours {
  private readonly _id?: number;
  private readonly _dateCours: Date;
  private readonly _typeCours: string;
  private readonly _horaire: Horaire;
  private readonly _coursRecurrentId: number;
  private _annule: boolean;
  private readonly _createdAt: Date;

  private constructor(props: CoursProps) {
    this._id = props.id;
    this._dateCours = props.dateCours;
    this._typeCours = props.typeCours;
    this._horaire = props.horaire;
    this._coursRecurrentId = props.coursRecurrentId;
    this._annule = props.annule;
    this._createdAt = props.createdAt || new Date();
  }

  // ============== FACTORY METHODS ==============

  /**
   * Crée un nouveau cours
   * Validation: la date ne peut pas être dans le passé
   */
  public static create(
    props: Omit<CoursProps, "id" | "createdAt" | "annule">,
  ): Cours {
    // Validation des données obligatoires
    Cours.validateTypeCours(props.typeCours);
    Cours.validateDateCours(props.dateCours);
    Cours.validateCoursRecurrentId(props.coursRecurrentId);

    return new Cours({
      ...props,
      annule: false,
    });
  }

  /**
   * Reconstruit un cours depuis la base de données
   * Pas de validation de date passée car on reconstruit l'historique
   */
  public static fromPersistence(props: CoursProps): Cours {
    return new Cours(props);
  }

  // ============== VALIDATIONS MÉTIER ==============

  private static validateTypeCours(typeCours: string): void {
    if (!typeCours || typeCours.trim().length === 0) {
      throw new ValidationError(
        "typeCours",
        "Le type de cours est obligatoire",
      );
    }

    if (typeCours.length > 50) {
      throw new ValidationError(
        "typeCours",
        "Le type de cours ne peut pas dépasser 50 caractères",
      );
    }
  }

  private static validateDateCours(dateCours: Date): void {
    if (!(dateCours instanceof Date) || isNaN(dateCours.getTime())) {
      throw new ValidationError("dateCours", "La date du cours est invalide");
    }

    // Vérifier que la date n'est pas dans le passé
    // On compare uniquement les dates (sans les heures)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const coursDate = new Date(dateCours);
    coursDate.setHours(0, 0, 0, 0);

    if (coursDate < today) {
      throw new ValidationError(
        "dateCours",
        "La date du cours ne peut pas être dans le passé",
      );
    }
  }

  private static validateCoursRecurrentId(coursRecurrentId: number): void {
    if (!Number.isInteger(coursRecurrentId) || coursRecurrentId <= 0) {
      throw new ValidationError(
        "coursRecurrentId",
        "L'identifiant du cours récurrent est invalide",
      );
    }
  }

  // ============== MÉTHODES MÉTIER ==============

  /**
   * Vérifie si le cours est passé
   */
  public estPasse(): boolean {
    const now = new Date();
    const coursDateTime = this.getDateTimeDebut();

    return coursDateTime < now;
  }

  /**
   * Vérifie si le cours est aujourd'hui
   */
  public estAujourdhui(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const coursDate = new Date(this._dateCours);
    coursDate.setHours(0, 0, 0, 0);

    return coursDate.getTime() === today.getTime();
  }

  /**
   * Vérifie si le cours est dans le futur
   */
  public estFutur(): boolean {
    return !this.estPasse();
  }

  /**
   * Retourne la durée du cours en minutes
   */
  public getDuree(): number {
    return this._horaire.getDurationInMinutes();
  }

  /**
   * Retourne la durée du cours formatée (ex: "1h30")
   */
  public getDureeFormatee(): string {
    return this._horaire.getFormattedDuration();
  }

  /**
   * Vérifie si le cours peut être annulé
   * Un cours peut être annulé uniquement s'il n'est pas déjà passé
   */
  public peutEtreAnnule(): boolean {
    return !this.estPasse();
  }

  /**
   * Annule le cours
   * @throws CoursPasseError si le cours est déjà passé
   */
  public annuler(): void {
    if (this.estPasse()) {
      throw new CoursPasseError(this._id!);
    }

    this._annule = true;
  }

  /**
   * Réactive un cours annulé
   * @throws CoursPasseError si le cours est déjà passé
   */
  public reactiver(): void {
    if (this.estPasse()) {
      throw new CoursPasseError(this._id!);
    }

    this._annule = false;
  }

  /**
   * Vérifie si le cours est actif (non annulé)
   */
  public estActif(): boolean {
    return !this._annule;
  }

  /**
   * Retourne la date et l'heure de début du cours combinées
   */
  public getDateTimeDebut(): Date {
    const [hours, minutes, seconds] = this._horaire
      .getHeureDebut()
      .split(":")
      .map(Number);
    const dateTime = new Date(this._dateCours);
    dateTime.setHours(hours, minutes, seconds, 0);
    return dateTime;
  }

  /**
   * Retourne la date et l'heure de fin du cours combinées
   */
  public getDateTimeFin(): Date {
    const [hours, minutes, seconds] = this._horaire
      .getHeureFin()
      .split(":")
      .map(Number);
    const dateTime = new Date(this._dateCours);
    dateTime.setHours(hours, minutes, seconds, 0);
    return dateTime;
  }

  /**
   * Vérifie si le cours est en cours (entre début et fin)
   */
  public estEnCours(): boolean {
    const now = new Date();
    const debut = this.getDateTimeDebut();
    const fin = this.getDateTimeFin();

    return now >= debut && now <= fin;
  }

  /**
   * Retourne le temps restant avant le début du cours en minutes
   * Retourne 0 si le cours est déjà commencé ou passé
   */
  public getTempsAvantDebut(): number {
    const now = new Date();
    const debut = this.getDateTimeDebut();

    if (debut <= now) {
      return 0;
    }

    return Math.floor((debut.getTime() - now.getTime()) / (1000 * 60));
  }

  /**
   * Vérifie si le cours chevauche un autre cours
   */
  public chevauche(autre: Cours): boolean {
    // Vérifier d'abord si c'est le même jour
    const thisDate = new Date(this._dateCours);
    thisDate.setHours(0, 0, 0, 0);

    const autreDate = new Date(autre._dateCours);
    autreDate.setHours(0, 0, 0, 0);

    if (thisDate.getTime() !== autreDate.getTime()) {
      return false;
    }

    // Même jour, vérifier les horaires
    return this._horaire.overlaps(autre._horaire);
  }

  // ============== GETTERS ==============

  get id(): number | undefined {
    return this._id;
  }

  get dateCours(): Date {
    return this._dateCours;
  }

  get typeCours(): string {
    return this._typeCours;
  }

  get horaire(): Horaire {
    return this._horaire;
  }

  get heureDebut(): string {
    return this._horaire.getHeureDebut();
  }

  get heureFin(): string {
    return this._horaire.getHeureFin();
  }

  get coursRecurrentId(): number {
    return this._coursRecurrentId;
  }

  get annule(): boolean {
    return this._annule;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Convertit l'entité en objet simple (pour la persistence ou les APIs)
   */
  public toObject(): Record<string, any> {
    return {
      id: this._id,
      date_cours: this._dateCours,
      type_cours: this._typeCours,
      heure_debut: this._horaire.getHeureDebut(),
      heure_fin: this._horaire.getHeureFin(),
      cours_recurrent_id: this._coursRecurrentId,
      annule: this._annule,
      created_at: this._createdAt,
    };
  }

  /**
   * Convertit l'entité en objet public (pour les APIs)
   */
  public toPublicObject(): Record<string, any> {
    return {
      id: this._id,
      date_cours: this._dateCours,
      type_cours: this._typeCours,
      heure_debut: this._horaire.getHeureDebutCourt(),
      heure_fin: this._horaire.getHeureFinCourt(),
      horaire: this._horaire.toString(),
      duree: this.getDureeFormatee(),
      annule: this._annule,
      est_passe: this.estPasse(),
      est_aujourd_hui: this.estAujourdhui(),
      est_en_cours: this.estEnCours(),
    };
  }

  /**
   * Convertit vers le format Course de @clubmanager/types
   */
  public toCourseType(): Course {
    return {
      id: this._id!,
      date_cours: this._dateCours,
      type_cours: this._typeCours,
      heure_debut: this._horaire.getHeureDebut(),
      heure_fin: this._horaire.getHeureFin(),
      cours_recurrent_id: this._coursRecurrentId,
      annule: this._annule,
      created_at: this._createdAt,
    };
  }
}
