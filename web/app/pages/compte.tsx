import React from 'react';
import { Provider } from 'react-redux'; // Assurez-vous d'importer le provider
import store from '../../redux/store'; // Importation du store

const Compte = () => {
  return (
    <Provider store={store}>
        <h1>Compte</h1>
    </Provider>
  );
};

export default Compte;
