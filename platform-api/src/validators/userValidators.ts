import { z } from 'zod';

// Import du schéma depuis le package types
// export { userInscriptionSchema } from '@clubmanager/types';

// Temporarily define schema locally until package is available
export const userInscriptionSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  genderId: z.number().optional(),
});

// Autres validateurs si nécessaire
export const userLoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
});

export const userUpdateSchema = z.object({
  prenom: z.string().min(2, 'Prénom requis'),
  nom: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide').optional(),
  date_naissance: z.string().optional()
});
