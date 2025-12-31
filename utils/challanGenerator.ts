
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
    <div style="width: 140mm; height: 195mm; padding: 8mm 6mm; box-sizing: border-box; font-family: 'Arial', sans-serif; background: #fff; color: #000; position: relative; border: 1.5px solid #000; display: flex; flex-direction: column; overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td style="vertical-align: top;">
            <div style="font-size: 22pt; font-weight: 900; text-transform: uppercase; line-height: 0.9; color: #000; letter-spacing: -1px;">NARSINHA</div>
            <div style="font-size: 11pt; font-weight: 900; color: #1e40af; margin-bottom: 5px; letter-spacing: 0.5px;">ENGINEERING WORKS</div>
            <div style="font-size: 6pt; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">SOLAR PUMP MANUFACTURER & INSTALLER</div>
            <div style="font-size: 6pt; color: #94a3b8; font-weight: 500;">E-35, MIDC Area, Nanded-431603</div>
          </td>
          <td style="text-align: right; vertical-align: top; width: 40%;">
            <div style="background: #000; color: #fff; padding: 6px 4px; text-align: center; font-size: 8.5pt; font-weight: 900; text-transform: uppercase; margin-bottom: 8px;">DELIVERY CHALLAN</div>
            <div style="font-size: 8pt; font-weight: bold; margin-bottom: 2px;">DC No: <span style="color: #2563eb;">${entry.challanNo}</span></div>
            <div style="font-size: 8pt; font-weight: bold;">Date: ${entry.date}</div>
            <div style="font-size: 6pt; font-weight: 900; color: #64748b; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">${copyLabel}</div>
          </td>
        </tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
        <tr>
          <td style="width: 55%; border: 1px solid #000; padding: 6px; vertical-align: top;">
            <div style="font-size: 5.5pt; font-weight: 900; color: #64748b; margin-bottom: 4px;">FARMER / CONSIGNEE</div>
            <div style="font-size: 10pt; font-weight: 900; text-transform: uppercase; margin-bottom: 2px;">${entry.farmerName}</div>
            <div style="font-size: 8pt; font-weight: 900; color: #2563eb; margin-bottom: 4px;">ID: ${entry.beneficiaryId}</div>
            ${entry.farmerMobile ? `<div style="font-size: 7.5pt; font-weight: bold; color: #059669; margin-bottom: 4px;">MOB: ${entry.farmerMobile}</div>` : ''}
            <div style="font-size: 6.5pt; font-weight: bold; text-transform: uppercase; line-height: 1.2;">
              ${entry.village}, ${entry.taluka},<br/>
              ${entry.subDivision}, ${entry.division},<br/>
              ${entry.circle}, ${entry.zone} ZONE
            </div>
          </td>
          <td style="width: 2%;"></td>
          <td style="width: 43%; border: 1px solid #000; padding: 6px; vertical-align: top; background: #fafafa;">
            <div style="font-size: 5.5pt; font-weight: 900; color: #64748b; margin-bottom: 4px;">LOGISTICS DETAILS</div>
            <div style="font-size: 7pt; margin-bottom: 3px;"><b>Installer:</b> ${installerDisplay}</div>
            ${entry.installerMobile ? `<div style="font-size: 6.5pt; color: #475569; font-weight: bold; margin-bottom: 3px;">MOB: ${entry.installerMobile}</div>` : ''}
            <div style="font-size: 7pt; margin-bottom: 3px;"><b>Vehicle:</b> ${entry.vehicleNo || 'N/A'}</div>
            <div style="font-size: 7pt; margin-bottom: 3px;"><b>Sub-Div:</b> ${entry.subDivision}</div>
            <div style="font-size: 7pt;"><b>Target:</b> ${entry.expectedDate}</div>
          </td>
        </tr>
      </table>
      <table style="width: 100%; border: 1.5px solid #000; border-collapse: collapse; margin-bottom: 10px;">
        <thead>
          <tr style="background: #000; color: #fff;"><th style="padding: 5px; text-align: left; font-size: 7pt; border-right: 1px solid #333; width: 10%;">SR.</th><th style="padding: 5px; text-align: left; font-size: 7pt; border-right: 1px solid #333; width: 70%;">DESCRIPTION OF GOODS</th><th style="padding: 5px; text-align: right; font-size: 7pt; width: 20%;">QTY</th></tr>
        </thead>
        <tbody>
          ${entry.materials.map((m, i) => `
            <tr style="border-bottom: 1px solid #000;">
              <td style="padding: 6px 4px; font-size: 7pt; border-right: 1px solid #000; text-align: center;">${i + 1}</td>
              <td style="padding: 6px 4px; font-size: 7.5pt; font-weight: bold; border-right: 1px solid #000; text-transform: uppercase; vertical-align: top;">
                <div style="color: #64748b; font-size: 6pt; font-weight: 900; margin-bottom: 2px;">${FORMAL_CAT_LABELS[m.category] || m.category} :</div> 
                <div style="margin-bottom: 4px;">${m.specification}</div>
                ${m.serialNumbers && m.serialNumbers.length > 0 ? `
                  <div style="font-family: 'Courier New', monospace; font-size: 5.5pt; color: #1e3a8a; background: #eff6ff; padding: 2px; border: 0.5px solid #bfdbfe; font-weight: bold; line-height: 1.1;">
                    SR: ${m.serialNumbers.join(', ')}
                  </div>
                ` : ''}
              </td>
              <td style="padding: 6px 4px; font-size: 8pt; font-weight: 900; text-align: right; color: #000; vertical-align: top;">${m.quantity}</td>
            </tr>
          `).join('')}
          ${Array(Math.max(0, 5 - entry.materials.length)).fill(0).map(() => `<tr style="border-bottom: 1px solid #000; height: 35px;"><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000;"></td><td></td></tr>`).join('')}
          <tr style="background: #f8fafc;"><td colspan="2" style="padding: 8px 6px; text-align: right; font-weight: 900; font-size: 8pt; border-right: 1px solid #000; text-transform: uppercase;">TOTAL QUANTITY</td><td style="padding: 8px 6px; text-align: right; font-weight: 900; font-size: 9pt;">${totalQty} NOS</td></tr>
        </tbody>
      </table>
      <div style="margin-top: auto; padding-top: 10px;">
        <div style="text-align: right; margin-bottom: 30px;"><div style="font-size: 6.5pt; font-weight: 900; text-transform: uppercase;">FOR NARSINHA ENGINEERING WORKS</div></div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="width: 31%; text-align: center;"><div style="border-top: 1px solid #000; padding-top: 4px; font-size: 6pt; font-weight: 900;">RECEIVER'S SIGN</div></td><td style="width: 3.5%;"></td><td style="width: 31%; text-align: center;"><div style="border-top: 1px solid #000; padding-top: 4px; font-size: 6pt; font-weight: 900;">INSTALLER'S SIGN</div></td><td style="width: 3.5%;"></td><td style="width: 31%; text-align: center;"><div style="border-top: 1px solid #000; padding-top: 4px; font-size: 6pt; font-weight: 900;">AUTH. SIGNATORY</div></td></tr>
        </table>
      </div>
    </div>
  `;
};

export const downloadChallanAsImage = async (entry: DispatchEntry) => {
  const container = document.getElementById('image-source');
  if (!container) return;

  const html = `<div id="challan-doc-master" style="width: 297mm; height: 210mm; display: flex; flex-direction: row; gap: 6mm; background: #fff; padding: 7mm; box-sizing: border-box; align-items: flex-start; justify-content: space-between;">${generateSingleChallanComponent(entry, 'OFFICE RECORD COPY')}<div style="width: 0px; height: 100%; border-left: 1.5px dashed #cbd5e1; position: relative; margin: 0 2mm;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-90deg); font-size: 8pt; color: #94a3b8; white-space: nowrap; font-weight: bold; background: white; padding: 5px 15px; letter-spacing: 2px;">✂ CUT ALONG THE LINE</div></div>${generateSingleChallanComponent(entry, 'TRANSPORTER COPY')}</div>`;
  
  container.style.width = '297mm';
  container.innerHTML = html;

  try {
    const html2canvas = (window as any).html2canvas;
    if (!html2canvas) throw new Error("html2canvas library missing");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    const canvas = await html2canvas(container, { 
      scale: 3, 
      width: 1123, 
      useCORS: true 
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${entry.beneficiaryId}_DC.png`.toUpperCase();
    link.click();
    container.innerHTML = '';
  } catch (err) { 
    console.error("Challan generation failed", err); 
  }
};
