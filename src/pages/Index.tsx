"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { 
  Users, 
  FilePlus, 
  Share2, 
  LogOut, 
  Activity, 
  ChevronRight,
  User,
  Settings,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import ProfileModal from '@/components/ProfileModal';
import SecurityModal from '@/components/SecurityModal';
import NotificationModal from '@/components/NotificationModal';

const Index = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: ''
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const formatDisplayName = (name: string | undefined) => {
    if (!name) return 'Profissional';
    const parts = name.trim().split(/\s+/);
    const firstTwo = parts.slice(0, 2);
    return firstTwo
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

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
          
          <div className="flex items-center gap-4 relative" ref={menuRef}>
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-800">
                {formatDisplayName(user?.user_metadata?.full_name)}
              </p>
              <p className="text-xs text-slate-500">Fisioterapeuta</p>
            </div>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 p-1.5 pr-3 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:shadow-md transition-all group"
            >
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform">
                <User size={20} />
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl shadow-slate-200/50 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <button 
                  onClick={() => { setIsProfileOpen(true); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <Settings size={18} />
                  Meu Perfil
                </button>
                <button 
                  onClick={() => { setIsSecurityOpen(true); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                >
                  <ShieldCheck size={18} />
                  Segurança
                </button>
                <div className="h-px bg-slate-50 my-1 mx-4" />
                <button 
                  onClick={() => { signOut(); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} />
                  Sair do Sistema
                </button>
              </div>
            )}
          </div>
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
              <item.title && <h3 className="text-2xl font-bold text-slate-800 mb-3">{item.title}</h3>}
              <p className="text-slate-500 leading-relaxed mb-8 flex-1">{item.description}</p>
              <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-blue-600 group-hover:gap-4 transition-all">
                Acessar agora <ChevronRight size={18} />
              </div>
            </button>
          ))}
        </div>
      </main>

      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={user?.id || ''}
        onSuccess={(msg) => setNotification({ isOpen: true, message: msg })}
      />

      <SecurityModal 
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        onSuccess={(msg) => setNotification({ isOpen: true, message: msg })}
      />

      <NotificationModal 
        isOpen={notification.isOpen}
        onClose={() => setNotification({ isOpen: false, message: '' })}
        title="Sucesso!"
        message={notification.message}
        type="success"
      />

      {/* Footer */}
      <footer className="p-8 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} FisioSystem - Plataforma de Gestão Fisioterapêutica
      </footer>
    </div>
  );
};

export default Index;