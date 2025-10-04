import { z } from 'zod';

// Schéma de validation d'inscription utilisateur renforcé
export const userInscriptionSchema = z.object({
  prenom: z.string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(30, "Le prénom ne peut pas dépasser 30 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]+$/, "Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets")
    .refine(val => !val.startsWith(' ') && !val.endsWith(' '), "Le prénom ne peut pas commencer ou finir par un espace"),
    
  nom: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(30, "Le nom ne peut pas dépasser 30 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]+$/, "Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets")
    .refine(val => !val.startsWith(' ') && !val.endsWith(' '), "Le nom ne peut pas commencer ou finir par un espace"),
    
  nom_utilisateur: z.string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(50, "Le nom d'utilisateur ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-Z0-9._-]+$/, "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, points, tirets et underscores"),
    
  email: z.string()
    .email("Format d'email invalide")
    .max(100, "L'email ne peut pas dépasser 100 caractères")
    .toLowerCase()
    .refine(val => {
      const temporaryDomains = ['10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org', 'yopmail.com'];
      const domain = val.split('@')[1];
      return !temporaryDomains.includes(domain);
    }, "Les adresses email temporaires ne sont pas autorisées"),
    
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe ne peut pas dépasser 128 caractères")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 
      "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial")
    .refine(val => {
      const weakPasswords = ['password', '123456', 'azerty', 'qwerty', 'admin', 'root', 'test', 'user', 'motdepasse', 'password123'];
      return !weakPasswords.includes(val.toLowerCase());
    }, "Ce mot de passe est trop commun"),
    
  // CORRECTION: Renommer 'date' en 'date_naissance' pour correspondre au frontend
  date_naissance: z.string()
    .refine(val => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Date invalide")
    .refine(val => {
      const birthDate = new Date(val);
      const today = new Date();
      
      // Réinitialiser les heures pour une comparaison précise
      today.setHours(23, 59, 59, 999);
      birthDate.setHours(0, 0, 0, 0);
      
      return birthDate < today; // Strictement antérieure à aujourd'hui
    }, "La date de naissance ne peut pas être dans le futur ou aujourd'hui")
    .refine(val => {
      const birthDate = new Date(val);
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 100);
      return birthDate >= minDate;
    }, "Date de naissance trop ancienne (maximum 100 ans)")
    .refine(val => {
      const birthDate = new Date(val);
      const cinqAnsAujourdHui = new Date();
      cinqAnsAujourdHui.setFullYear(cinqAnsAujourdHui.getFullYear() - 5);
      cinqAnsAujourdHui.setHours(23, 59, 59, 999);
      
      return birthDate <= cinqAnsAujourdHui;
    }, "Vous devez avoir au moins 5 ans révolus pour vous inscrire")
    .refine(val => {
      const birthDate = new Date(val);
      return birthDate.getFullYear() >= 1900;
    }, "Date de naissance non valide (minimum année 1900)")
    .refine(val => {
      // Validation supplémentaire: vérifier que l'âge est exactement >= 5 ans
      const birthDate = new Date(val);
      const today = new Date();
      const ageInMs = today.getTime() - birthDate.getTime();
      const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
      
      return ageInYears >= 5;
    }, "L'âge minimum requis est de 5 ans révolus"),
    
  genre_id: z.number()
    .int("L'ID du genre doit être un entier")
    .positive("L'ID du genre doit être positif"),
    
  abonnement_id: z.number()
    .int("L'ID de l'abonnement doit être un entier")
    .positive("L'ID de l'abonnement doit être positif"),
    
  date_inscription: z.string()
    .refine(val => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Date d'inscription invalide"),
    
  status_id: z.number()
    .int("L'ID du statut doit être un entier")
    .positive("L'ID du statut doit être positif"),
    
  grade_id: z.number()
    .int("L'ID du grade doit être un entier")
    .positive("L'ID du grade doit être positif")
});

export interface UserDataSession {
  isFind: boolean;
  message: string;
  dataToStore: {
    id: number | null;
    userId?: string; // Ajouter le userId optionnel
    prenom: string;
    nom: string;
    nom_utilisateur: string;
    email: string;
    date_naissance: string;
    status_id: number;
    grade_id: number | null;
    abonnement_id: number | null;
  };
}
