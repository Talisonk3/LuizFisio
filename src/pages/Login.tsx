"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Stethoscope } from 'lucide-react';

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/avaliacao');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-100">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <Stethoscope className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">FisioSystem</h1>
          <p className="text-slate-500 text-center mt-2">Sua plataforma inteligente de avaliação</p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                  inputBackground: '#f8fafc',
                  inputText: '#1e293b',
                  inputBorder: '#e2e8f0',
                  inputBorderFocus: '#2563eb',
                  inputBorderHover: '#cbd5e1',
                },
                radii: {
                  borderRadiusButton: '12px',
                  buttonPadding: '12px',
                  inputPadding: '12px',
                }
              }
            },
            className: {
              input: 'rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 transition-all',
              button: 'rounded-xl font-bold shadow-md hover:shadow-lg transition-all',
            }
          }}
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Seu e-mail',
                password_label: 'Sua senha',
                button_label: 'Entrar agora',
                loading_button_label: 'Entrando...',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entre aqui',
              },
              sign_up: {
                email_label: 'E-mail',
                password_label: 'Crie uma senha',
                button_label: 'Criar minha conta',
                loading_button_label: 'Criando conta...',
                link_text: 'Não tem uma conta? Cadastre-se',
                confirmation_text: 'Verifique seu e-mail para confirmar o cadastro',
              },
              forgotten_password: {
                email_label: 'E-mail',
                password_label: 'Senha',
                button_label: 'Recuperar senha',
                loading_button_label: 'Enviando e-mail...',
                link_text: 'Esqueceu sua senha?',
                confirmation_text: 'Verifique seu e-mail para redefinir a senha',
              },
              update_password: {
                password_label: 'Nova senha',
                button_label: 'Atualizar senha',
                loading_button_label: 'Atualizando...',
                confirmation_text: 'Sua senha foi atualizada com sucesso',
              }
            }
          }}
          theme="light"
        />
      </div>
    </div>
  );
};

export default Login;