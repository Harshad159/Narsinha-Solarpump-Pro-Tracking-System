
import { DispatchEntry, MaterialCategory } from '../types';

/**
 * CHALLAN GENERATION SERVICE
 * Generates the industrial Delivery Challan HTML and renders it to an image.
 */

const FORMAL_CAT_LABELS: Record<string, string> = {
  MOTOR: 'MOTORS',
  PANEL: 'SOLAR PANELS',
  STRUCTURE: 'STRUCTURES',
  CONTROLLER: 'CONTROLLERS',
  BOS: 'BOS SETS'
};

const generateSingleChallanComponent = (entry: DispatchEntry, copyLabel: string) => {
  const totalQty = entry.materials.reduce((sum, m) => sum + m.quantity, 0);
  const installerDisplay = entry.installerId 
    ? `${entry.installerName} (${entry.installerId})` 
    : entry.installerName;

  return `
    <div style="width: 210mm; padding: 10mm; box-sizing: border-box; font-family: 'Arial', sans-serif; background: #fff; color: #000; position: relative; border: 2px solid #000; display: flex; flex-direction: column;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <tr>
          <td style="vertical-align: top;">
            <div style="font-size: 28pt; font-weight: 900; text-transform: uppercase; line-height: 0.9; color: #000; letter-spacing: -1px;">NARSINHA</div>
            <div style="font-size: 14pt; font-weight: 900; color: #1e40af; margin-bottom: 6px; letter-spacing: 0.5px;">ENGINEERING WORKS</div>
            <div style="font-size: 8pt; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 3px;">SOLAR PUMP MANUFACTURER & INSTALLER</div>
            <div style="font-size: 7pt; color: #94a3b8; font-weight: 500;">E-35, MIDC Area, Nanded-431603</div>
          </td>
          <td style="text-align: right; vertical-align: top; width: 40%;">
            <div style="background: #000; color: #fff; padding: 8px 6px; text-align: center; font-size: 11pt; font-weight: 900; text-transform: uppercase; margin-bottom: 10px;">DELIVERY CHALLAN</div>
            <div style="font-size: 10pt; font-weight: bold; margin-bottom: 3px;">DC No: <span style="color: #2563eb;">${entry.challanNo}</span></div>
            <div style="font-size: 10pt; font-weight: bold;">Date: ${entry.date}</div>
            <div style="font-size: 8pt; font-weight: 900; color: #64748b; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px;">${copyLabel}</div>
          </td>
        </tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td style="width: 55%; border: 2px solid #000; padding: 8px; vertical-align: top;">
            <div style="font-size: 7pt; font-weight: 900; color: #64748b; margin-bottom: 5px;">FARMER / CONSIGNEE</div>
            <div style="font-size: 12pt; font-weight: 900; text-transform: uppercase; margin-bottom: 3px;">${entry.farmerName}</div>
            <div style="font-size: 10pt; font-weight: 900; color: #2563eb; margin-bottom: 5px;">ID: ${entry.beneficiaryId}</div>
            ${entry.farmerMobile ? `<div style="font-size: 9pt; font-weight: bold; color: #059669; margin-bottom: 5px;">MOB: ${entry.farmerMobile}</div>` : ''}
            <div style="font-size: 8pt; font-weight: bold; text-transform: uppercase; line-height: 1.3;">
              ${entry.village}, ${entry.taluka},<br/>
              ${entry.subDivision}, ${entry.division},<br/>
              ${entry.circle}, ${entry.zone} ZONE
            </div>
          </td>
          <td style="width: 2%;"></td>
          <td style="width: 43%; border: 2px solid #000; padding: 8px; vertical-align: top; background: #fafafa;">
            <div style="font-size: 7pt; font-weight: 900; color: #64748b; margin-bottom: 5px;">LOGISTICS DETAILS</div>
            <div style="font-size: 9pt; margin-bottom: 4px;"><b>Installer:</b> ${installerDisplay}</div>
            ${entry.installerMobile ? `<div style="font-size: 8pt; color: #475569; font-weight: bold; margin-bottom: 4px;">MOB: ${entry.installerMobile}</div>` : ''}
            <div style="font-size: 9pt; margin-bottom: 4px;"><b>Vehicle:</b> ${entry.vehicleNo || 'N/A'}</div>
            <div style="font-size: 9pt; margin-bottom: 4px;"><b>Sub-Div:</b> ${entry.subDivision}</div>
            <div style="font-size: 9pt;"><b>Target:</b> ${entry.expectedDate}</div>
          </td>
        </tr>
      </table>
      <table style="width: 100%; border: 2px solid #000; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr style="background: #000; color: #fff;"><th style="padding: 7px; text-align: left; font-size: 9pt; border-right: 1.5px solid #333; width: 10%;">SR.</th><th style="padding: 7px; text-align: left; font-size: 9pt; border-right: 1.5px solid #333; width: 70%;">DESCRIPTION OF GOODS</th><th style="padding: 7px; text-align: right; font-size: 9pt; width: 20%;">QTY</th></tr>
        </thead>
        <tbody>
          ${entry.materials.map((m, i) => `
            <tr style="border-bottom: 1.5px solid #000;">
              <td style="padding: 8px 5px; font-size: 9pt; border-right: 1.5px solid #000; text-align: center; font-weight: bold;">${i + 1}</td>
              <td style="padding: 8px 6px; font-size: 10pt; font-weight: bold; border-right: 1.5px solid #000; text-transform: uppercase; vertical-align: top;">
                <div style="color: #64748b; font-size: 7pt; font-weight: 900; margin-bottom: 3px;">${FORMAL_CAT_LABELS[m.category] || m.category} :</div> 
                <div style="margin-bottom: 5px;">${m.specification}</div>
                ${m.serialNumbers && m.serialNumbers.length > 0 && m.serialNumbers.some(s => s.trim()) ? `
                  <div style="font-family: 'Courier New', monospace; font-size: 7pt; color: #1e3a8a; background: #eff6ff; padding: 3px 4px; border: 1px solid #bfdbfe; font-weight: bold; line-height: 1.3; margin-top: 3px;">
                    SR: ${m.serialNumbers.filter(s => s.trim()).join(', ')}
                  </div>
                ` : `
                  <div style="margin-top: 8px; padding: 12px 4px; border: 1px dashed #cbd5e1; background: #f8fafc; min-height: ${m.category === 'PANEL' ? '40px' : '25px'};">
                    <div style="font-size: 7pt; color: #94a3b8; font-style: italic;">SR: ___________________________</div>
                  </div>
                `}
              </td>
              <td style="padding: 8px 6px; font-size: 11pt; font-weight: 900; text-align: right; color: #000; vertical-align: top;">${m.quantity}</td>
            </tr>
          `).join('')}
          <tr style="background: #f8fafc; border-top: 2px solid #000;"><td colspan="2" style="padding: 10px 8px; text-align: right; font-weight: 900; font-size: 10pt; border-right: 1.5px solid #000; text-transform: uppercase;">TOTAL QUANTITY</td><td style="padding: 10px 8px; text-align: right; font-weight: 900; font-size: 11pt;">${totalQty} NOS</td></tr>
        </tbody>
      </table>
      <div style="margin-top: auto; padding-top: 15px;">
        <div style="text-align: right; margin-bottom: 40px;"><div style="font-size: 8pt; font-weight: 900; text-transform: uppercase;">FOR NARSINHA ENGINEERING WORKS</div></div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="width: 31%; text-align: center;"><div style="border-top: 1.5px solid #000; padding-top: 5px; font-size: 8pt; font-weight: 900;">RECEIVER'S SIGN</div></td><td style="width: 3.5%;"></td><td style="width: 31%; text-align: center;"><div style="border-top: 1.5px solid #000; padding-top: 5px; font-size: 8pt; font-weight: 900;">INSTALLER'S SIGN</div></td><td style="width: 3.5%;"></td><td style="width: 31%; text-align: center;"><div style="border-top: 1.5px solid #000; padding-top: 5px; font-size: 8pt; font-weight: 900;">AUTH. SIGNATORY</div></td></tr>
        </table>
      </div>
    </div>
  `;
};

export const downloadChallanAsImage = async (entry: DispatchEntry) => {
  const container = document.getElementById('image-source');
  if (!container) return;

  const copies = [
    { label: 'OFFICE RECORD COPY', filename: `${entry.beneficiaryId}_OFFICE.png` },
    { label: 'TRANSPORTER COPY', filename: `${entry.beneficiaryId}_TRANSPORTER.png` }
  ];

  try {
    const html2canvas = (window as any).html2canvas;
    if (!html2canvas) throw new Error("html2canvas library missing");

    for (const copy of copies) {
      const html = generateSingleChallanComponent(entry, copy.label);
      container.style.width = '210mm';
      container.innerHTML = html;

      await new Promise(resolve => setTimeout(resolve, 800));
      
      const canvas = await html2canvas(container, { 
        scale: 3, 
        width: 793, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = copy.filename.toUpperCase();
      link.click();

      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    container.innerHTML = '';
  } catch (err) { 
    console.error("Challan generation failed", err); 
  }
};
