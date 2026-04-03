import { Email } from '../value-objects/Email.js';
import {
  InvalidPasswordError,
  ValidationError,
  UserAlreadyActivatedError,
} from '../errors/DomainError.js';

/**
 * Types pour les rôles utilisateur
 */
export enum UserRole {
  ADMIN = 'admin',
  PROFESSEUR = 'professeur',
  MEMBRE = 'membre',
  INVITE = 'invite',
}

/**
 * Types pour le statut utilisateur
 */
export enum UserStatus {
  ACTIF = 'actif',
  INACTIF = 'inactif',
  SUSPENDU = 'suspendu',
  EN_ATTENTE = 'en_attente',
}

/**
 * Interface pour les propriétés de l'utilisateur
 */
export interface UserProps {
  id?: number;
  email: Email;
  nom: string;
  prenom: string;
  passwordHash?: string;
  telephone?: string;
  dateNaissance?: Date;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  role: UserRole;
  status: UserStatus;
  emailVerifie: boolean;
  dateInscription: Date;
  derniereConnexion?: Date;
  photoUrl?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entité User - Représente un utilisateur du système
 *
 * Cette classe contient:
 * - Les propriétés de l'utilisateur
 * - La logique métier (validation, règles)
 * - Les méthodes de manipulation (activation, suspension, etc.)
 *
 * Règles métier:
 * - Email unique et valide
 * - Nom et prénom obligatoires
 * - Âge minimum de 18 ans (ou autorisation parentale)
 * - Mot de passe fort requis
 * - Un utilisateur commence en statut EN_ATTENTE jusqu'à vérification email
 */
export class User {
  private readonly _id?: number;
  private readonly _email: Email;
  private _nom: string;
  private _prenom: string;
  private _passwordHash?: string;
  private _telephone?: string;
  private _dateNaissance?: Date;
  private _adresse?: string;
  private _codePostal?: string;
  private _ville?: string;
  private _role: UserRole;
  private _status: UserStatus;
  private _emailVerifie: boolean;
  private _dateInscription: Date;
  private _derniereConnexion?: Date;
  private _photoUrl?: string;
  private _notes?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._nom = props.nom;
    this._prenom = props.prenom;
    this._passwordHash = props.passwordHash;
    this._telephone = props.telephone;
    this._dateNaissance = props.dateNaissance;
    this._adresse = props.adresse;
    this._codePostal = props.codePostal;
    this._ville = props.ville;
    this._role = props.role;
    this._status = props.status;
    this._emailVerifie = props.emailVerifie;
    this._dateInscription = props.dateInscription;
    this._derniereConnexion = props.derniereConnexion;
    this._photoUrl = props.photoUrl;
    this._notes = props.notes;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // ============== FACTORY METHODS ==============

  /**
   * Crée un nouvel utilisateur (inscription)
   */
  public static create(props: Omit<UserProps, 'id' | 'dateInscription' | 'emailVerifie' | 'status'>): User {
    // Validation des données obligatoires
    User.validateNom(props.nom);
    User.validatePrenom(props.prenom);

    // Validation de l'âge si date de naissance fournie
    if (props.dateNaissance) {
      User.validateAge(props.dateNaissance);
    }

    return new User({
      ...props,
      status: UserStatus.EN_ATTENTE,
      emailVerifie: false,
      dateInscription: new Date(),
    });
  }

  /**
   * Reconstruit un utilisateur depuis la base de données
   */
  public static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  // ============== VALIDATIONS MÉTIER ==============

  private static validateNom(nom: string): void {
    if (!nom || nom.trim().length === 0) {
      throw new ValidationError('nom', 'Le nom est obligatoire');
    }
    if (nom.length < 2) {
      throw new ValidationError('nom', 'Le nom doit contenir au moins 2 caractères');
    }
    if (nom.length > 100) {
      throw new ValidationError('nom', 'Le nom ne peut pas dépasser 100 caractères');
    }
  }

  private static validatePrenom(prenom: string): void {
    if (!prenom || prenom.trim().length === 0) {
      throw new ValidationError('prenom', 'Le prénom est obligatoire');
    }
    if (prenom.length < 2) {
      throw new ValidationError('prenom', 'Le prénom doit contenir au moins 2 caractères');
    }
    if (prenom.length > 100) {
      throw new ValidationError('prenom', 'Le prénom ne peut pas dépasser 100 caractères');
    }
  }

  private static validateAge(dateNaissance: Date): void {
    const today = new Date();
    const age = today.getFullYear() - dateNaissance.getFullYear();
    const monthDiff = today.getMonth() - dateNaissance.getMonth();

    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateNaissance.getDate())
        ? age - 1
        : age;

    if (actualAge < 0 || actualAge > 150) {
      throw new ValidationError('dateNaissance', 'Date de naissance invalide');
    }

    // Note: La vérification de l'âge minimum (18 ans) peut être gérée
    // au niveau du Use Case selon les règles métier spécifiques
  }

  /**
   * Valide la force d'un mot de passe
   */
  public static validatePassword(password: string): void {
    if (!password || password.length === 0) {
      throw new InvalidPasswordError('Le mot de passe est obligatoire');
    }

    if (password.length < 8) {
      throw new InvalidPasswordError('Le mot de passe doit contenir au moins 8 caractères');
    }

    if (password.length > 128) {
      throw new InvalidPasswordError('Le mot de passe ne peut pas dépasser 128 caractères');
    }

    // Au moins une lettre majuscule
    if (!/[A-Z]/.test(password)) {
      throw new InvalidPasswordError('Le mot de passe doit contenir au moins une lettre majuscule');
    }

    // Au moins une lettre minuscule
    if (!/[a-z]/.test(password)) {
      throw new InvalidPasswordError('Le mot de passe doit contenir au moins une lettre minuscule');
    }

    // Au moins un chiffre
    if (!/[0-9]/.test(password)) {
      throw new InvalidPasswordError('Le mot de passe doit contenir au moins un chiffre');
    }

    // Au moins un caractère spécial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new InvalidPasswordError('Le mot de passe doit contenir au moins un caractère spécial');
    }
  }

  // ============== MÉTHODES MÉTIER ==============

  /**
   * Active le compte utilisateur après vérification email
   */
  public activate(): void {
    if (this._status === UserStatus.ACTIF && this._emailVerifie) {
      throw new UserAlreadyActivatedError(this._id!);
    }

    this._status = UserStatus.ACTIF;
    this._emailVerifie = true;
    this._updatedAt = new Date();
  }

  /**
   * Désactive le compte utilisateur
   */
  public deactivate(): void {
    this._status = UserStatus.INACTIF;
    this._updatedAt = new Date();
  }

  /**
   * Suspend le compte utilisateur
   */
  public suspend(raison?: string): void {
    this._status = UserStatus.SUSPENDU;
    if (raison) {
      this._notes = `[SUSPENDU] ${raison}\n${this._notes || ''}`;
    }
    this._updatedAt = new Date();
  }

  /**
   * Réactive un compte suspendu
   */
  public unsuspend(): void {
    if (this._status === UserStatus.SUSPENDU) {
      this._status = UserStatus.ACTIF;
      this._updatedAt = new Date();
    }
  }

  /**
   * Met à jour le mot de passe
   */
  public updatePassword(newPasswordHash: string): void {
    this._passwordHash = newPasswordHash;
    this._updatedAt = new Date();
  }

  /**
   * Met à jour les informations de profil
   */
  public updateProfile(updates: {
    nom?: string;
    prenom?: string;
    telephone?: string;
    dateNaissance?: Date;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    photoUrl?: string;
  }): void {
    if (updates.nom !== undefined) {
      User.validateNom(updates.nom);
      this._nom = updates.nom;
    }

    if (updates.prenom !== undefined) {
      User.validatePrenom(updates.prenom);
      this._prenom = updates.prenom;
    }

    if (updates.dateNaissance !== undefined) {
      User.validateAge(updates.dateNaissance);
      this._dateNaissance = updates.dateNaissance;
    }

    if (updates.telephone !== undefined) {
      this._telephone = updates.telephone;
    }

    if (updates.adresse !== undefined) {
      this._adresse = updates.adresse;
    }

    if (updates.codePostal !== undefined) {
      this._codePostal = updates.codePostal;
    }

    if (updates.ville !== undefined) {
      this._ville = updates.ville;
    }

    if (updates.photoUrl !== undefined) {
      this._photoUrl = updates.photoUrl;
    }

    this._updatedAt = new Date();
  }

  /**
   * Met à jour le rôle de l'utilisateur
   */
  public updateRole(newRole: UserRole): void {
    this._role = newRole;
    this._updatedAt = new Date();
  }

  /**
   * Enregistre une connexion
   */
  public recordLogin(): void {
    this._derniereConnexion = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Ajoute une note administrative
   */
  public addNote(note: string): void {
    const timestamp = new Date().toISOString();
    this._notes = `[${timestamp}] ${note}\n${this._notes || ''}`;
    this._updatedAt = new Date();
  }

  // ============== MÉTHODES DE VÉRIFICATION ==============

  /**
   * Vérifie si l'utilisateur est actif
   */
  public isActive(): boolean {
    return this._status === UserStatus.ACTIF;
  }

  /**
   * Vérifie si l'utilisateur est suspendu
   */
  public isSuspended(): boolean {
    return this._status === UserStatus.SUSPENDU;
  }

  /**
   * Vérifie si l'utilisateur a vérifié son email
   */
  public hasVerifiedEmail(): boolean {
    return this._emailVerifie;
  }

  /**
   * Vérifie si l'utilisateur est administrateur
   */
  public isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  /**
   * Vérifie si l'utilisateur est professeur
   */
  public isProfesseur(): boolean {
    return this._role === UserRole.PROFESSEUR;
  }

  /**
   * Vérifie si l'utilisateur est majeur
   */
  public isMajeur(): boolean {
    if (!this._dateNaissance) return true; // Par défaut, considéré majeur si pas de date

    const today = new Date();
    const age = today.getFullYear() - this._dateNaissance.getFullYear();
    const monthDiff = today.getMonth() - this._dateNaissance.getMonth();

    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < this._dateNaissance.getDate())
        ? age - 1
        : age;

    return actualAge >= 18;
  }

  /**
   * Calcule l'âge de l'utilisateur
   */
  public getAge(): number | null {
    if (!this._dateNaissance) return null;

    const today = new Date();
    const age = today.getFullYear() - this._dateNaissance.getFullYear();
    const monthDiff = today.getMonth() - this._dateNaissance.getMonth();

    return monthDiff < 0 || (monthDiff === 0 && today.getDate() < this._dateNaissance.getDate())
      ? age - 1
      : age;
  }

  /**
   * Retourne le nom complet
   */
  public getFullName(): string {
    return `${this._prenom} ${this._nom}`;
  }

  // ============== GETTERS ==============

  get id(): number | undefined {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get nom(): string {
    return this._nom;
  }

  get prenom(): string {
    return this._prenom;
  }

  get passwordHash(): string | undefined {
    return this._passwordHash;
  }

  get telephone(): string | undefined {
    return this._telephone;
  }

  get dateNaissance(): Date | undefined {
    return this._dateNaissance;
  }

  get adresse(): string | undefined {
    return this._adresse;
  }

  get codePostal(): string | undefined {
    return this._codePostal;
  }

  get ville(): string | undefined {
    return this._ville;
  }

  get role(): UserRole {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  get emailVerifie(): boolean {
    return this._emailVerifie;
  }

  get dateInscription(): Date {
    return this._dateInscription;
  }

  get derniereConnexion(): Date | undefined {
    return this._derniereConnexion;
  }

  get photoUrl(): string | undefined {
    return this._photoUrl;
  }

  get notes(): string | undefined {
    return this._notes;
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
      email: this._email.getValue(),
      nom: this._nom,
      prenom: this._prenom,
      telephone: this._telephone,
      dateNaissance: this._dateNaissance,
      adresse: this._adresse,
      codePostal: this._codePostal,
      ville: this._ville,
      role: this._role,
      status: this._status,
      emailVerifie: this._emailVerifie,
      dateInscription: this._dateInscription,
      derniereConnexion: this._derniereConnexion,
      photoUrl: this._photoUrl,
      notes: this._notes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * Convertit l'entité en objet public (sans données sensibles)
   */
  public toPublicObject(): Record<string, any> {
    return {
      id: this._id,
      email: this._email.getValue(),
      nom: this._nom,
      prenom: this._prenom,
      telephone: this._telephone,
      role: this._role,
      status: this._status,
      emailVerifie: this._emailVerifie,
      photoUrl: this._photoUrl,
      dateInscription: this._dateInscription,
    };
  }
}
