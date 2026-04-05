"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, MessageSquarePlus, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SessionEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId: string;
  patientName: string;
  isReadOnly?: boolean;
  userId?: string;
}

const SessionEvolutionModal = ({ isOpen, onClose, evaluationId, patientName, isReadOnly, userId }: SessionEvolutionModalProps) => {
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

  const initialFormData = {
    evolution_text: '',
    blood_pressure: '',
    heart_rate: '',
    respiratory_rate: '',
    temperature: '',
    saturation: '',
    session_date: new Date().toLocaleDateString('pt-BR')
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen]);

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
      const { error } = await supabase
        .from('session_evolutions')
        .insert([{
          evaluation_id: evaluationId,
          user_id: userId,
          ...formData,
          session_date: isoDate
        }]);

      if (error) throw error;
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar evolução:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || isReadOnly) return null;

  const labelClasses = "text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block";
  const inputClasses = "w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm";

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-100">
              <MessageSquarePlus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Nova Evolução</h3>
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
            disabled={isSaving || !formData.evolution_text.trim()}
            className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 font-bold"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Evolução
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