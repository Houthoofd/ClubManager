import { ValidationError } from '../errors/DomainError.js';

/**
 * Enum pour le statut d'une inscription
 */
export enum StatusInscription {
  EN_ATTENTE = 'en_attente',
  CONFIRMEE = 'confirmee',
  ANNULEE = 'annulee',
  PRESENTE = 'presente',
  ABSENTE = 'absente',
}

/**
 * Interface pour les propriétés de l'inscription
 */
export interface InscriptionProps {
  id?: number;
  cours_id: number;
  utilisateur_id: number;
  is_present: boolean | null;
  is_validate: boolean | null;
  status?: StatusInscription;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Entité Inscription - Représente l'inscription d'un utilisateur à un cours
 *
 * Cette classe contient:
 * - Les propriétés de l'inscription
 * - La logique métier (validation, confirmation, annulation)
 * - Les méthodes de gestion de présence
 *
 * Règles métier:
 * - Une inscription commence en statut EN_ATTENTE
 * - Une inscription confirmée peut être annulée
 * - Seules les inscriptions confirmées peuvent être marquées présentes/absentes
 * - Une inscription annulée ne peut pas être confirmée à nouveau
 * - La présence et la validation sont gérées indépendamment
 */
export class Inscription {
  private readonly _id?: number;
  private readonly _cours_id: number;
  private readonly _utilisateur_id: number;
  private _is_present: boolean | null;
  private _is_validate: boolean | null;
  private _status: StatusInscription;
  private readonly _created_at: Date;
  private _updated_at: Date;

  private constructor(props: InscriptionProps) {
    this._id = props.id;
    this._cours_id = props.cours_id;
    this._utilisateur_id = props.utilisateur_id;
    this._is_present = props.is_present;
    this._is_validate = props.is_validate;
    this._status = props.status || StatusInscription.EN_ATTENTE;
    this._created_at = props.created_at || new Date();
    this._updated_at = props.updated_at || new Date();
  }

  // ============== FACTORY METHODS ==============

  /**
   * Crée une nouvelle inscription
   */
  public static create(props: Omit<InscriptionProps, 'id' | 'created_at' | 'updated_at' | 'status'>): Inscription {
    // Validation des données obligatoires
    Inscription.validateCoursId(props.cours_id);
    Inscription.validateUtilisateurId(props.utilisateur_id);

    return new Inscription({
      ...props,
      status: StatusInscription.EN_ATTENTE,
      is_present: props.is_present ?? null,
      is_validate: props.is_validate ?? null,
    });
  }

  /**
   * Reconstruit une inscription depuis la base de données
   */
  public static fromPersistence(props: InscriptionProps): Inscription {
    return new Inscription(props);
  }

  // ============== VALIDATIONS MÉTIER ==============

  private static validateCoursId(coursId: number): void {
    if (!coursId || coursId <= 0) {
      throw new ValidationError('cours_id', "L'identifiant du cours est invalide");
    }
  }

  private static validateUtilisateurId(utilisateurId: number): void {
    if (!utilisateurId || utilisateurId <= 0) {
      throw new ValidationError('utilisateur_id', "L'identifiant de l'utilisateur est invalide");
    }
  }

  // ============== MÉTHODES MÉTIER ==============

  /**
   * Confirme l'inscription
   * Une inscription ne peut être confirmée que si elle est en attente
   */
  public confirmer(): void {
    if (this._status === StatusInscription.ANNULEE) {
      throw new ValidationError(
        'status',
        'Une inscription annulée ne peut pas être confirmée'
      );
    }

    if (this._status === StatusInscription.CONFIRMEE) {
      throw new ValidationError('status', 'Cette inscription est déjà confirmée');
    }

    this._status = StatusInscription.CONFIRMEE;
    this._updated_at = new Date();
  }

  /**
   * Annule l'inscription
   * Une inscription peut être annulée depuis n'importe quel statut sauf ANNULEE
   */
  public annuler(): void {
    if (this._status === StatusInscription.ANNULEE) {
      throw new ValidationError('status', 'Cette inscription est déjà annulée');
    }

    this._status = StatusInscription.ANNULEE;
    this._is_present = null;
    this._is_validate = null;
    this._updated_at = new Date();
  }

  /**
   * Marque l'utilisateur comme présent
   * Seules les inscriptions confirmées peuvent être marquées présentes
   */
  public marquerPresent(): void {
    if (this._status === StatusInscription.ANNULEE) {
      throw new ValidationError(
        'status',
        "Impossible de marquer la présence pour une inscription annulée"
      );
    }

    if (this._status !== StatusInscription.CONFIRMEE && this._status !== StatusInscription.PRESENTE) {
      throw new ValidationError(
        'status',
        "L'inscription doit être confirmée avant de marquer la présence"
      );
    }

    this._status = StatusInscription.PRESENTE;
    this._is_present = true;
    this._updated_at = new Date();
  }

  /**
   * Marque l'utilisateur comme absent
   * Seules les inscriptions confirmées peuvent être marquées absentes
   */
  public marquerAbsent(): void {
    if (this._status === StatusInscription.ANNULEE) {
      throw new ValidationError(
        'status',
        "Impossible de marquer l'absence pour une inscription annulée"
      );
    }

    if (this._status !== StatusInscription.CONFIRMEE &&
        this._status !== StatusInscription.PRESENTE &&
        this._status !== StatusInscription.ABSENTE) {
      throw new ValidationError(
        'status',
        "L'inscription doit être confirmée avant de marquer l'absence"
      );
    }

    this._status = StatusInscription.ABSENTE;
    this._is_present = false;
    this._updated_at = new Date();
  }

  /**
   * Valide l'inscription
   * La validation est une action administrative indépendante du statut
   */
  public valider(): void {
    if (this._status === StatusInscription.ANNULEE) {
      throw new ValidationError(
        'status',
        'Impossible de valider une inscription annulée'
      );
    }

    this._is_validate = true;
    this._updated_at = new Date();
  }

  /**
   * Invalide l'inscription
   */
  public invalider(): void {
    this._is_validate = false;
    this._updated_at = new Date();
  }

  // ============== MÉTHODES DE VÉRIFICATION ==============

  /**
   * Vérifie si l'inscription est confirmée
   */
  public isConfirmee(): boolean {
    return this._status === StatusInscription.CONFIRMEE;
  }

  /**
   * Vérifie si l'inscription est annulée
   */
  public isAnnulee(): boolean {
    return this._status === StatusInscription.ANNULEE;
  }

  /**
   * Vérifie si l'inscription est en attente
   */
  public isEnAttente(): boolean {
    return this._status === StatusInscription.EN_ATTENTE;
  }

  /**
   * Vérifie si l'utilisateur est présent
   */
  public isPresent(): boolean {
    return this._status === StatusInscription.PRESENTE || this._is_present === true;
  }

  /**
   * Vérifie si l'utilisateur est absent
   */
  public isAbsent(): boolean {
    return this._status === StatusInscription.ABSENTE || this._is_present === false;
  }

  /**
   * Vérifie si l'inscription est validée
   */
  public isValidee(): boolean {
    return this._is_validate === true;
  }

  /**
   * Vérifie si la présence a été marquée
   */
  public hasPresenceMarquee(): boolean {
    return this._is_present !== null;
  }

  // ============== GETTERS ==============

  get id(): number | undefined {
    return this._id;
  }

  get cours_id(): number {
    return this._cours_id;
  }

  get utilisateur_id(): number {
    return this._utilisateur_id;
  }

  get is_present(): boolean | null {
    return this._is_present;
  }

  get is_validate(): boolean | null {
    return this._is_validate;
  }

  get status(): StatusInscription {
    return this._status;
  }

  get created_at(): Date {
    return this._created_at;
  }

  get updated_at(): Date {
    return this._updated_at;
  }

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Convertit l'entité en objet simple (pour la persistence ou les APIs)
   */
  public toObject(): Record<string, any> {
    return {
      id: this._id,
      cours_id: this._cours_id,
      utilisateur_id: this._utilisateur_id,
      is_present: this._is_present,
      is_validate: this._is_validate,
      status: this._status,
      created_at: this._created_at,
      updated_at: this._updated_at,
    };
  }

  /**
   * Convertit l'entité en objet public
   */
  public toPublicObject(): Record<string, any> {
    return {
      id: this._id,
      cours_id: this._cours_id,
      utilisateur_id: this._utilisateur_id,
      is_present: this._is_present,
      is_validate: this._is_validate,
      status: this._status,
      created_at: this._created_at,
    };
  }
}
