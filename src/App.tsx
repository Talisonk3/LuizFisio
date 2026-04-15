"use client";

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Evaluation from './pages/Evaluation';
import Index from './pages/Index';
import Patients from './pages/Patients';
import Share from './pages/Share';
import { useAuth } from './components/AuthProvider';
import ProfileModal from './components/ProfileModal';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return null;

  const visitorAccess = sessionStorage.getItem('visitor_access');
  const isEvaluationPath = location.pathname.startsWith('/avaliacao/');
  
  const isGeneralVisitor = visitorAccess === 'general';
  const currentEvalId = location.pathname.split('/')[2];
  const isSpecificVisitor = visitorAccess && isEvaluationPath && visitorAccess === currentEvalId;

  if (!session && !isGeneralVisitor && !isSpecificVisitor) {
    return <Navigate to="/login" />;
  }

  if (isGeneralVisitor && (location.pathname === '/' || location.pathname === '/compartilhar')) {
    return <Navigate to="/pacientes" />;
  }
  
  return <>{children}</>;
};

function App() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleOpenProfile = () => setIsProfileOpen(true);
    window.addEventListener('open-profile-modal', handleOpenProfile);
    return () => window.removeEventListener('open-profile-modal', handleOpenProfile);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/avaliacao" element={<ProtectedRoute><Evaluation /></ProtectedRoute>} />
        <Route path="/avaliacao/:id" element={<ProtectedRoute><Evaluation /></ProtectedRoute>} />
        <Route path="/pacientes" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
        <Route path="/compartilhar" element={<ProtectedRoute><Share /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </Router>
  );
}

export default App;