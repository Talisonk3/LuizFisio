"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de login para demonstração da interface
    navigate('/avaliacao');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <Stethoscope className="text-blue-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">FisioSystem</h1>
          <p className="text-slate-500">Acesse sua plataforma de avaliação</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors shadow-lg shadow-blue-200"
          >
            Entrar
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Esqueceu sua senha? <span className="text-blue-600 cursor-pointer hover:underline">Recuperar</span>
        </p>
      </div>
    </div>
  );
};

export default Login;