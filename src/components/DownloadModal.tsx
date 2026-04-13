"use client";

import React, { useState } from 'react';
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

const DownloadModal = ({ isOpen, onClose, evaluationData, patientName }: DownloadModalProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({
    ficha: true,
    evolucao: false
  });

  if (!isOpen) return null;

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
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Paciente: ${patientName}`, 20, currentY);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, currentY, { align: 'right' });
      
      currentY += 10;
      doc.setDrawColor(226, 232, 240);
      doc.line(20, currentY, pageWidth - 20, currentY);
      currentY += 15;

      if (selectedOptions.ficha) {
        doc.setFontSize(16);
        doc.setTextColor(30, 64, 175);
        doc.text('1. Ficha de Avaliação', 20, currentY);
        currentY += 10;

        const fichaData = [
          ['Campo', 'Informação'],
          ['Data de Nascimento', evaluationData.birth_date || '-'],
          ['Gênero', evaluationData.gender || '-'],
          ['Estado Civil', evaluationData.marital_status || '-'],
          ['Profissão', evaluationData.profession || '-'],
          ['Telefone', evaluationData.phone || '-'],
          ['Endereço', evaluationData.address || '-'],
          ['Queixa Principal', evaluationData.chief_complaint || '-'],
          ['HDA', evaluationData.history_present_illness || '-'],
          ['Diagnóstico Fisioterapêutico', evaluationData.physio_diagnosis || '-'],
        ];

        autoTable(doc, {
          startY: currentY,
          head: [fichaData[0]],
          body: fichaData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] },
          margin: { left: 20, right: 20 },
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
            `PA: ${evo.blood_pressure || '-'}\nFC: ${evo.heart_rate || '-'}\nFR: ${evo.respiratory_rate || '-'}\nTemp: ${evo.temperature || '-'}°C\nSat: ${evo.saturation || '-'}%\nDor: ${evo.pain_scale || '0'}/10`,
            evo.evolution_text || '-'
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [['Data', 'Sinais Vitais e Dor', 'Evolução']],
            body: evoRows,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }, // Emerald-500
            columnStyles: {
              0: { cellWidth: 25 },
              1: { cellWidth: 45 },
              2: { cellWidth: 'auto' }
            },
            styles: { fontSize: 9 },
            margin: { left: 20, right: 20 },
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
                  <p className="text-xs text-slate-400">Dados cadastrais e anamnese</p>
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