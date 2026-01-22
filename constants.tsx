
import React from 'react';
import { Package, Truck, LayoutDashboard, FileSpreadsheet, Users } from 'lucide-react';
import { SystemCapacity, MaterialCategory } from './types';

export const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  MOTOR: 'Motors',
  PANEL: 'Solar Panels',
  STRUCTURE: 'Structures',
  CONTROLLER: 'Controllers',
  BOS: 'BOS Sets'
};

export const MATERIAL_SPECS: Record<MaterialCategory, string[]> = {
  MOTOR: [
    '3 HP - 30 Mtr', '3 HP - 50 Mtr', '3 HP - 70 Mtr',
    '5 HP - 30 Mtr', '5 HP - 50 Mtr', '5 HP - 70 Mtr', '5 HP - 100 Mtr',
    '7.5 HP - 30 Mtr', '7.5 HP - 50 Mtr', '7.5 HP - 70 Mtr', '7.5 HP - 100 Mtr'
  ],
  PANEL: ['510 Wp', '520 Wp', '535 Wp'],
  STRUCTURE: ['6 MMS', '9 MMS', '13 MMS'],
  CONTROLLER: [
    '3HP Controller - 30 Mtr', '3HP Controller - 50 Mtr', '3HP Controller - 70 Mtr',
    '5HP Controller - 30 Mtr', '5HP Controller - 50 Mtr', '5HP Controller - 70 Mtr', '5HP Controller - 100 Mtr',
    '7.5HP Controller - 30 Mtr', '7.5HP Controller - 50 Mtr', '7.5HP Controller - 70 Mtr', '7.5HP Controller - 100 Mtr'
  ],
  BOS: [
    '3 HP BOS - 30 Mtr', '3 HP BOS - 50 Mtr', '3 HP BOS - 70 Mtr',
    '5 HP BOS - 30 Mtr', '5 HP BOS - 50 Mtr', '5 HP BOS - 70 Mtr', '5 HP BOS - 100 Mtr',
    '7.5 HP BOS - 30 Mtr', '7.5 HP BOS - 50 Mtr', '7.5 HP BOS - 70 Mtr', '7.5 HP BOS - 100 Mtr'
  ]
};

export const SYSTEM_PRESET_CONFIG = {
  '3 HP': {
    heads: ['30 Mtr', '50 Mtr', '70 Mtr'],
    panel: { spec: '510 Wp', qty: 6 },
    structure: '6 MMS',
  },
  '5 HP': {
    heads: ['30 Mtr', '50 Mtr', '70 Mtr', '100 Mtr'],
    panel: { spec: '535 Wp', qty: 9 },
    structure: '9 MMS',
  },
  '7.5 HP': {
    heads: ['30 Mtr', '50 Mtr', '70 Mtr', '100 Mtr'],
    panel: { spec: '520 Wp', qty: 13 },
    structure: '13 MMS',
  }
};

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'STORE_KEEPER'] },
  { id: 'inward', label: 'Arrival', icon: <Package size={20} />, roles: ['ADMIN', 'STORE_KEEPER'] },
  { id: 'dispatch', label: 'Dispatch', icon: <Truck size={20} />, roles: ['ADMIN', 'STORE_KEEPER'] },
  { id: 'team', label: 'Team', icon: <Users size={20} />, roles: ['ADMIN'] },
  { id: 'reports', label: 'Reports', icon: <FileSpreadsheet size={20} />, roles: ['ADMIN'] },
];

export const STORAGE_KEYS = {
  INWARD: 'inward_entries',
  DISPATCH: 'dispatch_entries',
  LAST_CHALLAN: 'last_challan_no',
  INSTALLERS: 'installer_users'
};
