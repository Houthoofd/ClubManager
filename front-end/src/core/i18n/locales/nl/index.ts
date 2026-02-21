/**
 * ====================================================================
 * DUTCH TRANSLATIONS (nl)
 * ====================================================================
 *
 * Volledige vertalingen voor de ClubManager applicatie.
 * Georganiseerd per feature namespace voor onderhoudbaarheid.
 */

export const nl = {
  // ================================================================
  // COMMON - Gedeelde UI-elementen
  // ================================================================
  common: {
    actions: {
      save: 'Opslaan',
      cancel: 'Annuleren',
      delete: 'Verwijderen',
      edit: 'Bewerken',
      create: 'Aanmaken',
      add: 'Toevoegen',
      remove: 'Verwijderen',
      update: 'Bijwerken',
      confirm: 'Bevestigen',
      close: 'Sluiten',
      back: 'Terug',
      next: 'Volgende',
      previous: 'Vorige',
      submit: 'Verzenden',
      search: 'Zoeken',
      filter: 'Filteren',
      export: 'Exporteren',
      import: 'Importeren',
      download: 'Downloaden',
      upload: 'Uploaden',
      print: 'Afdrukken',
      refresh: 'Verversen',
      reset: 'Resetten',
      clear: 'Wissen',
      apply: 'Toepassen',
      view: 'Bekijken',
      details: 'Details',
      manage: 'Beheren',
      configure: 'Configureren',
      settings: 'Instellingen',
    },

    labels: {
      name: 'Naam',
      email: 'E-mail',
      phone: 'Telefoon',
      address: 'Adres',
      city: 'Stad',
      country: 'Land',
      zipCode: 'Postcode',
      description: 'Beschrijving',
      date: 'Datum',
      time: 'Tijd',
      status: 'Status',
      type: 'Type',
      category: 'Categorie',
      price: 'Prijs',
      quantity: 'Aantal',
      total: 'Totaal',
      subtotal: 'Subtotaal',
      tax: 'BTW',
      discount: 'Korting',
      notes: 'Notities',
      actions: 'Acties',
      createdAt: 'Aangemaakt op',
      updatedAt: 'Bijgewerkt op',
      language: 'Taal',
      theme: 'Thema',
      notification: 'Melding',
      notifications: 'Meldingen',
      profile: 'Profiel',
      account: 'Account',
      preferences: 'Voorkeuren',
    },

    status: {
      active: 'Actief',
      inactive: 'Inactief',
      pending: 'In behandeling',
      completed: 'Voltooid',
      cancelled: 'Geannuleerd',
      processing: 'Bezig',
      confirmed: 'Bevestigd',
      rejected: 'Afgewezen',
      draft: 'Concept',
      published: 'Gepubliceerd',
      archived: 'Gearchiveerd',
    },

    messages: {
      loading: 'Laden...',
      saving: 'Opslaan...',
      saved: 'Succesvol opgeslagen',
      error: 'Er is een fout opgetreden',
      success: 'Gelukt',
      noData: 'Geen gegevens beschikbaar',
      noResults: 'Geen resultaten gevonden',
      confirmDelete: 'Weet u zeker dat u dit item wilt verwijderen?',
      deleteSuccess: 'Item succesvol verwijderd',
      updateSuccess: 'Succesvol bijgewerkt',
      createSuccess: 'Succesvol aangemaakt',
      invalidData: 'Ongeldige gegevens',
      requiredField: 'Dit veld is verplicht',
      unsavedChanges: 'U heeft niet-opgeslagen wijzigingen. Wilt u deze pagina verlaten?',
    },

    time: {
      today: 'Vandaag',
      yesterday: 'Gisteren',
      tomorrow: 'Morgen',
      thisWeek: 'Deze week',
      lastWeek: 'Vorige week',
      thisMonth: 'Deze maand',
      lastMonth: 'Vorige maand',
      thisYear: 'Dit jaar',
      custom: 'Aangepast',
    },

    pagination: {
      page: 'Pagina',
      of: 'van',
      itemsPerPage: 'Items per pagina',
      showing: 'Toont',
      to: 'tot',
      items: 'items',
      first: 'Eerste',
      last: 'Laatste',
    },
  },

  // ================================================================
  // NAVIGATION
  // ================================================================
  navigation: {
    menu: {
      home: 'Home',
      dashboard: 'Dashboard',
      shop: 'Winkel',
      courses: 'Cursussen',
      users: 'Gebruikers',
      messages: 'Berichten',
      orders: 'Bestellingen',
      stats: 'Statistieken',
      teachers: 'Docenten',
      settings: 'Instellingen',
      logout: 'Uitloggen',
      profile: 'Mijn profiel',
      cart: 'Winkelwagen',
    },

    breadcrumbs: {
      home: 'Home',
      back: 'Terug',
    },

    footer: {
      copyright: '© {{year}} ClubManager. Alle rechten voorbehouden.',
      version: 'Versie {{version}}',
      privacy: 'Privacybeleid',
      terms: 'Algemene voorwaarden',
      contact: 'Contact',
    },
  },

  // ================================================================
  // AUTH
  // ================================================================
  auth: {
    login: {
      title: 'Inloggen',
      subtitle: 'Welkom terug bij ClubManager',
      email: 'E-mail',
      password: 'Wachtwoord',
      rememberMe: 'Onthoud mij',
      forgotPassword: 'Wachtwoord vergeten?',
      submit: 'Inloggen',
      noAccount: 'Nog geen account?',
      signUp: 'Registreren',
      errors: {
        invalidCredentials: 'Ongeldig e-mailadres of wachtwoord',
        required: 'E-mail en wachtwoord zijn verplicht',
        emailFormat: 'Voer een geldig e-mailadres in',
      },
    },

    register: {
      title: 'Account aanmaken',
      subtitle: 'Registreer vandaag bij ClubManager',
      firstName: 'Voornaam',
      lastName: 'Achternaam',
      email: 'E-mail',
      password: 'Wachtwoord',
      confirmPassword: 'Bevestig wachtwoord',
      phone: 'Telefoonnummer',
      submit: 'Account aanmaken',
      hasAccount: 'Al een account?',
      signIn: 'Inloggen',
      terms: 'Ik ga akkoord met de Algemene voorwaarden en het Privacybeleid',
      errors: {
        passwordMismatch: 'Wachtwoorden komen niet overeen',
        weakPassword: 'Wachtwoord moet minimaal 8 tekens bevatten',
        emailTaken: 'Dit e-mailadres is al geregistreerd',
        termsRequired: 'U moet akkoord gaan met de algemene voorwaarden',
      },
    },

    forgotPassword: {
      title: 'Wachtwoord resetten',
      subtitle: 'Voer uw e-mailadres in om reset-instructies te ontvangen',
      email: 'E-mail',
      submit: 'Reset-link verzenden',
      backToLogin: 'Terug naar inloggen',
      success: 'Reset-link verzonden naar uw e-mailadres',
    },

    profile: {
      title: 'Mijn profiel',
      editProfile: 'Profiel bewerken',
      changePassword: 'Wachtwoord wijzigen',
      personalInfo: 'Persoonlijke informatie',
      contactInfo: 'Contactgegevens',
      preferences: 'Voorkeuren',
      security: 'Beveiliging',
    },

    roles: {
      admin: 'Beheerder',
      teacher: 'Docent',
      student: 'Student',
      member: 'Lid',
      guest: 'Gast',
    },

    permissions: {
      noAccess: 'U heeft geen toegang tot deze pagina',
      contactAdmin: 'Neem contact op met een beheerder als u denkt dat dit een fout is',
    },
  },

  // ================================================================
  // SHOP
  // ================================================================
  shop: {
    products: {
      title: 'Winkel',
      allProducts: 'Alle producten',
      categories: 'Categorieën',
      search: 'Zoek producten...',
      sortBy: 'Sorteer op',
      price: 'Prijs',
      name: 'Naam',
      newest: 'Nieuwste',
      popularity: 'Populariteit',
      inStock: 'Op voorraad',
      outOfStock: 'Niet op voorraad',
      lowStock: 'Beperkte voorraad',
      addToCart: 'In winkelwagen',
      viewDetails: 'Details bekijken',
      noProducts: 'Geen producten gevonden',
    },

    productDetails: {
      description: 'Beschrijving',
      specifications: 'Specificaties',
      reviews: 'Reviews',
      relatedProducts: 'Gerelateerde producten',
      addToCart: 'In winkelwagen',
      quantity: 'Aantal',
      availability: 'Beschikbaarheid',
      sku: 'Artikelnummer',
      category: 'Categorie',
      tags: 'Tags',
    },

    cart: {
      title: 'Winkelwagen',
      empty: 'Uw winkelwagen is leeg',
      continueShopping: 'Verder winkelen',
      checkout: 'Afrekenen',
      subtotal: 'Subtotaal',
      shipping: 'Verzending',
      tax: 'BTW',
      total: 'Totaal',
      remove: 'Verwijderen',
      update: 'Bijwerken',
      quantity: 'Aantal',
      price: 'Prijs',
      itemsCount: '{{count}} item',
      itemsCount_plural: '{{count}} items',
      clearCart: 'Winkelwagen legen',
      confirmClear: 'Weet u zeker dat u uw winkelwagen wilt legen?',
    },

    checkout: {
      title: 'Afrekenen',
      shippingAddress: 'Verzendadres',
      billingAddress: 'Factuuradres',
      sameAsShipping: 'Hetzelfde als verzendadres',
      paymentMethod: 'Betaalmethode',
      creditCard: 'Creditcard',
      paypal: 'PayPal',
      bankTransfer: 'Bankoverschrijving',
      reviewOrder: 'Bestelling controleren',
      placeOrder: 'Bestelling plaatsen',
      orderSummary: 'Besteloverzicht',
      processing: 'Uw bestelling wordt verwerkt...',
      success: 'Bestelling succesvol geplaatst!',
      orderNumber: 'Bestelnummer',
      errors: {
        paymentFailed: 'Betaling mislukt. Probeer het opnieuw.',
        invalidAddress: 'Voer een geldig adres in',
        invalidCard: 'Ongeldige kaartgegevens',
      },
    },

    categories: {
      all: 'Alle categorieën',
      equipment: 'Uitrusting',
      clothing: 'Kleding',
      accessories: 'Accessoires',
      books: 'Boeken',
      digital: 'Digitale producten',
    },
  },

  // ================================================================
  // COURSES
  // ================================================================
  courses: {
    list: {
      title: 'Cursussen',
      allCourses: 'Alle cursussen',
      myCourses: 'Mijn cursussen',
      available: 'Beschikbare cursussen',
      enrolled: 'Ingeschreven',
      upcoming: 'Binnenkort',
      past: 'Afgelopen',
      search: 'Zoek cursussen...',
      noCourses: 'Geen cursussen gevonden',
    },

    details: {
      overview: 'Overzicht',
      schedule: 'Schema',
      instructor: 'Docent',
      participants: 'Deelnemers',
      materials: 'Materialen',
      enroll: 'Inschrijven',
      enrolled: 'Ingeschreven',
      waitlist: 'Op wachtlijst',
      full: 'Vol',
      startDate: 'Startdatum',
      endDate: 'Einddatum',
      duration: 'Duur',
      level: 'Niveau',
      capacity: 'Capaciteit',
      spotsLeft: '{{count}} plaats beschikbaar',
      spotsLeft_plural: '{{count}} plaatsen beschikbaar',
    },

    create: {
      title: 'Cursus aanmaken',
      basicInfo: 'Basisinformatie',
      schedule: 'Schema',
      pricing: 'Prijzen',
      advanced: 'Geavanceerde instellingen',
      submit: 'Cursus aanmaken',
      success: 'Cursus succesvol aangemaakt',
    },

    edit: {
      title: 'Cursus bewerken',
      submit: 'Cursus bijwerken',
      success: 'Cursus succesvol bijgewerkt',
    },

    levels: {
      beginner: 'Beginner',
      intermediate: 'Gemiddeld',
      advanced: 'Gevorderd',
      expert: 'Expert',
      allLevels: 'Alle niveaus',
    },
  },

  // ================================================================
  // USERS
  // ================================================================
  users: {
    list: {
      title: 'Gebruikers',
      allUsers: 'Alle gebruikers',
      active: 'Actief',
      inactive: 'Inactief',
      search: 'Zoek gebruikers...',
      addUser: 'Gebruiker toevoegen',
      noUsers: 'Geen gebruikers gevonden',
    },

    details: {
      info: 'Gebruikersinformatie',
      courses: 'Ingeschreven cursussen',
      orders: 'Bestellingsgeschiedenis',
      activity: 'Activiteitenlog',
      edit: 'Gebruiker bewerken',
      delete: 'Gebruiker verwijderen',
      activate: 'Activeren',
      deactivate: 'Deactiveren',
    },

    create: {
      title: 'Nieuwe gebruiker toevoegen',
      submit: 'Gebruiker aanmaken',
      success: 'Gebruiker succesvol aangemaakt',
    },

    edit: {
      title: 'Gebruiker bewerken',
      submit: 'Gebruiker bijwerken',
      success: 'Gebruiker succesvol bijgewerkt',
    },

    fields: {
      firstName: 'Voornaam',
      lastName: 'Achternaam',
      email: 'E-mail',
      phone: 'Telefoon',
      role: 'Rol',
      status: 'Status',
      joinDate: 'Registratiedatum',
      lastLogin: 'Laatste login',
    },
  },

  // ================================================================
  // MESSAGES
  // ================================================================
  messages: {
    list: {
      title: 'Berichten',
      inbox: 'Inbox',
      sent: 'Verzonden',
      drafts: 'Concepten',
      archived: 'Gearchiveerd',
      compose: 'Nieuw bericht',
      noMessages: 'Geen berichten',
    },

    compose: {
      title: 'Nieuw bericht',
      to: 'Aan',
      subject: 'Onderwerp',
      message: 'Bericht',
      send: 'Verzenden',
      saveDraft: 'Concept opslaan',
      discard: 'Verwijderen',
      attachments: 'Bijlagen',
      addAttachment: 'Bijlage toevoegen',
    },

    view: {
      reply: 'Beantwoorden',
      replyAll: 'Allen beantwoorden',
      forward: 'Doorsturen',
      archive: 'Archiveren',
      delete: 'Verwijderen',
      markUnread: 'Markeren als ongelezen',
      markRead: 'Markeren als gelezen',
    },

    notifications: {
      newMessage: 'Nieuw bericht van {{sender}}',
      messageSent: 'Bericht succesvol verzonden',
      messageDraft: 'Concept opgeslagen',
    },
  },

  // ================================================================
  // ORDERS
  // ================================================================
  orders: {
    list: {
      title: 'Bestellingen',
      myOrders: 'Mijn bestellingen',
      allOrders: 'Alle bestellingen',
      search: 'Zoek bestellingen...',
      noOrders: 'Geen bestellingen gevonden',
    },

    details: {
      title: 'Bestellingsdetails',
      orderNumber: 'Bestelling #{{number}}',
      date: 'Besteldatum',
      status: 'Status',
      items: 'Items',
      shipping: 'Verzendgegevens',
      billing: 'Factuurgegevens',
      payment: 'Betalingsgegevens',
      total: 'Totaal',
      invoice: 'Factuur downloaden',
      track: 'Zending volgen',
    },

    status: {
      pending: 'In behandeling',
      processing: 'Wordt verwerkt',
      shipped: 'Verzonden',
      delivered: 'Afgeleverd',
      cancelled: 'Geannuleerd',
      refunded: 'Terugbetaald',
    },

    actions: {
      cancel: 'Bestelling annuleren',
      refund: 'Terugbetaling aanvragen',
      reorder: 'Opnieuw bestellen',
      confirmCancel: 'Weet u zeker dat u deze bestelling wilt annuleren?',
    },
  },

  // ================================================================
  // STATS
  // ================================================================
  stats: {
    dashboard: {
      title: 'Dashboard',
      overview: 'Overzicht',
      analytics: 'Analytics',
      reports: 'Rapporten',
    },

    metrics: {
      totalUsers: 'Totaal gebruikers',
      activeUsers: 'Actieve gebruikers',
      totalCourses: 'Totaal cursussen',
      enrollments: 'Inschrijvingen',
      revenue: 'Omzet',
      orders: 'Bestellingen',
      growth: 'Groei',
      thisMonth: 'Deze maand',
      lastMonth: 'Vorige maand',
      change: 'Wijziging',
    },

    charts: {
      userGrowth: 'Gebruikersgroei',
      revenue: 'Omzet',
      enrollments: 'Inschrijvingen',
      orders: 'Bestellingen',
      daily: 'Dagelijks',
      weekly: 'Wekelijks',
      monthly: 'Maandelijks',
      yearly: 'Jaarlijks',
    },
  },

  // ================================================================
  // TEACHERS
  // ================================================================
  teachers: {
    list: {
      title: 'Docenten',
      allTeachers: 'Alle docenten',
      search: 'Zoek docenten...',
      addTeacher: 'Docent toevoegen',
      noTeachers: 'Geen docenten gevonden',
    },

    details: {
      bio: 'Biografie',
      specializations: 'Specialisaties',
      courses: 'Cursussen',
      schedule: 'Schema',
      ratings: 'Beoordelingen',
      reviews: 'Reviews',
    },

    create: {
      title: 'Nieuwe docent toevoegen',
      submit: 'Docent aanmaken',
      success: 'Docent succesvol aangemaakt',
    },

    edit: {
      title: 'Docent bewerken',
      submit: 'Docent bijwerken',
      success: 'Docent succesvol bijgewerkt',
    },
  },

  // ================================================================
  // ERRORS
  // ================================================================
  errors: {
    generic: 'Er is een fout opgetreden. Probeer het opnieuw.',
    network: 'Netwerkfout. Controleer uw verbinding.',
    notFound: 'Pagina niet gevonden',
    unauthorized: 'Ongeautoriseerd. Log alstublieft in.',
    forbidden: 'Toegang geweigerd',
    serverError: 'Serverfout. Probeer het later opnieuw.',
    timeout: 'Time-out. Probeer het opnieuw.',
    validation: 'Validatiefout. Controleer uw invoer.',

    form: {
      required: 'Dit veld is verplicht',
      email: 'Voer een geldig e-mailadres in',
      phone: 'Voer een geldig telefoonnummer in',
      url: 'Voer een geldige URL in',
      number: 'Voer een geldig nummer in',
      min: 'Minimumwaarde is {{min}}',
      max: 'Maximumwaarde is {{max}}',
      minLength: 'Minimumlengte is {{min}} tekens',
      maxLength: 'Maximumlengte is {{max}} tekens',
      pattern: 'Ongeldig formaat',
    },

    boundary: {
      title: 'Oeps! Er is iets misgegaan',
      message: 'We hebben een onverwachte fout aangetroffen. Ons team is op de hoogte gebracht.',
      reload: 'Pagina herladen',
      home: 'Naar home',
      report: 'Probleem melden',
    },
  },

  // ================================================================
  // VALIDATION
  // ================================================================
  validation: {
    required: '{{field}} is verplicht',
    email: 'Voer een geldig e-mailadres in',
    phone: 'Voer een geldig telefoonnummer in',
    minLength: '{{field}} moet minimaal {{min}} tekens bevatten',
    maxLength: '{{field}} mag maximaal {{max}} tekens bevatten',
    min: '{{field}} moet minimaal {{min}} zijn',
    max: '{{field}} mag maximaal {{max}} zijn',
    pattern: 'Ongeldig {{field}} formaat',
    match: '{{field}} moet overeenkomen met {{match}}',
    unique: '{{field}} bestaat al',
    alphanumeric: '{{field}} mag alleen letters en cijfers bevatten',
    url: 'Voer een geldige URL in',
    date: 'Voer een geldige datum in',
    time: 'Voer een geldige tijd in',
    password: {
      weak: 'Wachtwoord is te zwak',
      strong: 'Wachtwoord is sterk',
      requirements: 'Wachtwoord moet minimaal 8 tekens bevatten, één hoofdletter, één kleine letter en één cijfer',
    },
  },

  // ================================================================
  // LANGUAGE
  // ================================================================
  language: {
    select: 'Selecteer taal',
    current: 'Huidige taal',
    en: 'English',
    fr: 'Français',
    nl: 'Nederlands',
    changeSuccess: 'Taal gewijzigd naar Nederlands',
  },
};

export default nl;
