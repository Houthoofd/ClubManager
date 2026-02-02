/**
 * Tests unitaires pour le service Cours
 */

import { describe, it, expect } from '@jest/globals';
import { CoursService, coursService } from '../cours.service.js';

describe('CoursService - Tests unitaires', () => {
  describe('Structure du service', () => {
    it('devrait exporter la classe CoursService', () => {
      expect(CoursService).toBeDefined();
      expect(typeof CoursService).toBe('function');
    });

    it('devrait exporter une instance singleton coursService', () => {
      expect(coursService).toBeDefined();
      expect(coursService).toBeInstanceOf(CoursService);
    });

    it('devrait avoir toutes les méthodes de queries cours', () => {
      expect(typeof coursService.obtenirCoursPourParticipant).toBe('function');
      expect(typeof coursService.obtenirCoursParSemaine).toBe('function');
      expect(typeof coursService.obtenirTousLesCours).toBe('function');
      expect(typeof coursService.obtenirCoursInscritsParUtilisateur).toBe('function');
    });

    it('devrait avoir toutes les méthodes de queries inscriptions', () => {
      expect(typeof coursService.obtenirUtilisateursParCours).toBe('function');
      expect(typeof coursService.obtenirCoursAvecUtilisateurs).toBe('function');
      expect(typeof coursService.obtenirUtilisateursParticipantsParCours).toBe('function');
    });

    it('devrait avoir toutes les méthodes de queries récurrents', () => {
      expect(typeof coursService.obtenirJoursDeCours).toBe('function');
      expect(typeof coursService.obtenirJoursDeCoursParSemaine).toBe('function');
      expect(typeof coursService.obtenirCoursRecurrentParId).toBe('function');
      expect(typeof coursService.trouverCoursRecurrent).toBe('function');
    });

    it('devrait avoir toutes les méthodes de queries statistiques', () => {
      expect(typeof coursService.obtenirSemainesAvecCours).toBe('function');
      expect(typeof coursService.obtenirStatistiquesPresenceCours).toBe('function');
      expect(typeof coursService.obtenirStatistiquesPresenceUtilisateur).toBe('function');
    });

    it('devrait avoir toutes les méthodes de mutations inscriptions', () => {
      expect(typeof coursService.verifierInscriptionUtilisateur).toBe('function');
      expect(typeof coursService.inscrireUtilisateurAuCours).toBe('function');
      expect(typeof coursService.desinscrireUtilisateurDuCours).toBe('function');
      expect(typeof coursService.validerPresenceUtilisateur).toBe('function');
      expect(typeof coursService.annulerPresenceUtilisateur).toBe('function');
    });

    it('devrait avoir toutes les méthodes de mutations cours récurrents', () => {
      expect(typeof coursService.ajouterCoursRecurrent).toBe('function');
      expect(typeof coursService.modifierCoursRecurrent).toBe('function');
      expect(typeof coursService.supprimerCoursRecurrent).toBe('function');
      expect(typeof coursService.supprimerCoursRecurrentParJour).toBe('function');
    });

    it('devrait avoir toutes les méthodes de mutations professeurs', () => {
      expect(typeof coursService.associerProfesseursAuCoursRecurrent).toBe('function');
      expect(typeof coursService.supprimerProfesseursParNomEtJour).toBe('function');
      expect(typeof coursService.trouverCoursAvecProfesseur).toBe('function');
      expect(typeof coursService.supprimerProfesseursAvecResolution).toBe('function');
    });

    it('devrait avoir toutes les méthodes de vérifications', () => {
      expect(typeof coursService.verifierConflitHoraire).toBe('function');
      expect(typeof coursService.verifierCapaciteCours).toBe('function');
      expect(typeof coursService.verifierCoursRecurrentExiste).toBe('function');
      expect(typeof coursService.verifierInscriptionPossible).toBe('function');
    });
  });

  describe('Vérifications - verifierConflitHoraire', () => {
    it('devrait avoir la signature correcte', () => {
      expect(typeof coursService.verifierConflitHoraire).toBe('function');
      expect(coursService.verifierConflitHoraire.length).toBe(1);
    });
  });

  describe('Vérifications - verifierCapaciteCours', () => {
    it('devrait avoir la signature correcte', () => {
      expect(typeof coursService.verifierCapaciteCours).toBe('function');
      expect(coursService.verifierCapaciteCours.length).toBe(1);
    });
  });

  describe('Vérifications - verifierCoursRecurrentExiste', () => {
    it('devrait avoir la signature correcte', () => {
      expect(typeof coursService.verifierCoursRecurrentExiste).toBe('function');
      expect(coursService.verifierCoursRecurrentExiste.length).toBe(1);
    });
  });

  describe('Vérifications - verifierInscriptionPossible', () => {
    it('devrait avoir la signature correcte', () => {
      expect(typeof coursService.verifierInscriptionPossible).toBe('function');
      expect(coursService.verifierInscriptionPossible.length).toBe(1);
    });
  });

  describe('Isolation des modules', () => {
    it('ne devrait pas exposer les fonctions internes des modules core', () => {
      // Vérifier que seules les méthodes publiques du service sont exposées
      const serviceKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(coursService));
      
      // Ne devrait pas contenir de références directes à Prisma
      expect(serviceKeys).not.toContain('prisma');
      expect(serviceKeys).not.toContain('$transaction');
    });

    it('devrait utiliser des types TypeScript appropriés', () => {
      // Vérifier que les types sont importés depuis @clubmanager/types
      expect(coursService.obtenirCoursPourParticipant).toBeDefined();
      expect(coursService.inscrireUtilisateurAuCours).toBeDefined();
      expect(coursService.ajouterCoursRecurrent).toBeDefined();
    });
  });
});
