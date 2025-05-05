// chatSocket.ts
import { Server, Socket } from 'socket.io';
import { Chat } from '../db/clients/chat/chat';  // Assure-toi d'importer ta classe Chat

export default function (io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('✅ Un utilisateur s\'est connecté au chat');

    // 1. Lorsque l'utilisateur se connecte, on récupère l'historique des messages
    socket.on('getHistorique', async () => {
      try {
        const client = new Chat();
        const historique = await client.recupererHistorique();
        socket.emit('historique', historique); // Envoi l'historique à l'utilisateur
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique', error);
      }
    });

    // 2. Lorsqu'un message est envoyé
    socket.on('chatMessage', async (msgData: { utilisateur: string; message: string }) => {
      console.log('📨 Message reçu :', msgData);

      const { utilisateur, message } = msgData;

      try {
        const client = new Chat();
        // Enregistrer le message dans la base de données
        await client.enregistrerMessage(utilisateur, message);

        // Diffuser le message à tous les clients connectés
        io.emit('chatMessage', {
          utilisateur,
          message,
          date_envoi: new Date().toISOString()
        });
      } catch (error) {
        console.error('Erreur enregistrement message :', error);
      }
    });

    // Lors de la déconnexion d'un utilisateur
    socket.on('disconnect', () => {
      console.log('❌ Un utilisateur s\'est déconnecté');
    });
  });
}
