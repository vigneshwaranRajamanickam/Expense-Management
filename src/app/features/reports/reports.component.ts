import { Component, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { ExpenseService } from '../../core/services/expense.service';
import { CategoryService } from '../../core/services/category.service';
import { ExportService } from '../../core/services/export.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { MonthlyTrendItem, CategorySummary, Expense } from '../../core/models/app-models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInrPipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Financial Reports & Exports</h1>
          <p class="page-desc">Comprehensive visual analytics and data export utilities</p>
        </div>

        <div class="export-btn-group">
          <button (click)="exportCSV()" class="btn btn-secondary btn-sm">📄 CSV</button>
          <button (click)="exportExcel()" class="btn btn-secondary btn-sm">📊 Excel</button>
          <button (click)="exportPDF()" class="btn btn-primary btn-sm">📥 PDF</button>
        </div>
      </div>

      <!-- Filters Strip -->
      <div class="glass-card filter-strip">
        <div class="filter-col">
          <label>Year</label>
          <select [(ngModel)]="year" (ngModelChange)="loadReportData()" class="filter-select">
            <option [ngValue]="2026">2026</option>
            <option [ngValue]="2025">2025</option>
          </select>
        </div>

        <div class="filter-col">
          <label>Month</label>
          <select [(ngModel)]="month" (ngModelChange)="loadReportData()" class="filter-select">
            <option [ngValue]="0">All Year (12 Months)</option>
            <option [ngValue]="6">June</option>
            <option [ngValue]="7">July</option>
            <option [ngValue]="8">August</option>
            <option [ngValue]="9">September</option>
          </select>
        </div>

        <div class="filter-col">
          <label>Category Filter</label>
          <select [(ngModel)]="selectedCategory" (ngModelChange)="loadReportData()" class="filter-select">
            <option value="">All Categories</option>
            <option *ngFor="let c of categoryService.categories()" [value]="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>

      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <div *ngIf="!loading()" class="reports-grid">
        <!-- 12-Month Spending Trend Bar Chart -->
        <div class="glass-card chart-card full-width">
          <h3 class="card-title">Annual Monthly Spending Trend ({{ year }})</h3>
          <div class="chart-box">
            <canvas #trendCanvas></canvas>
          </div>
        </div>

        <!-- Category Doughnut Chart -->
        <div class="glass-card chart-card">
          <h3 class="card-title">Category Breakdown ({{ getMonthName(month) }})</h3>
          <div class="chart-box">
            <canvas #catCanvas></canvas>
          </div>
        </div>

        <!-- Summary Statistics Section -->
        <div class="glass-card table-card">
          <div class="card-hdr">
            <h3 class="card-title">Report Summary Details</h3>
          </div>

          <!-- Mobile Summary List (<768px) -->
          <div class="mobile-summary-list">
            <div *ngFor="let cat of categoryBreakdown()" class="summary-item">
              <div class="s-left">
                <span class="cat-dot" [style.background]="cat.color || '#6366F1'"></span>
                <div class="s-info">
                  <span class="s-name">{{ cat.category_name }}</span>
                  <span class="s-count">{{ cat.transaction_count }} transaction(s)</span>
                </div>
              </div>
              <div class="s-right">
                <span class="s-amount">{{ cat.total_amount | currencyInr }}</span>
                <span class="badge badge-info">{{ cat.percentage }}% share</span>
              </div>
            </div>
          </div>

          <!-- Desktop Table View (>=768px) -->
          <div class="desktop-table-view table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Transactions</th>
                  <th>Amount</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cat of categoryBreakdown()">
                  <td class="font-bold">
                    <span class="cat-dot-inline" [style.background]="cat.color || '#6366F1'"></span>
                    {{ cat.category_name }}
                  </td>
                  <td>{{ cat.transaction_count }}</td>
                  <td class="font-bold">{{ cat.total_amount | currencyInr }}</td>
                  <td>
                    <span class="badge badge-info">{{ cat.percentage }}%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      width: 100%;
    }

    .page-title {
      font-size: clamp(1.25rem, 4vw, 1.6rem);
      font-weight: 800;
      color: var(--text-main);
    }

    .page-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .export-btn-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      @media (max-width: 600px) {
        width: 100%;
        button {
          flex: 1;
          justify-content: center;
          text-align: center;
        }
      }
    }

    .filter-strip {
      padding: 16px 20px;
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
      width: 100%;

      @media (max-width: 600px) {
        flex-direction: column;
        align-items: stretch;
      }
    }

    .filter-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 140px;

      @media (max-width: 600px) {
        width: 100%;
      }
    }

    .filter-col label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .filter-select {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 8px 12px;
      color: var(--text-main);
      font-weight: 600;
      outline: none;
      width: 100%;
    }

    .reports-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      width: 100%;

      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .chart-card {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      width: 99%;
    }

    .card-title {
      font-size: clamp(1rem, 3.5vw, 1.2rem);
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.3;
      word-break: break-word;
    }

    .chart-box {
      height: 260px;
      position: relative;
      width: 100%;

      @media (max-width: 600px) {
        height: 220px;
      }
    }

    .table-card { padding: 0; overflow: hidden; width: 100%; }

    /* Mobile Summary List (<768px) */
    .mobile-summary-list {
      display: none;
      flex-direction: column;

      @media (max-width: 767px) {
        display: flex;
      }
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }
    }

    .s-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cat-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .cat-dot-inline {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
    }

    .s-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .s-name {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .s-count {
      font-size: 0.76rem;
      color: var(--text-muted);
    }

    .s-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .s-amount {
      font-size: 0.98rem;
      font-weight: 800;
      color: var(--text-main);
    }

    /* Desktop Table View (>=768px) */
    .desktop-table-view {
      display: block;

      @media (max-width: 767px) {
        display: none;
      }
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }

    .card-hdr { padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
    .font-bold { font-weight: 700; color: var(--text-main); }
  `]
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private expenseService = inject(ExpenseService);
  categoryService = inject(CategoryService);
  private exportService = inject(ExportService);

  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('catCanvas') catCanvas!: ElementRef<HTMLCanvasElement>;

  year = 2026;
  month = 9;
  selectedCategory = '';

  readonly loading = signal<boolean>(true);
  readonly trendData = signal<MonthlyTrendItem[]>([]);
  readonly categoryBreakdown = signal<CategorySummary[]>([]);
  readonly rawExpenses = signal<Expense[]>([]);

  private barChartInstance?: Chart;
  private pieChartInstance?: Chart;

  async ngOnInit() {
    this.categoryService.loadCategories();
    await this.loadReportData();
  }

  async loadReportData() {
    this.loading.set(true);
    try {
      const trend = await this.reportService.getMonthlyTrend(this.year);
      const cats = await this.reportService.getCategorySummary(this.year, this.month > 0 ? this.month : 9);
      const exps = await this.expenseService.loadExpenses({
        year: this.year,
        month: this.month > 0 ? this.month : undefined,
        category_id: this.selectedCategory || undefined
      });

      this.trendData.set(trend);
      this.categoryBreakdown.set(cats);
      this.rawExpenses.set(exps);
    } finally {
      this.loading.set(false);
      setTimeout(() => {
        this.renderTrendChart();
        this.renderCategoryChart();
      }, 50);
    }
  }

  renderTrendChart() {
    if (!this.trendCanvas) return;
    if (this.barChartInstance) this.barChartInstance.destroy();

    const trend = this.trendData();
    const labels = trend.map(t => t.month_name);
    const values = trend.map(t => t.total_expense);

    this.barChartInstance = new Chart(this.trendCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Expenses (INR)',
          data: values,
          backgroundColor: 'rgba(99, 102, 241, 0.75)',
          borderColor: '#6366F1',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#94A3B8', font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: '#94A3B8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
        },
        plugins: {
          legend: { labels: { color: '#F8FAFC', font: { size: 11 } } }
        }
      }
    });
  }

  renderCategoryChart() {
    if (!this.catCanvas) return;
    if (this.pieChartInstance) this.pieChartInstance.destroy();

    const cats = this.categoryBreakdown();
    const labels = cats.map(c => c.category_name);
    const values = cats.map(c => c.total_amount);
    const colors = cats.map(c => c.color || '#6366F1');

    const isMobile = window.innerWidth < 600;

    this.pieChartInstance = new Chart(this.catCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: isMobile ? 'bottom' : 'right',
            labels: { color: '#94A3B8', font: { size: 11 }, boxWidth: 12, padding: isMobile ? 8 : 12 }
          }
        }
      }
    });
  }

  exportCSV() {
    const formatted = this.rawExpenses().map(e => ({
      Date: e.date,
      Category: e.categories?.name || 'Uncategorized',
      Description: e.description,
      Amount: e.amount,
      PaymentMethod: e.payment_method,
      Notes: e.notes || ''
    }));
    this.exportService.exportToCSV(formatted, `Expenses_${this.year}_${this.month}.csv`);
  }

  exportExcel() {
    this.exportService.exportExpensesToExcel(this.rawExpenses(), `Expense_Report_${this.year}_${this.month}.xlsx`);
  }

  exportPDF() {
    this.exportService.exportExpensesToPDF(
      this.rawExpenses(),
      `Personal Expense Report - ${this.getMonthName(this.month)} ${this.year}`,
      `Financial_Report_${this.year}_${this.month}.pdf`
    );
  }

  getMonthName(m: number): string {
    if (m === 0) return 'All Months';
    const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return names[m] || 'Month';
  }
}
