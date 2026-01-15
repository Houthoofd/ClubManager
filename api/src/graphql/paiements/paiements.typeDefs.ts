/**
 * Définitions de types GraphQL pour le module Paiements
 */

export const paiementsTypeDefs = `#graphql
  """
  Paiement avec informations complètes
  """
  type Paiement {
    id: Int!
    utilisateur_id: Int!
    montant: Float!
    date_paiement: String!
    methode_paiement: String!
    statut: String!
    stripe_payment_intent_id: String
    stripe_charge_id: String
    abonnement_id: Int
    commande_id: Int
    echeance_id: Int
    periode_debut: String
    periode_fin: String
    notes: String
    created_at: String
    updated_at: String
  }

  """
  Paiement avec détails des relations (utilisateur, abonnement, échéance)
  """
  type PaiementAvecDetails {
    id: Int!
    utilisateur_id: Int!
    montant: Float!
    date_paiement: String!
    methode_paiement: String!
    statut: String!
    stripe_payment_intent_id: String
    first_name: String!
    last_name: String!
    nom_plan: String
    echeance_id: Int
    echeance_statut: String
    created_at: String
  }

  """
  Échéance de paiement
  """
  type EcheancePaiement {
    id: Int!
    utilisateur_id: Int!
    montant: Float!
    date_echeance: String!
    statut: String!
    description: String
    abonnement_id: Int
    created_at: String
    updated_at: String
  }

  """
  Échéance avec détails utilisateur et abonnement
  """
  type EcheanceAvecDetails {
    id: Int!
    utilisateur_id: Int!
    montant: Float!
    date_echeance: String!
    statut: String!
    description: String
    utilisateur: UtilisateurInfo!
    abonnement_nom: String
  }

  """
  Informations basiques d'un utilisateur
  """
  type UtilisateurInfo {
    first_name: String!
    last_name: String!
  }

  """
  Commande
  """
  type Commande {
    id: Int!
    utilisateur_id: Int!
    montant_total: Float!
    statut: String!
    date_commande: String!
    paiement_id: Int
    notes: String
    created_at: String
    updated_at: String
  }

  """
  Article de commande
  """
  type ArticleCommande {
    id: Int!
    commande_id: Int!
    article_id: Int!
    quantite: Int!
    prix_unitaire: Float!
    created_at: String
  }

  """
  Statistiques des paiements
  """
  type StatistiquesPaiements {
    total_paiements: Int!
    total_montant: Float!
    montant_moyen: Float!
    paiements_reussis: Int!
    paiements_en_attente: Int!
    paiements_echoues: Int!
    montant_reussi: Float!
    montant_en_attente: Float!
  }

  """
  Statistiques par méthode de paiement
  """
  type StatistiquesParMethode {
    methode_paiement: String!
    nombre_paiements: Int!
    montant_total: Float!
  }

  """
  Statistiques des échéances
  """
  type StatistiquesEcheances {
    total_echeances: Int!
    echeances_en_attente: Int!
    echeances_payees: Int!
    echeances_en_retard: Int!
    montant_total_en_attente: Float!
    montant_total_paye: Float!
  }

  """
  Historique de paiement d'un utilisateur
  """
  type HistoriquePaiement {
    paiements: [Paiement!]!
    total: Int!
    montant_total: Float!
  }

  """
  Résultat de confirmation d'opération
  """
  type ConfirmationResult {
    isConfirm: Boolean!
    message: String!
    paiementId: Int
    echeanceId: Int
  }

  """
  Résultat de vérification avec données
  """
  type VerifyResultWithData {
    isFind: Boolean!
    message: String!
    data: [Paiement!]
  }

  """
  Résultat de création de paiement
  """
  type CreationPaiementResult {
    success: Boolean!
    message: String!
    paiementId: Int
    stripePaymentIntentId: String
  }

  """
  Entrée pour créer un paiement
  """
  input CreatePaiementInput {
    utilisateur_id: Int!
    montant: Float!
    methode_paiement: String!
    abonnement_id: Int
    commande_id: Int
    echeance_id: Int
    periode_debut: String
    periode_fin: String
    notes: String
  }

  """
  Entrée pour mettre à jour un paiement
  """
  input UpdatePaiementInput {
    statut: String
    stripe_payment_intent_id: String
    stripe_charge_id: String
    notes: String
  }

  """
  Entrée pour créer une échéance
  """
  input CreateEcheanceInput {
    utilisateur_id: Int!
    montant: Float!
    date_echeance: String!
    description: String
    abonnement_id: Int
  }

  """
  Entrée pour mettre à jour une échéance
  """
  input UpdateEcheanceInput {
    montant: Float
    date_echeance: String
    statut: String
    description: String
  }

  """
  Entrée pour créer une commande
  """
  input CreateCommandeInput {
    utilisateur_id: Int!
    montant_total: Float!
    articles: [ArticleCommandeInput!]!
    notes: String
  }

  """
  Entrée pour un article de commande
  """
  input ArticleCommandeInput {
    article_id: Int!
    quantite: Int!
    prix_unitaire: Float!
  }

  """
  Filtre pour les paiements
  """
  input PaiementFilterInput {
    utilisateur_id: Int
    statut: String
    methode_paiement: String
    date_debut: String
    date_fin: String
    montant_min: Float
    montant_max: Float
  }

  """
  Options de pagination
  """
  input PaginationInput {
    limit: Int = 50
    offset: Int = 0
  }

  """
  Queries pour les paiements
  """
  type Query {
    """
    Récupérer tous les paiements
    """
    paiements(pagination: PaginationInput): [Paiement!]!

    """
    Récupérer un paiement par son ID
    """
    paiement(id: Int!): Paiement

    """
    Récupérer les paiements avec détails
    """
    paiementsAvecDetails(pagination: PaginationInput): [PaiementAvecDetails!]!

    """
    Récupérer les paiements d'un utilisateur
    """
    paiementsUtilisateur(utilisateur_id: Int!, pagination: PaginationInput): [Paiement!]!

    """
    Récupérer l'historique de paiement d'un utilisateur
    """
    historiquePaiementUtilisateur(utilisateur_id: Int!): HistoriquePaiement!

    """
    Récupérer les paiements par statut
    """
    paiementsParStatut(statut: String!, pagination: PaginationInput): [Paiement!]!

    """
    Récupérer les paiements par méthode
    """
    paiementsParMethode(methode_paiement: String!, pagination: PaginationInput): [Paiement!]!

    """
    Rechercher des paiements avec filtres
    """
    rechercherPaiements(filtres: PaiementFilterInput!, pagination: PaginationInput): [PaiementAvecDetails!]!

    """
    Récupérer toutes les échéances
    """
    echeances(pagination: PaginationInput): [EcheancePaiement!]!

    """
    Récupérer une échéance par son ID
    """
    echeance(id: Int!): EcheancePaiement

    """
    Récupérer les échéances avec détails
    """
    echeancesAvecDetails(pagination: PaginationInput): [EcheanceAvecDetails!]!

    """
    Récupérer les échéances d'un utilisateur
    """
    echeancesUtilisateur(utilisateur_id: Int!): [EcheancePaiement!]!

    """
    Récupérer les échéances en attente
    """
    echeancesEnAttente(pagination: PaginationInput): [EcheanceAvecDetails!]!

    """
    Récupérer les échéances en retard
    """
    echeancesEnRetard(pagination: PaginationInput): [EcheanceAvecDetails!]!

    """
    Récupérer une commande par son ID
    """
    commande(id: Int!): Commande

    """
    Récupérer les commandes d'un utilisateur
    """
    commandesUtilisateur(utilisateur_id: Int!): [Commande!]!

    """
    Récupérer les articles d'une commande
    """
    articlesCommande(commande_id: Int!): [ArticleCommande!]!

    """
    Compter le nombre total de paiements
    """
    compterPaiements: Int!

    """
    Calculer le montant total des paiements
    """
    montantTotalPaiements: Float!

    """
    Obtenir les statistiques des paiements
    """
    statistiquesPaiements: StatistiquesPaiements!

    """
    Obtenir les statistiques par méthode de paiement
    """
    statistiquesParMethode: [StatistiquesParMethode!]!

    """
    Obtenir les statistiques des échéances
    """
    statistiquesEcheances: StatistiquesEcheances!

    """
    Vérifier si un utilisateur a des paiements
    """
    utilisateurAPaiements(utilisateur_id: Int!): Boolean!

    """
    Vérifier si une échéance existe
    """
    echeanceExiste(id: Int!): Boolean!
  }

  """
  Mutations pour les paiements
  """
  type Mutation {
    """
    Créer un nouveau paiement
    """
    creerPaiement(input: CreatePaiementInput!): CreationPaiementResult!

    """
    Mettre à jour un paiement
    """
    mettreAJourPaiement(id: Int!, input: UpdatePaiementInput!): ConfirmationResult!

    """
    Marquer un paiement comme réussi
    """
    marquerPaiementReussi(id: Int!, stripe_payment_intent_id: String, stripe_charge_id: String): ConfirmationResult!

    """
    Marquer un paiement comme échoué
    """
    marquerPaiementEchoue(id: Int!, raison: String): ConfirmationResult!

    """
    Annuler un paiement
    """
    annulerPaiement(id: Int!): ConfirmationResult!

    """
    Rembourser un paiement
    """
    rembourserPaiement(id: Int!, montant: Float, raison: String): ConfirmationResult!

    """
    Créer une nouvelle échéance
    """
    creerEcheance(input: CreateEcheanceInput!): ConfirmationResult!

    """
    Mettre à jour une échéance
    """
    mettreAJourEcheance(id: Int!, input: UpdateEcheanceInput!): ConfirmationResult!

    """
    Marquer une échéance comme payée
    """
    marquerEcheancePayee(id: Int!, paiement_id: Int!): ConfirmationResult!

    """
    Annuler une échéance
    """
    annulerEcheance(id: Int!): ConfirmationResult!

    """
    Créer des échéances automatiques pour un abonnement
    """
    creerEcheancesAbonnement(utilisateur_id: Int!, abonnement_id: Int!, nombre_echeances: Int!): ConfirmationResult!

    """
    Créer une nouvelle commande
    """
    creerCommande(input: CreateCommandeInput!): ConfirmationResult!

    """
    Marquer une commande comme payée
    """
    marquerCommandePayee(commande_id: Int!, paiement_id: Int!): ConfirmationResult!

    """
    Annuler une commande
    """
    annulerCommande(id: Int!): ConfirmationResult!
  }
`;
