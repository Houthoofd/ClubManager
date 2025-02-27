import { useDispatch } from 'react-redux';
import { ADD_MESSAGE_NOTIFICATION, REMOVE_MESSAGE_NOTIFICATION } from '../redux/actions';

// Hook personnalisé pour gérer les notifications
const useMessageNotifications = () => {
  const dispatch = useDispatch();

  // Fonction pour ajouter une notification
  const handleAddMessageNotification = (message: string, visibility: 'public' | 'prive') => {
    dispatch(ADD_MESSAGE_NOTIFICATION({
      id: Date.now(),
      message,
      visibility,
    }));
  };

  // Fonction pour supprimer une notification
  const handleRemoveMessageNotification = (id: number) => {
    dispatch(REMOVE_MESSAGE_NOTIFICATION(id));
  };

  return { handleAddMessageNotification, handleRemoveMessageNotification };
};

export default useMessageNotifications;
