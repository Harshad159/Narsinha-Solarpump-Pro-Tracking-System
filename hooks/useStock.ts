
import { useMemo } from 'react';
import { InwardEntry, DispatchEntry, Stock, MaterialCategory } from '../types';
import { MATERIAL_SPECS } from '../constants';

/**
 * HOOK: useStock
 * Calculates real-time inventory levels based on inward and outward logs.
 */

export const useStock = (inwardEntries: InwardEntry[], dispatchEntries: DispatchEntry[]): Stock => {
  return useMemo<Stock>(() => {
    const currentStock: Stock = {
      MOTOR: {}, PANEL: {}, STRUCTURE: {}, CONTROLLER: {}, BOS: {}
    };

    // Initialize with 0 from known MATERIAL_SPECS
    Object.entries(MATERIAL_SPECS).forEach(([cat, specs]) => {
      specs.forEach(spec => { 
        (currentStock as any)[cat][spec] = 0; 
      });
    });

    // Add Inwards
    inwardEntries.forEach(entry => {
      entry.materials.forEach(item => {
        if ((currentStock as any)[item.category]) {
          const catItems = (currentStock as any)[item.category];
          // Ensure the key exists to avoid NaN when adding
          if (catItems[item.specification] === undefined) {
            catItems[item.specification] = 0;
          }
          catItems[item.specification] += item.quantity;
        }
      });
    });

    // Subtract Dispatches
    dispatchEntries.forEach(dispatch => {
      dispatch.materials.forEach(item => {
        if ((currentStock as any)[item.category]) {
          const catItems = (currentStock as any)[item.category];
          // Ensure the key exists to avoid NaN when subtracting
          if (catItems[item.specification] === undefined) {
            catItems[item.specification] = 0;
          }
          catItems[item.specification] -= item.quantity;
        }
      });
    });

    return currentStock;
  }, [inwardEntries, dispatchEntries]);
};
