import React from 'react';
import { Provider } from 'react-redux'; // Assurez-vous d'importer le provider
import store from '../../redux/store'; // Importation du store

const Magasin = () => {
  return (
    <Provider store={store}>
        <h1>Magasin</h1>
        <img src="http://localhost:3000/public/images/frederic.jpg" alt="Frédéric" />
    </Provider>
  );
};

export default Magasin;