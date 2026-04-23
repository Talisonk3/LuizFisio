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

  const formatName = (name: string) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (['da', 'de', 'do', 'das', 'dos', 'e'].includes(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

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
      if (dateRange.start.length > 0 && dateRange.start.length < 10) { setError('Data inicial incompleta.'); return; }
      if (dateRange.end.length > 0 && dateRange.end.length < 10) { setError('Data final incompleta.'); return; }
      if (isFutureDate(dateRange.start) || isFutureDate(dateRange.end)) { setError('Não é permitido selecionar datas futuras.'); return; }
    }

    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      // Cabeçalho Otimizado
      doc.setFillColor(239, 246, 255);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setFontSize(24);
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      doc.text('FisioSystem', 20, 25);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('RELATÓRIO CLÍNICO DIGITAL', 20, 32);

      doc.setFontSize(9);
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      doc.text(formatName(professionalInfo?.full_name || 'Profissional'), pageWidth - 20, 22, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`CREFITO: ${professionalInfo?.crefito || '-'}`, pageWidth - 20, 27, { align: 'right' });
      doc.text(`Tel: ${professionalInfo?.phone || '-'}`, pageWidth - 20, 32, { align: 'right' });

      currentY = 60;
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text(formatName(patientName), 20, currentY);
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 20, currentY + 7);

      currentY += 20;

      if (selectedOptions.ficha) {
        doc.setFillColor(37, 99, 235);
        doc.rect(20, currentY, 5, 8, 'F');
        doc.setFontSize(14);
        doc.setTextColor(30, 64, 175);
        doc.setFont('helvetica', 'bold');
        doc.text('Ficha de Avaliação', 28, currentY + 6);
        currentY += 12;

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
          ['HDP', evaluationData.previous_illness_history || '-'],
          ['Histórico Familiar', evaluationData.family_history || '-'],
          ['Medicamentos', evaluationData.medications || '-'],
          ['Cirurgias Prévias', evaluationData.previous_surgeries || '-'],
          ['Qualidade do Sono', evaluationData.sleep_quality || '-'],
          ['Horas de Sono', evaluationData.sleep_hours ? `${evaluationData.sleep_hours}h` : '-'],
          ['PA / FC / SatO2', `${evaluationData.blood_pressure || '-'} / ${evaluationData.heart_rate || '-'} bpm / ${evaluationData.saturation || '-'}%`],
          ['Nível de Consciência', evaluationData.consciousness_level || '-'],
          ['Postura Anterior', evaluationData.postural_anterior || '-'],
          ['Postura Lateral', evaluationData.postural_lateral || '-'],
          ['Postura Posterior', evaluationData.postural_posterior || '-'],
          ['Objetivo do Tratamento', evaluationData.treatment_objective || '-'],
          ['Diagnóstico Cinético Funcional', evaluationData.physio_diagnosis || '-'],
        ];

        autoTable(doc, {
          startY: currentY,
          head: [fichaData[0]],
          body: fichaData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235], fontSize: 10, fontStyle: 'bold', halign: 'left' },
          bodyStyles: { fontSize: 9, textColor: [51, 65, 85], cellPadding: 4 },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: [30, 64, 175] }, 1: { cellWidth: 'auto' } },
          margin: { left: 20, right: 20 },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 20;
      }

      if (selectedOptions.evolucao) {
        if (currentY > 240) { doc.addPage(); currentY = 20; }
        doc.setFillColor(16, 185, 129);
        doc.rect(20, currentY, 5, 8, 'F');
        doc.setFontSize(14);
        doc.setTextColor(6, 95, 70);
        doc.setFont('helvetica', 'bold');
        doc.text('Histórico de Evoluções', 28, currentY + 6);
        currentY += 12;

        let query = supabase.from('session_evolutions').select('*').eq('evaluation_id', evaluationData.id).order('session_date', { ascending: false });
        if (dateRange.start.length === 10) { const [d, m, y] = dateRange.start.split('/'); query = query.gte('session_date', `${y}-${m}-${d}`); }
        if (dateRange.end.length === 10) { const [d, m, y] = dateRange.end.split('/'); query = query.lte('session_date', `${y}-${m}-${d}`); }

        const { data: evolutions } = await query;
        if (evolutions && evolutions.length > 0) {
          const evoRows = evolutions.map(evo => {
            const sinais = [evo.blood_pressure ? `PA: ${evo.blood_pressure}` : null, evo.heart_rate ? `FC: ${evo.heart_rate}` : null, evo.respiratory_rate ? `FR: ${evo.respiratory_rate}` : null, evo.temperature ? `T: ${evo.temperature}°C` : null, evo.saturation ? `Sat: ${evo.saturation}%` : null, evo.pain_scale !== null ? `Dor: ${evo.pain_scale}/10` : null].filter(Boolean).join(' | ');
            return [evo.session_date ? new Date(evo.session_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-', sinais || 'Não informados', evo.evolution_text || '-'];
          });

          autoTable(doc, {
            startY: currentY,
            head: [['Data', 'Sinais Vitais e Dor', 'Evolução Detalhada']],
            body: evoRows,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85], cellPadding: 5 },
            columnStyles: { 0: { cellWidth: 25, fontStyle: 'bold', halign: 'center' }, 1: { cellWidth: 50, fontStyle: 'italic', textColor: [16, 185, 129] }, 2: { cellWidth: 'auto' } },
            margin: { left: 20, right: 20 },
            styles: { overflow: 'linebreak' }
          });
        } else {
          doc.setFontSize(10);
          doc.setTextColor(150);
          doc.text('Nenhum registro de evolução encontrado para o período.', 20, currentY);
        }
      }

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.text('Gerado por FisioSystem - Gestão Fisioterapêutica Inteligente', 20, doc.internal.pageSize.getHeight() - 10);
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
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Download size={32} /></div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X size={20} /></button>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">Exportar Documento</h3>
          <p className="text-slate-500 leading-relaxed mb-8">Selecione o que deseja incluir no arquivo PDF para download.</p>
          <div className="space-y-3 mb-6">
            <button onClick={() => setSelectedOptions(prev => ({ ...prev, ficha: !prev.ficha }))} className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${selectedOptions.ficha ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${selectedOptions.ficha ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}><FileText size={20} /></div>
                <div className="text-left"><p className={`font-bold ${selectedOptions.ficha ? 'text-blue-900' : 'text-slate-600'}`}>Ficha de Avaliação</p><p className="text-xs text-slate-400">Dados cadastrais e anamnese</p></div>
              </div>
              {selectedOptions.ficha && <CheckCircle2 size={20} className="text-blue-500" />}
            </button>
            <button onClick={() => setSelectedOptions(prev => ({ ...prev, evolucao: !prev.evolucao }))} className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${selectedOptions.evolucao ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${selectedOptions.evolucao ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}><History size={20} /></div>
                <div className="text-left"><p className={`font-bold ${selectedOptions.evolucao ? 'text-emerald-900' : 'text-slate-600'}`}>Histórico de Evoluções</p><p className="text-xs text-slate-400">Todas as sessões registradas</p></div>
              </div>
              {selectedOptions.evolucao && <CheckCircle2 size={20} className="text-emerald-500" />}
            </button>
          </div>
          {selectedOptions.evolucao && (
            <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-4 text-emerald-600"><Calendar size={18} /><span className="text-xs font-bold uppercase tracking-wider">Filtrar Período (Opcional)</span></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Data Inicial</label><input type="text" value={dateRange.start} onChange={(e) => handleDateChange('start', e.target.value)} placeholder="DD/MM/AAAA" maxLength={10} className={`w-full p-3 bg-white border rounded-xl text-sm outline-none transition-all ${isFutureDate(dateRange.start) ? 'border-red-500 text-red-600' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`} /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Data Final</label><input type="text" value={dateRange.end} onChange={(e) => handleDateChange('end', e.target.value)} placeholder="DD/MM/AAAA" maxLength={10} className={`w-full p-3 bg-white border rounded-xl text-sm outline-none transition-all ${isFutureDate(dateRange.end) ? 'border-red-500 text-red-600' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`} /></div>
              </div>
              {error && <div className="mt-4 flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-wider"><AlertCircle size={14} />{error}</div>}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button onClick={generatePDF} disabled={loading || (!selectedOptions.ficha && !selectedOptions.evolucao)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}Gerar PDF e Baixar</button>
            <button onClick={onClose} className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;