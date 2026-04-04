"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  Share2, 
  ArrowLeft, 
  Loader2,
  ShieldCheck,
  Plus,
  Trash2,
  User
} from 'lucide-react';
import ShareModal from '@/components/ShareModal';
import NotificationModal, { ModalType } from '@/components/NotificationModal';

interface Visitor {
  id: string;
  username: string;
  created_at: string;
}

const Share = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        .select('id, username, created_at')
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

  const handleDeleteVisitor = async (id: string) => {
    try {
      const { error } = await supabase.from('visitors').delete().eq('id', id);
      if (error) throw error;
      setVisitors(prev => prev.filter(v => v.id !== id));
      setAlertConfig({
        isOpen: true,
        type: 'success',
        title: 'Removido',
        message: 'Usuário removido com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao deletar:', error);
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
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Gerenciar Usuários</h1>
              <p className="text-slate-500">Crie acessos de visitantes independentes de pacientes.</p>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-purple-700 transition-all shadow-xl shadow-purple-100 font-bold"
          >
            <Plus size={20} strokeWidth={3} />
            Adicionar usuário
          </button>
        </header>

        <div className="space-y-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Usuários Ativos</h2>
          
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
                  className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-50 text-purple-600 p-4 rounded-2xl">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{visitor.username}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        Criado em: {new Date(visitor.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteVisitor(visitor.id)}
                    className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Remover Usuário"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-slate-200">
              <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                <User size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum usuário criado</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                Clique no botão acima para criar o primeiro acesso de visitante geral.
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