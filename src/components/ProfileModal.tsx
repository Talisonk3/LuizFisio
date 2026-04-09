"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Save, Loader2, Award, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (message: string) => void;
}

const ProfileModal = ({ isOpen, onClose, userId, onSuccess }: ProfileModalProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    crefito: '',
    phone: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (isOpen && userId) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, crefito, phone')
            .eq('id', userId)
            .maybeSingle();
          
          if (!error && data) {
            setFormData(prev => ({
              ...prev,
              full_name: data.full_name || '',
              crefito: data.crefito || '',
              phone: data.phone || ''
            }));
          }
        } catch (error) {
          console.error('Erro ao buscar perfil:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [isOpen, userId]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCrefito = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '').substring(0, 6);
    const suffix = value.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 1);
    
    if (numbers && suffix) return `${numbers}-${suffix}`;
    if (numbers) return numbers;
    return suffix;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let filteredValue = value;

    if (name === 'full_name') {
      filteredValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (name === 'phone') {
      filteredValue = formatPhone(value);
    } else if (name === 'crefito') {
      filteredValue = formatCrefito(value);
    }

    setFormData(prev => ({ ...prev, [name]: filteredValue }));
  };

  const handleSave = async () => {
    if (!isFormValid) return;
    
    setSaving(true);
    try {
      // Atualizar Perfil no Banco
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          crefito: formData.crefito.trim(),
          phone: formData.phone.trim()
        })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // Atualizar Metadados do Usuário
      await supabase.auth.updateUser({
        data: { full_name: formData.full_name.trim() }
      });

      // Atualizar Senha se preenchida
      if (formData.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });
        if (passwordError) throw passwordError;
      }

      onSuccess('Perfil e senha atualizados com sucesso!');
      onClose();
      // Limpar campos de senha
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      alert('Erro ao salvar: ' + (err.message || 'Verifique a conexão.'));
    } finally {
      setSaving(false);
    }
  };

  // Validação: Nome preenchido, CREFITO completo, Telefone completo
  // E se a senha for preenchida, deve ter 6+ caracteres e coincidir
  const isPasswordValid = !formData.newPassword || (formData.newPassword.length >= 6 && formData.newPassword === formData.confirmPassword);
  
  const isFormValid = 
    formData.full_name.trim().length > 0 && 
    formData.crefito.length === 8 && 
    formData.phone.length === 15 &&
    isPasswordValid;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
              <User size={32} />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
            Meu Perfil
          </h3>
          <p className="text-slate-500 text-sm mb-8">
            Mantenha seus dados profissionais e de acesso atualizados.
          </p>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin mb-3" size={32} />
              <p className="text-sm font-medium">Carregando dados...</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">CREFITO</label>
                  <div className="relative">
                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      name="crefito"
                      value={formData.crefito}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                      placeholder="123456-F"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Segurança e Acesso</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nova Senha (opcional)</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                        placeholder="Mínimo 6 caracteres"
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

                  {formData.newPassword && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Confirmar Nova Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-2xl focus:ring-2 outline-none transition-all font-medium text-slate-700 ${
                            formData.confirmPassword && formData.newPassword !== formData.confirmPassword 
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                            : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                          placeholder="Repita a nova senha"
                        />
                      </div>
                      {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                        <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 uppercase tracking-wider">As senhas não coincidem</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || !isFormValid}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Salvar Alterações
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;