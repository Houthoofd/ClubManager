import { DomainError } from './DomainError';

/**
 * Erreurs spécifiques au domaine des cours
 */

export class CoursNotFoundError extends DomainError {
  constructor(identifier: string | number) {
    super(
      `Le cours avec l'identifiant "${identifier}" n'existe pas`,
      'COURS_NOT_FOUND',
      404
    );
  }
}

export class CoursRecurrentNotFoundError extends DomainError {
  constructor(identifier: string | number) {
    super(
      `Le cours récurrent avec l'identifiant "${identifier}" n'existe pas`,
      'COURS_RECURRENT_NOT_FOUND',
      404
    );
  }
}

export class InscriptionNotFoundError extends DomainError {
  constructor(identifier: string | number) {
    super(
      `L'inscription avec l'identifiant "${identifier}" n'existe pas`,
      'INSCRIPTION_NOT_FOUND',
      404
    );
  }
}

export class InscriptionAlreadyExistsError extends DomainError {
  constructor(userId: number, coursId: number) {
    super(
      `L'utilisateur ${userId} est déjà inscrit au cours ${coursId}`,
      'INSCRIPTION_ALREADY_EXISTS',
      409
    );
  }
}

export class CoursCompletError extends DomainError {
  constructor(coursId: number) {
    super(
      `Le cours ${coursId} est complet, la limite d'inscriptions a été atteinte`,
      'COURS_COMPLET',
      400
    );
  }
}

export class CoursPasseError extends DomainError {
  constructor(coursId: number) {
    super(
      `Impossible de modifier le cours ${coursId} car il est déjà passé`,
      'COURS_PASSE',
      400
    );
  }
}

export class InscriptionAnnuleeError extends DomainError {
  constructor(inscriptionId: number) {
    super(
      `Impossible de modifier l'inscription ${inscriptionId} car elle a été annulée`,
      'INSCRIPTION_ANNULEE',
      400
    );
  }
}

export class HoraireInvalideError extends DomainError {
  constructor() {
    super(
      `L'horaire de début doit être antérieur à l'horaire de fin`,
      'HORAIRE_INVALIDE',
      400
    );
  }
}

export class JourSemaineInvalideError extends DomainError {
  constructor(jour: number) {
    super(
      `Le jour de semaine "${jour}" est invalide, il doit être compris entre 1 (lundi) et 7 (dimanche)`,
      'JOUR_SEMAINE_INVALIDE',
      400
    );
  }
}
