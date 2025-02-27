import { useDispatch, useSelector } from 'react-redux';
import { OPEN_LEFT_NAVBAR, OPEN_RIGHT_NAVBAR, OPEN_RIGHT_HEADER_PANEL } from '../redux/actions';
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

  useEffect(() => {
    console.log('Left Navbar opened:', navigation.left_navbar);
  }, [navigation.left_navbar]);

  useEffect(() => {
    console.log('Right Navbar opened:', navigation.right_navbar);
  }, [navigation.right_navbar]);

  useEffect(() => {
    console.log('Right header panel opened:', navigation.header_right_panel);
  }, [navigation.right_navbar]);

  return { navigation, handleToggleLeftNavbar, handleToggleRightNavbar, handleToggleRightHeaderPanel };
};

export default useNavbar;

