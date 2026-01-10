/**
 * Index des repositories pour le module Informations
 * Centralise tous les exports des repositories
 */

// Export des repositories
export {
  InformationsReadRepository,
  getInformationsReadRepository,
} from './read.repository.js';

export {
  InformationsWriteRepository,
  getInformationsWriteRepository,
} from './write.repository.js';

export {
  InformationsValidationRepository,
  getInformationsValidationRepository,
} from './validation.repository.js';

export {
  InformationsStatisticsRepository,
  getInformationsStatisticsRepository,
} from './statistics.repository.js';

// Factory pour obtenir tous les repositories
export function getAllInformationsRepositories() {
  return {
    read: getInformationsReadRepository(),
    write: getInformationsWriteRepository(),
    validation: getInformationsValidationRepository(),
    statistics: getInformationsStatisticsRepository(),
  };
}

// Repository complet (facade combinant tous les repositories)
export class InformationsRepositories {
  public readonly read: InformationsReadRepository;
  public readonly write: InformationsWriteRepository;
  public readonly validation: InformationsValidationRepository;
  public readonly statistics: InformationsStatisticsRepository;

  constructor() {
    this.read = getInformationsReadRepository();
    this.write = getInformationsWriteRepository();
    this.validation = getInformationsValidationRepository();
    this.statistics = getInformationsStatisticsRepository();
  }
}

// Singleton pour le repository complet
let repositoriesInstance: InformationsRepositories | null = null;

export function getInformationsRepositories(): InformationsRepositories {
  if (!repositoriesInstance) {
    repositoriesInstance = new InformationsRepositories();
  }
  return repositoriesInstance;
}

// Export par défaut
export default getInformationsRepositories;
