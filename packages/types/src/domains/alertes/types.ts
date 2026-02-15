/**
 * Types pour le système d'alertes
 */

export type AlertePriorite = 'critique' | 'haute' | 'normale' | 'basse';
export type AlerteStatut = 'active' | 'resolue' | 'ignoree';

export interface AlerteType {
  id: number;
  nom: string;
  code: string;
  description: string;
  priorite: AlertePriorite;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AlerteUtilisateur {
  id: number;
  utilisateurId: number;
  alerteTypeId?: number;
  typeAlerte: string;
  code: string;
  description: string;
  priorite: AlertePriorite;
  statut: AlerteStatut;
  donneesContexte?: any;
  dateDetection: Date;
  dateResolution?: Date;
  notes?: string;
  effectueParId?: number;
  // Relations
  nomUtilisateur: string;
  email: string;
  statusId: number;
}

export interface AlerteDashboard {
  totalAlertes: number;
  alertesActives: number;
  alertesCritiques: number;
  alertesResolues: number;
  alertesParType: Array<{
    typeAlerteId: number;
    count: number;
    statut: string;
  }>;
}

export interface AlerteStats {
  totalAlertes: number;
  alertesActives: number;
  alertesResolues: number;
  alertesCritiques: number;
}

export interface CreateAlerteInput {
  utilisateurId: number;
  typeAlerteId: number;
  contexte?: any;
}

export interface ResoudreAlerteInput {
  alerteId: number;
  notes: string;
  effectuePar: number;
}

export interface IgnorerAlerteInput {
  alerteId: number;
  notes?: string;
}

export interface AlerteResult {
  success: boolean;
  message: string;
}
