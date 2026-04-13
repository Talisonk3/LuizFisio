"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Evaluation from './pages/Evaluation';
import Index from './pages/Index';
import Patients from './pages/Patients';
import Share from './pages/Share';
import Profile from './pages/Profile';
import { useAuth } from './components/AuthProvider';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return null;

  const visitorAccess = sessionStorage.getItem('visitor_access');
  const isEvaluationPath = location.pathname.startsWith('/avaliacao/');
  
  // Acesso de visitante geral (pode ver a lista de pacientes do dono)
  const isGeneralVisitor = visitorAccess === 'general';
  
  // Acesso de visitante específico (só vê uma avaliação)
  const currentEvalId = location.pathname.split('/')[2];
  const isSpecificVisitor = visitorAccess && isEvaluationPath && visitorAccess === currentEvalId;

  if (!session && !isGeneralVisitor && !isSpecificVisitor) {
    return <Navigate to="/login" />;
  }

  // Visitantes gerais não podem acessar a Home, Share ou Perfil
  if (isGeneralVisitor && (location.pathname === '/' || location.pathname === '/compartilhar' || location.pathname === '/perfil')) {
    return <Navigate to="/pacientes" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/avaliacao" element={<ProtectedRoute><Evaluation /></ProtectedRoute>} />
        <Route path="/avaliacao/:id" element={<ProtectedRoute><Evaluation /></ProtectedRoute>} />
        <Route path="/pacientes" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
        <Route path="/compartilhar" element={<ProtectedRoute><Share /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;