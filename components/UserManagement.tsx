
import React, { useState } from 'react';
import { InstallerUser } from '../types';
import { 
  Users, 
  Plus, 
  X, 
  ShieldCheck, 
  Key, 
  Trash2, 
  UserPlus, 
  Fingerprint, 
  Activity, 
  Phone, 
  CreditCard, 
  IdCard,
  Lock
} from 'lucide-react';

interface UserManagementProps {
  installers: InstallerUser[];
  onAddInstaller: (inst: InstallerUser) => void;
  onDeleteInstaller: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ installers, onAddInstaller, onDeleteInstaller }) => {
  const [showForm, setShowForm] = useState(false);
  const [newInstaller, setNewInstaller] = useState<Omit<InstallerUser, 'id'> & { id: string }>({ 
    name: '', 
    id: '', 
    pin: '', 
    mobile: '', 
    aadhaar: '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstaller.name || !newInstaller.id || newInstaller.pin.length !== 4) {
      alert("Please fill name, ID, and 4-digit PIN.");
      return;
    }
    
    // Check for duplicate ID
    if (installers.find(i => i.id === newInstaller.id)) {
      alert("This Installer ID already exists.");
      return;
    }

    onAddInstaller(newInstaller as InstallerUser);
    setNewInstaller({ name: '', id: '', pin: '', mobile: '', aadhaar: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-8 pb-24 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Team Management</h2>
          <p className="text-slate-500 font-bold text-xs tracking-tight uppercase mt-1">Authorized Field Personnel & Logistics IDs</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`w-full sm:w-auto p-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95 ${
            showForm ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
          }`}
        >
          {showForm ? <X size={18} /> : <UserPlus size={18} />}
          {showForm ? 'Cancel' : 'Register New ID'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-2xl animate-in zoom-in-95 duration-200">
           <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
               <Fingerprint size={24} />
             </div>
             <div>
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] leading-none">New Personnel Registration</h3>
               <p className="text-[9px] font-bold text-blue-600 uppercase mt-1">Field terminal access credentials</p>
             </div>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                   <input 
                     required 
                     type="text" 
                     placeholder="e.g. Rahul Patil" 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm" 
                     value={newInstaller.name} 
                     onChange={e => setNewInstaller({...newInstaller, name: e.target.value})} 
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mobile Number</label>
                   <div className="relative">
                      <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="tel" 
                        maxLength={10}
                        placeholder="10-digit mobile" 
                        className="w-full pl-10 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm" 
                        value={newInstaller.mobile} 
                        onChange={e => setNewInstaller({...newInstaller, mobile: e.target.value.replace(/\D/g, '')})} 
                      />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Aadhaar Number</label>
                   <div className="relative">
                      <CreditCard size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        maxLength={12}
                        placeholder="12-digit number" 
                        className="w-full pl-10 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm" 
                        value={newInstaller.aadhaar} 
                        onChange={e => setNewInstaller({...newInstaller, aadhaar: e.target.value.replace(/\D/g, '')})} 
                      />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Unique Installer ID</label>
                   <div className="relative">
                      <IdCard size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        required 
                        type="text" 
                        placeholder="INST-101" 
                        className="w-full pl-10 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-mono text-xs font-black uppercase" 
                        value={newInstaller.id} 
                        onChange={e => setNewInstaller({...newInstaller, id: e.target.value.toUpperCase()})} 
                      />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Login PIN (4-Digits)</label>
                   <div className="relative">
                      <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        required 
                        type="text" 
                        maxLength={4} 
                        placeholder="0000" 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 text-center font-black tracking-[0.5em] text-lg" 
                        value={newInstaller.pin} 
                        onChange={e => setNewInstaller({...newInstaller, pin: e.target.value.replace(/\D/g, '')})} 
                      />
                   </div>
                </div>
                <div className="flex items-end">
                   <button type="submit" className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                      <UserPlus size={16} /> Create Terminal ID
                   </button>
                </div>
              </div>
           </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {installers.map(inst => (
          <div key={inst.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6 group hover:border-blue-300 transition-all">
             <div className="w-20 h-20 flex-shrink-0 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-900 font-black text-3xl shadow-inner uppercase">
                {inst.name.charAt(0)}
             </div>
             
             <div className="flex-1 w-full text-center sm:text-left space-y-3">
                <div>
                   <div className="font-black text-slate-900 text-xl leading-none mb-1 tracking-tight">{inst.name}</div>
                   <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                      <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg uppercase">{inst.id}</span>
                      <div className="flex items-center gap-1 text-[9px] font-black text-green-500 uppercase tracking-widest">
                         <Activity size={10} className="animate-pulse" /> Active Field Terminal
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 justify-center sm:justify-start">
                         <Phone size={8} className="text-blue-400" /> Mobile
                      </p>
                      <p className="text-[11px] font-bold text-slate-700">{inst.mobile || 'Not Linked'}</p>
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 justify-center sm:justify-start">
                         <CreditCard size={8} className="text-orange-400" /> Aadhaar
                      </p>
                      <p className="text-[11px] font-bold text-slate-700">{inst.aadhaar ? inst.aadhaar.replace(/(\d{4})/g, '$1 ').trim() : 'Not Provided'}</p>
                   </div>
                </div>
             </div>
             
             <div className="flex sm:flex-col items-center gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none flex flex-col items-center px-6 py-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">LOGIN PIN</span>
                   <span className="text-lg font-black text-slate-600 tracking-widest leading-none">{inst.pin}</span>
                </div>
                <button 
                  onClick={() => {
                    const password = window.prompt('⚠️ ADMIN ONLY: Enter password to delete installer profile:');
                    if (password === 'Narsinha@2400') {
                      if (window.confirm(`Permanently revoke access and delete terminal for ${inst.name}? This cannot be undone.`)) {
                        onDeleteInstaller(inst.id);
                      }
                    } else if (password !== null) {
                      alert('❌ Incorrect password. Deletion cancelled.');
                    }
                  }}
                  className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 border border-transparent hover:border-red-100"
                  title="Delete Personnel (Admin Only)"
                >
                  <Trash2 size={24} />
                </button>
             </div>
          </div>
        ))}

        {installers.length === 0 && (
          <div className="col-span-full text-center py-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
             <Users className="mx-auto text-slate-200 mb-6" size={64} />
             <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">No Personnel Registered In Network</p>
             <button onClick={() => setShowForm(true)} className="mt-6 text-blue-600 text-xs font-black uppercase tracking-widest hover:underline">+ Initialize First Terminal</button>
          </div>
        )}
      </div>

      <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2.5rem] flex items-start gap-6 shadow-sm">
         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
            <ShieldCheck size={28} />
         </div>
         <div>
            <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5 flex items-center gap-2">
               Access Control & Security Protocol
            </h4>
            <p className="text-[11px] text-blue-800 font-bold leading-relaxed">
               All field IDs are unique and linked to specific terminal sessions. Deleting a record immediately terminates all active sessions and revokes photo-upload permissions. PINs should be rotated if device loss is reported. Mobile and Aadhaar data is used for payroll and audit verification.
            </p>
         </div>
      </div>
    </div>
  );
};

export default UserManagement;
