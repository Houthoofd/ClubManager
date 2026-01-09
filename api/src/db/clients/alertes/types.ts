/**
 * Types et interfaces pour le module Alertes
 */

export enum StatutAlerte {
  ACTIVE = 'active',
  RESOLUE = 'resolue',
  IGNOREE = 'ignoree'
}

export enum PrioriteAlerte {
  CRITIQUE = 'critique',
  HAUTE = 'haute',
  NORMALE = 'normale',
  BASSE = 'basse'
}

export interface AlerteType {
  id: number;
  nom: string;
  code: string;
  description: string;
  priorite: PrioriteAlerte;
}

export interface AlerteUtilisateur {
  id: number;
  utilisateur_id: number;
  alerte_type_id: number;
  statut: StatutAlerte;
  donnees_contexte?: any;
  date_detection: Date;
  date_resolution?: Date;
  notes?: string;
  resolu_par?: number;
}

export interface AlerteActive {
  id: number;
  utilisateur_id: number;
  type_alerte: string;
  code: string;
  description: string;
  priorite: PrioriteAlerte;
  donnees_contexte?: any;
  date_detection: Date;
  nom_utilisateur: string;
  email: string;
  status_id: number;
}

export interface DashboardAlerte {
  type_alerte: string;
  code: string;
  priorite: PrioriteAlerte;
  nombre_alertes: number;
  utilisateurs_affectes: number;
}

export interface StatistiquesAlertes {
  total_alertes: number;
  alertes_actives: number;
  alertes_resolues: number;
  alertes_critiques: number;
}

export interface ResoudreAlerteParams {
  alerteId: number;
  notes: string;
  effectuePar: number;
}

export interface IgnorerAlerteParams {
  alerteId: number;
  notes: string;
}
