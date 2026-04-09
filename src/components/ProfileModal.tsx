"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Save, Loader2, Award, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (message: string) => void;
}

const ProfileModal = ({ isOpen, onClose, userId, onSuccess }: ProfileModalProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    crefito: '',
    email: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (isOpen && userId) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, crefito, email')
            .eq('id', userId)
            .single();
          
          if (!error && data) {
            setFormData({
              full_name: data.full_name || '',
              crefito: data.crefito || '',
              email: data.email || ''
            });
          }
        } catch (error) {
          console.error('Erro ao buscar perfil:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [isOpen, userId]);

  const handleSave = async () => {
    if (!formData.full_name.trim()) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          crefito: formData.crefito.trim()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Atualizar metadata do auth também para consistência
      await supabase.auth.updateUser({
        data: { full_name: formData.full_name.trim() }
      });

      onSuccess('Perfil atualizado com sucesso!');
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
              <User size={32} />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
            Meu Perfil
          </h3>
          <p className="text-slate-500 text-sm mb-8">
            Mantenha seus dados profissionais atualizados para os relatórios.
          </p>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin mb-3" size={32} />
              <p className="text-sm font-medium">Carregando dados...</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Número do CREFITO</label>
                <div className="relative">
                  <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={formData.crefito}
                    onChange={(e) => setFormData(prev => ({ ...prev, crefito: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="Ex: 123456-F"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">E-mail (Apenas visualização)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.full_name.trim()}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Salvar Alterações
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;