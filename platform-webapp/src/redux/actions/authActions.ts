export const setUser = (user: any) => {
  // Stockez les données utilisateur dans le localStorage
  localStorage.setItem('userData', JSON.stringify(user));
  return {
    type: 'SET_USER',
    payload: user,
  };
};

// Exemple d'utilisation après une requête API
export const fetchUserData = () => async (dispatch: any) => {
  try {
    const response = await fetch('/api/user');
    const user = await response.json();
    dispatch(setUser(user));
  } catch (error) {
    console.error('Erreur lors du chargement des données utilisateur:', error);
  }
};
