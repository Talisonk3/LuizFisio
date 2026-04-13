"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { User, LogOut, ChevronDown, UserCircle } from 'lucide-react';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pr-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group"
      >
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100 group-hover:scale-105 transition-transform">
          <User size={20} />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-black text-slate-800 leading-tight uppercase tracking-tight">
            {user?.user_metadata?.full_name?.split(' ')[0] || 'Profissional'}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fisioterapeuta</p>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2">
            <button
              onClick={() => { navigate('/perfil'); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
            >
              <UserCircle size={20} />
              Meu Perfil
            </button>
            <div className="h-px bg-slate-50 my-1 mx-2" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut size={20} />
              Sair do Sistema
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;