"use client";

import React, { useEffect, useState } from 'react';
import { X, Download, FileText, Loader2, ExternalLink } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
}

const FilePreviewModal = ({ isOpen, onClose, fileUrl }: FilePreviewModalProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Aplica o bloqueio de scroll
  useScrollLock(isOpen);

  const isPDF = fileUrl?.startsWith('data:application/pdf') || fileUrl?.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    if (isOpen && fileUrl && isPDF) {
      setLoading(true);
      try {
        if (fileUrl.startsWith('data:')) {
          // Conversão segura de Base64 para Blob
          const base64Parts = fileUrl.split(',');
          const contentType = base64Parts[0].split(':')[1].split(';')[0];
          const base64Data = base64Parts[1];
          
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          
          const blob = new Blob(byteArrays, { type: contentType });
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        } else {
          setBlobUrl(fileUrl);
        }
      } catch (error) {
        console.error('Erro ao processar PDF:', error);
      } finally {
        setLoading(false);
      }
    }

    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    };
  }, [isOpen, fileUrl, isPDF]);

  if (!isOpen || !fileUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = blobUrl || fileUrl;
    link.download = isPDF ? 'exame_clinico.pdf' : 'exame_clinico.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInNewTab = () => {
    if (blobUrl || fileUrl) {
      window.open(blobUrl || fileUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 md:p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl h-full max-h-[95vh] flex flex-col bg-white rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600 shrink-0">
              {isPDF ? <FileText size={20} /> : <Download size={20} />}
            </div>
            <h3 className="font-bold text-slate-800 truncate text-sm md:text-base">Visualização do Exame</h3>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            {isPDF && (
              <button 
                onClick={openInNewTab}
                className="p-2 md:p-3 bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                title="Abrir em nova aba"
              >
                <ExternalLink size={20} />
              </button>
            )}
            <button 
              onClick={handleDownload}
              className="hidden sm:flex p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all items-center gap-2 font-bold text-sm shadow-lg shadow-blue-100"
            >
              <Download size={18} /> Baixar
            </button>
            <button 
              onClick={onClose}
              className="p-2 md:p-3 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-2 md:p-4 bg-slate-50 flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="animate-spin" size={40} />
              <p className="font-bold">Carregando documento...</p>
            </div>
          ) : isPDF ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <iframe
                src={blobUrl || fileUrl}
                className="w-full h-full rounded-xl border border-slate-200 shadow-inner bg-white hidden md:block"
                title="Visualização de PDF"
              />
              {/* Fallback para Mobile ou quando o iframe falha */}
              <div className="md:hidden flex flex-col items-center text-center p-8">
                <div className="bg-blue-100 p-6 rounded-full text-blue-600 mb-4">
                  <FileText size={48} />
                </div>
                <p className="text-slate-600 font-medium mb-6">O PDF está pronto para visualização.</p>
                <button 
                  onClick={openInNewTab}
                  className="w-full bg-blue-600 text-white py-4 px-8 rounded-2xl font-bold shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <ExternalLink size={20} /> Abrir Documento
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full overflow-auto flex items-center justify-center">
              <img 
                src={fileUrl} 
                alt="Exame expandido" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
              />
            </div>
          )}
        </div>
        
        {/* Footer Mobile */}
        <div className="sm:hidden p-4 bg-white border-t border-slate-100">
          <button 
            onClick={handleDownload}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
          >
            <Download size={20} /> Baixar Arquivo
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;