"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Stethoscope, User, Lock, Mail, Loader2, Eye, EyeOff, UserCircle, CheckSquare, Square } from 'lucide-react';

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isVisitor, setIsVisitor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword]= useState(false); 
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });

  useEffect(() => {
    if (session) {
      navigate('/');
      return;
    }

    // Recuperar apenas o nome de usuário, nunca a senha
    const savedUsername = localStorage.getItem('fisio_remembered_user');
    if (savedUsername && !isSignUp && !isVisitor) {
      setFormData(prev => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }
  }, [session, navigate, isSignUp, isVisitor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'fullName') {
      const filteredValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: filteredValue }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Gerenciar "Lembrar de mim" de forma segura (apenas o username)
      if (rememberMe && !isSignUp && !isVisitor) {
        localStorage.setItem('fisio_remembered_user', formData.username.trim());
      } else {
        localStorage.removeItem('fisio_remembered_user');
      }

      if (isVisitor) {
        // Login de Visitante Geral
        const { data: generalVisitor, error: genError } = await supabase
          .from('visitors')
          .select('id, created_by, is_active')
          .eq('username', formData.username.toLowerCase().trim())
          .eq('password', formData.password.trim())
          .maybeSingle();

        if (generalVisitor) {
          if (!generalVisitor.is_active) {
            throw new Error('Este acesso está desativado. Entre em contato com o profissional.');
          }
          sessionStorage.setItem('visitor_access', 'general');
          sessionStorage.setItem('visitor_owner', generalVisitor.created_by);
          sessionStorage.setItem('visitor_id', generalVisitor.id);
          navigate('/pacientes');
          return;
        }

        // Login de Visitante Específico (Ficha Única)
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
      } else if (isSignUp) {
        // Cadastro de Profissional
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
        if (!data.session) setError("Conta criada! Verifique seu e-mail para confirmar.");
      } else {
        // Login de Profissional
        let loginEmail = formData.username.trim();
        
        // Se não for e-mail, buscar o e-mail associado ao username
        if (!loginEmail.includes('@')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', loginEmail.toLowerCase())
            .maybeSingle();
          
          if (profile?.email) {
            loginEmail = profile.email;
          } else {
            throw new Error('Usuário não encontrado.');
          }
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: formData.password,
        });
        
        if (signInError) throw new Error('Usuário ou senha incorretos.');
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
            {isVisitor ? 'Acesso de Visitante' : (isSignUp ? 'Crie sua conta' : 'Acesse sua plataforma')}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Nome Completo</label>
                <input name="fullName" type="text" required value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all" placeholder="Seu nome" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">E-mail</label>
                <input name="email" type="email" required value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all" placeholder="seu@email.com" />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Usuário</label>
            <input name="username" type="text" required value={formData.username} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all" placeholder="Nome de usuário" />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Senha</label>
            <div className="relative">
              <input name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isSignUp && !isVisitor && (
            <div className="flex items-center justify-between px-1">
              <button 
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                {rememberMe ? (
                  <CheckSquare className="text-blue-600" size={18} />
                ) : (
                  <Square className="text-slate-300" size={18} />
                )}
                Lembrar meu usuário
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-600 text-xs text-center font-bold">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className={`w-full text-white py-4 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 ${isVisitor ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
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