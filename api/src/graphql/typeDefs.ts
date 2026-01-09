import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # ==========================================
  # SCALARS
  # ==========================================

  scalar DateTime
  scalar Decimal
  scalar JSON

  # ==========================================
  # ENUMS
  # ==========================================

  enum StatutPaiement {
    VALIDE
    EN_ATTENTE
    ECHEC
  }

  enum StatutCommande {
    EN_ATTENTE
    CONFIRMEE
    EN_PREPARATION
    EXPEDIEE
    LIVREE
    ANNULEE
  }

  enum StatutAlerte {
    ACTIVE
    RESOLUE
    IGNOREE
  }

  enum PrioriteAlerte {
    BASSE
    NORMALE
    HAUTE
    CRITIQUE
  }

  enum TypeMessage {
    PRIVE
    PUBLIC
    SYSTEME
  }

  # ==========================================
  # TYPES DE RÉFÉRENCE
  # ==========================================

  type Genre {
    id: Int!
    genreName: String!
    users: [User!]!
  }

  type Status {
    id: Int!
    nomRole: String!
    description: String
    users: [User!]!
  }

  type Grade {
    id: Int!
    nom: String!
    ordre: Int
    users: [User!]!
  }

  type PlanTarifaire {
    id: Int!
    nom: String!
    description: String
    prix: Decimal!
    duree: Int
    actif: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    users: [User!]!
    paiements: [Paiement!]!
  }

  # ==========================================
  # UTILISATEUR
  # ==========================================

  type User {
    id: Int!
    firstName: String!
    lastName: String!
    fullName: String!
    email: String!
    genderId: Int
    dateOfBirth: DateTime!
    statusId: Int!
    gradeId: Int!
    abonnementId: Int
    userId: String
    actif: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!

    # Relations
    genre: Genre
    status: Status!
    grade: Grade!
    abonnement: PlanTarifaire
    inscriptions: [Inscription!]!
    paiements: [Paiement!]!
    reservations: [Reservation!]!
    commandes: [Commande!]!
    messagesEnvoyes: [Message!]!
    messagesRecus: [Message!]!
    notifications: [Notification!]!
    groupes: [GroupeUtilisateur!]!
    alertes: [AlerteUtilisateur!]!

    # Champs calculés
    nombreInscriptions: Int!
    dernierPaiement: Paiement
    prochainCours: Cours
  }

  # ==========================================
  # COURS
  # ==========================================

  type Cours {
    id: Int!
    dateCours: DateTime!
    typeCours: String!
    heureDebut: DateTime!
    heureFin: DateTime!
    capaciteMax: Int
    description: String
    actif: Boolean!
    createdAt: DateTime!

    # Relations
    inscriptions: [Inscription!]!
    reservations: [Reservation!]!

    # Champs calculés
    nombreInscrits: Int!
    placesDisponibles: Int
    estComplet: Boolean!
  }

  type Inscription {
    id: Int!
    utilisateurId: Int!
    coursId: Int!
    statusId: Int!
    dateInscription: DateTime!
    present: Boolean!
    notes: String

    # Relations
    utilisateur: User!
    cours: Cours!
  }

  type Reservation {
    id: Int!
    utilisateurId: Int!
    coursId: Int!
    dateReservation: DateTime!
    statut: String!
    notes: String

    # Relations
    utilisateur: User!
    cours: Cours!
  }

  # ==========================================
  # PAIEMENTS
  # ==========================================

  type Paiement {
    id: Int!
    utilisateurId: Int!
    montant: Decimal!
    datePaiement: DateTime!
    statut: String!
    abonnementId: Int
    periodeDebut: DateTime
    periodeFin: DateTime
    methode: String
    transactionId: String
    createdAt: DateTime!

    # Relations
    utilisateur: User!
    abonnement: PlanTarifaire
  }

  type EcheancePaiement {
    id: Int!
    utilisateurId: Int!
    montant: Decimal!
    dateEcheance: DateTime!
    statut: String!
    rappelEnvoye: Boolean!
    createdAt: DateTime!
  }

  # ==========================================
  # BOUTIQUE
  # ==========================================

  type Taille {
    id: Int!
    nom: String!
    articles: [Article!]!
  }

  type Article {
    id: Int!
    nom: String!
    description: String
    prix: Decimal!
    tailleId: Int
    imageUrl: String
    actif: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!

    # Relations
    taille: Taille
    stock: Stock
    commandesArticles: [CommandeArticle!]!

    # Champs calculés
    stockDisponible: Int!
    enRupture: Boolean!
  }

  type Stock {
    id: Int!
    articleId: Int!
    quantite: Int!
    seuilMin: Int
    updatedAt: DateTime!

    # Relations
    article: Article!
  }

  type Commande {
    id: Int!
    utilisateurId: Int!
    dateCommande: DateTime!
    statut: String!
    montantTotal: Decimal!
    adresseLivraison: String
    notes: String

    # Relations
    utilisateur: User!
    articles: [CommandeArticle!]!

    # Champs calculés
    nombreArticles: Int!
  }

  type CommandeArticle {
    id: Int!
    commandeId: Int!
    articleId: Int!
    quantite: Int!
    prixUnitaire: Decimal!

    # Relations
    commande: Commande!
    article: Article!

    # Champs calculés
    sousTotal: Decimal!
  }

  # ==========================================
  # COMMUNICATION
  # ==========================================

  type Message {
    id: Int!
    expediteurId: Int!
    destinataireId: Int
    sujet: String!
    contenu: String!
    lu: Boolean!
    type: String!
    createdAt: DateTime!

    # Relations
    expediteur: User!
    destinataire: User
  }

  type MessagePersonnalise {
    id: Int!
    titre: String!
    contenu: String!
    type: String!
    actif: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Notification {
    id: Int!
    utilisateurId: Int!
    titre: String!
    message: String!
    type: String!
    lu: Boolean!
    lien: String
    createdAt: DateTime!

    # Relations
    utilisateur: User!
  }

  # ==========================================
  # GROUPES
  # ==========================================

  type Groupe {
    id: Int!
    nom: String!
    description: String
    actif: Boolean!
    createdAt: DateTime!

    # Relations
    membres: [GroupeUtilisateur!]!

    # Champs calculés
    nombreMembres: Int!
  }

  type GroupeUtilisateur {
    id: Int!
    groupeId: Int!
    utilisateurId: Int!
    role: String
    dateAjout: DateTime!

    # Relations
    groupe: Groupe!
    utilisateur: User!
  }

  # ==========================================
  # SYSTÈME D'ALERTES
  # ==========================================

  type AlerteType {
    id: Int!
    code: String!
    nom: String!
    description: String
    priorite: String!
    actif: Boolean!
    createdAt: DateTime!

    # Relations
    alertes: [AlerteUtilisateur!]!
  }

  type AlerteUtilisateur {
    id: Int!
    utilisateurId: Int!
    alerteTypeId: Int!
    statut: String!
    donneesContexte: JSON
    dateDetection: DateTime!
    dateResolution: DateTime
    notes: String

    # Relations
    utilisateur: User!
    alerteType: AlerteType!
    actions: [AlerteAction!]!
  }

  type AlerteAction {
    id: Int!
    alerteId: Int!
    actionType: String!
    description: String
    effectuePar: Int
    dateAction: DateTime!

    # Relations
    alerte: AlerteUtilisateur!
    utilisateur: User
  }

  # ==========================================
  # STATISTIQUES & ANALYTICS
  # ==========================================

  type StatistiquesDashboard {
    totalUtilisateurs: Int!
    utilisateursActifs: Int!
    totalCours: Int!
    coursAVenir: Int!
    totalPaiements: Decimal!
    paiementsEnAttente: Int!
    tauxPresence: Float!
    revenuMensuel: Decimal!
  }

  type StatistiquesUtilisateur {
    utilisateurId: Int!
    nombreCoursAssistes: Int!
    tauxPresence: Float!
    dernierCours: DateTime
    prochainPaiement: DateTime
    montantTotalPaye: Decimal!
  }

  # ==========================================
  # INPUTS
  # ==========================================

  input CreateUserInput {
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    genderId: Int
    dateOfBirth: DateTime!
    statusId: Int
    gradeId: Int
    abonnementId: Int
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    email: String
    password: String
    genderId: Int
    dateOfBirth: DateTime
    statusId: Int
    gradeId: Int
    abonnementId: Int
    actif: Boolean
  }

  input CreateCoursInput {
    dateCours: DateTime!
    typeCours: String!
    heureDebut: DateTime!
    heureFin: DateTime!
    capaciteMax: Int
    description: String
  }

  input UpdateCoursInput {
    dateCours: DateTime
    typeCours: String
    heureDebut: DateTime
    heureFin: DateTime
    capaciteMax: Int
    description: String
    actif: Boolean
  }

  input CreateInscriptionInput {
    utilisateurId: Int!
    coursId: Int!
    notes: String
  }

  input CreatePaiementInput {
    utilisateurId: Int!
    montant: Decimal!
    abonnementId: Int
    periodeDebut: DateTime
    periodeFin: DateTime
    methode: String
  }

  input CreateArticleInput {
    nom: String!
    description: String
    prix: Decimal!
    tailleId: Int
    imageUrl: String
  }

  input UpdateArticleInput {
    nom: String
    description: String
    prix: Decimal
    tailleId: Int
    imageUrl: String
    actif: Boolean
  }

  input CreateCommandeInput {
    utilisateurId: Int!
    articles: [CommandeArticleInput!]!
    adresseLivraison: String
    notes: String
  }

  input CommandeArticleInput {
    articleId: Int!
    quantite: Int!
  }

  input CreateMessageInput {
    expediteurId: Int!
    destinataireId: Int
    sujet: String!
    contenu: String!
    type: String
  }

  input CreateNotificationInput {
    utilisateurId: Int!
    titre: String!
    message: String!
    type: String!
    lien: String
  }

  input FilterUsersInput {
    statusId: Int
    gradeId: Int
    abonnementId: Int
    actif: Boolean
    search: String
  }

  input FilterCoursInput {
    typeCours: String
    dateDebut: DateTime
    dateFin: DateTime
    actif: Boolean
  }

  input FilterPaiementsInput {
    utilisateurId: Int
    statut: String
    dateDebut: DateTime
    dateFin: DateTime
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 10
    orderBy: String
    orderDirection: String = "ASC"
  }

  # ==========================================
  # RESPONSES
  # ==========================================

  type AuthResponse {
    token: String!
    refreshToken: String
    user: User!
  }

  type PaginatedUsersResponse {
    users: [User!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type PaginatedCoursResponse {
    cours: [Cours!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type SuccessResponse {
    success: Boolean!
    message: String!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  type Query {
    # Utilisateurs
    users(filter: FilterUsersInput, pagination: PaginationInput): PaginatedUsersResponse!
    user(id: Int!): User
    userByEmail(email: String!): User
    me: User

    # Cours
    cours(filter: FilterCoursInput, pagination: PaginationInput): PaginatedCoursResponse!
    coursById(id: Int!): Cours
    prochainsCours(limit: Int): [Cours!]!
    coursParType(typeCours: String!): [Cours!]!

    # Inscriptions
    inscriptions(utilisateurId: Int, coursId: Int): [Inscription!]!
    inscriptionsByUser(utilisateurId: Int!): [Inscription!]!
    inscriptionsByCours(coursId: Int!): [Inscription!]!

    # Paiements
    paiements(filter: FilterPaiementsInput, pagination: PaginationInput): [Paiement!]!
    paiementsByUser(utilisateurId: Int!): [Paiement!]!
    echeancesPaiements(utilisateurId: Int): [EcheancePaiement!]!

    # Boutique
    articles(actif: Boolean): [Article!]!
    article(id: Int!): Article
    commandes(utilisateurId: Int): [Commande!]!
    commande(id: Int!): Commande

    # Communication
    messages(utilisateurId: Int!): [Message!]!
    messagesNonLus(utilisateurId: Int!): [Message!]!
    notifications(utilisateurId: Int!): [Notification!]!
    notificationsNonLues(utilisateurId: Int!): [Notification!]!

    # Groupes
    groupes: [Groupe!]!
    groupe(id: Int!): Groupe
    groupesByUser(utilisateurId: Int!): [Groupe!]!

    # Alertes
    alertes(utilisateurId: Int, statut: String): [AlerteUtilisateur!]!
    alerteTypes: [AlerteType!]!

    # Statistiques
    statistiquesDashboard: StatistiquesDashboard!
    statistiquesUtilisateur(utilisateurId: Int!): StatistiquesUtilisateur!

    # Références
    genres: [Genre!]!
    statuses: [Status!]!
    grades: [Grade!]!
    plansTarifaires: [PlanTarifaire!]!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  type Mutation {
    # Authentication
    login(email: String!, password: String!): AuthResponse!
    register(input: CreateUserInput!): AuthResponse!
    refreshToken(refreshToken: String!): AuthResponse!
    logout: SuccessResponse!

    # Utilisateurs
    createUser(input: CreateUserInput!): User!
    updateUser(id: Int!, input: UpdateUserInput!): User!
    deleteUser(id: Int!): SuccessResponse!
    activateUser(id: Int!): User!
    deactivateUser(id: Int!): User!

    # Cours
    createCours(input: CreateCoursInput!): Cours!
    updateCours(id: Int!, input: UpdateCoursInput!): Cours!
    deleteCours(id: Int!): SuccessResponse!

    # Inscriptions
    inscrireUtilisateur(input: CreateInscriptionInput!): Inscription!
    desinscrireUtilisateur(id: Int!): SuccessResponse!
    marquerPresence(id: Int!, present: Boolean!): Inscription!

    # Paiements
    createPaiement(input: CreatePaiementInput!): Paiement!
    validerPaiement(id: Int!): Paiement!
    annulerPaiement(id: Int!): Paiement!

    # Boutique
    createArticle(input: CreateArticleInput!): Article!
    updateArticle(id: Int!, input: UpdateArticleInput!): Article!
    deleteArticle(id: Int!): SuccessResponse!
    updateStock(articleId: Int!, quantite: Int!): Stock!
    createCommande(input: CreateCommandeInput!): Commande!
    updateStatutCommande(id: Int!, statut: String!): Commande!

    # Communication
    sendMessage(input: CreateMessageInput!): Message!
    markMessageAsRead(id: Int!): Message!
    deleteMessage(id: Int!): SuccessResponse!
    createNotification(input: CreateNotificationInput!): Notification!
    markNotificationAsRead(id: Int!): Notification!
    markAllNotificationsAsRead(utilisateurId: Int!): SuccessResponse!

    # Groupes
    createGroupe(nom: String!, description: String): Groupe!
    addUserToGroupe(groupeId: Int!, utilisateurId: Int!, role: String): GroupeUtilisateur!
    removeUserFromGroupe(id: Int!): SuccessResponse!

    # Alertes
    resoudreAlerte(id: Int!, notes: String): AlerteUtilisateur!
    ignorerAlerte(id: Int!): AlerteUtilisateur!
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  type Subscription {
    # Notifications en temps réel
    notificationAdded(utilisateurId: Int!): Notification!
    messageReceived(utilisateurId: Int!): Message!

    # Mises à jour de cours
    coursUpdated(coursId: Int!): Cours!
    inscriptionAdded(coursId: Int!): Inscription!

    # Alertes
    alerteCreated(utilisateurId: Int!): AlerteUtilisateur!
  }
`;
