/**
 * Service Statistiques - Logique métier
 *
 * Ce service encapsule toute la logique métier liée aux statistiques
 * du club. Il utilise le client Statistiques pour accéder aux données.
 *
 * @module statistiques.service
 */

import { Statistiques } from "../../../../db/clients/statistiques/statistiques.js";

// Types pour le service
export interface FrequentationData {
  utilisateurId: number;
  totalFrequentation: number;
  mois: Array<{
    mois: string;
    frequentation: number;
    totalCoursMois: number;
    pourcentageCoursValides: number;
  }>;
}

export interface ProgressionData {
  utilisateur_id: number;
  nom_complet: string;
  grade_actuel: string;
  nombre_cours_suivis: number;
  taux_presence: number;
  date_dernier_cours?: string;
}

export interface PresenceParMoisData {
  mois: string;
  presences: number;
  type_cours: string;
}

export interface StatistiqueSimple {
  count?: number;
  total?: number;
  value?: number;
  taux?: number;
}

export interface PaiementParMois {
  mois: string;
  total: number;
  nombre_paiements: number;
}

export interface MembreParPlan {
  plan_nom: string;
  nombre_membres: number;
  pourcentage: number;
}

export interface DernierPaiement {
  id: number;
  utilisateur_nom: string;
  montant: number;
  date_paiement: string;
  statut: string;
}

export interface PaiementEchu {
  id: number;
  utilisateur_nom: string;
  montant: number;
  date_fin_periode: string;
  jours_echus: number;
}

export interface NouveauMembre {
  id: number;
  nom_complet: string;
  email: string;
  date_inscription: string;
  jours_depuis_inscription: number;
}

export interface MembreAssidu {
  id: number;
  nom_complet: string;
  total_presences: number;
  taux_presence: number;
}

export interface MembreParGrade {
  grade: string;
  nombre_membres: number;
  pourcentage: number;
}

export interface MembreParGenre {
  genre: string;
  nombre_membres: number;
  pourcentage: number;
}

export interface Anniversaire {
  id: number;
  nom_complet: string;
  date_naissance: string;
  age: number;
  jours_avant_anniversaire: number;
}

export interface ArticleVendu {
  article_nom: string;
  quantite_vendue: number;
  revenu_total: number;
}

// Instance unique du client Statistiques
const statistiquesClient = new Statistiques();

/**
 * Obtenir les statistiques de fréquentation d'un utilisateur
 */
export async function obtenirStatistiquesFrequentation(
  utilisateurId: number,
): Promise<FrequentationData> {
  const result =
    await statistiquesClient.obtenirStatistiquesFrequentation(utilisateurId);

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error("Aucune statistique de fréquentation trouvée");
  }

  const totalFrequentation = result[0]?.totalFrequentation ?? 0;

  const moisData = result.map((row: any) => ({
    mois: row.mois,
    frequentation: row.frequentation,
    totalCoursMois: row.nombres_total_de_cours_du_mois,
    pourcentageCoursValides: row.pourcentage_de_cours_valides,
  }));

  return {
    utilisateurId,
    totalFrequentation,
    mois: moisData,
  };
}

/**
 * Obtenir la progression d'un utilisateur
 */
export async function obtenirProgressionUtilisateur(
  userId: number,
): Promise<ProgressionData> {
  const result = await statistiquesClient.obtenirProgressionUtilisateur(userId);

  if (!result || typeof result.utilisateur_id !== "number") {
    throw new Error("Aucune progression trouvée pour cet utilisateur");
  }

  return result as ProgressionData;
}

/**
 * Obtenir les présences par mois d'un utilisateur
 */
export async function obtenirPresenceParMois(
  userId: number,
): Promise<PresenceParMoisData[]> {
  const results = await statistiquesClient.obtenirPresenceParMois(userId);

  return results.map((item: any) => ({
    mois: item.nom_mois,
    presences: item.total_presences,
    type_cours: item.type_cours,
  }));
}

/**
 * Obtenir le nombre total de membres
 */
export async function getNombreMembres(): Promise<any> {
  return await statistiquesClient.getNombreMembres();
}

/**
 * Obtenir le total des paiements du mois
 */
export async function getTotalPaiementsMois(): Promise<any> {
  return await statistiquesClient.getTotalPaiementsMois();
}

/**
 * Obtenir le nombre de paiements récents (7 derniers jours)
 */
export async function getPaiementsRecents(): Promise<any> {
  return await statistiquesClient.getPaiementsRecents();
}

/**
 * Obtenir le nombre de paiements en attente
 */
export async function getPaiementsEnAttente(): Promise<any> {
  return await statistiquesClient.getPaiementsEnAttente();
}

/**
 * Obtenir le nombre de plans actifs
 */
export async function getPlansActifs(): Promise<any> {
  return await statistiquesClient.getPlansActifs();
}

/**
 * Obtenir le taux de renouvellement des abonnements
 */
export async function getTauxRenouvellement(): Promise<any> {
  return await statistiquesClient.getTauxRenouvellement();
}

/**
 * Obtenir l'évolution des paiements par mois
 */
export async function getPaiementsParMois(): Promise<any[]> {
  return await statistiquesClient.getPaiementsParMois();
}

/**
 * Obtenir la répartition des membres par plan
 */
export async function getMembresParPlan(): Promise<any[]> {
  return await statistiquesClient.getMembresParPlan();
}

/**
 * Obtenir les 10 derniers paiements
 */
export async function getDerniersPaiements(): Promise<any[]> {
  return await statistiquesClient.getDerniersPaiements();
}

/**
 * Obtenir les paiements échus
 */
export async function getPaiementsEchus(): Promise<any[]> {
  return await statistiquesClient.getPaiementsEchus();
}

/**
 * Obtenir les nouveaux membres (7 derniers jours)
 */
export async function getNouveauxMembres(): Promise<any[]> {
  return await statistiquesClient.getNouveauxMembres();
}

/**
 * Obtenir le top 5 des membres les plus assidus
 */
export async function getTopMembresAssidus(): Promise<any[]> {
  return await statistiquesClient.getTopMembresAssidus();
}

/**
 * Obtenir la répartition des membres par grade
 */
export async function getMembresParGrade(): Promise<any[]> {
  return await statistiquesClient.getMembresParGrade();
}

/**
 * Obtenir la répartition des membres par genre
 */
export async function getMembresParGenre(): Promise<any[]> {
  return await statistiquesClient.getMembresParGenre();
}

/**
 * Obtenir les prochains anniversaires (30 jours)
 */
export async function getProchainsAnniversaires(): Promise<any[]> {
  return await statistiquesClient.getProchainsAnniversaires();
}

/**
 * Obtenir les articles les plus vendus
 */
export async function getArticlesPlusVendus(): Promise<any[]> {
  return await statistiquesClient.getArticlesPlusVendus();
}

/**
 * Obtenir le nombre de cours de la semaine
 */
export async function getCoursSemaine(): Promise<any> {
  return await statistiquesClient.getCoursSemaine();
}
