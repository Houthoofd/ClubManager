import { RouterProvider } from 'react-router-dom';
import router from './router';
import ErrorBoundary from './components/ErrorBoundary';
import { UserProvider } from './context/UserContext'; // Importer le UserProvider

const App = () => {
  return (
    <ErrorBoundary>
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </ErrorBoundary>
  );
};

export default App;