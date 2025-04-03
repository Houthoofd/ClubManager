var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
import fetch from 'node-fetch'; // Assure-toi que 'node-fetch' est installé
// Fonction pour générer un nombre aléatoire dans une plage donnée
const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
// Fonction pour générer les instructions d'insertion SQL et les écrire dans un fichier .sql
const generateSQLFile = (numRecords) => __awaiter(void 0, void 0, void 0, function* () {
    // Récupérer les dates de cours depuis l'API
    const response = yield fetch('http://localhost:3000/cours');
    if (!response.ok) {
        console.error('Erreur lors de la récupération des dates de cours');
        return;
    }
    const coursData = yield response.json(); // Supposons que l'API retourne un tableau de dates
    // S'assurer que la réponse contient des dates de cours
    if (!coursData || !Array.isArray(coursData)) {
        console.error('Les données des cours sont invalides');
        return;
    }
    let sqlContent = ''; // Contenu du fichier SQL
    // Boucle pour générer plusieurs instructions INSERT INTO
    for (let i = 0; i < numRecords; i++) {
        const utilisateurId = getRandomInt(1, 152); // Génère un utilisateur_id entre 1 et 152
        const coursId = getRandomInt(1, 417); // Génère un cours_id entre 1 et 417
        const randomCoursDate = coursData[getRandomInt(0, coursData.length - 1)]; // Sélectionne une date de cours aléatoire
        const statusId = getRandomInt(0, 1); // Génère un status_id (0 ou 1)
        // Génère l'instruction SQL pour l'insertion
        const sql = `INSERT INTO inscriptions (utilisateur_id, cours_id, date_inscription, status_id) 
                 VALUES (${utilisateurId}, ${coursId}, '${randomCoursDate}', ${statusId});\n`;
        // Ajoute l'instruction au contenu du fichier SQL
        sqlContent += sql;
    }
    // Écrit le contenu dans un fichier .sql
    fs.writeFile('inserts.sql', sqlContent, (err) => {
        if (err) {
            console.error('Erreur lors de la création du fichier SQL : ' + err.message);
        }
        else {
            console.log('Le fichier SQL a été créé avec succès : inserts.sql');
        }
    });
});
// Appel de la fonction pour générer 1000 enregistrements
generateSQLFile(1000);
