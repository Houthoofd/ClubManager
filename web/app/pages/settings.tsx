import React from 'react';
import { Provider } from 'react-redux'; // Assurez-vous d'importer le provider
import store from '../../redux/store'; // Importation du store

const Settings = () => {
  return (
    <Provider store={store}>
        <h1>Settings</h1>
    </Provider>
  );
};

export default Settings;