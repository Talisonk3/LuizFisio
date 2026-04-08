"use client";

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Loader2, Activity, MessageSquare, Pencil, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SessionEvolutionModal from './SessionEvolutionModal';
import SessionHistoryModal from './SessionHistoryModal';
import { useAuth } from './AuthProvider';

interface Evolution {
  id: string;
  evolution_text: string;
  blood_pressure?: string;
  heart_rate?: string;
  respiratory_rate?: string;
  temperature?: string;
  saturation?: string;
  pain_scale?: string;
  session_date?: string;
  created_at: string;
  user_id: string;
}

interface EvolutionHistoryTabProps {
  evaluationId: string;
  isReadOnly?: boolean;
}

const EvolutionHistoryTab = ({ evaluationId, isReadOnly }: EvolutionHistoryTabProps) => {
  const { user } = useAuth();
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvolution, setEditingEvolution] = useState<Evolution | null>(null);
  const [historyEvolution, setHistoryEvolution] = useState<Evolution | null>(null);

  // Identificar o usuário atual (Profissional ou Visitante)
  const visitorId = sessionStorage.getItem('visitor_id');
  const currentUserId = user?.id || visitorId;
  const isVisitor = !!visitorId;

  const fetchEvolutions = async () => {
    if (!evaluationId) return;
    setLoading(true);
    try {
      // Ordenando primeiro pela data da sessão e depois pela data de criação como desempate
      const { data, error } = await supabase
        .from('session_evolutions')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .order('session_date', { ascending: false })
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
  }, [evaluationId]);

  const checkCanEdit = (evo: Evolution) => {
    // Se não for o autor, não pode editar
    if (evo.user_id !== currentUserId) return false;
    
    // Se for profissional (dono), pode editar sempre
    if (!isVisitor) return true;

    // Se for visitante, verificar o prazo de 10 dias
    const evolutionDate = evo.session_date 
      ? new Date(evo.session_date + 'T00:00:00') 
      : new Date(evo.created_at);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    evolutionDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - evolutionDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 10;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-medium">Carregando histórico de evoluções...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
          <MessageSquare size={20} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Histórico de Evoluções</h3>
      </div>

      {evolutions.length > 0 ? (
        <div className="space-y-6">
          {evolutions.map((evo) => {
            const canEdit = checkCanEdit(evo);

            return (
              <div key={evo.id} className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <Calendar size={14} className="text-emerald-500" /> 
                      {evo.session_date ? new Date(evo.session_date + 'T00:00:00').toLocaleDateString('pt-BR') : new Date(evo.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Clock size={14} className="text-emerald-500" /> 
                        {new Date(evo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        <button 
                          onClick={() => setHistoryEvolution(evo)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Histórico de Edições"
                        >
                          <History size={16} />
                        </button>
                        {canEdit && (
                          <button 
                            onClick={() => setEditingEvolution(evo)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar Evolução"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {evo.pain_scale !== undefined && (
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border ${
                        parseInt(evo.pain_scale) === 0 ? 'bg-green-50 text-green-600 border-green-100' :
                        parseInt(evo.pain_scale) <= 3 ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                        parseInt(evo.pain_scale) <= 7 ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        DOR: {evo.pain_scale}/10
                      </span>
                    )}
                    {evo.blood_pressure && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">PA: {evo.blood_pressure}</span>}
                    {evo.heart_rate && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">FC: {evo.heart_rate}</span>}
                    {evo.respiratory_rate && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">FR: {evo.respiratory_rate}</span>}
                    {evo.temperature && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">T: {evo.temperature}°C</span>}
                    {evo.saturation && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">Sat: {evo.saturation}%</span>}
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm break-words pl-2">
                    {evo.evolution_text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
          <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
            <Activity size={32} />
          </div>
          <p className="text-slate-400 font-bold">Nenhuma evolução registrada para este paciente.</p>
        </div>
      )}

      <SessionEvolutionModal 
        isOpen={!!editingEvolution}
        onClose={() => {
          setEditingEvolution(null);
          fetchEvolutions();
        }}
        evaluationId={evaluationId}
        patientName="Editando Evolução"
        userId={user?.id}
        evolutionData={editingEvolution}
        isReadOnly={false}
      />

      <SessionHistoryModal 
        isOpen={!!historyEvolution}
        onClose={() => setHistoryEvolution(null)}
        evolutionId={historyEvolution?.id || ''}
        patientName={historyEvolution?.session_date ? `Sessão de ${new Date(historyEvolution.session_date + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Histórico'}
      />
    </div>
  );
};

export default EvolutionHistoryTab;