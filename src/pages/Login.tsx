"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Stethoscope, User, Lock, Mail, Loader2, Eye, EyeOff, UserCircle } from 'lucide-react';

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isVisitor, setIsVisitor] = useState(false);
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
      navigate('/'); // Redireciona para o Dashboard
    }
  }, [session, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'password') {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

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
      if (isVisitor) {
        // Lógica de Login de Visitante
        const { data: evaluation, error: visitorError } = await supabase
          .from('evaluations')
          .select('id')
          .eq('visitor_username', formData.username.toLowerCase().trim())
          .eq('visitor_password', formData.password.trim())
          .maybeSingle();

        if (visitorError) throw visitorError;

        if (evaluation) {
          // Armazenar token temporário de visitante no sessionStorage para o ProtectedRoute
          sessionStorage.setItem('visitor_access', evaluation.id);
          navigate(`/avaliacao/${evaluation.id}?mode=view`);
        } else {
          throw new Error('Usuário ou senha de visitante incorretos.');
        }
      } else if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              username: formData.username.toLowerCase().trim(),
              full_name: formData.fullName.trim()
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (!data.session) {
          setError("Conta criada! Mas o seu Supabase ainda exige confirmação por e-mail. Desative 'Confirm Email' no painel do Supabase para logar direto.");
        }
      } else {
        let loginEmail = formData.username.trim();

        if (!loginEmail.includes('@')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', loginEmail.toLowerCase())
            .maybeSingle();

          if (profile?.email) {
            loginEmail = profile.email;
          }
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: formData.password,
        });

        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error('E-mail não confirmado. Desative a exigência de confirmação no painel do Supabase.');
          }
          throw new Error('Usuário ou senha incorretos.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao acessar o sistema.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setIsVisitor(false);
    setError(null);
    setFormData({ username: '', email: '', password: '', fullName: '' });
  };

  const toggleVisitorMode = () => {
    setIsVisitor(!isVisitor);
    setIsSignUp(false);
    setError(null);
    setFormData({ username: '', email: '', password: '', fullName: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className={`${isVisitor ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200'} p-4 rounded-2xl shadow-lg mb-4 transition-colors duration-500`}>
            {isVisitor ? <UserCircle className="text-white w-10 h-10" /> : <Stethoscope className="text-white w-10 h-10" />}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">FisioSystem</h1>
          <p className="text-slate-500 text-center mt-2">
            {isVisitor ? 'Acesso de Visitante' : (isSignUp ? 'Crie sua conta de profissional' : 'Acesse sua plataforma de avaliação')}
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
                <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">E-mail</label>
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
              {isVisitor ? 'Usuário de Visitante' : (isSignUp ? 'Nome de Usuário' : 'E-mail ou Usuário')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 outline-none transition-all ${isVisitor ? 'focus:ring-purple-500/20 focus:border-purple-500' : 'focus:ring-blue-500/20 focus:border-blue-500'}`}
                placeholder={isVisitor ? "Ex: paciente_joao" : (isSignUp ? "Ex: joao_fisio" : "E-mail ou nome de usuário")}
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
                className={`w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 outline-none transition-all ${isVisitor ? 'focus:ring-purple-500/20 focus:border-purple-500' : 'focus:ring-blue-500/20 focus:border-blue-500'}`}
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

          {error && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
              <p className="text-red-600 text-xs text-center font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isVisitor ? 'bg-purple-600 shadow-purple-100 hover:bg-purple-700' : 'bg-blue-600 shadow-blue-100 hover:bg-blue-700'}`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isVisitor ? 'Acessar como Visitante' : (isSignUp ? 'Criar Minha Conta' : 'Entrar no Sistema'))}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-3 text-center">
          <button
            onClick={toggleAuthMode}
            className="text-blue-600 font-semibold hover:underline text-sm"
          >
            {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Cadastre-se'}
          </button>
          
          <div className="flex items-center gap-2 py-2">
            <div className="h-px bg-slate-100 flex-1"></div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Ou</span>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>

          <button
            onClick={toggleVisitorMode}
            className={`font-bold text-sm transition-colors ${isVisitor ? 'text-blue-600 hover:underline' : 'text-purple-600 hover:underline'}`}
          >
            {isVisitor ? 'Voltar para Login Profissional' : 'Sou Visitante (Acessar com senha)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;