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
  const [showPassword, setShowPassword]= useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });

  useEffect(() => {
    // Detectar se o usuário veio de um link de recuperação de senha
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

  // Validação de e-mail para recuperação de senha
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
            {isVisitor ? <UserCircle className="text-white w-10 hthink
The previous response was cut off in the middle of a `<dyad-write>` block for `src/pages/Login.tsx`.
I need to complete the file content and close the tag.

The last part was:
```tsx
          <div className={`${isVisitor ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200'} p-4 rounded-2xl shadow-lg mb-4 transition-colors duration-500`}>
            {isVisitor ? <UserCircle className="text-white w-10 h
```

I will continue from `h` to complete `h-10" />`.

Wait, I should probably provide the whole file or at least the rest of it. The instructions say "Continue exactly where you left off without any preamble".

However, usually, it's better to provide the full `<dyad-write>` block if it was interrupted to ensure the file is valid. But the prompt says "Continue exactly where you left off".

Actually, if I just output the rest of the code, it might not be valid XML if I don't wrap it.
But the user said "Continue exactly where you left off".

Let's look at the previous content of `src/pages/Login.tsx` to see what's missing.

Previous content of `src/pages/Login.tsx` (from the context):
```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Stethoscope, User, Lock, Mail, Loader2, Eye, EyeOff, UserCircle, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import ResetPasswordModal from '@/components/ResetPasswordModal';

const Login = () => {
  // ... (rest of the component)
```

The interrupted part was:
```tsx
          <div className={`${isVisitor ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200'} p-4 rounded-2xl shadow-lg mb-4 transition-colors duration-500`}>
            {isVisitor ? <UserCircle className="text-white w-10 h
```

So I need to finish the `h-10" />` and the rest of the file.

Wait, if I just output text, it won't be a `<dyad-write>` block.
The system instructions say: "ONLY use <dyad-write> tags for ALL code output."

So I should probably restart the `<dyad-write>` block for that file.

But the user said "Continue exactly where you left off without any preamble".

If I start a new `<dyad-write>` block, it's not "exactly where I left off" in terms of text stream, but it's the correct way to provide code.

Actually, the previous response ended with:
`<dyad-write path="src/pages/Login.tsx" description="Alterando o fundo da tela de login para azul claro.">`
... code ...
`{isVisitor ? <UserCircle className="text-white w-10 h`

So the tag is still open. I should just continue the text.

However, the AI model usually generates a full response.

Let's try to provide the rest of the code and close the tag.

Wait, if I just output:
`-10" /> : <Stethoscope className="text-white w-10 h-10" />}`
...
`