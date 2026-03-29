import { User, UserRole } from '../../domain/entities/User.js';
import { Email } from '../../domain/value-objects/Email.js';
import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';
import {
  EmailAlreadyExistsError,
  MinorNotAllowedError,
  ValidationError,
} from '../../domain/errors/DomainError.js';

/**
 * Interface pour le service de hashage de mot de passe
 */
export interface IPasswordHasher {
  hash(password: string): Promise<string>;
}

/**
 * Interface pour le service d'email
 */
export interface IEmailService {
  sendWelcomeEmail(email: string, name: string, verificationToken?: string): Promise<void>;
}

/**
 * Interface pour le service de génération de tokens
 */
export interface ITokenService {
  generateEmailVerificationToken(userId: number, email: string): Promise<string>;
}

/**
 * DTO (Data Transfer Object) pour la création d'un utilisateur
 */
export interface CreateUserDTO {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  dateNaissance?: Date;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  role?: UserRole;
  requireParentalConsent?: boolean; // Pour les mineurs
}

/**
 * Résultat de la création d'un utilisateur
 */
export interface CreateUserResult {
  user: User;
  verificationToken?: string;
}

/**
 * Use Case: Créer un nouvel utilisateur
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Vérifier que l'email n'existe pas déjà
 * 3. Valider le mot de passe
 * 4. Vérifier l'âge minimum (18 ans ou autorisation parentale)
 * 5. Hasher le mot de passe
 * 6. Créer l'entité User
 * 7. Persister l'utilisateur
 * 8. Générer un token de vérification d'email
 * 9. Envoyer l'email de bienvenue
 * 10. Retourner l'utilisateur créé
 *
 * Cette classe orchestre la logique applicative sans contenir
 * de détails techniques (DB, email, etc.)
 */
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly emailService: IEmailService,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Exécute le use case de création d'utilisateur
   */
  async execute(dto: CreateUserDTO): Promise<CreateUserResult> {
    // 1. Validation des données d'entrée
    this.validateDTO(dto);

    // 2. Créer le Value Object Email (validation automatique)
    const email = new Email(dto.email);

    // 3. Vérifier que l'email n'existe pas déjà
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyExistsError(email.getValue());
    }

    // 4. Valider le mot de passe selon les règles métier
    User.validatePassword(dto.password);

    // 5. Vérifier l'âge si date de naissance fournie
    if (dto.dateNaissance) {
      const age = this.calculateAge(dto.dateNaissance);

      if (age < 18 && !dto.requireParentalConsent) {
        throw new MinorNotAllowedError();
      }

      // Validation business : pas d'inscription pour les moins de 13 ans
      if (age < 13) {
        throw new ValidationError(
          'dateNaissance',
          'Les personnes de moins de 13 ans ne peuvent pas s\'inscrire'
        );
      }
    }

    // 6. Hasher le mot de passe
    const passwordHash = await this.passwordHasher.hash(dto.password);

    // 7. Déterminer le rôle (par défaut: MEMBRE)
    const role = dto.role || UserRole.MEMBRE;

    // Validation: seuls les admins peuvent créer d'autres admins ou professeurs
    // (cette vérification peut être faite au niveau du controller avec l'authentification)
    if (role === UserRole.ADMIN || role === UserRole.PROFESSEUR) {
      // Note: Dans un cas réel, on vérifierait ici les permissions de l'utilisateur courant
      // Pour l'instant, on accepte, mais c'est un point d'amélioration
    }

    // 8. Créer l'entité User avec la logique métier
    const user = User.create({
      email,
      nom: dto.nom.trim(),
      prenom: dto.prenom.trim(),
      passwordHash,
      telephone: dto.telephone?.trim(),
      dateNaissance: dto.dateNaissance,
      adresse: dto.adresse?.trim(),
      codePostal: dto.codePostal?.trim(),
      ville: dto.ville?.trim(),
      role,
    });

    // 9. Persister l'utilisateur dans la base de données
    const savedUser = await this.userRepository.save(user);

    // 10. Générer un token de vérification d'email
    let verificationToken: string | undefined;
    try {
      verificationToken = await this.tokenService.generateEmailVerificationToken(
        savedUser.id!,
        savedUser.email.getValue()
      );
    } catch (error) {
      // Log l'erreur mais ne bloque pas la création (on peut renvoyer le token plus tard)
      console.error('Erreur lors de la génération du token de vérification:', error);
    }

    // 11. Envoyer l'email de bienvenue (asynchrone, ne bloque pas)
    this.sendWelcomeEmailAsync(savedUser, verificationToken);

    // 12. Retourner le résultat
    return {
      user: savedUser,
      verificationToken,
    };
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: CreateUserDTO): void {
    if (!dto.email || dto.email.trim().length === 0) {
      throw new ValidationError('email', 'L\'email est obligatoire');
    }

    if (!dto.password || dto.password.length === 0) {
      throw new ValidationError('password', 'Le mot de passe est obligatoire');
    }

    if (!dto.nom || dto.nom.trim().length === 0) {
      throw new ValidationError('nom', 'Le nom est obligatoire');
    }

    if (!dto.prenom || dto.prenom.trim().length === 0) {
      throw new ValidationError('prenom', 'Le prénom est obligatoire');
    }

    // Validation du téléphone si fourni
    if (dto.telephone && dto.telephone.trim().length > 0) {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(dto.telephone)) {
        throw new ValidationError('telephone', 'Le numéro de téléphone contient des caractères invalides');
      }
    }

    // Validation du code postal si fourni
    if (dto.codePostal && dto.codePostal.trim().length > 0) {
      // Format français ou belge
      const codePostalRegex = /^\d{4,5}$/;
      if (!codePostalRegex.test(dto.codePostal)) {
        throw new ValidationError('codePostal', 'Le code postal doit contenir 4 ou 5 chiffres');
      }
    }
  }

  /**
   * Calcule l'âge à partir de la date de naissance
   */
  private calculateAge(dateNaissance: Date): number {
    const today = new Date();
    const birthDate = new Date(dateNaissance);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Envoie l'email de bienvenue de manière asynchrone
   * (ne bloque pas le flux principal)
   */
  private sendWelcomeEmailAsync(user: User, verificationToken?: string): void {
    this.emailService
      .sendWelcomeEmail(
        user.email.getValue(),
        user.getFullName(),
        verificationToken
      )
      .catch((error) => {
        // Log l'erreur mais ne fait pas échouer la création de l'utilisateur
        console.error(
          `Erreur lors de l'envoi de l'email de bienvenue à ${user.email.getValue()}:`,
          error
        );
        // Dans un cas réel, on pourrait envoyer cette erreur à un service de monitoring
        // ou l'ajouter à une queue pour retry
      });
  }
}
