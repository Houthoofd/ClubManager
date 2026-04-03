import { CourseRecurrent } from "@clubmanager/types";
import { Horaire } from "../value-objects/Horaire.js";
import { JourSemaine } from "../value-objects/JourSemaine.js";
import { ValidationError } from "../errors/DomainError.js";

/**
 * Interface pour les propriétés du CoursRecurrent
 */
export interface CoursRecurrentProps {
  id?: number;
  typeCours: string;
  jourSemaine: JourSemaine;
  horaire: Horaire;
  active: boolean;
  professeurs: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entité CoursRecurrent - Représente un cours récurrent (template)
 *
 * Cette classe contient:
 * - Les propriétés du cours récurrent
 * - La logique métier (validation, règles)
 * - Les méthodes de manipulation (activation, gestion des professeurs, etc.)
 *
 * Règles métier:
 * - Un cours récurrent définit un modèle pour générer des cours spécifiques
 * - L'horaire doit être valide (géré par le Value Object Horaire)
 * - Le jour de la semaine doit être valide (géré par le Value Object JourSemaine)
 * - Un cours peut être actif ou inactif
 * - Un cours peut avoir plusieurs professeurs assignés
 */
export class CoursRecurrent {
  private readonly _id?: number;
  private readonly _typeCours: string;
  private readonly _jourSemaine: JourSemaine;
  private readonly _horaire: Horaire;
  private _active: boolean;
  private _professeurs: number[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: CoursRecurrentProps) {
    this._id = props.id;
    this._typeCours = props.typeCours;
    this._jourSemaine = props.jourSemaine;
    this._horaire = props.horaire;
    this._active = props.active;
    this._professeurs = props.professeurs;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // ============== FACTORY METHODS ==============

  /**
   * Crée un nouveau cours récurrent
   */
  public static create(
    props: Omit<CoursRecurrentProps, "id" | "createdAt" | "updatedAt">,
  ): CoursRecurrent {
    // Validation des données obligatoires
    CoursRecurrent.validateTypeCours(props.typeCours);
    CoursRecurrent.validateProfesseurs(props.professeurs);

    return new CoursRecurrent({
      ...props,
    });
  }

  /**
   * Reconstruit un cours récurrent depuis la base de données
   */
  public static fromPersistence(props: CoursRecurrentProps): CoursRecurrent {
    return new CoursRecurrent(props);
  }

  // ============== VALIDATIONS MÉTIER ==============

  private static validateTypeCours(typeCours: string): void {
    if (!typeCours || typeCours.trim().length === 0) {
      throw new ValidationError(
        "typeCours",
        "Le type de cours est obligatoire",
      );
    }

    if (typeCours.length > 255) {
      throw new ValidationError(
        "typeCours",
        "Le type de cours ne peut pas dépasser 255 caractères",
      );
    }
  }

  private static validateProfesseurs(professeurs: number[]): void {
    if (!Array.isArray(professeurs)) {
      throw new ValidationError(
        "professeurs",
        "La liste des professeurs doit être un tableau",
      );
    }

    // Vérifier que tous les IDs sont valides
    for (const profId of professeurs) {
      if (!Number.isInteger(profId) || profId <= 0) {
        throw new ValidationError(
          "professeurs",
          `L'identifiant du professeur ${profId} est invalide`,
        );
      }
    }

    // Vérifier qu'il n'y a pas de doublons
    const uniqueProfesseurs = new Set(professeurs);
    if (uniqueProfesseurs.size !== professeurs.length) {
      throw new ValidationError(
        "professeurs",
        "La liste des professeurs contient des doublons",
      );
    }
  }

  private static validateProfesseurId(professeurId: number): void {
    if (!Number.isInteger(professeurId) || professeurId <= 0) {
      throw new ValidationError(
        "professeurId",
        "L'identifiant du professeur est invalide",
      );
    }
  }

  // ============== MÉTHODES MÉTIER ==============

  /**
   * Active le cours récurrent
   */
  public activer(): void {
    this._active = true;
    this._updatedAt = new Date();
  }

  /**
   * Désactive le cours récurrent
   */
  public desactiver(): void {
    this._active = false;
    this._updatedAt = new Date();
  }

  /**
   * Vérifie si le cours récurrent est actif
   */
  public isActive(): boolean {
    return this._active;
  }

  /**
   * Ajoute un professeur au cours
   * @throws ValidationError si le professeur est déjà assigné
   */
  public ajouterProfesseur(professeurId: number): void {
    CoursRecurrent.validateProfesseurId(professeurId);

    if (this._professeurs.includes(professeurId)) {
      throw new ValidationError(
        "professeurs",
        `Le professeur ${professeurId} est déjà assigné à ce cours`,
      );
    }

    this._professeurs.push(professeurId);
    this._updatedAt = new Date();
  }

  /**
   * Retire un professeur du cours
   * @throws ValidationError si le professeur n'est pas assigné
   */
  public retirerProfesseur(professeurId: number): void {
    CoursRecurrent.validateProfesseurId(professeurId);

    const index = this._professeurs.indexOf(professeurId);

    if (index === -1) {
      throw new ValidationError(
        "professeurs",
        `Le professeur ${professeurId} n'est pas assigné à ce cours`,
      );
    }

    this._professeurs.splice(index, 1);
    this._updatedAt = new Date();
  }

  /**
   * Retourne la liste des IDs des professeurs
   */
  public getProfesseurs(): number[] {
    return [...this._professeurs]; // Retourne une copie pour préserver l'immutabilité
  }

  /**
   * Vérifie si un professeur est assigné au cours
   */
  public hasProfesseur(professeurId: number): boolean {
    return this._professeurs.includes(professeurId);
  }

  /**
   * Retourne le nombre de professeurs assignés
   */
  public getNombreProfesseurs(): number {
    return this._professeurs.length;
  }

  /**
   * Vérifie si le cours a au moins un professeur
   */
  public hasProfesseurs(): boolean {
    return this._professeurs.length > 0;
  }

  /**
   * Remplace tous les professeurs par une nouvelle liste
   */
  public setProfesseurs(professeurs: number[]): void {
    CoursRecurrent.validateProfesseurs(professeurs);
    this._professeurs = [...professeurs];
    this._updatedAt = new Date();
  }

  /**
   * Vérifie si ce cours récurrent chevauche un autre cours récurrent
   * (même jour et horaire qui se chevauchent)
   */
  public chevauche(autre: CoursRecurrent): boolean {
    // Vérifier d'abord si c'est le même jour
    if (!this._jourSemaine.equals(autre._jourSemaine)) {
      return false;
    }

    // Même jour, vérifier les horaires
    return this._horaire.overlaps(autre._horaire);
  }

  /**
   * Vérifie si ce cours récurrent est adjacent à un autre
   * (même jour et horaires adjacents)
   */
  public estAdjacentA(
    autre: CoursRecurrent,
    toleranceMinutes: number = 15,
  ): boolean {
    // Vérifier d'abord si c'est le même jour
    if (!this._jourSemaine.equals(autre._jourSemaine)) {
      return false;
    }

    // Même jour, vérifier si les horaires sont adjacents
    return this._horaire.isAdjacentTo(autre._horaire, toleranceMinutes);
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

  // ============== GETTERS ==============

  get id(): number | undefined {
    return this._id;
  }

  get typeCours(): string {
    return this._typeCours;
  }

  get jourSemaine(): JourSemaine {
    return this._jourSemaine;
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

  get active(): boolean {
    return this._active;
  }

  get professeurs(): number[] {
    return this.getProfesseurs();
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Convertit l'entité en objet simple (pour la persistence ou les APIs)
   */
  public toObject(): Record<string, any> {
    return {
      id: this._id,
      type_cours: this._typeCours,
      jour_semaine: this._jourSemaine.getNumero(),
      heure_debut: this._horaire.getHeureDebut(),
      heure_fin: this._horaire.getHeureFin(),
      active: this._active,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
    };
  }

  /**
   * Convertit l'entité en objet public (pour les APIs)
   */
  public toPublicObject(): Record<string, any> {
    return {
      id: this._id,
      type_cours: this._typeCours,
      jour_semaine: this._jourSemaine.getNumero(),
      jour_semaine_nom: this._jourSemaine.getNom(),
      heure_debut: this._horaire.getHeureDebutCourt(),
      heure_fin: this._horaire.getHeureFinCourt(),
      horaire: this._horaire.toString(),
      duree: this.getDureeFormatee(),
      active: this._active,
      nombre_professeurs: this.getNombreProfesseurs(),
    };
  }

  /**
   * Convertit vers le format CourseRecurrent de @clubmanager/types
   */
  public toCourseRecurrentType(): CourseRecurrent {
    return {
      id: this._id!,
      type_cours: this._typeCours,
      jour_semaine: this._jourSemaine.getNumero(),
      heure_debut: this._horaire.getHeureDebut(),
      heure_fin: this._horaire.getHeureFin(),
      active: this._active,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
    };
  }

  /**
   * Retourne une description lisible du cours
   */
  public toString(): string {
    return `${this._typeCours} - ${this._jourSemaine.getNom()} ${this._horaire.toString()}`;
  }
}
