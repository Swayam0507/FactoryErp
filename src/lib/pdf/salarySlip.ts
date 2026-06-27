import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SalaryReport, Employee, FactorySettings } from '@/types';
import { formatMonthYear, formatDate } from '@/lib/utils';

interface SalarySlipData {
  report: SalaryReport;
  employee: Employee;
  settings: FactorySettings;
  doc?: jsPDF;
}

export function generateSalarySlipPDF(data: SalarySlipData): jsPDF {
  const { report, employee, settings } = data;
  const doc = data.doc || new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // ── Header Background ─────────────────────────────────────
  doc.setFillColor(30, 58, 138); // Deep Blue
  doc.rect(0, 0, pageWidth, 45, 'F');

  // ── Factory Name ──────────────────────────────────────────
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(settings.factory_name || 'VivekBhai Industries', pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (settings.factory_address) {
    doc.text(settings.factory_address, pageWidth / 2, 26, { align: 'center' });
  }

  // ── Salary Slip Title ─────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('SALARY SLIP', pageWidth / 2, 36, { align: 'center' });

  // ── Month / Year ──────────────────────────────────────────
  doc.setTextColor(16, 185, 129); // Emerald green accent
  doc.setFontSize(11);
  doc.text(
    `For: ${formatMonthYear(report.month, report.year)}`,
    pageWidth / 2,
    43,
    { align: 'center' }
  );

  // ── Employee Info Box ─────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, 55, pageWidth - margin * 2, 52, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('Employee Details', margin + 5, 64);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  const leftCol = margin + 5;
  const rightCol = pageWidth / 2 + 5;
  const lineH = 8;
  let y = 73;

  doc.setFont('helvetica', 'bold');
  doc.text('Name:', leftCol, y);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.full_name, leftCol + 28, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Emp Code:', rightCol, y);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.employee_code, rightCol + 28, y);

  y += lineH;
  doc.setFont('helvetica', 'bold');
  doc.text('Mobile:', leftCol, y);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.mobile_number || '—', leftCol + 28, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Joining Date:', rightCol, y);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.joining_date ? formatDate(employee.joining_date) : '—', rightCol + 32, y);

  y += lineH;
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', leftCol, y);
  doc.setFont('helvetica', 'normal');
  const addressText = doc.splitTextToSize(employee.address || '—', 70);
  doc.text(addressText, leftCol + 28, y);

  // ── Earnings / Deductions Table ───────────────────────────
  const tableStartY = 117;

  const tableBody = [
    ['Total Attendance', `${report.total_attendance} units`, ''],
    ['Rate per Attendance', `Rs. ${report.rate.toFixed(2)}`, ''],
    ['Gross Salary', '', `Rs. ${report.gross_salary.toFixed(2)}`],
  ];

  if (report.advance_cash > 0) {
    tableBody.push(['(-) Cash Advance Deduction', '', `Rs. ${report.advance_cash.toFixed(2)}`]);
  }
  if (report.advance_rtgs > 0) {
    tableBody.push(['(-) RTGS Advance Deduction', '', `Rs. ${report.advance_rtgs.toFixed(2)}`]);
  }
  if (report.advance_amount > 0 && !report.advance_cash && !report.advance_rtgs) {
    // Legacy support
    tableBody.push(['(-) Advance Deduction', '', `Rs. ${report.advance_amount.toFixed(2)}`]);
  }

  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Details', 'Amount (Rs.)']],
    body: tableBody,
    foot: [['Net Payable Salary', '', `Rs. ${report.final_salary.toFixed(2)}`]],
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    footStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 60 },
      2: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // ── Net Pay Highlight ─────────────────────────────────────
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFillColor(30, 58, 138);
  doc.roundedRect(margin, finalY, pageWidth - margin * 2, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(
    `NET PAYABLE: Rs. ${report.final_salary.toFixed(2)}`,
    pageWidth / 2,
    finalY + 10,
    { align: 'center' }
  );

  // ── Signature Area ────────────────────────────────────────
  const sigY = finalY + 40;
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  doc.line(margin, sigY, margin + 60, sigY);
  doc.text('Employee Signature', margin, sigY + 6);

  doc.line(pageWidth - margin - 60, sigY, pageWidth - margin, sigY);
  doc.text('Authorized Signature', pageWidth - margin - 60, sigY + 6);

  // ── Generated Date ─────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated on: ${formatDate(new Date().toISOString())}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  return doc;
}

export function downloadSalarySlip(data: SalarySlipData) {
  const doc = generateSalarySlipPDF(data);
  const { employee, report } = data;
  const filename = `Salary_Slip_${employee.employee_code}_${report.year}_${String(report.month).padStart(2, '0')}.pdf`;
  doc.save(filename);
}

export function generateBulkSalarySlips(
  reports: (SalaryReport & { employee: Employee })[],
  settings: FactorySettings
) {
  if (reports.length === 0) return;

  // Generate a single multi-page PDF document
  const mainDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  reports.forEach((report, index) => {
    if (index > 0) {
      mainDoc.addPage();
    }
    // Render this slip directly onto the mainDoc's current page
    generateSalarySlipPDF({ report, employee: report.employee, settings, doc: mainDoc });
  });

  const month = reports[0]?.month || 1;
  const year = reports[0]?.year || new Date().getFullYear();
  mainDoc.save(`All_Salary_Slips_${year}_${String(month).padStart(2, '0')}.pdf`);
}
