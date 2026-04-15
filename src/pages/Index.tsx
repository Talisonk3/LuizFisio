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
      gradient: 'from-blue-700 to-blue-500',
      shadow: 'shadow-blue-200/50',
      path: '/pacientes'
    },
    {
      title: 'Criar Nova Ficha',
      description: 'Inicie uma nova avaliação fisioterapêutica completa.',
      icon: FilePlus,
      gradient: 'from-emerald-600 to-emerald-400',
      shadow: 'shadow-emerald-200/50',
      path: '/avaliacao'
    },
    {
      title: 'Compartilhar Fichas',
      description: 'Crie acessos para visitantes ou compartilhe com outros profissionais.',
      icon: Share2,
      gradient: 'from-purple-600 to-purple-400',
      shadow: 'shadow-purple-200/50',
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
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* Header - Atualizado para bg-blue-100 para dar o destaque solicitado */}
      <header className="bg-blue-100 border-b border-blue-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <Activity className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-black text-blue-900 tracking-tight">FisioSystem</h1>
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
              className={`group relative bg-gradient-to-br ${item.gradient} p-8 rounded-[2.5rem] shadow-2xl ${item.shadow} border-t border-white/20 text-left transition-all hover:scale-[1.03] hover:-translate-y-1 flex flex-col h-full overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="bg-white/20 text-white p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 relative z-10">
                <item.icon size={32} strokeWidth={2.5} />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3 relative z-10">{item.title}</h3>
              <p className="text-white/80 leading-relaxed mb-8 flex-1 relative z-10 font-medium">{item.description}</p>
              
              <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-white group-hover:gap-4 transition-all relative z-10">
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