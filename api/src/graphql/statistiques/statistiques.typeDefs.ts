/**
 * Définitions de types GraphQL pour le module Statistiques
 */

export const statistiquesTypeDefs = `#graphql
  """
  Statistiques générales du club
  """
  type StatistiquesGenerales {
    total_utilisateurs: Int!
    cours_a_venir: Int!
    total_inscriptions: Int!
    total_professeurs: Int!
  }

  """
  Statistiques par cours
  """
  type StatistiquesParCours {
    type_cours: String!
    nombre_inscriptions: Int!
    taux_presence: Float!
  }

  """
  Statistiques de présence
  """
  type StatistiquesPresence {
    date_cours: String!
    type_cours: String!
    total_inscrits: Int!
    presents: Int!
    taux_presence_pct: Float!
  }

  """
  Statistiques de fréquentation d'un utilisateur
  """
  type StatistiquesFrequentation {
    mois: String!
    mois_num: Int!
    annee: Int!
    total_cours_mois: Int!
    cours_suivis: Int!
    taux_frequentation: Float!
  }

  """
  Progression d'un utilisateur
  """
  type ProgressionUtilisateur {
    utilisateur_id: Int!
    coursSuivis: [CoursSuivi!]!
    niveauActuel: String
    progressionParCours: [ProgressionCours!]!
  }

  """
  Cours suivi par un utilisateur
  """
  type CoursSuivi {
    cours_id: Int!
    type_cours: String!
    date_cours: String!
    status: String!
  }

  """
  Progression par cours
  """
  type ProgressionCours {
    type_cours: String!
    nombre_cours: Int!
    presents: Int!
    absents: Int!
    taux_presence: Float!
  }

  """
  Présence par mois
  """
  type PresenceParMois {
    mois: String!
    annee: Int!
    total_cours: Int!
    presents: Int!
    absents: Int!
    taux_presence: Float!
  }

  """
  Présences non validées par mois
  """
  type PresencesNonValideesParMois {
    mois: String!
    annee: Int!
    non_validees: Int!
  }

  """
  Statistiques de présence par mois
  """
  type StatistiquesPresenceParMois {
    mois: String!
    annee: Int!
    total_inscriptions: Int!
    presents: Int!
    absents: Int!
    taux_presence: Float!
  }

  """
  Paiements par mois
  """
  type PaiementsParMois {
    mois: String!
    annee: Int!
    total: Float!
    nombre_paiements: Int!
  }

  """
  Membres par plan tarifaire
  """
  type MembresParPlan {
    plan_id: Int!
    nom_plan: String!
    nombre_membres: Int!
  }

  """
  Dernier paiement
  """
  type DernierPaiement {
    id: Int!
    utilisateur_id: Int!
    montant: Float!
    date_paiement: String!
    statut: String!
    nom_utilisateur: String!
    prenom_utilisateur: String!
  }

  """
  Paiement échu
  """
  type PaiementEchu {
    utilisateur_id: Int!
    nom: String!
    prenom: String!
    email: String!
    montant: Float!
    date_echeance: String!
    jours_retard: Int!
  }

  """
  Nouveau membre
  """
  type NouveauMembre {
    id: Int!
    nom: String!
    prenom: String!
    email: String!
    date_inscription: String!
    jours_depuis_inscription: Int!
  }

  """
  Membre assidu (top présence)
  """
  type MembreAssidu {
    utilisateur_id: Int!
    nom: String!
    prenom: String!
    nombre_presences: Int!
    taux_presence: Float!
  }

  """
  Membres par grade
  """
  type MembresParGrade {
    grade_id: Int!
    nom_grade: String!
    nombre_membres: Int!
  }

  """
  Membres par genre
  """
  type MembresParGenre {
    genre_id: Int!
    nom_genre: String!
    nombre_membres: Int!
  }

  """
  Prochain anniversaire
  """
  type ProchainsAnniversaires {
    utilisateur_id: Int!
    nom: String!
    prenom: String!
    date_naissance: String!
    date_anniversaire: String!
    age: Int!
    jours_restants: Int!
  }

  """
  Article le plus vendu
  """
  type ArticlePlusVendu {
    article_id: Int!
    nom_article: String!
    nombre_ventes: Int!
    total_quantite: Int!
    total_revenus: Float!
  }

  """
  Cours de la semaine
  """
  type CoursSemaine {
    cours_id: Int!
    type_cours: String!
    date_cours: String!
    heure_debut: String!
    heure_fin: String!
    jour_semaine: String!
  }

  """
  Évolution des inscriptions
  """
  type EvolutionInscriptions {
    mois: String!
    annee: Int!
    nouvelles_inscriptions: Int!
    total_inscriptions: Int!
  }

  """
  Dashboard global avec toutes les métriques
  """
  type DashboardGlobal {
    nombreMembres: Int!
    totalPaiementsMois: Float!
    paiementsRecents: Int!
    paiementsEnAttente: Int!
    plansActifs: Int!
    tauxRenouvellement: Float!
    statistiquesGenerales: StatistiquesGenerales!
  }

  """
  Statistiques de paiements consolidées
  """
  type StatistiquesPaiementsConsolidees {
    totalPaiementsMois: Float!
    paiementsRecents: Int!
    paiementsEnAttente: Int!
    tauxRenouvellement: Float!
    paiementsParMois: [PaiementsParMois!]!
    derniersPaiements: [DernierPaiement!]!
    paiementsEchus: [PaiementEchu!]!
  }

  """
  Statistiques de membres consolidées
  """
  type StatistiquesMembresConsolidees {
    nombreTotal: Int!
    nouveauxMembres: [NouveauMembre!]!
    topMembresAssidus: [MembreAssidu!]!
    membresParGrade: [MembresParGrade!]!
    membresParGenre: [MembresParGenre!]!
    membresParPlan: [MembresParPlan!]!
  }

  """
  Statistiques de cours consolidées
  """
  type StatistiquesCoursConsolidees {
    statistiquesParCours: [StatistiquesParCours!]!
    statistiquesPresence: [StatistiquesPresence!]!
    coursSemaine: [CoursSemaine!]!
    evolutionInscriptions: [EvolutionInscriptions!]!
  }

  """
  Queries pour les statistiques
  """
  type Query {
    """
    Obtenir les statistiques générales du club
    """
    statistiquesGenerales: StatistiquesGenerales!

    """
    Obtenir les statistiques par type de cours
    """
    statistiquesParCours: [StatistiquesParCours!]!

    """
    Obtenir les statistiques de présence (30 derniers jours)
    """
    statistiquesPresence: [StatistiquesPresence!]!

    """
    Obtenir les statistiques de fréquentation d'un utilisateur
    """
    statistiquesFrequentation(utilisateur_id: Int!): [StatistiquesFrequentation!]!

    """
    Obtenir la progression d'un utilisateur
    """
    progressionUtilisateur(utilisateur_id: Int!): ProgressionUtilisateur!

    """
    Obtenir les présences par mois pour un utilisateur
    """
    presenceParMois(utilisateur_id: Int!): [PresenceParMois!]!

    """
    Obtenir les présences non validées par mois
    """
    presencesNonValideesParMois: [PresencesNonValideesParMois!]!

    """
    Obtenir les statistiques de présence par mois
    """
    statistiquesPresenceParMois: [StatistiquesPresenceParMois!]!

    """
    Obtenir le nombre total de membres
    """
    nombreMembres: Int!

    """
    Obtenir le montant total des paiements du mois en cours
    """
    totalPaiementsMois: Float!

    """
    Obtenir le nombre de paiements récents (7 derniers jours)
    """
    paiementsRecents: Int!

    """
    Obtenir le nombre de paiements en attente
    """
    paiementsEnAttente: Int!

    """
    Obtenir le nombre de plans tarifaires actifs
    """
    plansActifs: Int!

    """
    Obtenir le taux de renouvellement des abonnements
    """
    tauxRenouvellement: Float!

    """
    Obtenir les paiements par mois (12 derniers mois)
    """
    paiementsParMois: [PaiementsParMois!]!

    """
    Obtenir les membres par plan tarifaire
    """
    membresParPlan: [MembresParPlan!]!

    """
    Obtenir les derniers paiements (limite paramétrable)
    """
    derniersPaiements(limite: Int = 10): [DernierPaiement!]!

    """
    Obtenir les paiements échus (en retard)
    """
    paiementsEchus: [PaiementEchu!]!

    """
    Obtenir les nouveaux membres (30 derniers jours)
    """
    nouveauxMembres: [NouveauMembre!]!

    """
    Obtenir le top des membres les plus assidus
    """
    topMembresAssidus(limite: Int = 10): [MembreAssidu!]!

    """
    Obtenir les membres par grade
    """
    membresParGrade: [MembresParGrade!]!

    """
    Obtenir les membres par genre
    """
    membresParGenre: [MembresParGenre!]!

    """
    Obtenir les prochains anniversaires (30 prochains jours)
    """
    prochainsAnniversaires: [ProchainsAnniversaires!]!

    """
    Obtenir les articles les plus vendus
    """
    articlesPlusVendus(limite: Int = 10): [ArticlePlusVendu!]!

    """
    Obtenir les cours de la semaine en cours
    """
    coursSemaine: [CoursSemaine!]!

    """
    Obtenir l'évolution des inscriptions (12 derniers mois)
    """
    evolutionInscriptions: [EvolutionInscriptions!]!

    """
    Obtenir le dashboard global (métriques consolidées)
    """
    dashboardGlobal: DashboardGlobal!

    """
    Obtenir les statistiques de paiements consolidées
    """
    statistiquesPaiementsConsolidees: StatistiquesPaiementsConsolidees!

    """
    Obtenir les statistiques de membres consolidées
    """
    statistiquesMembresConsolidees: StatistiquesMembresConsolidees!

    """
    Obtenir les statistiques de cours consolidées
    """
    statistiquesCoursConsolidees: StatistiquesCoursConsolidees!
  }
`;
