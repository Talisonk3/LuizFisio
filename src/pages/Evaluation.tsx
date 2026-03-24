"use client";

import React, { useState } from 'react';
import { 
  User, 
  ClipboardList, 
  Activity, 
  Dumbbell, 
  Save, 
  LogOut,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

const Evaluation = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState('identificacao');
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_name: '',
    birth_date: '',
    profession: '',
    phone: '',
    chief_complaint: '',
    history_present_illness: '',
    medications: '',
    previous_surgeries: '',
    blood_pressure: '',
    heart_rate: '',
    respiratory_rate: '',
    temperature: '',
    inspection_palpation: '',
    range_of_motion: '',
    muscle_strength: '',
    physio_diagnosis: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.patient_name) {
      alert('Por favor, preencha ao menos o nome do paciente.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('evaluations')
        .insert([{ ...formData, user_id: user?.id }]);

      if (error) throw error;
      alert('Avaliação salva com sucesso!');
      // Limpar formulário ou redirecionar
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'identificacao', label: 'Identificação', icon: User },
    { id: 'anamnese', label: 'Anamnese', icon: ClipboardList },
    { id: 'exame-fisico', label: 'Exame Físico', icon: Activity },
    { id: 'funcional', label: 'Avaliação Funcional', icon: Dumbbell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Activity size={24} /> FisioSystem
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => { signOut(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Nova Avaliação</h1>
              <p className="text-slate-500">Preencha os dados do paciente com atenção.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Salvar Ficha
            </button>
          </header>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            {activeTab === 'identificacao' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                    <input name="patient_name" value={formData.patient_name} onChange={handleInputChange} type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: João Silva" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Data de Nascimento</label>
                    <input name="birth_date" value={formData.birth_date} onChange={handleInputChange} type="date" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Profissão</label>
                    <input name="profession" value={formData.profession} onChange={handleInputChange} type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Telefone</label>
                    <input name="phone" value={formData.phone} onChange={handleInputChange} type="tel" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="(00) 00000-0000" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'anamnese' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Histórico Clínico</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Queixa Principal</label>
                    <textarea name="chief_complaint" value={formData.chief_complaint} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24" placeholder="Descreva o motivo da consulta..."></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">História da Doença Atual (HDA)</label>
                    <textarea name="history_present_illness" value={formData.history_present_illness} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Medicamentos em uso</label>
                      <input name="medications" value={formData.medications} onChange={handleInputChange} type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Cirurgias Prévias</label>
                      <input name="previous_surgeries" value={formData.previous_surgeries} onChange={handleInputChange} type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'exame-fisico' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Sinais Vitais e Inspeção</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">PA (mmHg)</label>
                    <input name="blood_pressure" value={formData.blood_pressure} onChange={handleInputChange} type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="120/80" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">FC (bpm)</label>
                    <input name="heart_rate" value={formData.heart_rate} onChange={handleInputChange} type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="70" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">FR (irpm)</label>
                    <input name="respiratory_rate" value={formData.respiratory_rate} onChange={handleInputChange} type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="16" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Temp (°C)</label>
                    <input name="temperature" value={formData.temperature} onChange={handleInputChange} type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="36.5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Inspeção / Palpação</label>
                  <textarea name="inspection_palpation" value={formData.inspection_palpation} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32" placeholder="Edema, cicatrizes, trofismo muscular..."></textarea>
                </div>
              </div>
            )}

            {activeTab === 'funcional' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Testes e Diagnóstico</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Amplitude de Movimento (ADM)</label>
                    <textarea name="range_of_motion" value={formData.range_of_motion} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Força Muscular (Grau 0-5)</label>
                    <textarea name="muscle_strength" value={formData.muscle_strength} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Diagnóstico Fisioterapêutico</label>
                    <textarea name="physio_diagnosis" value={formData.physio_diagnosis} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 font-medium text-blue-700 bg-blue-50/30"></textarea>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between">
              <button 
                disabled={activeTab === 'identificacao'}
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  setActiveTab(tabs[currentIndex - 1].id);
                }}
                className="text-slate-500 font-medium disabled:opacity-30"
              >
                Anterior
              </button>
              <button 
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1].id);
                  } else {
                    handleSave();
                  }
                }}
                className="text-blue-600 font-bold flex items-center gap-1"
              >
                {activeTab === 'funcional' ? 'Finalizar e Salvar' : 'Próximo'} <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Evaluation;