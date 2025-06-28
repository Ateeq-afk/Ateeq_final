import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/notifications/NotificationProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { BranchSelectionProvider } from './contexts/BranchSelectionContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <BranchSelectionProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </BranchSelectionProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);