
import React, { useState, useMemo, useEffect } from 'react';
import { InwardEntry, MaterialCategory, MaterialItem } from '../types';
import { CATEGORY_LABELS, MATERIAL_SPECS } from '../constants';
import { PlusCircle, Plus, Layers, Inbox, Factory, ShoppingCart, Hash, FileText, Minus, Edit3, XCircle, Trash2 } from 'lucide-react';

interface InwardFormProps {
  onAdd: (entry: InwardEntry) => void;
  onUpdate: (entry: InwardEntry) => void;
  onDelete: (id: string) => void;
  entries: InwardEntry[];
}

const InwardForm: React.FC<InwardFormProps> = ({ onAdd, onUpdate, onDelete, entries }) => {
  const [billHeader, setBillHeader] = useState({
    supplier: '',
    invoiceNo: '',
    remarks: ''
  });

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Flat map for quantities: "CATEGORY|SPEC": quantity
  const [manifest, setManifest] = useState<Record<string, number>>({});

  const updateManifestQty = (cat: MaterialCategory, spec: string, delta: number) => {
    const key = `${cat}|${spec}`;
    const current = manifest[key] || 0;
    const newVal = Math.max(0, current + delta);
    
    setManifest(prev => ({
      ...prev,
      [key]: newVal
    }));
  };

  const setManifestQtyDirect = (cat: MaterialCategory, spec: string, val: number) => {
    const key = `${cat}|${spec}`;
    const newVal = Math.max(0, val);
    
    setManifest(prev => ({
      ...prev,
      [key]: newVal
    }));
  };

  const materialsToInward = useMemo(() => {
    const items: MaterialItem[] = [];
    (Object.entries(manifest) as [string, number][]).forEach(([key, qty]) => {
      if (qty > 0) {
        const [category, specification] = key.split('|');
        items.push({ 
          category: category as MaterialCategory, 
          specification, 
          quantity: qty 
        });
      }
    });
    return items;
  }, [manifest]);

  const totalQty = useMemo(() => {
    return materialsToInward.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [materialsToInward]);

  const handleEditClick = (entry: InwardEntry) => {
    setEditingEntryId(entry.id);
    setBillHeader({
      supplier: entry.supplier,
      invoiceNo: entry.invoiceNo,
      remarks: entry.remarks
    });

    const newManifest: Record<string, number> = {};
    entry.materials.forEach(m => {
      newManifest[`${m.category}|${m.specification}`] = m.quantity;
    });
    setManifest(newManifest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingEntryId(null);
    setBillHeader({ supplier: '', invoiceNo: '', remarks: '' });
    setManifest({});
  };

  const handleSubmitBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (materialsToInward.length === 0) {
      alert("Please enter quantities for at least one material in the manifest below.");
      return;
    }

    if (editingEntryId) {
      const original = entries.find(e => e.id === editingEntryId);
      const updatedEntry: InwardEntry = {
        ...original!,
        ...billHeader,
        materials: materialsToInward
      };
      onUpdate(updatedEntry);
      setEditingEntryId(null);
    } else {
      const newEntry: InwardEntry = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        ...billHeader,
        materials: materialsToInward
      };
      onAdd(newEntry);
    }

    setBillHeader({ supplier: '', invoiceNo: '', remarks: '' });
    setManifest({});
  };

  // Specific ordering to place BOS besides MOTOR
  const orderedCategories: MaterialCategory[] = ['MOTOR', 'BOS', 'PANEL', 'CONTROLLER', 'STRUCTURE'];

  return (
    <div className="space-y-6 pb-24">
      <div className={`bg-white p-6 rounded-[2.5rem] border transition-all ${editingEntryId ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-200'} shadow-sm`}>
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase italic tracking-tighter">
            {editingEntryId ? <Edit3 className="text-blue-600" size={28} /> : <PlusCircle className="text-blue-600" size={28} />}
            {editingEntryId ? 'Edit Material Manifest' : 'Inward Material Manifest'}
          </h2>
          {editingEntryId && (
            <button 
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase hover:bg-red-100 transition-colors"
            >
              <XCircle size={16} /> Cancel Editing
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmitBill} className="space-y-10">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
               <FileText size={14} className="text-blue-500" /> 01. Invoice Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier Name</label>
                <div className="relative">
                  <Factory size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required type="text" className="w-full pl-10 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm" placeholder="e.g. Bharat Motors" value={billHeader.supplier} onChange={e => setBillHeader({...billHeader, supplier: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice / Challan No</label>
                <div className="relative">
                  <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required type="text" className="w-full pl-10 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-mono text-xs uppercase" placeholder="INV-XXXX" value={billHeader.invoiceNo} onChange={e => setBillHeader({...billHeader, invoiceNo: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrival Remarks</label>
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 text-sm font-medium" placeholder="Condition notes..." value={billHeader.remarks} onChange={e => setBillHeader({...billHeader, remarks: e.target.value})} />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
               <Layers size={14} className="text-orange-500" /> 02. Material Quantities (Motor & BOS Side-by-Side)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orderedCategories.map(cat => (
                <div key={cat} className={`bg-white border rounded-[2rem] p-5 shadow-sm transition-all ${cat === 'MOTOR' || cat === 'BOS' ? 'border-blue-200 ring-2 ring-blue-50/50' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-2 rounded-lg ${cat === 'MOTOR' || cat === 'BOS' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Plus size={14} />
                    </div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{CATEGORY_LABELS[cat]}</span>
                  </div>
                  
                  <div className="space-y-4">
                    {MATERIAL_SPECS[cat].map(spec => {
                      const qty = manifest[`${cat}|${spec}`] || 0;
                      return (
                        <div key={spec} className={`p-4 rounded-2xl border transition-all ${qty > 0 ? 'bg-blue-50/30 border-blue-200 shadow-sm' : 'bg-slate-50/30 border-slate-100'}`}>
                          <div className="text-[11px] font-bold text-slate-700 mb-2 uppercase tracking-tighter">{spec}</div>
                          <div className="flex items-center gap-2">
                             <button 
                                type="button"
                                disabled={qty <= 0}
                                onClick={() => updateManifestQty(cat, spec, -1)}
                                className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 disabled:opacity-30 transition-colors"
                             >
                               <Minus size={14} />
                             </button>
                             <input 
                               type="number" 
                               min="0"
                               value={qty === 0 ? '' : qty}
                               onChange={(e) => setManifestQtyDirect(cat, spec, parseInt(e.target.value) || 0)}
                               placeholder="0"
                               className="flex-1 text-center bg-white border border-slate-200 rounded-lg p-2 font-black text-sm outline-none focus:ring-2 focus:ring-blue-600"
                             />
                             <button 
                                type="button"
                                onClick={() => updateManifestQty(cat, spec, 1)}
                                className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-green-500 hover:border-green-100 transition-colors"
                             >
                               <Plus size={14} />
                             </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {materialsToInward.length > 0 && (
              <div className="bg-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-100 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={20} />
                    <h4 className="font-black uppercase tracking-widest text-sm">Arrival Summary</h4>
                  </div>
                  <div className="text-xs font-black bg-white/20 px-3 py-1 rounded-full">
                    Total Units: {totalQty}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {materialsToInward.map((m, idx) => (
                    <div key={idx} className="bg-white/10 p-3 rounded-2xl border border-white/10">
                      <div className="text-[8px] font-black text-blue-200 uppercase opacity-70 mb-0.5">{CATEGORY_LABELS[m.category]}</div>
                      <div className="text-[10px] font-bold truncate mb-1">{m.specification}</div>
                      <div className="text-xl font-black">x{m.quantity}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl transition-all ${
                materialsToInward.length === 0 
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
                  : editingEntryId 
                    ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 active:scale-[0.98]'
                    : 'bg-blue-700 text-white shadow-blue-200 hover:bg-blue-800 active:scale-[0.98]'
              }`}
            >
              {materialsToInward.length === 0 
                ? 'Fill Manifest to Proceed' 
                : editingEntryId 
                  ? `Update Inward Record (${totalQty} units)`
                  : `Register Full Invoice (${totalQty} units)`
              }
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Inbox size={18} className="text-slate-400" />
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Arrival Logs</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-5">Date / Invoice</th>
                <th className="px-6 py-5">Supplier</th>
                <th className="px-6 py-5">Materials Received</th>
                <th className="px-6 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map(e => (
                <tr key={e.id} className={`hover:bg-slate-50 transition-colors ${editingEntryId === e.id ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="text-slate-400 text-[10px] font-black uppercase mb-1">{e.date}</div>
                    <div className="font-mono text-[10px] font-black text-blue-600 tracking-tighter uppercase">{e.invoiceNo}</div>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-800 uppercase tracking-tight">{e.supplier}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {e.materials.map((m, idx) => (
                        <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600">
                          <span className="text-blue-600 font-black">{m.quantity}</span>
                          <span className="opacity-30">×</span>
                          <span className="uppercase tracking-tight">{m.specification}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(e)}
                        disabled={editingEntryId === e.id}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-30"
                        title="Edit Log"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this arrival record? This cannot be undone.')) {
                            onDelete(e.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Log"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No Recent Arrivals</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InwardForm;
