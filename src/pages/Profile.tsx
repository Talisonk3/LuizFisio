"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  User, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Phone, 
  FileBadge,
  Mail,
  Home
} from 'lucide-react';
import NotificationModal, { ModalType } from '@/components/NotificationModal';

const Profile = () => {
  const navigate = useNavigate();
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
      if (!user) return;
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
  }, [user]);

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let filteredValue = value;

    if (name === 'phone') {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length <= 2) filteredValue = `(${numbers}`;
      else if (numbers.length <= 6) filteredValue = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      else if (numbers.length <= 10) filteredValue = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
      else filteredValue = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    } else if (name === 'crefito') {
      // Apenas números, traço e letra F (maiúscula), máximo 8 caracteres
      filteredValue = value.toUpperCase().replace(/[^0-9-F]/g, '').substring(0, 8);
    }

    setFormData(prev => ({ ...prev, [name]: filteredValue }));
  };

  const handleSave = async () => {
    if (!user || !isDirty) return;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  const inputClasses = "w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700";
  const labelClasses = "text-sm font-bold text-slate-600 mb-2 block ml-1";

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
            >
              <Home size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Meu Perfil</h1>
              <p className="text-slate-500">Gerencie suas informações profissionais.</p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 space-y-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-4 border-2 border-blue-100">
              <User size={48} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{formData.full_name || 'Profissional'}</h2>
            <p className="text-slate-400 font-medium">Fisioterapeuta</p>
          </div>

          <div className="space-y-6">
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
                  className={`${inputClasses} bg-slate-50 text-slate-400 cursor-not-allowed`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="pt-8 border-t border-slate-100 flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Salvar Alterações
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-8 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Voltar
            </button>
          </div>
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

export default Profile;