/**
 * Point d'entrée centralisé pour toutes les queries du module Cours
 * Exporte toutes les requêtes SQL organisées par responsabilité
 */

// ============================================================================
// QUERIES DE LECTURE
// ============================================================================

export {
  // Cours basiques
  SELECT_ALL_COURS,
  SELECT_COURS_BY_ID,
  SELECT_COURS_BY_WEEK,
  SELECT_COURS_BY_DATE_RANGE,
  SELECT_COURS_FUTURS,
  SELECT_COURS_WITH_PROFESSEURS,
  SELECT_ALL_COURS_WITH_PROFESSEURS,

  // Cours récurrents
  SELECT_ALL_COURS_RECURRENTS,
  SELECT_COURS_RECURRENT_BY_ID,
  SELECT_COURS_RECURRENT_BY_DAY_TIME,
  SELECT_COURS_RECURRENTS_BY_DAY,
  SELECT_COURS_RECURRENT_WITH_PROFESSEURS,

  // Planning hebdomadaire
  SELECT_JOURS_DE_COURS,
  SELECT_JOURS_DE_COURS_PAR_SEMAINE,

  // Participants
  SELECT_PARTICIPANTS_BY_COURS,
  SELECT_COURS_BY_USER,
  SELECT_COURS_FUTURS_BY_USER,

  // Semaines
  SELECT_SEMAINES_AVEC_COURS,
  SELECT_SEMAINE_INFO,

  // Professeurs
  SELECT_PROFESSEURS_BY_COURS_RECURRENT,
  SELECT_PROFESSEUR_BY_NAME,
  SELECT_ALL_PROFESSEURS,

  // Disponibilité
  COUNT_INSCRIPTIONS_BY_COURS,
  CHECK_COURS_DISPONIBILITE,
  SELECT_COURS_DISPONIBLES,

  // Recherche
  SEARCH_COURS_BASE,
} from './read.queries.js';

// ============================================================================
// QUERIES D'ÉCRITURE
// ============================================================================

export {
  // Insertion - Cours
  INSERT_COURS,
  INSERT_COURS_BATCH,

  // Insertion - Cours récurrents
  INSERT_COURS_RECURRENT,

  // Mise à jour - Cours
  UPDATE_COURS,
  UPDATE_COURS_PARTIAL_BASE,
  UPDATE_COURS_ACTIF,
  UPDATE_COURS_CAPACITE,

  // Mise à jour - Cours récurrents
  UPDATE_COURS_RECURRENT,
  UPDATE_COURS_RECURRENT_TYPE,
  UPDATE_COURS_RECURRENT_HORAIRES,
  UPDATE_COURS_RECURRENT_ACTIF,

  // Suppression - Cours
  DELETE_COURS,
  SOFT_DELETE_COURS,
  DELETE_COURS_BY_WEEK,
  DELETE_OLD_COURS,

  // Suppression - Cours récurrents
  DELETE_COURS_RECURRENT,
  SOFT_DELETE_COURS_RECURRENT,
  DELETE_COURS_RECURRENT_BY_DAY_TIME,

  // Génération
  GENERATE_COURS_FROM_RECURRENT,
  GENERATE_WEEK_COURS,

  // Professeurs - Insertion
  INSERT_PROFESSEUR_COURS_RECURRENT,
  INSERT_PROFESSEURS_COURS_RECURRENT_BATCH,
  INSERT_PROFESSEUR,

  // Professeurs - Suppression
  DELETE_PROFESSEURS_BY_COURS_RECURRENT,
  DELETE_PROFESSEUR_FROM_COURS_RECURRENT,
  DELETE_PROFESSEUR_BY_NAME_FROM_COURS,

  // Professeurs - Mise à jour
  UPDATE_PROFESSEUR,

  // Inscriptions - Insertion
  INSERT_INSCRIPTION,

  // Inscriptions - Mise à jour
  UPDATE_INSCRIPTION_PRESENCE,
  VALIDATE_INSCRIPTION_PRESENCE,
  CANCEL_INSCRIPTION_PRESENCE,
  UPDATE_INSCRIPTION_STATUS,
  UPDATE_INSCRIPTION_NOTES,

  // Inscriptions - Suppression
  DELETE_INSCRIPTION,
  DELETE_INSCRIPTION_BY_USER_COURS,
  DELETE_INSCRIPTIONS_BY_COURS,
  DELETE_INSCRIPTIONS_BY_USER,

  // Maintenance
  CLEANUP_OLD_INSCRIPTIONS,
  ARCHIVE_OLD_COURS,
} from './write.queries.js';

// ============================================================================
// QUERIES DE VALIDATION
// ============================================================================

export {
  CHECK_INSCRIPTION_EXISTS,
  CHECK_COURS_EXISTS,
  CHECK_COURS_RECURRENT_EXISTS,
  CHECK_PROFESSEUR_EXISTS,
  CHECK_USER_CAN_REGISTER,
  CHECK_COURS_IS_FULL,
  CHECK_DUPLICATE_INSCRIPTION,
  VALIDATE_COURS_DATE,
} from './validation.queries.js';

// ============================================================================
// QUERIES DE STATISTIQUES
// ============================================================================

export {
  GET_STATS_PRESENCE_COURS,
  GET_STATS_PRESENCE_USER,
  GET_STATS_GLOBALES,
  GET_TAUX_PRESENCE_MOYEN,
  GET_STATS_PAR_TYPE_COURS,
  GET_STATS_PAR_JOUR_SEMAINE,
  GET_COURS_PLUS_POPULAIRES,
  GET_UTILISATEURS_ASSIDUS,
  COUNT_COURS_PAR_SEMAINE,
  COUNT_PARTICIPANTS_TOTAL,
} from './statistics.queries.js';
