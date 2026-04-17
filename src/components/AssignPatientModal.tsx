"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, User, Loader2, Check, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string;
  patient_name: string;
}

interface AssignPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitorId: string;
  visitorName: string;
  userId: string;
}

const AssignPatientModal = ({ isOpen, onClose, visitorId, visitorName, userId }: AssignPatientModalProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!isOpen || !visitorId) return;
    setLoading(true);
    try {
      // 1. Buscar todos os pacientes do profissional
      const { data: allPatients } = await supabase
        .from('evaluations')
        .select('id, patient_name')
        .eq('user_id', userId)
        .order('patient_name', { ascending: true });

      // 2. Buscar TODAS as associações de pacientes feitas por este profissional
      // Isso nos permite saber quais pacientes já estão com outros usuários
      const { data: allAssigned } = await supabase
        .from('visitor_evaluations')
        .select('evaluation_id, visitor_id');

      const assignedToCurrentList = allAssigned
        ?.filter(a => a.visitor_id === visitorId)
        .map(a => a.evaluation_id) || [];

      const assignedToOthersList = allAssigned
        ?.filter(a => a.visitor_id !== visitorId)
        .map(a => a.evaluation_id) || [];
      
      // 3. Filtrar: Mostrar apenas pacientes que NÃO estão com outros usuários
      // Pacientes já associados ao usuário ATUAL devem aparecer para permitir a exclusão
      const availablePatients = allPatients ? allPatients.filter(p => 
        !assignedToOthersList.includes(p.id)
      ) : [];

      // Ordenar: primeiro os autorizados (do usuário atual), depois por nome
      const sortedPatients = [...availablePatients].sort((a, b) => {
        const aAssigned = assignedToCurrentList.includes(a.id);
        const bAssigned = assignedToCurrentList.includes(b.id);
        
        if (aAssigned && !bAssigned) return -1;
        if (!aAssigned && bAssigned) return 1;
        return a.patient_name.localeCompare(b.patient_name);
      });

      setPatients(sortedPatients);
      setAssignedIds(assignedToCurrentList);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isOpen, visitorId]);

  const toggleAssignment = async (patientId: string, isAssigned: boolean) => {
    setProcessingId(patientId);
    try {
      if (isAssigned) {
        await supabase
          .from('visitor_evaluations')
          .delete()
          .eq('visitor_id', visitorId)
          .eq('evaluation_id', patientId);
        setAssignedIds(prev => prev.filter(id => id !== patientId));
      } else {
        await supabase
          .from('visitor_evaluations')
          .insert([{ visitor_id: visitorId, evaluation_id: patientId }]);
        setAssignedIds(prev => [...prev, patientId]);
      }
    } catch (error) {
      console.error('Erro ao atualizar associação:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  const filtered = patients.filter(p => 
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Autorizar Pacientes</h3>
            <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Usuário: {visitorName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-xl transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 border-b border-slate-50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.trimStart())}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="text-sm font-medium">Carregando pacientes...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((patient) => {
              const isAssigned = assignedIds.includes(patient.id);
              const isProcessing = processingId === patient.id;
              
              return (
                <div
                  key={patient.id}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                    isAssigned ? 'bg-purple-50 border-purple-100' : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl shadow-sm ${isAssigned ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <User size={18} />
                    </div>
                    <span className={`font-bold text-sm ${isAssigned ? 'text-purple-900' : 'text-slate-700'}`}>
                      {patient.patient_name}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => toggleAssignment(patient.id, isAssigned)}
                    disabled={isProcessing}
                    className={`p-2 rounded-xl transition-all ${
                      isAssigned 
                      ? 'text-red-500 hover:bg-red-50' 
                      : 'text-purple-600 hover:bg-purple-100'
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : isAssigned ? (
                      <Trash2 size={20} />
                    ) : (
                      <Plus size={20} />
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="font-medium">Nenhum paciente disponível para autorização.</p>
              <p className="text-[10px] mt-1 uppercase font-bold">Pacientes já vinculados a outros usuários não aparecem aqui.</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <button onClick={onClose} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all">
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignPatientModal;