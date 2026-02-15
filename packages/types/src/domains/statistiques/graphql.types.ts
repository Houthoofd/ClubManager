/**
 * Types GraphQL pour le module Statistiques
 * Définit les types, queries et mutations pour la gestion des statistiques
 */

/**
 * TypeDefs GraphQL pour le module Statistiques
 */
export const statistiquesTypeDefs = `
  # Type pour les statistiques de fréquentation par mois
  type FrequentationMois {
    mois: String!
    frequentation: Int!
    totalCoursMois: Int!
    pourcentageCoursValides: Float!
  }

  # Type pour les statistiques de fréquentation d'un utilisateur
  type FrequentationUtilisateur {
    utilisateurId: Int!
    totalFrequentation: Int!
    mois: [FrequentationMois!]!
  }

  # Type pour les statistiques de progression d'un utilisateur
  type ProgressionUtilisateur {
    utilisateur_id: Int!
    nom_complet: String!
    grade_actuel: String!
    nombre_cours_suivis: Int!
    taux_presence: Float!
    date_dernier_cours: String
  }

  # Type pour les présences par mois
  type PresenceParMois {
    mois: String!
    presences: Int!
    type_cours: String!
  }

  # Type pour les statistiques simples (compteurs)
  type StatistiqueSimple {
    count: Int
    total: Float
    value: Float
    taux: Float
  }

  # Type pour les paiements par mois
  type PaiementParMois {
    mois: String!
    total: Float!
    nombre_paiements: Int!
  }

  # Type pour la répartition des membres par plan
  type MembreParPlan {
    plan_nom: String!
    nombre_membres: Int!
    pourcentage: Float!
  }

  # Type pour les derniers paiements
  type DernierPaiement {
    id: Int!
    utilisateur_nom: String!
    montant: Float!
    date_paiement: String!
    statut: String!
  }

  # Type pour les paiements échus
  type PaiementEchu {
    id: Int!
    utilisateur_nom: String!
    montant: Float!
    date_fin_periode: String!
    jours_echus: Int!
  }

  # Type pour les nouveaux membres
  type NouveauMembre {
    id: Int!
    nom_complet: String!
    email: String!
    date_inscription: String!
    jours_depuis_inscription: Int!
  }

  # Type pour les membres assidus
  type MembreAssidu {
    id: Int!
    nom_complet: String!
    total_presences: Int!
    taux_presence: Float!
  }

  # Type pour la répartition par grade
  type MembreParGrade {
    grade: String!
    nombre_membres: Int!
    pourcentage: Float!
  }

  # Type pour la répartition par genre
  type MembreParGenre {
    genre: String!
    nombre_membres: Int!
    pourcentage: Float!
  }

  # Type pour les anniversaires
  type Anniversaire {
    id: Int!
    nom_complet: String!
    date_naissance: String!
    age: Int!
    jours_avant_anniversaire: Int!
  }

  # Type pour les articles vendus
  type ArticleVendu {
    article_nom: String!
    quantite_vendue: Int!
    revenu_total: Float!
  }

  # Type pour les statistiques globales du dashboard
  type StatistiquesGlobales {
    nombreMembres: StatistiqueSimple!
    totalPaiementsMois: StatistiqueSimple!
    paiementsRecents: StatistiqueSimple!
    paiementsEnAttente: StatistiqueSimple!
    plansActifs: StatistiqueSimple!
    tauxRenouvellement: StatistiqueSimple!
    coursSemaine: StatistiqueSimple!
  }

  # Réponse pour les statistiques de fréquentation
  type FrequentationResponse {
    success: Boolean!
    message: String!
    data: FrequentationUtilisateur
  }

  # Réponse pour la progression
  type ProgressionResponse {
    success: Boolean!
    message: String!
    data: ProgressionUtilisateur
  }

  # Réponse pour les présences
  type PresenceResponse {
    success: Boolean!
    message: String!
    data: [PresenceParMois!]!
  }

  # Réponse pour une statistique simple
  type StatistiqueSimpleResponse {
    success: Boolean!
    message: String!
    data: StatistiqueSimple
  }

  # Réponse pour les paiements par mois
  type PaiementsParMoisResponse {
    success: Boolean!
    message: String!
    data: [PaiementParMois!]!
  }

  # Réponse pour les membres par plan
  type MembresParPlanResponse {
    success: Boolean!
    message: String!
    data: [MembreParPlan!]!
  }

  # Réponse pour les derniers paiements
  type DerniersPaiementsResponse {
    success: Boolean!
    message: String!
    data: [DernierPaiement!]!
  }

  # Réponse pour les paiements échus
  type PaiementsEchusResponse {
    success: Boolean!
    message: String!
    data: [PaiementEchu!]!
  }

  # Réponse pour les nouveaux membres
  type NouveauxMembresResponse {
    success: Boolean!
    message: String!
    data: [NouveauMembre!]!
  }

  # Réponse pour le top membres assidus
  type TopMembresAssidusResponse {
    success: Boolean!
    message: String!
    data: [MembreAssidu!]!
  }

  # Réponse pour les membres par grade
  type MembresParGradeResponse {
    success: Boolean!
    message: String!
    data: [MembreParGrade!]!
  }

  # Réponse pour les membres par genre
  type MembresParGenreResponse {
    success: Boolean!
    message: String!
    data: [MembreParGenre!]!
  }

  # Réponse pour les prochains anniversaires
  type ProchainsAnniversairesResponse {
    success: Boolean!
    message: String!
    data: [Anniversaire!]!
  }

  # Réponse pour les articles les plus vendus
  type ArticlesPlusVendusResponse {
    success: Boolean!
    message: String!
    data: [ArticleVendu!]!
  }

  # Réponse pour les statistiques globales
  type StatistiquesGlobalesResponse {
    success: Boolean!
    message: String!
    data: StatistiquesGlobales!
  }

  extend type Query {
    # Statistiques de fréquentation d'un utilisateur
    frequentationUtilisateur(utilisateurId: Int!): FrequentationResponse!

    # Progression d'un utilisateur
    progressionUtilisateur(userId: Int!): ProgressionResponse!

    # Présences par mois d'un utilisateur
    presenceUtilisateur(userId: Int!): PresenceResponse!

    # Statistiques globales du dashboard
    statistiquesGlobales: StatistiquesGlobalesResponse!

    # Nombre total de membres
    nombreMembres: StatistiqueSimpleResponse!

    # Total des paiements du mois
    totalPaiementsMois: StatistiqueSimpleResponse!

    # Paiements récents (7 derniers jours)
    paiementsRecents: StatistiqueSimpleResponse!

    # Paiements en attente
    paiementsEnAttente: StatistiqueSimpleResponse!

    # Plans actifs
    plansActifs: StatistiqueSimpleResponse!

    # Taux de renouvellement des abonnements
    tauxRenouvellement: StatistiqueSimpleResponse!

    # Nombre de cours de la semaine
    coursSemaine: StatistiqueSimpleResponse!

    # Évolution des paiements par mois
    paiementsParMois: PaiementsParMoisResponse!

    # Répartition des membres par plan
    membresParPlan: MembresParPlanResponse!

    # Les 10 derniers paiements
    derniersPaiements: DerniersPaiementsResponse!

    # Paiements échus
    paiementsEchus: PaiementsEchusResponse!

    # Nouveaux membres (7 derniers jours)
    nouveauxMembres: NouveauxMembresResponse!

    # Top 5 des membres les plus assidus
    topMembresAssidus: TopMembresAssidusResponse!

    # Répartition des membres par grade
    membresParGrade: MembresParGradeResponse!

    # Répartition des membres par genre
    membresParGenre: MembresParGenreResponse!

    # Prochains anniversaires (30 jours)
    prochainsAnniversaires: ProchainsAnniversairesResponse!

    # Articles les plus vendus
    articlesPlusVendus: ArticlesPlusVendusResponse!
  }
`;

/**
 * Interfaces TypeScript pour les types GraphQL
 */

export interface FrequentationMois {
  mois: string;
  frequentation: number;
  totalCoursMois: number;
  pourcentageCoursValides: number;
}

export interface FrequentationUtilisateur {
  utilisateurId: number;
  totalFrequentation: number;
  mois: FrequentationMois[];
}

export interface ProgressionUtilisateur {
  utilisateur_id: number;
  nom_complet: string;
  grade_actuel: string;
  nombre_cours_suivis: number;
  taux_presence: number;
  date_dernier_cours?: string;
}

export interface PresenceParMois {
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

export interface StatistiquesGlobales {
  nombreMembres: StatistiqueSimple;
  totalPaiementsMois: StatistiqueSimple;
  paiementsRecents: StatistiqueSimple;
  paiementsEnAttente: StatistiqueSimple;
  plansActifs: StatistiqueSimple;
  tauxRenouvellement: StatistiqueSimple;
  coursSemaine: StatistiqueSimple;
}

export interface FrequentationResponse {
  success: boolean;
  message: string;
  data?: FrequentationUtilisateur;
}

export interface ProgressionResponse {
  success: boolean;
  message: string;
  data?: ProgressionUtilisateur;
}

export interface PresenceResponse {
  success: boolean;
  message: string;
  data: PresenceParMois[];
}

export interface StatistiqueSimpleResponse {
  success: boolean;
  message: string;
  data?: StatistiqueSimple;
}

export interface StatistiquesGlobalesResponse {
  success: boolean;
  message: string;
  data: StatistiquesGlobales;
}
