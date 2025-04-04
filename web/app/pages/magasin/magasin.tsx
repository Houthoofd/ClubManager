import React from 'react';
import { Provider } from 'react-redux'; // Assurez-vous d'importer le provider
import store from '../../../redux/store'; // Importation du store
import ArticleCard from '../../../components/ui/card';

const Magasin = () => {
  return (
    <Provider store={store}>
        <h1>Magasin</h1>

        <ArticleCard
          title="Chaussures de sport"
          description="Des chaussures légères et confortables pour vos entraînements."
          imageUrl="http://localhost:3000/public/images/frederic.jpg"
        />
    </Provider>
  );
};

export default Magasin;