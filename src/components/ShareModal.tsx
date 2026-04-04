"use client";

import React from 'react';
import { X, UserPlus, Users, Link, Copy, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  onShareNew: () => void;
  onShareRegistered: () => void;
}

const ShareModal = ({ isOpen, onClose, patientName, onShareNew, onShareRegistered }: ShareModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-purple-50 p-4 rounded-2xl text-purple-600">
              <Link size={32} />
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
            Compartilhar Ficha
          </h3>
          <p className="text-slate-500 leading-relaxed mb-8">
            Como você deseja compartilhar a avaliação de <span className="font-bold text-slate-700">{patientName}</span>?
          </p>
          
          <div className="space-y-3">
            <button
              onClick={onShareNew}
              className="w-full flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-purple-50 hover:border-purple-100 hover:text-purple-700 transition-all group text-left"
            >
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all">
                <UserPlus size={24} />
              </div>
              <div>
                <span className="font-bold block">Compartilhar com novo usuário</span>
                <span className="text-xs text-slate-400 group-hover:text-purple-400">Gera um link de visualização externa</span>
              </div>
            </button>

            <button
              onClick={onShareRegistered}
              className="w-full flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-700 transition-all group text-left"
            >
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Users size={24} />
              </div>
              <div>
                <span className="font-bold block">Compartilhar com usuário cadastrado</span>
                <span className="text-xs text-slate-400 group-hover:text-blue-400">Transfere ou permite acesso a outro profissional</span>
              </div>
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="w-full mt-6 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;