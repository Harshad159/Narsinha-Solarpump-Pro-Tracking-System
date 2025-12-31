
import React from 'react';
import { UserRole } from '../types';
import { UserCircle2, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  userName?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  allowedTabs: any[];
  onLogout: () => void;
}

const NarsinhaLogo = () => (
  <svg viewBox="0 0 500 500" className="w-12 h-12 md:w-14 md:h-14" xmlns="http://www.w3.org/2000/svg">
    <circle cx="250" cy="180" r="50" fill="#f97316" />
    <g fill="#f97316">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <rect
          key={deg}
          x="245"
          y="110"
          width="10"
          height="30"
          rx="5"
          transform={`rotate(${deg} 250 180)`}
        />
      ))}
    </g>
    <path d="M120 220 L380 280 L360 400 L160 400 Z" fill="#1e3a8a" />
    <path d="M130 235 L370 285 M145 270 L365 315 M160 305 L360 345 M175 340 L355 375" stroke="#fff" strokeWidth="2" />
    <path d="M180 230 L220 400 M240 245 L260 400 M300 260 L310 400" stroke="#fff" strokeWidth="2" />
    <rect x="390" y="150" width="40" height="250" rx="5" fill="#1e3a8a" />
    <rect x="395" y="160" width="30" height="10" fill="#3b82f6" opacity="0.5" />
    <path d="M100 350 Q250 500 450 300" fill="none" stroke="#166534" strokeWidth="15" strokeLinecap="round" />
  </svg>
);

const Layout: React.FC<LayoutProps> = ({ children, role, userName, activeTab, setActiveTab, allowedTabs, onLogout }) => {
  const getRoleLabel = (r: UserRole) => {
    switch(r) {
      case UserRole.ADMIN: return 'Administrator';
      case UserRole.STORE_KEEPER: return 'Store Keeper';
      case UserRole.INSTALLER: return userName || 'Field Installer';
      default: return r;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <NarsinhaLogo />
            </div>
            <div className="border-l border-slate-200 pl-3">
              <h1 className="font-black text-slate-900 leading-tight text-lg md:text-xl tracking-tight uppercase">
                Narsinha
              </h1>
              <p className="text-[9px] md:text-[10px] text-blue-800 font-bold uppercase tracking-widest leading-none">
                Solar Pump Manufacturer & Installer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
              <UserCircle2 size={16} className="text-slate-400" />
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">
                {getRoleLabel(role)}
              </span>
            </div>
            
            <button 
              onClick={() => onLogout()}
              className="p-2.5 text-red-500 hover:bg-red-50 bg-slate-50 rounded-2xl transition-all flex items-center gap-2 group border border-transparent hover:border-red-100"
              aria-label="Logout"
            >
              <LogOut size={20} className="group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline text-[11px] font-black uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-xl mx-auto flex justify-around items-center">
          {allowedTabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1.5 transition-all px-4 py-1.5 rounded-xl ${
                activeTab === item.id 
                  ? 'text-blue-600 bg-blue-50 ring-1 ring-blue-100' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={activeTab === item.id ? 'scale-110 transition-transform' : ''}>
                {item.icon}
              </span>
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
