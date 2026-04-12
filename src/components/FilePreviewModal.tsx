"use client";

import React from 'react';
import { X, Download, FileText, AlertCircle } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
}

const FilePreviewModal = ({ isOpen, onClose, fileUrl }: FilePreviewModalProps) => {
  if (!isOpen || !fileUrl) return null;

  const isPDF = fileUrl.startsWith('data:application/pdf') || fileUrl.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    // Tenta extrair um nome ou usa um padrão
    link.download = isPDF ? 'exame_clinico.pdf' : 'exame_clinico.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl h-full max-h-[90vh] flex flex-col bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
              {isPDF ? <FileText size={20} /> : <Download size={20} />}
            </div>
            <h3 className="font-bold text-slate-800">Visualização do Exame</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              className="p-3 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all flex items-center gap-2 font-bold text-sm"
            >
              <Download size={18} /> Baixar
            </button>
            <button 
              onClick={onClose}
              className="p-3 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4 md:p-8 bg-slate-50 flex items-center justify-center">
          {isPDF ? (
            <object
              data={fileUrl}
              type="application/pdf"
              className="w-full h-full rounded-xl border border-slate-200 shadow-inner bg-white"
            >
              {/* Fallback caso o object falhe */}
              <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
                <div className="bg-amber-50 p-6 rounded-full text-amber-500 mb-6">
                  <AlertCircle size={48} />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">Visualização não suportada</h4>
                <p className="max-w-md mb-8 leading-relaxed">
                  Seu navegador ou dispositivo não permite visualizar este PDF diretamente aqui. 
                  Por favor, utilize o botão abaixo para baixar e abrir o arquivo.
                </p>
                <button 
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Download size={20} /> Baixar PDF agora
                </button>
              </div>
            </object>
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
      </div>
    </div>
  );
};

export default FilePreviewModal;