import { RouterProvider } from "react-router-dom";
import router from "./router";
import ErrorBoundary from "./components/common/ErrorBoundary";

const App = () => {
  return (
    <ErrorBoundary>
      <div className="App">
        <RouterProvider router={router} />
      </div>
    </ErrorBoundary>
  );
};

export default App;
