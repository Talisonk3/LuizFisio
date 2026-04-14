"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Stethoscope, User, Lock, Mail, Loader2, Eye, EyeOff, UserCircle, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import ResetPasswordModal from '@/components/ResetPasswordModal';

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isVisitor, setIsVisitor] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetModalOpen(true);
      }
    });

    if (session && !isResetModalOpen) {
      navigate('/');
    }

    if (!isSignUp && !isVisitor && !isForgotPassword) {
      const savedUsername = localStorage.getItem('fisio_username');
      const savedPassword = localStorage.getItem('fisio_password');
      const savedVisitor = localStorage.getItem('fisio_is_visitor') === 'true';

      if (savedUsername && savedPassword && !savedVisitor) {
        setFormData(prev => ({
          ...prev,
          username: savedUsername,
          password: savedPassword
        }));
        setRememberMe(true);
      }
    }

    return () => subscription.unsubscribe();
  }, [session, navigate, isSignUp, isVisitor, isForgotPassword, isResetModalOpen]);

  useEffect(() => {
    const validateEmail = async () => {
      if (!isForgotPassword || !formData.email || !formData.email.includes('@')) {
        setEmailError(null);
        setIsEmailVerified(false);
        return;
      }

      setCheckingEmail(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.email.trim().toLowerCase())
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          setEmailError('E-mail incorreto ou não cadastrado.');
          setIsEmailVerified(false);
        } else {
          setEmailError(null);
          setIsEmailVerified(true);
        }
      } catch (err) {
        console.error('Erro ao validar e-mail:', err);
        setIsEmailVerified(false);
      } finally {
        setCheckingEmail(false);
      }
    };

    const timer = setTimeout(validateEmail, 500);
    return () => clearTimeout(timer);
  }, [formData.email, isForgotPassword]);

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
      if (isForgotPassword) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/login`,
        });
        if (resetError) throw resetError;
        setResetSent(true);
        return;
      }

      if (rememberMe && !isSignUp && !isVisitor) {
        localStorage.setItem('fisio_username', formData.username);
        localStorage.setItem('fisio_password', formData.password);
        localStorage.setItem('fisio_is_visitor', 'false');
      } else if (!isSignUp && !isVisitor) {
        localStorage.removeItem('fisio_username');
        localStorage.removeItem('fisio_password');
        localStorage.removeItem('fisio_is_visitor');
      }

      if (isVisitor) {
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
        if (!loginEmail.includes('@')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', loginEmail.toLowerCase())
            .maybeSingle();
          if (profile?.email) loginEmail = profile.email;
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
    setIsForgotPassword(false);
    setError(null);
    setFormData({ username: '', email: '', password: '', fullName: '' });
  };

  const toggleVisitorMode = () => {
    setIsVisitor(!isVisitor);
    setIsSignUp(false);
    setIsForgotPassword(false);
    setError(null);
    setFormData({ username: '', email: '', password: '', fullName: '' });
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setIsSignUp(false);
    setIsVisitor(false);
    setError(null);
    setEmailError(null);
    setIsEmailVerified(false);
    setResetSent(false);
    setFormData({ username: '', email: '', password: '', fullName: '' });
  };

  if (isForgotPassword && resetSent) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 text-center">
          <div className="bg-emerald-100 p-4 rounded-2xl w-fit mx-auto mb-6 text-emerald-600">
            <Mail size={40} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-4">E-mail Enviado!</h1>
          <p className="text-slate-500 mb-8">
            Enviamos as instruções para recuperação de senha para o e-mail <strong>{formData.email}</strong>.
          </p>
          <button 
            onClick={toggleForgotPassword}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all"
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className={`${isVisitor ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200'} p-4 rounded-2xl shadow-lg mb-4 transition-colors duration-500`}>
            {isVisitor ? <UserCircle className="text-white w-10 h-10" /> : <Stethoscope className="text-white w-10 h-10" />}
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">FisioSystem</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
            {isVisitor ? 'Acesso de Visitante' : 'Gestão Fisioterapêutica'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>
          )}

          {isForgotPassword ? (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">E-mail da Conta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all ${emailError ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="seu@email.com"
                />
              </div>
              {checkingEmail && <p className="text-[10px] text-blue-500 font-bold mt-2 ml-1 uppercase">Verificando e-mail...</p>}
              {emailError && <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 uppercase">{emailError}</p>}
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">
                  {isVisitor ? 'Nome de Usuário' : 'Usuário ou E-mail'}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder={isVisitor ? "Ex: assistente_clinica" : "Seu usuário"}
                  />
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">Senha</label>
                  {!isSignUp && !isVisitor && (
                    <button 
                      type="button" 
                      onClick={toggleForgotPassword}
                      className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {!isSignUp && !isVisitor && !isForgotPassword && (
            <button 
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors group"
            >
              {rememberMe ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="group-hover:border-blue-400" />}
              Lembrar meus dados
            </button>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (isForgotPassword && !isEmailVerified && !checkingEmail)}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
              isVisitor ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isForgotPassword ? 'Enviar Link de Recuperação' : (isSignUp ? 'Criar Minha Conta' : 'Entrar no Sistema'))}
          </button>
        </form>

        <div className="mt-8 space-y-4">
          {isForgotPassword ? (
            <button 
              onClick={toggleForgotPassword}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-all"
            >
              <ArrowLeft size={18} /> Voltar para o Login
            </button>
          ) : (
            <>
              <button
                onClick={toggleAuthMode}
                className="w-full text-sm font-bold text-slate-500 hover:text-blue-600 transition-all"
              >
                {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se grátis'}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Ou</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button
                onClick={toggleVisitorMode}
                className={`w-full py-4 rounded-2xl font-bold border-2 transition-all ${
                  isVisitor 
                  ? 'bg-blue-50 border-blue-200 text-blue-600' 
                  : 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
                }`}
              >
                {isVisitor ? 'Voltar para Login Profissional' : 'Entrar como Visitante'}
              </button>
            </>
          )}
        </div>
      </div>

      <ResetPasswordModal 
        isOpen={isResetModalOpen} 
        onClose={() => setIsResetModalOpen(false)} 
      />
    </div>
  );
};

export default Login;