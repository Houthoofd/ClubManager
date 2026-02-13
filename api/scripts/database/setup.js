import mysql from 'mysql';
import { config } from 'dotenv';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

// Charger les variables d'environnement
config();

// Récupérer les infos de connexion depuis les variables d'environnement
const host = process.env.DB_HOST || 'localhost';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'clubmanager';

// Styles pour la console
const styles = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Fonction pour afficher un en-tête de section
function printHeader(title) {
  console.log('\n' + styles.bright + styles.blue + '╔════════════════════════════════════════════════════════╗');
  console.log('║ ' + title.padEnd(52) + '║');
  console.log('╚════════════════════════════════════════════════════════╝' + styles.reset);
}

// Fonction pour afficher une étape
function printStep(step, total, description) {
  console.log(styles.bright + styles.yellow + `[${step}/${total}] ` + styles.reset + description);
}

// Fonction pour afficher un succès
function printSuccess(message) {
  console.log(styles.green + '✓ ' + message + styles.reset);
}

// Fonction pour afficher une erreur
function printError(message) {
  console.log(styles.red + '✗ ' + message + styles.reset);
}

// Fonction pour afficher un avertissement
function printWarning(message) {
  console.log(styles.yellow + '! ' + message + styles.reset);
}

// Fonction pour afficher une info
function printInfo(message) {
  console.log(styles.cyan + 'ℹ ' + message + styles.reset);
}

// Chemins possibles pour XAMPP
const xamppPaths = [
  'C:\\xampp\\mysql\\bin\\mysqld.exe',
  'C:\\xampp\\mysql_start.bat',
  'C:\\xampp\\xampp_start.exe',
  'C:\\xampp\\xampp_control.exe',
];

// Fonction pour trouver le chemin de XAMPP
async function findXamppPath() {
  for (const xamppPath of xamppPaths) {
    try {
      await fs.access(xamppPath);
      return xamppPath;
    } catch (error) {
      // Fichier non trouvé, continuer avec le prochain chemin
    }
  }
  return null;
}

// Fonction pour vérifier si MySQL est déjà en cours d'exécution
async function isMySQLRunning() {
  try {
    const { stdout } = await execPromise('netstat -an | findstr ":3306"');
    return stdout.includes('LISTENING');
  } catch (error) {
    return false;
  }
}

// Fonction pour démarrer MySQL via XAMPP
async function startMySQL() {
  printStep(1, 4, 'Vérification du serveur MySQL');
  
  // Vérifier si MySQL est déjà en cours d'exécution
  if (await isMySQLRunning()) {
    printSuccess('MySQL est déjà en cours d\'exécution sur le port 3306');
    return true;
  }
  
  printInfo('MySQL n\'est pas en cours d\'exécution, tentative de démarrage...');
  
  // Trouver le chemin XAMPP
  const xamppPath = await findXamppPath();
  
  if (!xamppPath) {
    printError('XAMPP n\'a pas été trouvé dans les emplacements habituels');
    printWarning('Veuillez démarrer MySQL manuellement via le panneau de contrôle XAMPP');
    return false;
  }
  
  // Démarrer MySQL selon le type de fichier trouvé
  try {
    if (xamppPath.endsWith('mysqld.exe')) {
      printInfo(`Démarrage direct de MySQL depuis: ${xamppPath}`);
      // Démarrer MySQL directement (en arrière-plan)
      exec(`"${xamppPath}"`);
    } else if (xamppPath.endsWith('.bat')) {
      printInfo(`Exécution du script batch: ${xamppPath}`);
      exec(`"${xamppPath}"`);
    } else if (xamppPath.endsWith('xampp_control.exe')) {
      printInfo(`Panneau de contrôle XAMPP trouvé: ${xamppPath}`);
      printWarning('Veuillez utiliser le panneau de contrôle pour démarrer MySQL');
      exec(`"${xamppPath}"`);
      return false;
    } else {
      printInfo(`Tentative de démarrage via: ${xamppPath}`);
      exec(`"${xamppPath}"`);
    }
    
    printInfo('Attente du démarrage de MySQL...');
    
    // Attendre que MySQL démarre
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      if (await isMySQLRunning()) {
        printSuccess('MySQL est maintenant en cours d\'exécution!');
        return true;
      }
      
      // Attendre 2 secondes avant de vérifier à nouveau
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      process.stdout.write('.');
    }
    
    printError('Impossible de confirmer le démarrage de MySQL après plusieurs tentatives');
    printWarning('Veuillez démarrer MySQL manuellement via le panneau de contrôle XAMPP');
    return false;
  } catch (error) {
    printError(`Erreur lors du démarrage de MySQL: ${error.message}`);
    printWarning('Veuillez démarrer MySQL manuellement via le panneau de contrôle XAMPP');
    return false;
  }
}

// Configuration de la connexion MySQL avec gestion des erreurs
async function setupDatabase() {
  printStep(2, 4, 'Connexion au serveur MySQL');
  
  // Essayer d'abord sans mot de passe (configuration par défaut XAMPP)
  const connectionOptions = {
    host,
    user,
    password: ''  // Essayer d'abord sans mot de passe
  };
  
  printInfo('Tentative de connexion sans mot de passe (configuration XAMPP par défaut)...');
  
  return new Promise(async (resolve) => {
    // Fonction pour tenter la connexion avec différentes options
    const tryConnect = (options) => {
      return new Promise((resolveConnect) => {
        const connection = mysql.createConnection(options);
        
        connection.connect((err) => {
          if (err) {
            printError(`Erreur de connexion à MySQL: ${err.message}`);
            connection.end();
            resolveConnect({ success: false, connection: null });
          } else {
            printSuccess('Connexion à MySQL réussie!');
            resolveConnect({ success: true, connection });
          }
        });
      });
    };
    
    // Essayer sans mot de passe d'abord (configuration XAMPP par défaut)
    let result = await tryConnect({ ...connectionOptions, password: '' });
    
    // Si échec, essayer avec le mot de passe fourni
    if (!result.success && password) {
      printInfo('Échec. Tentative avec le mot de passe fourni...');
      result = await tryConnect({ ...connectionOptions, password });
    }
    
    // Si toujours en échec, essayer avec 'password' (mot de passe commun)
    if (!result.success) {
      printInfo('Échec. Tentative avec le mot de passe "password"...');
      result = await tryConnect({ ...connectionOptions, password: 'password' });
    }
    
    // Si toujours en échec, suggérer des solutions
    if (!result.success) {
      printError('Impossible de se connecter à MySQL avec les différentes tentatives de mot de passe.');
      printWarning('Solutions possibles:');
      printWarning('1. Vérifiez que le serveur MySQL est bien démarré');
      printWarning('2. Vérifiez les identifiants dans votre fichier de configuration');
      printWarning('3. Réinitialisez le mot de passe MySQL en suivant la documentation XAMPP');
      resolve(false);
      return;
    }
    
    const connection = result.connection;
    
    // Continuer avec la création de la base de données
    printStep(3, 4, `Création/vérification de la base de données "${dbName}"`);
    
    // Créer la base de données
    connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
      if (err) {
        printError(`Erreur lors de la création de la base de données ${dbName}: ${err.message}`);
        connection.end();
        resolve(false);
        return;
      }
      
      printSuccess(`Base de données "${dbName}" créée avec succès (ou existe déjà)!`);
      
      // Fermer la connexion
      connection.end(() => {
        resolve(true);
      });
    });
  });
}

// Fonction pour vérifier l'accès à la base de données avec différents mots de passe
async function verifyDatabaseAccess() {
  printStep(4, 4, 'Vérification de l\'accès à la base de données');
  
  return new Promise(async (resolve) => {
    // Fonction pour tenter l'accès avec différentes options de mot de passe
    const tryAccess = (options) => {
      return new Promise((resolveAccess) => {
        const connection = mysql.createConnection({
          ...options,
          database: dbName
        });
        
        connection.connect((err) => {
          if (err) {
            connection.end();
            resolveAccess({ success: false });
          } else {
            // Exécuter une requête simple pour vérifier que tout fonctionne
            connection.query('SELECT 1 + 1 AS solution', (err, results) => {
              if (err) {
                connection.end();
                resolveAccess({ success: false });
              } else {
                connection.end();
                resolveAccess({ success: true, result: results[0].solution });
              }
            });
          }
        });
      });
    };
    
    // Essayer sans mot de passe d'abord
    printInfo('Tentative d\'accès à la base de données sans mot de passe...');
    let result = await tryAccess({ host, user, password: '' });
    
    // Si échec, essayer avec le mot de passe fourni
    if (!result.success && password) {
      printInfo('Échec. Tentative avec le mot de passe fourni...');
      result = await tryAccess({ host, user, password });
    }
    
    // Si toujours en échec, essayer avec 'password'
    if (!result.success) {
      printInfo('Échec. Tentative avec le mot de passe "password"...');
      result = await tryAccess({ host, user, password: 'password' });
    }
    
    // Afficher le résultat
    if (result.success) {
      printSuccess(`Connexion à la base de données ${dbName} réussie!`);
      printSuccess(`Requête exécutée avec succès. Résultat: ${result.result}`);
      
      // Mettre à jour le package.json pour utiliser les bonnes informations de connexion
      await updatePackageJsonScripts(password === '' ? '' : (password || 'password'));
      
      resolve(true);
    } else {
      printError(`Impossible d'accéder à la base de données ${dbName} avec les différentes tentatives.`);
      resolve(false);
    }
  });
}

// Fonction pour mettre à jour les scripts dans package.json
async function updatePackageJsonScripts(workingPassword) {
  try {
    printInfo('Mise à jour des scripts dans package.json avec les bons identifiants...');
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    // Mettre à jour les scripts avec le mot de passe qui fonctionne
    for (const scriptName of ['verify-db:local:windows', 'create-db:windows', 'db-setup:windows']) {
      if (packageJson.scripts[scriptName]) {
        packageJson.scripts[scriptName] = packageJson.scripts[scriptName].replace(
          /set DB_PASSWORD=[^&]*&&/,
          `set DB_PASSWORD=${workingPassword}&& `
        );
      }
    }
    
    // Écrire les modifications dans le fichier package.json
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    
    printSuccess('Scripts mis à jour avec succès dans package.json');
  } catch (error) {
    printWarning(`Impossible de mettre à jour package.json: ${error.message}`);
  }
}

// Fonction principale
async function main() {
  printHeader('Assistant de Configuration MySQL pour ClubManager');
  
  printInfo(`Configuration cible:`);
  printInfo(`- Hôte: ${host}`);
  printInfo(`- Utilisateur: ${user}`);
  printInfo(`- Mot de passe: ${password ? '*****' : '(vide)'}`);
  printInfo(`- Base de données: ${dbName}`);
  
  // Étape 1: Démarrer MySQL
  const mysqlStarted = await startMySQL();
  if (!mysqlStarted) {
    return false;
  }
  
  // Étape 2 & 3: Configurer la base de données
  const dbSetup = await setupDatabase();
  if (!dbSetup) {
    return false;
  }
  
  // Étape 4: Vérifier l'accès à la base de données
  const dbAccess = await verifyDatabaseAccess();
  if (!dbAccess) {
    return false;
  }
  
  printHeader('Configuration Réussie! 🎉');
  printSuccess('Votre base de données est maintenant prête à être utilisée avec ClubManager!');
  
  return true;
}

// Exécuter le programme
main().then(success => {
  if (!success) {
    printHeader('Configuration Incomplète ❌');
    printError('La configuration n\'a pas pu être terminée. Veuillez corriger les erreurs ci-dessus et réessayer.');
    process.exit(1);
  }
  process.exit(0);
}).catch(error => {
  printError(`Une erreur inattendue s'est produite: ${error.message}`);
  process.exit(1);
});
