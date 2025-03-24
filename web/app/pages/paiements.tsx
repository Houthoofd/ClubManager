import React from 'react';
import { Provider } from 'react-redux'; // Assurez-vous d'importer le provider
import store from '../../redux/store'; // Importation du store

const Paiements = () => {
  return (
    <Provider store={store}>
        <h1>Paiements</h1>
    </Provider>
  );
};

export default Paiements;