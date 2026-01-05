
import React, { useState, useEffect } from 'react';
import { UserRole, InstallStatus, InstallerUser } from './types';
import { NAVIGATION_ITEMS } from './constants';
import { ApiService } from './services/api';
import { useAppData } from './hooks/useAppData';
import { useStock } from './hooks/useStock';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InwardForm from './components/InwardForm';
import DispatchForm from './components/DispatchForm';
import ReportModule from './components/ReportModule';
import UserManagement from './components/UserManagement';
import InstallerModule from './components/InstallerModule';
import Login from './components/Login';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // STRICT SECURITY: Never persist login state - always require fresh login
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  
  // Auto-logout after 2 minutes of inactivity
  const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [installers, setInstallers] = useState<InstallerUser[]>([]);

  const { 
    inwardEntries, setInwardEntries, 
    dispatchEntries, setDispatchEntries, 
    isLoading, setIsLoading 
  } = useAppData(isLoggedIn);

  const stock = useStock(inwardEntries, dispatchEntries);

  useEffect(() => {
    if (isLoggedIn) {
      ApiService.getInstallers().then(setInstallers);
    }
  }, [isLoggedIn]);

  const handleLogin = (userRole: UserRole, userName?: string) => {
    setRole(userRole);
    setIsLoggedIn(true);
    setCurrentUserName(userName || userRole);
    setActiveTab('dashboard');
    setLastActivity(Date.now());
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole(UserRole.ADMIN);
    setCurrentUserName('');
    setActiveTab('dashboard');
    // Clear ALL localStorage for security
    localStorage.clear();
  };

  // Track user activity (mouse, keyboard, touch)
  useEffect(() => {
    if (!isLoggedIn) return;

    const updateActivity = () => setLastActivity(Date.now());
    
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [isLoggedIn]);

  // Check for inactivity every 10 seconds
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkInactivity = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime >= INACTIVITY_TIMEOUT) {
        alert('⏱️ Session expired due to inactivity. Please login again.');
        handleLogout();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInactivity);
  }, [isLoggedIn, lastActivity]);

  const handleUpdateStatus = async (beneficiaryId: string, status: InstallStatus, remarks: string, imageUrls?: string[]) => {
    setIsLoading(true);
    try {
      const updated = await ApiService.updateSiteStatus(beneficiaryId, status, remarks, imageUrls);
      setDispatchEntries(prev => prev.map(d => d.beneficiaryId === beneficiaryId ? updated : d));
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Update failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInstaller = async (inst: InstallerUser) => {
    setIsLoading(true);
    try {
      const saved = await ApiService.saveInstaller(inst);
      setInstallers(prev => [...prev, saved]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInstaller = async (id: string) => {
    setIsLoading(true);
    try {
      await ApiService.deleteInstaller(id);
      setInstallers(prev => prev.filter(i => i.id !== id));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  // Special view for Installer role
  if (role === UserRole.INSTALLER) {
    return (
      <Layout 
        role={role} 
        userName={currentUserName}
        activeTab="installer-terminal" 
        setActiveTab={() => {}}
        allowedTabs={[]}
        onLogout={handleLogout}
      >
        <div className="max-w-7xl mx-auto p-4 md:p-6 pb-24">
          <InstallerModule 
            dispatches={dispatchEntries} 
            onUpdate={handleUpdateStatus} 
            userRole={role}
          />
        </div>
      </Layout>
    );
  }

  const allowedTabs = NAVIGATION_ITEMS.filter(item => item.roles.includes(role));
  
  return (
    <Layout 
      role={role} 
      userName={currentUserName}
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      allowedTabs={allowedTabs}
      onLogout={handleLogout}
    >
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center gap-3">
             <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Processing...</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-6 pb-24">
        {activeTab === 'dashboard' && (
          <Dashboard 
            stock={stock} 
            dispatches={dispatchEntries} 
            inwardEntries={inwardEntries} 
            userRole={role} 
            onUpdateStatus={handleUpdateStatus}
            onDeleteDispatch={(id) => ApiService.deleteDispatchEntry(id).then(() => setDispatchEntries(dispatchEntries.filter(x => x.id !== id)))}
          />
        )}
        {activeTab === 'inward' && (
          <InwardForm 
            onAdd={(e) => ApiService.createInwardEntry(e).then(res => setInwardEntries([res, ...inwardEntries]))} 
            onUpdate={(e) => ApiService.updateInwardEntry(e).then(res => setInwardEntries(inwardEntries.map(x => x.id === res.id ? res : x)))} 
            onDelete={(id) => ApiService.deleteInwardEntry(id).then(() => setInwardEntries(inwardEntries.filter(x => x.id !== id)))}
            entries={inwardEntries} 
          />
        )}
        {activeTab === 'dispatch' && (
          <DispatchForm 
            onAdd={(e) => ApiService.createDispatchEntry(e).then(res => {setDispatchEntries([res, ...dispatchEntries]); return res;})} 
            dispatches={dispatchEntries} 
            stock={stock}
            installers={installers}
          />
        )}
        {activeTab === 'team' && (
          <UserManagement 
            installers={installers}
            onAddInstaller={handleAddInstaller}
            onDeleteInstaller={handleDeleteInstaller}
          />
        )}
        {activeTab === 'reports' && <ReportModule inward={inwardEntries} dispatches={dispatchEntries} stock={stock} />}
      </div>
    </Layout>
  );
};

export default App;
