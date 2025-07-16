import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock lazy-loaded components to avoid loading them during tests
vi.mock('./pages/AppleLandingPage', () => ({
  default: () => <div>Landing Page</div>
}));

vi.mock('./components/Dashboard', () => ({
  default: () => <div>Dashboard</div>
}));

vi.mock('./pages/TrackingPage', () => ({
  default: () => <div>Tracking Page</div>
}));

vi.mock('./pages/SignInPage', () => ({
  default: () => <div>Sign In Page</div>
}));

vi.mock('./pages/SignUpPage', () => ({
  default: () => <div>Sign Up Page</div>
}));

vi.mock('./pages/auth/OrganizationSignIn', () => ({
  OrganizationSignIn: () => <div>Organization Sign In</div>
}));

vi.mock('./pages/CreateOrganizationPage', () => ({
  default: () => <div>Create Organization Page</div>
}));

vi.mock('./pages/SuperAdminBranchPage', () => ({
  default: () => <div>Super Admin Branch Page</div>
}));

vi.mock('./pages/AboutPage', () => ({
  default: () => <div>About Page</div>
}));

vi.mock('./pages/AuthCallbackPage', () => ({
  default: () => <div>Auth Callback Page</div>
}));

describe('App Component', () => {
  it('renders without crashing', async () => {
    render(<App />);
    
    // Check for the loading state first (DesiCargo text in loader)
    const loadingText = await screen.findByText('DesiCargo', {}, { timeout: 1000 });
    expect(loadingText).toBeInTheDocument();
  });

  it('displays the landing page after loading', async () => {
    render(<App />);
    
    // Wait for the lazy-loaded landing page to appear
    const landingPage = await screen.findByText('Landing Page', {}, { timeout: 3000 });
    expect(landingPage).toBeInTheDocument();
  });
});