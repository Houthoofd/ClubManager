import { useDispatch } from 'react-redux';
import { ADD_NOTIFICATION, REMOVE_NOTIFICATION } from '../redux/actions';

// Hook personnalisé pour gérer les notifications
const useNotifications = () => {
  const dispatch = useDispatch();

  // Fonction pour ajouter une notification
  const handleAddNotification = (message: string, visibility: 'public' | 'prive') => {
    dispatch(ADD_NOTIFICATION({
      id: Date.now(),
      message,
      visibility,
    }));
  };

  // Fonction pour supprimer une notification
  const handleRemoveNotification = (id: number) => {
    dispatch(REMOVE_NOTIFICATION(id));
  };

  return { handleAddNotification, handleRemoveNotification };
};

export default useNotifications;
