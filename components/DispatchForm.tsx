
import React, { useState, useMemo, useEffect } from 'react';
import { DispatchEntry, Stock, InstallStatus, MaterialCategory, MaterialItem, SystemCapacity, InstallerUser } from '../types';
import { CATEGORY_LABELS, MATERIAL_SPECS, SYSTEM_PRESET_CONFIG } from '../constants';
import { downloadChallanAsImage } from '../utils/challanGenerator';
import { Truck, Plus, User, MapPin, Calendar as CalendarIcon, Globe, Zap, Layers, Trash2, AlertCircle, ShoppingCart, X, Hash, ClipboardList, Phone, UserCheck, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface DispatchFormProps {
  onAdd: (entry: DispatchEntry) => Promise<DispatchEntry | null>;
  dispatches: DispatchEntry[];
  stock: Stock;
  installers: InstallerUser[];
}

const DispatchForm: React.FC<DispatchFormProps> = ({ onAdd, dispatches, stock, installers }) => {
  const [siteData, setSiteData] = useState({
    installerName: '', installerId: '', installerMobile: '', beneficiaryId: '', farmerName: '', farmerMobile: '', woNo: '',
    zone: '', circle: '', division: '', subDivision: '', taluka: '', village: '', 
    expectedDate: '', vehicleNo: ''
  });
  
  const [itemForm, setItemForm] = useState<{category: MaterialCategory; specification: string; quantity: number; serials: string[]}>({
    category: 'MOTOR', specification: '3 HP - 30 Mtr', quantity: 1, serials: ['']
  });

  const [searchBeneficiary, setSearchBeneficiary] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d =>
      d.farmerName.toLowerCase().includes(searchBeneficiary.toLowerCase()) ||
      d.beneficiaryId.toLowerCase().includes(searchBeneficiary.toLowerCase())
    );
  }, [dispatches, searchBeneficiary]);

  const totalPages = Math.ceil(filteredDispatches.length / ITEMS_PER_PAGE);
  const paginatedDispatches = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDispatches.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDispatches, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchBeneficiary]);

  const [materialsToDispatch, setMaterialsToDispatch] = useState<MaterialItem[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const isTracked = (cat: MaterialCategory) => ['MOTOR', 'PANEL', 'CONTROLLER'].includes(cat);

  const handleCategoryChange = (cat: MaterialCategory) => {
    setItemForm({ 
      ...itemForm, 
      category: cat, 
      specification: MATERIAL_SPECS[cat][0],
      serials: isTracked(cat) ? Array(itemForm.quantity).fill('') : []
    });
  };

  const handleQuantityChange = (qty: number) => {
    setItemForm({ 
      ...itemForm, 
      quantity: qty,
      serials: isTracked(itemForm.category) ? Array(qty).fill('') : []
    });
  };

  const updateManifestSerial = (itemIndex: number, serialIndex: number, val: string) => {
    const newList = [...materialsToDispatch];
    const item = newList[itemIndex];
    if (item.serialNumbers) {
      item.serialNumbers[serialIndex] = val.toUpperCase();
      setMaterialsToDispatch(newList);
    }
  };

  const getAvailableStock = (cat: MaterialCategory, spec: string) => (stock as any)[cat]?.[spec] || 0;

  const addItemToList = (form: typeof itemForm) => {
    if (form.quantity <= 0) return;
    
    const item: MaterialItem = {
      category: form.category,
      specification: form.specification,
      quantity: form.quantity,
      serialNumbers: isTracked(form.category) ? Array(form.quantity).fill('') : undefined
    };

    setMaterialsToDispatch(prev => [...prev, item]);
    
    setItemForm({
      category: 'MOTOR',
      specification: '3 HP - 30 Mtr',
      quantity: 1,
      serials: ['']
    });
  };

  const removeItem = (index: number) => {
    setMaterialsToDispatch(prev => prev.filter((_, i) => i !== index));
  };

  const applyDetailedPreset = (hp: SystemCapacity, head: string) => {
    const config = (SYSTEM_PRESET_CONFIG as any)[hp];
    const motorSpec = `${hp} - ${head}`;
    const controllerSpec = `${hp} Controller - ${head}`;
    const bosSpec = `${hp} BOS - ${head}`;
    
    const presetItems: MaterialItem[] = [
      { category: 'MOTOR', specification: motorSpec, quantity: 1, serialNumbers: [''] },
      { category: 'PANEL', specification: config.panel.spec, quantity: config.panel.qty, serialNumbers: Array(config.panel.qty).fill('') },
      { category: 'STRUCTURE', specification: config.structure, quantity: 1 },
      { category: 'CONTROLLER', specification: controllerSpec, quantity: 1, serialNumbers: [''] },
      { category: 'BOS', specification: bosSpec, quantity: 1 },
    ];
    
    setMaterialsToDispatch(prev => [...prev, ...presetItems]);
  };

  const handleInstallerSelect = (installerId: string) => {
    const selected = installers.find(i => i.id === installerId);
    if (selected) {
      setSiteData({
        ...siteData,
        installerName: selected.name,
        installerId: selected.id,
        installerMobile: selected.mobile || ''
      });
    } else {
      setSiteData({
        ...siteData,
        installerName: '',
        installerId: '',
        installerMobile: ''
      });
    }
  };

  const hasStockErrors = useMemo(() => 
    materialsToDispatch.some(item => item.quantity > getAvailableStock(item.category, item.specification)), 
  [materialsToDispatch, stock]);

  const hasSerialErrors = useMemo(() => 
    materialsToDispatch.some(item => 
      isTracked(item.category) && item.serialNumbers?.some(s => !s.trim())
    ), 
  [materialsToDispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (materialsToDispatch.length === 0 || hasStockErrors || hasSerialErrors) return;
    
    const newEntry: DispatchEntry = {
      id: Math.random().toString(36).substr(2, 9),
      challanNo: 'PENDING',
      date: today,
      ...siteData,
      materials: materialsToDispatch,
      status: InstallStatus.NOT_STARTED,
      lastUpdateDate: today,
      history: [{ 
        id: Math.random().toString(36).substr(2, 9), 
        date: today, 
        status: InstallStatus.NOT_STARTED, 
        remarks: `Initial material allocation.` 
      }]
    };

    const result = await onAdd(newEntry);
    if (result) {
      setSiteData({ 
        installerName: '', installerId: '', installerMobile: '', beneficiaryId: '', farmerName: '', farmerMobile: '', woNo: '',
        zone: '', circle: '', division: '', subDivision: '', taluka: '', village: '', 
        expectedDate: '', vehicleNo: '' 
      });
      setMaterialsToDispatch([]);
      setTimeout(() => downloadChallanAsImage(result), 500);
    }
  };

  const locationHierarchy = [
    { label: 'Zone', key: 'zone' },
    { label: 'Circle', key: 'circle' },
    { label: 'Division', key: 'division' },
    { label: 'Subdivision', key: 'subDivision' },
    { label: 'Taluka', key: 'taluka' },
    { label: 'Village', key: 'village' }
  ];

  return (
    <div className="space-y-12 pb-32">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight italic">
          <Truck className="text-orange-500" size={28} /> Dispatch Terminal
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><User size={14} className="text-blue-500" /> 01. Site & Technician</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficiary ID</label>
                  <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 font-mono text-xs uppercase" placeholder="BEN-XXXX" value={siteData.beneficiaryId} onChange={e => setSiteData({...siteData, beneficiaryId: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">W.O.No/SAP PO No.</label>
                  <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 font-mono text-xs uppercase" placeholder="WO-XXXX" value={siteData.woNo} onChange={e => setSiteData({...siteData, woNo: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Farmer Name</label>
                  <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 font-bold text-sm" placeholder="Full Name" value={siteData.farmerName} onChange={e => setSiteData({...siteData, farmerName: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Phone size={10} className="text-green-500" /> Farmer Mobile</label>
                  <input required type="tel" maxLength={10} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 font-bold text-sm" placeholder="10-digit number" value={siteData.farmerMobile} onChange={e => setSiteData({...siteData, farmerMobile: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Installer</span>
                    {siteData.installerMobile && (
                      <span className="text-[8px] text-green-600 font-black animate-in fade-in slide-in-from-right-2">
                        +91 {siteData.installerMobile}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <UserCheck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select 
                      required 
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 font-bold text-sm appearance-none"
                      value={siteData.installerId}
                      onChange={e => handleInstallerSelect(e.target.value)}
                    >
                      <option value="">Select Technician</option>
                      {installers.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.name} ({inst.id})</option>
                      ))}
                    </select>
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><Globe size={14} className="text-orange-500" /> 02. Site Location Hierarchy</h3>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {locationHierarchy.map((loc) => (
                  <div key={loc.key} className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate">{loc.label}</label>
                    <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 text-[11px] font-bold uppercase" placeholder={loc.label} value={(siteData as any)[loc.key]} onChange={e => setSiteData({...siteData, [loc.key]: e.target.value})} />
                  </div>
                ))}
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><CalendarIcon size={14} className="text-slate-500" /> 03. Logistics Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Date</label>
                  <input required type="date" min={today} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 font-bold text-sm" value={siteData.expectedDate} onChange={e => setSiteData({...siteData, expectedDate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle No</label>
                  <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 text-sm font-bold uppercase" placeholder="MH-XX-XX-XXXX" value={siteData.vehicleNo} onChange={e => setSiteData({...siteData, vehicleNo: e.target.value})} />
                </div>
             </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><Zap size={16} className="text-blue-500" /> 04. Quick Presets (Auto-Populate)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(SYSTEM_PRESET_CONFIG) as SystemCapacity[]).map(hp => (
                <div key={hp} className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4"><Layers size={14} className="text-blue-600" /><span className="text-xs font-black text-slate-800 uppercase italic tracking-widest">{hp} System</span></div>
                  <div className="flex flex-wrap gap-2">{(SYSTEM_PRESET_CONFIG as any)[hp].heads.map((head: string) => (
                    <button key={head} type="button" onClick={() => applyDetailedPreset(hp, head)} className="flex-1 min-w-[70px] py-3 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">{head}</button>
                  ))}</div>
                </div>
              ))}
            </div>

            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 mt-12"><Plus size={16} className="text-green-500" /> 05. Manual Material Entry</h3>
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                <select className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 text-xs font-bold" value={itemForm.category} onChange={e => handleCategoryChange(e.target.value as MaterialCategory)}>{(Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map(cat => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}</select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Specification</label>
                <select className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 text-xs font-bold" value={itemForm.specification} onChange={e => setItemForm({...itemForm, specification: e.target.value})}>{MATERIAL_SPECS[itemForm.category].map(spec => <option key={spec} value={spec}>{spec}</option>)}</select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty</label>
                <input type="number" min="1" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 text-sm font-black" value={itemForm.quantity} onChange={e => handleQuantityChange(parseInt(e.target.value) || 0)} />
              </div>
              <button type="button" onClick={() => addItemToList(itemForm)} className="md:col-span-4 w-full bg-slate-900 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-[0.99]">Add Item To Manifest</button>
            </div>

            {materialsToDispatch.length > 0 && (
              <div className="mt-12 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center px-2">
                   <div className="flex items-center gap-2">
                     <ShoppingCart size={18} className="text-orange-600" />
                     <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Current Load Manifest (Motor & BOS Paired)</h4>
                   </div>
                   <button type="button" onClick={() => setMaterialsToDispatch([])} className="text-[10px] font-black text-red-500 uppercase hover:text-red-700 flex items-center gap-1"><X size={14} /> Reset Load</button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {materialsToDispatch.map((item, idx) => {
                    const avail = getAvailableStock(item.category, item.specification);
                    const isShort = item.quantity > avail;
                    const needsSr = isTracked(item.category);
                    
                    return (
                      <div key={idx} className={`bg-white border rounded-3xl p-6 shadow-sm transition-all ${isShort ? 'border-red-200 bg-red-50/20' : 'border-slate-200'} ${item.category === 'MOTOR' || item.category === 'BOS' ? 'ring-2 ring-blue-50' : ''}`}>
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                  {item.category === 'MOTOR' && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                                  {CATEGORY_LABELS[item.category]}
                               </div>
                               <div className="text-sm font-black text-slate-900 leading-none">{item.specification}</div>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="text-right">
                                  <div className="text-xl font-black text-slate-950 leading-none">x{item.quantity}</div>
                                  <div className={`text-[8px] font-black uppercase mt-1 ${isShort ? 'text-red-600' : 'text-slate-400'}`}>Stock: {avail}</div>
                               </div>
                               <button type="button" onClick={() => removeItem(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                            </div>
                         </div>

                         {needsSr && (
                           <div className="pt-4 border-t border-slate-100">
                              <div className="flex items-center gap-2 mb-3">
                                 <Hash size={12} className="text-blue-500" />
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SR Numbers Required</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                 {item.serialNumbers?.map((sr, si) => (
                                   <div key={si} className="relative">
                                      <input 
                                        type="text" 
                                        placeholder={`Unit ${si+1} SR`} 
                                        className={`w-full p-2.5 bg-slate-50 border rounded-xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${!sr.trim() ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100'}`}
                                        value={sr}
                                        onChange={(e) => updateManifestSerial(idx, si, e.target.value)}
                                      />
                                   </div>
                                 ))}
                              </div>
                           </div>
                         )}
                      </div>
                    );
                  })}
                </div>

                {hasStockErrors && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 animate-pulse">
                    <AlertCircle className="text-red-600 shrink-0" size={20} />
                    <div>
                      <h5 className="text-[10px] font-black text-red-900 uppercase tracking-widest">Inventory Shortage</h5>
                      <p className="text-[11px] text-red-700 font-bold leading-tight">Stock insufficient for one or more items. Load cannot be issued.</p>
                    </div>
                  </div>
                )}
                {hasSerialErrors && (
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-3">
                    <Hash className="text-orange-600 shrink-0" size={20} />
                    <div>
                      <h5 className="text-[10px] font-black text-orange-900 uppercase tracking-widest">Tracking Info Missing</h5>
                      <p className="text-[11px] text-orange-700 font-bold leading-tight">Please enter Serial Numbers for all Motors, Controllers, and Panels.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={materialsToDispatch.length === 0 || hasStockErrors || hasSerialErrors} 
            className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl transition-all active:scale-[0.98] ${
              materialsToDispatch.length === 0 || hasStockErrors || hasSerialErrors
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100'
            }`}
          >
            {materialsToDispatch.length === 0 
              ? 'Manifest Empty' 
              : hasStockErrors 
                ? 'Check Inventory Levels' 
                : hasSerialErrors
                  ? 'Enter Serial Numbers'
                  : 'Finalize & Issue Dispatch'
            }
          </button>
        </form>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                <ClipboardList size={20} />
             </div>
             <div>
               <h3 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em]">Outward Shipments</h3>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">All dispatch records with search</p>
             </div>
           </div>
        </div>

        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by farmer name or beneficiary ID..."
              value={searchBeneficiary}
              onChange={(e) => setSearchBeneficiary(e.target.value)}
              className="flex-1 bg-transparent outline-none font-bold text-sm text-slate-800 placeholder-slate-400"
            />
            {searchBeneficiary && (
              <button
                onClick={() => setSearchBeneficiary('')}
                className="p-1 text-slate-400 hover:text-red-600"
              >
                <X size={18} />
              </button>
            )}
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {filteredDispatches.length} result{filteredDispatches.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
               <tr>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date / Challan</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Consignee (Farmer)</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Vehicle / Site</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Dispatch Summary</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {paginatedDispatches.map(d => (
                 <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                       <div className="text-[10px] font-black text-slate-400 uppercase mb-0.5">{d.date}</div>
                       <div className="text-blue-600 font-black font-mono text-xs uppercase">{d.challanNo}</div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="font-black text-slate-900 text-sm uppercase">{d.farmerName}</div>
                       <div className="text-[10px] font-bold text-slate-400 tracking-tighter flex items-center gap-2">
                          {d.beneficiaryId} 
                          {d.farmerMobile && <span className="text-green-600 font-bold">| {d.farmerMobile}</span>}
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="text-[10px] font-black text-slate-600 uppercase mb-0.5">{d.vehicleNo || 'Self Pick'}</div>
                       <div className="text-[9px] font-bold text-slate-400 uppercase">{d.village}, {d.taluka}</div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex flex-wrap gap-1.5">
                          {d.materials.map((m, i) => (
                            <div key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black text-slate-600 uppercase border border-slate-200">
                               {m.quantity}× {m.category}
                            </div>
                          ))}
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                         onClick={() => downloadChallanAsImage(d)}
                         className="p-2.5 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white rounded-xl transition-all border border-orange-100 inline-flex items-center gap-1.5 text-[10px] font-black uppercase"
                         title="Download Delivery Challan"
                       >
                         <Download size={14} />
                         <span className="hidden sm:inline">DC</span>
                       </button>
                    </td>
                 </tr>
               ))}
               {filteredDispatches.length === 0 && (
                 <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-slate-300 font-black uppercase text-xs tracking-[0.2em]">No Dispatch Records Found</td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-slate-50 p-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-all"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <div className="text-sm font-bold text-slate-600">
              Page <span className="text-orange-600 font-black">{currentPage}</span> of <span className="text-orange-600 font-black">{totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-bold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 transition-all"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatchForm;
