"use client";

import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ModalType = 'warning' | 'success' | 'error' | 'info';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: ModalType;
  confirmLabel?: string;
  cancelLabel?: string;
}

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar'
}: NotificationModalProps) => {
  
  // Bloquear scroll total quando a modal estiver aberta
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.documentElement.classList.add('no-scroll');
      document.body.style.top = `-${scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.documentElement.classList.remove('no-scroll');
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.documentElement.classList.remove('no-scroll');
      document.body.style.top = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const config = {
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
    },
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      button: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100'
    },
    error: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
      button: 'bg-red-500 hover:bg-red-600 shadow-red-100'
    },
    info: {
      icon: Info,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
    }
  };

  const { icon: Icon, color, bg, button } = config[type];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-slate-900/20 border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="p-6 md:p-8 overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div className={`${bg} p-3 md:p-4 rounded-2xl ${color}`}>
              <Icon size={28} className="md:w-8 md:h-8" />
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">
            {title}
          </h3>
          <p className="text-sm md:text-base text-slate-500 leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {onConfirm ? (
              <>
                <button
                  onClick={onConfirm}
                  className={`flex-1 text-white py-3.5 md:py-4 rounded-2xl font-bold transition-all shadow-lg text-sm md:text-base ${button}`}
                >
                  {confirmLabel}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-100 text-slate-600 py-3.5 md:py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm md:text-base"
                >
                  {cancelLabel}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className={`w-full text-white py-3.5 md:py-4 rounded-2xl font-bold transition-all shadow-lg text-sm md:text-base ${button}`}
              >
                Entendido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;