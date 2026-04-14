"use client";

import React, { useState, useEffect } from 'react';
import { X, FileText, History, Download, Loader2, CheckCircle2, Calendar, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationData: any;
  patientName: string;
}

const DownloadModal = ({ isOpen, onClose, evaluationData, patientName }: DownloadModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [professionalInfo, setProfessionalInfo] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState({
    ficha: false,
    evolucao: false
  });
  const [dateRange, setDateRange] = useState({
    start: '',
    end: new Date().toLocaleDateString('pt-BR')
  });

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    let day = numbers.slice(0, 2);
    let month = numbers.slice(2, 4);
    let year = numbers.slice(4, 8);
    
    if (day && parseInt(day) > 31) day = '31';
    if (day && day !== '0' && day !== '00' && parseInt(day) === 0) day = '01';
    if (month && parseInt(month) > 12) month = '12';
    if (month && month !== '0' && month !== '00' && parseInt(month) === 0) month = '01';
    
    if (numbers.length <= 2) return day;
    if (numbers.length <= 4) return `${day}/${month}`;
    return `${day}/${month}/${year}`;
  };

  const isFutureDate = (dateStr: string) => {
    if (dateStr.length !== 10) return false;
    const [d, m, y] = dateStr.split('/').map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedOptions({ ficha: false, evolucao: false });
      setError(null);

      // Buscar dados do profissional
      const fetchProfessional = async () => {
        if (!user) return;
        const { data } = await supabase
          .from('profiles')
          .select('full_name, crefito, phone')
          .eq('id', user.id)
          .single();
        if (data) setProfessionalInfo(data);
      };

      if (evaluationData.id) {
        const fetchFirstDate = async () => {
          const { data } = await supabase
            .from('session_evolutions')
            .select('session_date, created_at')
            .eq('evaluation_id', evaluationData.id)
            .order('session_date', { ascending: true })
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          if (data) {
            const dateToUse = data.session_date || data.created_at.split('T')[0];
            const [y, m, d] = dateToUse.split('-');
            setDateRange({
              start: `${d}/${m}/${y}`,
              end: new Date().toLocaleDateString('pt-BR')
            });
          } else {
            setDateRange({
              start: '',
              end: new Date().toLocaleDateString('pt-BR')
            });
          }
        };
        fetchFirstDate();
      }
      fetchProfessional();
    }
  }, [isOpen, evaluationData.id, user]);

  if (!isOpen) return null;

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const formatted = formatDate(value);
    setDateRange(prev => ({ ...prev, [field]: formatted }));
    setError(null);
  };

  const generatePDF = async () => {
    setError(null);

    if (selectedOptions.evolucao) {
      if (dateRange.start.length > 0 && dateRange.start.length < 10) {
        setError('Data inicial incompleta.');
        return;
      }
      if (dateRange.end.length > 0 && dateRange.end.length < 10) {
        setError('Data final incompleta.');
        return;
      }
      if (isFutureDate(dateRange.start) || isFutureDate(dateRange.end)) {
        setError('Não é permitido selecionar datas futuras.');
        return;
      }
    }

    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      // Cabeçalho do Sistema
      doc.setFontSize(22);
      doc.setTextColor(30, 64, 175);
      doc.text('FisioSystem - Relatório Clínico', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 15;

      // Informações do Profissional
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO PROFISSIONAL', 20, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 6;
      doc.text(`Nome: ${professionalInfo?.full_name || 'Não informado'}`, 20, currentY);
      currentY += 5;
      doc.text(`CREFITO: ${professionalInfo?.crefito || 'Não informado'}`, 20, currentY);
      currentY += 5;
      doc.text(`Telefone: ${professionalInfo?.phone || 'Não informado'}`, 20, currentY);
      
      currentY += 10;
      
      // Informações do Paciente
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO PACIENTE', 20, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 6;
      doc.text(`Paciente: ${patientName}`, 20, currentY);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, currentY, { align: 'right' });
      
      currentY += 8;
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
        
        if (dateRange.start || dateRange.end) {
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(`Período: ${dateRange.start || 'Início'} até ${dateRange.end || 'Hoje'}`, 20, currentY + 7);
          currentY += 15;
        } else {
          currentY += 10;
        }

        let query = supabase
          .from('session_evolutions')
          .select('*')
          .eq('evaluation_id', evaluationData.id)
          .order('session_date', { ascending: false });

        if (dateRange.start.length === 10) {
          const [d, m, y] = dateRange.start.split('/');
          query = query.gte('session_date', `${y}-${m}-${d}`);
        }
        if (dateRange.end.length === 10) {
          const [d, m, y] = dateRange.end.split('/');
          query = query.lte('session_date', `${y}-${m}-${d}`);
        }

        const { data: evolutions } = await query;

        if (evolutions && evolutions.length > 0) {
          const evoRows = evolutions.map(evo => {
            const pa = evo.blood_pressure || '-';
            const fc = evo.heart_rate || '-';
            const fr = evo.respiratory_rate || '-';
            const temp = evo.temperature ? `${evo.temperature}°C` : '-';
            const sat = evo.saturation ? `${evo.saturation}%` : '-';
            const dor = evo.pain_scale !== null && evo.pain_scale !== undefined ? `${evo.pain_scale}/10` : '0/10';

            return [
              evo.session_date ? new Date(evo.session_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
              `PA: ${pa}\nFC: ${fc}\nFR: ${fr}\nTemp: ${temp}\nSat: ${sat}\nDor: ${dor}`,
              evo.evolution_text || '-'
            ];
          });

          autoTable(doc, {
            startY: currentY,
            head: [['Data', 'Sinais Vitais e Dor', 'Evolução']],
            body: evoRows,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] },
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
          doc.text('Nenhuma evolução encontrada para o período selecionado.', 20, currentY);
        }
      }

      doc.save(`Relatorio_${patientName.replace(/\s+/g, '_')}.pdf`);
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
          
          <div className="space-y-3 mb-6">
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

          {selectedOptions.evolucao && (
            <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-4 text-emerald-600">
                <Calendar size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Filtrar Período (Opcional)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Data Inicial</label>
                  <input 
                    type="text" 
                    value={dateRange.start}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    className={`w-full p-3 bg-white border rounded-xl text-sm outline-none transition-all ${
                      isFutureDate(dateRange.start) ? 'border-red-500 text-red-600' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Data Final</label>
                  <input 
                    type="text" 
                    value={dateRange.end}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    className={`w-full p-3 bg-white border rounded-xl text-sm outline-none transition-all ${
                      isFutureDate(dateRange.end) ? 'border-red-500 text-red-600' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>
              {error && (
                <div className="mt-4 flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
            </div>
          )}
          
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