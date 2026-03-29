import { User } from '../../domain/entities/User.js';
import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';
import { UserNotFoundError } from '../../domain/errors/DomainError.js';

/**
 * DTO pour récupérer un utilisateur
 */
export interface GetUserDTO {
  userId: number;
}

/**
 * Use Case: Récupérer un utilisateur par son ID
 *
 * Responsabilités:
 * 1. Valider l'ID fourni
 * 2. Récupérer l'utilisateur depuis le repository
 * 3. Gérer le cas où l'utilisateur n'existe pas
 * 4. Retourner l'utilisateur trouvé
 *
 * Ce use case est simple mais illustre l'importance de la séparation
 * des responsabilités : même une opération simple passe par le use case
 * pour maintenir la cohérence de l'architecture.
 */
export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Exécute le use case de récupération d'utilisateur
   *
   * @param dto - DTO contenant l'ID de l'utilisateur
   * @returns L'utilisateur trouvé
   * @throws UserNotFoundError si l'utilisateur n'existe pas
   */
  async execute(dto: GetUserDTO): Promise<User> {
    // 1. Validation de l'ID
    this.validateDTO(dto);

    // 2. Récupérer l'utilisateur depuis le repository
    const user = await this.userRepository.findById(dto.userId);

    // 3. Vérifier si l'utilisateur existe
    if (!user) {
      throw new UserNotFoundError(dto.userId);
    }

    // 4. Retourner l'utilisateur
    return user;
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: GetUserDTO): void {
    if (!dto.userId || dto.userId <= 0) {
      throw new Error('L\'ID utilisateur doit être un nombre positif');
    }

    if (!Number.isInteger(dto.userId)) {
      throw new Error('L\'ID utilisateur doit être un nombre entier');
    }
  }
}
