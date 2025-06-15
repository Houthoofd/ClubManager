import express from 'express';
import { Magasin } from '../db/clients/magasin/magasin.js';
import { ArticleData, articleDataValidationSchema } from '@clubmanager/types';
import { z } from 'zod';

const router = express.Router();

router.get('/articles', async (req: any, res: any) => {
  try {
    const client = new Magasin();


    // Récupérer les utilisateurs associés à ce cours
    const result = await client.obtenirLesArticles();

    console.log('articles récupèrés avec succès', result);
    res.status(200).json(result);

  } catch (error) {
    console.error('Erreur lors de la récupération des articles :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des articles.' });
  }
});

router.get('/articles/categories', async (req: any, res: any) => {
  try {
    const client = new Magasin();


    // Récupérer les utilisateurs associés à ce cours
    const result = await client.obtenirLesCategories();

    console.log('articles récupèrés avec succès', result);
    res.status(200).json(result);

  } catch (error) {
    console.error('Erreur lors de la récupération des articles :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des articles.' });
  }
});

router.post('/articles/ajouter', async (req: any, res: any) => {
  try {
    const client = new Magasin();

    // Valider les données avec Zod
    const validatedData = articleDataValidationSchema.parse(req.body);

    // Afficher les données validées dans la console
    console.log("Données validées par le schéma Zod : ", JSON.stringify(validatedData));

    // Ajouter l'article en utilisant la méthode client.ajouterArticle
    const result = await client.ajouterArticle(validatedData);

    // Vérification du résultat et renvoi d'un message approprié
    if (result.isConfirm) {
      console.log('Article ajouté avec succès', result);
      return res.status(200).json({
        message: result.message, // Message de succès renvoyé au front
      });
    } else {
      console.error('Erreur lors de l\'ajout de l\'article', result.message);
      return res.status(500).json({
        message: 'Erreur lors de l\'ajout de l\'article.',
        error: result.message, // Message d'erreur renvoyé si l'ajout a échoué
      });
    }

  } catch (error) {
    // Si l'erreur provient de Zod
    if (error instanceof z.ZodError) {
      console.error('Erreur de validation Zod :', error);
      return res.status(400).json({
        message: 'Erreur de validation des données.',
        errors: error.errors, // Les erreurs de validation Zod renvoyées au front
      });
    }

    console.error("Erreur lors de l'ajout de l'article :", error);
    return res.status(500).json({
      message: 'Erreur lors de l\'ajout de l\'article.',
      error: error, // Message d'erreur générique renvoyé au front en cas d'échec
    });
  }
});

router.delete('/articles/:id', async (req:any, res:any) => {
  const articleId = parseInt(req.params.id);
  const client = new Magasin();

  if (isNaN(articleId)) {
    return res.status(400).json({ message: 'ID invalide.' });
  }

  try {
    const result = await client.supprimerArticle(articleId);
    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Erreur lors de la suppression de l’article :', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l’article.' });
  }
});

router.put('/articles/:id', async (req:any, res:any) => {
  const articleId = parseInt(req.params.id);
  const client = new Magasin();

  if (isNaN(articleId)) {
    return res.status(400).json({ message: 'ID invalide.' });
  }

  try {
    const validatedData = articleDataValidationSchema.parse(req.body);
    const result = await client.modifierArticle(articleId, validatedData);

    if (result.isConfirm) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Erreur de validation', errors: error.errors });
    }

    console.error("Erreur lors de la modification :", error);
    res.status(500).json({ message: "Erreur serveur lors de la modification de l'article." });
  }
});

router.post('/commandes/ajouter', async (req:any, res:any) => {
  const client = new Magasin();
  const { utilisateur_id, articles } = req.body;

  if (!utilisateur_id || !Array.isArray(articles) || articles.length === 0) {
    return res.status(400).json({ message: "Données de commande invalides." });
  }

  try {
    const result = await client.creerCommande(utilisateur_id, articles);
    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Erreur lors de la création de la commande :', error);
    res.status(500).json({ message: 'Erreur lors de la création de la commande.' });
  }
});





export default router;