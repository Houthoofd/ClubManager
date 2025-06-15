import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import store from './redux/store'; // ← assure-toi que c'est le bon chemin vers ton store
import '@patternfly/react-core/dist/styles/base.css'; // 🧠 important !


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
