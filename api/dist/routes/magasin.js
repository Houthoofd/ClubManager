import express from 'express';
import { Magasin } from '../db/clients/magasin/magasin.js';
import { articleCreationSchema, articleDataValidationSchema, nouvelleCommandeSchema } from '@clubmanager/types';
import { z } from 'zod';
const router = express.Router();
router.get('/articles', async (req, res) => {
    try {
        const client = new Magasin();
        // Récupérer les utilisateurs associés à ce cours
        const result = await client.obtenirArticlesParCategories();
        console.log('articles récupèrés avec succès', result);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Erreur lors de la récupération des articles :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des articles.' });
    }
});
router.get('/articles/categories', async (req, res) => {
    try {
        const client = new Magasin();
        // Récupérer les utilisateurs associés à ce cours
        const result = await client.obtenirLesCategories();
        console.log('articles récupèrés avec succès', result);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Erreur lors de la récupération des articles :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des articles.' });
    }
});
router.post('/articles/ajouter', async (req, res) => {
    try {
        const client = new Magasin();
        // ✅ Valider les données avec le schéma pour la création (sans id)
        const validatedData = articleCreationSchema.parse(req.body);
        console.log("Données validées par le schéma Zod : ", JSON.stringify(validatedData));
        const result = await client.ajouterArticle(validatedData);
        if (result.isConfirm) {
            console.log('Article ajouté avec succès', result);
            return res.status(200).json({
                message: result.message,
            });
        }
        else {
            console.error('Erreur lors de l\'ajout de l\'article', result.message);
            return res.status(500).json({
                message: 'Erreur lors de l\'ajout de l\'article.',
                error: result.message,
            });
        }
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Erreur de validation Zod :', error);
            return res.status(400).json({
                message: 'Erreur de validation des données.',
                errors: error.errors,
            });
        }
        console.error("Erreur lors de l'ajout de l'article :", error);
        return res.status(500).json({
            message: 'Erreur lors de l\'ajout de l\'article.',
            error: error,
        });
    }
});
router.delete('/articles/:id', async (req, res) => {
    const articleId = parseInt(req.params.id);
    const client = new Magasin();
    if (isNaN(articleId)) {
        return res.status(400).json({ message: 'ID invalide.' });
    }
    try {
        const result = await client.supprimerArticle(articleId);
        res.status(200).json({ message: result.message });
    }
    catch (error) {
        console.error('Erreur lors de la suppression de l’article :', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l’article.' });
    }
});
router.put('/articles/:id', async (req, res) => {
    const articleId = parseInt(req.params.id);
    const client = new Magasin();
    if (isNaN(articleId)) {
        return res.status(400).json({ message: 'ID invalide.' });
    }
    try {
        // Valide les données sans l'id (car id vient de req.params)
        const validatedData = articleDataValidationSchema.parse(req.body);
        // Puis passe l'id séparément
        const result = await client.modifierArticle(articleId, validatedData);
        if (result.isConfirm) {
            res.status(200).json({ message: result.message });
        }
        else {
            res.status(500).json({ message: result.message });
        }
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Erreur de validation', errors: error.errors });
        }
        console.error("Erreur lors de la modification :", error);
        res.status(500).json({ message: "Erreur serveur lors de la modification de l'article." });
    }
});
router.post('/commandes/ajouter', async (req, res) => {
    try {
        console.log('Corps reçu:', req.body); // Ajoute ça pour debugger
        const data = nouvelleCommandeSchema.parse(req.body);
        const { utilisateur_id, articles, statut, date, total } = data;
        const client = new Magasin();
        const result = await client.creerCommande(utilisateur_id, articles, total ?? 0, date ?? new Date().toISOString(), statut);
        res.status(200).json({ message: result.message });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Données de commande invalides.",
                errors: error.errors,
            });
        }
        console.error('Erreur lors de la création de la commande :', error);
        res.status(500).json({ message: 'Erreur lors de la création de la commande.' });
    }
});
router.get('/commandes', async (req, res) => {
    try {
        const client = new Magasin();
        const commandes = await client.obtenirLesCommandes(); // ATTENTION AU await
        res.status(200).json({ commandes }); // on renvoie les données directement
    }
    catch (error) {
        console.error("Erreur lors de la récupération des commandes :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des commandes." });
    }
});
export default router;
