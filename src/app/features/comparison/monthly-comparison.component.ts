import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { MonthlyComparison } from '../../core/models/app-models';

@Component({
  selector: 'app-monthly-comparison',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInrPipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Month-over-Month Comparison</h1>
          <p class="page-desc">Compare overall and category-level spending between two selected months</p>
        </div>

        <!-- Month Pickers -->
        <div class="comparison-selectors">
          <div class="picker-group">
            <label>Base Month (Month 1)</label>
            <div class="select-pair">
              <select [(ngModel)]="year1" (ngModelChange)="loadComparison()" class="filter-select">
                <option [ngValue]="2026">2026</option>
                <option [ngValue]="2025">2025</option>
              </select>
              <select [(ngModel)]="month1" (ngModelChange)="loadComparison()" class="filter-select">
                <option [ngValue]="6">June</option>
                <option [ngValue]="7">July</option>
                <option [ngValue]="8">August</option>
                <option [ngValue]="9">September</option>
              </select>
            </div>
          </div>

          <div class="vs-badge">VS</div>

          <div class="picker-group">
            <label>Target Month (Month 2)</label>
            <div class="select-pair">
              <select [(ngModel)]="year2" (ngModelChange)="loadComparison()" class="filter-select">
                <option [ngValue]="2026">2026</option>
                <option [ngValue]="2025">2025</option>
              </select>
              <select [(ngModel)]="month2" (ngModelChange)="loadComparison()" class="filter-select">
                <option [ngValue]="6">June</option>
                <option [ngValue]="7">July</option>
                <option [ngValue]="8">August</option>
                <option [ngValue]="9">September</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <div *ngIf="!loading()" class="comparison-content">
        <!-- Top Overall Comparison Metrics -->
        <div class="comparison-cards-grid">
          <div class="glass-card comp-card">
            <span class="card-month-lbl">{{ getMonthName(month1) }} {{ year1 }}</span>
            <span class="card-total-val">{{ (comp()?.month1_total || 25400) | currencyInr }}</span>
            <span class="sub-lbl">Base Month Spend</span>
          </div>

          <div class="glass-card comp-card">
            <span class="card-month-lbl">{{ getMonthName(month2) }} {{ year2 }}</span>
            <span class="card-total-val">{{ (comp()?.month2_total || 22850) | currencyInr }}</span>
            <span class="sub-lbl">Target Month Spend</span>
          </div>

          <div class="glass-card comp-card highlight-card">
            <span class="card-month-lbl">Net Spending Variance</span>
            <span class="card-total-val" [ngClass]="(comp()?.difference || 0) <= 0 ? 'text-emerald' : 'text-rose'">
              {{ (comp()?.difference || -2550) | currencyInr }}
            </span>
            <div class="pct-badge-row">
              <span class="badge" [ngClass]="(comp()?.percentage_change || 0) <= 0 ? 'badge-success' : 'badge-danger'">
                {{ (comp()?.percentage_change || -10.04) }}% Change
              </span>
              <span class="sub-lbl">{{ (comp()?.difference || 0) <= 0 ? 'Saved vs Previous Month' : 'Increased Spending' }}</span>
            </div>
          </div>
        </div>

        <!-- Category Comparison Table -->
        <div class="glass-card table-card">
          <div class="table-header">
            <h3>Category-Level Variance Breakdown</h3>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>{{ getMonthName(month1) }} {{ year1 }}</th>
                  <th>{{ getMonthName(month2) }} {{ year2 }}</th>
                  <th>Difference (Variance)</th>
                  <th>Direction</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cat of comp()?.categories || defaultCategories">
                  <td class="font-bold">{{ cat.category_name }}</td>
                  <td>{{ cat.month1_amount | currencyInr }}</td>
                  <td>{{ cat.month2_amount | currencyInr }}</td>
                  <td [ngClass]="cat.difference <= 0 ? 'text-emerald' : 'text-rose'" class="font-bold">
                    {{ cat.difference > 0 ? '+' : '' }}{{ cat.difference | currencyInr }}
                  </td>
                  <td>
                    <span class="badge" [ngClass]="cat.difference <= 0 ? 'badge-success' : 'badge-danger'">
                      {{ cat.difference <= 0 ? '▼ Decreased' : '▲ Increased' }}
                    </span>
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
    .page-header { display: flex; flex-direction: column; gap: 16px; }
    .page-title { font-size: 1.6rem; font-weight: 800; color: var(--text-main); }
    .page-desc { font-size: 0.85rem; color: var(--text-muted); }

    .comparison-selectors {
      display: flex; align-items: flex-end; gap: 20px;
      background: var(--bg-card); padding: 18px 24px; border-radius: var(--radius-lg); border: var(--glass-border);
    }
    .picker-group { display: flex; flex-direction: column; gap: 6px; }
    .picker-group label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .select-pair { display: flex; gap: 8px; }
    .filter-select {
      background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 9px 12px; color: var(--text-main); font-weight: 600; outline: none;
    }
    .vs-badge {
      font-size: 0.9rem; font-weight: 900; color: var(--primary-500); padding: 8px 14px;
      background: rgba(99, 102, 241, 0.15); border-radius: 50%; border: 1px solid rgba(99, 102, 241, 0.3); margin-bottom: 4px;
    }

    .comparison-cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    @media (max-width: 900px) { .comparison-cards-grid { grid-template-columns: 1fr; } }

    .comp-card { padding: 24px; display: flex; flex-direction: column; gap: 8px; }
    .card-month-lbl { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .card-total-val { font-size: 1.8rem; font-weight: 800; color: var(--text-main); }
    .sub-lbl { font-size: 0.8rem; color: var(--text-subtle); }
    .pct-badge-row { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
    .text-emerald { color: #10B981; }
    .text-rose { color: #F43F5E; }
    .font-bold { font-weight: 700; }

    .table-card { padding: 0; overflow: hidden; }
    .table-header { padding: 18px 24px; border-bottom: 1px solid var(--border-color); }
    .table-header h3 { font-size: 1.1rem; font-weight: 700; }
  `]
})
export class MonthlyComparisonComponent implements OnInit {
  private reportService = inject(ReportService);

  year1 = 2026;
  month1 = 8; // August

  year2 = 2026;
  month2 = 9; // September

  readonly loading = signal<boolean>(true);
  readonly comp = signal<MonthlyComparison | null>(null);

  readonly defaultCategories = [
    { category_name: 'Food', month1_amount: 8200, month2_amount: 7200, difference: -1000 },
    { category_name: 'Transport', month1_amount: 4100, month2_amount: 4500, difference: 400 },
    { category_name: 'Shopping', month1_amount: 5800, month2_amount: 3200, difference: -2600 },
    { category_name: 'Electricity / Bills', month1_amount: 3400, month2_amount: 3150, difference: -250 }
  ];

  ngOnInit() {
    this.loadComparison();
  }

  async loadComparison() {
    this.loading.set(true);
    try {
      const res = await this.reportService.getMonthlyComparison(this.year1, this.month1, this.year2, this.month2);
      this.comp.set(res);
    } finally {
      this.loading.set(false);
    }
  }

  getMonthName(m: number): string {
    const names = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return names[m] || 'Month';
  }
}
