"use client";

import React, { useState, useEffect } from 'react';
import { X, Lock, User, Save, Loader2, ShieldAlert, Search, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  evaluationId?: string;
  onSuccess: (message: string) => void;
  userId?: string;
}

const ShareModal = ({ isOpen, onClose, patientName: initialPatientName, evaluationId: initialEvalId, onSuccess, userId }: ShareModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<{id: string, patient_name: string}[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  
  const [formData, setFormData] = useState({
    evaluationId: initialEvalId || '',
    patientName: initialPatientName || '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  // Carregar pacientes se não houver um ID inicial (fluxo de "Adicionar Usuário" na tela de Share)
  useEffect(() => {
    if (isOpen && !initialEvalId && userId) {
      const fetchPatients = async () => {
        setLoadingPatients(true);
        const { data } = await supabase
          .from('evaluations')
          .select('id, patient_name')
          .eq('user_id', userId)
          .order('patient_name', { ascending: true });
        
        if (data) setPatients(data);
        setLoadingPatients(false);
      };
      fetchPatients();
    }
  }, [isOpen, initialEvalId, userId]);

  // Resetar form ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setFormData({
        evaluationId: initialEvalId || '',
        patientName: initialPatientName || '',
        username: '',
        password: '',
        confirmPassword: ''
      });
      setError(null);
    }
  }, [isOpen, initialEvalId, initialPatientName]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);

    if (!formData.evaluationId) {
      setError('Por favor, selecione um paciente.');
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
        .eq('id', formData.evaluationId);

      if (updateError) throw updateError;

      onSuccess(`Acesso de visitante configurado com sucesso!`);
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
            Defina um usuário e senha para que o paciente ou outro profissional possa visualizar a ficha.
          </p>
          
          <div className="space-y-4">
            {/* Seleção de Paciente (apenas se não vier de uma ficha específica) */}
            {!initialEvalId && (
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Selecionar Paciente</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={20} />
                  <select
                    value={formData.evaluationId}
                    onChange={(e) => setFormData(prev => ({ ...prev, evaluationId: e.target.value }))}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all appearance-none"
                  >
                    <option value="">Escolha um paciente...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.patient_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={20} />
                </div>
              </div>
            )}

            {initialEvalId && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paciente Selecionado</span>
                <span className="font-bold text-slate-700">{formData.patientName}</span>
              </div>
            )}

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
              <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                  placeholder="••••••••"
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