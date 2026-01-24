/**
 * Tests d'intégration pour le service Cours
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { coursService } from '../cours.service.js';

describe('CoursService - Tests d\'intégration', () => {
  describe('Queries - Cours', () => {
    it('devrait obtenir les cours pour un participant', async () => {
      const cours = await coursService.obtenirCoursPourParticipant(1);
      
      expect(Array.isArray(cours)).toBe(true);
      expect(cours.length).toBeGreaterThan(0);
      expect(cours[0]).toHaveProperty('id');
      expect(cours[0]).toHaveProperty('date_cours');
      expect(cours[0]).toHaveProperty('type_cours');
      expect(cours[0]).toHaveProperty('heure_debut');
      expect(cours[0]).toHaveProperty('heure_fin');
    });

    it('devrait limiter les résultats à 12 cours', async () => {
      const cours = await coursService.obtenirCoursPourParticipant(1);
      expect(cours.length).toBeLessThanOrEqual(12);
    });

    it('devrait obtenir les cours par semaine', async () => {
      const cours = await coursService.obtenirCoursParSemaine(2, 5);
      
      expect(Array.isArray(cours)).toBe(true);
      cours.forEach(c => {
        expect(c).toHaveProperty('date_cours');
        expect(c).toHaveProperty('type_cours');
      });
    });

    it('devrait obtenir tous les cours (admin)', async () => {
      const cours = await coursService.obtenirTousLesCours();
      
      expect(Array.isArray(cours)).toBe(true);
      expect(cours.length).toBeGreaterThan(0);
    });

    it('devrait obtenir les cours inscrits pour un utilisateur', async () => {
      const cours = await coursService.obtenirCoursInscritsParUtilisateur(1);
      
      expect(Array.isArray(cours)).toBe(true);
    });
  });

  describe('Queries - Inscriptions', () => {
    it('devrait obtenir les utilisateurs d\'un cours', async () => {
      const result = await coursService.obtenirUtilisateursParCours(1);
      
      expect(result).toHaveProperty('cours_id', 1);
      expect(result).toHaveProperty('utilisateurs');
      expect(Array.isArray(result.utilisateurs)).toBe(true);
      
      if (result.utilisateurs.length > 0) {
        const user = result.utilisateurs[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('first_name');
        expect(user).toHaveProperty('last_name');
      }
    });

    it('devrait obtenir cours avec utilisateurs', async () => {
      const cours = await coursService.obtenirCoursAvecUtilisateurs(1);
      
      expect(Array.isArray(cours)).toBe(true);
      if (cours.length > 0) {
        expect(cours[0]).toHaveProperty('utilisateurs');
        expect(Array.isArray(cours[0].utilisateurs)).toBe(true);
      }
    });

    it('devrait obtenir les participants d\'un cours', async () => {
      const result = await coursService.obtenirUtilisateursParticipantsParCours(1);
      
      expect(result).toHaveProperty('cours_id');
      expect(result).toHaveProperty('utilisateurs');
    });
  });

  describe('Queries - Cours récurrents', () => {
    it('devrait obtenir tous les jours de cours', async () => {
      const jours = await coursService.obtenirJoursDeCours();
      
      expect(Array.isArray(jours)).toBe(true);
      expect(jours.length).toBeGreaterThan(0);
      
      const jour = jours[0];
      expect(jour).toHaveProperty('id');
      expect(jour).toHaveProperty('type_cours');
      expect(jour).toHaveProperty('jour_semaine');
      expect(jour).toHaveProperty('heure_debut');
      expect(jour).toHaveProperty('heure_fin');
      expect(jour).toHaveProperty('professeurs');
    });

    it('devrait obtenir jours de cours par semaine', async () => {
      const jours = await coursService.obtenirJoursDeCoursParSemaine(5);
      
      expect(Array.isArray(jours)).toBe(true);
    });

    it('devrait obtenir un cours récurrent par ID', async () => {
      const cours = await coursService.obtenirCoursRecurrentParId(1);
      
      expect(cours).toBeDefined();
      if (cours) {
        expect(cours).toHaveProperty('id', 1);
        expect(cours).toHaveProperty('type_cours');
      }
    });

    it('devrait trouver un cours récurrent par critères', async () => {
      const id = await coursService.trouverCoursRecurrent(
        'mardi',
        'Karaté Débutant',
        '18:00',
        '19:30'
      );
      
      expect(id).toBe(1);
    });

    it('devrait retourner null pour un cours inexistant', async () => {
      const id = await coursService.trouverCoursRecurrent(
        'dimanche',
        'Cours Inexistant',
        '00:00',
        '01:00'
      );
      
      expect(id).toBeNull();
    });
  });

  describe('Queries - Statistiques', () => {
    it('devrait obtenir les semaines avec cours', async () => {
      const semaines = await coursService.obtenirSemainesAvecCours(1);
      
      expect(Array.isArray(semaines)).toBe(true);
      semaines.forEach(s => {
        expect(typeof s).toBe('number');
        expect(s).toBeGreaterThan(0);
        expect(s).toBeLessThanOrEqual(53);
      });
    });

    it('devrait obtenir les statistiques de présence d\'un cours', async () => {
      const stats = await coursService.obtenirStatistiquesPresenceCours(1);
      
      expect(stats).toHaveProperty('cours_id', 1);
      expect(stats).toHaveProperty('total_inscrits');
      expect(stats).toHaveProperty('total_presents');
      expect(stats).toHaveProperty('total_absents');
      expect(stats).toHaveProperty('taux_presence');
      
      expect(typeof stats.total_inscrits).toBe('number');
      expect(typeof stats.taux_presence).toBe('number');
      expect(stats.taux_presence).toBeGreaterThanOrEqual(0);
      expect(stats.taux_presence).toBeLessThanOrEqual(100);
    });

    it('devrait obtenir les statistiques de présence d\'un utilisateur', async () => {
      const stats = await coursService.obtenirStatistiquesPresenceUtilisateur(2);
      
      expect(stats).toHaveProperty('utilisateur_id', 2);
      expect(stats).toHaveProperty('total_cours_inscrits');
      expect(stats).toHaveProperty('total_presents');
      expect(stats).toHaveProperty('total_absents');
      expect(stats).toHaveProperty('taux_presence');
      
      expect(typeof stats.taux_presence).toBe('number');
    });
  });

  describe('Mutations - Inscriptions', () => {
    it('devrait vérifier si un utilisateur est inscrit', async () => {
      const result = await coursService.verifierInscriptionUtilisateur(1, 1);
      
      expect(result).toHaveProperty('isBooked');
      expect(result).toHaveProperty('message');
      expect(typeof result.isBooked).toBe('boolean');
    });

    it('devrait inscrire un utilisateur à un cours', async () => {
      const result = await coursService.inscrireUtilisateurAuCours({
        cours_id: 3,
        utilisateur_id: 1
      });
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
    });

    it('devrait empêcher une double inscription', async () => {
      // Première inscription
      await coursService.inscrireUtilisateurAuCours({
        cours_id: 4,
        utilisateur_id: 1
      });
      
      // Tentative de double inscription
      const result = await coursService.inscrireUtilisateurAuCours({
        cours_id: 4,
        utilisateur_id: 1
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('déjà inscrit');
    });

    it('devrait désinscrire un utilisateur', async () => {
      const result = await coursService.desinscrireUtilisateurDuCours({
        cours_id: 1,
        utilisateur_id: 1
      });
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });

    it('devrait valider la présence d\'un utilisateur', async () => {
      const result = await coursService.validerPresenceUtilisateur({
        cours_id: 1,
        utilisateur_id: 2
      });
      
      expect(result).toHaveProperty('success');
      expect(result.message).toContain('validée');
    });

    it('devrait annuler/marquer absent un utilisateur', async () => {
      const result = await coursService.annulerPresenceUtilisateur({
        cours_id: 2,
        utilisateur_id: 2
      });
      
      expect(result).toHaveProperty('success');
      expect(result.message).toContain('Absence');
    });
  });

  describe('Mutations - Cours récurrents', () => {
    it('devrait ajouter un cours récurrent', async () => {
      const result = await coursService.ajouterCoursRecurrent({
        type_cours: 'Aikido Débutant',
        jour_semaine: 'vendredi',
        heure_debut: '19:00',
        heure_fin: '20:30',
        professeurs: ['Karate Sensei']
      });
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      
      if (result.success) {
        expect(result.data).toHaveProperty('cours_recurrent_id');
        expect(result.data).toHaveProperty('occurrences_creees');
      }
    });

    it('devrait rejeter un jour invalide', async () => {
      const result = await coursService.ajouterCoursRecurrent({
        type_cours: 'Test',
        jour_semaine: 'invalid_day',
        heure_debut: '10:00',
        heure_fin: '11:00'
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('invalide');
    });

    it('devrait modifier un cours récurrent', async () => {
      const result = await coursService.modifierCoursRecurrent({
        cours_recurrent_id: 1,
        type_cours: 'Karaté Avancé',
        heure_debut: '18:30'
      });
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });

    it('devrait supprimer un cours récurrent', async () => {
      // Ajouter d'abord un cours
      const ajout = await coursService.ajouterCoursRecurrent({
        type_cours: 'Test Suppression',
        jour_semaine: 'samedi',
        heure_debut: '10:00',
        heure_fin: '11:00'
      });
      
      if (ajout.success && ajout.data) {
        const result = await coursService.supprimerCoursRecurrent(
          ajout.data.cours_recurrent_id
        );
        
        expect(result).toHaveProperty('success');
        expect(result.message).toContain('supprimé');
      }
    });

    it('devrait supprimer un cours récurrent par jour', async () => {
      const result = await coursService.supprimerCoursRecurrentParJour('mercredi');
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });
  });

  describe('Mutations - Professeurs', () => {
    it('devrait associer des professeurs à un cours', async () => {
      const result = await coursService.associerProfesseursAuCoursRecurrent(
        2,
        ['Judo Master']
      );
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });

    it('devrait gérer une liste vide de professeurs', async () => {
      const result = await coursService.associerProfesseursAuCoursRecurrent(1, []);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Aucun');
    });

    it('devrait trouver le cours d\'un professeur', async () => {
      const context = await coursService.trouverCoursAvecProfesseur(
        'Karate Sensei',
        'mardi'
      );
      
      if (context) {
        expect(context).toHaveProperty('type_cours');
        expect(context).toHaveProperty('heure_debut');
        expect(context).toHaveProperty('heure_fin');
      }
    });

    it('devrait supprimer des professeurs d\'un cours', async () => {
      const result = await coursService.supprimerProfesseursParNomEtJour({
        professeurs_noms: ['Taekwondo Coach'],
        jour: 'mercredi',
        cours_context: {
          type_cours: 'Taekwondo Enfants',
          heure_debut: '14:00',
          heure_fin: '15:00'
        }
      });
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });

    it('devrait supprimer des professeurs avec résolution auto', async () => {
      const result = await coursService.supprimerProfesseursAvecResolution(
        ['Karate Sensei'],
        'mardi'
      );
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });
  });

  describe('Cas limites et erreurs', () => {
    it('devrait gérer un cours_id inexistant', async () => {
      const result = await coursService.obtenirUtilisateursParCours(9999);
      
      expect(result).toHaveProperty('utilisateurs');
      expect(result.utilisateurs).toHaveLength(0);
    });

    it('devrait gérer un utilisateur_id inexistant', async () => {
      const cours = await coursService.obtenirCoursPourParticipant(9999);
      
      expect(Array.isArray(cours)).toBe(true);
      expect(cours).toHaveLength(0);
    });

    it('devrait gérer une désinscription d\'un non-inscrit', async () => {
      const result = await coursService.desinscrireUtilisateurDuCours({
        cours_id: 999,
        utilisateur_id: 999
      });
      
      expect(result.success).toBe(false);
    });

    it('devrait gérer une validation de présence sans inscription', async () => {
      const result = await coursService.validerPresenceUtilisateur({
        cours_id: 999,
        utilisateur_id: 999
      });
      
      expect(result.success).toBe(false);
    });
  });
});
