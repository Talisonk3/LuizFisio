"use client";

import React from 'react';
import { X, Download, FileText } from 'lucide-react';

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
    link.download = isPDF ? 'exame.pdf' : 'exame.jpg';
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
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 flex items-center justify-center">
          {isPDF ? (
            <iframe 
              src={fileUrl} 
              className="w-full h-full rounded-xl border border-slate-200 shadow-inner"
              title="Visualização de PDF"
            />
          ) : (
            <img 
              src={fileUrl} 
              alt="Exame expandido" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;