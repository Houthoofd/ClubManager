var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Chat } from '../db/clients/chat/chat.js';
export default function (io) {
    io.on('connection', (socket) => {
        console.log('✅ Un utilisateur s\'est connecté au chat');
        // 1. Lorsque l'utilisateur demande l'historique entre lui et un autre utilisateur
        socket.on('getHistorique', (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, receiverId } = data;
                console.log(data);
                const client = new Chat();
                const historique = yield client.recupererHistorique(userId, receiverId);
                socket.emit('historique', historique); // Envoi l'historique filtré à l'utilisateur
            }
            catch (error) {
                console.error('Erreur lors de la récupération de l\'historique', error);
            }
        }));
        // 2. Lorsqu'un message est envoyé
        socket.on('chatMessage', (msgData) => __awaiter(this, void 0, void 0, function* () {
            console.log('📨 Message reçu :', msgData);
            const { utilisateur, message, receiverId } = msgData;
            console.log("sockets.io : Traitement du message...");
            try {
                // Vérification que l'utilisateur qui envoie le message existe
                if (!utilisateur) {
                    console.error("Utilisateur non valide");
                    return;
                }
                const client = new Chat();
                // Enregistrer le message dans la base de données
                yield client.enregistrerMessage(utilisateur, receiverId, message);
                // Vérifier si le receiverId est défini (message privé)
                if (receiverId) {
                    console.log(`Envoi du message à l'utilisateur ${receiverId}`);
                    io.to(receiverId.toString()).emit('chatMessage', {
                        utilisateur,
                        message,
                        date_envoi: new Date().toISOString()
                    });
                }
                else {
                    // Si receiverId est null, diffuser à tous les clients
                    console.log("Diffusion du message à tous les clients");
                    io.emit('chatMessage', {
                        utilisateur,
                        message,
                        date_envoi: new Date().toISOString()
                    });
                }
            }
            catch (error) {
                console.error('Erreur enregistrement message :', error);
            }
        }));
        // Lors de la déconnexion d'un utilisateur
        socket.on('disconnect', () => {
            console.log('❌ Un utilisateur s\'est déconnecté');
        });
    });
}
