import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import MysqlConnector from '../db/connector/mysqlconnector.js';

export interface ValidationToken {
  id: number;
  utilisateur_id: number;
  token: string;
  type: 'email_confirmation' | 'password_setup';
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export class EmailValidationService {
  private mysqlConnector: MysqlConnector;
  private initialized: boolean = false;
  private emailService: any = null; // Déclaré comme any temporairement

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
    // Initialisation différée pour éviter les dépendances circulaires
    this.initEmailService();
  }

  private async initEmailService() {
    try {
      // Import dynamique pour éviter les dépendances circulaires
      const { EmailService } = await import('./emailService.js');
      this.emailService = new EmailService();
      console.log('✅ [EmailValidationService] EmailService initialisé');
    } catch (error) {
      console.warn('⚠️ [EmailValidationService] EmailService non disponible:', error);
    }
  }

  // Vérifier que les tables sont initialisées avant chaque opération
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeTables();
    }
  }

  // Initialiser les tables avec vérification de disponibilité DB
  async initializeTables(): Promise<void> {
    if (this.initialized) {
      console.log('✅ [EmailValidationService] Déjà initialisé');
      return;
    }

    try {
      console.log('🔄 [EmailValidationService] Initialisation des tables...');
      
      // Vérifier d'abord que la DB est disponible
      await this.waitForDatabase();
      
      // Créer les tables si elles n'existent pas
      const createTablesPromises = [
        this.createValidationTokensTable(),
        this.createPasswordResetTokensTable(),
        this.createMessagesPersonnalisesTable()
      ];
      
      await Promise.all(createTablesPromises);
      
      // Mettre à jour la structure des tokens si nécessaire
      await this.ensureValidationTokensTableStructure();
      
      this.initialized = true;
      console.log('✅ [EmailValidationService] Tables initialisées');
    } catch (error) {
      console.error('❌ [EmailValidationService] Erreur initialisation:', error);
      // NE PAS marquer comme initialisé en cas d'erreur
      throw error;
    }
  }

  // Attendre que la base de données soit disponible
  private async waitForDatabase(maxRetries: number = 5, delayMs: number = 500): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await new Promise((resolve, reject) => {
          this.mysqlConnector.query('SELECT 1', [], (error, results) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        });
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error('Base de données non disponible pour EmailValidationService');
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  private async createValidationTokensTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS validation_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          utilisateur_id INT NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          type ENUM('email_confirmation', 'password_setup') DEFAULT 'email_confirmation',
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_token (token),
          INDEX idx_utilisateur_id (utilisateur_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  private async createPasswordResetTokensTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          utilisateur_id INT NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_token (token),
          INDEX idx_utilisateur_id (utilisateur_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  private async createMessagesPersonnalisesTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS messages_personnalises (
          id INT AUTO_INCREMENT PRIMARY KEY,
          utilisateur_id INT NOT NULL,
          contenu TEXT NOT NULL,
          status_envoi ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
          sendgrid_message_id VARCHAR(255) NULL,
          error_details TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_utilisateur_id (utilisateur_id),
          INDEX idx_status (status_envoi)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Générer un token sécurisé
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Créer un token de validation d'email
  async createEmailConfirmationToken(utilisateurId: number): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire dans 24h

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO validation_tokens (utilisateur_id, token, type, expires_at)
        VALUES (?, ?, 'email_confirmation', ?)
      `;

      this.mysqlConnector.query(sql, [utilisateurId, token, expiresAt], (error) => {
        if (error) {
          console.error('❌ Erreur création token confirmation email:', error);
          reject(error);
        } else {
          console.log('✅ Token confirmation email créé:', token);
          resolve(token);
        }
      });
    });
  }

  // Créer un token de configuration de mot de passe
  async createPasswordSetupToken(utilisateurId: number): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO validation_tokens (utilisateur_id, token, type, expires_at)
        VALUES (?, ?, 'password_setup', ?)
      `;

      this.mysqlConnector.query(sql, [utilisateurId, token, expiresAt], (error) => {
        if (error) {
          console.error('❌ Erreur création token setup password:', error);
          reject(error);
        } else {
          console.log('✅ Token setup password créé:', token);
          resolve(token);
        }
      });
    });
  }

  // Valider un token
  async validateToken(token: string, type: 'email_confirmation' | 'password_setup'): Promise<ValidationToken | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM validation_tokens
        WHERE token = ? AND type = ? AND used = FALSE AND expires_at > NOW()
        LIMIT 1
      `;

      this.mysqlConnector.query(sql, [token, type], (error, results) => {
        if (error) {
          console.error('❌ Erreur validation token:', error);
          reject(error);
        } else {
          resolve(results.length > 0 ? results[0] : null);
        }
      });
    });
  }

  // Marquer un token comme utilisé
  async markTokenAsUsed(token: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE validation_tokens
        SET used = TRUE
        WHERE token = ?
      `;

      this.mysqlConnector.query(sql, [token], (error, results) => {
        if (error) {
          console.error('❌ Erreur marquage token utilisé:', error);
          reject(error);
        } else {
          resolve(results.affectedRows > 0);
        }
      });
    });
  }

  // Confirmer l'email d'un utilisateur
  async confirmUserEmail(token: string): Promise<{ success: boolean; userId?: number; message: string }> {
    await this.ensureInitialized();

    try {
      const validationToken = await this.validateToken(token, 'email_confirmation');
      
      if (!validationToken) {
        return {
          success: false,
          message: 'Token invalide, expiré ou déjà utilisé'
        };
      }

      // Marquer l'email comme confirmé dans la table utilisateurs
      return new Promise((resolve, reject) => {
        const sql = `
          UPDATE utilisateurs 
          SET email_verified = TRUE, email_verified_at = NOW()
          WHERE id = ?
        `;

        this.mysqlConnector.query(sql, [validationToken.utilisateur_id], async (error, results) => {
          if (error) {
            console.error('❌ Erreur confirmation email utilisateur:', error);
            reject(error);
          } else {
            // Marquer le token comme utilisé
            await this.markTokenAsUsed(token);
            
            resolve({
              success: true,
              userId: validationToken.utilisateur_id,
              message: 'Email confirmé avec succès'
            });
          }
        });
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Envoyer l'email de validation après inscription
  async sendValidationEmail(utilisateurId: number): Promise<{ success: boolean; message: string }> {
    await this.ensureInitialized();

    try {
      // Récupérer les informations de l'utilisateur
      const user = await this.getUserById(utilisateurId);
      if (!user) {
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      // Créer les tokens
      const confirmationToken = await this.createEmailConfirmationToken(utilisateurId);
      const passwordSetupToken = await this.createPasswordSetupToken(utilisateurId);

      // Utilisation dynamique pour éviter les dépendances circulaires
      const { messageClient } = await import('../db/clients/messagerie/messageClient.js');

      // Envoyer l'email
      const result = await messageClient.envoyerValidationEmail({
        email: user.email,
        prenom: user.first_name,
        userId: user.userId,
        confirmationToken,
        passwordSetupToken,
        utilisateurId,
        saveToDb: true
      });

      return {
        success: result.success,
        message: result.success ? 'Email de validation envoyé' : result.error || 'Erreur envoi email'
      };
    } catch (error: any) {
      console.error('❌ Erreur envoi email validation:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // NOUVELLE MÉTHODE: Créer un token de validation d'email avec userId
  async createEmailValidationTokenWithUserId(utilisateurId: number, userId: string): Promise<{
    token: string;
    hashedToken: string;
  }> {
    await this.ensureInitialized();
    
    const baseToken = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire dans 24h

    // Créer le hash combiné userId + token pour sécurité renforcée
    const combinedData = `${userId}:${baseToken}:${Date.now()}`;
    const hashedToken = crypto.createHash('sha256').update(combinedData).digest('hex');

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO validation_tokens (
          utilisateur_id, 
          token, 
          type, 
          expires_at, 
          user_id_string, 
          token_hash,
          created_at
        )
        VALUES (?, ?, 'email_confirmation', ?, ?, ?, NOW())
      `;

      this.mysqlConnector.query(sql, [utilisateurId, baseToken, expiresAt, userId, hashedToken], (error) => {
        if (error) {
          console.error('❌ Erreur création token validation email avec hash:', error);
          reject(error);
        } else {
          console.log('✅ Token validation email créé avec hash:', { 
            baseToken: baseToken.substring(0, 8) + '...', 
            hashedToken: hashedToken.substring(0, 8) + '...',
            userId 
          });
          resolve({
            token: baseToken,
            hashedToken: hashedToken
          });
        }
      });
    });
  }

  // NOUVELLE MÉTHODE: Valider un token avec vérification hash renforcée
  async validateEmailTokenWithHash(token: string, userId: string): Promise<{
    success: boolean;
    message: string;
    utilisateurId?: number;
    data?: any;
  }> {
    await this.ensureInitialized();

    try {
      console.log('🔍 Validation token avec hash renforcé:', { 
        token: token.substring(0, 8) + '...', 
        userId 
      });

      // Rechercher le token en base
      const tokenData = await new Promise<any>((resolve, reject) => {
        const sql = `
          SELECT vt.*, u.email, u.first_name, u.last_name, u.userId as user_id_db
          FROM validation_tokens vt
          JOIN utilisateurs u ON vt.utilisateur_id = u.id
          WHERE vt.token = ? 
            AND vt.user_id_string = ? 
            AND vt.type = 'email_confirmation'
            AND vt.used = FALSE 
            AND vt.expires_at > NOW()
          LIMIT 1
        `;

        this.mysqlConnector.query(sql, [token, userId], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.length > 0 ? results[0] : null);
          }
        });
      });

      if (!tokenData) {
        console.warn('⚠️ Token non trouvé ou expiré:', { 
          token: token.substring(0, 8) + '...', 
          userId 
        });
        return {
          success: false,
          message: 'Token invalide, expiré ou déjà utilisé'
        };
      }

      // VÉRIFICATION HASH : Reconstruire le hash et comparer
      if (tokenData.token_hash) {
        // Extraire le timestamp du hash original (approximatif)
        const storedHash = tokenData.token_hash;
        
        // Vérifier avec plusieurs combinaisons possibles de timestamp
        let hashValid = false;
        const currentTime = Date.now();
        const createdTime = new Date(tokenData.created_at).getTime();
        
        // Tester avec le timestamp de création et quelques variations
        const timestampsToTest = [
          createdTime,
          Math.floor(createdTime / 1000) * 1000, // Arrondi à la seconde
          Math.floor(createdTime / 60000) * 60000 // Arrondi à la minute
        ];
        
        for (const testTimestamp of timestampsToTest) {
          const testCombinedData = `${userId}:${token}:${testTimestamp}`;
          const testHash = crypto.createHash('sha256').update(testCombinedData).digest('hex');
          
          if (testHash === storedHash) {
            hashValid = true;
            console.log('✅ Hash validé avec timestamp:', testTimestamp);
            break;
          }
        }
        
        if (!hashValid) {
          console.error('❌ Hash invalide - tentative de manipulation détectée');
          console.error('Hash stocké:', storedHash.substring(0, 16) + '...');
          console.error('UserId fourni:', userId);
          console.error('Token fourni:', token.substring(0, 8) + '...');
          
          return {
            success: false,
            message: 'Token compromis ou manipulé'
          };
        }
      } else {
        console.warn('⚠️ Token sans hash - ancienne version');
        // Permettre la validation pour compatibilité avec anciens tokens
      }

      console.log('✅ Token et hash valides:', {
        utilisateurId: tokenData.utilisateur_id,
        email: tokenData.email,
        userId: tokenData.user_id_string
      });

      // Marquer l'email comme vérifié et le token comme utilisé
      await new Promise<void>((resolve, reject) => {
        const updateSql = `
          UPDATE utilisateurs u, validation_tokens vt
          SET 
            u.email_verified = TRUE,
            u.email_verified_at = NOW(),
            vt.used = TRUE,
            vt.used_at = NOW()
          WHERE u.id = ? AND vt.token = ?
        `;

        this.mysqlConnector.query(updateSql, [tokenData.utilisateur_id, token], (error, results) => {
          if (error) {
            reject(error);
          } else {
            console.log('✅ Email marqué comme vérifié et token utilisé');
            resolve();
          }
        });
      });

      return {
        success: true,
        message: 'Email vérifié avec succès',
        utilisateurId: tokenData.utilisateur_id,
        data: {
          email: tokenData.email,
          userId: tokenData.user_id_string,
          prenom: tokenData.first_name,
          nom: tokenData.last_name
        }
      };

    } catch (error: any) {
      console.error('❌ Erreur lors de la validation du token:', error);
      return {
        success: false,
        message: 'Erreur lors de la validation du token'
      };
    }
  }

  // MÉTHODE MISE À JOUR: Envoyer l'email de vérification avec hash sécurisé
  async sendValidationEmailWithUserId(options: {
    email: string;
    prenom: string;
    nom: string;
    userId: string;
    utilisateurId: number;
  }): Promise<{ success: boolean; message: string; details?: any }> {
    await this.ensureInitialized();

    try {
      console.log('📧 [EmailValidationService] Envoi email de vérification avec hash sécurisé:', options.userId);

      // Assurer que emailService est initialisé
      if (!this.emailService) {
        await this.initEmailService();
      }

      if (!this.emailService) {
        throw new Error('EmailService non disponible');
      }

      // Créer le token de validation avec hash
      const { token: validationToken, hashedToken } = await this.createEmailValidationTokenWithUserId(
        options.utilisateurId,
        options.userId
      );

      console.log('✅ Token de validation créé avec hash:', {
        token: validationToken.substring(0, 8) + '...',
        hash: hashedToken.substring(0, 8) + '...'
      });

      // Créer le lien de vérification
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const verificationLink = `${frontendUrl}/pages/verify-email?token=${validationToken}&userId=${options.userId}`;

      // Créer le contenu de l'email de validation
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">🥋 Club Manager</h1>
              <h2 style="color: #3498db; margin: 10px 0 0 0; font-size: 22px;">Vérification d'email</h2>
            </div>
            
            <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
                Bonjour <strong>${options.prenom}</strong>,
              </p>
              <p style="margin: 15px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
                Bienvenue au Club Manager ! Pour finaliser votre inscription, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous.
              </p>
            </div>

            <div style="background-color: #3498db; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0 0 15px 0; color: white;">📋 Vos informations</h3>
              <div style="background-color: rgba(255,255,255,0.2); padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p style="margin: 5px 0; color: white;"><strong>👤 Nom :</strong> ${options.prenom} ${options.nom}</p>
                <p style="margin: 5px 0; color: white;"><strong>📧 Email :</strong> ${options.email}</p>
                <p style="margin: 5px 0; color: white;"><strong>🆔 UserId :</strong></p>
                <p style="margin: 5px 0; font-size: 24px; font-family: monospace; color: #fff; background-color: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; display: inline-block;">${options.userId}</p>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 3px 6px rgba(0,0,0,0.2);">
                ✉️ Vérifier mon email
              </a>
            </div>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">🔐 Sécurité</h4>
              <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px;">
                <li>Ce lien de validation est unique et sécurisé</li>
                <li>Il expire dans <strong>24 heures</strong></li>
                <li>Une fois validé, vous pourrez vous connecter avec votre UserId</li>
              </ul>
            </div>

            <div style="border-top: 1px solid #bdc3c7; padding-top: 20px; margin-top: 30px; color: #7f8c8d; font-size: 12px; text-align: center;">
              <p style="margin: 10px 0 0 0;"><strong>L'équipe Club Manager</strong></p>
            </div>
          </div>
        </div>
      `;

      // Envoyer l'email avec EmailService
      const result = await this.emailService.envoyerMessage({
        to: options.email,
        subject: '✉️ Vérifiez votre email - Club Manager',
        message: emailContent,
        isHtml: true,
        saveToDb: true,
        utilisateurId: options.utilisateurId
      });

      if (result.success) {
        console.log('✅ Email de vérification envoyé avec token hashé');
        return {
          success: true,
          message: 'Email de vérification envoyé avec succès',
          details: {
            messageId: result.messageId,
            userId: options.userId,
            email: options.email,
            tokenGenerated: true,
            hashSecurity: true
          }
        };
      } else {
        console.error('❌ Échec envoi email de vérification:', result);
        return {
          success: false,
          message: 'Erreur lors de l\'envoi de l\'email'
        };
      }
    } catch (error: any) {
      console.error('❌ Erreur dans sendValidationEmailWithUserId:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // NOUVELLE MÉTHODE: Envoyer l'email de récupération d'UserId
  async sendUserIdRecovery(email: string): Promise<{ success: boolean; message: string }> {
    await this.ensureInitialized();

    try {
      // Utiliser la procédure existante pour récupérer l'UserId
      return new Promise((resolve, reject) => {
        this.mysqlConnector.query('CALL recuperer_userId(?)', [email], async (error, results) => {
          if (error) {
            if (error.message.includes('Aucun compte trouvé')) {
              resolve({
                success: false,
                message: 'Aucun compte trouvé avec cet email'
              });
            } else {
              reject(error);
            }
          } else {
            // Récupérer les informations utilisateur
            const userSql = `
              SELECT userId, first_name, id FROM utilisateurs WHERE email = ? LIMIT 1
            `;
            
            this.mysqlConnector.query(userSql, [email], async (userError, userResults) => {
              if (userError) {
                reject(userError);
              } else if (userResults.length === 0) {
                resolve({
                  success: false,
                  message: 'Utilisateur non trouvé'
                });
              } else {
                const user = userResults[0];
                
                // Assurer que emailService est initialisé
                if (!this.emailService) {
                  await this.initEmailService();
                }

                if (!this.emailService) {
                  throw new Error('EmailService non disponible');
                }

                // Créer le contenu de l'email de récupération
                const emailContent = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">🥋 Club Manager</h1>
                        <h2 style="color: #3498db; margin: 10px 0 0 0; font-size: 22px;">Récupération UserId</h2>
                      </div>
                      
                      <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
                          Bonjour <strong>${user.first_name}</strong>,
                        </p>
                        <p style="margin: 15px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
                          Vous avez demandé la récupération de votre identifiant de connexion. Voici vos informations :
                        </p>
                      </div>

                      <div style="background-color: #3498db; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <h3 style="margin: 0 0 15px 0; color: white;">🆔 Votre UserId</h3>
                        <div style="background-color: rgba(255,255,255,0.2); padding: 15px; border-radius: 5px; margin: 15px 0;">
                          <p style="margin: 5px 0; font-size: 24px; font-family: monospace; color: #fff; background-color: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; display: inline-block;">${user.userId}</p>
                        </div>
                        <p style="margin: 10px 0 0 0; color: white; font-size: 14px;">Utilisez cet identifiant pour vous connecter</p>
                      </div>

                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/pages/connexion" 
                           style="background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 3px 6px rgba(0,0,0,0.2);">
                          🚀 Se connecter maintenant
                        </a>
                      </div>

                      <div style="border-top: 1px solid #bdc3c7; padding-top: 20px; margin-top: 30px; color: #7f8c8d; font-size: 12px; text-align: center;">
                        <p style="margin: 10px 0 0 0;"><strong>L'équipe Club Manager</strong></p>
                        <p style="margin: 5px 0 0 0;">Si vous n'avez pas demandé cette récupération, ignorez cet email.</p>
                      </div>
                    </div>
                  </div>
                `;

                // Envoyer l'email de récupération
                const emailResult = await this.emailService.envoyerMessage({
                  to: email,
                  subject: '🔑 Récupération UserId - Club Manager',
                  message: emailContent,
                  isHtml: true,
                  saveToDb: true,
                  utilisateurId: user.id
                });

                resolve({
                  success: emailResult.success,
                  message: emailResult.success 
                    ? 'Email de récupération envoyé' 
                    : emailResult.error || 'Erreur envoi email'
                });
              }
            });
          }
        });
      });
    } catch (error: any) {
      console.error('❌ Erreur récupération UserId:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // NOUVELLE MÉTHODE: Mettre à jour la structure de la table pour inclure le hash
  async ensureValidationTokensTableStructure(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Ajouter les colonnes nécessaires si elles n'existent pas
      const alterTableSql = `
        ALTER TABLE validation_tokens 
        ADD COLUMN IF NOT EXISTS user_id_string VARCHAR(50) NULL AFTER token,
        ADD COLUMN IF NOT EXISTS used_at TIMESTAMP NULL AFTER used,
        ADD COLUMN IF NOT EXISTS token_hash VARCHAR(64) NULL AFTER user_id_string,
        ADD INDEX IF NOT EXISTS idx_user_id_string (user_id_string),
        ADD INDEX IF NOT EXISTS idx_token_userid (token, user_id_string),
        ADD INDEX IF NOT EXISTS idx_token_hash (token_hash)
      `;

      this.mysqlConnector.query(alterTableSql, [], (error, results) => {
        if (error) {
          console.warn('⚠️ Impossible de modifier la table validation_tokens:', error.message);
          // Ne pas rejeter, la table peut déjà avoir la bonne structure
          resolve();
        } else {
          console.log('✅ Structure table validation_tokens vérifiée/mise à jour avec hash');
          resolve();
        }
      });
    });
  }

  // Récupérer les informations d'un utilisateur
  private async getUserById(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, userId, first_name, last_name, email
        FROM utilisateurs
        WHERE id = ?
        LIMIT 1
      `;

      this.mysqlConnector.query(sql, [id], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.length > 0 ? results[0] : null);
        }
      });
    });
  }

  // Nettoyer les tokens expirés
  async cleanupExpiredTokens(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        DELETE FROM validation_tokens
        WHERE expires_at < NOW()
      `;
      this.mysqlConnector.query(sql, [], (error, result: any) => {
        if (error) {
          console.error('❌ Erreur lors du nettoyage des tokens expirés:', error);
          reject(error);
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

}

// Export sans initialisation automatique
export const emailValidationService = new EmailValidationService();
