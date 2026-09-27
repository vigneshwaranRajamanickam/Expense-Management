import { Injectable } from '@angular/core';
import { Expense } from '../models/app-models';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  exportToCSV(data: any[], filename: string = 'expenses_report.csv') {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] ?? '';
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportExpensesToExcel(expenses: Expense[], filename: string = 'Expense_Data.xlsx') {
    const formattedData = expenses.map(e => ({
      Date: e.date,
      Category: e.categories?.name || 'Uncategorized',
      Description: e.description,
      Amount: e.amount,
      PaymentMethod: e.payment_method,
      Notes: e.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
    XLSX.writeFile(workbook, filename);
  }

  exportExpensesToPDF(expenses: Expense[], title: string = 'Expense Management Report', filename: string = 'Expense_Report.pdf') {
    const doc = new jsPDF();

    // Document Header
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

    // Table Header
    let y = 40;
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(79, 70, 229); // Modern Indigo
    doc.rect(14, y - 5, 182, 10, 'F');
    doc.text('Date', 16, y);
    doc.text('Category', 45, y);
    doc.text('Description', 85, y);
    doc.text('Method', 145, y);
    doc.text('Amount (INR)', 170, y);

    y += 10;
    let total = 0;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);

    expenses.forEach((e, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const amt = Number(e.amount);
      total += amt;

      const bg = idx % 2 === 0 ? 248 : 255;
      doc.setFillColor(bg, bg, bg);
      doc.rect(14, y - 4, 182, 8, 'F');

      doc.text(e.date, 16, y);
      doc.text((e.categories?.name || 'Uncategorized').substring(0, 18), 45, y);
      doc.text(e.description.substring(0, 28), 85, y);
      doc.text(e.payment_method, 145, y);
      doc.text(`INR ${amt.toFixed(2)}`, 170, y);

      y += 8;
    });

    // Total Footer Line
    y += 4;
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text(`Total Filtered Expenses: INR ${total.toFixed(2)}`, 14, y);

    doc.save(filename);
  }
}
