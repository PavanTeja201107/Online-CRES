/*
 * Entry point for the React application. Sets up React Router, authentication context, and toast notifications.
 * Renders the App component inside the root HTML element.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
// Bootstrap
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
