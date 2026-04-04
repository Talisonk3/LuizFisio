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
  // Senha visível por padrão conforme solicitado
  const [showPassword, setShowPassword] = useState(true);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isVisitor) {
        // LOGIN DE VISITANTE (Geral ou Específico)
        // 1. Tentar login como visitante geral (tabela 'visitors')
        const { data: generalVisitor, error: genError } = await supabase
          .from('visitors')
          .select('id, created_by')
          .eq('username', formData.username.toLowerCase().trim())
          .eq('password', formData.password.trim())
          .maybeSingle();

        if (generalVisitor) {
          sessionStorage.setItem('visitor_access', 'general');
          sessionStorage.setItem('visitor_owner', generalVisitor.created_by);
          navigate('/pacientes');
          return;
        }

        // 2. Tentar login como visitante de paciente específico (legado na tabela 'evaluations')
        const { data: evaluation, error: visitorError } = await supabase
          .from('evaluations')
          .select('id')
          .eq('visitor_username', formData.username.toLowerCase().trim())
          .eq('visitor_password', formData.password.trim())
          .maybeSingle();

        if (evaluation) {
          sessionStorage.setItem('visitor_access', evaluation.id);
          navigate(`/avaliacao/${evaluation.id}?mode=view`);
        } else {
          throw new Error('Usuário ou senha de visitante incorretos.');
        }
      } else {
        // LOGIN PROFISSIONAL (Apenas via Supabase Auth)
        if (isSignUp) {
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
          if (!data.session) setError("Conta criada! Verifique seu e-mail.");
        } else {
          let loginEmail = formData.username.trim();
          
          // Se não for e-mail, busca o e-mail associado ao username no perfil profissional
          if (!loginEmail.includes('@')) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('username', loginEmail.toLowerCase())
              .maybeSingle();
            
            if (profile?.email) {
              loginEmail = profile.email;
            } else {
              // Se não achar no perfil, o login vai falhar naturalmente no Supabase Auth
              // pois visitantes não existem lá.
            }
          }

          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: formData.password,
          });

          if (signInError) throw new Error('Usuário ou senha incorretos.');
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
  };

  const toggleVisitorMode = () => {
    setIsVisitor(!isVisitor);
    setIsSignUp(false);
    setError(null);
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
            {isVisitor ? 'Acesso de Visitante' : (isSignUp ? 'Crie sua conta' : 'Acesse sua plataforma')}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Nome Completo</label>
                <input name="fullName" type="text" required value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Seu nome" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">E-mail</label>
                <input name="email" type="email" required value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="seu@email.com" />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Usuário</label>
            <input name="username" type="text" required value={formData.username} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Nome de usuário" />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Senha</label>
            <div className="relative">
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                required 
                value={formData.password} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                placeholder="••••••••" 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-xs text-center font-medium">{error}</p>}

          <button type="submit" disabled={loading} className={`w-full text-white py-4 rounded-xl font-bold shadow-lg transition-all ${isVisitor ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isVisitor ? 'Entrar como Visitante' : 'Entrar no Sistema')}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-3 text-center">
          <button onClick={toggleAuthMode} className="text-blue-600 font-semibold hover:underline text-sm">
            {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem uma conta? Cadastre-se'}
          </button>
          <button onClick={toggleVisitorMode} className="text-purple-600 font-bold hover:underline text-sm">
            {isVisitor ? 'Voltar para Login Profissional' : 'Sou Visitante (Acessar com senha)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;