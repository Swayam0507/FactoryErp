import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SalaryReport, Employee, FactorySettings } from '@/types';
import { formatMonthYear, formatDate } from '@/lib/utils';

// ── Number to Words (Indian system) ──────────────────────────
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const rupees = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - rupees) * 100);

  let result = convert(rupees) + ' Rupee' + (rupees !== 1 ? 's' : '');
  if (paise > 0) {
    result += ' and ' + convert(paise) + ' Paise';
  }
  result += ' Only';
  return result;
}

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
  const m = 15; // margin
  const tableW = pageWidth - m * 2;
  const colMid = m + tableW / 2;

  // Colors
  const darkBlue: [number, number, number] = [30, 58, 138];
  const black: [number, number, number] = [0, 0, 0];
  const gray: [number, number, number] = [100, 100, 100];
  const lightGray: [number, number, number] = [245, 245, 245];
  const white: [number, number, number] = [255, 255, 255];
  const emerald: [number, number, number] = [16, 185, 129];

  let y = m;

  // ═══════════════════════════════════════════════════════════
  // ROW 1: COMPANY NAME (full width, bordered, centered)
  // ═══════════════════════════════════════════════════════════
  const headerH = 14;
  doc.setFillColor(...darkBlue);
  doc.rect(m, y, tableW, headerH, 'F');
  doc.setDrawColor(...black);
  doc.rect(m, y, tableW, headerH, 'S');
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.factory_name || 'VivekBhai Industries', pageWidth / 2, y + 9.5, { align: 'center' });
  y += headerH;

  // ═══════════════════════════════════════════════════════════
  // ROW 2: Factory Address (if exists)
  // ═══════════════════════════════════════════════════════════
  if (settings.factory_address) {
    const addrH = 8;
    doc.setFillColor(...darkBlue);
    doc.rect(m, y, tableW, addrH, 'F');
    doc.setDrawColor(...black);
    doc.rect(m, y, tableW, addrH, 'S');
    doc.setTextColor(200, 210, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(settings.factory_address, pageWidth / 2, y + 5.5, { align: 'center' });
    y += addrH;
  }

  // ═══════════════════════════════════════════════════════════
  // ROW 3: PAY SLIP TITLE
  // ═══════════════════════════════════════════════════════════
  const titleH = 10;
  doc.setFillColor(...lightGray);
  doc.rect(m, y, tableW, titleH, 'FD');
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Pay Slip — ${formatMonthYear(report.month, report.year)}`, pageWidth / 2, y + 7, { align: 'center' });
  y += titleH;

  // ═══════════════════════════════════════════════════════════
  // EMPLOYEE DETAILS (2-column bordered grid)
  // ═══════════════════════════════════════════════════════════
  const rowH = 8;
  const labelW = 38;
  const valueW = tableW / 2 - labelW;

  const drawInfoRow = (
    leftLabel: string, leftValue: string,
    rightLabel: string, rightValue: string
  ) => {
    // Outer border
    doc.setDrawColor(...black);
    doc.rect(m, y, tableW, rowH, 'S');
    // Vertical dividers
    doc.line(m + labelW, y, m + labelW, y + rowH);
    doc.line(colMid, y, colMid, y + rowH);
    doc.line(colMid + labelW, y, colMid + labelW, y + rowH);

    doc.setFontSize(9);
    doc.setTextColor(...black);

    // Left label
    doc.setFont('helvetica', 'bold');
    doc.text(leftLabel, m + 2, y + 5.5);
    // Left value
    doc.setFont('helvetica', 'normal');
    doc.text(leftValue, m + labelW + 2, y + 5.5);

    // Right label
    doc.setFont('helvetica', 'bold');
    doc.text(rightLabel, colMid + 2, y + 5.5);
    // Right value
    doc.setFont('helvetica', 'normal');
    doc.text(rightValue, colMid + labelW + 2, y + 5.5);

    y += rowH;
  };

  drawInfoRow(
    'Employee Name', employee.full_name,
    'Employee Code', employee.employee_code
  );
  drawInfoRow(
    'Mobile', employee.mobile_number || '—',
    'Joining Date', employee.joining_date ? formatDate(employee.joining_date) : '—'
  );
  drawInfoRow(
    'Rate / Attendance', `Rs. ${report.rate.toFixed(2)}`,
    'Total Attendance', `${report.total_attendance}`
  );
  drawInfoRow(
    'Gross Salary', `Rs. ${report.gross_salary.toFixed(2)}`,
    'Status', employee.status === 'active' ? 'Active' : 'Inactive'
  );

  // Address row (full width)
  doc.setDrawColor(...black);
  doc.rect(m, y, tableW, rowH, 'S');
  doc.line(m + labelW, y, m + labelW, y + rowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...black);
  doc.text('Address', m + 2, y + 5.5);
  doc.setFont('helvetica', 'normal');
  const addr = employee.address || '—';
  doc.text(addr.substring(0, 80), m + labelW + 2, y + 5.5);
  y += rowH;

  // ═══════════════════════════════════════════════════════════
  // EARNINGS TABLE
  // ═══════════════════════════════════════════════════════════
  y += 4;

  const earningsBody: (string | number)[][] = [
    ['Gross Salary  (Attendance × Rate)', `${report.total_attendance} × Rs.${report.rate.toFixed(2)}`, `Rs. ${report.gross_salary.toFixed(2)}`],
  ];

  // Deductions
  const deductions: (string | number)[][] = [];
  if (report.advance_cash > 0) {
    deductions.push(['(-) Cash Advance', '', `Rs. ${report.advance_cash.toFixed(2)}`]);
  }
  if (report.advance_rtgs > 0) {
    deductions.push(['(-) RTGS Advance', '', `Rs. ${report.advance_rtgs.toFixed(2)}`]);
  }
  if (report.advance_amount > 0 && !report.advance_cash && !report.advance_rtgs) {
    deductions.push(['(-) Advance Deduction', '', `Rs. ${report.advance_amount.toFixed(2)}`]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Details', 'Amount (Rs.)']],
    body: [...earningsBody, ...deductions],
    foot: [['Net Payable Salary', '', `Rs. ${report.final_salary.toFixed(2)}`]],
    headStyles: {
      fillColor: darkBlue,
      textColor: white,
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
    },
    footStyles: {
      fillColor: emerald,
      textColor: white,
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [40, 40, 40],
      lineWidth: 0.2,
      lineColor: [180, 180, 180],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: m, right: m },
    alternateRowStyles: { fillColor: [250, 250, 255] },
    tableLineColor: black,
    tableLineWidth: 0.3,
    theme: 'grid',
  });

  const afterTableY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  y = afterTableY + 2;

  // ═══════════════════════════════════════════════════════════
  // AMOUNT IN WORDS ROW
  // ═══════════════════════════════════════════════════════════
  const wordsH = 10;
  doc.setDrawColor(...black);
  doc.setLineWidth(0.3);
  doc.rect(m, y, tableW, wordsH, 'S');

  const wordsLabelW = 35;
  doc.line(m + wordsLabelW, y, m + wordsLabelW, y + wordsH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...black);
  doc.text('Amount in Words:', m + 2, y + 6.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text(numberToWords(report.final_salary), m + wordsLabelW + 3, y + 6.5);
  y += wordsH;

  // ═══════════════════════════════════════════════════════════
  // NET PAY HIGHLIGHT BAR
  // ═══════════════════════════════════════════════════════════
  y += 4;
  const netH = 14;
  doc.setFillColor(...darkBlue);
  doc.roundedRect(m, y, tableW, netH, 2, 2, 'F');
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    `NET PAYABLE:  Rs. ${report.final_salary.toFixed(2)}`,
    pageWidth / 2,
    y + 9.5,
    { align: 'center' }
  );
  y += netH;

  // ═══════════════════════════════════════════════════════════
  // SIGNATURES (Worker + Authority)
  // ═══════════════════════════════════════════════════════════
  y += 30;
  const sigLineW = 55;

  doc.setDrawColor(...black);
  doc.setLineWidth(0.3);

  // Left — Worker Signature
  doc.line(m, y, m + sigLineW, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...black);
  doc.text('Worker Signature', m, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text(`(${employee.full_name})`, m, y + 10);

  // Right — Authority Signature
  const rightSigX = pageWidth - m - sigLineW;
  doc.line(rightSigX, y, pageWidth - m, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...black);
  doc.text('Authority Signature', rightSigX, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text(`(${settings.factory_name || 'VivekBhai Industries'})`, rightSigX, y + 10);

  // ═══════════════════════════════════════════════════════════
  // FOOTER — Date Stamp & Note
  // ═══════════════════════════════════════════════════════════
  const pageH = doc.internal.pageSize.getHeight();

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(m, pageH - 18, pageWidth - m, pageH - 18);

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'This is a computer generated salary slip.',
    pageWidth / 2,
    pageH - 13,
    { align: 'center' }
  );
  doc.text(
    `Generated on: ${formatDate(new Date().toISOString())}`,
    pageWidth / 2,
    pageH - 9,
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
