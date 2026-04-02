/**
 * Main Entry Point
 *
 * Application entry point that bootstraps the React application.
 * Sets up providers, routing, and global styles.
 *
 * @module main
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app';

// PatternFly styles
import '@patternfly/react-core/dist/styles/base.css';

// Global styles
import './app/styles/globals.css';

// ============================================================================
// Bootstrap Application
// ============================================================================

const root = document.getElementById('root');

if (!root) {
  throw new Error(
    'Root element not found. Make sure there is a <div id="root"></div> in your index.html'
  );
}

// Create React root and render app
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ============================================================================
// Hot Module Replacement (HMR)
// ============================================================================

if (import.meta.hot) {
  import.meta.hot.accept();
}
