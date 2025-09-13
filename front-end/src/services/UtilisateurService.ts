import { apiUrl } from '../pages/apiUrl';

export class UtilisateurService {
  static async fetchUserSchema() {
    try {
      const res = await fetch(apiUrl('utilisateurs'));
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du schéma utilisateur :', error);
      return [];
    }
  }

  static async fetchSelectOptions(key: string) {
    const apiName = key.replace('_id', '');
    const pluralApiName = this.pluralize(apiName);
    try {
      const res = await fetch(apiUrl(`informations/${pluralApiName}`));
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des options pour ${key}:`, error);
      throw error;
    }
  }

  static async checkFieldExistence(key: string, value: string) {
    if (!value) return { message: '', exists: false };

    let endpoint = '';
    let body: any = {};

    switch (key) {
      case 'email':
        endpoint = 'verification/verifier-email';
        body = { email: value };
        break;
      case 'nom_utilisateur':
        endpoint = 'verification/verifier-nom-utilisateur';
        body = { nom_utilisateur: value };
        break;
      case 'first_name':
        endpoint = 'verification/verifier-prenom';
        body = { prenom: value };
        break;
      case 'last_name':
        endpoint = 'verification/verifier-nom';
        body = { nom: value };
        break;
      default:
        return { message: '', exists: false };
    }

    try {
      const response = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      console.log(`[${endpoint}]`, result);
      return result;
    } catch (error) {
      console.error('Erreur de vérification:', error);
      return { message: 'Erreur de vérification.', exists: false };
    }
  }

  static async checkEmailUniqueness(email: string): Promise<boolean> {
    if (!email) return false;
    try {
      const response = await fetch(apiUrl('verification/verifier-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      return !result.exists;
    } catch {
      return false;
    }
  }

  static async ajouterUtilisateur(formData: any) {
    try {
      const response = await fetch(apiUrl('utilisateurs/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      return { success: false, data: null };
    }
  }

  static formatLabel(label: string) {
    let formatted = label.replace(/_/g, ' ');
    if (formatted.endsWith(' id')) formatted = formatted.slice(0, -3);
    const map: Record<string, string> = {
      'first name': 'Nom',
      'last name': 'Prénom',
      'date of birth': 'Date de naissance',
    };
    return map[formatted.toLowerCase()] || formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  static pluralize(word: string) {
    const exceptions = ['status'];
    return exceptions.includes(word) ? word : word + 's';
  }

  static initaliserFormData(keys: string[]) {
    const form: any = {};
    keys.forEach((key) => {
      if (key !== 'id') form[key] = '';
    });
    return form;
  }

  static genererColonnes(keys: string[]) {
    return keys
      .filter((key) => key !== 'id')
      .map((key) => ({
        title: this.formatLabel(key),
        dataKey: key,
      }));
  }
}
