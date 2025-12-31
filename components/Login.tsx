
import React, { useState, useEffect } from 'react';
import { UserRole, InstallerUser } from '../types';
import { ApiService } from '../services/api';
import { ShieldCheck, Package, Eye, EyeOff, ArrowRight, MapPin, UserCheck, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole, userName?: string) => void;
}

const NarsinhaLogo = () => (
  <svg viewBox="0 0 500 500" className="w-24 h-24 mb-6 mx-auto" xmlns="http://www.w3.org/2000/svg">
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

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [installerId, setInstallerId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    try {
      const response = await ApiService.login({
        role: selectedRole as string,
        id: selectedRole === UserRole.INSTALLER ? installerId.toUpperCase() : undefined,
        pin: pin
      });

      // Securely store JWT for the ApiService to use
      localStorage.setItem('auth_token', response.token);
      onLogin(selectedRole as UserRole, response.userName);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
      setPin('');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const roles = [
    { 
      type: UserRole.ADMIN, 
      label: 'Administrator', 
      icon: <ShieldCheck size={32} className="text-orange-500" />,
      desc: 'Stock, Dispatch & Reports' 
    },
    { 
      type: UserRole.STORE_KEEPER, 
      label: 'Store Keeper', 
      icon: <Package size={32} className="text-blue-500" />,
      desc: 'Inward & Outward manifest' 
    },
    { 
      type: UserRole.INSTALLER, 
      label: 'Field Installer', 
      icon: <MapPin size={32} className="text-green-500" />,
      desc: 'Site status & Photo updates' 
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center p-6">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-10">
          <NarsinhaLogo />
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Narsinha</h1>
          <p className="text-xs font-bold text-blue-800 tracking-[0.2em] uppercase mt-2">
            Operations Terminal
          </p>
        </div>

        {!selectedRole ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-center text-slate-500 font-bold text-[10px] uppercase mb-6 tracking-widest">Select Access Level</p>
            {roles.map((r) => (
              <button
                key={r.type}
                onClick={() => setSelectedRole(r.type)}
                className="w-full bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 text-left hover:border-blue-500 hover:ring-2 hover:ring-blue-100 transition-all group"
              >
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                  {r.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-slate-800 uppercase text-lg leading-none">{r.label}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight mt-1">{r.desc}</p>
                </div>
                <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <button 
              disabled={isAuthenticating}
              onClick={() => {setSelectedRole(null); setPin(''); setError(''); setInstallerId('');}}
              className="text-slate-400 font-black text-[10px] uppercase mb-8 flex items-center gap-1 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              ← Back to roles
            </button>
            
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
                {roles.find(r => r.type === selectedRole)?.icon}
              </div>
              <div>
                <h3 className="font-black text-slate-900 uppercase text-xl italic leading-none">{selectedRole}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Terminal Authentication</p>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              {selectedRole === UserRole.INSTALLER && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-1">Your Installer ID</label>
                  <div className="relative">
                     <UserCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input
                        required
                        disabled={isAuthenticating}
                        type="text"
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-mono text-sm font-black uppercase"
                        placeholder="INST-XXXX"
                        value={installerId}
                        onChange={(e) => setInstallerId(e.target.value)}
                     />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-1">Secret Access PIN</label>
                <div className="relative">
                  <input
                    disabled={isAuthenticating}
                    autoFocus={selectedRole !== UserRole.INSTALLER}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    className={`w-full p-4 bg-slate-50 border ${error ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200'} rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 text-center text-3xl font-black tracking-[0.5em]`}
                    placeholder="••••"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                  >
                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {error && <p className="text-red-500 text-[11px] font-black uppercase text-center mt-3 animate-pulse">{error}</p>}
              </div>

              <button 
                type="submit"
                disabled={pin.length < 4 || (selectedRole === UserRole.INSTALLER && !installerId) || isAuthenticating}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                  pin.length < 4 || (selectedRole === UserRole.INSTALLER && !installerId) || isAuthenticating
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                    : 'bg-blue-700 text-white shadow-blue-200 hover:bg-blue-800 active:scale-95'
                }`}
              >
                {isAuthenticating ? <Loader2 className="animate-spin" size={20} /> : 'Initialize Terminal'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
