import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import {
  getParticipantCours,
  getAllCours,
  getCoursUtilisateurs,
  inscrireUtilisateur,
  annulerPresence,
  validerPresence,
  desinscrireUtilisateur,
  getPlanning,
  ajouterCours,
  modifierCours,
  getUtilisateurInscriptions,
  supprimerJour,
  retirerProfesseur
} from './core/index.js';

const router = express.Router();

// Routes publiques ou avec vérification spécifique
router.post('/participant', getParticipantCours);
router.get('/', getAllCours);
router.get('/informations/planning', getPlanning);
router.get('/inscriptions/utilisateur/:userId', getUtilisateurInscriptions);
router.get('/:coursId', getCoursUtilisateurs);

// Routes d'inscription et gestion des présences
router.post('/inscription', inscrireUtilisateur);
router.patch('/inscription/annulation', annulerPresence);
router.patch('/inscription/validation', validerPresence);
router.delete('/annulation', desinscrireUtilisateur);

// Routes de gestion des cours (admin)
router.post('/ajouter', ajouterCours);
router.patch('/modifier', modifierCours);
router.delete('/supprimer', supprimerJour);

// Routes de gestion des professeurs
router.post('/retirer-professeur', retirerProfesseur);

export default router;
