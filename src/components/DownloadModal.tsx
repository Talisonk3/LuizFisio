"use client";

import React, { useState, useEffect } from 'react';
import { X, FileText, History, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationData: any;
  patientName: string;
}

const fieldLabels: Record<string, string> = {
  patient_name: 'Nome do Paciente',
  birth_date: 'Data de Nascimento',
  email: 'E-mail',
  phone: 'Telefone',
  address: 'Endereço',
  marital_status: 'Estado Civil',
  gender: 'Gênero',
  profession: 'Profissão',
  weight: 'Peso (kg)',
  height: 'Altura (m)',
  caregiver_name: 'Responsável 1',
  caregiver_phone: 'Tel. Responsável 1',
  caregiver2_name: 'Responsável 2',
  caregiver2_phone: 'Tel. Responsável 2',
  caregiver3_name: 'Responsável 3',
  caregiver3_phone: 'Tel. Responsável 3',
  responsible_doctor: 'Médico Responsável',
  doctor_phone: 'Telefone do Médico',
  chief_complaint: 'Queixa Principal',
  history_present_illness: 'HDA',
  previous_illness_history: 'HDP',
  family_history: 'Histórico Familiar',
  drinks_details: 'Consumo de Álcool',
  smokes_details: 'Tabagismo',
  sedentary_details: 'Atividade Física',
  medications: 'Medicamentos em Uso',
  previous_surgeries: 'Cirurgias Prévias',
  pain_scale: 'Escala de Dor (EVA)',
  pain_worsening_factors: 'Fatores de Piora da Dor',
  pain_improvement_factors: 'Fatores de Melhora da Dor',
  blood_pressure: 'Pressão Arterial',
  heart_rate: 'Frequência Cardíaca',
  respiratory_rate: 'Frequência Respiratória',
  temperature: 'Temperatura',
  saturation: 'Saturação (SatO2)',
  cardiac_auscultation: 'Ausculta Cardíaca',
  pulmonary_auscultation: 'Ausculta Pulmonar',
  auditory_alteration_details: 'Alterações Auditivas',
  visual_alteration_details: 'Alterações Visuais',
  gait_aid_details: 'Auxílio de Marcha',
  inspection_palpation: 'Inspeção e Palpação',
  range_of_motion: 'ADM',
  muscle_strength: 'Força Muscular',
  muscle_tone_mmss: 'Tônus MMSS',
  muscle_tone_mmii: 'Tônus MMII',
  physio_diagnosis: 'Diagnóstico Fisioterapêutico',
  complementary_exams_details: 'Exames Complementares'
};

const DownloadModal = ({ isOpen, onClose, evaluationData, patientName }: DownloadModalProps) => {
  const [loading, setLoading] = useState(false);
  const [professional, setProfessional] = useState<{ full_name: string; crefito: string; phone: string } | null>(null);
  const [selectedOptions, setSelectedOptions] = useState({
    ficha: true,
    evolucao: false
  });

  useEffect(() => {
    const fetchProfessional = async () => {
      if (isOpen && evaluationData.user_id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, crefito, phone')
          .eq('id', evaluationData.user_id)
          .maybeSingle();
        
        if (!error && data) {
          setProfessional(data);
        }
      }
    };
    fetchProfessional();
  }, [isOpen, evaluationData.user_id]);

  if (!isOpen) return null;

  const capitalize = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      // Cabeçalho
      doc.setFontSize(22);
      doc.setTextColor(30, 64, 175); // Blue-800
      doc.text('FisioSystem - Relatório Clínico', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 15;
      doc.setFontSize(11);
      doc.setTextColor(80);
      
      // Informações do Profissional
      const profName = professional?.full_name ? capitalize(professional.full_name) : 'Não informado';
      const crefito = professional?.crefito || 'Não informado';
      const profPhone = professional?.phone || 'Não informado';
      
      doc.setFont("helvetica", "bold");
      doc.text(`Profissional: `, 20, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(profName, 45, currentY);
      
      currentY += 6;
      doc.setFont("helvetica", "bold");
      doc.text(`CREFITO: `, 20, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(crefito, 40, currentY);
      
      currentY += 6;
      doc.setFont("helvetica", "bold");
      doc.text(`Contato: `, 20, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(profPhone, 38, currentY);
      
      currentY += 10;
      doc.setFont("helvetica", "bold");
      doc.text(`Paciente: `, 20, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(capitalize(patientName), 40, currentY);
      
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, currentY, { align: 'right' });
      
      currentY += 8;
      doc.setDrawColor(226, 232, 240);
      doc.line(20, currentY, pageWidth - 20, currentY);
      currentY += 15;

      if (selectedOptions.ficha) {
        doc.setFontSize(16);
        doc.setTextColor(30, 64, 175);
        doc.setFont("helvetica", "bold");
        doc.text('1. Ficha de Avaliação', 20, currentY);
        currentY += 10;

        // Filtrar apenas campos preenchidos
        const fichaRows = Object.entries(fieldLabels)
          .map(([key, label]) => {
            let value = evaluationData[key];
            
            // Tratamento especial para endereço se vier separado
            if (key === 'address' && evaluationData.address_number) {
              value = `${evaluationData.address}, ${evaluationData.address_number}`;
            }

            return [label, value];
          })
          .filter(([_, value]) => value && value.toString().trim() !== '' && value !== 'Não');

        autoTable(doc, {
          startY: currentY,
          head: [['Campo', 'Informação']],
          body: fichaRows,
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] },
          margin: { left: 20, right: 20 },
          styles: { overflow: 'linebreak', cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 60, fontStyle: 'bold' },
            1: { cellWidth: 'auto' }
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 20;
      }

      if (selectedOptions.evolucao) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(30, 64, 175);
        doc.setFont("helvetica", "bold");
        doc.text('2. Histórico de Evoluções', 20, currentY);
        currentY += 10;

        const { data: evolutions } = await supabase
          .from('session_evolutions')
          .select('*')
          .eq('evaluation_id', evaluationData.id)
          .order('session_date', { ascending: false });

        if (evolutions && evolutions.length > 0) {
          const evoRows = evolutions.map(evo => [
            evo.session_date ? new Date(evo.session_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
            `PA: ${evo.blood_pressure || '-'}\nFC: ${evo.heart_rate || '-'}\nSat: ${evo.saturation || '-'}%`,
            evo.evolution_text || '-'
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [['Data', 'Sinais Vitais', 'Evolução']],
            body: evoRows,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }, // Emerald-500
            columnStyles: {
              0: { cellWidth: 30 },
              1: { cellWidth: 40 },
              2: { cellWidth: 'auto' }
            },
            margin: { left: 20, right: 20 },
            styles: { overflow: 'linebreak' }
          });
        } else {
          doc.setFontSize(10);
          doc.setTextColor(150);
          doc.text('Nenhuma evolução registrada.', 20, currentY);
        }
      }

      doc.save(`Ficha_${patientName.replace(/\s+/g, '_')}.pdf`);
      onClose();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
              <Download size={32} />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
            Exportar Documento
          </h3>
          <p className="text-slate-500 leading-relaxed mb-8">
            Selecione o que deseja incluir no arquivo PDF para download.
          </p>
          
          <div className="space-y-3 mb-8">
            <button
              onClick={() => setSelectedOptions(prev => ({ ...prev, ficha: !prev.ficha }))}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                selectedOptions.ficha ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${selectedOptions.ficha ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  <FileText size={20} />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${selectedOptions.ficha ? 'text-blue-900' : 'text-slate-600'}`}>Ficha de Avaliação</p>
                  <p className="text-xs text-slate-400">Todos os campos preenchidos</p>
                </div>
              </div>
              {selectedOptions.ficha && <CheckCircle2 size={20} className="text-blue-500" />}
            </button>

            <button
              onClick={() => setSelectedOptions(prev => ({ ...prev, evolucao: !prev.evolucao }))}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                selectedOptions.evolucao ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${selectedOptions.evolucao ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  <History size={20} />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${selectedOptions.evolucao ? 'text-emerald-900' : 'text-slate-600'}`}>Histórico de Evoluções</p>
                  <p className="text-xs text-slate-400">Todas as sessões registradas</p>
                </div>
              </div>
              {selectedOptions.evolucao && <CheckCircle2 size={20} className="text-emerald-500" />}
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={generatePDF}
              disabled={loading || (!selectedOptions.ficha && !selectedOptions.evolucao)}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              Gerar PDF e Baixar
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;