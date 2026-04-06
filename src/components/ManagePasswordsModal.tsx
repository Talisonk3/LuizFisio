"use client";

import React, { useState, useEffect } from 'react';
import { X, Lock, User, Loader2, Eye, EyeOff, Search, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ManagePasswordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onSuccess: (message: string) => void;
}

const ManagePasswordsModal = ({ isOpen, onClose, userId, onSuccess }: ManagePasswordsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [editedPasswords, setEditedPasswords] = useState<Record<string, string>>({});

  const fetchVisitors = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('visitors')
        .select('id, username, password')
        .eq('created_by', userId)
        .order('username', { ascending: true });
      
      if (!error && data) {
        setVisitors(data);
        const initialPasswords: Record<string, string> = {};
        data.forEach(v => {
          initialPasswords[v.id] = v.password;
        });
        setEditedPasswords(initialPasswords);
      }
    } catch (error) {
      console.error('Erro ao buscar credenciais:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchVisitors();
  }, [isOpen, userId]);

  const handleUpdatePassword = async (id: string) => {
    const newPassword = editedPasswords[id];
    const originalVisitor = visitors.find(v => v.id === id);
    
    if (!newPassword || newPassword.length < 4 || newPassword === originalVisitor?.password) return;
    
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('visitors')
        .update({ password: newPassword.trim() })
        .eq('id', id);
      
      if (error) throw error;
      
      // Atualizar o estado local do visitante original para evitar re-salvamento desnecessário
      setVisitors(prev => prev.map(v => v.id === id ? { ...v, password: newPassword.trim() } : v));
      onSuccess('Senha atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePasswordChange = (id: string, value: string) => {
    setEditedPasswords(prev => ({ ...prev, [id]: value }));
  };

  if (!isOpen) return null;

  const filtered = visitors.filter(v => v.username.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2.5 rounded-xl text-white shadow-lg shadow-purple-100">
              <Lock size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Ver e Redefinir Senhas</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Gerencie as credenciais dos visitantes</p>
            </div>
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
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="text-sm font-medium">Carregando credenciais...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((visitor) => {
              const isChanged = editedPasswords[visitor.id] !== visitor.password;
              const isInvalid = (editedPasswords[visitor.id]?.length || 0) < 4;

              return (
                <div key={visitor.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-white p-2 rounded-xl shadow-sm text-purple-600">
                      <User size={20} />
                    </div>
                    <span className="font-bold text-slate-700">{visitor.username}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1">
                      <input 
                        type={showPasswords[visitor.id] ? "text" : "password"}
                        value={editedPasswords[visitor.id] || ''}
                        onChange={(e) => handlePasswordChange(visitor.id, e.target.value)}
                        className={`w-full pl-4 pr-10 py-2 bg-white border rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm font-medium ${
                          isChanged ? 'border-purple-300' : 'border-slate-200'
                        }`}
                      />
                      <button 
                        onClick={() => togglePasswordVisibility(visitor.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition-colors"
                      >
                        {showPasswords[visitor.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    
                    {isChanged && !isInvalid && (
                      <button
                        onClick={() => handleUpdatePassword(visitor.id)}
                        disabled={updatingId === visitor.id}
                        className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-50"
                        title="Salvar nova senha"
                      >
                        {updatingId === visitor.id ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="font-medium">Nenhum usuário encontrado.</p>
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

export default ManagePasswordsModal;