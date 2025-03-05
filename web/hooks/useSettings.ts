import { useDispatch, useSelector } from 'react-redux';
import { TOGGLE_DARK_MODE } from '../redux/actions';
import { useEffect } from 'react';

// Hook personnalisé pour gérer le mode sombre
const useDarkMode = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: any) => state.settings);

  // Fonction pour basculer entre le mode sombre et le mode clair
  const handleToggleDarkMode = () => {
    dispatch(TOGGLE_DARK_MODE());
  };

  // Utilisation d'un useEffect pour observer les changements du mode sombre
  useEffect(() => {
  }, [settings.darkMode]); // Cela écoute les changements de darkMode

  return { settings, handleToggleDarkMode };
};

export default useDarkMode;
