import React from 'react';
import { Provider } from 'react-redux'; // Assurez-vous d'importer le provider
import store from '../../../redux/store'; // Importation du store
import ArticleCard from '../../../components/ui/card';

const AjouterProf = () => {
  return (
    <Provider store={store}>
        <h1>Ajouter un professeur</h1>
    </Provider>
  );
};

export default AjouterProf;