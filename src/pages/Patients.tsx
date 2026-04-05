"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  Users, 
  Search, 
  ArrowLeft, 
  User, 
  Calendar, 
  Loader2,
  Pencil,
  Eye,
  Trash2,
  MessageSquarePlus
} from 'lucide-react';
import NotificationModal, { ModalType } from '@/components/NotificationModal';
import SessionEvolutionModal from '@/components/SessionEvolutionModal';

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
  
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const [evolutionModal, setEvolutionModal] = useState<{
    isOpen: boolean;
    patientId: string;
    patientName: string;
  }>({
    isOpen: false,
    patientId: '',
    patientName: ''
  });

  const visitorAccess = sessionStorage.getItem('visitor_access');
  const visitorId = sessionStorage.getItem('visitor_id');
  const isVisitor = visitorAccess === 'general';

  const fetchPatients = async () => {
    setLoading(true);
    try {
      if (isVisitor && visitorId) {
        const { data, error } = await supabase
          .from('visitor_evaluations')
          .select(`
            evaluation_id,
            evaluations (
              id, patient_name, birth_date, phone, created_at
            )
          `)
          .eq('visitor_id', visitorId);

        if (error) throw error;
        
        const formattedData = data?.map((item: any) => item.evaluations).filter(Boolean) || [];
        setPatients(formattedData);
      } else if (user) {
        const { data, error } = await supabase
          .from('evaluations')
          .select('id, patient_name, birth_date, phone, created_at')
          .eq('user_id', user.id)
          .order('patient_name', { ascending: true });

        if (error) throw error;
        setPatients(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user, isVisitor, visitorId]);

  const handleDeleteClick = (patient: PatientRecord) => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Excluir Ficha?',
      message: `Você está prestes a excluir permanentemente a ficha de ${patient.patient_name}. Esta ação não pode ser desfeita. Deseja continuar?`,
      onConfirm: () => confirmDelete(patient.id)
    });
  };

  const confirmDelete = async (id: string) => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    
    try {
      await supabase.from('evaluation_history').delete().eq('evaluation_id', id);
      await supabase.from('session_evolutions').delete().eq('evaluation_id', id);
      
      const { error } = await supabase
        .from('evaluations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPatients(prev => prev.filter(p => p.id !== id));
      
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Excluído!',
        message: 'A ficha do paciente foi removida com sucesso.'
      });
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Erro ao Excluir',
        message: 'Não foi possível excluir a ficha. Tente novamente mais tarde.'
      });
    }
  };

  const filteredPatients = patients.filter(p => 
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            {!isVisitor && (
              <button onClick={() => navigate('/')} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {isVisitor ? 'Pacientes Autorizados' : 'Meus Pacientes'}
              </h1>
              <p className="text-slate-500">
                {isVisitor ? 'Visualize as fichas clínicas autorizadas pelo profissional.' : 'Gerencie o histórico clínico de seus atendimentos.'}
              </p>
            </div>
          </div>
          {isVisitor && (
            <button onClick={() => { sessionStorage.clear(); navigate('/login'); }} className="text-red-500 font-bold hover:underline">Sair</button>
          )}
        </header>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar paciente pelo nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm outline-none"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-medium">Carregando lista...</p>
          </div>
        ) : filteredPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <User size={24} />
                  </div>
                  <div className="flex-1">
                    <button onClick={() => navigate(`/avaliacao/${patient.id}?mode=view`)} className="font-bold text-slate-800 text-lg hover:text-blue-600 transition-colors text-left">
                      {patient.patient_name}
                    </button>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Calendar size={14} /> {new Date(patient.birth_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {!isVisitor && (
                    <button 
                      onClick={() => setEvolutionModal({ isOpen: true, patientId: patient.id, patientName: patient.patient_name })}
                      className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Nova Evolução"
                    >
                      <MessageSquarePlus size={20} />
                    </button>
                  )}
                  <button 
                    onClick={() => navigate(`/avaliacao/${patient.id}?mode=view`)} 
                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Visualizar Ficha"
                  >
                    <Eye size={20} />
                  </button>
                  {!isVisitor && (
                    <>
                      <button 
                        onClick={() => navigate(`/avaliacao/${patient.id}`)} 
                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Editar Ficha"
                      >
                        <Pencil size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(patient)} 
                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
            <p className="text-slate-500">Nenhum paciente autorizado encontrado.</p>
          </div>
        )}
      </div>

      <SessionEvolutionModal 
        isOpen={evolutionModal.isOpen}
        onClose={() => setEvolutionModal(prev => ({ ...prev, isOpen: false }))}
        evaluationId={evolutionModal.patientId}
        patientName={evolutionModal.patientName}
        isReadOnly={isVisitor}
        userId={user?.id}
      />

      <NotificationModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
      />
    </div>
  );
};

export default Patients;