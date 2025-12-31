
import React, { useState, useRef, useMemo } from 'react';
import { DispatchEntry, InstallStatus, UserRole } from '../types';
import { compressImage } from '../utils/mediaUtils';
import { MapPin, Camera, ChevronRight, CheckCircle, Clock, Package, X, Image as ImageIcon, Plus, Loader2, Search, History } from 'lucide-react';

interface InstallerModuleProps {
  dispatches: DispatchEntry[];
  onUpdate: (beneficiaryId: string, status: InstallStatus, remarks: string, imageUrls?: string[]) => void;
  userRole: UserRole;
}

/**
 * COMPONENT: InstallerModule
 * Field interface for engineers to update site status and upload photos.
 */

const InstallerModule: React.FC<InstallerModuleProps> = ({ dispatches, onUpdate }) => {
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | null>(null);
  const [statusUpdate, setStatusUpdate] = useState(InstallStatus.NOT_STARTED);
  const [remarks, setRemarks] = useState('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSite = useMemo(() => 
    dispatches.find(d => d.beneficiaryId === selectedBeneficiaryId),
    [dispatches, selectedBeneficiaryId]
  );

  const filteredSites = useMemo(() => {
    return dispatches.filter(site => 
      site.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.beneficiaryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.village.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dispatches, searchTerm]);

  const handleOpenUpdate = (site: DispatchEntry) => {
    setSelectedBeneficiaryId(site.beneficiaryId);
    setStatusUpdate(site.status);
    setRemarks('');
    setPreviewUrls([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    
    setIsProcessingImages(true);
    try {
      const readFiles = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      
      const rawResults = await Promise.all(readFiles);
      const compressedResults = await Promise.all(rawResults.map(res => compressImage(res)));
      
      setPreviewUrls(prev => [...prev, ...compressedResults]);
    } catch (err) {
      console.error("Image processing failed:", err);
      alert("Failed to process images.");
    } finally {
      setIsProcessingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveUpdate = async () => {
    if (!selectedBeneficiaryId) return;
    
    setIsSaving(true);
    try {
      await onUpdate(
        selectedBeneficiaryId, 
        statusUpdate, 
        remarks, 
        previewUrls.length > 0 ? previewUrls : undefined
      );
      setRemarks('');
      setPreviewUrls([]);
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: InstallStatus) => {
    switch (status) {
      case InstallStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case InstallStatus.NOT_STARTED: return 'bg-slate-100 text-slate-600';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic leading-none">Field Terminal</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Real-time Site Status Management</p>
      </div>

      {!selectedBeneficiaryId || !activeSite ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="relative">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search Site..." 
               className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>

          <div className="space-y-3">
            {filteredSites.map(site => (
              <div 
                key={site.id} 
                onClick={() => handleOpenUpdate(site)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 flex items-center justify-between cursor-pointer transition-all hover:border-blue-400 group"
              >
                <div className="flex gap-4 items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${getStatusColor(site.status)}`}>
                     {site.status === InstallStatus.COMPLETED ? <CheckCircle size={24} /> : <MapPin size={24} />}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{site.farmerName}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      <MapPin size={10} className="text-blue-500" /> {site.village}
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-right duration-300 max-w-5xl mx-auto flex flex-col lg:flex-row min-h-[600px]">
          <div className="lg:w-1/2 flex flex-col border-r border-slate-100">
            <div className="p-8 bg-slate-950 text-white">
               <button onClick={() => setSelectedBeneficiaryId(null)} className="mb-6 text-slate-500 font-black text-[10px] uppercase flex items-center gap-1 hover:text-white transition-colors">
                 ← Back to Site List
               </button>
               <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-2">{activeSite.farmerName}</h3>
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-widest">
                   <MapPin size={14} className="text-blue-500" />
                   {activeSite.village}
                 </div>
                 <span className="text-[10px] font-mono text-blue-400 font-black bg-blue-500/10 px-2 py-0.5 rounded-lg">{activeSite.beneficiaryId}</span>
               </div>
            </div>
            
            <div className="p-8 space-y-8 flex-1 overflow-y-auto bg-white">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock size={14} className="text-green-500" />
                  Installation Phase
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(InstallStatus).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusUpdate(status)}
                      className={`px-4 py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase text-center flex items-center justify-center leading-tight shadow-sm ${
                        statusUpdate === status 
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100' 
                          : 'border-slate-50 text-slate-400 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Activity Remarks</label>
                <textarea 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Describe today's progress..."
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl h-32 outline-none focus:ring-4 focus:ring-blue-100 text-sm font-bold resize-none"
                />
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                       <ImageIcon size={14} className="text-blue-500" /> 
                       Upload Photos
                    </label>
                 </div>
                 <div className="grid grid-cols-4 gap-3">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md group">
                         <img src={url} className="w-full h-full object-cover" />
                         <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1.5 bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X size={12} /></button>
                      </div>
                    ))}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingImages || isSaving}
                      className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                    >
                      {isProcessingImages ? <Loader2 size={24} className="animate-spin text-blue-500" /> : (
                        <>
                          <Camera size={24} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-black uppercase mt-1">Add Photo</span>
                        </>
                      )}
                    </button>
                 </div>
                 <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              </div>

              <button 
                onClick={handleSaveUpdate}
                disabled={isSaving || isProcessingImages}
                className={`w-full font-black py-6 rounded-3xl shadow-xl uppercase tracking-[0.2em] text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${
                  isSaving 
                    ? 'bg-slate-100 text-slate-300' 
                    : 'bg-blue-700 text-white shadow-blue-100 hover:bg-blue-800'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Committing...
                  </>
                ) : 'Submit Phase Update'}
              </button>
            </div>
          </div>

          <div className="lg:w-1/2 bg-slate-50/50 flex flex-col h-full border-l border-slate-100">
            <div className="p-8 border-b border-slate-200 bg-white flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                    <History size={20} />
                 </div>
                 <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Site Timeline</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Field Log History</p>
                 </div>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
               {activeSite.history.slice().reverse().map((h, i) => (
                 <div key={h.id || i} className="relative pl-8 border-l-2 border-blue-200 pb-10 last:pb-0">
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
                             <div key={idx} onClick={() => setLightboxUrl(img)} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform border border-slate-100">
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

      {lightboxUrl && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6" onClick={() => setLightboxUrl(null)}>
           <button className="absolute top-6 right-6 p-3 bg-white/10 rounded-2xl text-white"><X size={24} /></button>
           <img src={lightboxUrl} className="max-w-full max-h-full object-contain rounded-2xl" />
        </div>
      )}
    </div>
  );
};

export default InstallerModule;
