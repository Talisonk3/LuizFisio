"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Loader2, MessageSquarePlus, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import NotificationModal, { ModalType } from './NotificationModal';

interface SessionEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId: string;
  patientName: string;
  isReadOnly?: boolean;
  userId?: string;
  evolutionData?: any;
}

const SessionEvolutionModal = ({ 
  isOpen, 
  onClose, 
  evaluationId, 
  patientName, 
  isReadOnly, 
  userId,
  evolutionData 
}: SessionEvolutionModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
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

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const currentYear = new Date().getFullYear();
    let day = numbers.slice(0, 2);
    let month = numbers.slice(2, 4);
    let year = numbers.slice(4, 8);
    if (day && parseInt(day) > 31) day = '31';
    if (day && day !== '0' && day !== '00' && parseInt(day) === 0) day = '01';
    if (month && parseInt(month) > 12) month = '12';
    if (month && month !== '0' && month !== '00' && parseInt(month) === 0) month = '01';
    if (year && year.length === 4 && parseInt(year) > currentYear) year = currentYear.toString();
    if (numbers.length <= 2) return day;
    if (numbers.length <= 4) return `${day}/${month}`;
    return `${day}/${month}/${year}`;
  };

  const [formData, setFormData] = useState({
    evolution_text: '',
    blood_pressure: '',
    heart_rate: '',
    respiratory_rate: '',
    temperature: '',
    saturation: '',
    pain_scale: '0',
    session_date: new Date().toLocaleDateString('pt-BR')
  });

  useEffect(() => {
    if (isOpen) {
      setErrors([]);
      if (evolutionData) {
        let sessionDate = '';
        if (evolutionData.session_date) {
          const parts = evolutionData.session_date.split('-');
          sessionDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        setFormData({
          evolution_text: evolutionData.evolution_text || '',
          blood_pressure: evolutionData.blood_pressure || '',
          heart_rate: evolutionData.heart_rate || '',
          respiratory_rate: evolutionData.respiratory_rate || '',
          temperature: evolutionData.temperature || '',
          saturation: evolutionData.saturation || '',
          pain_scale: evolutionData.pain_scale || '0',
          session_date: sessionDate || new Date().toLocaleDateString('pt-BR')
        });
      } else {
        setFormData({
          evolution_text: '',
          blood_pressure: '',
          heart_rate: '',
          respiratory_rate: '',
          temperature: '',
          saturation: '',
          pain_scale: '0',
          session_date: new Date().toLocaleDateString('pt-BR')
        });
      }
    }
  }, [isOpen, evolutionData]);

  const isDirty = useMemo(() => {
    if (!evolutionData) {
      return formData.evolution_text.trim() !== '';
    }
    
    let originalSessionDate = '';
    if (evolutionData.session_date) {
      const parts = evolutionData.session_date.split('-');
      originalSessionDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else {
      originalSessionDate = new Date(evolutionData.created_at).toLocaleDateString('pt-BR');
    }

    return formData.evolution_text !== (evolutionData.evolution_text || '') ||
           formData.blood_pressure !== (evolutionData.blood_pressure || '') ||
           formData.heart_rate !== (evolutionData.heart_rate || '') ||
           formData.respiratory_rate !== (evolutionData.respiratory_rate || '') ||
           formData.temperature !== (evolutionData.temperature || '') ||
           formData.saturation !== (evolutionData.saturation || '') ||
           formData.pain_scale !== (evolutionData.pain_scale || '0') ||
           formData.session_date !== originalSessionDate;
  }, [formData, evolutionData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let filteredValue = value.trimStart();

    if (name === 'session_date') {
      filteredValue = formatDate(filteredValue);
    } else if (name === 'blood_pressure') {
      const numbers = filteredValue.replace(/\D/g, '').substring(0, 5);
      filteredValue = numbers.length > 2 ? `${numbers.slice(0, 2)}/${numbers.slice(2)}` : numbers;
    } else if (['heart_rate', 'respiratory_rate', 'saturation'].includes(name)) {
      filteredValue = filteredValue.replace(/\D/g, '').substring(0, 3);
    } else if (name === 'temperature') {
      const numbers = filteredValue.replace(/\D/g, '').substring(0, 3);
      filteredValue = numbers.length > 2 ? `${numbers.slice(0, 2)}.${numbers.slice(2)}` : numbers;
    }

    if (errors.includes(name)) {
      setErrors(prev => prev.filter(err => err !== name));
    }

    setFormData(prev => ({ ...prev, [name]: filteredValue }));
  };

  const handleSave = async () => {
    const newErrors: string[] = [];
    
    if (!formData.session_date || formData.session_date.length < 10) {
      newErrors.push('session_date');
    }
    
    if (!formData.evolution_text.trim()) {
      newErrors.push('evolution_text');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setAlertConfig({
        isOpen: true,
        type: 'warning',
        title: 'Campos Obrigatórios',
        message: 'Por favor, preencha a data da sessão e a descrição da evolução antes de salvar.'
      });
      return;
    }

    const visitorId = sessionStorage.getItem('visitor_id');
    const effectiveUserId = userId || visitorId;

    let isoDate = null;
    const parts = formData.session_date.split('/');
    if (parts.length === 3) {
      isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    setIsSaving(true);
    try {
      if (evolutionData?.id) {
        const oldValues: any = {};
        const newValues: any = {};
        
        let originalSessionDate = '';
        if (evolutionData.session_date) {
          const p = evolutionData.session_date.split('-');
          originalSessionDate = `${p[2]}/${p[1]}/${p[0]}`;
        } else {
          originalSessionDate = new Date(evolutionData.created_at).toLocaleDateString('pt-BR');
        }

        const fields = ['evolution_text', 'blood_pressure', 'heart_rate', 'respiratory_rate', 'temperature', 'saturation', 'pain_scale', 'session_date'];
        fields.forEach(field => {
          const oldVal = field === 'session_date' ? originalSessionDate : (evolutionData[field] || (field === 'pain_scale' ? '0' : ''));
          const newVal = formData[field as keyof typeof formData];
          
          if (oldVal.toString().trim() !== newVal.toString().trim()) {
            oldValues[field] = oldVal || 'Vazio';
            newValues[field] = newVal || 'Vazio';
          }
        });

        const { error: updateError } = await supabase
          .from('session_evolutions')
          .update({
            ...formData,
            session_date: isoDate
          })
          .eq('id', evolutionData.id);
        
        if (updateError) throw updateError;

        if (Object.keys(newValues).length > 0 && effectiveUserId) {
          await supabase
            .from('session_evolution_history')
            .insert([{
              evolution_id: evolutionData.id,
              user_id: effectiveUserId,
              old_values: oldValues,
              new_values: newValues
            }]);
        }
      } else {
        const { error: insertError } = await supabase
          .from('session_evolutions')
          .insert([{
            evaluation_id: evaluationId,
            user_id: effectiveUserId,
            ...formData,
            session_date: isoDate
          }]);
        if (insertError) throw insertError;
      }
      
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar evolução:', error);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Erro ao Salvar',
        message: error.message || "Não foi possível salvar a evolução. Tente novamente."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPainColor = (value: number) => {
    if (value === 0) return 'bg-green-500';
    if (value <= 3) return 'bg-yellow-400';
    if (value <= 6) return 'bg-orange-500';
    if (value <= 8) return 'bg-red-500';
    return 'bg-red-700';
  };

  if (!isOpen || isReadOnly) return null;

  const labelClasses = "text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block";
  const getInputClasses = (fieldName: string) => {
    const base = "w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm";
    const errorState = errors.includes(fieldName) ? "border-red-500 bg-red-50" : "border-slate-200";
    return `${base} ${errorState}`;
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-100">
              <MessageSquarePlus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                {evolutionData ? 'Editar Evolução' : 'Nova Evolução'}
              </h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{patientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-xl transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className={labelClasses}>Data da Sessão <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="session_date"
                  value={formData.session_date}
                  onChange={handleInputChange}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  className={getInputClasses('session_date')}
                />
              </div>
              <div>
                <label className={labelClasses}>PA (mmHg)</label>
                <input 
                  type="text" 
                  name="blood_pressure"
                  value={formData.blood_pressure}
                  onChange={handleInputChange}
                  placeholder="120/80"
                  className={getInputClasses('blood_pressure')}
                />
              </div>
              <div>
                <label className={labelClasses}>FC (bpm)</label>
                <input 
                  type="text" 
                  name="heart_rate"
                  value={formData.heart_rate}
                  onChange={handleInputChange}
                  placeholder="70"
                  className={getInputClasses('heart_rate')}
                />
              </div>
              <div>
                <label className={labelClasses}>FR (irpm)</label>
                <input 
                  type="text" 
                  name="respiratory_rate"
                  value={formData.respiratory_rate}
                  onChange={handleInputChange}
                  placeholder="16"
                  className={getInputClasses('respiratory_rate')}
                />
              </div>
              <div>
                <label className={labelClasses}>Temp (°C)</label>
                <input 
                  type="text" 
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  placeholder="36.5"
                  className={getInputClasses('temperature')}
                />
              </div>
              <div>
                <label className={labelClasses}>SatO2 (%)</label>
                <input 
                  type="text" 
                  name="saturation"
                  value={formData.saturation}
                  onChange={handleInputChange}
                  placeholder="98"
                  className={getInputClasses('saturation')}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <label className="text-sm font-bold text-slate-700 mb-4 block ml-1">Escala Visual Analógica de Dor (EVA)</label>
              <div className="flex flex-wrap gap-2 justify-between">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, pain_scale: num.toString() }))}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      formData.pain_scale === num.toString()
                      ? `${getPainColor(num)} text-white scale-110 shadow-lg ring-4 ring-white`
                      : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-3 px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Sem Dor</span>
                <span>Dor Moderada</span>
                <span>Dor Máxima</span>
              </div>
            </div>

            <div>
              <label className={labelClasses}>Descrição da Evolução <span className="text-red-500">*</span></label>
              <textarea
                name="evolution_text"
                value={formData.evolution_text}
                onChange={handleInputChange}
                placeholder="Descreva o atendimento, condutas e resposta do paciente..."
                className={`${getInputClasses('evolution_text')} h-64 resize-none text-slate-700`}
              />
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 font-bold"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {evolutionData ? 'Atualizar Evolução' : 'Salvar Evolução'}
          </button>
          <button
            onClick={onClose}
            className="px-8 bg-white text-slate-600 py-4 rounded-2xl font-bold border border-slate-200 hover:bg-slate-100 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>

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

export default SessionEvolutionModal;