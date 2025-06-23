import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TrackingPage from './pages/TrackingPage';
import LoginPage from './pages/LoginPage';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/track" element={<TrackingPage />} />
        <Route path="/track/:lrNumber" element={<TrackingPage />} />
        {user ? (
          <>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="*" element={<Dashboard />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
