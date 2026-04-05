"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Calendar, Clock, MessageSquarePlus, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Evolution {
  id: string;
  evolution_text: string;
  created_at: string;
}

interface SessionEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId: string;
  patientName: string;
  isReadOnly?: boolean;
  userId?: string;
}

const SessionEvolutionModal = ({ isOpen, onClose, evaluationId, patientName, isReadOnly, userId }: SessionEvolutionModalProps) => {
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [newEvolution, setNewEvolution] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchEvolutions = async () => {
    if (!isOpen || !evaluationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_evolutions')
        .select('id, evolution_text, created_at')
        .eq('evaluation_id', evaluationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvolutions(data || []);
    } catch (error) {
      console.error('Erro ao buscar evoluções:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvolutions();
  }, [isOpen, evaluationId]);

  const handleSave = async () => {
    if (!newEvolution.trim() || !userId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('session_evolutions')
        .insert([{
          evaluation_id: evaluationId,
          user_id: userId,
          evolution_text: newEvolution.trim()
        }]);

      if (error) throw error;
      
      setNewEvolution('');
      fetchEvolutions();
    } catch (error) {
      console.error('Erro ao salvar evolução:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-100">
              <History size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Evolução de Sessão</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{patientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-xl transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {!isReadOnly && (
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                <MessageSquarePlus size={18} className="text-emerald-600" />
                Nova Evolução
              </label>
              <textarea
                value={newEvolution}
                onChange={(e) => setNewEvolution(e.target.value)}
                placeholder="Descreva o atendimento de hoje, condutas realizadas e resposta do paciente..."
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all h-32 resize-none text-slate-700"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !newEvolution.trim()}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-2xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 font-bold"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Salvar Evolução
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Histórico de Evoluções</h4>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="animate-spin mb-3" size={32} />
                <p className="text-sm font-medium">Carregando histórico...</p>
              </div>
            ) : evolutions.length > 0 ? (
              <div className="space-y-4">
                {evolutions.map((evo) => (
                  <div key={evo.id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-3">
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                        <Calendar size={12} /> {new Date(evo.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                        <Clock size={12} /> {new Date(evo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                      {evo.evolution_text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">Nenhuma evolução registrada ainda.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <button onClick={onClose} className="w-full bg-white text-slate-600 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-100 transition-all">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionEvolutionModal;