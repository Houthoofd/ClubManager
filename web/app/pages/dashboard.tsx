import React from 'react';
import { Provider } from 'react-redux'; // Assurez-vous d'importer le provider
import store from '../../redux/store'; // Importation du store

const Dashboard = () => {
  return (
    <Provider store={store}>
        <h1>Dashboard heho</h1>
    </Provider>
  );
};

export default Dashboard;
