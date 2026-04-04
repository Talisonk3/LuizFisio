"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  Share2, 
  Search, 
  ArrowLeft, 
  User, 
  Loader2,
  Lock,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import ShareModal from '@/components/ShareModal';
import NotificationModal, { ModalType } from '@/components/NotificationModal';

interface PatientRecord {
  id: string;
  patient_name: string;
  visitor_username?: string;
  visitor_password?: string;
}

const Share = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    patient: PatientRecord | null;
  }>({
    isOpen: false,
    patient: null
  });

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const fetchPatients = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('id, patient_name, visitor_username, visitor_password')
        .eq('user_id', user.id)
        .order('patient_name', { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const handleOpenShare = (patient: PatientRecord) => {
    setShareModal({
      isOpen: true,
      patient
    });
  };

  const handleShareSuccess = (message: string) => {
    setAlertConfig({
      isOpen: true,
      type: 'success',
      title: 'Acesso Configurado!',
      message: message
    });
    fetchPatients(); // Atualiza a lista para mostrar o status de compartilhado
  };

  const filteredPatients = patients.filter(p => 
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-100 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Compartilhar Fichas</h1>
              <p className="text-slate-500">Gerencie quem pode visualizar as avaliações dos seus pacientes.</p>
            </div>
          </div>
        </header>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar paciente para compartilhar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-medium">Carregando pacientes...</p>
          </div>
        ) : filteredPatients.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredPatients.map((patient) => (
              <div 
                key={patient.id}
                className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl transition-colors ${patient.visitor_username ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{patient.patient_name}</h3>
                    {patient.visitor_username ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ShieldCheck size={12} /> Acesso Ativo
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Usuário: {patient.visitor_username}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium mt-1">Nenhum acesso externo configurado</p>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleOpenShare(patient)}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    patient.visitor_username 
                    ? 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-600' 
                    : 'bg-purple-600 text-white shadow-lg shadow-purple-100 hover:bg-purple-700'
                  }`}
                >
                  <Share2 size={18} />
                  {patient.visitor_username ? 'Gerenciar Acesso' : 'Configurar Acesso'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Share2 size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum paciente encontrado</h3>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">
              {searchTerm ? 'Não encontramos nenhum paciente com este nome.' : 'Você ainda não possui fichas para compartilhar.'}
            </p>
          </div>
        )}
      </div>

      <ShareModal 
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, patient: null })}
        patientName={shareModal.patient?.patient_name || ''}
        evaluationId={shareModal.patient?.id || ''}
        onSuccess={handleShareSuccess}
      />

      <NotificationModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
};

export default Share;