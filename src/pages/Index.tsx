"use client";

import React from 'react';
import { Navigate } from 'react-router-dom';

const Index = () => {
  // Por enquanto, redireciona para o login. 
  // Futuramente verificaremos se o usuário está autenticado.
  return <Navigate to="/login" />;
};

export default Index;