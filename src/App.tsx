"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Evaluation from './pages/Evaluation';
import Index from './pages/Index';
import Patients from './pages/Patients';
import Share from './pages/Share';
import { useAuth } from './components/AuthProvider';

// Componente para proteger rotas que exigem login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return null;

  // Verificar se é um acesso de visitante autorizado para esta avaliação específica
  const visitorAccessId = sessionStorage.getItem('visitor_access');
  const isEvaluationPath = location.pathname.startsWith('/avaliacao/');
  const currentEvalId = location.pathname.split('/')[2];
  
  const isAuthorizedVisitor = visitorAccessId && isEvaluationPath && visitorAccessId === currentEvalId;

  if (!session && !isAuthorizedVisitor) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/avaliacao" element={
          <ProtectedRoute>
            <Evaluation />
          </ProtectedRoute>
        } />
        <Route path="/avaliacao/:id" element={
          <ProtectedRoute>
            <Evaluation />
          </ProtectedRoute>
        } />
        <Route path="/pacientes" element={
          <ProtectedRoute>
            <Patients />
          </ProtectedRoute>
        } />
        <Route path="/compartilhar" element={
          <ProtectedRoute>
            <Share />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;