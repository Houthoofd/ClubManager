import { Cours } from '../db/clients/cours/cours.js';

export class InscriptionService {
  private coursClient: Cours;

  constructor() {
    this.coursClient = new Cours();
  }

  // Déléguer les méthodes vers le client de cours (qui contient la logique d'inscription)
  async verifierUtilisateur(data: { nom: string; prenom: string; date_naissance: string }) {
    // Pour l'instant, utiliser la méthode de vérification de participant
    try {
      const cours = await this.coursClient.verifierParticipant({ nom: data.nom, prenom: data.prenom });
      return { isFind: cours.length > 0, data: cours };
    } catch (error) {
      return { isFind: false, data: [] };
    }
  }

  async inscrireUtilisateur(userData: any) {
    // Cette méthode devrait être implémentée dans le client cours ou utilisateurs
    // Pour l'instant, retourner un succès factice
    return {
      success: true,
      message: 'Inscription réussie (implémentation temporaire)',
      generatedUserId: `USR${Date.now()}`,
      emailStatus: { sent: false, error: 'Service non encore connecté' }
    };
  }

  async obtenirAbonnements() {
    // Méthode à implémenter pour récupérer les abonnements
    return [];
  }

  async obtenirGenres() {
    // Méthode à implémenter pour récupérer les genres
    return [];
  }
}

// Export de l'instance singleton
export const inscriptionService = new InscriptionService();
