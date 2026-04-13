"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { 
  Users, 
  FilePlus, 
  Share2, 
  Activity, 
  ChevronRight
} from 'lucide-react';
import UserMenu from '@/components/UserMenu';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Meus Pacientes',
      description: 'Gerencie sua lista de pacientes e histórico clínico.',
      icon: Users,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      path: '/pacientes'
    },
    {
      title: 'Criar Nova Ficha',
      description: 'Inicie uma nova avaliação fisioterapêutica completa.',
      icon: FilePlus,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      path: '/avaliacao'
    },
    {
      title: 'Compartilhar Fichas',
      description: 'Crie acessos para visitantes ou compartilhe com outros profissionais.',
      icon: Share2,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      path: '/compartilhar'
    }
  ];

  const getGreetingName = () => {
    const fullName = user?.user_metadata?.full_name;
    if (!fullName) return 'Doutor(a)';
    
    const firstName = fullName.split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
              <Activity className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">FisioSystem</h1>
          </div>
          
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        <div className="mb-12">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Olá, {getGreetingName()}! 👋
          </h2>
          <p className="text-slate-500 mt-2 text-lg">O que deseja fazer hoje no seu consultório?</p>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="group bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 text-left transition-all hover:scale-[1.03] hover:shadow-2xl hover:shadow-slate-300/50 flex flex-col h-full"
            >
              <div className={`${item.lightColor} ${item.textColor} p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed mb-8 flex-1">{item.description}</p>
              <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-blue-600 group-hover:gap-4 transition-all">
                Acessar agora <ChevronRight size={18} />
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} FisioSystem - Plataforma de Gestão Fisioterapêutica
      </footer>
    </div>
  );
};

export default Index;