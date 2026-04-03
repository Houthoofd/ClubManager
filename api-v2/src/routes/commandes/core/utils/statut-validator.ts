/**
 * Utilitaire pour valider les transitions de statuts de commandes
 * Pas de dépendance directe à Prisma pour permettre l'utilisation dans les tests mockés
 */

/**
 * Énumérations des statuts possibles
 */
export const STATUTS = {
  EN_ATTENTE: "en_attente",
  PAYEE: "pay_e",
  EXPEDIEE: "exp_di_e",
  ANNULEE: "annul_e",
} as const;

/**
 * Type pour les statuts
 */
export type StatutCommande = (typeof STATUTS)[keyof typeof STATUTS];

/**
 * Convertit une chaîne de statut en valeur enum
 * Supporte à la fois les valeurs enum (pay_e) et les valeurs avec accents (payée)
 */
export function toStatutEnum(statut: string): StatutCommande {
  const mapping: Record<string, StatutCommande> = {
    // Valeurs enum (sans accents)
    en_attente: STATUTS.EN_ATTENTE,
    pay_e: STATUTS.PAYEE,
    exp_di_e: STATUTS.EXPEDIEE,
    annul_e: STATUTS.ANNULEE,
    // Valeurs avec accents (rétrocompatibilité)
    "en attente": STATUTS.EN_ATTENTE,
    payée: STATUTS.PAYEE,
    expédiée: STATUTS.EXPEDIEE,
    annulée: STATUTS.ANNULEE,
  };
  return mapping[statut] || STATUTS.EN_ATTENTE;
}

/**
 * Valide si une transition de statut est autorisée
 * Transitions valides :
 * - en_attente -> pay_e (paiement)
 * - en_attente -> annul_e (annulation)
 * - pay_e -> exp_di_e (expédition)
 * - pay_e -> annul_e (annulation)
 * - exp_di_e -> annul_e (annulation exceptionnelle)
 */
export function isValidTransition(
  ancienStatut: string,
  nouveauStatut: string,
): boolean {
  // Convertir en valeurs enum si ce sont des chaînes
  const ancien = toStatutEnum(ancienStatut);
  const nouveau = toStatutEnum(nouveauStatut);

  // Si le statut ne change pas, c'est valide
  if (ancien === nouveau) {
    return true;
  }

  // Définir les transitions valides
  const transitionsValides: Record<StatutCommande, StatutCommande[]> = {
    [STATUTS.EN_ATTENTE]: [STATUTS.PAYEE, STATUTS.ANNULEE],
    [STATUTS.PAYEE]: [STATUTS.EXPEDIEE, STATUTS.ANNULEE],
    [STATUTS.EXPEDIEE]: [STATUTS.ANNULEE],
    [STATUTS.ANNULEE]: [], // Une commande annulée ne peut pas changer de statut
  };

  const transitionsAutorisees = transitionsValides[ancien] || [];
  return transitionsAutorisees.includes(nouveau);
}

/**
 * Retourne les statuts valides (format enum et format avec accents)
 */
export function getStatutsValides(): string[] {
  return [
    "en_attente",
    "pay_e",
    "exp_di_e",
    "annul_e",
    "en attente",
    "payée",
    "expédiée",
    "annulée",
  ];
}

/**
 * Retourne le message d'erreur pour une transition invalide
 */
export function getTransitionErrorMessage(
  ancienStatut: string,
  nouveauStatut: string,
): string {
  return `Transition de statut invalide: ${ancienStatut} → ${nouveauStatut}. Transitions autorisées: en_attente→payée/annulée, payée→expédiée/annulée, expédiée→annulée`;
}
