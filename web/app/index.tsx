import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './app';
import store from '../redux/store';

if (typeof document !== 'undefined') {
  createRoot(document.getElementById('root') as HTMLElement).render(
    <Provider store={store}>
      <App />
    </Provider>
  );
} else {
  // Tu peux gérer le cas côté serveur ici si nécessaire
  console.warn('document is not defined');
}
