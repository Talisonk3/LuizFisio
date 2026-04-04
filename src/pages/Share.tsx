"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  Share2, 
  ArrowLeft, 
  User, 
  Loader2,
  ShieldCheck,
  Plus,
  Settings2
} from 'lucide-react';
import ShareModal from '@/components/ShareModal';
import PatientSelectorModal from '@/components/PatientSelectorModal';
import NotificationModal, { ModalType } from '@/components/NotificationModal';

interface SharedPatient {
  id: string;
  patient_name: string;
  visitor_username: string;
}

const Share = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sharedPatients, setSharedPatients] = useState<SharedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    patient: { id: string; patient_name: string } | null;
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

  const fetchSharedPatients = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('id, patient_name, visitor_username')
        .eq('user_id', user.id)
        .not('visitor_username', 'is', null)
        .order('patient_name', { ascending: true });

      if (error) throw error;
      setSharedPatients(data || []);
    } catch (error) {
      console.error('Erro ao buscar compartilhamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedPatients();
  }, [user]);

  const handlePatientSelect = (patient: { id: string; patient_name: string }) => {
    setIsSelectorOpen(false);
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
    fetchSharedPatients();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-100 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Compartilhar Fichas</h1>
              <p className="text-slate-500">Gerencie os acessos externos às avaliações.</p>
            </div>
          </div>

          <button 
            onClick={() => setIsSelectorOpen(true)}
            className="bg-purple-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-purple-700 transition-all shadow-xl shadow-purple-100 font-bold"
          >
            <Plus size={20} strokeWidth={3} />
            Adicionar usuário para compartilhamento
          </button>
        </header>

        <div className="space-y-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Acessos Ativos</h2>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-medium">Carregando acessos...</p>
            </div>
          ) : sharedPatients.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {sharedPatients.map((patient) => (
                <div 
                  key={patient.id}
                  className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{patient.patient_name}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        Usuário: <span className="text-slate-600 font-bold">{patient.visitor_username}</span>
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handlePatientSelect(patient)}
                    className="p-3 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                    title="Gerenciar Acesso"
                  >
                    <Settings2 size={22} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-slate-200">
              <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Share2 size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum acesso configurado</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                Clique no botão acima para criar o primeiro acesso de visitante para um de seus pacientes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Seleção de Paciente */}
      <PatientSelectorModal 
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handlePatientSelect}
        userId={user?.id || ''}
      />

      {/* Modal de Configuração de Credenciais */}
      <ShareModal 
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, patient: null })}
        patientName={shareModal.patient?.patient_name || ''}
        evaluationId={shareModal.patient?.id || ''}
        onSuccess={handleShareSuccess}
      />

      {/* Alerta de Feedback */}
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