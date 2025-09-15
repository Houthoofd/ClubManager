const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  async login(email: string, password: string) {
    // Vérifie que la route /auth/login existe bien côté back (ce qui est le cas dans ton fichier auth.ts)
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
      this.token = data.data.token;
      localStorage.setItem('authToken', this.token!);
      localStorage.setItem('userData', JSON.stringify(data.data));
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
    return {
      Authorization: `Bearer ${token}`, // Inclure le jeton dans les en-têtes
      'Content-Type': 'application/json',
    };
  }
}

export default new AuthService();
