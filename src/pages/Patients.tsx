"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  Users, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone,
  Loader2,
  Plus
} from 'lucide-react';

interface PatientRecord {
  id: string;
  patient_name: string;
  birth_date: string;
  phone: string;
  created_at: string;
}

const Patients = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('evaluations')
          .select('id, patient_name, birth_date, phone, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPatients(data || []);
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user]);

  const filteredPatients = patients.filter(p => 
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Meus Pacientes</h1>
              <p className="text-slate-500">Gerencie o histórico clínico de seus atendimentos.</p>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/avaliacao')}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 font-bold"
          >
            <Plus size={20} /> Nova Avaliação
          </button>
        </header>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar paciente pelo nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-medium">Carregando sua lista de pacientes...</p>
          </div>
        ) : filteredPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.map((patient) => (
              <div 
                key={patient.id}
                className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{patient.patient_name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Calendar size={14} /> {new Date(patient.birth_date).toLocaleDateString('pt-BR')}
                      </span>
                      {patient.phone && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Phone size={14} /> {patient.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                  <ChevronRight size={24} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Users size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum paciente encontrado</h3>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">
              {searchTerm ? 'Não encontramos nenhum paciente com este nome.' : 'Você ainda não realizou nenhuma avaliação.'}
            </p>
            {!searchTerm && (
              <button 
                onClick={() => navigate('/avaliacao')}
                className="text-blue-600 font-bold hover:underline"
              >
                Começar minha primeira avaliação
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;