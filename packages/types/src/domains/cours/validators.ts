/**
 * Validators Zod pour le module Cours
 * ✅ Centralisés dans @clubmanager/types
 *
 * @package @clubmanager/types
 */

import { z } from 'zod';

// ============================================
// ENUMS & CONSTANTES
// ============================================

export const JourSemaineEnum = z.enum([
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
]);

export type JourSemaine = z.infer<typeof JourSemaineEnum>;

// ============================================
// SCHEMAS DE BASE
// ============================================

/**
 * Schema pour l'heure (format HH:MM ou HH:MM:SS)
 */
export const HeureSchema = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Format d\'heure invalide. Utilisez HH:MM ou HH:MM:SS');

/**
 * Schema pour la date (format YYYY-MM-DD)
 */
export const DateCoursSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide. Utilisez YYYY-MM-DD')
  .refine((date) => {
    const dateCours = new Date(date);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    return dateCours >= aujourdhui;
  }, { message: 'La date du cours ne peut pas être dans le passé' });

// ============================================
// SCHEMAS POUR AJOUTER/MODIFIER COURS
// ============================================

/**
 * Schema pour ajouter un cours récurrent
 */
export const ajouterCoursInputSchema = z.object({
  nom: z.string().min(2, 'Le nom du cours doit contenir au moins 2 caractères').max(255, 'Le nom du cours ne peut pas dépasser 255 caractères'),
  type_cours: z.string().min(2, 'Le type de cours est requis'),
  jour_semaine: JourSemaineEnum,
  heure_debut: HeureSchema,
  heure_fin: HeureSchema,
  professeurs: z.array(z.string()).optional().default([]),
  places_max: z.number().int().positive('Le nombre de places doit être positif').optional(),
}).refine((data) => {
  // Validation que heure_fin est après heure_debut
  const [hDebut, mDebut] = data.heure_debut.split(':').map(Number);
  const [hFin, mFin] = data.heure_fin.split(':').map(Number);
  const minutesDebut = hDebut * 60 + mDebut;
  const minutesFin = hFin * 60 + mFin;
  return minutesFin > minutesDebut;
}, { message: 'L\'heure de fin doit être après l\'heure de début', path: ['heure_fin'] });

/**
 * Schema pour modifier un cours récurrent
 */
export const modifierCoursInputSchema = z.object({
  nom: z.string().min(2).max(255).optional(),
  type_cours: z.string().min(2).optional(),
  jour_semaine: JourSemaineEnum.optional(),
  heure_debut: HeureSchema.optional(),
  heure_fin: HeureSchema.optional(),
  professeurs: z.array(z.string()).optional(),
  places_max: z.number().int().positive().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni pour la mise à jour',
});

// ============================================
// SCHEMAS POUR INSCRIPTIONS
// ============================================

/**
 * Schema pour inscrire un utilisateur
 */
export const inscrireUtilisateurInputSchema = z.object({
  utilisateur_nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  utilisateur_prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  cours_id: z.number().int().positive('ID de cours invalide'),
});

/**
 * Schema pour désinscrire un utilisateur
 */
export const desinscrireUtilisateurInputSchema = z.object({
  utilisateur_id: z.number().int().positive('ID utilisateur invalide'),
  cours_id: z.number().int().positive('ID de cours invalide'),
});

/**
 * Schema pour valider/annuler présence
 */
export const presenceInputSchema = z.object({
  utilisateur_id: z.number().int().positive('ID utilisateur invalide'),
  cours_id: z.number().int().positive('ID de cours invalide'),
});

/**
 * Schema pour retirer un professeur
 */
export const retirerProfesseurInputSchema = z.object({
  cours_recurrent_id: z.number().int().positive('ID de cours récurrent invalide'),
  professeur_id: z.number().int().positive('ID professeur invalide'),
});

// ============================================
// SCHEMAS POUR QUERIES
// ============================================

/**
 * Schema pour obtenir un cours par ID
 */
export const coursIdSchema = z.object({
  coursId: z.number().int().positive('ID de cours invalide'),
});

/**
 * Schema pour obtenir les cours d'un utilisateur
 */
export const utilisateurIdSchema = z.object({
  utilisateurId: z.number().int().positive('ID utilisateur invalide'),
});

// ============================================
// TYPES EXPORTÉS
// ============================================

export type AjouterCoursInput = z.infer<typeof ajouterCoursInputSchema>;
export type ModifierCoursInput = z.infer<typeof modifierCoursInputSchema>;
export type InscrireUtilisateurInput = z.infer<typeof inscrireUtilisateurInputSchema>;
export type DesinscrireUtilisateurInput = z.infer<typeof desinscrireUtilisateurInputSchema>;
export type PresenceInput = z.infer<typeof presenceInputSchema>;
export type RetirerProfesseurInput = z.infer<typeof retirerProfesseurInputSchema>;

// ============================================
// EXPORTS GROUPÉS
// ============================================

export const coursValidators = {
  ajouterCours: ajouterCoursInputSchema,
  modifierCours: modifierCoursInputSchema,
  inscrireUtilisateur: inscrireUtilisateurInputSchema,
  desinscrireUtilisateur: desinscrireUtilisateurInputSchema,
  presence: presenceInputSchema,
  retirerProfesseur: retirerProfesseurInputSchema,
  coursId: coursIdSchema,
  utilisateurId: utilisateurIdSchema,
  jourSemaine: JourSemaineEnum,
  heure: HeureSchema,
  dateCours: DateCoursSchema,
};
