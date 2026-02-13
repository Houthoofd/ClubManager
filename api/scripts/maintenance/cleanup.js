import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

// Obtenir le chemin actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers la racine du projet API
const apiRoot = path.resolve(__dirname, '..');
const scriptsDir = path.join(apiRoot, 'scripts');
const srcDir = path.join(apiRoot, 'src');
const packageJsonPath = path.join(apiRoot, 'package.json');
const reportDir = path.join(apiRoot, 'rapport');

/**
 * Fonction principale
 */
async function main() {
    console.log('🧹 Nettoyage des fichiers inutilisés...');
    
    try {
        // 1. Lire le package.json
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        
        // 2. Identifier les scripts référencés
        const scripts = packageJson.scripts || {};
        
        // Liste pour enregistrer les informations de nettoyage
        const cleanupInfo = {
            timestamp: new Date().toISOString(),
            deletedFiles: [],
            removedScripts: [],
        };
        
        // 3. Récupérer tous les fichiers dans le dossier scripts
        const scriptsFiles = await getAllFiles(scriptsDir);
        
        // 4. Trouver les fichiers référencés dans les scripts
        const referencedScripts = findReferencedScripts(scripts);
        
        console.log('📁 Fichiers dans le dossier scripts:', scriptsFiles.map(f => path.basename(f)));
        console.log('🔗 Scripts référencés:', referencedScripts);
        
        // 5. Identifier les fichiers non utilisés
        const unusedFiles = await findUnusedFiles(scriptsFiles, referencedScripts);
        
        console.log('🗑️ Fichiers inutilisés:', unusedFiles.map(f => path.basename(f)));
        
        // 6. Supprimer les fichiers inutilisés
        for (const file of unusedFiles) {
            try {
                await fs.unlink(file);
                console.log(`✅ Fichier supprimé: ${file}`);
                cleanupInfo.deletedFiles.push(file);
            } catch (error) {
                console.error(`❌ Erreur lors de la suppression de ${file}:`, error);
            }
        }
        
        // 7. Mettre à jour package.json pour retirer les scripts correspondants
        const newScripts = { ...scripts };
        let hasRemovedScripts = false;
        
        for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
            // Vérifier si la commande fait référence à un fichier supprimé
            const isReferringToDeletedFile = unusedFiles.some(file => {
                const fileName = path.basename(file);
                return scriptCommand.includes(fileName);
            });
            
            if (isReferringToDeletedFile) {
                delete newScripts[scriptName];
                cleanupInfo.removedScripts.push({ name: scriptName, command: scriptCommand });
                hasRemovedScripts = true;
                console.log(`✅ Script retiré: ${scriptName}`);
            }
        }
        
        // Si des scripts ont été supprimés, mettre à jour package.json
        if (hasRemovedScripts) {
            packageJson.scripts = newScripts;
            await fs.writeFile(
                packageJsonPath,
                JSON.stringify(packageJson, null, 2),
                'utf-8'
            );
            console.log('✅ package.json mis à jour');
        } else {
            console.log('ℹ️ Aucun script à retirer du package.json');
        }
        
        // 8. Créer le dossier rapport s'il n'existe pas
        if (!existsSync(reportDir)) {
            mkdirSync(reportDir, { recursive: true });
            console.log(`✅ Dossier créé: ${reportDir}`);
        }
        
        // 9. Générer le rapport
        const report = generateReport(cleanupInfo);
        const reportPath = path.join(reportDir, 'cleanup_report.txt');
        await fs.writeFile(reportPath, report, 'utf-8');
        console.log(`✅ Rapport créé: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
    }
}

/**
 * Récupère tous les fichiers JavaScript dans un répertoire
 * @param {string} dir - Chemin du répertoire
 * @returns {Promise<string[]>} - Liste des chemins complets des fichiers
 */
async function getAllFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

/**
 * Trouve les scripts référencés dans package.json
 * @param {object} scripts - Objet des scripts du package.json
 * @returns {string[]} - Liste des noms de fichiers référencés
 */
function findReferencedScripts(scripts) {
    const references = new Set();
    
    for (const command of Object.values(scripts)) {
        // Chercher les références aux fichiers .js dans scripts
        const matches = command.match(/node\s+(scripts\/[\w\-\.\/]+\.js)/g);
        if (matches) {
            matches.forEach(match => {
                // Extraire le chemin du fichier
                const scriptPath = match.replace(/node\s+/, '');
                references.add(scriptPath);
            });
        }
    }
    
    return Array.from(references);
}

/**
 * Vérifie si un fichier est utilisé dans le code source
 * @param {string} filePath - Chemin du fichier à vérifier
 * @param {string[]} referencedScripts - Liste des scripts référencés dans package.json
 * @returns {Promise<boolean>} - true si le fichier est utilisé, false sinon
 */
async function isFileUsed(filePath, referencedScripts) {
    // 1. Vérifier si le fichier est référencé dans les scripts de package.json
    const scriptPath = 'scripts/' + path.basename(filePath);
    if (referencedScripts.includes(scriptPath)) {
        return true;
    }
    
    // 2. Cas spéciaux pour les fichiers essentiels
    // Protéger mysql-diagnostic.js et db-setup-all-in-one.js
    const fileName = path.basename(filePath);
    if (fileName === 'mysql-diagnostic.js' || fileName === 'db-setup-all-in-one.js' || fileName === 'cleanup.js') {
        return true;
    }
    
    // 3. Vérifier les importations dans les fichiers source
    try {
        const sourceFiles = await getAllSourceFiles(srcDir);
        
        for (const sourceFile of sourceFiles) {
            const content = await fs.readFile(sourceFile, 'utf-8');
            // Vérifier si le nom du fichier apparaît dans le contenu
            if (content.includes(path.basename(filePath, '.js'))) {
                return true;
            }
        }
    } catch (error) {
        console.error(`Erreur lors de la vérification des utilisations pour ${filePath}:`, error);
    }
    
    return false;
}

/**
 * Récupère tous les fichiers source du projet
 * @param {string} dir - Répertoire de départ
 * @returns {Promise<string[]>} - Liste des chemins complets des fichiers source
 */
async function getAllSourceFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            files.push(...await getAllSourceFiles(fullPath));
        } else if (
            entry.isFile() && 
            (entry.name.endsWith('.js') || entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
        ) {
            files.push(fullPath);
        }
    }
    
    return files;
}

/**
 * Trouve les fichiers qui ne sont pas utilisés
 * @param {string[]} scriptsFiles - Liste des fichiers dans le dossier scripts
 * @param {string[]} referencedScripts - Liste des scripts référencés dans package.json
 * @returns {Promise<string[]>} - Liste des fichiers non utilisés
 */
async function findUnusedFiles(scriptsFiles, referencedScripts) {
    const unusedFiles = [];
    
    for (const file of scriptsFiles) {
        const isUsed = await isFileUsed(file, referencedScripts);
        if (!isUsed) {
            unusedFiles.push(file);
        }
    }
    
    return unusedFiles;
}

/**
 * Génère le rapport de nettoyage
 * @param {object} cleanupInfo - Informations de nettoyage
 * @returns {string} - Contenu du rapport
 */
function generateReport(cleanupInfo) {
    const { timestamp, deletedFiles, removedScripts } = cleanupInfo;
    
    const formatDate = new Date(timestamp).toLocaleString();
    
    let report = `RAPPORT DE NETTOYAGE - ${formatDate}\n`;
    report += `==================================\n\n`;
    
    report += `FICHIERS SUPPRIMÉS (${deletedFiles.length}):\n`;
    report += `----------------------------------\n`;
    if (deletedFiles.length === 0) {
        report += 'Aucun fichier supprimé\n';
    } else {
        deletedFiles.forEach((file, index) => {
            report += `${index + 1}. ${file}\n`;
        });
    }
    report += `\n`;
    
    report += `SCRIPTS RETIRÉS (${removedScripts.length}):\n`;
    report += `----------------------------------\n`;
    if (removedScripts.length === 0) {
        report += 'Aucun script retiré\n';
    } else {
        removedScripts.forEach((script, index) => {
            report += `${index + 1}. "${script.name}": "${script.command}"\n`;
        });
    }
    
    report += `\n`;
    report += `Ce nettoyage a été effectué automatiquement par le script cleanup.js\n`;
    
    return report;
}

// Exécuter la fonction principale
main().catch(console.error);
