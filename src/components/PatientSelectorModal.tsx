"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, User, Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string;
  patient_name: string;
}

interface PatientSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (patient: Patient) => void;
  userId: string;
}

const PatientSelectorModal = ({ isOpen, onClose, onSelect, userId }: PatientSelectorModalProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      const fetchPatients = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('evaluations')
          .select('id, patient_name')
          .eq('user_id', userId)
          .order('patient_name', { ascending: true });

        if (!error && data) setPatients(data);
        setLoading(false);
      };
      fetchPatients();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const filtered = patients.filter(p => 
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Selecionar Paciente</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
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
            filtered.map((patient) => (
              <button
                key={patient.id}
                onClick={() => onSelect(patient)}
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-blue-50 transition-all group border border-transparent hover:border-blue-100"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                    <User size={20} />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-blue-700">{patient.patient_name}</span>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </button>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="font-medium">Nenhum paciente encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientSelectorModal;