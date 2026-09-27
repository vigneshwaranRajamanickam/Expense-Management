import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { MonthlySummary, CategorySummary } from '../../core/models/app-models';

@Component({
  selector: 'app-monthly-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInrPipe, LoadingSpinnerComponent, StatCardComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Monthly Expense Summary</h1>
          <p class="page-desc">Comprehensive monthly spending breakdown and stats</p>
        </div>

        <div class="selector-controls">
          <select [(ngModel)]="selectedYear" (ngModelChange)="loadSummary()" class="filter-select">
            <option [ngValue]="2026">2026</option>
            <option [ngValue]="2025">2025</option>
          </select>
          <select [(ngModel)]="selectedMonth" (ngModelChange)="loadSummary()" class="filter-select">
            <option [ngValue]="1">January</option>
            <option [ngValue]="2">February</option>
            <option [ngValue]="3">March</option>
            <option [ngValue]="4">April</option>
            <option [ngValue]="5">May</option>
            <option [ngValue]="6">June</option>
            <option [ngValue]="7">July</option>
            <option [ngValue]="8">August</option>
            <option [ngValue]="9">September</option>
            <option [ngValue]="10">October</option>
            <option [ngValue]="11">November</option>
            <option [ngValue]="12">December</option>
          </select>
        </div>
      </div>

      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <div *ngIf="!loading()" class="summary-body">
        <!-- Metric Cards -->
        <div class="kpi-grid">
          <app-stat-card
            title="Total Monthly Spend"
            [value]="summary()?.total_expense || 0"
            accentColor="#EF4444"
            bgGlow="rgba(239, 68, 68, 0.15)"
          ></app-stat-card>

          <app-stat-card
            title="Daily Average"
            [value]="summary()?.daily_average || 0"
            accentColor="#F59E0B"
            bgGlow="rgba(245, 158, 11, 0.15)"
          ></app-stat-card>

          <app-stat-card
            title="Highest Single Expense"
            [value]="summary()?.highest_expense || 0"
            accentColor="#8B5CF6"
            bgGlow="rgba(139, 92, 246, 0.15)"
          ></app-stat-card>

          <app-stat-card
            title="Lowest Single Expense"
            [value]="summary()?.lowest_expense || 0"
            accentColor="#06B6D4"
            bgGlow="rgba(6, 182, 212, 0.15)"
          ></app-stat-card>
        </div>

        <!-- Highest Category Focus Card -->
        <div class="glass-card highlight-card">
          <div class="card-left">
            <span class="hl-tag">Highest Spending Category</span>
            <h2 class="hl-name">{{ summary()?.highest_category || 'Food' }}</h2>
          </div>
          <div class="card-right">
            <span class="hl-amt">{{ (summary()?.highest_category_amount || 7200) | currencyInr }}</span>
            <span class="hl-sub">Total spent in this category</span>
          </div>
        </div>

        <!-- Category Breakdown Table -->
        <div class="glass-card table-card">
          <div class="table-header">
            <h3>Category Distribution</h3>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Transactions</th>
                  <th>Total Amount</th>
                  <th>Share (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cat of categoryList()">
                  <td>
                    <span class="cat-pill" [style.background]="(cat.color || '#6366F1') + '22'" [style.color]="cat.color || '#6366F1'">
                      {{ cat.category_name }}
                    </span>
                  </td>
                  <td>{{ cat.transaction_count }}</td>
                  <td>
                    <span class="amt-val">{{ cat.total_amount | currencyInr }}</span>
                  </td>
                  <td>
                    <div class="progress-cell">
                      <span>{{ cat.percentage }}%</span>
                      <div class="mini-bar-track">
                        <div class="mini-bar-fill" [style.width]="cat.percentage + '%'" [style.background]="cat.color || '#6366F1'"></div>
                      </div>
                    </div>
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
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.6rem; font-weight: 800; color: var(--text-main); }
    .page-desc { font-size: 0.85rem; color: var(--text-muted); }
    .selector-controls { display: flex; gap: 12px; }
    .filter-select {
      background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 9px 14px; color: var(--text-main);
      font-weight: 600; outline: none; cursor: pointer;
    }

    .summary-body { display: flex; flex-direction: column; gap: 24px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }

    .highlight-card {
      padding: 24px 32px; display: flex; justify-content: space-between; align-items: center;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
      border: 1px solid rgba(99, 102, 241, 0.4);
    }
    .hl-tag { font-size: 0.8rem; font-weight: 700; color: #818CF8; text-transform: uppercase; letter-spacing: 0.05em; }
    .hl-name { font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-top: 4px; }
    .card-right { display: flex; flex-direction: column; align-items: flex-end; }
    .hl-amt { font-size: 2rem; font-weight: 800; color: #FFFFFF; }
    .hl-sub { font-size: 0.8rem; color: var(--text-muted); }

    .table-card { padding: 0; overflow: hidden; }
    .table-header { padding: 18px 24px; border-bottom: 1px solid var(--border-color); }
    .table-header h3 { font-size: 1.1rem; font-weight: 700; }
    .cat-pill { padding: 4px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
    .amt-val { font-weight: 700; color: var(--text-main); }
    
    .progress-cell { display: flex; align-items: center; gap: 10px; }
    .mini-bar-track { flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden; }
    .mini-bar-fill { height: 100%; border-radius: 999px; }
  `]
})
export class MonthlySummaryComponent implements OnInit {
  private reportService = inject(ReportService);

  selectedYear = 2026;
  selectedMonth = 9;

  readonly loading = signal<boolean>(true);
  readonly summary = signal<MonthlySummary | null>(null);
  readonly categoryList = signal<CategorySummary[]>([]);

  ngOnInit() {
    this.loadSummary();
  }

  async loadSummary() {
    this.loading.set(true);
    try {
      const sum = await this.reportService.getMonthlySummary(this.selectedYear, this.selectedMonth);
      const cats = await this.reportService.getCategorySummary(this.selectedYear, this.selectedMonth);
      this.summary.set(sum);
      this.categoryList.set(cats);
    } finally {
      this.loading.set(false);
    }
  }
}
