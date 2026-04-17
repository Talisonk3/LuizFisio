"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  Loader2,
  ShieldCheck,
  Plus,
  User,
  UserPlus,
  Home,
  Lock
} from 'lucide-react';
import ShareModal from '@/components/ShareModal';
import AssignPatientModal from '@/components/AssignPatientModal';
import ManagePasswordModal from '@/components/ManagePasswordModal';
import NotificationModal, { ModalType } from '@/components/NotificationModal';

interface Visitor {
  id: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

const Share = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [passwordModal, setPasswordModal] = useState<{ 
    isOpen: boolean; 
    visitorId: string; 
    visitorName: string 
  }>({
    isOpen: false,
    visitorId: '',
    visitorName: ''
  });

  const [assignModal, setAssignModal] = useState<{ 
    isOpen: boolean; 
    visitorId: string; 
    visitorName: string 
  }>({
    isOpen: false,
    visitorId: '',
    visitorName: ''
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

  const fetchVisitors = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('visitors')
        .select('id, username, is_active, created_at')
        .eq('created_by', user.id)
        .order('username', { ascending: true });

      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      console.error('Erro ao buscar visitantes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [user]);

  const toggleVisitorStatus = async (id: string, currentStatus: boolean) => {
    // Se estiver tentando desativar (mudar de true para false)
    if (currentStatus === true) {
      try {
        // Verificar se existem pacientes vinculados
        const { count, error: countError } = await supabase
          .from('visitor_evaluations')
          .select('*', { count: 'exact', head: true })
          .eq('visitor_id', id);

        if (countError) throw countError;

        if (count && count > 0) {
          setAlertConfig({
            isOpen: true,
            type: 'warning',
            title: 'Ação Bloqueada',
            message: 'Para inativar este usuário, você deve primeiro desvincular todos os pacientes ligados a ele na opção "Autorizar Pacientes".'
          });
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar vínculos:', error);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('visitors')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setVisitors(prev => prev.map(v => 
        v.id === id ? { ...v, is_active: !currentStatus } : v
      ));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleSuccess = (message: string) => {
    setAlertConfig({
      isOpen: true,
      type: 'success',
      title: 'Sucesso!',
      message
    });
    fetchVisitors();
  };

  return (
    <div className="min-h-screen bg-blue-50 p-4 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/')} 
                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-100 transition-all shadow-sm"
                title="Início"
              >
                <Home size={20} />
              </button>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Gerenciar Usuários</h1>
              <p className="text-sm md:text-base text-slate-500">Controle quem pode acessar seu sistema.</p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto bg-purple-600 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-purple-700 transition-all shadow-xl shadow-purple-100 font-bold text-sm"
            >
              <Plus size={20} strokeWidth={3} />
              Adicionar usuário
            </button>
          </div>
        </header>

        <div className="space-y-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Usuários Cadastrados</h2>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-medium">Carregando usuários...</p>
            </div>
          ) : visitors.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {visitors.map((visitor) => (
                <div 
                  key={visitor.id}
                  className="group bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                    <div className={`${visitor.is_active ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-400'} p-3 md:p-4 rounded-xl md:rounded-2xl transition-colors shrink-0`}>
                      <ShieldCheck size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-bold text-base md:text-lg truncate ${visitor.is_active ? 'text-slate-800' : 'text-slate-400'}`}>
                        {visitor.username}
                      </h3>
                      <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-1">
                        Criado em: {new Date(visitor.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPasswordModal({ isOpen: true, visitorId: visitor.id, visitorName: visitor.username })}
                        className="p-2.5 md:p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                        title="Ver/Redefinir Senha"
                      >
                        <Lock size={18} className="md:w-5 md:h-5" />
                      </button>

                      <button
                        onClick={() => setAssignModal({ isOpen: true, visitorId: visitor.id, visitorName: visitor.username })}
                        className="p-2.5 md:p-3 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                        title="Autorizar Pacientes"
                      >
                        <UserPlus size={18} className="md:w-5 md:h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 border-l border-slate-100 pl-3 md:pl-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider w-12 md:w-16 text-right ${visitor.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {visitor.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                      <button 
                        onClick={() => toggleVisitorStatus(visitor.id, visitor.is_active)}
                        className={`relative inline-flex h-7 w-12 md:h-8 md:w-14 items-center rounded-full transition-colors focus:outline-none ${
                          visitor.is_active ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 md:h-6 md:w-6 transform rounded-full bg-white transition-transform ${
                            visitor.is_active ? 'translate-x-6 md:translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-12 md:p-16 text-center border border-dashed border-slate-200">
              <div className="bg-slate-50 w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                <User size={32} className="md:w-10 md:h-10" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">Nenhum usuário criado</h3>
              <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">
                Clique no botão acima para criar o primeiro acesso de visitante.
              </p>
            </div>
          )}
        </div>
      </div>

      <ShareModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        userId={user?.id}
      />

      <ManagePasswordModal 
        isOpen={passwordModal.isOpen}
        onClose={() => setPasswordModal(prev => ({ ...prev, isOpen: false }))}
        visitorId={passwordModal.visitorId}
        visitorName={passwordModal.visitorName}
        onSuccess={handleSuccess}
      />

      <AssignPatientModal 
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal(prev => ({ ...prev, isOpen: false }))}
        visitorId={assignModal.visitorId}
        visitorName={assignModal.visitorName}
        userId={user?.id || ''}
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