import { Chat } from '../db/clients/chat/chat.js';
export default function (io) {
    io.on('connection', (socket) => {
        console.log('✅ Un utilisateur s\'est connecté au chat');
        // 1. Lorsque l'utilisateur demande l'historique entre lui et un autre utilisateur
        socket.on('getHistorique', async (data) => {
            try {
                const { userId, receiverId } = data;
                console.log(data);
                const client = new Chat();
                const historique = await client.recupererHistorique(userId, receiverId);
                socket.emit('historique', historique); // Envoi l'historique filtré à l'utilisateur
            }
            catch (error) {
                console.error('Erreur lors de la récupération de l\'historique', error);
            }
        });
        // 2. Lorsqu'un message est envoyé
        socket.on('chatMessage', async (msgData) => {
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
                await client.enregistrerMessage(utilisateur, receiverId, message);
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
        });
        // Lors de la déconnexion d'un utilisateur
        socket.on('disconnect', () => {
            console.log('❌ Un utilisateur s\'est déconnecté');
        });
    });
}
