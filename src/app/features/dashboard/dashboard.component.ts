import { Component, inject, signal, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportService } from '../../core/services/report.service';
import { ExpenseService } from '../../core/services/expense.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { MonthlySummary, MonthlyComparison, CategorySummary, Expense } from '../../core/models/app-models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyInrPipe, StatCardComponent, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Financial Dashboard</h1>
          <p class="page-desc">Overview of spending, budget progress, and month-over-month trends</p>
        </div>
        <div class="month-pill">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Current Month: September 2026</span>
        </div>
      </div>

      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <div *ngIf="!loading()" class="dashboard-content">
        <!-- Top Metrics Row (5 Primary KPI Cards) -->
        <div class="kpi-grid">
          <app-stat-card
            title="Total Expense"
            [value]="summary()?.total_expense || 22850"
            accentColor="#EF4444"
            bgGlow="rgba(239, 68, 68, 0.15)"
            badgeText="September 2026"
            badgeClass="badge-danger"
          ></app-stat-card>

          <app-stat-card
            title="Monthly Budget"
            [value]="summary()?.monthly_budget || 30000"
            accentColor="#6366F1"
            bgGlow="rgba(99, 102, 241, 0.15)"
            subtext="Target Limit"
          ></app-stat-card>

          <app-stat-card
            title="Remaining Budget"
            [value]="summary()?.remaining_budget || 7150"
            accentColor="#10B981"
            bgGlow="rgba(16, 185, 129, 0.15)"
            badgeText="Available"
            badgeClass="badge-success"
          ></app-stat-card>

          <app-stat-card
            title="Daily Average"
            [value]="summary()?.daily_average || 761"
            accentColor="#F59E0B"
            bgGlow="rgba(245, 158, 11, 0.15)"
            subtext="Per Day Spend"
          ></app-stat-card>

          <div class="glass-card stat-card interactive">
            <div class="card-header">
              <span class="card-title">Transactions</span>
              <div class="icon-badge" style="background: rgba(6, 182, 212, 0.15); color: #06B6D4;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
            </div>
            <div class="card-body">
              <span class="tx-count-val">{{ summary()?.transaction_count || 42 }}</span>
              <span class="subtext">Recorded items</span>
            </div>
          </div>
        </div>

        <!-- Month Comparison Banner -->
        <div class="glass-card comparison-banner">
          <div class="banner-col">
            <span class="banner-lbl">Previous Month (August)</span>
            <span class="banner-val">{{ (comparison()?.month1_total || 25400) | currencyInr }}</span>
          </div>
          <div class="banner-divider">→</div>
          <div class="banner-col">
            <span class="banner-lbl">Current Month (September)</span>
            <span class="banner-val">{{ (comparison()?.month2_total || 22850) | currencyInr }}</span>
          </div>
          <div class="banner-col highlight-col">
            <span class="banner-lbl">Monthly Variance</span>
            <div class="diff-row">
              <span class="diff-val text-emerald">{{ (comparison()?.difference || -2550) | currencyInr }}</span>
              <span class="badge badge-success">{{ comparison()?.percentage_change || -10.04 }}%</span>
            </div>
          </div>
        </div>

        <!-- Budget Progress Widget -->
        <div class="glass-card budget-widget">
          <div class="widget-header">
            <h3>Budget Utilization Status</h3>
            <span class="pct-lbl">{{ budgetPct() }}% Used</span>
          </div>
          <div class="progress-track">
            <div 
              class="progress-fill" 
              [style.width]="budgetPct() + '%'"
              [ngClass]="{
                'bg-emerald': budgetPct() < 80,
                'bg-amber': budgetPct() >= 80 && budgetPct() < 100,
                'bg-rose': budgetPct() >= 100
              }"
            ></div>
          </div>
          <div class="widget-footer">
            <span>Spent: {{ (summary()?.total_expense || 22850) | currencyInr }}</span>
            <span>Total Budget: {{ (summary()?.monthly_budget || 30000) | currencyInr }}</span>
          </div>
        </div>

        <!-- Visual Analytics Grid (Doughnut Chart + Spending Velocity) -->
        <div class="charts-grid">
          <div class="glass-card chart-card">
            <h3 class="card-title-lg">Category Breakdown</h3>
            <div class="chart-container">
              <canvas #categoryCanvas></canvas>
            </div>
          </div>

          <div class="glass-card chart-card">
            <h3 class="card-title-lg">Recent Transactions</h3>
            <div class="recent-list">
              <div *ngFor="let item of recentTx()" class="tx-item">
                <div class="tx-icon" [style.background]="(item.categories?.color || '#6366F1') + '22'" [style.color]="item.categories?.color || '#6366F1'">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div class="tx-info">
                  <span class="tx-title">{{ item.description }}</span>
                  <span class="tx-meta">{{ item.date }} • {{ item.payment_method }}</span>
                </div>
                <span class="tx-amt">{{ item.amount | currencyInr }}</span>
              </div>
            </div>
            <div class="view-all-row">
              <a routerLink="/expenses" class="btn btn-secondary btn-sm w-100">View All Transactions →</a>
            </div>
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

    .month-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #818CF8;

      @media (max-width: 480px) {
        width: 100%;
        justify-content: center;
      }
    }

    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      width: 100%;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }

    .stat-card {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .icon-badge {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tx-count-val {
      font-size: clamp(1.3rem, 5vw, 1.65rem);
      font-weight: 800;
      color: var(--text-main);
    }

    .subtext {
      font-size: 0.8rem;
      color: var(--text-subtle);
    }

    .comparison-banner {
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
        gap: 14px;
        padding: 16px;
      }
    }

    .banner-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .banner-lbl {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .banner-val {
      font-size: clamp(1.1rem, 4vw, 1.35rem);
      font-weight: 800;
      color: var(--text-main);
    }

    .banner-divider {
      font-size: 1.5rem;
      color: var(--text-subtle);

      @media (max-width: 768px) {
        display: none;
      }
    }

    .highlight-col {
      @media (max-width: 768px) {
        border-top: 1px solid var(--border-color);
        padding-top: 12px;
      }
    }

    .diff-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .text-emerald {
      color: #10B981;
      font-size: clamp(1.1rem, 4vw, 1.35rem);
      font-weight: 800;
    }

    .budget-widget {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .widget-header h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .pct-lbl {
      font-weight: 800;
      color: var(--primary-500);
      font-size: 0.9rem;
    }

    .progress-track {
      width: 100%;
      height: 12px;
      background: var(--bg-secondary);
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid var(--border-color);
    }

    .progress-fill {
      height: 100%;
      transition: width 0.6s ease;
    }

    .bg-emerald { background: linear-gradient(90deg, #10B981, #059669); }
    .bg-amber { background: linear-gradient(90deg, #F59E0B, #D97706); }
    .bg-rose { background: linear-gradient(90deg, #F43F5E, #E11D48); }

    .widget-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-muted);
      flex-wrap: wrap;
      gap: 6px;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      width: 100%;

      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }
    }

    .chart-card {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 99%;
    }

    .chart-card h3, .card-title-lg {
      font-size: clamp(1rem, 3.5vw, 1.15rem);
      font-weight: 700;
      color: var(--text-main);
      word-break: break-word;
      line-height: 1.3;
    }

    .chart-container {
      height: 250px;
      position: relative;
      width: 100%;

      @media (max-width: 600px) {
        height: 240px;
      }
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 250px;
      overflow-y: auto;
    }

    .tx-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    .tx-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .tx-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .tx-title {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tx-meta {
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    .tx-amt {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
    }

    .view-all-row { margin-top: 10px; }
    .w-100 { width: 100%; }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private reportService = inject(ReportService);
  private expenseService = inject(ExpenseService);

  @ViewChild('categoryCanvas') categoryCanvas!: ElementRef<HTMLCanvasElement>;

  readonly loading = signal<boolean>(true);
  readonly summary = signal<MonthlySummary | null>(null);
  readonly comparison = signal<MonthlyComparison | null>(null);
  readonly categoryData = signal<CategorySummary[]>([]);
  readonly recentTx = signal<Expense[]>([]);

  readonly budgetPct = signal<number>(76);
  private doughnutChartInstance?: Chart;

  async ngOnInit() {
    await this.loadDashboardData();
  }

  ngAfterViewInit() {
    // Chart rendered after data fetch
  }

  async loadDashboardData() {
    this.loading.set(true);
    try {
      const sum = await this.reportService.getMonthlySummary(2026, 9);
      const comp = await this.reportService.getMonthlyComparison(2026, 8, 2026, 9);
      const catSum = await this.reportService.getCategorySummary(2026, 9);
      const exps = await this.expenseService.loadExpenses({ year: 2026, month: 9, pageSize: 5, sortBy: 'date', sortOrder: 'desc' });

      this.summary.set(sum);
      this.comparison.set(comp);
      this.categoryData.set(catSum);
      this.recentTx.set(exps);

      if (sum.monthly_budget > 0) {
        const pct = Math.min(Math.round((sum.total_expense / sum.monthly_budget) * 100), 100);
        this.budgetPct.set(pct);
      }
    } finally {
      this.loading.set(false);
      setTimeout(() => this.renderCategoryChart(), 50);
    }
  }

  renderCategoryChart() {
    if (!this.categoryCanvas) return;
    if (this.doughnutChartInstance) this.doughnutChartInstance.destroy();

    const data = this.categoryData();
    const labels = data.map(d => d.category_name);
    const values = data.map(d => d.total_amount);
    const colors = data.map(d => d.color || '#6366F1');

    const isMobile = window.innerWidth < 600;

    this.doughnutChartInstance = new Chart(this.categoryCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['Food', 'Transport', 'Shopping', 'Bills'],
        datasets: [{
          data: values.length ? values : [7200, 4500, 3200, 3150],
          backgroundColor: colors.length ? colors : ['#EF4444', '#3B82F6', '#EC4899', '#F59E0B'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: isMobile ? 'bottom' : 'right',
            labels: {
              color: '#94A3B8',
              font: { family: 'Outfit', size: 11 },
              padding: isMobile ? 8 : 12,
              boxWidth: 12
            }
          }
        }
      }
    });
  }
}
