"use client";

import React, { useState } from 'react';
import { X, UserPlus, Users, Link, Copy, Check, Lock, User, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  evaluationId: string;
  onSuccess: (message: string) => void;
}

const ShareModal = ({ isOpen, onClose, patientName, evaluationId, onSuccess }: ShareModalProps) => {
  const [step, setStep] = useState<'options' | 'visitor-config'>('options');
  const [loading, setLoading] = useState(false);
  const [visitorData, setVisitorData] = useState({
    username: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleSaveVisitor = async () => {
    if (!visitorData.username || !visitorData.password) {
      alert('Por favor, preencha o usuário e a senha.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('evaluations')
        .update({
          visitor_username: visitorData.username.toLowerCase().trim(),
          visitor_password: visitorData.password.trim()
        })
        .eq('id', evaluationId);

      if (error) throw error;

      onSuccess(`Credenciais de visitante para ${patientName} criadas com sucesso!`);
      onClose();
      setStep('options');
      setVisitorData({ username: '', password: '' });
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      alert('Erro ao salvar credenciais de visitante.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareRegistered = () =>{
    onSuccess('A funcionalidade de compartilhamento direto entre profissionais cadastrados está sendo finalizada e estará disponível em breve.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-purple-50 p-4 rounded-2xl text-purple-600">
              {step === 'options' ? <Link size={32} /> : <Lock size={32} />}
            </div>
            <button 
              onClick={() => { onClose(); setStep('options'); }}
              className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
          
          {step === 'options' ? (
            <>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
                Compartilhar Ficha
              </h3>
              <p className="text-slate-500 leading-relaxed mb-8">
                Como você deseja compartilhar a avaliação de <span className="font-bold text-slate-700">{patientName}</span>?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setStep('visitor-config')}
                  className="w-full flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-purple-50 hover:border-purple-100 hover:text-purple-700 transition-all group text-left"
                >
                  <div className="bg-white p-3 rounded-xl shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <span className="font-bold block">Compartilhar com novo usuário</span>
                    <span className="text-xs text-slate-400 group-hover:text-purple-400">Crie um acesso de visitante com senha</span>
                  </div>
                </button>

                <button
                  onClick={handleShareRegistered}
                  className="w-full flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-700 transition-all group text-left"
                >
                  <div className="bg-white p-3 rounded-xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Users size={24} />
                  </div>
                  <div>
                    <span className="font-bold block">Compartilhar com usuário cadastrado</span>
                    <span className="text-xs text-slate-400 group-hover:text-blue-400">Transfere ou permite acesso a outro profissional</span>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
                Acesso de Visitante
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                Defina as credenciais para que o visitante possa acessar a ficha de <span className="font-bold text-slate-700">{patientName}</span>.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Usuário do Visitante</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                      type="text"
                      value={visitorData.username}
                      onChange={(e) => setVisitorData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                      placeholder="Ex: paciente_joao"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 mb-1 block ml-1">Senha do Visitante</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                      type="password"
                      value={visitorData.password}
                      onChange={(e) => setVisitorData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleSaveVisitor}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Salvar Credenciais
                </button>
                
                <button
                  onClick={() => setStep('options')}
                  className="w-full text-slate-400 font-semibold hover:text-slate-600 text-sm py-2"
                >
                  Voltar para opções
                </button>
              </div>
            </>
          )}
          
          <button
            onClick={() => { onClose(); setStep('options'); }}
            className="w-full mt-4 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;