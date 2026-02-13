import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';

const execPromise = promisify(exec);

// Fonction pour vérifier l'installation de MySQL
async function checkMySQLInstallation() {
  console.log('🔍 Vérification de l\'installation MySQL...');
  
  const commonPaths = [
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysql.exe',
    'C:\\xampp\\mysql\\bin\\mysql.exe',
    'C:\\wamp64\\bin\\mysql\\mysql8.0.21\\bin\\mysql.exe',
    'C:\\wamp\\bin\\mysql\\mysql5.7.31\\bin\\mysql.exe',
  ];
  
  // Vérifier si mysql.exe existe dans les chemins communs
  for (const mysqlPath of commonPaths) {
    try {
      await fs.access(mysqlPath);
      console.log(`✅ MySQL trouvé à: ${mysqlPath}`);
      return true;
    } catch (error) {
      // Fichier non trouvé, continuer avec le prochain chemin
    }
  }

  // Rechercher dans le PATH système
  try {
    await execPromise('where mysql');
    console.log('✅ MySQL est disponible dans le PATH système');
    return true;
  } catch (error) {
    console.log('❌ MySQL n\'a pas été trouvé dans les emplacements habituels ni dans le PATH');
    console.log('   Vous devez installer MySQL ou ajouter son dossier bin au PATH système');
    return false;
  }
}

// Fonction pour vérifier si le service MySQL est en cours d'exécution
async function checkMySQLService() {
  console.log('\n🔍 Vérification du service MySQL...');
  
  try {
    const { stdout } = await execPromise('sc query mysql');
    if (stdout.includes('RUNNING')) {
      console.log('✅ Le service MySQL est en cours d\'exécution');
      return true;
    } else if (stdout.includes('STOPPED')) {
      console.log('❌ Le service MySQL est arrêté');
      console.log('   Pour le démarrer, exécutez en tant qu\'administrateur: net start mysql');
      return false;
    } else {
      console.log('❓ État du service MySQL inconnu');
      return false;
    }
  } catch (error) {
    // Essayer avec XAMPP ou WAMP si le service MySQL standard n'est pas trouvé
    try {
      const { stdout: xamppStdout } = await execPromise('sc query mysql80');
      if (xamppStdout.includes('RUNNING')) {
        console.log('✅ Le service MySQL 8.0 est en cours d\'exécution');
        return true;
      }
    } catch (e) {
      // Ignorer l'erreur
    }
    
    console.log('❓ Aucun service MySQL standard trouvé. Vérifions les alternatives...');
    
    // Vérifier si MySQL est exécuté via XAMPP
    try {
      const { stdout: xamppStdout } = await execPromise('tasklist /fi "imagename eq mysqld.exe"');
      if (xamppStdout.includes('mysqld.exe')) {
        console.log('✅ MySQL est en cours d\'exécution (processus mysqld.exe détecté)');
        return true;
      }
    } catch (e) {
      // Ignorer l'erreur
    }
    
    console.log('❌ Aucun processus MySQL en cours d\'exécution n\'a été trouvé');
    console.log('   Assurez-vous que MySQL est installé et en cours d\'exécution');
    console.log('   Si vous utilisez XAMPP/WAMP, démarrez le service MySQL depuis leur panneau de contrôle');
    return false;
  }
}

// Fonction pour vérifier les ports ouverts
async function checkOpenPorts() {
  console.log('\n🔍 Vérification des ports ouverts...');
  
  try {
    const { stdout } = await execPromise('netstat -an | findstr ":3306"');
    if (stdout.includes('LISTENING')) {
      console.log('✅ Port 3306 ouvert et en écoute');
      return true;
    } else {
      console.log('❌ Aucun service n\'écoute sur le port 3306');
      return false;
    }
  } catch (error) {
    console.log('❌ Port 3306 non ouvert');
    console.log('   MySQL n\'est probablement pas en cours d\'exécution');
    return false;
  }
}

// Fonction pour afficher des conseils d'installation
function showInstallationTips() {
  console.log('\n📋 Comment installer MySQL sur Windows:');
  console.log('1. Téléchargez MySQL Installer depuis https://dev.mysql.com/downloads/installer/');
  console.log('2. Exécutez l\'installateur et suivez les instructions');
  console.log('3. Lors de la configuration, notez le mot de passe root que vous définissez');
  console.log('4. Assurez-vous que le service MySQL est configuré pour démarrer automatiquement');
  console.log('\nAlternativement, vous pouvez installer:');
  console.log('- XAMPP (https://www.apachefriends.org/download.html)');
  console.log('- WAMP (https://www.wampserver.com/)');
  console.log('- MAMP (https://www.mamp.info/en/downloads/)');
  console.log('\nAprès l\'installation:');
  console.log('1. Assurez-vous que le service MySQL est démarré');
  console.log('2. Mettez à jour le script de connexion avec les bons identifiants');
}

// Fonction pour vérifier si MySQL est accessible
async function testMySQLAccess() {
  console.log('\n🔍 Test d\'accès à MySQL avec les commandes système...');
  
  try {
    // Essayez d'exécuter une commande MySQL simple sans mot de passe d'abord
    await execPromise('echo "exit" | mysql -u root -h localhost --protocol=TCP');
    console.log('✅ Connexion à MySQL réussie avec l\'utilisateur root sans mot de passe');
    return true;
  } catch (error) {
    console.log('❓ Impossible de se connecter sans mot de passe, cela est normal si vous avez défini un mot de passe');
    
    console.log('\n⚠️ Vérifiez votre mot de passe MySQL:');
    console.log('- Si vous avez défini un mot de passe lors de l\'installation, utilisez-le');
    console.log('- Assurez-vous de mettre à jour le mot de passe dans vos scripts et variables d\'environnement');
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🏥 Diagnostic MySQL pour Windows 🏥');
  console.log('===================================\n');
  
  const isInstalled = await checkMySQLInstallation();
  const isRunning = await checkMySQLService();
  const isPortOpen = await checkOpenPorts();
  await testMySQLAccess();
  
  console.log('\n📊 Résumé du diagnostic:');
  console.log(`- Installation MySQL: ${isInstalled ? '✅ Trouvé' : '❌ Non trouvé'}`);
  console.log(`- Service MySQL: ${isRunning ? '✅ En cours d\'exécution' : '❌ Arrêté ou non trouvé'}`);
  console.log(`- Port 3306: ${isPortOpen ? '✅ Ouvert' : '❌ Non disponible'}`);
  
  if (!isInstalled || !isRunning || !isPortOpen) {
    console.log('\n❌ Problèmes détectés - MySQL n\'est pas correctement configuré');
    showInstallationTips();
  } else {
    console.log('\n✅ MySQL semble correctement configuré mais le mot de passe pourrait être incorrect');
    console.log('   Vérifiez les informations de connexion dans vos variables d\'environnement');
  }
  
  console.log('\n🔧 Pour utiliser un autre hôte/utilisateur/mot de passe avec vos tests:');
  console.log('set DB_HOST=votre_host&& set DB_USER=votre_user&& set DB_PASSWORD=votre_password&& set DB_NAME=clubmanager&& npm run verify-db:local:windows');
}

main().catch(error => {
  console.error('Une erreur s\'est produite lors de l\'exécution du diagnostic:', error);
  process.exit(1);
});
