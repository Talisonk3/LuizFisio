"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  User, 
  Save, 
  Loader2, 
  Phone, 
  FileBadge,
  Mail,
  X
} from 'lucide-react';
import NotificationModal, { ModalType } from '@/components/NotificationModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState({
    full_name: '',
    crefito: '',
    phone: '',
    email: ''
  });
  const [formData, setFormData] = useState({
    full_name: '',
    crefito: '',
    phone: '',
    email: ''
  });

  const [modalConfig, setModalConfig] = useState<{
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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !isOpen) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          const profileData = {
            full_name: data.full_name || '',
            crefito: data.crefito || '',
            phone: data.phone || '',
            email: data.email || user.email || ''
          };
          setFormData(profileData);
          setOriginalData(profileData);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, isOpen]);

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let filteredValue = value;

    if (name === 'full_name') {
      filteredValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (name === 'phone') {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length === 0) filteredValue = '';
      else if (numbers.length <= 2) filteredValue = `(${numbers}`;
      else if (numbers.length <= 6) filteredValue = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      else if (numbers.length <= 10) filteredValue = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
      else filteredValue = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    } else if (name === 'crefito') {
      filteredValue = value.toUpperCase().replace(/[^0-9-F]/g, '').substring(0, 8);
    }

    setFormData(prev => ({ ...prev, [name]: filteredValue }));
  };

  const handleSave = async () => {
    if (!user || !isDirty) return;

    if (formData.phone && formData.phone.length > 0 && formData.phone.length < 15) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Telefone Incompleto',
        message: 'O número de telefone deve ser preenchido completamente no formato (00) 00000-0000.'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          crefito: formData.crefito,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setOriginalData({ ...formData });
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Perfil Atualizado!',
        message: 'Seus dados foram salvos com sucesso.'
      });
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Erro ao Salvar',
        message: 'Não foi possível atualizar seu perfil. Tente novamente.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses = "w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700";
  const labelClasses = "text-sm font-bold text-slate-600 mb-2 block ml-1";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-100">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Meu Perfil</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Dados Profissionais</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-xl transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin mb-3" size={32} />
              <p className="text-sm font-medium">Carregando perfil...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-3 border-2 border-blue-100">
                  <User size={40} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">{formData.full_name || 'Profissional'}</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Fisioterapeuta</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelClasses}>Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className={inputClasses}
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>E-mail (Apenas visualização)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      disabled
                      value={formData.email}
                      className={`${inputClasses} bg-slate-100 text-slate-400 cursor-not-allowed`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClasses}>CREFITO</label>
                    <div className="relative">
                      <FileBadge className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        name="crefito"
                        value={formData.crefito}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="Ex: 12345-F"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !isDirty || loading}
            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Alterações
          </button>
          <button
            onClick={onClose}
            className="px-8 bg-white text-slate-600 py-4 rounded-2xl font-bold border border-slate-200 hover:bg-slate-100 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>

      <NotificationModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
      />
    </div>
  );
};

export default ProfileModal;