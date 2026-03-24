"use client";

import React, { useState } from 'react';
import { 
  User, 
  ClipboardList, 
  Activity, 
  Dumbbell, 
  Save, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Evaluation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('identificacao');

  const tabs = [
    { id: 'identificacao', label: 'Identificação', icon: User },
    { id: 'anamnese', label: 'Anamnese', icon: ClipboardList },
    { id: 'exame-fisico', label: 'Exame Físico', icon: Activity },
    { id: 'funcional', label: 'Avaliação Funcional', icon: Dumbbell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Activity size={24} /> FisioSystem
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => navigate('/login')}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Nova Avaliação</h1>
              <p className="text-slate-500">Preencha os dados do paciente com atenção.</p>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md">
              <Save size={18} /> Salvar Ficha
            </button>
          </header>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            {activeTab === 'identificacao' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                    <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: João Silva" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Data de Nascimento</label>
                    <input type="date" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Profissão</label>
                    <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Telefone</label>
                    <input type="tel" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="(00) 00000-0000" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'anamnese' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Histórico Clínico</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Queixa Principal</label>
                    <textarea className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24" placeholder="Descreva o motivo da consulta..."></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">História da Doença Atual (HDA)</label>
                    <textarea className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Medicamentos em uso</label>
                      <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Cirurgias Prévias</label>
                      <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'exame-fisico' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Sinais Vitais e Inspeção</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">PA (mmHg)</label>
                    <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="120/80" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">FC (bpm)</label>
                    <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="70" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">FR (irpm)</label>
                    <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="16" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Temp (°C)</label>
                    <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="36.5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Inspeção / Palpação</label>
                  <textarea className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32" placeholder="Edema, cicatrizes, trofismo muscular..."></textarea>
                </div>
              </div>
            )}

            {activeTab === 'funcional' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Testes e Diagnóstico</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Amplitude de Movimento (ADM)</label>
                    <textarea className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Força Muscular (Grau 0-5)</label>
                    <textarea className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Diagnóstico Fisioterapêutico</label>
                    <textarea className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 font-medium text-blue-700 bg-blue-50/30"></textarea>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between">
              <button 
                disabled={activeTab === 'identificacao'}
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  setActiveTab(tabs[currentIndex - 1].id);
                }}
                className="text-slate-500 font-medium disabled:opacity-30"
              >
                Anterior
              </button>
              <button 
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1].id);
                  }
                }}
                className="text-blue-600 font-bold flex items-center gap-1"
              >
                {activeTab === 'funcional' ? 'Finalizar' : 'Próximo'} <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Evaluation;