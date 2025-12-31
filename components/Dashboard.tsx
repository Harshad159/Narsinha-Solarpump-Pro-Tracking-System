
import React, { useState, useMemo, useRef } from 'react';
import { Stock, DispatchEntry, InwardEntry, InstallStatus, MaterialCategory, UserRole } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { compressImage, base64ToBlob } from '../utils/mediaUtils';
import { 
  Eye, 
  X, 
  MapPin, 
  Clock, 
  Package as PackageIcon, 
  Download, 
  Maximize2, 
  Loader2, 
  FileArchive, 
  Search, 
  Filter, 
  AlertTriangle, 
  Settings2,
  Plus,
  Camera,
  Copy,
  Check,
  Phone,
  UserCheck
} from 'lucide-react';
import JSZip from 'jszip';

interface DashboardProps {
  stock: Stock;
  dispatches: DispatchEntry[];
  inwardEntries: InwardEntry[];
  userRole: UserRole;
  onUpdateStatus: (beneficiaryId: string, status: InstallStatus, remarks: string, imageUrls?: string[]) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ stock, dispatches, userRole, onUpdateStatus }) => {
  const [selectedSite, setSelectedSite] = useState<DispatchEntry | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{url: string, name: string} | null>(null);
  const [isZipping, setIsZipping] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newStatus, setNewStatus] = useState<InstallStatus>(InstallStatus.NOT_STARTED);
  const [remarks, setRemarks] = useState('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lowStockThreshold, setLowStockThreshold] = useState<number>(15);
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      const matchesSearch = 
        d.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.beneficiaryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.taluka.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.installerName && d.installerName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [dispatches, searchTerm, statusFilter]);

  const getStockStatus = (qty: number) => {
    if (qty <= 0) return { color: 'text-red-600', isLow: true, isCritical: true };
    if (qty <= lowStockThreshold) return { color: 'text-orange-500', isLow: true, isCritical: false };
    return { color: 'text-green-600', isLow: false, isCritical: false };
  };

  const getStatusColor = (status: InstallStatus) => {
    switch (status) {
      case InstallStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200';
      case InstallStatus.NOT_STARTED: return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    
    setIsProcessingImages(true);
    try {
      const processed = await Promise.all(files.map((file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const result = await compressImage(reader.result as string);
            resolve(result);
          };
          reader.readAsDataURL(file);
        });
      }));
      setPreviewUrls(prev => [...prev, ...processed]);
    } catch (err) {
      console.error("Image processing failed", err);
    } finally {
      setIsProcessingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateSubmit = async () => {
    if (!selectedSite) return;
    await onUpdateStatus(selectedSite.beneficiaryId, newStatus, remarks, previewUrls.length > 0 ? previewUrls : undefined);
    
    setShowUpdateForm(false);
    setRemarks('');
    setPreviewUrls([]);
  };

  const handleDownloadAllSiteZip = async (site: DispatchEntry) => {
    const zipId = `all-${site.beneficiaryId}`;
    setIsZipping(zipId);
    try {
      const zip = new JSZip();
      const rootFolder = zip.folder(`${site.farmerName}_${site.beneficiaryId}`.replace(/\s+/g, '_'));
      site.history.forEach((h) => {
        if (h.imageUrls?.length) {
          const stageFolder = rootFolder?.folder(`${h.date}_${h.status.replace(/\s+/g, '_')}`);
          h.imageUrls.forEach((url, idx) => {
            stageFolder?.file(`Photo_${idx + 1}.png`, base64ToBlob(url));
          });
        }
      });
      const content = await zip.generateAsync({ type: 'blob' }) as Blob;
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(content);
      link.download = `${site.farmerName}_${site.beneficiaryId}_PHOTOS.zip`.replace(/\s+/g, '_');
      link.click();
    } finally {
      setIsZipping(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Operations Dashboard</h2>
          <p className="text-slate-500 font-bold text-xs tracking-tight uppercase mt-1">Stock status and {dispatches.length} active sites</p>
        </div>
        
        <div className="flex items-center gap-2">
           {showThresholdConfig ? (
             <div className="bg-white border border-blue-100 p-2 rounded-2xl flex items-center gap-3 shadow-xl animate-in slide-in-from-right-4 duration-300">
                <span className="text-[9px] font-black text-slate-400 uppercase pl-2">Low Stock Limit</span>
                <input 
                  type="number" 
                  value={lowStockThreshold} 
                  onChange={(e) => setLowStockThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => setShowThresholdConfig(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200"><X size={14} /></button>
             </div>
           ) : (
             <button 
                onClick={() => setShowThresholdConfig(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
             >
                <Settings2 size={14} /> Alerts
             </button>
           )}
        </div>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
        {['MOTOR', 'BOS', 'PANEL', 'CONTROLLER', 'STRUCTURE'].map(catKey => {
          const cat = catKey as MaterialCategory;
          const catStock = stock[cat];
          const hasLowStock = Object.values(catStock).some(qty => (qty as number) <= lowStockThreshold);
          const isCritical = Object.values(catStock).some(qty => (qty as number) <= 0);

          return (
            <div key={cat} className={`bg-white p-4 rounded-3xl border transition-all min-w-[180px] flex-shrink-0 shadow-sm ${isCritical ? 'border-red-200 bg-red-50/10' : hasLowStock ? 'border-orange-200 bg-orange-50/10' : 'border-slate-200'}`}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{CATEGORY_LABELS[cat]}</p>
                {hasLowStock && (
                  <div className={`p-1 rounded-lg ${isCritical ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    <AlertTriangle size={12} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {Object.entries(catStock).map(([spec, qty]) => {
                  const { color } = getStockStatus(qty as number);
                  return (
                    <div key={spec} className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 truncate mr-2">{spec}</span>
                      <span className={`text-sm font-black tracking-tight ${color}`}>{qty as number}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
           <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg">
                <Clock size={20} />
             </div>
             <div>
               <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm italic">Site Progress Tracker</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase">{filteredDispatches.length} active sites</p>
             </div>
           </div>
           <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
              <div className="relative flex-1 sm:w-64">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Search farmer, installer, ID..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-100" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="w-full sm:w-48 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-tight outline-none focus:ring-4 focus:ring-blue-100 appearance-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                 <option value="ALL">All Statuses</option>
                 {Object.values(InstallStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">Beneficiary</th>
                <th className="px-8 py-6">Location</th>
                <th className="px-8 py-6">Installer</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDispatches.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                     <div className="font-black text-slate-900 text-base leading-none mb-1">{d.farmerName}</div>
                     <div className="text-[11px] text-blue-600 font-black uppercase tracking-tighter flex items-center gap-2">
                        {d.beneficiaryId}
                        {d.farmerMobile && <span className="text-slate-400 font-bold">| {d.farmerMobile}</span>}
                     </div>
                  </td>
                  <td className="px-8 py-5">
                     <div className="text-xs font-bold text-slate-600 uppercase mb-0.5">{d.village}</div>
                     <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{d.taluka}, {d.subDivision}</div>
                  </td>
                  <td className="px-8 py-5">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                           <UserCheck size={14} />
                        </div>
                        <div>
                           <div className="text-xs font-black text-slate-800 uppercase leading-none mb-1">{d.installerName || 'Unassigned'}</div>
                           {d.installerMobile && <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Phone size={8} className="text-green-500" /> {d.installerMobile}</div>}
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-5">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tight border ${getStatusColor(d.status)}`}>
                        {d.status.toUpperCase()}
                      </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => setSelectedSite(d)} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100"><Eye size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDispatches.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No Matching Sites Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSite && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-500">
             <div className="p-8 bg-slate-950 text-white flex justify-between items-start">
                <div className="space-y-3">
                   <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-black tracking-tight uppercase italic">{selectedSite.farmerName}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tight ${getStatusColor(selectedSite.status)}`}>
                        {selectedSite.status}
                      </span>
                   </div>
                   <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-blue-500" /> 
                        {selectedSite.village}, {selectedSite.taluka}, {selectedSite.subDivision}
                      </div>
                      <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1 rounded-lg text-blue-400">
                        <UserCheck size={14} />
                        Assigned: {selectedSite.installerName} {selectedSite.installerId && <span className="text-blue-200">({selectedSite.installerId})</span>}
                        {selectedSite.installerMobile && <span className="text-slate-500 text-[10px] ml-1">| {selectedSite.installerMobile}</span>}
                      </div>
                      <button onClick={() => handleCopyId(selectedSite.beneficiaryId)} className="flex items-center gap-1.5 font-mono text-blue-400 hover:text-blue-300 transition-colors">
                        {selectedSite.beneficiaryId}
                        {copiedId === selectedSite.beneficiaryId ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => setShowUpdateForm(!showUpdateForm)} className={`p-4 rounded-2xl flex items-center gap-2 font-black uppercase text-xs tracking-widest transition-all ${showUpdateForm ? 'bg-slate-800 text-slate-400' : 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/40'}`}>
                      {showUpdateForm ? <X size={18} /> : <Plus size={18} />}
                      {showUpdateForm ? 'Cancel' : 'Update Status'}
                   </button>
                   <button onClick={() => setSelectedSite(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-colors"><X size={28} /></button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                {showUpdateForm ? (
                  <div className="bg-white p-8 rounded-[2rem] border border-orange-100 shadow-sm space-y-8 animate-in slide-in-from-top-4 duration-300">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select New Phase</label>
                           <div className="grid grid-cols-2 gap-2">
                              {Object.values(InstallStatus).map(s => (
                                <button key={s} onClick={() => setNewStatus(s)} className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${newStatus === s ? 'bg-orange-50 border-orange-600 text-orange-700' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}>{s}</button>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress Remarks</label>
                           <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Condition, time of visit, etc..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-32 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-100" />
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Camera size={14} className="text-blue-500" /> Proof of Work (Photos)</label>
                           {isProcessingImages && <Loader2 size={14} className="animate-spin text-blue-500" />}
                        </div>
                        <div className="flex flex-wrap gap-3">
                           {previewUrls.map((url, i) => (
                             <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative group">
                                <img src={url} className="w-full h-full object-cover" />
                                <button onClick={() => setPreviewUrls(p => p.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><X size={20} /></button>
                             </div>
                           ))}
                           <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-200 transition-all">
                              <Camera size={24} />
                              <span className="text-[8px] font-black uppercase mt-1">Add Photo</span>
                           </button>
                        </div>
                        <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                     </div>
                     <button onClick={handleUpdateSubmit} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">Publish Site Update</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><PackageIcon size={16} className="text-blue-500" /> Equipment Dispatched</h4>
                          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-3">
                             {selectedSite.materials.map((m, i) => (
                                <div key={i} className="flex flex-col py-2.5 border-b border-slate-50 last:border-0">
                                   <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-slate-500 uppercase">{CATEGORY_LABELS[m.category]}: <span className="text-slate-900">{m.specification}</span></span>
                                      <span className="text-lg font-black text-slate-950">x{m.quantity}</span>
                                   </div>
                                   {m.serialNumbers && m.serialNumbers.length > 0 && (
                                     <div className="mt-1 flex flex-wrap gap-1">
                                        {m.serialNumbers.map((s, si) => (
                                          <span key={si} className="text-[8px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase">{s}</span>
                                        ))}
                                     </div>
                                   )}
                                </div>
                             ))}
                          </div>
                        </div>
                        {selectedSite.history.some(h => h.imageUrls?.length) && (
                          <button onClick={() => handleDownloadAllSiteZip(selectedSite)} className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl">
                             <FileArchive size={16} /> Download All Photos (ZIP)
                          </button>
                        )}
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Clock size={16} className="text-orange-500" /> Installation Timeline</h4>
                        <div className="space-y-8">
                           {selectedSite.history.slice().reverse().map((h, i) => (
                             <div key={h.id || i} className="relative pl-8 border-l-2 border-slate-200 pb-10 last:pb-0">
                                <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-4 border-blue-600 shadow-lg"></div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{h.date}</span>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getStatusColor(h.status)}`}>{h.status}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 font-bold leading-relaxed italic">"{h.remarks || 'No remarks provided.'}"</p>
                                  {h.imageUrls && h.imageUrls.length > 0 && (
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                       {h.imageUrls.map((img, idx) => (
                                         <div key={idx} onClick={() => setLightboxImage({ url: img, name: 'Site Photo' })} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform border border-slate-100">
                                            <img src={img} className="w-full h-full object-cover" />
                                         </div>
                                       ))}
                                    </div>
                                  )}
                                </div>
                             </div>
                           ))}
                        </div>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6" onClick={() => setLightboxImage(null)}>
           <button onClick={() => setLightboxImage(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white"><X size={24} /></button>
           <img src={lightboxImage.url} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
