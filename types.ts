
export type SystemCapacity = '3 HP' | '5 HP' | '7.5 HP';

export enum UserRole {
  ADMIN = 'ADMIN',
  STORE_KEEPER = 'STORE_KEEPER',
  INSTALLER = 'INSTALLER'
}

export enum InstallStatus {
  NOT_STARTED = 'Not Started',
  STRUCTURE = 'Structure Installed',
  PANELS = 'Panels Installed',
  MOTOR = 'Motor Installed',
  WIRING = 'Wiring & Controller',
  COMPLETED = 'Completed'
}

export type MaterialCategory = 'MOTOR' | 'PANEL' | 'STRUCTURE' | 'CONTROLLER' | 'BOS';

export interface MaterialItem {
  category: MaterialCategory;
  specification: string;
  quantity: number;
  serialNumbers?: string[];
}

export interface InwardEntry {
  id: string; 
  date: string;
  supplier: string;
  invoiceNo: string;
  materials: MaterialItem[];
  remarks: string;
}

export interface HistoryItem {
  id: string;
  date: string; 
  status: InstallStatus; 
  remarks: string; 
  imageUrls?: string[];
}

export interface DispatchEntry {
  id: string; 
  challanNo: string;
  date: string;
  installerName: string;
  installerId?: string;
  installerMobile?: string;
  beneficiaryId: string; 
  farmerName: string;
  farmerMobile?: string;
  zone: string;
  circle: string;
  division: string;
  subDivision: string;
  taluka: string;
  village: string;
  materials: MaterialItem[];
  vehicleNo?: string;
  expectedDate: string;
  status: InstallStatus;
  lastUpdateDate: string;
  history: HistoryItem[];
}

export interface Stock {
  MOTOR: Record<string, number>;
  PANEL: Record<string, number>;
  STRUCTURE: Record<string, number>;
  CONTROLLER: Record<string, number>;
  BOS: Record<string, number>;
}

export interface InstallerUser {
  id: string;
  name: string;
  pin: string;
  mobile?: string;
  aadhaar?: string;
}
