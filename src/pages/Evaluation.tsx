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
  ChevronLeft,
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

  const inputClasses = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-slate-300 placeholder:text-slate-400";
  const labelClasses = "text-sm font-semibold text-slate-600 mb-1 block ml-1";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col shadow-sm">
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-2xl font-black text-blue-600 flex items-center gap-2 tracking-tight">
            <Activity size={28} strokeWidth={3} /> FisioSystem
          </h2>
        </div>
        <nav className="flex-1 p-6 space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-200 ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold scale-[1.02]' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <tab.icon size={22} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={() => { signOut(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-5 py-4 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all font-medium"
          >
            <LogOut size={22} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Nova Avaliação</h1>
              <p className="text-slate-500 mt-1">Preencha os dados clínicos do seu paciente.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 font-bold"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Salvar Ficha
            </button>
          </header>

          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
            {activeTab === 'identificacao' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><User size={20} /></div>
                  <h3 className="text-xl font-bold text-slate-800">Dados de Identificação</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClasses}>Nome Completo</label>
                    <input name="patient_name" value={formData.patient_name} onChange={handleInputChange} type="text" className={inputClasses} placeholder="Ex: João da Silva Santos" />
                  </div>
                  <div>
                    <label className={labelClasses}>Data de Nascimento</label>
                    <input name="birth_date" value={formData.birth_date} onChange={handleInputChange} type="date" className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Profissão / Ocupação</label>
                    <input name="profession" value={formData.profession} onChange={handleInputChange} type="text" className={inputClasses} placeholder="Ex: Engenheiro Civil" />
                  </div>
                  <div>
                    <label className={labelClasses}>Telefone de Contato</label>
                    <input name="phone" value={formData.phone} onChange={handleInputChange} type="tel" className={inputClasses} placeholder="(00) 00000-0000" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'anamnese' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><ClipboardList size={20} /></div>
                  <h3 className="text-xl font-bold text-slate-800">Anamnese Completa</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className={labelClasses}>Queixa Principal</label>
                    <textarea name="chief_complaint" value={formData.chief_complaint} onChange={handleInputChange} className={`${inputClasses} h-32 resize-none`} placeholder="Descreva detalhadamente o motivo da consulta..."></textarea>
                  </div>
                  <div>
                    <label className={labelClasses}>História da Doença Atual (HDA)</label>
                    <textarea name="history_present_illness" value={formData.history_present_illness} onChange={handleInputChange} className={`${inputClasses} h-32 resize-none`} placeholder="Início dos sintomas, evolução, fatores de melhora/piora..."></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className={labelClasses}>Medicamentos em Uso</label>
                      <input name="medications" value={formData.medications} onChange={handleInputChange} type="text" className={inputClasses} placeholder="Ex: Anti-inflamatórios, analgésicos..." />
                    </div>
                    <div>
                      <label className={labelClasses}>Cirurgias Prévias</label>
                      <input name="previous_surgeries" value={formData.previous_surgeries} onChange={handleInputChange} type="text" className={inputClasses} placeholder="Ex: Artroscopia de joelho (2021)" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'exame-fisico' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Activity size={20} /></div>
                  <h3 className="text-xl font-bold text-slate-800">Exame Físico e Sinais Vitais</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className={labelClasses}>PA (mmHg)</label>
                    <input name="blood_pressure" value={formData.blood_pressure} onChange={handleInputChange} type="text" className={inputClasses} placeholder="120/80" />
                  </div>
                  <div>
                    <label className={labelClasses}>FC (bpm)</label>
                    <input name="heart_rate" value={formData.heart_rate} onChange={handleInputChange} type="text" className={inputClasses} placeholder="70" />
                  </div>
                  <div>
                    <label className={labelClasses}>FR (irpm)</label>
                    <input name="respiratory_rate" value={formData.respiratory_rate} onChange={handleInputChange} type="text" className={inputClasses} placeholder="16" />
                  </div>
                  <div>
                    <label className={labelClasses}>Temp (°C)</label>
                    <input name="temperature" value={formData.temperature} onChange={handleInputChange} type="text" className={inputClasses} placeholder="36.5" />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Inspeção e Palpação</label>
                  <textarea name="inspection_palpation" value={formData.inspection_palpation} onChange={handleInputChange} className={`${inputClasses} h-40 resize-none`} placeholder="Avaliação postural, presença de edema, cicatrizes, pontos gatilho..."></textarea>
                </div>
              </div>
            )}

            {activeTab === 'funcional' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Dumbbell size={20} /></div>
                  <h3 className="text-xl font-bold text-slate-800">Avaliação Funcional e Diagnóstico</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className={labelClasses}>Amplitude de Movimento (ADM)</label>
                    <textarea name="range_of_motion" value={formData.range_of_motion} onChange={handleInputChange} className={`${inputClasses} h-28 resize-none`} placeholder="Goniometria, limitações funcionais..."></textarea>
                  </div>
                  <div>
                    <label className={labelClasses}>Força Muscular (Grau 0-5)</label>
                    <textarea name="muscle_strength" value={formData.muscle_strength} onChange={handleInputChange} className={`${inputClasses} h-28 resize-none`} placeholder="Teste de força manual por grupos musculares..."></textarea>
                  </div>
                  <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                    <label className="text-sm font-bold text-blue-700 mb-2 block ml-1">Diagnóstico Fisioterapêutico Final</label>
                    <textarea name="physio_diagnosis" value={formData.physio_diagnosis} onChange={handleInputChange} className="w-full p-4 bg-white border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all h-32 font-medium text-blue-900 placeholder:text-blue-300" placeholder="Conclusão clínica e objetivos do tratamento..."></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
              <button 
                disabled={activeTab === 'identificacao'}
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  setActiveTab(tabs[currentIndex - 1].id);
                }}
                className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 disabled:opacity-20 transition-all px-4 py-2 rounded-xl hover:bg-slate-50"
              >
                <ChevronLeft size={20} /> Voltar
              </button>
              
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <div key={tab.id} className={`h-1.5 rounded-full transition-all duration-300 ${activeTab === tab.id ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`} />
                ))}
              </div>

              <button 
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1].id);
                  } else {
                    handleSave();
                  }
                }}
                className="bg-slate-100 text-blue-600 font-black flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group"
              >
                {activeTab === 'funcional' ? 'Finalizar' : 'Próximo'} 
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Evaluation;