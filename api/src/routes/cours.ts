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
  console.log("Type de data.professeurs:", typeof data.professeurs);
  console.log("Valeur de data.professeurs:", data.professeurs);

  try {
    const client = new Cours();

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

    console.log("Jour normalisé:", jourNormalise);

    // Gestion des professeurs - correction pour gérer les chaînes JSON
    let professeurs = [];
    if (Array.isArray(data.professeurs)) {
      professeurs = data.professeurs;
    } else if (typeof data.professeurs === 'string') {
      try {
        // Tenter de parser si c'est une chaîne JSON
        professeurs = JSON.parse(data.professeurs);
      } catch (parseError) {
        console.error("Erreur lors du parsing des professeurs:", parseError);
        // Si ce n'est pas du JSON valide, traiter comme un seul nom
        professeurs = [data.professeurs];
      }
    } else if (data.professeurs) {
      // Autres cas, convertir en tableau
      professeurs = [data.professeurs];
    }

    console.log("Professeurs traités:", professeurs);

    // On prépare l'objet AjoutCours pour le backend
    const ajoutCours: AjoutCours = {
      nom: data.nom,
      type_cours: data.type_cours,
      jour_semaine: jourNormalise,
      heure_debut: data.heure_debut,
      heure_fin: data.heure_fin,
      professeurs: professeurs
    };

    console.log("Objet ajoutCours envoyé:", ajoutCours);

    await client.ajouterCoursRecurrentAvecProfesseurs(ajoutCours);

    res.status(200).json({ message: 'Cours récurrent ajouté avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du cours récurrent:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du cours récurrent' });
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
    const client = new Cours();
    await client.supprimerJourDeCours(jourNum);

    res.status(200).json({ message: `Cours du ${jourTexte} supprimé avec succès` });
  } catch (error) {
    console.error('Erreur lors de la suppression du cours:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
  }
});

// Endpoint pour retirer un ou plusieurs professeurs d'un cours récurrent (par nom et jour)
router.post('/retirer-professeur', async (req: any, res: any) => {
  const { professeursNoms, jour } = req.body;
  console.log('Données reçues pour retirer un professeur :', req.body);

  if (!Array.isArray(professeursNoms) || professeursNoms.length === 0 || !jour) {
    return res.status(400).json({ message: "professeursNoms (array) et jour requis." });
  }

  try {
    const client = new Cours();
    // Nouvelle méthode à créer dans la classe Cours
    const result = await client.supprimerProfesseursParNomEtJour(professeursNoms, jour);
    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur lors du retrait des professeurs :", error);
    res.status(500).json({ message: "Erreur serveur lors du retrait des professeurs." });
  }
});


router.patch('/modifier', async (req: any, res: any) => {
  let connector: MysqlConnector;
  try {
    const {
      nom,
      type_cours,
      jour,
      heure_debut,
      heure_fin,
      professeurs,
      jour_original,
      type_cours_original,
      heure_debut_original,
      heure_fin_original
    } = req.body;

    console.log("Données reçues pour modification :", req.body);
    connector = MysqlConnector.getInstance();

    // 1. Mapping des jours
    const joursVersNumero: Record<string, number> = {
      'lundi': 1, 'mardi': 2, 'mercredi': 3, 'jeudi': 4,
      'vendredi': 5, 'samedi': 6, 'dimanche': 7
    };

    const joursDeSemaine: Record<string, string> = {
      'Lundi': 'lundi', 'Mardi': 'mardi', 'Mercredi': 'mercredi',
      'Jeudi': 'jeudi', 'Vendredi': 'vendredi', 'Samedi': 'samedi', 'Dimanche': 'dimanche'
    };

    // 2. Normalisation des jours
    const jourOriginalNormalise = joursDeSemaine[jour_original] || jour_original.toLowerCase();
    const jourOriginalNum = joursVersNumero[jourOriginalNormalise];

    if (!jourOriginalNum) {
      throw new Error('Jour original invalide');
    }

    // 3. Récupération du cours récurrent (avec gestion d'erreur)
    const coursRecurrent: any[] = await new Promise<any[]>((resolve, reject) => {
      connector.query(
        `SELECT id FROM cours_recurrent WHERE type_cours = ? AND jour_semaine = ? LIMIT 1`,
        [type_cours_original, jourOriginalNum],
        (error: mysql.MysqlError | null, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });

    if (!coursRecurrent || coursRecurrent.length === 0) {
      throw new Error('Cours récurrent non trouvé');
    }

    const coursRecurrentId = coursRecurrent[0].id;
    console.log("ID du cours récurrent trouvé:", coursRecurrentId);

    // 4. Préparation des champs à modifier
    const updates: { field: string; value: any }[] = [];

    if (type_cours !== type_cours_original) {
      updates.push({ field: 'type_cours', value: type_cours });
    }

    if (jour && jour !== jour_original) {
      const nouveauJourNormalise = joursDeSemaine[jour] || jour.toLowerCase();
      const nouveauJourNum = joursVersNumero[nouveauJourNormalise];
      if (nouveauJourNum) {
        updates.push({ field: 'jour_semaine', value: nouveauJourNum });
      }
    }

    ['heure_debut', 'heure_fin'].forEach(heureType => {
      const originalValue = req.body[`${heureType}_original`];
      const newValue = req.body[heureType];

      if (newValue && newValue !== originalValue) {
        const formattedValue = newValue.length === 5 ? `${newValue}:00` : newValue;
        updates.push({ field: heureType, value: formattedValue });
      }
    });

    // 5. Mise à jour du cours récurrent (si modifications)
    if (updates.length > 0) {
      const updateSql = `
        UPDATE cours_recurrent
        SET ${updates.map(u => `${u.field} = ?`).join(', ')}
        WHERE id = ?
      `;

      const updateValues = updates.map(u => u.value);
      updateValues.push(coursRecurrentId);

      await new Promise<void>((resolve, reject) => {
        connector.query(updateSql, updateValues, (error: mysql.MysqlError | null, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      console.log("Cours récurrent modifié avec succès");
    }

    // 6. Gestion des professeurs (si modifiés)
    if (professeurs && Array.isArray(professeurs)) {
      console.log("Gestion des professeurs:", professeurs);

      // Suppression des associations existantes
      await new Promise<void>((resolve, reject) => {
        connector.query(
          `DELETE FROM cours_recurrent_professeur WHERE cours_recurrent_id = ?`,
          [coursRecurrentId],
          (error: mysql.MysqlError | null, results: any) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          }
        );
      });
      console.log("Anciens professeurs supprimés");

      // Ajout des nouveaux professeurs (en une seule requête)
      if (professeurs.length > 0) {
        // Récupération des IDs des professeurs
        const profIds = await Promise.all(
          professeurs.map(async (profNom: string) => {
            return new Promise<number | null>((resolve, reject) => {
              connector.query(
                `SELECT id FROM professeurs
                 WHERE CONCAT(TRIM(prenom), ' ', TRIM(nom)) = ?
                 AND status_id = 5 LIMIT 1`,
                [profNom.trim()],
                (error: mysql.MysqlError | null, results: any[]) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(results.length > 0 ? results[0].id : null);
                  }
                }
              );
            });
          })
        );

        // Insertion des nouvelles associations (en batch)
        const validProfIds = profIds.filter(id => id !== null);
        if (validProfIds.length > 0) {
          const insertValues = validProfIds.map(profId => [coursRecurrentId, profId]);
          await new Promise<void>((resolve, reject) => {
            connector.query(
              `INSERT INTO cours_recurrent_professeur (cours_recurrent_id, professeur_id)
               VALUES ?`,
              [insertValues],
              (error: mysql.MysqlError | null, results: any) => {
                if (error) {
                  reject(error);
                } else {
                  resolve();
                }
              }
            );
          });
          console.log(`${validProfIds.length} professeurs associés au cours`);
        }
      }
    }

    res.status(200).json({
      isConfirm: true,
      message: "Cours modifié avec succès.",
      coursRecurrentId
    });

  } catch (error) {
    console.error("Erreur lors de la modification du cours :", error);
    res.status(500).json({
      isConfirm: false,
      message: error instanceof Error ? error.message : "Erreur serveur"
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

// Nouvel endpoint pour supprimer un cours spécifique
router.delete('/supprimer-specifique', async (req: any, res: any) => {
  const { jour, type_cours, heure_debut, heure_fin } = req.body;
  
  console.log("Données reçues pour suppression spécifique :", req.body);

  if (!jour || !type_cours || !heure_debut || !heure_fin) {
    return res.status(400).json({ 
      message: 'Tous les champs sont requis : jour, type_cours, heure_debut, heure_fin' 
    });
  }

  const joursDeSemaine: { [key: string]: number } = {
    lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, 
    vendredi: 5, samedi: 6, dimanche: 7
  };

  const jourNum = joursDeSemaine[jour.toLowerCase().trim()];

  if (!jourNum) {
    return res.status(400).json({ 
      message: 'Jour invalide. Veuillez fournir un jour valide (ex: lundi, mardi...)' 
    });
  }

  try {
    const client = new Cours();
    await client.supprimerCoursSpecifique(jourNum, type_cours, heure_debut, heure_fin);

    res.status(200).json({ 
      message: `Cours ${type_cours} du ${jour} de ${heure_debut} à ${heure_fin} supprimé avec succès` 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du cours spécifique:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
  }
});

export default router;
