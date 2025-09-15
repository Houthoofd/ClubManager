const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      this.token = data.data.token; // Récupérer le jeton depuis la réponse JSON
      if (!this.token) {
        throw new Error('Jeton non fourni par le serveur.');
      }
      localStorage.setItem('authToken', this.token); // Enregistrer le jeton dans le localStorage
      localStorage.setItem('userData', JSON.stringify(data.data.user)); // Enregistrer les données utilisateur
      console.log('Jeton enregistré dans le localStorage:', this.token);
    }

    return data;
  }

  async logout() {
    // Vérifie que la route /auth/logout existe bien côté back (ce qui est le cas dans ton fichier auth.ts)
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');

    return response.json();
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('authToken'); // Récupérer le jeton depuis le localStorage
    if (!token) {
      console.error('Aucun jeton trouvé dans le localStorage.');
      throw new Error('Jeton d\'authentification manquant. Veuillez vous reconnecter.');
    }
    return {
      Authorization: `Bearer ${token}`, // Inclure le jeton dans les en-têtes
      'Content-Type': 'application/json',
    };
  }
}

export default new AuthService();
