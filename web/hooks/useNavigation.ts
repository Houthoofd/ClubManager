import { useDispatch, useSelector } from 'react-redux';
import { OPEN_LEFT_NAVBAR, OPEN_RIGHT_NAVBAR, OPEN_RIGHT_HEADER_PANEL, SELECT } from '../redux/actions';
import { useEffect } from 'react';

const useNavbar = () => {
  const dispatch = useDispatch();
  
  // Récupère l'état de navigation depuis le store Redux
  const navigation = useSelector((state: any) => state.navigation);

  // Fonction pour basculer la barre de navigation gauche
  const handleToggleLeftNavbar = () => {
    dispatch(OPEN_LEFT_NAVBAR());
  };

  // Fonction pour basculer la barre de navigation droite
  const handleToggleRightNavbar = () => {
    dispatch(OPEN_RIGHT_NAVBAR());
  };

  const handleToggleRightHeaderPanel = () => {
    dispatch(OPEN_RIGHT_HEADER_PANEL());
  };

  const handleToggleSelect = () => {
    dispatch(OPEN_RIGHT_HEADER_PANEL());
  };

  useEffect(() => {
  }, [navigation.left_navbar]);

  useEffect(() => {
  }, [navigation.right_navbar]);

  useEffect(() => {
  }, [navigation.header_right_panel]);

  useEffect(() => {
  }, [navigation.select]);

  return { navigation, handleToggleLeftNavbar, handleToggleRightNavbar, handleToggleRightHeaderPanel, handleToggleSelect };
};

export default useNavbar;

