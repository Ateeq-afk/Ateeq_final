import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TrackingPage from './pages/TrackingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/track" element={<TrackingPage />} />
        <Route path="/track/:lrNumber" element={<TrackingPage />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;