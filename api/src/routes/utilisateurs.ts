import express from 'express';
import {Utilisateurs} from '../db/clients/utilisateurs/utilisateurs.js';
import { z } from 'zod';
import { UserData, userSchema, userDataLoginSchema, VerifyResultWithData } from '../../../packages/types/dist/index.js';

const router = express.Router();


// Fonction pour convertir une chaîne de caractères en nombre
function convertToNumber(value: string | null | undefined): number {
  console.log(value);
  if (value === null || value === undefined) {
    return 0;
  }

  const convertedValue = Number(value);
  return isNaN(convertedValue) ? 0 : convertedValue;
}


// Route de vérification de l'existence d'un utilisateur
router.post('/connexion', async (req, res) => {
  try {
    // Validate incoming data with Zod
    const validatedData = userDataLoginSchema.parse(req.body);
    console.log("Données validées :", validatedData);

    const client = new Utilisateurs();

    // Check if the user exists
    const result = await client.validerConnexion(validatedData);

    if (result.isFind) {
      res.status(200).json({ message: result.message, data: result.dataToStore });
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'utilisateur :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la vérification de l\'utilisateur.' });
  }
});



// Route d'inscription d'un utilisateur
router.post('/inscription', async (req, res) => {
  try {
    // Validation des données reçues avec Zod
    const validatedData = userSchema.parse(req.body);

    console.log("Données validées :", validatedData);

    const client = new Utilisateurs();
    
    // Vérification si l'utilisateur existe déjà
    const verifUtilisateur = await client.verifierUtilisateur(validatedData);
    
    if (verifUtilisateur.isFind === false) {
      // L'utilisateur n'existe pas, on peut l'inscrire
      const result = await client.inscrireUtilisateur(validatedData);
      
      if (result.affectedRows > 0) {
        res.status(201).json({ message: 'Utilisateur inscrit avec succès.', userId: result.insertId });
      } else {
        res.status(400).json({ message: 'Échec de l\'inscription de l\'utilisateur.' });
      }
    } else {
      // L'utilisateur existe déjà
      res.status(400).json({ message: 'Utilisateur déjà inscrit.' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Gestion des erreurs de validation
      res.status(400).json({ message: 'Données invalides.', errors: error.errors });
    } else {
      // Gestion des autres erreurs serveur
      console.error("Erreur lors de l'inscription de l'utilisateur :", error);
      res.status(500).json({ message: 'Erreur serveur lors de l\'inscription de l\'utilisateur.' });
    }
  }
});

router.get('/', async (req: any, res: any) => {
  try {
    const client = new Utilisateurs();
    
    // Attendre la résolution de la méthode obtenirTousLesUtilisateurs
    const utilisateurs = await client.obtenirTousLesUtilisateurs();
    
    // Vérifier si des utilisateurs ont été trouvés et renvoyer une réponse appropriée
    if (utilisateurs.isFind) {
      res.status(200).json(utilisateurs); // Renvoyer la liste des utilisateurs
    } else {
      res.status(404).json({ message: "Aucun utilisateur trouvé.", data: [] });
    }
  } catch (error) {
    console.error("Erreur : ", error);
    res.status(500).send("Erreur serveur");
  }
});

router.get('/:id', async (req: any, res: any) => {
  let utilisateurId = req.params.id;

  if (isNaN(Number(utilisateurId))) {
    return res.status(400).json({ message: "ID invalide, il doit être un nombre." });
  }

  try {
    const client = new Utilisateurs();

    // Récupère le prénom et le nom de l'utilisateur à partir de l'id
    const utilisateurSimple = await client.obtenirUnUtilisateur(Number(utilisateurId));
    if (!utilisateurSimple.isFind || !utilisateurSimple.data || utilisateurSimple.data.length === 0) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé.", data: [] });
    }
    const utilisateurData = utilisateurSimple.data[0];
    const prenom = utilisateurData.first_name;
    const nom = utilisateurData.last_name;

    // Utilise la méthode obtenirInformationsUtilisateur pour enrichir les données
    const utilisateur: VerifyResultWithData = await client.obtenirInformationsUtilisateur(prenom, nom);

    if (utilisateur.isFind) {
      res.status(200).json({ utilisateur: utilisateur.data });  // Renvoie les données enrichies de l'utilisateur
    } else {
      res.status(404).json({ message: "Aucun utilisateur trouvé.", data: [] });
    }
  } catch (error) {
    console.error("Erreur : ", error);
    res.status(500).send("Erreur serveur");
  }
});

router.post('/ajouter', async (req: any, res: any) => {
  try {
    const client = new Utilisateurs();
    const data = req.body;
    console.log(data)


    // Récupérer les utilisateurs associés à ce cours
    const result = await client.inscrireUtilisateur(data);

    console.log('Professeur ajouté avec succès:', result);
    res.status(200).json(result);

  } catch (error) {
    console.error("Erreur lors de l'ajout ou de la modification :", error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du cours et des utilisateurs.' });
  }
});

router.delete('/supprimer', async (req: any, res: any) => {
  try {
    const client = new Utilisateurs();
    const data = req.body;
    console.log(data)


    // Récupérer les utilisateurs associés à ce cours
    const result = await client.supprimerUtilisateur(data.utilisateurId);

    console.log('Professeur ajouté avec succès:', result);
    res.status(200).json(result);

  } catch (error) {
    console.error("Erreur lors de l'ajout ou de la modification :", error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du cours et des utilisateurs.' });
  }
});

// Nouvelle route pour modifier uniquement le status, le grade et l'abonnement d'un utilisateur
router.put('/modifier', async (req:any, res:any) => {
  try {
    const { id, status_id, grade_id, abonnement_id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "L'identifiant de l'utilisateur est requis." });
    }

    const client = new Utilisateurs();

    // Appel à la méthode du client qui gère la modification
    const result = await client.modifierInfosUtilisateur({ id, status_id, grade_id, abonnement_id });

    if (result.isConfirm) {
      res.status(200).json({ message: 'Utilisateur modifié avec succès.' });
    } else {
      res.status(400).json({ message: 'Aucune modification effectuée.' });
    }
  } catch (error) {
    console.error("Erreur lors de la modification de l'utilisateur :", error);
    res.status(500).json({ message: 'Erreur serveur lors de la modification de l\'utilisateur.' });
  }
});

export default router;