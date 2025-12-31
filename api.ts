
import { InwardEntry, DispatchEntry, InstallStatus } from './types';

const SIMULATE_DELAY = 300;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getInitialInwardData = (): InwardEntry[] => [
  {
    id: 'inw-001',
    date: '2024-03-01',
    supplier: 'Bharat Motors Ltd',
    invoiceNo: 'BML/23-24/452',
    remarks: 'Initial stock arrival',
    materials: [
      { category: 'MOTOR', specification: '3 HP - 50 Mtr', quantity: 30 },
      { category: 'MOTOR', specification: '5 HP - 70 Mtr', quantity: 20 },
      { category: 'CONTROLLER', specification: '3HP Controller', quantity: 30 },
      { category: 'CONTROLLER', specification: '5HP Controller', quantity: 20 }
    ]
  },
  {
    id: 'inw-002',
    date: '2024-03-05',
    supplier: 'Solar Shine Energy',
    invoiceNo: 'SSE-9901',
    remarks: 'Panels batch',
    materials: [
      { category: 'PANEL', specification: '510 Wp', quantity: 300 },
      { category: 'PANEL', specification: '520 Wp', quantity: 240 },
      { category: 'BOS', specification: '3 HP BOS - 50 Mtr', quantity: 100 }
    ]
  }
];

const getInitialDispatchData = (): DispatchEntry[] => {
  const baseSites = [
    { name: 'Ramesh Patil', id: 'BEN-MH-1024', village: 'Wavi', taluka: 'Sinnar', status: InstallStatus.COMPLETED },
    { name: 'Suresh Deshmukh', id: 'BEN-MH-1088', village: 'Panchale', taluka: 'Sinnar', status: InstallStatus.PANELS },
    { name: 'Anita Gaware', id: 'BEN-MH-2045', village: 'Musalgoan', taluka: 'Sinnar', status: InstallStatus.NOT_STARTED },
    { name: 'Vijay Shinde', id: 'BEN-MH-3091', village: 'Yeola', taluka: 'Yeola', status: InstallStatus.STRUCTURE },
    { name: 'Savita Kadam', id: 'BEN-MH-4022', village: 'Dindori', taluka: 'Dindori', status: InstallStatus.WIRING },
    { name: 'Ganesh More', id: 'BEN-MH-5001', village: 'Vinchur', taluka: 'Niphad', status: InstallStatus.NOT_STARTED },
    { name: 'Priya Thorat', id: 'BEN-MH-6112', village: 'Lasalgoan', taluka: 'Niphad', status: InstallStatus.MOTOR },
    { name: 'Amol Pawar', id: 'BEN-MH-7781', village: 'Manmad', taluka: 'Nandgaon', status: InstallStatus.COMPLETED },
    { name: 'Sunita Joshi', id: 'BEN-MH-8210', village: 'Chandwad', taluka: 'Chandwad', status: InstallStatus.STRUCTURE },
    { name: 'Deepak Kale', id: 'BEN-MH-9923', village: 'Igatpuri', taluka: 'Igatpuri', status: InstallStatus.NOT_STARTED }
  ];

  return baseSites.map((site, index) => ({
    id: `dsp-00${index + 1}`,
    challanNo: `DC-${1000 + index + 1}`,
    date: '2024-03-12',
    beneficiaryId: site.id,
    farmerName: site.name,
    installerName: index % 2 === 0 ? 'Rahul Shinde' : 'Amit Varma',
    zone: 'West',
    circle: 'Nashik',
    division: 'Nashik Division',
    subDivision: 'North',
    taluka: site.taluka,
    village: site.village,
    vehicleNo: `MH-15-X-${1000 + index}`,
    expectedDate: '2024-04-01',
    status: site.status,
    lastUpdateDate: '2024-03-20',
    materials: [
      { category: 'MOTOR', specification: '3 HP - 50 Mtr', quantity: 1 },
      { category: 'CONTROLLER', specification: '3HP Controller', quantity: 1 },
      { category: 'PANEL', specification: '510 Wp', quantity: 10 },
      { category: 'STRUCTURE', specification: '6 mm', quantity: 1 },
      { category: 'BOS', specification: '3 HP BOS - 50 Mtr', quantity: 1 }
    ],
    history: [
      { id: `hist-${index}-1`, date: '2024-03-12', status: InstallStatus.NOT_STARTED, remarks: 'Site allocated and material loaded.' },
      ...(site.status !== InstallStatus.NOT_STARTED ? [{ id: `hist-${index}-2`, date: '2024-03-15', status: InstallStatus.STRUCTURE, remarks: 'Structure work done.' }] : [])
    ]
  }));
};

export const API = {
  async fetchInwardEntries(): Promise<InwardEntry[]> {
    await delay(SIMULATE_DELAY);
    const data = localStorage.getItem('inward_entries');
    if (!data) {
      const initial = getInitialInwardData();
      localStorage.setItem('inward_entries', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },

  async saveInwardEntry(entry: InwardEntry): Promise<InwardEntry> {
    await delay(SIMULATE_DELAY);
    const existing = await this.fetchInwardEntries();
    const updated = [entry, ...existing];
    localStorage.setItem('inward_entries', JSON.stringify(updated));
    return entry;
  },

  async fetchDispatchEntries(): Promise<DispatchEntry[]> {
    await delay(SIMULATE_DELAY);
    const data = localStorage.getItem('dispatch_entries');
    if (!data) {
      const initial = getInitialDispatchData();
      localStorage.setItem('dispatch_entries', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },

  async saveDispatchEntry(entry: DispatchEntry): Promise<DispatchEntry> {
    await delay(SIMULATE_DELAY);
    const existing = await this.fetchDispatchEntries();
    const updated = [entry, ...existing];
    localStorage.setItem('dispatch_entries', JSON.stringify(updated));
    return entry;
  },

  async updateDispatchStatus(beneficiaryId: string, newStatus: InstallStatus, remarks: string, imageUrls?: string[]): Promise<DispatchEntry> {
    await delay(SIMULATE_DELAY);
    const entries = await this.fetchDispatchEntries();
    const today = new Date().toISOString().split('T')[0];
    let updatedEntry: DispatchEntry | null = null;
    const updatedList = entries.map(d => {
      if (d.beneficiaryId === beneficiaryId) {
        updatedEntry = {
          ...d,
          status: newStatus,
          lastUpdateDate: today,
          history: [...d.history, { id: Math.random().toString(36).substr(2, 9), date: today, status: newStatus, remarks, imageUrls }]
        };
        return updatedEntry;
      }
      return d;
    });
    if (!updatedEntry) throw new Error("Beneficiary not found");
    localStorage.setItem('dispatch_entries', JSON.stringify(updatedList));
    return updatedEntry;
  }
};
