/**
 * ====================================================================
 * FRENCH TRANSLATIONS (fr)
 * ====================================================================
 *
 * Traductions complètes pour l'application ClubManager.
 * Organisées par namespace de fonctionnalités pour la maintenabilité.
 *
 * Namespaces:
 * - common: Éléments UI partagés (boutons, labels, actions)
 * - navigation: Menu, routes, breadcrumbs
 * - auth: Authentification & autorisation
 * - shop: E-commerce, produits, panier
 * - courses: Gestion des cours
 * - users: Gestion des utilisateurs
 * - messages: Système de messagerie
 * - orders: Gestion des commandes
 * - stats: Statistiques & analytiques
 * - teachers: Gestion des professeurs
 * - errors: Messages d'erreur
 * - validation: Messages de validation de formulaire
 */

export const fr = {
  // ================================================================
  // COMMON - Éléments UI Partagés
  // ================================================================
  common: {
    // Actions
    actions: {
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      create: "Créer",
      add: "Ajouter",
      remove: "Retirer",
      update: "Mettre à jour",
      confirm: "Confirmer",
      close: "Fermer",
      back: "Retour",
      next: "Suivant",
      previous: "Précédent",
      submit: "Soumettre",
      search: "Rechercher",
      filter: "Filtrer",
      export: "Exporter",
      import: "Importer",
      download: "Télécharger",
      upload: "Téléverser",
      print: "Imprimer",
      refresh: "Actualiser",
      reset: "Réinitialiser",
      clear: "Effacer",
      apply: "Appliquer",
      view: "Voir",
      details: "Détails",
      manage: "Gérer",
      configure: "Configurer",
      settings: "Paramètres",
    },

    // Labels
    labels: {
      name: "Nom",
      email: "Email",
      phone: "Téléphone",
      address: "Adresse",
      city: "Ville",
      country: "Pays",
      zipCode: "Code postal",
      description: "Description",
      date: "Date",
      time: "Heure",
      status: "Statut",
      type: "Type",
      category: "Catégorie",
      price: "Prix",
      quantity: "Quantité",
      total: "Total",
      subtotal: "Sous-total",
      tax: "Taxe",
      discount: "Réduction",
      notes: "Notes",
      actions: "Actions",
      createdAt: "Créé le",
      updatedAt: "Modifié le",
      language: "Langue",
      theme: "Thème",
      notification: "Notification",
      notifications: "Notifications",
      profile: "Profil",
      account: "Compte",
      preferences: "Préférences",
      notAvailable: "N/A",
    },

    // Status
    status: {
      active: "Actif",
      inactive: "Inactif",
      pending: "En attente",
      completed: "Terminé",
      cancelled: "Annulé",
      processing: "En cours",
      confirmed: "Confirmé",
      rejected: "Rejeté",
      draft: "Brouillon",
      published: "Publié",
      archived: "Archivé",
    },

    // Messages
    messages: {
      loading: "Chargement...",
      saving: "Enregistrement...",
      saved: "Enregistré avec succès",
      error: "Une erreur est survenue",
      success: "Succès",
      noData: "Aucune donnée disponible",
      noResults: "Aucun résultat trouvé",
      confirmDelete: "Êtes-vous sûr de vouloir supprimer cet élément ?",
      deleteSuccess: "Élément supprimé avec succès",
      updateSuccess: "Mis à jour avec succès",
      createSuccess: "Créé avec succès",
      invalidData: "Données invalides",
      requiredField: "Ce champ est requis",
      unsavedChanges: "Vous avez des modifications non enregistrées. Voulez-vous quitter ?",
    },

    // Time
    time: {
      today: "Aujourd'hui",
      yesterday: "Hier",
      tomorrow: "Demain",
      thisWeek: "Cette semaine",
      lastWeek: "Semaine dernière",
      thisMonth: "Ce mois-ci",
      lastMonth: "Mois dernier",
      thisYear: "Cette année",
      custom: "Personnalisé",
    },

    // Pagination
    pagination: {
      page: "Page",
      of: "sur",
      itemsPerPage: "Éléments par page",
      showing: "Affichage de",
      to: "à",
      items: "éléments",
      first: "Premier",
      last: "Dernier",
    },
  },

  // ================================================================
  // NAVIGATION - Menu & Routes
  // ================================================================
  navigation: {
    menu: {
      home: "Accueil",
      dashboard: "Tableau de bord",
      shop: "Boutique",
      courses: "Cours",
      users: "Utilisateurs",
      messages: "Messages",
      orders: "Commandes",
      stats: "Statistiques",
      teachers: "Professeurs",
      settings: "Paramètres",
      logout: "Déconnexion",
      profile: "Mon profil",
      cart: "Panier",
    },

    breadcrumbs: {
      home: "Accueil",
      back: "Retour",
    },

    footer: {
      copyright: "© {{year}} ClubManager. Tous droits réservés.",
      version: "Version {{version}}",
      privacy: "Politique de confidentialité",
      terms: "Conditions d'utilisation",
      contact: "Nous contacter",
    },
  },

  // ================================================================
  // AUTH - Authentification & Autorisation
  // ================================================================
  auth: {
    login: {
      title: "Connexion",
      subtitle: "Bienvenue sur ClubManager",
      email: "Email",
      password: "Mot de passe",
      rememberMe: "Se souvenir de moi",
      forgotPassword: "Mot de passe oublié ?",
      submit: "Se connecter",
      noAccount: "Pas encore de compte ?",
      signUp: "S'inscrire",
      errors: {
        invalidCredentials: "Email ou mot de passe invalide",
        required: "Email et mot de passe requis",
        emailFormat: "Veuillez entrer un email valide",
      },
    },

    register: {
      title: "Créer un compte",
      subtitle: "Rejoignez ClubManager",
      firstName: "Prénom",
      lastName: "Nom",
      email: "Email",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      phone: "Téléphone",
      submit: "Créer un compte",
      hasAccount: "Déjà un compte ?",
      signIn: "Se connecter",
      terms: "J'accepte les Conditions d'utilisation et la Politique de confidentialité",
      header: {
        title: "Inscription",
        subtitle: "Créez votre compte ClubManager",
      },
      buttons: {
        submit: "S'inscrire",
        verify: "Vérifier les informations",
      },
      footer: {
        hasAccount: "Déjà un compte ?",
      },
      links: {
        login: "Se connecter",
      },
      messages: {
        registering: "Inscription en cours...",
      },
      userExists: {
        title: "Utilisateur existant",
        message: "Un utilisateur avec ces informations existe déjà.",
        goToLogin: "Aller à la connexion",
        modifyData: "Modifier mes données",
      },
      success: {
        generic: "Inscription réussie !",
        withUserId: "Inscription réussie ! Votre identifiant est: {{userId}}",
      },
      errors: {
        title: "Erreur",
        passwordMismatch: "Les mots de passe ne correspondent pas",
        weakPassword: "Le mot de passe doit contenir au moins 8 caractères",
        emailTaken: "Cet email est déjà enregistré",
        termsRequired: "Vous devez accepter les conditions générales",
        criticalFieldsMissing:
          "Veuillez remplir tous les champs obligatoires (prénom, nom, date de naissance)",
        cannotSubmit: "Veuillez vérifier vos informations avant de continuer",
        failed: "Erreur lors de l'inscription",
      },
    },

    forgotPassword: {
      title: "Récupération de mot de passe",
      subtitle: "Entrez votre adresse email pour recevoir un lien de récupération",
      emailLabel: "Adresse email",
      emailPlaceholder: "votre.email@exemple.com",
      emailInvalid: "Veuillez entrer une adresse email valide",
      sendLink: "Envoyer le lien de récupération",
      sending: "Envoi en cours...",
      emailSent: "Email envoyé",
      success: "Lien de réinitialisation envoyé à votre email",
      checkEmail:
        "Vérifiez votre boîte email et cliquez sur le lien pour réinitialiser votre mot de passe.",
      linkExpiry: "Le lien expire dans 1 heure.",
      checkSpam: "Pensez à vérifier vos spams si vous ne recevez pas l'email",
      rememberPassword: "Vous vous souvenez de votre mot de passe ?",
      backToLogin: "Retour à la connexion",
      error: "Erreur lors de la demande",
      connectionError: "Erreur de connexion au serveur",
    },

    verifyEmail: {
      title: "Vérification d'email",
      verifying: "Vérification de votre email en cours...",
      verifyingTitle: "Vérification en cours...",
      validatingToken: "Validation de votre token de sécurité...",
      success: "Votre email a été vérifié avec succès !",
      successTitle: "Email vérifié avec succès !",
      error: "Erreur lors de la vérification",
      errorTitle: "Erreur de vérification",
      connectionError: "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
      missingParams: "Token ou ID utilisateur manquant dans le lien de vérification",
      retrying: "Nouvelle tentative de vérification...",
      emailVerified: "Email vérifié",
      redirectEnabled: "Redirection automatique activée",
      accountVerified: "Compte vérifié",
      userId: "ID utilisateur",
      autoRedirect: "Redirection automatique dans :",
      loginNow: "Se connecter maintenant",
      whatToDo: "Que faire ?",
      help: {
        linkExpired: "Vérifiez que le lien n'est pas expiré (24h max)",
        correctLink: "Assurez-vous d'avoir cliqué sur le bon lien",
        checkConnection: "Vérifiez votre connexion internet",
        contactAdmin: "Contactez l'administration si le problème persiste",
      },
      retry: "Réessayer la vérification",
      login: "Connexion",
      register: "Inscription",
      footer: {
        copyright: "© 2024 ClubManager - Gestion de club sportif",
        tagline: "Connexion sécurisée • Arts martiaux",
        devMode: "Mode développement",
      },
    },

    resetPassword: {
      title: "Nouveau mot de passe",
      subtitle: "Bonjour {{userName}}, définissez votre nouveau mot de passe sécurisé",
      verifying: "Vérification en cours...",
      verifyingSubtitle: "Vérification du lien de récupération",
      verifyingLink: "Vérification du lien de récupération...",
      missingToken: "Token manquant dans l'URL",
      invalidToken: "Token invalide ou expiré",
      invalidLinkTitle: "Lien invalide",
      invalidLinkSubtitle: "Ce lien de récupération est invalide ou a expiré",
      invalidLinkMessage: "Ce lien de récupération est invalide ou a expiré.",
      requestNewLink: "Demander un nouveau lien",
      newPassword: "Nouveau mot de passe",
      passwordHelper: "Choisissez un mot de passe fort pour sécuriser votre compte",
      passwordInvalid: "Le mot de passe ne respecte pas les critères de sécurité",
      passwordPlaceholder: "Entrez votre nouveau mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      confirmPasswordPlaceholder: "Confirmez votre nouveau mot de passe",
      passwordMismatch: "Les mots de passe ne correspondent pas",
      passwordsMatch: "Les mots de passe correspondent",
      weakPassword: "Le mot de passe ne respecte pas les critères de sécurité requis",
      error: "Erreur lors de la réinitialisation",
      connectionError: "Erreur de connexion au serveur",
      successTitle: "Mot de passe réinitialisé !",
      successSubtitle: "Votre mot de passe a été mis à jour avec succès",
      successMessage: "Votre mot de passe a été réinitialisé avec succès.",
      redirecting: "Redirection vers la page de connexion dans quelques secondes...",
      loginNow: "Se connecter maintenant",
      submit: "Réinitialiser le mot de passe",
      resetting: "Réinitialisation...",
      strength: {
        title: "Force du mot de passe",
        weak: "Faible",
        fair: "Moyenne",
        good: "Bonne",
        strong: "Forte",
      },
      criteria: {
        title: "Critères de sécurité :",
        length: "Au moins 8 caractères",
        lowercase: "Au moins une minuscule (a-z)",
        uppercase: "Au moins une majuscule (A-Z)",
        numbers: "Au moins un chiffre (0-9)",
        symbols: "Au moins un caractère spécial (!@#$...)",
        noCommon: "Ne pas utiliser de mots de passe courants",
      },
    },

    profile: {
      title: "Mon profil",
      editProfile: "Modifier le profil",
      changePassword: "Changer le mot de passe",
      personalInfo: "Informations personnelles",
      contactInfo: "Coordonnées",
      preferences: "Préférences",
      security: "Sécurité",
    },

    account: {
      title: "Mon compte",
      subtitle: "Gérez vos informations personnelles et préférences",
      tabs: {
        personalInfo: "Informations personnelles",
        statistics: "Statistiques",
        payments: "Paiements",
      },
      fields: {
        birthDate: "Date de naissance",
        gender: "Genre",
        grade: "Grade",
        subscription: "Abonnement",
        status: "Statut",
      },
      noChanges: "Aucune modification détectée",
      updateSuccess: "Vos informations ont été mises à jour avec succès",
      updateError: "Erreur lors de la mise à jour",
      loadError: "Erreur lors du chargement des données du compte",
      confirmChanges: "Confirmer les modifications",
      confirmMessage: "Êtes-vous sûr de vouloir appliquer ces modifications ?",
      statisticsPlaceholder: "Vos statistiques de fréquentation apparaîtront ici",
      paymentsTitle: "Historique des paiements",
      noPayments: "Aucun paiement enregistré",
    },

    users: {
      create: {
        title: "Ajouter un utilisateur",
        subtitle: "Créer un nouveau membre ou administrateur",
        fields: {
          firstName: "Prénom",
          lastName: "Nom",
          username: "Nom d'utilisateur",
          usernameHelper: "Généré automatiquement si vide",
          email: "Email",
          birthDate: "Date de naissance",
          gender: "Genre",
          genderPlaceholder: "Sélectionner un genre",
          grade: "Grade",
          gradePlaceholder: "Sélectionner un grade",
          subscription: "Abonnement",
          subscriptionPlaceholder: "Sélectionner un abonnement",
          status: "Statut",
          statusPlaceholder: "Sélectionner un statut",
        },
        errors: {
          firstNameRequired: "Le prénom est requis",
          lastNameRequired: "Le nom est requis",
          emailRequired: "L'email est requis",
          emailInvalid: "Format d'email invalide",
          emailExists: "Cet email est déjà utilisé",
          birthDateRequired: "La date de naissance est requise",
        },
        submit: "Créer l'utilisateur",
        creating: "Création en cours...",
        confirmTitle: "Confirmer la création",
        confirmMessage: "Voulez-vous créer cet utilisateur ?",
        success: "L'utilisateur {{name}} a été créé avec succès",
        error: "Erreur lors de la création de l'utilisateur",
        existingUser: {
          title: "Utilisateur existant",
          message: "Attention",
          description: "Un utilisateur avec l'email {{email}} existe déjà",
        },
      },
      details: {
        title: "Utilisateur : {{name}}",
        subtitle: "Gérer les informations de l'utilisateur",
        loading: "Chargement...",
        tabs: {
          personalInfo: "Informations personnelles",
          statistics: "Statistiques",
          payments: "Paiements",
        },
        fields: {
          firstName: "Prénom",
          lastName: "Nom",
          birthDate: "Date de naissance",
          gender: "Genre",
          grade: "Grade",
          subscription: "Abonnement",
          status: "Statut",
        },
        noChanges: "Aucune modification détectée",
        updateSuccess: "L'utilisateur a été mis à jour avec succès",
        updateError: "Erreur lors de la mise à jour",
        loadError: "Erreur lors du chargement des données utilisateur",
        confirmChanges: "Confirmer les modifications",
        confirmMessage: "Êtes-vous sûr de vouloir appliquer ces modifications ?",
        statisticsTitle: "Statistiques de fréquentation",
        statisticsPlaceholder: "Les statistiques de fréquentation apparaîtront ici",
        noStatistics: "Aucune statistique disponible",
        paymentsTitle: "Historique des paiements",
        noPayments: "Aucun paiement enregistré",
      },
    },

    roles: {
      admin: "Administrateur",
      teacher: "Professeur",
      student: "Étudiant",
      member: "Membre",
      guest: "Invité",
    },

    permissions: {
      noAccess: "Vous n'avez pas la permission d'accéder à cette page",
      contactAdmin: "Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur",
    },

    session: {
      expired:
        "Votre session a expiré. Vous devez vous reconnecter pour accéder au tableau de bord.",
    },
  },

  // ================================================================
  // SHOP - E-commerce & Produits
  // ================================================================
  shop: {
    title: "Magasin",
    subtitle: "Découvrez nos produits et équipements",
    loading: "Chargement des produits...",
    loadingError: "Erreur lors du chargement des produits",

    products: {
      title: "Boutique",
      allProducts: "Tous les produits",
      categories: "Catégories",
      search: "Rechercher des produits...",
      sortBy: "Trier par",
      price: "Prix",
      name: "Nom",
      newest: "Plus récent",
      popularity: "Popularité",
      inStock: "En stock",
      outOfStock: "Rupture de stock",
      lowStock: "Stock faible",
      addToCart: "Ajouter au panier",
      viewDetails: "Voir les détails",
      noProducts: "Aucun produit trouvé",
      size: "Taille",
      selectSize: "Sélectionnez une taille",
      stock: "Stock",
      available: "Disponible",
      notAvailable: "Non disponible",
    },

    productDetails: {
      title: "Détails du produit",
      description: "Description",
      specifications: "Spécifications",
      reviews: "Avis",
      relatedProducts: "Produits similaires",
      addToCart: "Ajouter au panier",
      quantity: "Quantité",
      availability: "Disponibilité",
      sku: "Référence",
      category: "Catégorie",
      tags: "Tags",
      size: "Taille",
      selectSize: "Sélectionnez une taille",
      stock: "Stock disponible",
      stockBySizeTitle: "Stock par taille",
      noSizeSelected: "Aucune taille sélectionnée",
      selectSizeFirst: "Veuillez d'abord sélectionner une taille",
      outOfStock: "Rupture de stock",
      maxQuantity: "Quantité maximum",
      images: "Images",
      noImages: "Aucune image disponible",
    },

    cart: {
      title: "Panier",
      empty: "Votre panier est vide",
      continueShopping: "Continuer mes achats",
      checkout: "Passer la commande",
      subtotal: "Sous-total",
      shipping: "Livraison",
      tax: "Taxe",
      total: "Total",
      remove: "Retirer",
      update: "Mettre à jour",
      quantity: "Quantité",
      price: "Prix",
      size: "Taille",
      itemsCount: "{{count}} article",
      itemsCount_plural: "{{count}} articles",
      clearCart: "Vider le panier",
      confirmClear: "Êtes-vous sûr de vouloir vider votre panier ?",
      added: "Produit ajouté au panier",
      addedSuccess: "{{product}} a été ajouté à votre panier",
      removed: "Produit retiré du panier",
      updated: "Panier mis à jour",
      errors: {
        addFailed: "Erreur lors de l'ajout au panier",
        removeFailed: "Erreur lors du retrait du panier",
        updateFailed: "Erreur lors de la mise à jour du panier",
      },
    },

    checkout: {
      title: "Commande",
      shippingAddress: "Adresse de livraison",
      billingAddress: "Adresse de facturation",
      sameAsShipping: "Identique à l'adresse de livraison",
      paymentMethod: "Mode de paiement",
      creditCard: "Carte de crédit",
      paypal: "PayPal",
      bankTransfer: "Virement bancaire",
      reviewOrder: "Vérifier la commande",
      placeOrder: "Passer la commande",
      orderSummary: "Récapitulatif",
      processing: "Traitement de votre commande...",
      success: "Commande passée avec succès !",
      orderNumber: "Numéro de commande",
      errors: {
        paymentFailed: "Paiement échoué. Veuillez réessayer.",
        invalidAddress: "Veuillez fournir une adresse valide",
        invalidCard: "Informations de carte invalides",
      },
    },

    categories: {
      all: "Toutes les catégories",
      equipment: "Équipement",
      clothing: "Vêtements",
      accessories: "Accessoires",
      books: "Livres",
      digital: "Produits numériques",
      expand: "Développer",
      collapse: "Réduire",
      noProducts: "Aucun produit dans cette catégorie",
    },

    addProduct: {
      title: "Ajouter un produit",
      titleEdit: "Modifier un produit",
      subtitle: "Créez un nouveau produit pour votre boutique",
      subtitleEdit: "Modifiez les informations du produit",
      form: {
        name: "Nom du produit",
        namePlaceholder: "Ex: Kimono Judo",
        description: "Description",
        descriptionPlaceholder: "Décrivez le produit...",
        price: "Prix",
        pricePlaceholder: "0.00",
        category: "Catégorie",
        categoryPlaceholder: "Sélectionnez une catégorie",
        images: "Images",
        imagesPlaceholder: "URLs des images (une par ligne)",
        stock: "Stock",
        size: "Taille",
        quantity: "Quantité",
        addStock: "Ajouter un stock",
        removeStock: "Retirer",
      },
      validation: {
        nameRequired: "Le nom est requis",
        descriptionRequired: "La description est requise",
        priceRequired: "Le prix est requis",
        priceInvalid: "Le prix doit être un nombre positif",
        categoryRequired: "La catégorie est requise",
        stockRequired: "Au moins un stock est requis",
        imageUrlInvalid: "URL d'image invalide",
      },
      submit: "Créer le produit",
      submitEdit: "Enregistrer les modifications",
      submitting: "Enregistrement en cours...",
      cancel: "Annuler",
      reset: "Réinitialiser",
      success: {
        created: "Le produit {{name}} a été créé avec succès !",
        updated: "Le produit a été modifié avec succès !",
      },
      error: {
        createFailed: "Erreur lors de la création du produit",
        updateFailed: "Erreur lors de la modification du produit",
        loadFailed: "Erreur lors du chargement des données",
        alreadyExists: "Un produit avec ce nom existe déjà dans cette catégorie",
      },
      modifications: {
        title: "Confirmer les modifications",
        subtitle: "Les modifications suivantes seront appliquées :",
        noChanges: "Aucune modification détectée",
        confirm: "Confirmer",
        cancel: "Annuler",
      },
    },

    manageProducts: {
      title: "Gestion des produits",
      subtitle: "Gérez votre catalogue de produits",
      loading: "Chargement des produits...",
      loadingError: "Erreur lors du chargement des produits",
      noProducts: "Aucun produit",
      noProductsMessage: "Commencez par créer votre premier produit.",
      createFirst: "Créer un produit",
      stats: {
        totalProducts: "Total produits",
        totalCategories: "Total catégories",
        lowStock: "Stock faible",
        outOfStock: "Rupture de stock",
      },
      actions: {
        edit: "Modifier",
        delete: "Supprimer",
        viewDetails: "Voir détails",
      },
      delete: {
        title: "Supprimer le produit",
        confirmTitle: "Confirmer la suppression",
        confirmMessage: "Êtes-vous sûr de vouloir supprimer ce produit ?",
        confirmMessageDetails: "{{name}} - {{price}}€",
        permanent: "Cette action est irréversible.",
        confirm: "Supprimer",
        cancel: "Annuler",
        success: "Le produit a été supprimé avec succès",
        error: "Erreur lors de la suppression du produit",
      },
    },
  },

  // ================================================================
  // COURSES - Gestion des Cours
  // ================================================================
  courses: {
    list: {
      title: "Cours",
      allCourses: "Tous les cours",
      myCourses: "Mes cours",
      available: "Cours disponibles",
      enrolled: "Inscrit",
      upcoming: "À venir",
      past: "Passés",
      search: "Rechercher des cours...",
      noCourses: "Aucun cours trouvé",
    },

    details: {
      overview: "Aperçu",
      schedule: "Horaire",
      instructor: "Instructeur",
      participants: "Participants",
      materials: "Matériel",
      enroll: "S'inscrire",
      enrolled: "Inscrit",
      waitlist: "Rejoindre la liste d'attente",
      full: "Cours complet",
      startDate: "Date de début",
      endDate: "Date de fin",
      duration: "Durée",
      level: "Niveau",
      capacity: "Capacité",
      spotsLeft: "{{count}} place restante",
      spotsLeft_plural: "{{count}} places restantes",
    },

    create: {
      title: "Créer un cours",
      basicInfo: "Informations de base",
      schedule: "Horaire",
      pricing: "Tarification",
      advanced: "Paramètres avancés",
      submit: "Créer le cours",
      success: "Cours créé avec succès",
    },

    edit: {
      title: "Modifier le cours",
      submit: "Mettre à jour le cours",
      success: "Cours mis à jour avec succès",
    },

    enrollment: {
      title: "Inscriptions aux cours",
      subtitle: "Inscrivez-vous aux cours disponibles et gérez vos participations",
      enroll: "S'inscrire",
      unenroll: "Se désinscrire",
      enrolled: "✓ Inscrit",
      viewParticipants: "Voir les participants",
      participantsCount: "{{count}} inscrit",
      participantsCount_plural: "{{count}} inscrits",
      loading: "Chargement des cours...",
      loadingError: "Erreur lors du chargement des données.",
      noCourses: "Aucun cours disponible",
      noCoursesMessage: "Il n'y a actuellement aucun cours disponible pour l'inscription.",
      courseNotFound: "Cours introuvable",
      date: "Date",
      time: "Horaire",
      instructor: "Professeur",
      instructors: "Professeurs",
      day: "Jour",
      unknownDate: "Date inconnue",
      success: {
        enrolled: "Inscription au cours du {{date}} réussie",
        unenrolled: "Désinscription du cours du {{date}} réussie",
      },
      error: {
        invalidData: "Utilisateur ou cours invalide.",
        alreadyEnrolled: "Vous êtes déjà inscrit à ce cours.",
        enrollmentFailed: "Erreur lors de l'inscription. Veuillez réessayer.",
        unenrollmentFailed: "Erreur lors de la désinscription. Veuillez réessayer.",
      },
    },

    participants: {
      title: "Gestion des présences",
      subtitle: "Cours du {{date}}",
      loading: "Chargement des participants...",
      loadingError: "Erreur lors du chargement des participants",
      courseNotFound: "Cours introuvable",
      noParticipants: "Aucun participant inscrit",
      noParticipantsMessage: "Il n'y a actuellement aucun participant inscrit à ce cours.",
      stats: {
        total: "Total participants",
        present: "Présents",
        absent: "Absents",
        undefined: "Non définis",
      },
      presence: {
        validate: "Valider présence",
        cancel: "Annuler présence",
        validated: "La présence a été validée avec succès !",
        cancelled: "La présence a été annulée avec succès !",
        error: "Erreur lors de la mise à jour de la présence.",
        present: "Présent",
        absent: "Absent",
        notDefined: "Non défini",
      },
    },

    levels: {
      beginner: "Débutant",
      intermediate: "Intermédiaire",
      advanced: "Avancé",
      expert: "Expert",
      allLevels: "Tous niveaux",
    },

    add: {
      title: "Ajouter un cours",
      titleEdit: "Modifier un cours",
      subtitle: "Créez un nouveau cours pour votre planning",
      subtitleEdit: "Modifiez les informations du cours",
      form: {
        type: "Type de cours",
        typePlaceholder: "Sélectionnez un type",
        day: "Jour de la semaine",
        dayPlaceholder: "Sélectionnez un jour",
        name: "Nom du cours",
        namePlaceholder: "Ex: Judo Avancé",
        startTime: "Heure de début",
        startTimePlaceholder: "HH:MM",
        endTime: "Heure de fin",
        endTimePlaceholder: "HH:MM",
        instructors: "Professeurs",
        instructorsPlaceholder: "Sélectionnez un ou plusieurs professeurs",
        noInstructorSelected: "Aucun professeur sélectionné",
        selectInstructor: "Sélectionner un professeur",
      },
      validation: {
        typeRequired: "Le type de cours est requis",
        dayRequired: "Le jour est requis",
        nameRequired: "Le nom est requis",
        startTimeRequired: "L'heure de début est requise",
        endTimeRequired: "L'heure de fin est requise",
        invalidTimeFormat: "Format d'heure invalide (HH:MM)",
        endTimeBeforeStart: "L'heure de fin doit être après l'heure de début",
        instructorsRequired: "Au moins un professeur est requis",
        allFieldsRequired: "Tous les champs sont obligatoires",
      },
      submit: "Créer le cours",
      submitEdit: "Enregistrer les modifications",
      submitting: "Enregistrement en cours...",
      cancel: "Annuler",
      reset: "Réinitialiser",
      success: {
        created: "Le cours {{type}} du {{day}} a été créé avec succès !",
        updated: "Le cours a été modifié avec succès !",
        redirecting: "Redirection vers la gestion des cours...",
      },
      error: {
        createFailed: "Erreur lors de la création du cours",
        updateFailed: "Erreur lors de la modification du cours",
        loadFailed: "Erreur lors du chargement des données",
        conflict: "Un cours existe déjà le {{day}} de {{startTime}} à {{endTime}}",
        conflictMessage: "Veuillez choisir un autre créneau horaire.",
      },
      modifications: {
        title: "Confirmer les modifications",
        subtitle: "Les modifications suivantes seront appliquées :",
        noChanges: "Aucune modification détectée",
        confirm: "Confirmer",
        cancel: "Annuler",
        type: "Type",
        day: "Jour",
        name: "Nom",
        startTime: "Heure de début",
        endTime: "Heure de fin",
        instructorsAdded: "Professeurs ajoutés",
        instructorsRemoved: "Professeurs retirés",
      },
      days: {
        Monday: "Lundi",
        Tuesday: "Mardi",
        Wednesday: "Mercredi",
        Thursday: "Jeudi",
        Friday: "Vendredi",
        Saturday: "Samedi",
        Sunday: "Dimanche",
      },
    },

    manage: {
      title: "Gestion des cours",
      subtitle: "Gérez le planning des cours et les professeurs",
      loading: "Chargement du planning...",
      loadingError: "Erreur lors du chargement du planning",
      noCourses: "Aucun cours planifié",
      noCoursesMessage: "Commencez par créer votre premier cours.",
      createFirst: "Créer un cours",
      stats: {
        totalCourses: "Total cours",
        totalInstructors: "Total professeurs",
        coursesPerDay: "cours ce jour",
      },
      list: {
        day: "Jour",
        type: "Type",
        schedule: "Horaire",
        instructors: "Professeurs",
        actions: "Actions",
        from: "de",
        to: "à",
      },
      actions: {
        edit: "Modifier",
        delete: "Supprimer",
        dissociate: "Retirer professeur",
        viewDetails: "Voir détails",
      },
      delete: {
        title: "Supprimer le cours",
        confirmTitle: "Confirmer la suppression",
        confirmMessage: "Êtes-vous sûr de vouloir supprimer ce cours ?",
        confirmMessageDetails: "Cours du {{day}} - {{type}} ({{startTime}} - {{endTime}})",
        allOccurrences: "Toutes les occurrences de ce cours récurrent seront supprimées.",
        confirm: "Supprimer",
        cancel: "Annuler",
        success: "Le cours a été supprimé avec succès",
        error: "Erreur lors de la suppression du cours",
      },
      dissociate: {
        title: "Retirer un professeur",
        confirmTitle: "Confirmer le retrait",
        confirmMessage: "Voulez-vous retirer {{instructor}} de ce cours ?",
        courseDetails: "Cours : {{type}} - {{day}} ({{startTime}} - {{endTime}})",
        lastInstructorWarning: "Attention : Dernier professeur",
        lastInstructorMessage: "{{instructor}} est le dernier professeur assigné à ce cours.",
        lastInstructorConsequence: "Le retirer laissera le cours sans professeur.",
        confirmAnyway: "Retirer quand même",
        cancel: "Annuler",
        success: "Le professeur a été retiré avec succès",
        error: "Erreur lors du retrait du professeur",
      },
      group: {
        monday: "Lundi",
        tuesday: "Mardi",
        wednesday: "Mercredi",
        thursday: "Jeudi",
        friday: "Vendredi",
        saturday: "Samedi",
        sunday: "Dimanche",
      },
    },
  },

  // ================================================================
  // USERS - Gestion des Utilisateurs
  // ================================================================
  users: {
    list: {
      title: "Utilisateurs",
      allUsers: "Tous les utilisateurs",
      active: "Actifs",
      inactive: "Inactifs",
      search: "Rechercher des utilisateurs...",
      addUser: "Ajouter un utilisateur",
      noUsers: "Aucun utilisateur trouvé",
    },

    details: {
      info: "Informations utilisateur",
      courses: "Cours inscrits",
      orders: "Historique des commandes",
      activity: "Journal d'activité",
      edit: "Modifier l'utilisateur",
      delete: "Supprimer l'utilisateur",
      activate: "Activer",
      deactivate: "Désactiver",
    },

    create: {
      title: "Ajouter un utilisateur",
      submit: "Créer l'utilisateur",
      success: "Utilisateur créé avec succès",
    },

    edit: {
      title: "Modifier l'utilisateur",
      submit: "Mettre à jour",
      success: "Utilisateur mis à jour avec succès",
    },

    fields: {
      firstName: "Prénom",
      lastName: "Nom",
      email: "Email",
      phone: "Téléphone",
      role: "Rôle",
      status: "Statut",
      joinDate: "Date d'inscription",
      lastLogin: "Dernière connexion",
    },
  },

  // ================================================================
  // MESSAGES - Système de Messagerie
  // ================================================================
  messages: {
    title: "Messages",
    subtitle: "Gérez votre messagerie interne",
    loading: "Chargement des messages...",
    loadingError: "Erreur lors du chargement des messages",

    tabs: {
      received: "Messages reçus",
      read: "Messages lus",
      types: "Types de messages",
      send: "Envoyer un message",
    },

    list: {
      title: "Messages",
      inbox: "Boîte de réception",
      sent: "Envoyés",
      drafts: "Brouillons",
      archived: "Archivés",
      compose: "Nouveau",
      noMessages: "Aucun message",
      unread: "Non lu",
      unreadCount: "{{count}} non lu",
      unreadCount_plural: "{{count}} non lus",
      from: "De",
      to: "À",
      date: "Date",
      subject: "Objet",
    },

    received: {
      title: "Messages non lus",
      noMessages: "Aucun message non lu",
      noMessagesDescription: "Vous avez lu tous vos messages !",
      markAsRead: "Marquer comme lu",
      delete: "Supprimer",
      viewDetails: "Voir les détails",
    },

    read: {
      title: "Messages lus",
      noMessages: "Aucun message lu",
      noMessagesDescription: "Vous n'avez aucun message lu pour le moment.",
      delete: "Supprimer",
      viewDetails: "Voir les détails",
    },

    compose: {
      title: "Nouveau message",
      subtitle: "Envoyer un message aux utilisateurs",
      to: "À",
      toPlaceholder: "Sélectionnez les destinataires",
      subject: "Objet",
      subjectPlaceholder: "Objet du message",
      message: "Message",
      messagePlaceholder: "Votre message...",
      type: "Type de message",
      typePlaceholder: "Sélectionnez un type",
      send: "Envoyer",
      sending: "Envoi en cours...",
      saveDraft: "Enregistrer le brouillon",
      discard: "Abandonner",
      attachments: "Pièces jointes",
      addAttachment: "Ajouter une pièce jointe",
      selectUsers: "Sélectionner les utilisateurs",
      selectedUsers: "{{count}} utilisateur sélectionné",
      selectedUsers_plural: "{{count}} utilisateurs sélectionnés",
      removeUser: "Retirer",
      validation: {
        usersRequired: "Veuillez sélectionner au moins un destinataire",
        typeRequired: "Veuillez sélectionner un type de message",
        subjectRequired: "L'objet est requis",
        contentRequired: "Le contenu est requis",
      },
      success: "Message envoyé avec succès à {{count}} destinataire(s)",
      error: "Erreur lors de l'envoi du message",
    },

    view: {
      reply: "Répondre",
      replyAll: "Répondre à tous",
      forward: "Transférer",
      archive: "Archiver",
      delete: "Supprimer",
      markUnread: "Marquer comme non lu",
      markRead: "Marquer comme lu",
      details: "Détails du message",
      from: "De",
      to: "À",
      date: "Date",
      type: "Type",
      content: "Contenu",
      close: "Fermer",
    },

    delete: {
      title: "Supprimer le message",
      confirmTitle: "Confirmer la suppression",
      confirmMessage: "Êtes-vous sûr de vouloir supprimer ce message ?",
      confirmMessageDetails: "De: {{sender}} - Objet: {{subject}}",
      permanent: "Cette action est irréversible.",
      confirm: "Supprimer",
      cancel: "Annuler",
      success: "Message supprimé avec succès",
      successMarkedRead: "Message marqué comme lu",
      error: "Erreur lors de la suppression du message",
    },

    types: {
      title: "Types de messages",
      subtitle: "Gérez les types de messages disponibles",
      create: "Créer un type",
      edit: "Modifier",
      delete: "Supprimer",
      noTypes: "Aucun type de message",
      noTypesDescription: "Créez votre premier type de message.",
      name: "Nom",
      description: "Description",
      active: "Actif",
      inactive: "Inactif",
      form: {
        name: "Nom du type",
        namePlaceholder: "Ex: Information, Urgent, Rappel",
        description: "Description",
        descriptionPlaceholder: "Description du type de message",
        active: "Actif",
        submit: "Créer le type",
        submitEdit: "Enregistrer",
        cancel: "Annuler",
      },
      validation: {
        nameRequired: "Le nom est requis",
      },
      success: {
        created: "Type de message créé avec succès",
        updated: "Type de message mis à jour avec succès",
        deleted: "Type de message supprimé avec succès",
      },
      error: {
        createFailed: "Erreur lors de la création du type",
        updateFailed: "Erreur lors de la mise à jour du type",
        deleteFailed: "Erreur lors de la suppression du type",
      },
    },

    notifications: {
      newMessage: "Nouveau message de {{sender}}",
      messageSent: "Message envoyé avec succès",
      messageDraft: "Brouillon enregistré",
      messageMarkedRead: "Message marqué comme lu",
      messageDeleted: "Message supprimé",
    },
  },

  // ================================================================
  // NOTIFICATIONS - Système de Notifications
  // ================================================================
  notifications: {
    title: "Notifications",
    subtitle: "Gérez vos notifications et alertes",
    loading: "Chargement des notifications...",
    loadingError: "Erreur lors du chargement des notifications",
    noNotifications: "Aucune notification",
    noNotificationsMessage: "Vous n'avez aucune notification pour le moment.",
    markAsRead: "Marquer comme lu",
    markAllAsRead: "Tout marquer comme lu",
    clear: "Effacer",
    clearAll: "Tout effacer",
    read: "Lu",
    unread: "Non lu",
    types: {
      info: "Information",
      success: "Succès",
      warning: "Avertissement",
      error: "Erreur",
      system: "Système",
    },
  },

  // ================================================================
  // ORDERS - Gestion des Commandes
  // ================================================================
  orders: {
    title: "Gestion des commandes",
    subtitle: "Gérez toutes les commandes du club",
    loading: "Chargement des commandes...",
    loadingError: "Erreur lors du chargement des commandes",

    list: {
      title: "Commandes",
      myOrders: "Mes commandes",
      allOrders: "Toutes les commandes",
      search: "Rechercher des commandes...",
      filter: "Filtrer",
      noOrders: "Aucune commande trouvée",
      noOrdersMessage: "Il n'y a aucune commande pour le moment.",
      totalOrders: "{{count}} commande au total",
      totalOrders_plural: "{{count}} commandes au total",
      filteredOrders: "{{filtered}} / {{total}} commandes",
      lastUpdate: "Dernière MAJ: {{time}}",
    },

    details: {
      title: "Détails de la commande",
      orderNumber: "Commande #{{number}}",
      date: "Date de commande",
      status: "Statut",
      items: "Articles",
      itemsCount: "{{count}} article",
      itemsCount_plural: "{{count}} articles",
      shipping: "Informations de livraison",
      billing: "Informations de facturation",
      payment: "Informations de paiement",
      total: "Total",
      subtotal: "Sous-total",
      invoice: "Télécharger la facture",
      track: "Suivre la livraison",
      customer: "Client",
      unknown: "Inconnu",
    },

    status: {
      pending: "En attente",
      processing: "En cours",
      shipped: "Expédiée",
      delivered: "Livrée",
      cancelled: "Annulée",
      refunded: "Remboursée",
      updateStatus: "Modifier le statut",
      updating: "Mise à jour en cours...",
      updateSuccess: "Commande {{status}}",
      updateSuccessWithStock: "Commande {{status}} ({{count}} stocks mis à jour)",
      updateError: "Erreur lors de la mise à jour",
      serverBusy: "Serveur occupé, veuillez réessayer dans quelques secondes",
    },

    stats: {
      overview: "Aperçu des commandes",
      total: "Total commandes",
      revenue: "Chiffre d'affaires",
      byStatus: "Répartition par statut",
      averageValue: "Valeur moyenne",
      totalRevenue: "Revenu total",
    },

    actions: {
      cancel: "Annuler la commande",
      refund: "Demander un remboursement",
      reorder: "Commander à nouveau",
      confirmCancel: "Êtes-vous sûr de vouloir annuler cette commande ?",
      export: "Exporter",
      refresh: "Rafraîchir",
      viewDetails: "Voir les détails",
      updateStatus: "Modifier le statut",
    },

    filters: {
      searchPlaceholder: "Rechercher par numéro, client, statut...",
      all: "Toutes",
      byStatus: "Par statut",
      byDate: "Par date",
      clear: "Effacer les filtres",
    },

    table: {
      id: "ID",
      orderNumber: "Numéro",
      date: "Date",
      customer: "Client",
      status: "Statut",
      items: "Articles",
      total: "Total",
      actions: "Actions",
      expandDetails: "Développer les détails",
      collapseDetails: "Réduire les détails",
    },
  },

  // ================================================================
  // PAYMENT - Gestion des Paiements
  // ================================================================
  payment: {
    title: "Paiement",
    subtitle: "Sécurisez votre paiement",
    loading: "Chargement du paiement...",
    processing: "Traitement du paiement en cours...",
    verifying: "Vérification de l'accès...",

    security: {
      unauthorized: "Accès non autorisé",
      userMismatch: "Vous tentez d'accéder à une commande qui ne vous appartient pas",
      connectedAs: "Connecté en tant que",
      targetUser: "Utilisateur cible",
      orderId: "ID Commande",
      scheduleId: "ID Échéance",
      backToOrders: "Retour aux commandes",
    },

    form: {
      cardNumber: "Numéro de carte",
      expiryDate: "Date d'expiration",
      cvc: "CVC",
      cardholderName: "Nom du titulaire",
      submit: "Payer {{amount}}",
      submitting: "Paiement en cours...",
    },

    details: {
      amount: "Montant à payer",
      description: "Description",
      orderId: "ID Commande",
      scheduleId: "ID Échéance",
      total: "Total",
    },

    status: {
      pending: "En attente",
      processing: "En cours",
      succeeded: "Réussi",
      failed: "Échoué",
      cancelled: "Annulé",
    },

    success: {
      title: "Paiement réussi !",
      message: "Votre paiement de {{amount}} a été traité avec succès.",
      orderNumber: "Numéro de commande : {{number}}",
      receiptSent: "Un reçu a été envoyé à votre adresse email.",
      backToShop: "Retour à la boutique",
      viewOrders: "Voir mes commandes",
    },

    error: {
      title: "Erreur de paiement",
      message: "Une erreur est survenue lors du traitement de votre paiement.",
      paymentFailed: "Le paiement a échoué. Veuillez réessayer.",
      invalidCard: "Carte invalide",
      insufficientFunds: "Fonds insuffisants",
      cardDeclined: "Carte refusée",
      tryAgain: "Réessayer",
      contactSupport: "Contacter le support",
      generic: "Une erreur est survenue. Veuillez réessayer.",
    },

    confirmation: {
      processing: "Traitement de votre paiement...",
      doNotClose: "Veuillez ne pas fermer cette fenêtre",
      verifying: "Vérification du paiement...",
      almostDone: "Presque terminé...",
    },

    stripe: {
      loading: "Chargement du formulaire de paiement sécurisé...",
      error: "Erreur lors du chargement du formulaire de paiement",
    },
  },

  // ================================================================
  // STATS - Statistiques
  // ================================================================
  stats: {
    title: "Statistiques",
    subtitle: "Analysez les performances de votre centre de fitness",
    loading: "Chargement des statistiques...",
    selectPeriod: "Sélectionner une période",

    dashboard: {
      title: "Tableau de bord",
      subtitle: "Vue d'ensemble de votre centre de fitness",
      overview: "Vue d'ensemble",
      analytics: "Analytiques",
      reports: "Rapports",
      loading: "Chargement du tableau de bord...",
      loadError: "Impossible de charger les données du tableau de bord",
      recentPayments: "Paiements récents (7j)",
      pendingPayments: "Paiements en attente",
      activePlans: "Plans actifs",
      lastPayments: "Derniers paiements",
      overduePayments: "Paiements échus",
      newMembers: "Nouveaux membres",
      paymentsCount: "paiements",
      membersCount: "membres",
      plansCount: "plans",
      dueDate: "Date d'échéance",
      plan: "Plan",
      overdue: "Échu",
      noRecentPayments: "Aucun paiement récent",
      noOverduePayments: "Aucun paiement échu",
      noNewMembers: "Aucun nouveau membre",
      actions: {
        addMember: "Ajouter un membre",
        recordPayment: "Enregistrer un paiement",
        createPlan: "Créer un plan",
      },
    },

    tabs: {
      overview: "Vue d'ensemble",
      members: "Membres",
      attendance: "Fréquentation",
      revenue: "Revenus",
      products: "Produits",
    },

    metrics: {
      totalUsers: "Membres inscrits",
      totalMembers: "Membres inscrits",
      activeUsers: "Utilisateurs actifs",
      totalCourses: "Total cours",
      enrollments: "Inscriptions",
      revenue: "Revenus",
      monthlyRevenue: "Revenus ce mois",
      renewalRate: "Taux de renouvellement",
      orders: "Commandes",
      growth: "Croissance",
      thisMonth: "Ce mois-ci",
      lastMonth: "Mois dernier",
      change: "Variation",
      newMembers: "Nouveaux membres",
      weeklySessions: "Séances cette semaine",
    },

    charts: {
      userGrowth: "Croissance des utilisateurs",
      revenue: "Revenus",
      paymentEvolution: "Évolution des paiements",
      planDistribution: "Répartition par plan",
      membersByGrade: "Membres par grade",
      membersByGender: "Répartition par genre",
      revenueTrend: "Évolution des revenus (12 mois)",
      enrollments: "Inscriptions",
      orders: "Commandes",
      daily: "Quotidien",
      weekly: "Hebdomadaire",
      monthly: "Mensuel",
      yearly: "Annuel",
    },

    members: {
      title: "Statistiques des membres",
      byGrade: "Distribution par grade",
      byGender: "Distribution par genre",
      newMembers: "Nouveaux membres ({{days}} jours)",
      noNewMembers: "Aucun nouveau membre",
    },

    attendance: {
      title: "Statistiques de fréquentation",
      weeklySessions: "Séances de la semaine",
      totalSessions: "Total des séances",
    },

    revenue: {
      title: "Statistiques des revenus",
      monthly: "Revenus ce mois",
      trend: "Évolution des revenus (12 mois)",
    },

    products: {
      title: "Statistiques des produits",
      topProducts: "Top 10 des produits vendus",
      noProducts: "Aucun produit vendu",
      totalSold: "Total des produits vendus",
    },

    table: {
      name: "Nom",
      email: "Email",
      registrationDate: "Date d'inscription",
      plan: "Plan",
      rank: "Rang",
      product: "Produit",
      quantity: "Quantité",
      revenue: "Revenu",
    },

    errors: {
      loadTitle: "Erreur de chargement",
      loadFailed: "Impossible de charger les statistiques. Veuillez réessayer.",
    },
  },

  // ================================================================
  // TEACHERS - Gestion des Professeurs
  // ================================================================
  teachers: {
    // Planning Page (for instructors)
    planning: {
      title: "Mon Planning des Cours",
      subtitle: "Consultez vos cours assignés",
      loading: "Chargement du planning des cours...",
      noCoursesForDay: "Aucun cours le {{day}}",
      coursesCount: "{{count}} cours le {{day}}",

      tabs: {
        planning: "Mes Cours",
        statistics: "Statistiques",
      },

      empty: {
        title: "Aucun cours assigné",
        description:
          "Vous n'avez pas encore de cours assignés. Contactez l'administrateur pour plus d'informations.",
      },

      errors: {
        loadTitle: "Erreur de chargement",
        loadFailed: "Impossible de charger le planning. Veuillez réessayer.",
      },
    },

    // Manage Page (for admins)
    manage: {
      title: "Gestion des professeurs",
      subtitle: "Gérez les professeurs et leurs informations",
      loading: "Chargement des professeurs...",
      searchPlaceholder: "Rechercher un professeur (nom, email, spécialisation)...",
      searchResults: "{{count}} professeur(s) trouvé(s) sur {{total}}",
      inactive: "Inactif",
      email: "Email",
      specialization: "Spécialisation",
      certifications: "Certifications",
      hireDate: "Date d'embauche",
      bio: "Bio",

      tabs: {
        list: "Liste des professeurs",
        add: "Ajouter un professeur",
      },

      empty: {
        noResults: "Aucun résultat",
        noTeachers: "Aucun professeur",
        tryDifferent: "Essayez de modifier votre recherche",
        addFirst: "Aucun professeur n'a encore été ajouté au système",
      },

      form: {
        name: "Nom",
        email: "Email",
        specialization: "Spécialisation",
        specializationPlaceholder: "Ex: Yoga, Pilates, Musculation...",
        certifications: "Certifications",
        certificationsPlaceholder: "Ex: Certifié BPJEPS, Diplôme d'état...",
        bio: "Biographie",
        bioPlaceholder: "Décrivez l'expérience et les compétences du professeur...",
      },

      editModal: {
        title: "Modifier le professeur",
      },

      deleteModal: {
        title: "Confirmer la suppression",
        confirm:
          "Êtes-vous sûr de vouloir supprimer le professeur {{name}} ? Cette action est irréversible.",
      },

      info: {
        addTitle: "Information",
        addDescription:
          "Pour ajouter un professeur, vous devez d'abord créer un compte utilisateur, puis promouvoir cet utilisateur au rôle d'instructeur depuis la page de gestion des utilisateurs.",
      },

      success: {
        created: "Professeur créé avec succès",
        updated: "Professeur mis à jour avec succès",
        deleted: "Professeur supprimé avec succès",
      },

      errors: {
        loadTitle: "Erreur de chargement",
        loadFailed: "Impossible de charger les professeurs. Veuillez réessayer.",
        createFailed: "Erreur lors de la création du professeur",
        updateFailed: "Erreur lors de la mise à jour du professeur",
        deleteFailed: "Erreur lors de la suppression du professeur",
      },
    },

    // Legacy/shared
    list: {
      title: "Professeurs",
      allTeachers: "Tous les professeurs",
      search: "Rechercher des professeurs...",
      addTeacher: "Ajouter un professeur",
      noTeachers: "Aucun professeur trouvé",
    },

    details: {
      bio: "Biographie",
      specializations: "Spécialisations",
      courses: "Cours",
      schedule: "Horaire",
      ratings: "Évaluations",
      reviews: "Avis",
    },

    create: {
      title: "Ajouter un professeur",
      submit: "Créer le professeur",
      success: "Professeur créé avec succès",
    },

    edit: {
      title: "Modifier le professeur",
      submit: "Mettre à jour",
      success: "Professeur mis à jour avec succès",
    },
  },

  // ================================================================
  // ERRORS - Messages d'Erreur
  // ================================================================
  errors: {
    generic: "Une erreur est survenue. Veuillez réessayer.",
    network: "Erreur réseau. Vérifiez votre connexion.",
    notFound: "Page non trouvée",
    unauthorized: "Non autorisé. Veuillez vous connecter.",
    forbidden: "Accès refusé",
    serverError: "Erreur serveur. Veuillez réessayer plus tard.",
    timeout: "Délai d'attente dépassé. Veuillez réessayer.",
    validation: "Erreur de validation. Vérifiez vos données.",

    form: {
      required: "Ce champ est requis",
      email: "Veuillez entrer un email valide",
      phone: "Veuillez entrer un numéro de téléphone valide",
      url: "Veuillez entrer une URL valide",
      number: "Veuillez entrer un nombre valide",
      min: "La valeur minimum est {{min}}",
      max: "La valeur maximum est {{max}}",
      minLength: "La longueur minimum est de {{min}} caractères",
      maxLength: "La longueur maximum est de {{max}} caractères",
      pattern: "Format invalide",
    },

    boundary: {
      title: "Oups ! Une erreur est survenue",
      message: "Nous avons rencontré une erreur inattendue. Notre équipe a été notifiée.",
      reload: "Recharger la page",
      home: "Retour à l'accueil",
      report: "Signaler le problème",
    },
  },

  // ================================================================
  // VALIDATION - Messages de Validation
  // ================================================================
  validation: {
    required: "{{field}} est requis",
    email: "Veuillez entrer une adresse email valide",
    phone: "Veuillez entrer un numéro de téléphone valide",
    minLength: "{{field}} doit contenir au moins {{min}} caractères",
    maxLength: "{{field}} ne doit pas dépasser {{max}} caractères",
    min: "{{field}} doit être au moins {{min}}",
    max: "{{field}} ne doit pas dépasser {{max}}",
    pattern: "Format de {{field}} invalide",
    match: "{{field}} doit correspondre à {{match}}",
    unique: "{{field}} existe déjà",
    alphanumeric: "{{field}} ne doit contenir que des lettres et chiffres",
    url: "Veuillez entrer une URL valide",
    date: "Veuillez entrer une date valide",
    time: "Veuillez entrer une heure valide",
    password: {
      weak: "Mot de passe trop faible",
      strong: "Mot de passe fort",
      requirements:
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre",
    },
  },

  // ================================================================
  // LANGUAGE - Sélecteur de Langue
  // ================================================================
  language: {
    select: "Sélectionner la langue",
    current: "Langue actuelle",
    en: "English",
    fr: "Français",
    nl: "Nederlands",
    changeSuccess: "Langue changée en Français",
  },
};

export default fr;
