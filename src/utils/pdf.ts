import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Asset, Employee } from '../types';
import { formatCurrency } from './currency';

/**
 * Export filtered FFE inventory as a formatted PDF report
 */
export function exportFfeInventoryPdf(assets: Asset[], filterSummary: string = 'All Items'): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'letter',
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Header
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text('WorkSpace FFE - Master Inventory Report', 40, 45);

  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text('Furniture, Fixtures, and Technical Equipment Workplace Directory', 40, 62);
  doc.text(`Generated on: ${dateStr} | Filters: ${filterSummary}`, 40, 76);

  const totalCost = assets.reduce((sum, item) => sum + (Number(item.purchase_cost) || 0), 0);
  doc.text(`Total Assets: ${assets.length} items | Total Valued at: ${formatCurrency(totalCost)}`, 40, 90);

  // Table rows
  const tableRows = assets.map((item) => [
    item.id,
    item.name,
    item.tag_number || 'N/A',
    item.serial_number || 'N/A',
    item.category,
    item.location,
    formatCurrency(item.purchase_cost),
    item.status,
    item.employee_name ? `${item.employee_name} (${item.employee_id})` : 'Unassigned',
  ]);

  autoTable(doc, {
    startY: 105,
    head: [
      [
        'Asset ID',
        'Asset Item Name',
        'Tag No.',
        'Serial No.',
        'Category',
        'Location',
        'Cost (PHP)',
        'Status',
        'Custodian',
      ],
    ],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [180, 180, 180],
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      lineWidth: 0.5,
      lineColor: [210, 210, 210],
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    margin: { left: 40, right: 40, bottom: 40 },
  });

  doc.save(`WorkSpace_FFE_Inventory_${now.toISOString().slice(0, 10)}.pdf`);
}

/**
 * Export an individual employee's asset accountability sheet as PDF
 */
export function exportEmployeeAccountabilityPdf(employee: Employee, assets: Asset[] = []): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Header Title
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text('WorkSpace FFE - Employee Asset Accountability Sheet', 40, 45);

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Official Workplace Equipment Custody & Verification Form', 40, 60);

  // Employee details table
  autoTable(doc, {
    startY: 75,
    body: [
      ['Employee ID:', employee.id, 'Date Issued / Verified:', dateStr],
      ['Full Name:', employee.full_name, 'Department:', employee.department],
      ['Job Title:', employee.job_title || 'N/A', 'Work Email:', employee.email || 'N/A'],
    ],
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineWidth: 0.5,
      lineColor: [200, 200, 200],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      2: { fontStyle: 'bold', cellWidth: 130 },
    },
    margin: { left: 40, right: 40 },
  });

  // Filter or list assigned assets
  const assigned = assets.filter((a) => a.employee_id === employee.id || !a.employee_id);
  const itemsToPrint = assigned.length > 0 ? assigned : (employee.assigned_assets || []);
  const totalVal = itemsToPrint.reduce((acc, curr) => acc + (Number(curr.purchase_cost) || 0), 0);

  // Asset table
  const assetRows = itemsToPrint.map((item) => [
    item.id,
    item.name,
    item.tag_number,
    item.serial_number || 'N/A',
    item.category,
    item.location,
    formatCurrency(item.purchase_cost),
    item.status,
  ]);

  if (assetRows.length === 0) {
    assetRows.push(['None', 'No assets currently assigned to this personnel.', '-', '-', '-', '-', '₱0.00', 'Available']);
  }

  // @ts-ignore
  const lastTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 140;

  autoTable(doc, {
    startY: lastTableY + 15,
    head: [
      [
        'Asset ID',
        'Asset Item Name',
        'Tag No.',
        'Serial No.',
        'Category',
        'Location',
        'Cost',
        'Status',
      ],
    ],
    body: assetRows,
    theme: 'plain',
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [180, 180, 180],
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      lineWidth: 0.5,
      lineColor: [210, 210, 210],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    margin: { left: 40, right: 40 },
  });

  // Summary and Signatures
  // @ts-ignore
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 25 : 300;

  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(`Total Assigned Items: ${itemsToPrint.length} | Total Asset Value: ${formatCurrency(totalVal)}`, 40, finalY);

  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  const ackText =
    'Acknowledgment: By signing below, the custodian confirms receipt and custody of the listed company Furniture, Fixtures, and Equipment in functional condition, agreeing to exercise due diligence and return them upon cessation of employment or workplace reassignment.';
  doc.text(doc.splitTextToSize(ackText, 530), 40, finalY + 18);

  const sigY = finalY + 75;

  // Signature lines
  doc.line(40, sigY, 240, sigY);
  doc.text(`${employee.full_name} (Custodian)`, 40, sigY + 12);
  doc.text('Employee Signature & Date', 40, sigY + 24);

  doc.line(330, sigY, 530, sigY);
  doc.text('Facilities / Operations Officer', 330, sigY + 12);
  doc.text('Authorized Signature & Date', 330, sigY + 24);

  doc.save(`FFE_Accountability_${employee.id}_${employee.full_name.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Export staff directory with FFE asset count as PDF
 */
export function exportStaffDirectoryPdf(employees: Employee[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text('WorkSpace FFE - Staff & Custody Directory', 40, 45);

  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(`Personnel records and assigned FFE tracking count | Generated: ${dateStr}`, 40, 62);
  doc.text(`Total Staff: ${employees.length} employees`, 40, 76);

  const rows = employees.map((emp) => [
    emp.id,
    emp.full_name,
    emp.department,
    emp.job_title || 'N/A',
    emp.email || 'N/A',
    `${emp.assigned_count ?? 0} Item(s)`,
  ]);

  autoTable(doc, {
    startY: 95,
    head: [['EMP ID', 'Full Name', 'Department', 'Job Title', 'Work Email', 'Assigned FFE']],
    body: rows,
    theme: 'plain',
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [180, 180, 180],
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
      lineWidth: 0.5,
      lineColor: [210, 210, 210],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    margin: { left: 40, right: 40, bottom: 40 },
  });

  doc.save(`WorkSpace_FFE_Staff_Directory_${now.toISOString().slice(0, 10)}.pdf`);
}
