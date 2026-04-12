"use client";

import React, { useEffect, useState } from 'react';
import { X, Download, FileText, ExternalLink, Loader2 } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
}

const FilePreviewModal = ({ isOpen, onClose, fileUrl }: FilePreviewModalProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPDF = fileUrl?.startsWith('data:application/pdf') || fileUrl?.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    if (isOpen && fileUrl && isPDF && fileUrl.startsWith('data:')) {
      setLoading(true);
      try {
        const base64Data = fileUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (error) {
        console.error('Erro ao processar PDF:', error);
      } finally {
        setLoading(false);
      }
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    };
  }, [isOpen, fileUrl]);

  if (!isOpen || !fileUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = isPDF ? 'exame_clinico.pdf' : 'exame_clinico.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    if (blobUrl || fileUrl) {
      window.open(blobUrl || fileUrl, '_blank');
    }
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
            {isPDF && (
              <button 
                onClick={handleOpenNewTab}
                className="p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2 font-bold text-sm shadow-lg shadow-blue-100"
              >
                <ExternalLink size={18} /> Abrir em Tela Cheia
              </button>
            )}
            <button 
              onClick={handleDownload}
              className="p-3 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2 font-bold text-sm"
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
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="animate-spin" size={40} />
              <p className="font-bold">Carregando documento...</p>
            </div>
          ) : isPDF ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <embed
                src={`${blobUrl || fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                type="application/pdf"
                className="w-full h-full rounded-xl border border-slate-200 shadow-inner bg-white"
              />
              <p className="mt-4 text-xs text-slate-400 font-medium">
                Se o documento não aparecer, clique em "Abrir em Tela Cheia" acima.
              </p>
            </div>
          ) : (
            <div className="w-full h-full overflow-auto flex items-center justify-center">
              <img 
                src={fileUrlthink
The user is pointing out that my previous response was cut off. I need to complete the `FilePreviewModal.tsx` file and provide the summary and chat summary as required by the instructions.

Looking at the previous output:
```tsx
            <div className="w-full h-full overflow-auto flex items-center justify-center">
              <img 
                src={fileUrl
```
It stopped right there. I need to finish the `img` tag, the `div`s, the component, and the file write block.

Then I need to provide the concise summary and the `<dyad-chat-summary>` tag.

File structure to complete:
```tsx
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