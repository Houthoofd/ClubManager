import express from 'express';
import { Request, Response } from 'express';
import { Cours } from '../db/clients/cours/cours.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import MysqlConnector from '../db/connector/mysqlconnector.js';
import mysql from 'mysql';
import { z } from 'zod';
import {
  AjoutCours,
  DataReservation,
  datareservationSchema,
  DataInscription,
  UtilisateursParCours,
  DataAnnulation,
  datannulationSchema,
  DataValidation,
  datavalidationSchema,
  BookResult,
  VerifyResultWithData,
  ConfirmationResult
} from '@clubmanager/types';

const router = express.Router();

// Ajouter l'instance de la classe Cours
const cours = new Cours();


router.post('/participant', async (req: any, res: any) => {
  try {
    const { nom, prenom } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({ message: 'Nom et prénom requis.' });
    }

    const client = new Cours();

    // Récupérer l'ID du participant
    const participantId = await client.obtenirIdParticipantParNomPrenom(nom, prenom);

    // Récupérer les cours du participant
    const cours = await client.obtenirLesCoursPourParticipant(participantId);

    if (!cours || cours.length === 0) {
      return res.status(404).json({ message: 'Aucun cours trouvé pour ce participant.' });
    }

    res.status(200).json(cours);
  } catch (error) {
    console.error('Erreur lors de la récupération des cours du participant :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des cours.' });
  }
});


router.get('/', async (req:any, res:any) => {
  try {
    const client = new Cours();
    const cours = await client.obtenirTousLesCours();

    if (!cours || cours.length === 0) {
      return res.status(404).json({ message: 'Aucun cours à venir trouvé.' });
    }

    res.status(200).json(cours);
  } catch (error) {
    console.error('Erreur lors de la récupération des cours à venir :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des cours.' });
  }
});



router.get('/:coursId', async (req: any, res: any) => {
  try {
    const client = new Cours();
    const { coursId } = req.params;

    // Récupérer les utilisateurs associés à ce cours
    const utilisateursParCours: UtilisateursParCours = await client.obtenirUtilisateursParticipantsParCours(coursId);

    // Réponse structurée
    res.status(200).json({
      success: true,
      data: {
        Cours: utilisateursParCours
      },
      message: 'Cours récupéré avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du cours avec utilisateurs :', error);

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du cours et des utilisateurs.'
    });
  }
});




router.post('/inscription', async (req: any, res: any) => {
  try {
    // Validation des données entrantes
    const validatedData:DataReservation = datareservationSchema.parse(req.body);
    console.log("Données validées :", validatedData);

    const client = new Cours();
    
    // Vérification si l'utilisateur est déjà inscrit
    const verifInscriptionUtilisateur: BookResult = await client.verifierInscriptionUtilisateur(validatedData);
    console.log("Résultat de la vérification de l'utilisateur :", verifInscriptionUtilisateur);

    if (verifInscriptionUtilisateur.isBooked === false) {
      // Vérification de l'ID utilisateur avant l'inscription
      if (!verifInscriptionUtilisateur.data) {
        return res.status(400).json({ message: 'Utilisateur introuvable.' });
      }

      // Si l'utilisateur n'est pas encore inscrit, on procède à l'inscription
      const dataToSend: DataInscription = {
        cours_id: validatedData.cours_id,
        utilisateur_id: verifInscriptionUtilisateur.data.userId, // ID de l'utilisateur trouvé
        status_id: 1
      };

      console.log("Objet dataToSend :", dataToSend);

      // Inscription de l'utilisateur au cours
      const result = await client.inscrireUtilisateurAuCours(dataToSend);
      console.log("Résultat de l'inscription :", result);

      if (result.isConfirm === true) {
        // Utilisateur inscrit avec succès
        res.status(201).json({
          message: 'Utilisateur inscrit avec succès.',
          userId: verifInscriptionUtilisateur.data,
          coursId: validatedData.cours_id
        });
      } else {
        // Erreur d'insertion
        res.status(500).json({ message: 'Erreur lors de l\'inscription de l\'utilisateur au cours.' });
      }

    } else {
      // L'utilisateur est déjà inscrit au cours
      res.status(409).json({ message: 'Utilisateur déjà inscrit au cours.' });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Erreur de validation des données
      res.status(400).json({ message: 'Données invalides.', errors: error });
    } else {
      // Autres erreurs (SQL, serveur, etc.)
      console.error("Erreur lors de l'inscription de l'utilisateur :", error);
      res.status(500).json({ message: 'Erreur serveur lors de l\'inscription de l\'utilisateur.' });
    }
  }
});

router.patch("/inscription/annulation", async (req: any, res: any) => {
  try {
    // Validation des données entrantes
    console.log("annulation" + req.body)
    const validatedData: DataAnnulation = datannulationSchema.parse(req.body);
    console.log("Données validées :", validatedData);

    const client = new Cours();
    const annulationReussie = await client.annulerUtilisateurAuCours(validatedData);

    if (annulationReussie) {
      res.status(200).json({ message: "Présence annulée avec succès." });
    } else {
      res.status(404).json({ message: "Présence non trouvée ou déjà annulée." });
    }
  } catch (error) {
    console.error("Erreur lors de l'annulation :", error);
    res.status(500).json({ message: "Erreur serveur lors de l'annulation de la réservation." });
  }
});

router.patch("/inscription/validation", async (req: any, res: any) => {
  try {
    // Validation des données entrantes
    console.log("validation" + req.body)
    const validatedData: DataValidation = datavalidationSchema.parse(req.body);
    console.log("Données validées :", validatedData);

    const client = new Cours();
    const validationReussie = await client.validerUtilisateurAuCours(validatedData);

    if (validationReussie) {
      res.status(200).json({ message: "Présence validée avec succès." });
    } else {
      res.status(404).json({ message: "Présence non trouvée ou déjà annulée." });
    }
  } catch (error) {
    console.error("Erreur lors de la confirmation de la présence :", error);
    res.status(500).json({ message: "Erreur lors de la confirmation de la présence" });
  }
});





router.delete("/annulation", async (req: any, res: any) => {
  try {
    // Validation des données entrantes
    const validatedData: DataAnnulation = datannulationSchema.parse(req.body);
    console.log("Données validées :", validatedData);

    const client = new Cours();
    const annulationReussie = await client.desinscrireUtilisateurDuCours(validatedData);

    if (annulationReussie) {
      res.status(200).json({ message: "Réservation annulée avec succès." });
    } else {
      res.status(404).json({ message: "Réservation non trouvée ou déjà annulée." });
    }
  } catch (error) {
    console.error("Erreur lors de l'annulation :", error);
    res.status(500).json({ message: "Erreur serveur lors de l'annulation de la réservation." });
  }
});

router.get('/informations/planning', async (req: any, res: any) => {
  try {
    const client = new Cours();
    console.log('Appel pour obtenir les jours de cours');
    const result = await client.obtenirLesJoursDeCours();
    console.log('Résultat des jours de cours:', result); // Log du résultat
    res.status(200).json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des jours de cours :', error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des jours de cours" });
  }
});

router.post('/ajouter', async (req:any, res:any) => {
  const data = req.body;
  console.log("Données reçues complètes:", data);

  try {
    // Mapping des jours pour convertir le nom en jour_semaine
    const joursDeSemaine: { [key: string]: string } = {
      'Lundi': 'lundi',
      'Mardi': 'mardi', 
      'Mercredi': 'mercredi',
      'Jeudi': 'jeudi',
      'Vendredi': 'vendredi',
      'Samedi': 'samedi',
      'Dimanche': 'dimanche'
    };

    // Convertit le jour reçu (ex: "Vendredi") en format attendu par la procédure (ex: "vendredi")
    const jourNormalise = joursDeSemaine[data.jour_semaine];
    if (!jourNormalise) {
      return res.status(400).json({ message: `Jour invalide: ${data.jour_semaine}` });
    }

    // Vérification des conflits d'horaires AVANT d'ajouter
    try {
      const coursExistants = await cours.obtenirLesJoursDeCours();
      const coursConflituels = coursExistants.filter(c => {
        // Vérifier que les heures ne sont pas null avant de faire les comparaisons
        if (!c.heure_debut || !c.heure_fin || !data.heure_debut || !data.heure_fin) {
          return false; // Ignorer les cours avec des heures null
        }
        
        return c.jour.toLowerCase() === jourNormalise &&
        ((data.heure_debut >= c.heure_debut && data.heure_debut < c.heure_fin) ||
         (data.heure_fin > c.heure_debut && data.heure_fin <= c.heure_fin) ||
         (data.heure_debut <= c.heure_debut && data.heure_fin >= c.heure_fin));
      });

      if (coursConflituels.length > 0) {
        const conflits = coursConflituels.map(c => `${c.type_cours} ${c.heure_debut}-${c.heure_fin}`).join(', ');
        return res.status(409).json({ 
          message: `Conflit d'horaire détecté avec: ${conflits}. Impossible d'ajouter le cours.` 
        });
      }
    } catch (verificationError) {
      console.log('Erreur lors de la vérification des conflits:', verificationError);
      // Continuer quand même si la vérification échoue
    }

    // Gestion des professeurs
    let professeurs = [];
    if (Array.isArray(data.professeurs)) {
      professeurs = data.professeurs;
    } else if (typeof data.professeurs === 'string') {
      try {
        professeurs = JSON.parse(data.professeurs);
      } catch (parseError) {
        professeurs = [data.professeurs];
      }
    } else if (data.professeurs) {
      professeurs = [data.professeurs];
    }

    // Utilisation de la nouvelle procédure stockée optimisée
    const ajoutCours: AjoutCours = {
      nom: data.nom || `${data.type_cours} - ${jourNormalise}`,
      type_cours: data.type_cours,
      jour_semaine: jourNormalise,
      heure_debut: data.heure_debut,
      heure_fin: data.heure_fin,
      professeurs: professeurs
    };

    console.log("Utilisation de la procédure optimisée avec:", ajoutCours);
    
    // NOUVELLE MÉTHODE OPTIMISÉE avec procédure stockée
    const result = await cours.ajouterCoursRecurrentAvecProfesseurs(ajoutCours);

    res.status(200).json({ 
      success: true,
      message: result.message || 'Cours récurrent ajouté avec succès',
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du cours récurrent:', error);
    
    // Gestion spécifique de l'erreur de clé étrangère
    if (error instanceof Error && error.message.includes('ER_NO_REFERENCED_ROW_2')) {
      res.status(400).json({ 
        message: 'Un ou plusieurs professeurs spécifiés n\'existent pas en base de données. Veuillez vérifier les noms des professeurs.',
        details: 'Erreur de référence de clé étrangère - professeurs introuvables'
      });
    } else {
      res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du cours récurrent' });
    }
  }
});

// PATCH - Modifier un cours récurrent (utilise la nouvelle procédure optimisée)
router.patch('/modifier', async (req: any, res: any) => {
  try {
    console.log('Données reçues pour modification :', req.body);
    
    const { 
      nom, type_cours, jour, heure_debut, heure_fin, professeurs,
      jour_original, type_cours_original, heure_debut_original, heure_fin_original 
    } = req.body;

    if (!type_cours || !jour || !heure_debut || !heure_fin || !professeurs) {
      return res.status(400).json({
        error: 'Paramètres manquants pour la modification'
      });
    }

    try {
      // Obtenir l'ID du cours récurrent basé sur les données originales
      const coursRecurrentId = await cours.obtenirIdCoursRecurrent(
        jour_original || jour, 
        type_cours_original || type_cours, 
        heure_debut_original || heure_debut, 
        heure_fin_original || heure_fin
      );
      
      console.log('ID du cours récurrent trouvé:', coursRecurrentId);

      // Mapping des jours
      const joursDeSemaine: { [key: string]: string } = {
        'Lundi': 'lundi', 'Mardi': 'mardi', 'Mercredi': 'mercredi',
        'Jeudi': 'jeudi', 'Vendredi': 'vendredi', 'Samedi': 'samedi', 'Dimanche': 'dimanche'
      };

      const jourNormalise = joursDeSemaine[jour] || jour.toLowerCase();

      // NOUVELLE MÉTHODE OPTIMISÉE avec procédure stockée
      const result = await cours.modifierCoursRecurrentAvecProfesseurs({
        cours_recurrent_id: coursRecurrentId,
        type_cours,
        jour_semaine: jourNormalise,
        heure_debut,
        heure_fin,
        professeurs
      });

      console.log('Résultat modification cours:', result);

      res.status(200).json({
        success: true,
        message: result.message || 'Cours modifié avec succès',
        data: result
      });
    } catch (error: any) {
      console.error('Erreur lors de la modification du cours :', error);
      res.status(500).json({
        error: 'Erreur lors de la modification du cours',
        details: error.message
      });
    }
  } catch (error: any) {
    console.error('Erreur générale lors de la modification :', error);
    res.status(500).json({
      error: 'Erreur générale lors de la modification',
      details: error.message
    });
  }
});

// Nouveau endpoint pour récupérer les cours à venir où l'utilisateur est inscrit
router.get('/inscriptions/utilisateur/:userId', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const client = new Cours();
    const cours = await client.obtenirCoursInscritsParUtilisateur(Number(userId));
    if (!cours || cours.length === 0) {
      return res.status(404).json({ message: 'Aucun cours trouvé pour cet utilisateur.' });
    }
    res.status(200).json(cours);
  } catch (error) {
    console.error('Erreur lors de la récupération des cours inscrits de l\'utilisateur :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des cours inscrits.' });
  }
});

router.delete('/supprimer', async (req:any, res:any) => {
  const joursDeSemaine: { [key: string]: number } = {
    lundi: 1,
    mardi: 2,
    mercredi: 3,
    jeudi: 4,
    vendredi: 5,
    samedi: 6,
    dimanche: 7
  };

  const jourRecu = req.body;
  console.log("Body reçu :", req.body);

  const jourTexte = jourRecu.jourSemaine;
  const jourNum = joursDeSemaine[jourTexte?.toLowerCase().trim()];

  if (!jourNum) {
    return res.status(400).json({ message: 'Jour invalide. Veuillez fournir un jour valide (ex: lundi, mardi...)' });
  }

  try {
    const result = await cours.supprimerJourDeCours(jourNum);
    res.status(200).json({ 
      success: true,
      message: result.message || `Cours du ${jourTexte} supprimé avec succès` 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du cours:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
  }
});

// Endpoint pour retirer un ou plusieurs professeurs d'un cours récurrent (par nom et jour)
router.post('/retirer-professeur', async (req: any, res: any) => {
  const { professeursNoms, jour, type_cours, heure_debut, heure_fin } = req.body;
  console.log('Données reçues pour retirer un professeur :', req.body);

  // Validation plus stricte des données d'entrée
  if (!Array.isArray(professeursNoms) || professeursNoms.length === 0 || !jour) {
    return res.status(400).json({ message: "professeursNoms (array) et jour requis." });
  }

  // Vérifier que les noms de professeurs ne sont pas null/undefined/vides
  const professeursValides = professeursNoms.filter(nom => nom && typeof nom === 'string' && nom.trim() !== '');
  
  if (professeursValides.length === 0) {
    console.error('❌ Aucun nom de professeur valide dans:', professeursNoms);
    return res.status(400).json({ 
      message: "Aucun nom de professeur valide fourni. Noms reçus: " + JSON.stringify(professeursNoms) 
    });
  }

  if (professeursValides.length !== professeursNoms.length) {
    console.warn('⚠️ Certains noms de professeurs étaient invalides:', {
      original: professeursNoms,
      valides: professeursValides
    });
  }

  try {
    // Construire le contexte avec toutes les informations disponibles
    const coursContext = {
      type_cours,
      heure_debut,
      heure_fin
    };

    console.log('🎯 Contexte utilisé pour la dissociation:', coursContext);
    console.log('🎯 Professeurs valides à dissocier:', professeursValides);

    // Si on a des informations précises (type, heures), utiliser la méthode directe
    if (type_cours && heure_debut && heure_fin) {
      console.log('✅ Utilisation de la méthode directe avec contexte complet');
      const result = await cours.supprimerProfesseursParNomEtJour(professeursValides, jour, coursContext);
      
      if (result.isConfirm) {
        res.status(200).json({
          success: true,
          message: result.message || `${professeursValides.length} professeur(s) retiré(s) avec succès`,
          data: result
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message
        });
      }
    } else {
      console.log('⚠️ Utilisation de la méthode avec résolution automatique');
      // Utiliser la résolution automatique si le contexte est incomplet
      const result = await cours.supprimerProfesseursParNomEtJourAvecResolution(professeursValides, jour, coursContext);
      
      if (result.isConfirm) {
        res.status(200).json({
          success: true,
          message: result.message || `${professeursValides.length} professeur(s) retiré(s) avec succès`,
          data: result
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message
        });
      }
    }
  } catch (error) {
    console.error("Erreur lors du retrait des professeurs :", error);
    res.status(500).json({ message: "Erreur serveur lors du retrait des professeurs." });
  }
});

export default router;