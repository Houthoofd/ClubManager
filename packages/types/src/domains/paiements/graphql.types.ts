/**
 * Schema GraphQL TypeDefs pour le module Paiements
 * ✅ Définition centralisée des types, queries et mutations pour les paiements
 *
 * @package @clubmanager/types
 */

export const paiementsTypeDefs = `#graphql
  """
  Statut d'un paiement
  """
  enum StatutPaiement {
    EN_ATTENTE
    VALIDE
    REFUSE
    REMBOURSE
    ANNULE
  }

  """
  Statut d'une échéance de paiement
  """
  enum StatutEcheance {
    PAYE
    EN_ATTENTE
    ECHU
  }

  """
  Méthode de paiement
  """
  enum MethodePaiement {
    STRIPE
    PAYPAL
    BITCOIN
    VIREMENT
    AUTRE
  }

  """
  Type représentant un paiement
  """
  type Paiement {
    id: Int!
    commande_id: Int
    utilisateur_id: Int!
    montant: Float!
    methode_paiement: MethodePaiement
    stripe_payment_intent_id: String
    paypal_order_id: String
    bitcoin_address: String
    date_paiement: String!
    statut: StatutPaiement!
    description: String
    date_confirmation: String
    date_modification: String
    abonnement_id: Int
    periode_debut: String
    periode_fin: String
  }

  """
  Paiement avec informations détaillées
  """
  type PaiementAvecDetails {
    id: Int!
    commande_id: Int
    utilisateur_id: Int!
    montant: Float!
    methode_paiement: MethodePaiement
    stripe_payment_intent_id: String
    paypal_order_id: String
    bitcoin_address: String
    date_paiement: String!
    statut: StatutPaiement!
    description: String
    date_confirmation: String
    date_modification: String
    abonnement_id: Int
    periode_debut: String
    periode_fin: String
    utilisateur: UtilisateurPaiement
    commande: CommandePaiement
    abonnement: AbonnementPaiement
  }

  """
  Informations utilisateur pour un paiement
  """
  type UtilisateurPaiement {
    id: Int!
    nom: String!
    prenom: String!
    email: String!
  }

  """
  Informations commande pour un paiement
  """
  type CommandePaiement {
    id: Int!
    numero_commande: String!
    montant_total: Float!
    statut: String!
  }

  """
  Informations abonnement pour un paiement
  """
  type AbonnementPaiement {
    id: Int!
    nom: String!
    montant: Float!
    frequence: String!
  }

  """
  Type représentant une échéance de paiement
  """
  type EcheancePaiement {
    id: Int!
    utilisateur_id: Int!
    abonnement_id: Int!
    date_echeance: String!
    montant: Float!
    statut: StatutEcheance!
    date_paiement: String
  }

  """
  Échéance avec informations détaillées
  """
  type EcheanceAvecDetails {
    id: Int!
    utilisateur_id: Int!
    abonnement_id: Int!
    date_echeance: String!
    montant: Float!
    statut: StatutEcheance!
    date_paiement: String
    utilisateur: UtilisateurPaiement
    abonnement: AbonnementPaiement
  }

  """
  Résultat de création d'un Payment Intent Stripe
  """
  type PaymentIntentResult {
    success: Boolean!
    clientSecret: String
    paymentIntentId: String
    message: String!
  }

  """
  Résultat de confirmation de paiement
  """
  type ConfirmationPaiementResult {
    success: Boolean!
    message: String!
    paiementId: Int
    statut: StatutPaiement
  }

  """
  Statistiques des paiements
  """
  type StatistiquesPaiements {
    totalPaiements: Int!
    montantTotal: Float!
    paiementsValides: Int!
    paiementsEnAttente: Int!
    paiementsRefuses: Int!
    paiementsRembourses: Int!
    paiementsAnnules: Int!
    moyenneMontant: Float!
    montantParMois: [MontantParMois!]
    repartitionMethodes: [RepartitionMethode!]
  }

  """
  Montant par mois
  """
  type MontantParMois {
    mois: String!
    montant: Float!
    count: Int!
  }

  """
  Répartition par méthode de paiement
  """
  type RepartitionMethode {
    methode: MethodePaiement!
    count: Int!
    montantTotal: Float!
  }

  """
  Statistiques de paiements par utilisateur
  """
  type StatistiquesPaiementsUtilisateur {
    utilisateurId: Int!
    totalPaiements: Int!
    montantTotal: Float!
    dernierPaiement: String
    paiementsEnRetard: Int!
    moyenneMontant: Float!
  }

  """
  Résultat d'une opération sur un paiement
  """
  type PaiementOperationResult {
    success: Boolean!
    message: String!
    paiementId: Int
  }

  """
  Historique des paiements
  """
  type HistoriquePaiements {
    success: Boolean!
    paiements: [PaiementAvecDetails!]!
    total: Int!
    limit: Int!
    offset: Int!
  }

  """
  Filtres pour les paiements
  """
  input PaiementsFiltresInput {
    utilisateurId: Int
    statut: StatutPaiement
    dateDebut: String
    dateFin: String
    abonnementId: Int
    montantMin: Float
    montantMax: Float
    limit: Int
    offset: Int
  }

  """
  Queries pour les paiements
  """
  extend type Query {
    """
    Récupérer un paiement par ID
    """
    paiement(id: Int!): PaiementAvecDetails!

    """
    Récupérer tous les paiements avec filtres
    """
    paiements(filtres: PaiementsFiltresInput): [PaiementAvecDetails!]!

    """
    Récupérer l'historique des paiements d'un utilisateur
    """
    historiquePaiements(
      utilisateurId: Int
      limit: Int
      offset: Int
    ): HistoriquePaiements!

    """
    Récupérer une échéance par ID
    """
    echeancePaiement(id: Int!, userId: Int!): EcheanceAvecDetails!

    """
    Récupérer les échéances d'un utilisateur
    """
    echeancesPaiements(utilisateurId: Int!): [EcheanceAvecDetails!]!

    """
    Récupérer les statistiques des paiements (Admin uniquement)
    """
    statistiquesPaiements(
      dateDebut: String
      dateFin: String
    ): StatistiquesPaiements!

    """
    Récupérer les statistiques d'un utilisateur
    """
    statistiquesPaiementsUtilisateur(
      utilisateurId: Int!
    ): StatistiquesPaiementsUtilisateur!
  }

  """
  Mutations pour les paiements
  """
  extend type Mutation {
    """
    Créer un Payment Intent pour une échéance
    """
    creerPaymentIntentEcheance(
      amount: Float!
      echeanceId: Int!
      userId: Int!
      currency: String
      description: String
    ): PaymentIntentResult!

    """
    Créer un Payment Intent pour une commande
    """
    creerPaymentIntentCommande(
      amount: Float!
      commandeId: Int!
      userId: Int
      currency: String
      description: String
    ): PaymentIntentResult!

    """
    Confirmer un paiement d'échéance
    """
    confirmerPaiementEcheance(
      paymentIntentId: String!
      echeanceId: Int!
      userId: Int!
      amount: Float!
    ): ConfirmationPaiementResult!

    """
    Confirmer un paiement de commande
    """
    confirmerPaiementCommande(
      paymentIntentId: String!
      commandeId: Int!
      userId: Int!
      amount: Float!
    ): ConfirmationPaiementResult!

    """
    Créer un paiement manuel (Admin uniquement)
    """
    creerPaiement(
      commandeId: Int
      utilisateurId: Int!
      montant: Float!
      methodePaiement: MethodePaiement
      description: String
      abonnementId: Int
    ): PaiementOperationResult!

    """
    Valider un paiement (Admin uniquement)
    """
    validerPaiement(
      paiementId: Int!
      referenceTransaction: String
    ): PaiementOperationResult!

    """
    Refuser un paiement (Admin uniquement)
    """
    refuserPaiement(paiementId: Int!, raison: String): PaiementOperationResult!

    """
    Rembourser un paiement (Admin uniquement)
    """
    rembourserPaiement(
      paiementId: Int!
      montant: Float
      raison: String
    ): PaiementOperationResult!

    """
    Annuler un paiement (Admin uniquement)
    """
    annulerPaiement(paiementId: Int!, raison: String): PaiementOperationResult!
  }
`;

export default paiementsTypeDefs;
