import { RouterProvider } from 'react-router-dom';
import router from './router';
import ErrorBoundary from './components/ErrorBoundary';
import { UserProvider } from './context/UserContext';
import ReduxDebugger from './components/debug/ReduxDebugger';

const App = () => {
  return (
    <ErrorBoundary>
      <UserProvider>
        <div className="App">
          {/* AJOUTÉ: Composant de debug Redux (uniquement en développement) */}
          {process.env.NODE_ENV === 'development' && <ReduxDebugger />}
          <RouterProvider router={router} />
        </div>
      </UserProvider>
    </ErrorBoundary>
  );
};

export default App;
