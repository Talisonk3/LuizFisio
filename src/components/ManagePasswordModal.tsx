"use client";

import React, { useState, useEffect } from 'react';
import { X, Lock, User, Loader2, Eye, EyeOff, Check, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ManagePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitorId: string;
  visitorName: string;
  onSuccess: (message: string) => void;
}

const ManagePasswordModal = ({ isOpen, onClose, visitorId, visitorName, onSuccess }: ManagePasswordModalProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [originalPassword, setOriginalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchPassword = async () => {
      if (!isOpen || !visitorId) return;
      
      // Sempre resetar para oculto ao abrir
      setShowPassword(false);
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('visitors')
          .select('password')
          .eq('id', visitorId)
          .single();
        
        if (!error && data) {
          setPassword(data.password);
          setOriginalPassword(data.password);
        }
      } catch (error) {
        console.error('Erro ao buscar senha:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPassword();
  }, [isOpen, visitorId]);

  const handleUpdatePassword = async () => {
    if (!password || password.length < 4 || password === originalPassword) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('visitors')
        .update({ password: password.trim() })
        .eq('id', visitorId);
      
      if (error) throw error;
      
      onSuccess(`Senha de "${visitorName}" atualizada com sucesso!`);
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const isChanged = password !== originalPassword;
  const isInvalid = password.length < 4;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-amber-50 p-4 rounded-2xl text-amber-600">
              <Lock size={32} />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
            Gerenciar Senha
          </h3>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Usuário:</span>
            <span className="text-xs font-black text-amber-600 uppercase tracking-widest">{visitorName}</span>
          </div>
          
          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p className="text-sm font-medium">Buscando credenciais...</p>
              </div>
            ) : (
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-2 block ml-1">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value.trimStart())}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="Mínimo 4 caracteres"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {isInvalid && password.length > 0 && (
                  <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 uppercase tracking-wider">A senha deve ter pelo menos 4 caracteres</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handleUpdatePassword}
                disabled={saving || !isChanged || isInvalid || loading}
                className="w-full bg-amber-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
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
    </div>
  );
};

export default ManagePasswordModal;