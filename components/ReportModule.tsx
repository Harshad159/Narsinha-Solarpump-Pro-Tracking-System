
import React, { useState, useMemo } from 'react';
import { InwardEntry, DispatchEntry, Stock, InstallStatus, MaterialCategory } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { 
  FileSpreadsheet, 
  Download, 
  Filter, 
  Inbox, 
  FolderDown, 
  Loader2, 
  Package, 
  Truck, 
  History, 
  LayoutGrid, 
  FileText, 
  Share2, 
  Calendar, 
  X 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

interface ReportModuleProps {
  inward: InwardEntry[];
  dispatches: DispatchEntry[];
  stock: Stock;
}

const ReportModule: React.FC<ReportModuleProps> = ({ inward, dispatches, stock }) => {
  const [filterType, setFilterType] = useState('ALL');
  const [isZipping, setIsZipping] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const isInRange = (dateStr: string) => {
    if (!fromDate && !toDate) return true;
    const date = new Date(dateStr);
    const from = fromDate ? new Date(fromDate) : new Date('1970-01-01');
    const to = toDate ? new Date(toDate) : new Date('2099-12-31');
    to.setHours(23, 59, 59, 999);
    return date >= from && date <= to;
  };

  const filteredInward = useMemo(() => inward.filter(e => isInRange(e.date)), [inward, fromDate, toDate]);
  const filteredDispatchesByDate = useMemo(() => dispatches.filter(d => isInRange(d.date)), [dispatches, fromDate, toDate]);
  const filteredDispatches = useMemo(() => filteredDispatchesByDate.filter(d => filterType === 'ALL' || d.status === filterType), [filteredDispatchesByDate, filterType]);

  const exportStockToExcel = () => {
    const data = Object.entries(stock).flatMap(([category, specs]) => Object.entries(specs).map(([spec, qty]) => ({
      'Category': CATEGORY_LABELS[category as MaterialCategory],
      'Specification': spec,
      'Available Stock': qty,
      'Report Date': new Date().toLocaleString()
    })));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Current Stock");
    XLSX.writeFile(wb, `Live_Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportInwardData = () => {
    const data = filteredInward.flatMap(entry => entry.materials.map(m => ({
      'Date': entry.date, 'Supplier': entry.supplier, 'Invoice No': entry.invoiceNo, 'Material Category': CATEGORY_LABELS[m.category], 'Specification': m.specification, 'Quantity Received': m.quantity, 'Remarks': entry.remarks
    })));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inward History");
    XLSX.writeFile(wb, `Inward_Log_${fromDate || 'All'}_to_${toDate || 'Now'}.xlsx`);
  };

  const exportDispatchLog = () => {
    const data = filteredDispatchesByDate.flatMap(d => d.materials.map(m => ({
      'Dispatch Date': d.date, 'Beneficiary ID': d.beneficiaryId, 'Farmer Name': d.farmerName, 'Material Category': CATEGORY_LABELS[m.category], 'Specification': m.specification, 'Quantity Issued': m.quantity, 'Installer': d.installerName, 'Vehicle No': d.vehicleNo || 'N/A', 'Site Village': d.village, 'Site Taluka': d.taluka
    })));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispatch Log");
    XLSX.writeFile(wb, `Dispatch_Log_${fromDate || 'All'}_to_${toDate || 'Now'}.xlsx`);
  };

  const exportAllMediaZip = async () => {
    const sitesWithPhotos = dispatches.filter(d => d.history.some(h => h.imageUrls && h.imageUrls.length > 0 && isInRange(h.date)));
    if (sitesWithPhotos.length === 0) { alert("No installer photos found within the selected date range."); return; }
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const rangeLabel = fromDate && toDate ? `${fromDate}_to_${toDate}` : 'Full_Archive';
      const mainFolder = zip.folder(`NARSINHA_MEDIA_EXPORT_${rangeLabel}`);
      sitesWithPhotos.forEach(site => {
        const siteFolder = mainFolder?.folder(`${site.farmerName}_${site.beneficiaryId}`.replace(/\s+/g, '_'));
        site.history.forEach(h => {
          if (h.imageUrls && h.imageUrls.length > 0 && isInRange(h.date)) {
            const stageFolder = siteFolder?.folder(`${h.date}_${h.status.replace(/\s+/g, '_')}`);
            h.imageUrls.forEach((url, idx) => {
              const parts = url.split(';base64,');
              if (parts.length === 2) {
                const raw = window.atob(parts[1]);
                const uInt8Array = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; ++i) { uInt8Array[i] = raw.charCodeAt(i); }
                stageFolder?.file(`Photo_${idx + 1}.png`, new Blob([uInt8Array], { type: parts[0].split(':')[1] }));
              }
            });
          }
        });
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(content);
      link.download = `Narsinha_Media_${rangeLabel}.zip`;
      link.click();
    } catch (err) { alert("Failed to build ZIP archive."); } finally { setIsZipping(false); }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Operational Reports</h2>
          <p className="text-slate-500 font-bold text-sm tracking-tight uppercase">Export terminal data for documentation</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-4 duration-500">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
               <Calendar size={20} />
            </div>
            <div className="hidden sm:block">
               <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest leading-none">Date Range Filter</h4>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Affects summary & exports</p>
            </div>
         </div>
         <div className="flex-1 w-full grid grid-cols-2 gap-4">
            <input type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            <input type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={toDate} onChange={e => setToDate(e.target.value)} />
         </div>
         {(fromDate || toDate) && (
            <button onClick={() => {setFromDate(''); setToDate('');}} className="px-4 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-600 flex items-center gap-2">
               <X size={14} /> Clear
            </button>
         )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] pl-2 border-l-4 border-blue-600">Audit & Logistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center text-center group transition-all">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform"><Package size={28} /></div>
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-2">Live Stock</h4>
              <button onClick={exportStockToExcel} className="mt-auto w-full py-3 bg-green-50 text-green-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2">
                 <FileSpreadsheet size={14} /> Export
              </button>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center text-center group transition-all">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform"><Truck size={28} /></div>
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-2">Dispatch Log</h4>
              <button onClick={exportDispatchLog} className="mt-auto w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                 <FileText size={14} /> Export
              </button>
           </div>
           <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col items-center text-center group">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform"><FolderDown size={28} /></div>
              <h4 className="font-black text-white uppercase text-xs tracking-widest mb-2">Media Archive</h4>
              <button onClick={exportAllMediaZip} disabled={isZipping} className="mt-auto w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50">
                 {isZipping ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                 {isZipping ? 'Generating...' : 'Download ZIP'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModule;
