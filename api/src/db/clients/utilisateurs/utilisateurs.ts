import MysqlConnector from "../../connector/mysqlconnector.js";
import {
  UserData,
  InsertResult,
  UserDataLogin,
  UserDataSession,
  VerifyResult,
  VerifyResultWithData,
  ConfirmationResult,
  UserDataAjout,
} from "@clubmanager/types";
import bcrypt from "bcrypt";
import { UserIdGenerator } from "../../../utils/userIdGenerator.js"; // Correction du chemin d'import

export class Utilisateurs {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // Vérifie si un utilisateur existe par email
  async checkUtilisateurByEmail(email: string): Promise<VerifyResult> {
    const sql = `SELECT id FROM utilisateurs WHERE email = ? AND active = TRUE LIMIT 1`;
    return new Promise<VerifyResult>((resolve, reject) => {
      this.mysqlConnector.query(sql, [email], (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        if (results.length > 0) {
          resolve({ isFind: true, message: "Utilisateur déjà existant" });
        } else {
          resolve({ isFind: false, message: "Utilisateur non trouvé" });
        }
      });
    });
  }

  // Inscription d'un utilisateur (version simple, à adapter selon tes besoins)
  async inscriptionUtilisateurSimple(data: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    date: string;
    abonnement: string | number;
    genre: string | number;
  }): Promise<ConfirmationResult> {
    return new Promise(async (resolve, reject) => {
      try {
        // Générer automatiquement le nom_utilisateur si nécessaire
        const prenom = data.prenom.toLowerCase().replace(/\s+/g, "");
        const nom = data.nom.toLowerCase().replace(/\s+/g, "");
        const timestamp = Date.now().toString().slice(-4);
        const nom_utilisateur = `${prenom}_${nom}_${timestamp}`;

        // Utiliser le mot de passe fourni (déjà hashé par le service) ou hasher le défaut
        let passwordToUse = data.password || "password123";

        // Si le mot de passe ne ressemble pas à un hash bcrypt, le hasher
        // Les hash bcrypt commencent par $2a$, $2b$ ou $2y$
        const isBcryptHash = /^\$2[aby]\$/.test(passwordToUse);
        const hashedPassword = isBcryptHash
          ? passwordToUse
          : await bcrypt.hash(passwordToUse, 10);

        // Générer l'userId unique
        const userId = await this.genererUserIdUnique({
          prenom: data.prenom,
          nom: data.nom,
          date_naissance: data.date,
          email: data.email,
        });

        console.log("[inscriptionUtilisateurSimple] UserId généré:", userId);
        console.log(
          "[inscriptionUtilisateurSimple] Mot de passe:",
          isBcryptHash ? "déjà hashé (bcrypt)" : "hashé maintenant",
        );

        // Normaliser l'email en lowercase
        const normalizedEmail = data.email.toLowerCase();

        const sql = `
          INSERT INTO utilisateurs (userId, first_name, last_name, nom_utilisateur, email, password, date_of_birth, abonnement_id, genre_id, status_id, active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, TRUE)
        `;

        this.mysqlConnector.query(
          sql,
          [
            userId,
            data.prenom,
            data.nom,
            nom_utilisateur, // Nom d'utilisateur généré automatiquement
            normalizedEmail, // Email normalisé en lowercase
            hashedPassword, // Mot de passe hashé (par défaut ou fourni)
            data.date,
            data.abonnement,
            data.genre,
          ],
          (error, results) => {
            if (error) {
              console.error("[inscriptionUtilisateurSimple] Erreur SQL:", {
                code: error.code,
                errno: error.errno,
                message: error.message,
                email: normalizedEmail,
              });

              // Gérer spécifiquement les erreurs de duplicate (race condition)
              // Vérifier à la fois le code et errno pour plus de robustesse
              if (
                error.code === "ER_DUP_ENTRY" ||
                error.errno === 1062 ||
                (error.message && error.message.includes("Duplicate entry"))
              ) {
                console.warn(
                  "[inscriptionUtilisateurSimple] ✅ Duplicate détecté correctement pour:",
                  normalizedEmail,
                );
                resolve({
                  isConfirm: false,
                  message: "Cet email est déjà utilisé",
                  userId: undefined,
                  generatedUserId: undefined,
                  data: undefined,
                });
              } else {
                console.error(
                  "[inscriptionUtilisateurSimple] Erreur non gérée:",
                  error,
                );
                reject(error);
              }
            } else {
              // SUPPRIMEZ COMPLÈTEMENT CES LIGNES (367-371) :
              // try {
              //   await this.creerTokenValidationEmail(results.insertId, userData.email, userId);
              //   console.log('[DB] Token de validation email créé avec succès');
              // } catch (tokenError: any) {
              //   console.warn('[DB] Erreur création token validation (non bloquant):', tokenError.message);
              // }

              // AJOUTEZ JUSTE UN LOG :
              console.log(
                "[DB] ✅ Inscription utilisateur terminée - Email sera géré par EmailClient",
              );

              const resultData = {
                isConfirm: true,
                message: `Utilisateur inscrit avec succès.`,
                userId: results.insertId,
                generatedUserId: userId,
                data: {
                  id: results.insertId,
                  userId: userId,
                  prenom: data.prenom,
                  nom: data.nom,
                  nom_utilisateur: nom_utilisateur,
                  email: normalizedEmail,
                  date_naissance: data.date,
                  abonnement_id: data.abonnement,
                  genre_id: data.genre,
                  status_id: 1,
                  active: true,
                },
              };

              resolve(resultData);
            }
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  verifierUtilisateur(utilisateurData: UserData): Promise<VerifyResult> {
    return new Promise<VerifyResult>((resolve, reject) => {
      const sql = `
        SELECT * FROM utilisateurs
        WHERE (email = ? OR nom_utilisateur = ?) AND active = TRUE
      `;

      const values = [utilisateurData.email, utilisateurData.nom_utilisateur];

      console.log("Exécution de la requête :", sql, values);

      this.mysqlConnector.query(sql, values, (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de l'exécution de la requête :",
            error.message,
          );
          reject(error);
          return;
        }

        if (results.length > 0) {
          console.log("Utilisateur trouvé :", results);
          resolve({ isFind: true, message: "Utilisateur trouvé" });
        } else {
          console.log("Aucun utilisateur trouvé.");
          resolve({ isFind: false, message: "Utilisateur non trouvé" });
        }
      });
    });
  }

  async inscrireUtilisateur(userData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log("[DB] Données reçues pour inscription:", userData);

      // 🔧 CORRIGÉ: Mapper les champs du frontend vers les champs attendus
      const mappedUserData = {
        first_name: userData.prenom, // prenom → first_name
        last_name: userData.nom, // nom → last_name
        nom_utilisateur: userData.nom_utilisateur,
        email: userData.email,
        password: userData.password,
        genre_id: userData.genre_id,
        abonnement_id: userData.abonnement_id,
        date_of_birth: userData.date_naissance, // date_naissance → date_of_birth
        date_inscription: userData.date_inscription,
        status_id: userData.status_id,
        grade_id: userData.grade_id,
      };

      console.log("[DB] Données mappées pour traitement:", mappedUserData);

      // VALIDATION SERVEUR RENFORCÉE
      const birthDate = new Date(mappedUserData.date_of_birth);
      const today = new Date();

      // Réinitialiser les heures
      today.setHours(23, 59, 59, 999);
      birthDate.setHours(0, 0, 0, 0);

      // Validation stricte côté serveur
      if (birthDate >= today) {
        reject(
          new Error(
            "Date de naissance invalide: ne peut pas être dans le futur ou aujourd'hui",
          ),
        );
        return;
      }

      // VÉRIFICATION STRICTE ÂGE MINIMUM: 5 ans révolus EXACTEMENT
      const cinqAnsAujourdHui = new Date();
      cinqAnsAujourdHui.setFullYear(today.getFullYear() - 5);
      cinqAnsAujourdHui.setHours(23, 59, 59, 999);

      if (birthDate > cinqAnsAujourdHui) {
        const ageInMs = today.getTime() - birthDate.getTime();
        const ageInYears = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365.25));

        reject(
          new Error(
            `Âge insuffisant: ${ageInYears} an(s). L'âge minimum requis est de 5 ans révolus pour s'inscrire.`,
          ),
        );
        return;
      }

      // Vérification âge maximum (100 ans)
      const maxAgeDate = new Date();
      maxAgeDate.setFullYear(today.getFullYear() - 100);

      if (birthDate < maxAgeDate) {
        reject(new Error("Date de naissance trop ancienne (maximum 100 ans)"));
        return;
      }

      // Validation année minimum (1900)
      if (birthDate.getFullYear() < 1900) {
        reject(new Error("Date de naissance non valide (minimum année 1900)"));
        return;
      }

      // 🔧 CORRIGÉ: Utiliser les champs mappés pour la vérification
      this.verifierUtilisateurExiste({
        nom: mappedUserData.last_name,
        prenom: mappedUserData.first_name,
        date_naissance: mappedUserData.date_of_birth,
      })
        .then(() => {
          // Aucun doublon trouvé, procéder à l'inscription
          this.procederInscription(mappedUserData, resolve, reject);
        })
        .catch((conflictError) => {
          // Doublon trouvé
          reject(
            new Error(
              conflictError.message ||
                "Une personne avec ces informations existe déjà.",
            ),
          );
        });
    });
  }

  // 🔧 CORRIGÉ: Méthode pour générer un userId unique avec mapping correct
  private async genererUserIdUnique(userData: any): Promise<string> {
    try {
      // Support both formats: prenom/nom AND first_name/last_name
      const prenom = userData.prenom || userData.first_name;
      const nom = userData.nom || userData.last_name;
      const dateNaissance = userData.date_naissance || userData.date_of_birth;

      console.log("[UserIdGenerator] Données reçues pour génération userId:", {
        prenom,
        nom,
        date_naissance: dateNaissance,
        email: userData.email,
      });

      // 🔧 CORRIGÉ: Passer les données dans le bon format pour UserIdGenerator
      const userDataForGenerator = {
        prenom: prenom,
        nom: nom,
        date_naissance: dateNaissance,
        email: userData.email,
      };

      console.log(
        "[UserIdGenerator] Données formatées pour générateur:",
        userDataForGenerator,
      );

      let attempt = 0;
      let userId: string = ""; // 🔧 CORRIGÉ: Initialiser la variable
      let exists = true;

      while (exists && attempt < 10) {
        // Limite pour éviter les boucles infinies
        userId = UserIdGenerator.generateUserId(userDataForGenerator, attempt);

        console.log(
          `[UserIdGenerator] Tentative ${attempt + 1}: userId généré = ${userId}`,
        );

        // Vérifier si l'userId existe déjà
        const checkSql =
          "SELECT COUNT(*) as count FROM utilisateurs WHERE userId = ?";
        const checkResult = await new Promise<number>((resolve, reject) => {
          this.mysqlConnector.query(
            checkSql,
            [userId],
            (error: any, results: any[]) => {
              if (error) {
                console.error(
                  "[UserIdGenerator] Erreur vérification existence userId:",
                  error,
                );
                reject(error);
              } else {
                console.log(
                  `[UserIdGenerator] Vérification existence pour ${userId}: ${results[0].count} résultat(s)`,
                );
                resolve(results[0].count);
              }
            },
          );
        });

        exists = checkResult > 0;
        if (exists) {
          console.log(
            `[UserIdGenerator] UserId ${userId} déjà existant, nouvelle tentative...`,
          );
          attempt++;
        }
      }

      if (attempt >= 10) {
        throw new Error(
          "Impossible de générer un userId unique après 10 tentatives",
        );
      }

      // 🔧 CORRIGÉ: Vérifier que userId a bien été assigné
      if (!userId) {
        throw new Error("Erreur inattendue: userId non généré");
      }

      console.log(
        `[UserIdGenerator] UserId unique généré avec succès: ${userId}`,
      );
      return userId;
    } catch (error: any) {
      console.error(
        "[UserIdGenerator] Erreur lors de la génération userId:",
        error,
      );
      throw error;
    }
  }

  // 🔧 CORRIGÉ: Méthode pour générer un userId unique avec vérification DB (version alternative plus claire)
  private async genererUserIdUniqueOLD(userData: any): Promise<string> {
    let attempt = 0;
    let userId: string;
    let exists = true;

    while (exists && attempt < 10) {
      // Limite pour éviter les boucles infinies
      userId = UserIdGenerator.generateUserId(
        {
          prenom: userData.first_name, // Utiliser first_name
          nom: userData.last_name, // Utiliser last_name
          date_naissance: userData.date_of_birth, // Utiliser date_of_birth
          email: userData.email,
        },
        attempt,
      );

      // Vérifier si l'userId existe déjà
      const checkSql =
        "SELECT COUNT(*) as count FROM utilisateurs WHERE userId = ?";
      const checkResult = await new Promise<number>((resolve, reject) => {
        this.mysqlConnector.query(
          checkSql,
          [userId],
          (error: any, results: any[]) => {
            if (error) reject(error);
            else resolve(results[0].count);
          },
        );
      });

      exists = checkResult > 0;
      if (exists) attempt++;
    }

    if (attempt >= 10) {
      throw new Error(
        "Impossible de générer un userId unique après 10 tentatives",
      );
    }

    // 🔧 CORRIGÉ: À ce point, userId est forcément assigné ou on a déjà levé une exception
    return userId!; // Le "!" indique à TypeScript qu'on sait que userId est défini
  }

  // 🔧 CORRIGÉ: Méthode pour procéder à l'inscription avec mapping correct
  private async procederInscription(
    userData: any,
    resolve: Function,
    reject: Function,
  ): Promise<void> {
    try {
      // Utiliser le mot de passe par défaut si aucun mot de passe n'est fourni
      const passwordToUse = userData.password || "password123";
      const hashedPassword = bcrypt.hashSync(passwordToUse, 10);

      // Générer l'userId unique avec les données correctement mappées
      const userId = await this.genererUserIdUnique(userData);

      console.log("[DB] UserId généré:", userId);
      console.log(
        "[DB] Mot de passe utilisé:",
        passwordToUse === "password123"
          ? "password123 (défaut)"
          : "mot de passe fourni",
      );

      console.log("[DB] Données finales pour insertion:", {
        userId,
        first_name: userData.first_name,
        last_name: userData.last_name,
        nom_utilisateur: userData.nom_utilisateur,
        email: userData.email,
        genre_id: userData.genre_id,
        abonnement_id: userData.abonnement_id,
        date_of_birth: userData.date_of_birth,
        date_inscription: userData.date_inscription,
        status_id: userData.status_id,
        grade_id: userData.grade_id,
      });

      const sql = `
        INSERT INTO utilisateurs (
          userId, first_name, last_name, nom_utilisateur, email, password,
          genre_id, abonnement_id, date_of_birth, date_inscription,
          status_id, grade_id, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
      `;

      const values = [
        userId,
        userData.first_name,
        userData.last_name,
        userData.nom_utilisateur,
        userData.email,
        hashedPassword,
        userData.genre_id,
        userData.abonnement_id,
        userData.date_of_birth,
        userData.date_inscription,
        userData.status_id,
        userData.grade_id,
      ];

      this.mysqlConnector.query(
        sql,
        values,
        async (error: any, results: any) => {
          if (error) {
            console.error("[DB] Erreur lors de l'inscription:", error.message);
            reject(new Error("Erreur lors de l'inscription: " + error.message));
          } else {
            console.log(
              "[DB] Inscription réussie, ID:",
              results.insertId,
              "UserId:",
              userId,
            );

            // ✅ SUPPRESSION COMPLÈTE - Plus d'appel à creerTokenValidationEmail()
            console.log(
              "[DB] ✅ Inscription utilisateur terminée - Email sera géré par EmailClient",
            );

            const resultData = {
              isConfirm: true,
              message: `Utilisateur inscrit avec succès.`,
              userId: results.insertId,
              generatedUserId: userId,
              data: {
                id: results.insertId,
                userId: userId,
                prenom: userData.first_name,
                nom: userData.last_name,
                nom_utilisateur: userData.nom_utilisateur,
                email: userData.email,
                date_naissance: userData.date_of_birth,
                abonnement_id: userData.abonnement_id,
                genre_id: userData.genre_id,
                status_id: userData.status_id,
                active: true,
              },
            };

            resolve(resultData);
          }
        },
      );
    } catch (error) {
      console.error(
        "[DB] Erreur lors de la génération userId ou insertion:",
        error,
      );
      reject(error);
    }
  }

  // ✅ SUPPRESSION COMPLÈTE des 4 méthodes problématiques :
  // - creerTokenValidationEmail()
  // - envoyerEmailValidation()
  // - envoyerEmailValidationDirectSendGrid()
  // - genererTemplateEmailValidation()
  // Ces méthodes généraient le premier token qui causait le conflit !

  verifierUtilisateurExiste(userData: {
    nom: string;
    prenom: string;
    date_naissance: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log("[DB] Vérification utilisateur avec:", userData);

      const sql = `
        SELECT id, userId, first_name, last_name, email, date_of_birth
        FROM utilisateurs
        WHERE LOWER(TRIM(last_name)) = LOWER(TRIM(?))
        AND LOWER(TRIM(first_name)) = LOWER(TRIM(?))
        AND DATE(date_of_birth) = DATE(?)
        AND active = TRUE
        LIMIT 1
      `;

      this.mysqlConnector.query(
        sql,
        [userData.nom, userData.prenom, userData.date_naissance],
        (error: any, results: any[]) => {
          if (error) {
            console.error(
              "[DB] Erreur lors de la vérification utilisateur:",
              error.message,
            );
            reject(error);
          } else {
            console.log("[DB] Résultats vérification:", results);

            if (results.length > 0) {
              // Utilisateur trouvé - conflit
              const utilisateurExistant = results[0];
              reject({
                status: 409,
                message: `Une personne nommée ${userData.prenom} ${userData.nom} née le ${new Date(userData.date_naissance).toLocaleDateString("fr-FR")} est déjà inscrite (ID: ${utilisateurExistant.userId}).`,
                data: {
                  id: utilisateurExistant.id,
                  userId: utilisateurExistant.userId,
                  nom: utilisateurExistant.last_name,
                  prenom: utilisateurExistant.first_name,
                  email: utilisateurExistant.email,
                  date_naissance: utilisateurExistant.date_of_birth,
                },
              });
            } else {
              // Aucun utilisateur trouvé - OK pour l'inscription
              resolve({
                message:
                  "Aucun utilisateur trouvé avec ces informations. Inscription possible.",
                canRegister: true,
              });
            }
          }
        },
      );
    });
  }

  // Mettre à jour la validation connexion avec support du flag active et userId
  async validerConnexion(
    utilisateurData: UserDataLogin,
  ): Promise<UserDataSession> {
    const sql = `
      SELECT id, userId, first_name, last_name, nom_utilisateur, email, date_of_birth, status_id, grade_id, abonnement_id, password, active
      FROM utilisateurs
      WHERE email = ? AND active = TRUE
    `;

    const values = [utilisateurData.email];
    console.log("Validation connexion pour :", utilisateurData.email);

    return new Promise<UserDataSession>((resolve, reject) => {
      this.mysqlConnector.query(sql, values, async (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la vérification de l'utilisateur :",
            error.message,
          );
          reject(error);
          return;
        }

        if (results.length > 0) {
          const utilisateur = results[0];

          if (!utilisateur.active) {
            console.log("Compte utilisateur désactivé");
            resolve({
              isFind: false,
              message:
                "Votre compte a été désactivé. Contactez l'administration.",
              dataToStore: {
                id: null,
                prenom: "",
                nom: "",
                nom_utilisateur: "",
                email: "",
                date_naissance: "",
                status_id: 0,
                grade_id: null,
                abonnement_id: null,
              },
            });
            return;
          }

          // Vérifie le mot de passe hashé OU le mot de passe par défaut
          let isMatch = false;

          // 1. Vérifier d'abord le mot de passe par défaut
          if (utilisateurData.password === "password123") {
            console.log("Connexion avec mot de passe par défaut autorisée");
            isMatch = true;
          } else {
            // 2. Sinon vérifier le mot de passe hashé
            isMatch = await bcrypt.compare(
              utilisateurData.password,
              utilisateur.password,
            );
          }

          if (isMatch) {
            console.log("Utilisateur trouvé avec succès.");
            resolve({
              isFind: true,
              message:
                utilisateurData.password === "password123"
                  ? "Connexion réussie avec mot de passe temporaire. Pensez à le changer."
                  : "Utilisateur trouvé avec succès.",
              dataToStore: {
                id: utilisateur.id,
                userId: utilisateur.userId,
                prenom: utilisateur.first_name,
                nom: utilisateur.last_name,
                nom_utilisateur: utilisateur.nom_utilisateur,
                email: utilisateur.email,
                date_naissance: utilisateur.date_of_birth,
                status_id: utilisateur.status_id,
                grade_id: utilisateur.grade_id,
                abonnement_id: utilisateur.abonnement_id,
              },
            });
          } else {
            console.log("Mot de passe incorrect");
            resolve({
              isFind: false,
              message: "Mot de passe incorrect.",
              dataToStore: {
                id: null,
                prenom: "",
                nom: "",
                nom_utilisateur: "",
                email: "",
                date_naissance: "",
                status_id: 0,
                grade_id: null,
                abonnement_id: null,
              },
            });
          }
        } else {
          console.log("Aucun utilisateur actif trouvé avec cet email");
          resolve({
            isFind: false,
            message:
              "Aucun utilisateur trouvé avec cet email ou compte désactivé.",
            dataToStore: {
              id: null,
              prenom: "",
              nom: "",
              nom_utilisateur: "",
              email: "",
              date_naissance: "",
              status_id: 0,
              grade_id: null,
              abonnement_id: null,
            },
          });
        }
      });
    });
  }

  // NOUVELLE méthode de connexion par userId
  async validerConnexionParUserId(
    userId: string,
    password: string,
  ): Promise<UserDataSession> {
    const sql = `
      SELECT id, userId, first_name, last_name, nom_utilisateur, email, date_of_birth, status_id, grade_id, abonnement_id, password, active
      FROM utilisateurs
      WHERE userId = ? AND active = TRUE
    `;

    console.log("Validation connexion pour userId :", userId);

    return new Promise<UserDataSession>((resolve, reject) => {
      this.mysqlConnector.query(sql, [userId], async (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la vérification de l'utilisateur :",
            error.message,
          );
          reject(error);
          return;
        }

        if (results.length > 0) {
          const utilisateur = results[0];

          if (!utilisateur.active) {
            console.log("Compte utilisateur désactivé");
            resolve({
              isFind: false,
              message:
                "Votre compte a été désactivé. Contactez l'administration.",
              dataToStore: {
                id: null,
                prenom: "",
                nom: "",
                nom_utilisateur: "",
                email: "",
                date_naissance: "",
                status_id: 0,
                grade_id: null,
                abonnement_id: null,
              },
            });
            return;
          }

          // Vérification du mot de passe (temporaire "password123" ou hashé)
          let isMatch = false;

          if (password === "password123") {
            console.log("Connexion avec mot de passe temporaire autorisée");
            isMatch = true;
          } else {
            isMatch = await bcrypt.compare(password, utilisateur.password);
          }

          if (isMatch) {
            console.log("Utilisateur connecté avec succès via userId.");
            resolve({
              isFind: true,
              message:
                password === "password123"
                  ? "Connexion réussie avec mot de passe temporaire. Pensez à le changer."
                  : "Connexion réussie.",
              dataToStore: {
                id: utilisateur.id,
                userId: utilisateur.userId,
                prenom: utilisateur.first_name,
                nom: utilisateur.last_name,
                nom_utilisateur: utilisateur.nom_utilisateur,
                email: utilisateur.email,
                date_naissance: utilisateur.date_of_birth,
                status_id: utilisateur.status_id,
                grade_id: utilisateur.grade_id,
                abonnement_id: utilisateur.abonnement_id,
              },
            });
          } else {
            console.log("Mot de passe incorrect pour userId:", userId);
            resolve({
              isFind: false,
              message: "ID utilisateur ou mot de passe incorrect.",
              dataToStore: {
                id: null,
                prenom: "",
                nom: "",
                nom_utilisateur: "",
                email: "",
                date_naissance: "",
                status_id: 0,
                grade_id: null,
                abonnement_id: null,
              },
            });
          }
        } else {
          console.log(
            "Aucun utilisateur actif trouvé avec cet userId:",
            userId,
          );
          resolve({
            isFind: false,
            message: "ID utilisateur ou mot de passe incorrect.",
            dataToStore: {
              id: null,
              prenom: "",
              nom: "",
              nom_utilisateur: "",
              email: "",
              date_naissance: "",
              status_id: 0,
              grade_id: null,
              abonnement_id: null,
            },
          });
        }
      });
    });
  }

  // NOUVELLE méthode pour rechercher des utilisateurs par email (pour la sélection) - VERSION FAMILLE
  async rechercherUtilisateursParEmail(email: string): Promise<{
    utilisateurs: Array<{
      userId: string;
      prenom: string;
      nom: string;
      date_naissance: string;
      nom_utilisateur: string;
      age: number;
      initiales: string;
      relation_familiale?: string;
      est_responsable?: boolean;
    }>;
  }> {
    const sql = `
      SELECT
        userId,
        first_name,
        last_name,
        date_of_birth,
        nom_utilisateur,
        YEAR(CURDATE()) - YEAR(date_of_birth) - (DATE_FORMAT(CURDATE(), '%m-%d') < DATE_FORMAT(date_of_birth, '%m-%d')) AS age,
        genre_id,
        status_id
      FROM utilisateurs
      WHERE email = ? AND active = TRUE
      ORDER BY date_of_birth ASC, first_name ASC
    `;

    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(sql, [email], (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la recherche par email :",
            error.message,
          );
          reject(error);
          return;
        }

        const utilisateurs = results.map((row: any, index: number) => {
          const age = row.age;
          const prenom = row.first_name;
          const nom = row.last_name;

          // Déterminer la relation familiale basée sur l'âge et l'ordre
          let relation_familiale = "";
          let est_responsable = false;

          if (age >= 18) {
            if (index === 0) {
              relation_familiale = "Parent/Responsable";
              est_responsable = true;
            } else {
              relation_familiale = "Adulte de la famille";
            }
          } else if (age >= 13) {
            relation_familiale = "Adolescent(e)";
          } else {
            relation_familiale = "Enfant";
          }

          return {
            userId: row.userId,
            prenom: prenom,
            nom: nom,
            date_naissance: row.date_of_birth,
            nom_utilisateur: row.nom_utilisateur,
            age: age,
            initiales: `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase(),
            relation_familiale: relation_familiale,
            est_responsable: est_responsable,
          };
        });

        resolve({ utilisateurs });
      });
    });
  }

  // Obtenir tous les utilisateurs (seulement les actifs par défaut)
  obtenirTousLesUtilisateurs(
    includeInactive: boolean = false,
  ): Promise<VerifyResultWithData> {
    return new Promise<VerifyResultWithData>((resolve, reject) => {
      let sql = `SELECT * FROM utilisateurs`;
      if (!includeInactive) {
        sql += ` WHERE active = TRUE`;
      }
      sql += ` ORDER BY last_name, first_name`;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la récupération des utilisateurs :",
            error.message,
          );
          reject(error);
          return;
        }

        if (results.length > 0) {
          console.log("Utilisateurs trouvés avec succès.");

          const utilisateurs: UserData[] = results.map((result: any) => ({
            id: result.id,
            userId: result.userId,
            first_name: result.first_name,
            last_name: result.last_name,
            nom_utilisateur: result.nom_utilisateur,
            email: result.email,
            genre_id: result.genre_id,
            date_of_birth: result.date_of_birth,
            status_id: result.status_id,
            active: result.active,
            grade_id: result.grade_id,
            abonnement_id: result.abonnement_id,
            date_inscription: result.date_inscription,
          }));

          resolve({
            isFind: true,
            message: includeInactive
              ? "Tous les utilisateurs trouvés"
              : "Utilisateurs actifs trouvés",
            data: utilisateurs,
          });
        } else {
          console.log("Aucun utilisateur trouvé.");
          resolve({
            isFind: false,
            message: "Aucun utilisateur trouvé",
            data: [],
          });
        }
      });
    });
  }

  // Obtenir un utilisateur (vérifier qu'il est actif)
  obtenirUnUtilisateur(
    id?: number,
    includeInactive: boolean = false,
  ): Promise<VerifyResultWithData> {
    console.log(`[obtenirUnUtilisateur] Appel avec id =`, id);
    return new Promise<VerifyResultWithData>((resolve, reject) => {
      if (!id) {
        console.error(
          `[obtenirUnUtilisateur] L'identifiant est requis pour récupérer un utilisateur.`,
        );
        reject(
          new Error("L'identifiant est requis pour récupérer un utilisateur."),
        );
        return;
      }

      let sql = "SELECT * FROM utilisateurs WHERE id = ?";
      if (!includeInactive) {
        sql += " AND active = TRUE";
      }

      const values = [id];
      console.log(
        `[obtenirUnUtilisateur] Requête SQL :`,
        sql,
        "Paramètres :",
        values,
      );

      this.mysqlConnector.query(sql, values, (error, results) => {
        if (error) {
          console.error(
            "[obtenirUnUtilisateur] Erreur lors de la récupération de l'utilisateur :",
            error.message,
          );
          reject(error);
          return;
        }

        console.log(`[obtenirUnUtilisateur] Résultat brut :`, results);

        if (results.length > 0) {
          console.log("[obtenirUnUtilisateur] Utilisateur trouvé avec succès.");

          const utilisateur: UserData[] = results.map((result: any) => ({
            id: result.id,
            userId: result.userId,
            first_name: result.first_name,
            last_name: result.last_name,
            nom_utilisateur: result.nom_utilisateur,
            email: result.email,
            genre_id: result.genre_id,
            date_of_birth: result.date_of_birth,
            status_id: result.status_id,
            active: result.active,
            grade_id: result.grade_id,
            abonnement_id: result.abonnement_id,
          }));

          console.log(
            "[obtenirUnUtilisateur] Utilisateur formaté :",
            utilisateur,
          );

          resolve({
            isFind: true,
            message: "Utilisateur trouvé",
            data: utilisateur,
          });
        } else {
          console.log("[obtenirUnUtilisateur] Aucun utilisateur trouvé.");
          resolve({
            isFind: false,
            message: includeInactive
              ? "Aucun utilisateur trouvé"
              : "Aucun utilisateur actif trouvé",
            data: [],
          });
        }
      });
    });
  }

  // REMPLACER supprimerUtilisateur par désactiverUtilisateur
  desactiverUtilisateur(utilisateurId: number): Promise<ConfirmationResult> {
    console.log(
      `[desactiverUtilisateur] Requête de désactivation pour ID :`,
      utilisateurId,
    );

    return new Promise<ConfirmationResult>((resolve, reject) => {
      // D'abord vérifier que l'utilisateur existe et est actif
      this.mysqlConnector.query(
        "SELECT id, userId, first_name, last_name, active FROM utilisateurs WHERE id = ?",
        [utilisateurId],
        (selectError, selectResults) => {
          if (selectError) {
            console.error(
              "[desactiverUtilisateur] Erreur lors de la vérification :",
              selectError.message,
            );
            resolve({
              isConfirm: false,
              message: `Erreur lors de la vérification de l'utilisateur : ${selectError.message}`,
            });
            return;
          }

          if (selectResults.length === 0) {
            console.log(
              `[desactiverUtilisateur] Utilisateur avec ID ${utilisateurId} non trouvé`,
            );
            resolve({
              isConfirm: false,
              message: `Utilisateur avec ID ${utilisateurId} non trouvé`,
            });
            return;
          }

          const utilisateur = selectResults[0];

          if (!utilisateur.active) {
            console.log(
              `[desactiverUtilisateur] Utilisateur ${utilisateur.userId} déjà inactif`,
            );
            resolve({
              isConfirm: false,
              message: `L'utilisateur ${utilisateur.first_name} ${utilisateur.last_name} (${utilisateur.userId}) est déjà inactif`,
            });
            return;
          }

          // Désactiver l'utilisateur
          const updateSql = `UPDATE utilisateurs SET active = FALSE WHERE id = ?`;

          this.mysqlConnector.query(
            updateSql,
            [utilisateurId],
            (updateError, updateResult) => {
              console.log(
                `[desactiverUtilisateur] Résultat de la mise à jour :`,
                updateResult,
              );

              if (updateError) {
                console.error(
                  "[desactiverUtilisateur] Erreur lors de la désactivation :",
                  updateError.message,
                );
                resolve({
                  isConfirm: false,
                  message: `Erreur lors de la désactivation : ${updateError.message}`,
                });
                return;
              }

              if (updateResult.affectedRows > 0) {
                console.log(
                  `[desactiverUtilisateur] Utilisateur ${utilisateur.userId} désactivé avec succès`,
                );
                resolve({
                  isConfirm: true,
                  message: `Utilisateur ${utilisateur.first_name} ${utilisateur.last_name} (${utilisateur.userId}) désactivé avec succès`,
                });
              } else {
                console.log(
                  `[desactiverUtilisateur] Aucune modification pour l'ID ${utilisateurId}`,
                );
                resolve({
                  isConfirm: false,
                  message: `Aucune modification effectuée pour l'utilisateur ID ${utilisateurId}`,
                });
              }
            },
          );
        },
      );
    });
  }

  // NOUVELLE méthode pour réactiver un utilisateur
  reactiverUtilisateur(utilisateurId: number): Promise<ConfirmationResult> {
    console.log(
      `[reactiverUtilisateur] Requête de réactivation pour ID :`,
      utilisateurId,
    );

    return new Promise<ConfirmationResult>((resolve, reject) => {
      // D'abord vérifier que l'utilisateur existe
      this.mysqlConnector.query(
        "SELECT id, userId, first_name, last_name, active FROM utilisateurs WHERE id = ?",
        [utilisateurId],
        (selectError, selectResults) => {
          if (selectError) {
            console.error(
              "[reactiverUtilisateur] Erreur lors de la vérification :",
              selectError.message,
            );
            resolve({
              isConfirm: false,
              message: `Erreur lors de la vérification de l'utilisateur : ${selectError.message}`,
            });
            return;
          }

          if (selectResults.length === 0) {
            resolve({
              isConfirm: false,
              message: `Utilisateur avec ID ${utilisateurId} non trouvé`,
            });
            return;
          }

          const utilisateur = selectResults[0];

          if (utilisateur.active) {
            resolve({
              isConfirm: false,
              message: `L'utilisateur ${utilisateur.first_name} ${utilisateur.last_name} (${utilisateur.userId}) est déjà actif`,
            });
            return;
          }

          // Réactiver l'utilisateur
          const updateSql = `UPDATE utilisateurs SET active = TRUE WHERE id = ?`;

          this.mysqlConnector.query(
            updateSql,
            [utilisateurId],
            (updateError, updateResult) => {
              if (updateError) {
                console.error(
                  "[reactiverUtilisateur] Erreur lors de la réactivation :",
                  updateError.message,
                );
                resolve({
                  isConfirm: false,
                  message: `Erreur lors de la réactivation : ${updateError.message}`,
                });
                return;
              }

              if (updateResult.affectedRows > 0) {
                console.log(
                  `[reactiverUtilisateur] Utilisateur ${utilisateur.userId} réactivé avec succès`,
                );
                resolve({
                  isConfirm: true,
                  message: `Utilisateur ${utilisateur.first_name} ${utilisateur.last_name} (${utilisateur.userId}) réactivé avec succès`,
                });
              } else {
                resolve({
                  isConfirm: false,
                  message: `Aucune modification effectuée pour l'utilisateur ID ${utilisateurId}`,
                });
              }
            },
          );
        },
      );
    });
  }

  // Nouvelle méthode pour obtenir les statistiques d'utilisateurs
  obtenirStatistiquesUtilisateurs(): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          COUNT(*) as total_utilisateurs,
          SUM(CASE WHEN active = TRUE THEN 1 ELSE 0 END) as utilisateurs_actifs,
          SUM(CASE WHEN active = FALSE THEN 1 ELSE 0 END) as utilisateurs_inactifs,
          SUM(CASE WHEN active = TRUE AND status_id = 5 THEN 1 ELSE 0 END) as professeurs_actifs,
          SUM(CASE WHEN active = TRUE AND status_id = 4 THEN 1 ELSE 0 END) as admin_actifs
        FROM utilisateurs
      `;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la récupération des statistiques :",
            error.message,
          );
          reject(error);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  mettreAjourUtilisateur(
    utilisateurData: UserData,
  ): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      const sqlSelect = `SELECT id FROM utilisateurs WHERE first_name = ? AND last_name = ? LIMIT 1`;
      const valuesSelect = [utilisateurData.prenom, utilisateurData.nom];

      this.mysqlConnector.query(
        sqlSelect,
        valuesSelect,
        (selectError, selectResults) => {
          if (selectError) {
            console.error(
              "Erreur lors de la recherche de l'utilisateur :",
              selectError.message,
            );
            reject(selectError);
            return;
          }

          if (selectResults.length === 0) {
            resolve({ isConfirm: false, message: "Utilisateur non trouvé." });
            return;
          }

          const userId = selectResults[0].id;

          const sqlUpdate = `
          UPDATE utilisateurs SET
            first_name = ?,
            last_name = ?,
            nom_utilisateur = ?,
            email = ?,
            genre_id = ?,
            date_of_birth = ?,
            password = ?,
            status_id = ?,
            grade_id = ?,
            abonnement_id = ?
          WHERE id = ?
        `;

          const valuesUpdate = [
            utilisateurData.prenom,
            utilisateurData.nom,
            utilisateurData.nom_utilisateur,
            utilisateurData.email,
            utilisateurData.genre_id,
            utilisateurData.date_naissance,
            utilisateurData.password,
            utilisateurData.status_id,
            utilisateurData.grade_id,
            utilisateurData.abonnement_id,
            userId,
          ];

          console.log(
            "Exécution de la requête de mise à jour :",
            sqlUpdate,
            valuesUpdate,
          );

          this.mysqlConnector.query(
            sqlUpdate,
            valuesUpdate,
            (updateError, updateResults: any) => {
              if (updateError) {
                console.error(
                  "Erreur lors de la mise à jour de l'utilisateur :",
                  updateError.message,
                );
                reject(updateError);
                return;
              }

              if (updateResults.affectedRows === 0) {
                console.log(
                  "Aucun utilisateur mis à jour, vérifiez les données.",
                );
                resolve({
                  isConfirm: false,
                  message: "Aucun utilisateur mis à jour.",
                });
              } else {
                console.log("Utilisateur mis à jour avec succès, ID:", userId);
                resolve({
                  isConfirm: true,
                  message: `Utilisateur avec ID ${userId} mis à jour avec succès.`,
                });
              }
            },
          );
        },
      );
    });
  }

  // Modifie les informations d'un utilisateur selon les champs reçus
  async modifierInfosUtilisateur(data: {
    id: number;
    email?: string;
    date_naissance?: string;
    genres?: string;
    grades?: string;
    abonnement?: string;
    status?: string;
    password?: string;
  }): Promise<ConfirmationResult> {
    console.log("[UTILISATEURS] Appel de modifierInfosUtilisateur avec:", data);
    if (!data.id) {
      console.log(
        "[UTILISATEURS] Erreur: id manquant dans la requête de modification",
      );
      throw new Error(
        "L'identifiant de l'utilisateur est requis pour la modification.",
      );
    }

    // Prépare la requête et les valeurs à mettre à jour
    const fields: string[] = [];
    const values: any[] = [];

    if (typeof data.email !== "undefined") {
      fields.push("email = ?");
      values.push(data.email);
    }
    if (typeof data.date_naissance !== "undefined") {
      fields.push("date_of_birth = ?");
      values.push(data.date_naissance);
    }
    if (typeof data.genres !== "undefined") {
      fields.push(
        "genre_id = (SELECT id FROM genres WHERE genre_name = ? LIMIT 1)",
      );
      values.push(data.genres);
    }
    if (typeof data.grades !== "undefined") {
      fields.push(
        "grade_id = (SELECT id FROM grades WHERE grade_id = ? LIMIT 1)",
      );
      values.push(data.grades);
    }
    if (typeof data.abonnement !== "undefined") {
      fields.push(
        "abonnement_id = (SELECT id FROM plans_tarifaires WHERE nom_plan = ? LIMIT 1)",
      );
      values.push(data.abonnement);
    }
    if (typeof data.status !== "undefined") {
      fields.push(
        "status_id = (SELECT id FROM status WHERE nom_role = ? LIMIT 1)",
      );
      values.push(data.status);
    }
    // Le mot de passe est déjà hashé côté route, pas besoin de le re-hasher
    if (typeof data.password !== "undefined" && data.password.trim() !== "") {
      fields.push("password = ?");
      values.push(data.password);
      console.log("[UTILISATEURS] Mot de passe mis à jour (déjà hashé)");
    }

    if (fields.length === 0) {
      return { isConfirm: false, message: "Aucune donnée à modifier." };
    }

    const sql = `UPDATE utilisateurs SET ${fields.join(", ")} WHERE id = ?`;
    values.push(data.id);

    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(sql, values, (error, results: any) => {
        if (error) {
          console.error(
            "Erreur lors de la modification de l'utilisateur :",
            error.message,
          );
          reject(error);
          return;
        }

        if (results.affectedRows === 0) {
          resolve({ isConfirm: false, message: "Aucun utilisateur modifié." });
        } else {
          resolve({
            isConfirm: true,
            message: `Utilisateur avec ID ${data.id} modifié avec succès.`,
          });
        }
      });
    });
  }

  verifierEmailExiste(email: string, id?: number): Promise<boolean> {
    let sql = "SELECT id FROM utilisateurs WHERE email = ?";
    let params: any[] = [email];
    if (id) {
      sql += " AND id != ?";
      params.push(id);
    }
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(sql, params, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results.length > 0);
      });
    });
  }

  obtenirInformationsUtilisateur = async (
    prenom: string,
    nom: string,
  ): Promise<VerifyResultWithData> => {
    try {
      const sql = `
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.nom_utilisateur,
          u.email,
          u.password,
          g.genre_name AS genres,
          s.nom_role AS status,
          gr.grade_id AS grades,
          a.nom_plan AS abonnement,
          u.date_of_birth
        FROM
          utilisateurs u
        JOIN
          genres g ON u.genre_id = g.id
        JOIN
          status s ON u.status_id = s.id
        JOIN
          grades gr ON u.grade_id = gr.id
        JOIN
          plans_tarifaires a ON u.abonnement_id = a.id
        WHERE
          u.first_name = ? AND u.last_name = ?
      `;

      const values = [prenom, nom];

      return new Promise<VerifyResultWithData>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, (error, results) => {
          if (error) {
            console.error(
              `Erreur lors de la récupération de l'utilisateur ${prenom} ${nom} : ${error.message}`,
            );
            reject(error);
          } else {
            if (results.length > 0) {
              const utilisateur = results[0];
              console.log(utilisateur);
              resolve({
                isFind: true,
                message: "Utilisateur trouvé",
                data: utilisateur,
              });
            } else {
              console.log(`Aucun utilisateur trouvé pour ${prenom} ${nom}`);
              resolve({
                isFind: false,
                message: "Aucun utilisateur trouvé",
                data: [],
              });
            }
          }
        });
      });
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des informations de l'utilisateur ${prenom} ${nom} :`,
        error,
      );
      throw error;
    }
  };

  verifierProfesseurs(
    utilisateurs: { nom: string; prenom: string }[],
  ): Promise<{ professeurs: any[] }> {
    return new Promise((resolve, reject) => {
      if (!utilisateurs || utilisateurs.length === 0) {
        return resolve({ professeurs: [] });
      }

      const placeholders = utilisateurs.map(() => "(?, ?)").join(", ");
      const params: any[] = [];

      utilisateurs.forEach((u) => {
        params.push(u.nom, u.prenom);
      });

      const sql = `
        SELECT nom, prenom,
               EXISTS(SELECT 1 FROM professeurs p WHERE p.nom = u.nom AND p.prenom = u.prenom AND p.status_id = 5) as isProf
        FROM (VALUES ${placeholders}) as u(nom, prenom)
      `;

      this.mysqlConnector.query(sql, params, (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la vérification des professeurs :",
            error,
          );
          reject(error);
        } else {
          resolve({ professeurs: results });
        }
      });
    });
  }

  creerUtilisateur(userData: any): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO utilisateurs (first_name, last_name, email, password, status_id)
        VALUES (?, ?, ?, ?, 1)
      `;

      this.mysqlConnector.query(
        sql,
        [
          userData.first_name,
          userData.last_name,
          userData.email,
          userData.password_hash, // Ici garde password_hash car c'est déjà hashé
        ],
        (error, results) => {
          if (error) {
            console.error(
              "Erreur lors de la création de l'utilisateur :",
              error,
            );
            reject(error);
          } else {
            resolve({
              isConfirm: true,
              message: "Utilisateur créé avec succès",
            });
          }
        },
      );
    });
  }

  obtenirUtilisateurParEmail(email: string): Promise<any | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, userId, first_name, last_name, nom_utilisateur, email, password,
               genre_id, date_of_birth, status_id, active, grade_id, abonnement_id, date_inscription
        FROM utilisateurs
        WHERE email = ?
      `;

      this.mysqlConnector.query(sql, [email], (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la récupération de l'utilisateur :",
            error,
          );
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Alias pour compatibilité avec les tests
  async getUtilisateurByEmail(email: string): Promise<any | null> {
    const user = await this.obtenirUtilisateurParEmail(email);

    if (!user) return null;

    // Mapper les noms de champs anglais vers français pour compatibilité tests
    return {
      ...user,
      nom: user.last_name,
      prenom: user.first_name,
      date: user.date_of_birth,
      genre: user.genre_id,
      abonnement: user.abonnement_id,
      status: user.status_id,
      grade: user.grade_id,
    };
  }

  modifierUtilisateur(id: number, userData: any): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE utilisateurs
        SET first_name = ?, last_name = ?, email = ?
        WHERE id = ? AND status_id = 1
      `;

      this.mysqlConnector.query(
        sql,
        [userData.first_name, userData.last_name, userData.email, id],
        (error, results: any) => {
          if (error) {
            console.error(
              "Erreur lors de la modification de l'utilisateur :",
              error,
            );
            reject(error);
          } else if (results.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: "Aucune modification apportée, vérifiez les données.",
            });
          } else {
            resolve({
              isConfirm: true,
              message: "Utilisateur modifié avec succès.",
            });
          }
        },
      );
    });
  }
}
