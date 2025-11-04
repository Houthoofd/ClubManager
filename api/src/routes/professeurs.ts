import express from 'express';
import { Professeurs } from '../db/clients/professeurs/professeurs.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { emailClient } from '../clients/emailClient.js';
import { } from '@clubmanager/types';
import { z } from 'zod';

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(verifyToken);


// route pour ajouter un professeur //
router.get('/', async (req: any, res: any) => {
  try {
    const client = new Professeurs();
    const { coursId } = req.params; // Récupère l'ID du cours depuis l'URL


    // Récupérer les utilisateurs associés à ce cours
    const professeurs = await client.obtenirLesProfesseurs();

    console.log('Professeurs récupèrés:', professeurs);
    res.status(200).json(professeurs);

  } catch (error) {
    console.error('Erreur lors de la récupération du cours avec utilisateurs :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du cours et des utilisateurs.' });
  }
});

// route pour ajouter un professeur //
router.post('/ajouter', async (req: any, res: any) => {
  
  try {
    const client = new Professeurs();
    const data = req.body;
    
    // Logging détaillé de ce qu'on reçoit
    console.log('📋 [Route] Données reçues pour promotion:');
    console.log('📋 [Route] Type de data:', typeof data);
    console.log('📋 [Route] data complet:', JSON.stringify(data, null, 2));
    console.log('📋 [Route] Clés de data:', Object.keys(data));
    
    if (data.utilisateurs) {
      console.log('📋 [Route] data.utilisateurs:', JSON.stringify(data.utilisateurs, null, 2));
      console.log('📋 [Route] Type de data.utilisateurs:', typeof data.utilisateurs);
      console.log('📋 [Route] Est un tableau:', Array.isArray(data.utilisateurs));
    }

    // Méthode pour extraire les IDs des utilisateurs
    const extractUserIds = (data: any): number[] => {
      console.log('🔍 [extractUserIds] Extraction des IDs depuis:', JSON.stringify(data, null, 2));
      
      let userIds: number[] = [];
      
      // Cas 1: data.utilisateurs est un tableau
      if (data.utilisateurs && Array.isArray(data.utilisateurs)) {
        console.log('🔍 [extractUserIds] Cas 1: data.utilisateurs est un tableau');
        
        // Vérifier si c'est un tableau de strings/numbers (IDs directs)
        if (data.utilisateurs.every((item: any) => typeof item === 'string' || typeof item === 'number')) {
          console.log('🔍 [extractUserIds] Cas 1a: Tableau d\'IDs directs (strings/numbers)');
          userIds = data.utilisateurs.map((id: any) => {
            console.log('🔍 [extractUserIds] ID direct:', id, 'converti en:', parseInt(id));
            return parseInt(id);
          }).filter((id: number) => !isNaN(id));
        }
        // Sinon c'est un tableau d'objets
        else {
          console.log('🔍 [extractUserIds] Cas 1b: Tableau d\'objets');
          userIds = data.utilisateurs.map((user: any) => {
            const id = user.id || user.userId || user.user_id;
            console.log('🔍 [extractUserIds] User:', user, 'ID extrait:', id);
            return parseInt(id);
          }).filter((id: number) => !isNaN(id));
        }
      }
      // Cas 2: data est directement un tableau
      else if (Array.isArray(data)) {
        console.log('🔍 [extractUserIds] Cas 2: data est directement un tableau');
        userIds = data.map((item: any) => {
          const id = typeof item === 'object' ? (item.id || item.userId || item.user_id) : item;
          return parseInt(id);
        }).filter((id: number) => !isNaN(id));
      }
      // Cas 3: data contient un seul utilisateur
      else if (data.id || data.userId || data.user_id) {
        console.log('🔍 [extractUserIds] Cas 3: data contient un seul utilisateur');
        const id = data.id || data.userId || data.user_id;
        userIds = [parseInt(id)].filter((id: number) => !isNaN(id));
      }
      // Cas 4: autres propriétés possibles
      else if (data.users && Array.isArray(data.users)) {
        console.log('🔍 [extractUserIds] Cas 4: data.users existe');
        userIds = data.users.map((user: any) => {
          const id = user.id || user.userId || user.user_id || user;
          return parseInt(id);
        }).filter((id: number) => !isNaN(id));
      }
      
      console.log('🔍 [extractUserIds] IDs extraits:', userIds);
      return userIds;
    };

    // Récupérer les utilisateurs associés à ce cours
    const result = await client.ajouterUnProfesseur(data);

    console.log('📊 [Route] Résultat promotion:', result);

    // Si la promotion a réussi, envoyer les emails
    if (result.isConfirm) {
      console.log('✅ [Route] Promotion réussie, envoi des emails...');
      
      try {
        // Extraire les IDs des utilisateurs
        const userIds = extractUserIds(data);
        
        console.log(`📝 [Route] ${userIds.length} IDs utilisateurs extraits pour l'envoi d'emails:`, userIds);

        // Envoyer un email à chaque utilisateur promu
        for (const userId of userIds) {
          try {
            console.log(`🔍 [Route] Traitement de l'utilisateur ID: ${userId}`);
            
            // Récupérer les données complètes de l'utilisateur depuis la base
            const utilisateurComplet = await client.obtenirUtilisateurParId(userId);
            
            if (utilisateurComplet) {
              console.log(`📧 [Route] Envoi email de promotion à ${utilisateurComplet.email} (ID: ${userId})`);
              
              // Utiliser EmailClient au lieu d'EmailService
              const emailResult = await emailClient.sendPromotionEmail(utilisateurComplet, {
                templateName: 'promotion-professeur',
                variables: {
                  customMessage: 'Bienvenue dans l\'équipe des professeurs !',
                  supportEmail: process.env.SUPPORT_EMAIL || 'support@clubmanager.com'
                }
              });

              if (emailResult.success) {
                console.log(`✅ [Route] Email de promotion envoyé avec succès à ${utilisateurComplet.email}`);
              } else {
                console.error(`❌ [Route] Erreur envoi email à ${utilisateurComplet.email}:`, emailResult.error);
              }
            } else {
              console.warn(`⚠️ [Route] Utilisateur avec ID ${userId} non trouvé pour l'envoi d'email`);
            }
          } catch (emailError) {
            console.error(`❌ [Route] Erreur envoi email pour utilisateur ID ${userId}:`, emailError);
          }
        }

        console.log('📧 [Route] Processus d\'envoi des emails terminé');
        
      } catch (emailError) {
        console.error('❌ [Route] Erreur générale lors de l\'envoi des emails:', emailError);
        // On ne fait pas échouer la promotion pour une erreur d'email
      }
    }

    res.status(200).json(result);

  } catch (error) {
    console.error("❌ [Route] Erreur lors de l'ajout ou de la modification :", error);
    res.status(500).json({ message: 'Erreur serveur lors de la promotion des professeurs.' });
  }
});

// endpoint pour modifier le statut d'un professeur (anciennement retirer)
router.post('/modifier', async (req: any, res: any) => {
  try {
    const { id, status_id } = req.body;
    if (!id || !status_id) {
      return res.status(400).json({ success: false, message: "ID et status_id requis." });
    }
    const client = new Professeurs();
    // Mettre à jour le status à la valeur choisie
    const result = await client.modifierStatutProfesseur(id, status_id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur lors de la modification du statut :", error);
    res.status(500).json({ message: "Erreur serveur lors de la modification du statut." });
  }
});

// Route pour récupérer le planning d'un professeur spécifique
router.get('/:id/planning', async (req: any, res: any) => {
  try {
    const client = new Professeurs();
    const { id } = req.params; // Récupère l'ID du professeur depuis l'URL
    
    // Valider que l'ID est un nombre
    const professeurId = parseInt(id);
    if (isNaN(professeurId)) {
      return res.status(400).json({
        isFind: false,
        message: 'ID du professeur invalide',
        data: []
      });
    }

    console.log(`Récupération du planning pour le professeur ID: ${professeurId}`);

    // Récupérer le planning du professeur
    const planningResult = await client.obtenirPlanningCoursProfesseur(professeurId);

    console.log('Planning récupéré:', planningResult);
    res.status(200).json(planningResult);

  } catch (error) {
    console.error('Erreur lors de la récupération du planning du professeur :', error);
    res.status(500).json({
      isFind: false,
      message: 'Erreur serveur lors de la récupération du planning',
      data: []
    });
  }
});

export default router;