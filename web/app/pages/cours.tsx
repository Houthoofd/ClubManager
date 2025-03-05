import React from 'react';
import { Provider } from 'react-redux'; // Assurez-vous d'importer le provider
import store from '../../redux/store'; // Importation du store

const Cours = () => {
  return (
    <Provider store={store}>
        <h1>Cours ahahah</h1>
    </Provider>
  );
};

export default Cours;
