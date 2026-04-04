"use client";

import React, { useState, useEffect } from 'react';
import { X, Lock, User, Save, Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  evaluationId?: string;
  onSuccess: (message: string) => void;
  userId?: string;
}

const ShareModal = ({ isOpen, onClose, patientName, evaluationId, onSuccess }: ShareModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  // Resetar form ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: '',
        password: '',
        confirmPassword: ''
      });
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);

    if (!evaluationId) {
      setError('Erro interno: ID do paciente não encontrado.');
      return;
    }

    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('evaluations')
        .update({
          visitor_username: formData.username.toLowerCase().trim(),
          visitor_password: formData.password.trim()
        })
        .eq('id', evaluationId);

      if (updateError) throw updateError;

      onSuccess(`Acesso de visitante para ${patientName} configurado com sucesso!`);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar credenciais. Tente outro nome de usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-purple-50 p-4 rounded-2xl text-purple-600">
              <Lock size={32} />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
            Criar Acesso de Visitante
          </h3>
          <p className="text-slate-500 leading-relaxed mb-8">
            Defina as credenciais para <span className="font-bold text-slate-700">{patientName}</span> acessar a ficha.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Nome de Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                  placeholder="Ex: paciente_joao"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Senha (Visível)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                  placeholder="Defina uma senha"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="text"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                  placeholder="Repita a senha"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">
                <ShieldAlert size={16} />
                {error}
              </div>
            )}
            
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Criar Acesso
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
  );
};

export default ShareModal;