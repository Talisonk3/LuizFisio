"use client";

import React from 'react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl shadow-slate-900/20 border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={`${bg} p-4 rounded-2xl ${color}`}>
              <Icon size={32} />
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">
            {title}
          </h3>
          <p className="text-slate-500 leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {onConfirm ? (
              <>
                <button
                  onClick={onConfirm}
                  className={`flex-1 text-white py-4 rounded-2xl font-bold transition-all shadow-lg ${button}`}
                >
                  {confirmLabel}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  {cancelLabel}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className={`w-full text-white py-4 rounded-2xl font-bold transition-all shadow-lg ${button}`}
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