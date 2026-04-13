"use client";

import React, { useState, useMemo } from 'react';
import { Lock, Eye, EyeOff, Loader2, Save, X, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import NotificationModal, { ModalType } from './NotificationModal';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResetPasswordModal = ({ isOpen, onClose }: ResetPasswordModalProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const validations = useMemo(() => {
    const hasMinLength = formData.password.length >= 6;
    const matches = formData.password === formData.confirmPassword && formData.confirmPassword !== '';
    return { hasMinLength, matches };
  }, [formData]);

  const canSave = validations.hasMinLength && validations.matches;

  const handleSave = async () => {
    if (!canSave) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) throw error;

      setAlertConfig({
        isOpen: true,
        type: 'success',
        title: 'Senha Alterada!',
        message: 'Sua nova senha foi salva com sucesso. Você já pode acessar o sistema.'
      });
      
      // Limpar formulário
      setFormData({ password: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Erro ao Salvar',
        message: error.message || 'Não foi possível atualizar sua senha. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses = "w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700";
  const labelClasses = "text-sm font-bold text-slate-600 mb-2 block ml-1";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
              <ShieldCheck size={32} />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
            Nova Senha
          </h3>
          <p className="text-slate-500 leading-relaxed mb-8">
            Defina uma nova senha de acesso para sua conta.
          </p>
          
          <div className="space-y-5">
            <div>
              <label className={labelClasses}>Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className={inputClasses}
                  placeholder="Mínimo 6 caracteres"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {!validations.hasMinLength && formData.password.length > 0 && (
                <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 uppercase tracking-wider">A senha deve ter pelo menos 6 caracteres</p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className={inputClasses}
                  placeholder="Repita a senha"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {!validations.matches && formData.confirmPassword.length > 0 && (
                <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 uppercase tracking-wider">As senhas não coincidem</p>
              )}
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={handleSave}
                disabled={loading || !canSave}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Salvar Nova Senha
              </button>
              
              <button
                onClick={onClose}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      <NotificationModal 
        isOpen={alertConfig.isOpen}
        onClose={() => {
          setAlertConfig(prev => ({ ...prev, isOpen: false }));
          if (alertConfig.type === 'success') onClose();
        }}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
};

export default ResetPasswordModal;