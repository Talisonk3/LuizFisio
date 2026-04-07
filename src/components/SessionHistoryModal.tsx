"use client";

import React, { useEffect, useState } from 'react';
import { History, X, Clock, Calendar, Loader2, ArrowRight, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HistoryEntry {
  id: string;
  old_values: any;
  new_values: any;
  created_at: string;
}

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  evolutionId: string;
  patientName: string;
}

const fieldLabels: Record<string, string> = {
  evolution_text: 'Descrição da Evolução',
  blood_pressure: 'Pressão Arterial',
  heart_rate: 'Frequência Cardíaca',
  respiratory_rate: 'Frequência Respiratória',
  temperature: 'Temperatura',
  saturation: 'Saturação (SatO2)',
  pain_scale: 'Dor (EVA)',
  session_date: 'Data da Sessão'
};

const SessionHistoryModal = ({ isOpen, onClose, evolutionId, patientName }: SessionHistoryModalProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && evolutionId) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('session_evolution_history')
            .select('*')
            .eq('evolution_id', evolutionId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setHistory(data || []);
        } catch (error) {
          console.error('Erro ao buscar histórico da evolução:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, evolutionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-xl text-white shadow-lg shadow-amber-100">
              <History size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Histórico de Edições</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{patientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-xl transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin mb-3" size={32} />
              <p className="text-sm font-medium">Carregando histórico...</p>
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-10">
              {history.map((entry) => (
                <div key={entry.id} className="relative pl-8 border-l-2 border-slate-100">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-amber-500 rounded-full" />
                  
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <Calendar size={12} className="text-amber-500" /> 
                      {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <Clock size={12} className="text-amber-500" /> 
                      {new Date(entry.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.keys(entry.new_values).map((key) => {
                      const oldVal = entry.old_values[key] || 'Vazio';
                      const newVal = entry.new_values[key] || 'Vazio';
                      if (oldVal === newVal) return null;

                      return (
                        <div key={key} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Activity size={14} className="text-blue-600" />
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                              {fieldLabels[key] || key}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4">
                            <div className="text-sm text-slate-400 line-through bg-white p-3 rounded-xl border border-slate-100 italic">
                              {oldVal}
                            </div>
                            <div className="flex justify-center">
                              <ArrowRight size={18} className="text-slate-300 rotate-90 md:rotate-0" />
                            </div>
                            <div className="text-sm text-slate-800 font-bold bg-blue-50 p-3 rounded-xl border border-blue-100">
                              {newVal}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                <History size={32} />
              </div>
              <p className="text-slate-400 font-bold">Nenhum registro de edição encontrado.</p>
              <p className="text-xs text-slate-400 mt-1">As alterações aparecerão aqui após você editar uma evolução.</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <button onClick={onClose} className="w-full bg-white text-slate-600 py-4 rounded-2xl font-bold border border-slate-200 hover:bg-slate-100 transition-all shadow-sm">
            Fechar Histórico
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionHistoryModal;