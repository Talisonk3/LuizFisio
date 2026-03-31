"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Stethoscope, User, Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });

  useEffect(() => {
    if (session) {
      navigate('/avaliacao');
    }
  }, [session, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let filteredValue = value.trimStart();
    
    if (name === 'fullName') {
      filteredValue = filteredValue.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    }
    
    setFormData(prev => ({ ...prev, [name]: filteredValue }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username.toLowerCase(),
              full_name: formData.fullName
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (!data.session) {
          setError("Conta criada! Tente entrar agora.");
          setIsSignUp(false);
        }
      } else {
        let loginEmail = formData.username;

        // Se não for um e-mail (não tem @), tenta buscar o e-mail pelo username na tabela profiles
        if (!loginEmail.includes('@')) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', loginEmail.toLowerCase())
            .single();

          if (profileError || !profile) {
            throw new Error('Usuário não encontrado. Verifique o nome ou use seu e-mail.');
          }
          loginEmail = profile.email;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: formData.password,
        });

        if (signInError) throw signInError;
      }
    } catch (err: any) {
      console.error('Erro de Auth:', err);
      setError(err.message || 'Erro ao acessar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <Stethoscope className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">FisioSystem</h1>
          <p className="text-slate-500 text-center mt-2">
            {isSignUp ? 'Crie sua conta de profissional' : 'Acesse sua plataforma de avaliação'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">E-mail Real</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">
              {isSignUp ? 'Nome de Usuário' : 'E-mail ou Usuário'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder={isSignUp ? "Ex: joao_fisio" : "E-mail ou nome de usuário"}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Criar Minha Conta' : 'Entrar no Sistema')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setShowPassword(false);
              setError(null);
            }}
            className="text-blue-600 font-semibold hover:underline text-sm"
          >
            {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;