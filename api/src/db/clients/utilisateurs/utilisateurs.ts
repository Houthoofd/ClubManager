/**
 * Stub/Mock pour l'ancienne classe Utilisateurs
 * Compatibilité avec les anciens tests REST
 *
 * NOTE: Cette classe est un stub pour maintenir la compatibilité avec les anciens tests.
 * Les nouveaux tests doivent utiliser GraphQL directement.
 */

export class Utilisateurs {
  constructor() {
    // Stub constructor
  }

  async obtenirTousLesUtilisateurs() {
    return {
      isFind: true,
      message: "Stub: Utilisateurs récupérés",
      data: [],
    };
  }

  async obtenirUnUtilisateur(id: number) {
    return {
      isFind: false,
      message: "Stub: Utilisateur non trouvé",
      data: [],
    };
  }

  async obtenirTous() {
    return [];
  }

  async obtenirParId(id: number) {
    return null;
  }

  async verifierUtilisateurExiste(data: any) {
    return undefined;
  }

  async inscrireUtilisateur(data: any) {
    return {
      userId: 1,
      generatedUserId: "stub_user",
      message: "Stub: Inscription simulée",
    };
  }

  async validerConnexionParUserId(data: any) {
    return {
      isFind: false,
      message: "Stub: Connexion non implémentée",
      dataToStore: null,
    };
  }

  async validerConnexion(data: any) {
    return {
      isFind: false,
      message: "Stub: Connexion non implémentée",
      dataToStore: null,
    };
  }

  async mettreAJour(id: number, data: any) {
    return {
      message: "Stub: Mise à jour simulée",
    };
  }

  async supprimer(id: number) {
    return {
      message: "Stub: Suppression simulée",
    };
  }

  async supprimerSoft(id: number) {
    return {
      message: "Stub: Suppression soft simulée",
    };
  }

  async obtenirStatistiques() {
    return {
      totalUtilisateurs: 0,
      utilisateursActifs: 0,
      utilisateursInactifs: 0,
    };
  }
}
