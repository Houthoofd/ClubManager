var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import { Compte } from '../db/clients/compte/compte.js';
const router = express.Router();
router.post('/informations', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prenom, nom } = req.body;
    console.log(prenom, nom);
    // Vérifier si les paramètres nécessaires sont présents
    if (!prenom || !nom) {
        return res.status(400).json({ message: "Les champs 'prenom' et 'nom' sont requis." });
    }
    console.log('Prénom :', prenom, 'Nom :', nom);
    try {
        const client = new Compte();
        const utilisateur = yield client.obtenirUnUtilisateurParSonNomEtPrenom(prenom, nom);
        if (utilisateur.isFind) {
            return res.status(200).json(utilisateur.data); // Renvoie les données de l'utilisateur trouvé
        }
        else {
            return res.status(404).json({ message: "Aucun utilisateur trouvé.", data: [] });
        }
    }
    catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur : ", error);
        return res.status(500).json({ message: "Erreur serveur", error: error });
    }
}));
export default router;
