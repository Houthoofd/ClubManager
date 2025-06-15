import express from 'express';
import { Cours } from '../db/clients/cours/cours.js';
import { 
  CoursData,
  AjoutCours,
  BookResult, 
  datareservationSchema, 
  datannulationSchema, 
  datavalidationSchema, 
  DataInscription, 
  Utilisateur, 
  UtilisateursParCours, 
  DataReservation, 
  DataAnnulation, 
  DataValidation 
} from '@clubmanager/types';
import { z } from 'zod';

const router = express.Router();

router.get('/', async (req: any, res: any) => {
  try {
    const client = new Cours();

    // Récupérer tous les cours
    const cours: CoursData[] = await client.obtenirLesCours();

    if (!cours || cours.length === 0) {
      console.log('Aucun cours trouvé.');
      return res.status(404).json({ message: 'Aucun cours trouvé.' });
    }

    // Ajouter les utilisateurs pour chaque cours
    const coursAvecUtilisateurs: CoursData[] = await Promise.all(
      cours.map(async (cour) => {
        // Récupérer les utilisateurs pour chaque cours
        const utilisateursParCours: UtilisateursParCours = await client.obtenirUtilisateursParCours(cour.id);

        // Extraire la liste des utilisateurs
        const utilisateurs: Utilisateur[] = utilisateursParCours.utilisateurs; // Assure-toi d'extraire uniquement les utilisateurs ici

        // Retourner le cours avec les utilisateurs
        return { ...cour, utilisateurs: utilisateurs || [] }; // Si aucun utilisateur, on retourne un tableau vide
      })
    );

    console.log('Cours récupérés avec utilisateurs:', cours);
    res.status(200).json(cours); // Renvoie les cours avec les utilisateurs
  } catch (error) {
    console.error('Erreur lors de la récupération des cours avec utilisateurs :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des cours et des utilisateurs.' });
  }
});

router.get('/:coursId', async (req: any, res: any) => {
  try {
    const client = new Cours();
    const { coursId } = req.params; // Récupère l'ID du cours depuis l'URL


    // Récupérer les utilisateurs associés à ce cours
    const utilisateursParCours: UtilisateursParCours = await client.obtenirUtilisateursParCours(coursId);

    // Ajouter les utilisateurs aux données du cours
    const coursAvecUtilisateurs = { Cours: utilisateursParCours };

    console.log('Cours récupéré avec utilisateurs:', coursAvecUtilisateurs);
    res.status(200).json(coursAvecUtilisateurs);

  } catch (error) {
    console.error('Erreur lors de la récupération du cours avec utilisateurs :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du cours et des utilisateurs.' });
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
      res.status(400).json({ message: 'Données invalides.', errors: error.errors });
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

router.post('/ajouter', async (req, res) => {
  const data: AjoutCours = req.body;
  console.log(data)
  try {
    const client = new Cours();
    // Insertion du cours récurrent
    await client.ajouterCoursRecurrentAvecProfesseurs(data);

    res.status(200).json({ message: 'Cours récurrent ajouté avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du cours récurrent:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du cours récurrent' });
  }
});

router.delete('/supprimer', async (req:any, res:any) => {
  const joursDeSemaine: { [key: string]: number } = {
    lundi: 2,
    mardi: 3,
    mercredi: 4,
    jeudi: 5,
    vendredi: 6,
    samedi: 7,
    dimanche: 1
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

export default router;