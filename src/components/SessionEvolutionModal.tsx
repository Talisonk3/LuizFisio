"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Loader2, MessageSquarePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SessionEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId: string;
  patientName: string;
  isReadOnly?: boolean;
  userId?: string;
  evolutionData?: any; // Dados para edição
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
    session_date: new Date().toLocaleDateString('pt-BR')
  });

  useEffect(() => {
    if (isOpen) {
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
           formData.session_date !== originalSessionDate;
  }, [formData, evolutionData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let filteredValue = value;

    if (name === 'session_date') {
      filteredValue = formatDate(value);
    } else if (name === 'blood_pressure') {
      const numbers = value.replace(/\D/g, '').substring(0, 5);
      filteredValue = numbers.length > 2 ? `${numbers.slice(0, 2)}/${numbers.slice(2)}` : numbers;
    } else if (['heart_rate', 'respiratory_rate', 'saturation'].includes(name)) {
      filteredValue = value.replace(/\D/g, '').substring(0, 3);
    } else if (name === 'temperature') {
      const numbers = value.replace(/\D/g, '').substring(0, 3);
      filteredValue = numbers.length > 2 ? `${numbers.slice(0, 2)}.${numbers.slice(2)}` : numbers;
    }

    setFormData(prev => ({ ...prev, [name]: filteredValue }));
  };

  const handleSave = async () => {
    if (!formData.evolution_text.trim() || !userId) return;
    
    let isoDate = null;
    const parts = formData.session_date.split('/');
    if (parts.length === 3) {
      isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    setIsSaving(true);
    try {
      if (evolutionData?.id) {
        // Capturar valores antigos para o histórico
        const oldValues: any = {};
        const newValues: any = {};
        
        let originalSessionDate = '';
        if (evolutionData.session_date) {
          const p = evolutionData.session_date.split('-');
          originalSessionDate = `${p[2]}/${p[1]}/${p[0]}`;
        } else {
          originalSessionDate = new Date(evolutionData.created_at).toLocaleDateString('pt-BR');
        }

        const fields = ['evolution_text', 'blood_pressure', 'heart_rate', 'respiratory_rate', 'temperature', 'saturation', 'session_date'];
        fields.forEach(field => {
          const oldVal = field === 'session_date' ? originalSessionDate : (evolutionData[field] || '');
          const newVal = formData[field as keyof typeof formData];
          
          // Só registra se houver diferença real
          if (oldVal.toString().trim() !== newVal.toString().trim()) {
            oldValues[field] = oldVal || 'Vazio';
            newValues[field] = newVal || 'Vazio';
          }
        });

        // Atualizar a evolução
        const { error: updateError } = await supabase
          .from('session_evolutions')
          .update({
            ...formData,
            session_date: isoDate
          })
          .eq('id', evolutionData.id);
        
        if (updateError) throw updateError;

        // Registrar histórico se houver mudanças detectadas
        if (Object.keys(newValues).length > 0) {
          const { error: historyError } = await supabase
            .from('session_evolution_history')
            .insert([{
              evolution_id: evolutionData.id,
              user_id: userId,
              old_values: oldValues,
              new_values: newValues
            }]);
          
          if (historyError) console.error('Erro ao salvar histórico:', historyError);
        }
      } else {
        // Inserir nova evolução
        const { error: insertError } = await supabase
          .from('session_evolutions')
          .insert([{
            evaluation_id: evaluationId,
            user_id: userId,
            ...formData,
            session_date: isoDate
          }]);
        if (insertError) throw insertError;
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar evolução:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || isReadOnly) return null;

  const labelClasses = "text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block";
  const inputClasses = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm";

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
                <label className={labelClasses}>Data da Sessão</label>
                <input 
                  type="text" 
                  name="session_date"
                  value={formData.session_date}
                  onChange={handleInputChange}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  className={inputClasses}
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
                  className={inputClasses}
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
                  className={inputClasses}
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
                  className={inputClasses}
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
                  className={inputClasses}
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
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Descrição da Evolução</label>
              <textarea
                name="evolution_text"
                value={formData.evolution_text}
                onChange={handleInputChange}
                placeholder="Descreva o atendimento, condutas e resposta do paciente..."
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all h-64 resize-none text-sm text-slate-700"
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
    </div>
  );
};

export default SessionEvolutionModal;