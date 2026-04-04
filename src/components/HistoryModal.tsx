"use client";

import React, { useEffect, useState } from 'react';
import { History, X, Clock, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HistoryEntry {
  id: string;
  action_description: string;
  created_at: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId: string;
  patientName: string;
}

const HistoryModal = ({ isOpen, onClose, evaluationId, patientName }: HistoryModalProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && evaluationId) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('evaluation_history')
            .select('*')
            .eq('evaluation_id', evaluationId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setHistory(data || []);
        } catch (error) {
          console.error('Erro ao buscar histórico:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, evaluationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-100">
              <History size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Histórico de Alterações</h3>
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
            <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {history.map((entry) => (
                <div key={entry.id} className="relative pl-10 group">
                  <div className="absolute left-0 top-1.5 w-9 h-9 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center z-10 group-hover:border-blue-500 transition-colors">
                    <div className="w-2 h-2 bg-slate-300 rounded-full group-hover:bg-blue-500 transition-colors" />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-all">
                    <div className="text-slate-700 text-sm mb-2 leading-relaxed">
                      {entry.action_description.startsWith('Campos atualizados:') ? (
                        <>
                          <span className="font-bold block mb-1 text-blue-600">Campos atualizados:</span>
                          <div className="flex flex-wrap gap-1">
                            {entry.action_description.replace('Campos atualizados: ', '').split('] [').map((change, i, arr) => (
                              <span key={i} className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-600">
                                {change.replace('[', '').replace(']', '')}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="font-bold">{entry.action_description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-3">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(entry.created_at).toLocaleDateString('pt-BR')}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(entry.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 font-medium">Nenhum registro de alteração encontrado.</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <button onClick={onClose} className="w-full bg-white text-slate-600 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-100 transition-all">
            Fechar Histórico
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;