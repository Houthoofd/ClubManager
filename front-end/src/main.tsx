import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import store from './redux/store';
import '@patternfly/react-core/dist/styles/base.css';
import './styles/global.css';
import './styles/tabs.css';
import './styles/sidebar.css';
import './styles/sidebar-initial.css';
import './styles/cards.css';
import './styles/panel.css';
import './styles/modals.css';
import './styles/forms.css';
import './styles/tables.css';
import './styles/participants.css';
import './styles/professeurs.css';
import './styles/cours.css';
import './styles/inscription.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
