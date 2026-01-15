import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { Utilisateurs } from '../db/clients/utilisateurs/utilisateurs.js';
import MysqlConnector from '../db/connector/mysqlconnector.js';
import { z } from 'zod';
import { UserData, utilisateurInscriptionSchema, userDataLoginSchema, userDataLoginByUserIdSchema, userSearchByEmailSchema, VerifyResultWithData, userDataAjoutSchema } from '../../../packages/types/dist/index.js';
import bcrypt from 'bcrypt';
import { EmailService } from '../services/emailService.js';
// CORRIGÉ: Utiliser le bon chemin pour EmailClient
import { emailClient } from '../clients/emailClient.js';

const router = express.Router();

// Créer une instance du service email et du connecteur MySQL
const emailService = new EmailService();
const mysqlConnector = MysqlConnector.getInstance();

// Route pour vérifier l'existence d'un utilisateur
router.post('/verifier', async (req, res) => {
  try {
    const { nom, prenom, date_naissance } = req.body;
    
    if (!nom || !prenom || !date_naissance) {
      return res.status(400).json({
        message: 'Nom, prénom et date de naissance sont requis',
        type: 'VALIDATION_ERROR'
      });
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date_naissance)) {
      return res.status(400).json({
        message: 'Format de date invalide (YYYY-MM-DD requis)',
        type: 'INVALID_DATE_FORMAT'
      });
    }
    
    const utilisateursDB = new Utilisateurs();
    
    try {
      // Utiliser la méthode existante verifierUtilisateurExiste
      await utilisateursDB.verifierUtilisateurExiste({ nom, prenom, date_naissance });
      
      // Si aucune erreur n'est levée, l'utilisateur n'existe pas
      return res.status(200).json({
        message: 'Aucun utilisateur trouvé avec ces informations',
        type: 'USER_AVAILABLE',
        userExists: false,
        canRegister: true
      });
      
    } catch (conflictError: any) {
      // Si une erreur est levée, cela signifie qu'un utilisateur existe déjà
      if (conflictError.status === 409) {
        return res.status(409).json({
          message: conflictError.message,
          type: 'USER_EXISTS',
          userExists: true,
          userData: conflictError.data
        });
      } else {
        // Autre type d'erreur (erreur de base de données, etc.)
        throw conflictError;
      }
    }
    
  } catch (error: any) {
    console.error('Erreur lors de la vérification utilisateur:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur lors de la vérification',
      type: 'SERVER_ERROR',
      error: error.message || 'Erreur inconnue'
    });
  }
});

// NOUVELLE ROUTE : Test de configuration email
router.get('/test-email-config', async (req, res) => {
  try {
    console.log('🔧 [Route] Test de configuration email demandé');
    
    const configTest = await emailService.testerConfiguration();
    
    res.json({
      success: configTest.success,
      message: configTest.success ? 'Configuration email OK' : 'Problèmes de configuration détectés',
      details: configTest.details
    });
    
  } catch (error: any) {
    console.error('❌ [Route] Erreur lors du test de config email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test de configuration',
      error: error.message
    });
  }
});

// NOUVELLE ROUTE : Envoi d'email de test
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis pour le test'
      });
    }

    console.log('🧪 [Route] Test d\'envoi email vers:', email);
    
    const result = await emailService.envoyerEmailTest(email);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Email de test envoyé avec succès',
        messageId: result.messageId,
        details: result.details
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Échec de l\'envoi de l\'email de test',
        error: result.error,
        details: result.details
      });
    }
    
  } catch (error: any) {
    console.error('❌ [Route] Erreur lors du test d\'email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test d\'envoi d\'email',
      error: error.message
    });
  }
});

// ✅ NOUVELLES ROUTES PUBLIQUES pour la validation d'email (AVANT le middleware verifyToken)

// Route PUBLIQUE GET pour valider le token d'email via URL
router.get('/verify-email-token', async (req, res) => {
  try {
    const { token, userId } = req.query;
    
    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Token et userId requis dans les paramètres de requête'
      });
    }

    console.log('🔍 [Route PUBLIC] Validation token email:', { 
      token: (token as string).substring(0, 8) + '...', 
      userId 
    });

    // ✅ CORRIGÉ: Utiliser EmailClient au lieu de l'ancien système
    const result = await emailClient.validateEmailToken(token as string, userId as string);

    if (result.success) {
      console.log('✅ [Route PUBLIC] Token validé avec succès');
      res.json({
        success: true,
        message: result.message,
        data: result.data,
        redirect_to: '/pages/connexion?verified=true'
      });
    } else {
      console.warn('⚠️ [Route PUBLIC] Échec validation token:', result.message);
      res.status(400).json({
        success: false,
        error: result.message,
        redirect_to: '/pages/connexion?error=invalid_token'
      });
    }
    
  } catch (error: any) {
    console.error('❌ [Route PUBLIC] Erreur validation token:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      redirect_to: '/pages/connexion?error=server_error'
    });
  }
});

// Route d'inscription d'un utilisateur (PUBLIQUE - pas de verifyToken)
router.post('/inscription', async (req: any, res: any) => {
  try {
    console.log('[Route] Inscription utilisateur - Body reçu:', req.body);

    // Générer automatiquement le nom_utilisateur s'il n'est pas fourni
    if (!req.body.nom_utilisateur || req.body.nom_utilisateur.trim() === '') {
      const prenom = req.body.prenom ? req.body.prenom.toLowerCase().replace(/\s+/g, '') : '';
      const nom = req.body.nom ? req.body.nom.toLowerCase().replace(/\s+/g, '') : '';
      const timestamp = Date.now().toString().slice(-4); // 4 derniers chiffres du timestamp
      
      req.body.nom_utilisateur = `${prenom}_${nom}_${timestamp}`;
      console.log('[Route] Nom d\'utilisateur généré automatiquement:', req.body.nom_utilisateur);
    }

    // Validation avec le schéma utilisateurInscriptionSchema
    const validationResult = utilisateurInscriptionSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.log('[Route] Erreur de validation Zod:', validationResult.error.issues);
      return res.status(400).json({
        message: validationResult.error.issues[0]?.message || "Données invalides",
        errors: validationResult.error.issues
      });
    }

    const validatedData = validationResult.data;
    console.log('[Route] Données validées:', validatedData);

    // Mapper vers le format attendu par la base de données
    const mappedData = {
      prenom: validatedData.prenom,
      nom: validatedData.nom,
      nom_utilisateur: validatedData.nom_utilisateur,
      email: validatedData.email,
      password: validatedData.password,
      genre_id: validatedData.genre_id,
      abonnement_id: validatedData.abonnement_id,
      date_naissance: validatedData.date_naissance,
      date_inscription: validatedData.date_inscription,
      status_id: validatedData.status_id,
      grade_id: validatedData.grade_id
    };

    console.log('[Route] Données mappées pour DB:', mappedData);

    // Appel de la méthode d'inscription
    const client = new Utilisateurs();
    const result = await client.inscrireUtilisateur(mappedData);

    console.log('[Route] Résultat inscription:', result);

    // ✅ CORRECTION: Envoi email de vérification avec EmailClient
    if (result.userId) {
      try {
        console.log('📧 [Route] Démarrage envoi email de vérification...');
        console.log(`📧 [Route] Email destinataire: ${validatedData.email}`);
        console.log(`📧 [Route] Utilisateur: ${validatedData.prenom} ${validatedData.nom}`);
        console.log(`📧 [Route] UserId généré: ${result.userId}`);

        // ✅ CORRECTION: Utiliser l'email réel de l'utilisateur
        const emailResult = await emailClient.sendValidationEmail({
          email: validatedData.email, // CORRIGÉ: utiliser l'email réel au lieu de hardcoded
          prenom: validatedData.prenom,
          nom: validatedData.nom,
          userId: result.generatedUserId,
          utilisateurId: result.userId
        });

        if (emailResult.success) {
          console.log('✅ [Route] Email de vérification envoyé avec succès !');
          console.log('✅ [Route] Message:', emailResult.message);
          
          res.status(201).json({
            message: 'Inscription réussie et email de vérification envoyé',
            generatedUserId: result.userId,
            inscriptionDetails: result,
            emailStatus: {
              sent: true,
              message: emailResult.message,
              details: emailResult.details,
              emailDestination: validatedData.email,
              isTestMode: false,
              note: `Email de vérification envoyé à ${validatedData.email}`
            }
          });
          
        } else {
          res.status(201).json({
            message: 'Inscription réussie mais échec envoi email de vérification',
            generatedUserId: result.userId,
            inscriptionDetails: result,
            emailStatus: {
              sent: false,
              message: emailResult.message,
              details: emailResult.details,
              emailDestination: validatedData.email,
              isTestMode: false
            },
            warning: 'L\'email de vérification n\'a pas pu être envoyé. Veuillez vérifier votre configuration.'
          });
        }

      } catch (emailError: any) {
        console.error('❌ [Route] Erreur critique lors de l\'envoi de l\'email:', emailError);
        
        res.status(201).json({
          message: 'Inscription réussie mais erreur lors de l\'envoi de l\'email',
          generatedUserId: result.userId,
          inscriptionDetails: result,
          emailStatus: {
            sent: false,
            error: 'Erreur technique lors de l\'envoi',
            details: { originalError: emailError.message },
            emailDestination: validatedData.email,
            isTestMode: false
          },
          warning: 'Une erreur technique s\'est produite lors de l\'envoi de l\'email de vérification.'
        });
      }
    } else {
      // Pas d'userId généré (cas anormal)
      console.warn('⚠️ [Route] Inscription sans UserId généré - pas d\'email envoyé');
      res.status(201).json({
        message: 'Inscription réussie',
        inscriptionDetails: result,
        emailStatus: {
          sent: false,
          reason: 'Aucun UserId généré'
        }
      });
    }

  } catch (error: any) {
    console.error('Erreur lors de l\'inscription de l\'utilisateur :', error);
    res.status(500).json({ 
      message: error.message || 'Erreur interne du serveur',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route de connexion principale par userId (remplace toute la complexité email)
router.post('/connexion-userid', async (req, res) => {
  try {
    console.log('[DEBUG] Route /connexion-userid appelée avec:', req.body);
    const validatedData = userDataLoginByUserIdSchema.parse(req.body);
    console.log("Connexion par userId :", validatedData.userId);

    const client = new Utilisateurs();
    const result = await client.validerConnexionParUserId(validatedData.userId, validatedData.password);

    if (result.isFind) {
      res.status(200).json({ message: result.message, data: result.dataToStore });
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion par userId :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

// Garder l'ancienne route email pour compatibilité (mais plus simple)
router.post('/connexion', async (req, res) => {
  try {
    const validatedData = userDataLoginSchema.parse(req.body);
    console.log("Connexion par email (legacy) :", validatedData.email);

    const client = new Utilisateurs();
    const result = await client.validerConnexion(validatedData);
    
    if (result.isFind) {
      res.status(200).json({ message: result.message, data: result.dataToStore });
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

// ✅ NOUVELLES ROUTES PUBLIQUES pour la validation d'email (AVANT le middleware verifyToken)

// Route PUBLIQUE GET pour valider le token d'email via URL
router.get('/verify-email-token', async (req, res) => {
  try {
    const { token, userId } = req.query;
    
    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Token et userId requis dans les paramètres de requête'
      });
    }

    console.log('🔍 [Route PUBLIC] Validation token email:', { 
      token: (token as string).substring(0, 8) + '...', 
      userId 
    });

    // ✅ CORRIGÉ: Utiliser EmailClient au lieu de l'ancien système
    const result = await emailClient.validateEmailToken(token as string, userId as string);

    if (result.success) {
      console.log('✅ [Route PUBLIC] Token validé avec succès');
      res.json({
        success: true,
        message: result.message,
        data: result.data,
        redirect_to: '/pages/connexion?verified=true'
      });
    } else {
      console.warn('⚠️ [Route PUBLIC] Échec validation token:', result.message);
      res.status(400).json({
        success: false,
        error: result.message,
        redirect_to: '/pages/connexion?error=invalid_token'
      });
    }
    
  } catch (error: any) {
    console.error('❌ [Route PUBLIC] Erreur validation token:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      redirect_to: '/pages/connexion?error=server_error'
    });
  }
});

// Route d'inscription d'un utilisateur (PUBLIQUE - pas de verifyToken)
router.post('/inscription', async (req: any, res: any) => {
  try {
    console.log('[Route] Inscription utilisateur - Body reçu:', req.body);

    // Générer automatiquement le nom_utilisateur s'il n'est pas fourni
    if (!req.body.nom_utilisateur || req.body.nom_utilisateur.trim() === '') {
      const prenom = req.body.prenom ? req.body.prenom.toLowerCase().replace(/\s+/g, '') : '';
      const nom = req.body.nom ? req.body.nom.toLowerCase().replace(/\s+/g, '') : '';
      const timestamp = Date.now().toString().slice(-4); // 4 derniers chiffres du timestamp
      
      req.body.nom_utilisateur = `${prenom}_${nom}_${timestamp}`;
      console.log('[Route] Nom d\'utilisateur généré automatiquement:', req.body.nom_utilisateur);
    }

    // Validation avec le schéma utilisateurInscriptionSchema
    const validationResult = utilisateurInscriptionSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.log('[Route] Erreur de validation Zod:', validationResult.error.issues);
      return res.status(400).json({
        message: validationResult.error.issues[0]?.message || "Données invalides",
        errors: validationResult.error.issues
      });
    }

    const validatedData = validationResult.data;
    console.log('[Route] Données validées:', validatedData);

    // Mapper vers le format attendu par la base de données
    const mappedData = {
      prenom: validatedData.prenom,
      nom: validatedData.nom,
      nom_utilisateur: validatedData.nom_utilisateur,
      email: validatedData.email,
      password: validatedData.password,
      genre_id: validatedData.genre_id,
      abonnement_id: validatedData.abonnement_id,
      date_naissance: validatedData.date_naissance,
      date_inscription: validatedData.date_inscription,
      status_id: validatedData.status_id,
      grade_id: validatedData.grade_id
    };

    console.log('[Route] Données mappées pour DB:', mappedData);

    // Appel de la méthode d'inscription
    const client = new Utilisateurs();
    const result = await client.inscrireUtilisateur(mappedData);

    console.log('[Route] Résultat inscription:', result);

    // ✅ CORRECTION: Envoi email de vérification avec EmailClient
    if (result.userId) {
      try {
        console.log('📧 [Route] Démarrage envoi email de vérification...');
        console.log(`📧 [Route] Email destinataire: ${validatedData.email}`);
        console.log(`📧 [Route] Utilisateur: ${validatedData.prenom} ${validatedData.nom}`);
        console.log(`📧 [Route] UserId généré: ${result.userId}`);

        // ✅ CORRECTION: Utiliser l'email réel de l'utilisateur
        const emailResult = await emailClient.sendValidationEmail({
          email: validatedData.email, // CORRIGÉ: utiliser l'email réel au lieu de hardcoded
          prenom: validatedData.prenom,
          nom: validatedData.nom,
          userId: result.generatedUserId,
          utilisateurId: result.userId
        });

        if (emailResult.success) {
          console.log('✅ [Route] Email de vérification envoyé avec succès !');
          console.log('✅ [Route] Message:', emailResult.message);
          
          res.status(201).json({
            message: 'Inscription réussie et email de vérification envoyé',
            generatedUserId: result.userId,
            inscriptionDetails: result,
            emailStatus: {
              sent: true,
              message: emailResult.message,
              details: emailResult.details,
              emailDestination: validatedData.email,
              isTestMode: false,
              note: `Email de vérification envoyé à ${validatedData.email}`
            }
          });
          
        } else {
          res.status(201).json({
            message: 'Inscription réussie mais échec envoi email de vérification',
            generatedUserId: result.userId,
            inscriptionDetails: result,
            emailStatus: {
              sent: false,
              message: emailResult.message,
              details: emailResult.details,
              emailDestination: validatedData.email,
              isTestMode: false
            },
            warning: 'L\'email de vérification n\'a pas pu être envoyé. Veuillez vérifier votre configuration.'
          });
        }

      } catch (emailError: any) {
        console.error('❌ [Route] Erreur critique lors de l\'envoi de l\'email:', emailError);
        
        res.status(201).json({
          message: 'Inscription réussie mais erreur lors de l\'envoi de l\'email',
          generatedUserId: result.userId,
          inscriptionDetails: result,
          emailStatus: {
            sent: false,
            error: 'Erreur technique lors de l\'envoi',
            details: { originalError: emailError.message },
            emailDestination: validatedData.email,
            isTestMode: false
          },
          warning: 'Une erreur technique s\'est produite lors de l\'envoi de l\'email de vérification.'
        });
      }
    } else {
      // Pas d'userId généré (cas anormal)
      console.warn('⚠️ [Route] Inscription sans UserId généré - pas d\'email envoyé');
      res.status(201).json({
        message: 'Inscription réussie',
        inscriptionDetails: result,
        emailStatus: {
          sent: false,
          reason: 'Aucun UserId généré'
        }
      });
    }

  } catch (error: any) {
    console.error('Erreur lors de l\'inscription de l\'utilisateur :', error);
    res.status(500).json({ 
      message: error.message || 'Erreur interne du serveur',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route de connexion principale par userId (remplace toute la complexité email)
router.post('/connexion-userid', async (req, res) => {
  try {
    console.log('[DEBUG] Route /connexion-userid appelée avec:', req.body);
    const validatedData = userDataLoginByUserIdSchema.parse(req.body);
    console.log("Connexion par userId :", validatedData.userId);

    const client = new Utilisateurs();
    const result = await client.validerConnexionParUserId(validatedData.userId, validatedData.password);

    if (result.isFind) {
      res.status(200).json({ message: result.message, data: result.dataToStore });
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion par userId :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

// Garder l'ancienne route email pour compatibilité (mais plus simple)
router.post('/connexion', async (req, res) => {
  try {
    const validatedData = userDataLoginSchema.parse(req.body);
    console.log("Connexion par email (legacy) :", validatedData.email);

    const client = new Utilisateurs();
    const result = await client.validerConnexion(validatedData);
    
    if (result.isFind) {
      res.status(200).json({ message: result.message, data: result.dataToStore });
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

// CORRIGÉ: Route pour valider le token d'email avec EmailClient (POST)
router.post('/verify-email-token', async (req, res) => {
  try {
    const { token, userId } = req.body;
    
    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Token et userId requis'
      });
    }

    console.log('🔍 [Route PUBLIC POST] Validation token email:', { 
      token: token.substring(0, 8) + '...', 
      userId 
    });

    const result = await emailClient.validateEmailToken(token, userId);

    if (result.success) {
      console.log('✅ [Route PUBLIC POST] Token validé avec succès');
      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      console.warn('⚠️ [Route PUBLIC POST] Échec validation token:', result.message);
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
    
  } catch (error: any) {
    console.error('❌ [Route PUBLIC POST] Erreur validation token:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ MAINTENANT le middleware d'authentification pour les autres routes
router.use(verifyToken);

// Routes PROTÉGÉES (après le middleware)
router.put('/modifier', async (req:any, res:any) => {
  console.log('[ROUTE] PUT /utilisateurs/modifier appelée');
  try {
    const { id, email, date_naissance, genres, grades, abonnement, status, password } = req.body;
    console.log('[ROUTE] Body reçu:', req.body);

    if (!id) {
      return res.status(400).json({ message: "L'identifiant de l'utilisateur est requis." });
    }

    const client = new Utilisateurs();

    // Prépare les données à modifier
    const dataToUpdate: any = { id };
    if (typeof email !== 'undefined') dataToUpdate.email = email;
    if (typeof date_naissance !== 'undefined') dataToUpdate.date_naissance = date_naissance;
    if (typeof genres !== 'undefined') dataToUpdate.genres = genres;
    if (typeof grades !== 'undefined') dataToUpdate.grades = grades;
    if (typeof abonnement !== 'undefined') dataToUpdate.abonnement = abonnement;
    if (typeof status !== 'undefined') dataToUpdate.status = status;
    
    // Hashage du mot de passe s'il est fourni
    if (typeof password !== 'undefined' && password.trim() !== '') {
      console.log('[ROUTE] Hashage du mot de passe en cours...');
      const hashedPassword = await bcrypt.hash(password, 10);
      dataToUpdate.password = hashedPassword;
      console.log('[ROUTE] Mot de passe hashé avec succès');
    }

    console.log('[ROUTE] Données à envoyer au client:', { ...dataToUpdate, password: dataToUpdate.password ? '[HASHED]' : undefined });

    // Appel à la méthode du client qui gère la modification
    const result = await client.modifierInfosUtilisateur(dataToUpdate);

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

// Modifier la route DELETE pour utiliser la désactivation
router.delete('/supprimer/:id', async (req: any, res: any) => {
  try {
    const utilisateurId = Number(req.params.id);
    console.log(`[DELETE] Reçu pour désactivation, id =`, utilisateurId);

    if (!utilisateurId || isNaN(utilisateurId)) {
      console.log(`[DELETE] ID utilisateur invalide :`, req.params.id);
      return res.status(400).json({ isConfirm: false, message: "ID utilisateur invalide." });
    }

    const client = new Utilisateurs();

    // Vérifier que l'utilisateur existe (actif ou inactif)
    const utilisateurSimple = await client.obtenirUnUtilisateur(utilisateurId, true); // includeInactive = true
    console.log(`[DELETE] Résultat de obtenirUnUtilisateur :`, utilisateurSimple);

    if (!utilisateurSimple.isFind || !utilisateurSimple.data || utilisateurSimple.data.length === 0) {
      console.log(`[DELETE] Utilisateur introuvable pour id =`, utilisateurId);
      return res.status(404).json({ isConfirm: false, message: "Utilisateur introuvable." });
    }

    // Désactiver l'utilisateur au lieu de le supprimer
    const result = await client.desactiverUtilisateur(utilisateurId);
    console.log(`[DELETE] Résultat de desactiverUtilisateur :`, result);

    if (result.isConfirm) {
      console.log(`[DELETE] Désactivation réussie pour id =`, utilisateurId);
      res.status(200).json({ 
        isConfirm: true, 
        message: result.message,
        action: 'désactivé' // Indiquer l'action réelle
      });
    } else {
      console.log(`[DELETE] La désactivation a échoué pour id =`, utilisateurId);
      res.status(400).json({ isConfirm: false, message: result.message });
    }
  } catch (error) {
    console.error("Erreur lors de la désactivation de l'utilisateur :", error);
    res.status(500).json({ isConfirm: false, message: 'Erreur serveur lors de la désactivation de l\'utilisateur.' });
  }
});

// NOUVELLE route pour réactiver un utilisateur
router.put('/reactiver/:id', async (req: any, res: any) => {
  try {
    const utilisateurId = Number(req.params.id);
    console.log(`[PUT] Reçu pour réactivation, id =`, utilisateurId);

    if (!utilisateurId || isNaN(utilisateurId)) {
      console.log(`[PUT] ID utilisateur invalide :`, req.params.id);
      return res.status(400).json({ isConfirm: false, message: "ID utilisateur invalide." });
    }

    const client = new Utilisateurs();

    // Réactiver l'utilisateur
    const result = await client.reactiverUtilisateur(utilisateurId);
    console.log(`[PUT] Résultat de reactiverUtilisateur :`, result);

    if (result.isConfirm) {
      console.log(`[PUT] Réactivation réussie pour id =`, utilisateurId);
      res.status(200).json({ 
        isConfirm: true, 
        message: result.message,
        action: 'réactivé'
      });
    } else {
      console.log(`[PUT] La réactivation a échoué pour id =`, utilisateurId);
      res.status(400).json({ isConfirm: false, message: result.message });
    }
  } catch (error) {
    console.error("Erreur lors de la réactivation de l'utilisateur :", error);
    res.status(500).json({ isConfirm: false, message: 'Erreur serveur lors de la réactivation de l\'utilisateur.' });
  }
});

// NOUVELLE route pour obtenir les statistiques d'utilisateurs
router.get('/statistiques', async (req: any, res: any) => {
  try {
    const client = new Utilisateurs();
    const stats = await client.obtenirStatistiquesUtilisateurs();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques :", error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des statistiques.' });
  }
});

// Modifier la route GET pour inclure un paramètre optionnel pour les inactifs
router.get('/', async (req: any, res: any) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const client = new Utilisateurs();
    
    // Attendre la résolution de la méthode obtenirTousLesUtilisateurs
    const utilisateurs = await client.obtenirTousLesUtilisateurs(includeInactive);
    
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
    console.log('[POST /ajouter] Données reçues du front :', data);

    // Validation et conversion des données avec Zod
    let validatedData;
    try {
      validatedData = userDataAjoutSchema.parse(data);
      console.log('[POST /ajouter] Données validées et converties :', validatedData);
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        console.error('[POST /ajouter] Erreur de validation Zod :', zodError);
        return res.status(400).json({ message: 'Données invalides.', errors: zodError.errors });
      } else {
        console.error('[POST /ajouter] Erreur inconnue :', zodError);
        return res.status(400).json({ message: 'Erreur inconnue lors de la validation.' });
      }
    }

    // Vérifie si l'utilisateur existe déjà (par email ou nom_utilisateur)
    const verifUtilisateur = await client.verifierUtilisateur({
      email: validatedData.email,
      nom_utilisateur: validatedData.nom_utilisateur,
      prenom: validatedData.first_name,
      nom: validatedData.last_name,
      genre_id: validatedData.genres,
      date_naissance: validatedData.date_of_birth,
      password: "password123",
      status_id: validatedData.status,
      grade_id: validatedData.grades,
      abonnement_id: validatedData.abonnement,
      date_inscription: new Date().toISOString().split('T')[0],
    });

    if (verifUtilisateur.isFind) {
      return res.status(400).json({ message: 'Utilisateur déjà inscrit.' });
    }

    console.log("validatedData avant ajout :", validatedData);

    // Appel à la méthode d'insertion qui attend UserDataAjout
    const result = await client.inscrireUtilisateur(validatedData);

    console.log('utilisateur ajouté avec succès:', result);
    res.status(200).json(result);

  } catch (error) {
    console.error("Erreur lors de l'ajout ou de la modification :", error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du cours et des utilisateurs.' });
  }
});

// MISE À JOUR: Route pour envoyer l'email de vérification avec EmailClient
router.post('/send-verification-email', async (req, res) => {
  try {
    const { email, prenom, nom, userId } = req.body;
    
    if (!email || !prenom || !nom || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Email, prénom, nom et userId requis'
      });
    }

    console.log('📧 [Route] Demande d\'envoi email de vérification:', { email, prenom, nom, userId });

    // Récupérer l'ID numérique de l'utilisateur basé sur l'userId
    const utilisateur = await new Promise((resolve, reject) => {
      mysqlConnector.query(
        'SELECT id, first_name, last_name, email, email_verified FROM utilisateurs WHERE userId = ? LIMIT 1',
        [userId],
        (error: any, results: any) => {
          if (error) {
            console.error('❌ Erreur DB lors de la recherche utilisateur:', error);
            reject(error);
          } else {
            console.log('🔍 Résultat recherche utilisateur:', results);
            resolve(results.length > 0 ? results[0] : null);
          }
        }
      );
    });

    if (!utilisateur) {
      console.warn('⚠️ Utilisateur non trouvé avec userId:', userId);
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé avec cet userId'
      });
    }

    // Vérifier si l'email n'est pas déjà vérifié
    if ((utilisateur as any).email_verified) {
      console.log('⚠️ Email déjà vérifié pour userId:', userId);
      return res.status(400).json({
        success: false,
        error: 'Cet email est déjà vérifié'
      });
    }

    console.log('✅ Utilisateur trouvé, email non vérifié:', utilisateur);

    // CORRIGÉ: Envoyer l'email de vérification avec EmailClient
    const result = await emailClient.sendValidationEmail({
      email,
      prenom,
      nom,
      userId,
      utilisateurId: (utilisateur as any).id
    });

    console.log('📧 Résultat envoi email:', result);
    res.json({
      success: result.success,
      message: result.message,
      details: result.details
    });
    
  } catch (error: any) {
    console.error('❌ Erreur envoi email vérification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// CORRIGÉ: Route pour valider le token d'email avec EmailClient
router.post('/verify-email-token', async (req, res) => {
  try {
    const { token, userId } = req.body;
    
    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Token et userId requis'
      });
    }

    console.log('🔍 [Route PUBLIC POST] Validation token email:', { 
      token: token.substring(0, 8) + '...', 
      userId 
    });

    const result = await emailClient.validateEmailToken(token, userId);

    if (result.success) {
      console.log('✅ [Route PUBLIC POST] Token validé avec succès');
      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      console.warn('⚠️ [Route PUBLIC POST] Échec validation token:', result.message);
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
    
  } catch (error: any) {
    console.error('❌ [Route PUBLIC POST] Erreur validation token:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;