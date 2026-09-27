import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../core/services/budget.service';
import { CategoryService } from '../../core/services/category.service';
import { ExpenseService } from '../../core/services/expense.service';
import { ReportService } from '../../core/services/report.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { Category, CategoryBudget } from '../../core/models/app-models';

interface CategoryBudgetProgress {
  category_id: string;
  category_name: string;
  color?: string;
  budget_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage: number;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInrPipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Budget Management</h1>
          <p class="page-desc">Set overall monthly limits and category-level budget targets</p>
        </div>

        <div class="month-selector">
          <select [(ngModel)]="year" (ngModelChange)="loadBudgetData()" class="filter-select">
            <option [ngValue]="2026">2026</option>
            <option [ngValue]="2025">2025</option>
          </select>
          <select [(ngModel)]="month" (ngModelChange)="loadBudgetData()" class="filter-select">
            <option [ngValue]="8">August</option>
            <option [ngValue]="9">September</option>
            <option [ngValue]="10">October</option>
          </select>
        </div>
      </div>

      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <div *ngIf="!loading()" class="budget-body">
        <!-- Overall Monthly Budget Setup Card -->
        <div class="glass-card overall-budget-card">
          <div class="card-left">
            <span class="card-tag">Overall Monthly Budget Target</span>
            <div class="amount-editor" *ngIf="isEditingOverall()">
              <input type="number" [(ngModel)]="overallInput" class="form-control" style="max-width: 160px;" />
              <button (click)="saveOverallBudget()" class="btn btn-primary btn-sm">Save</button>
              <button (click)="isEditingOverall.set(false)" class="btn btn-secondary btn-sm">Cancel</button>
            </div>
            <div class="amount-display" *ngIf="!isEditingOverall()">
              <h2 class="overall-val">{{ overallBudget() | currencyInr }}</h2>
              <button (click)="isEditingOverall.set(true)" class="btn btn-secondary btn-sm edit-btn">✏ Edit Budget</button>
            </div>
          </div>

          <div class="card-right">
            <div class="meta-item">
              <span class="meta-lbl">Spent so far:</span>
              <span class="meta-val">{{ overallSpent() | currencyInr }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-lbl">Remaining balance:</span>
              <span class="meta-val text-emerald">{{ overallRemaining() | currencyInr }}</span>
            </div>
          </div>
        </div>

        <!-- Overall Budget Progress Bar -->
        <div class="glass-card overall-progress-card">
          <div class="hdr">
            <span>Utilization Progress</span>
            <span class="pct font-bold" [ngClass]="overallPct() >= 100 ? 'text-rose' : (overallPct() >= 80 ? 'text-amber' : 'text-emerald')">
              {{ overallPct() }}%
            </span>
          </div>
          <div class="progress-track">
            <div 
              class="progress-fill" 
              [style.width]="Math.min(overallPct(), 100) + '%'"
              [ngClass]="overallPct() >= 100 ? 'bg-rose' : (overallPct() >= 80 ? 'bg-amber' : 'bg-emerald')"
            ></div>
          </div>

          <div *ngIf="overallPct() >= 100" class="alert alert-danger mt-2">
            ⚠️ <strong>Budget Exceeded!</strong> You have spent {{ overallSpent() - overallBudget() | currencyInr }} over your monthly limit.
          </div>
          <div *ngIf="overallPct() >= 80 && overallPct() < 100" class="alert alert-warning mt-2">
            ⚡ <strong>Budget Warning!</strong> You have consumed over 80% of your allocated monthly spending cap.
          </div>
        </div>

        <!-- Category Budgets Section -->
        <div class="glass-card cat-budgets-card">
          <div class="section-hdr">
            <div>
              <h3>Category-Level Budgets</h3>
              <p class="sub">Set individual budget targets for Food, Rent, Transport, Shopping, etc.</p>
            </div>
          </div>

          <div class="cat-grid mt-3">
            <div *ngFor="let item of categoryBudgetsList()" class="cat-budget-box glass-card">
              <div class="cb-header">
                <span class="cat-pill" [style.background]="(item.color || '#6366F1') + '22'" [style.color]="item.color || '#6366F1'">
                  {{ item.category_name }}
                </span>
                <span class="badge" [ngClass]="item.percentage >= 100 ? 'badge-danger' : (item.percentage >= 80 ? 'badge-warning' : 'badge-success')">
                  {{ item.percentage }}%
                </span>
              </div>

              <div class="cb-values">
                <div class="val-col">
                  <span class="lbl">Budget Limit</span>
                  <input 
                    type="number" 
                    [(ngModel)]="item.budget_amount" 
                    (blur)="saveCategoryBudget(item)" 
                    class="form-control form-control-sm"
                  />
                </div>
                <div class="val-col">
                  <span class="lbl">Spent</span>
                  <span class="val font-bold">{{ item.spent_amount | currencyInr }}</span>
                </div>
                <div class="val-col">
                  <span class="lbl">Remaining</span>
                  <span class="val font-bold" [ngClass]="item.remaining_amount >= 0 ? 'text-emerald' : 'text-rose'">
                    {{ item.remaining_amount | currencyInr }}
                  </span>
                </div>
              </div>

              <div class="progress-track mini">
                <div 
                  class="progress-fill" 
                  [style.width]="Math.min(item.percentage, 100) + '%'"
                  [style.background]="item.percentage >= 100 ? '#F43F5E' : (item.percentage >= 80 ? '#F59E0B' : item.color || '#10B981')"
                ></div>
              </div>
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

    .month-selector {
      display: flex;
      gap: 10px;
      
      @media (max-width: 600px) {
        width: 100%;
        select {
          flex: 1;
        }
      }
    }

    .filter-select {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 9px 12px;
      color: var(--text-main);
      font-weight: 600;
      outline: none;
    }

    .budget-body {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
    }

    .overall-budget-card {
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      width: 100%;

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
        padding: 16px;
      }
    }

    .card-left {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .card-tag { font-size: 0.78rem; font-weight: 700; color: var(--primary-500); text-transform: uppercase; }
    
    .amount-display {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .overall-val {
      font-size: clamp(1.4rem, 5vw, 2.2rem);
      font-weight: 800;
      color: var(--text-main);
    }

    .amount-editor {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .card-right {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;

      @media (max-width: 768px) {
        width: 100%;
        justify-content: space-between;
        border-top: 1px solid var(--border-color);
        padding-top: 12px;
      }
    }

    .meta-item { display: flex; flex-direction: column; gap: 4px; }
    .meta-lbl { font-size: 0.78rem; color: var(--text-muted); }
    .meta-val { font-size: clamp(1.05rem, 4vw, 1.3rem); font-weight: 800; color: var(--text-main); }
    
    .text-emerald { color: #10B981; }
    .text-amber { color: #F59E0B; }
    .text-rose { color: #F43F5E; }
    .font-bold { font-weight: 800; }

    .overall-progress-card {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }

    .hdr { display: flex; justify-content: space-between; font-weight: 700; color: var(--text-main); }
    
    .progress-track {
      width: 100%;
      height: 12px;
      background: var(--bg-secondary);
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid var(--border-color);

      &.mini { height: 8px; margin-top: 10px; }
    }

    .progress-fill { height: 100%; transition: width 0.5s ease; }
    
    .bg-emerald { background: linear-gradient(90deg, #10B981, #059669); }
    .bg-amber { background: linear-gradient(90deg, #F59E0B, #D97706); }
    .bg-rose { background: linear-gradient(90deg, #F43F5E, #E11D48); }

    .alert {
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      &.alert-danger { background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #F43F5E; }
      &.alert-warning { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #F59E0B; }
    }

    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 16px; }

    .cat-budgets-card { padding: 20px; width: 100%; }
    .section-hdr h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-main); }
    .sub { font-size: 0.82rem; color: var(--text-muted); }

    .cat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      width: 100%;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .cat-budget-box {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }

    .cb-header { display: flex; justify-content: space-between; align-items: center; }
    .cat-pill { padding: 4px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; }
    
    .cb-values {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }

    .val-col { display: flex; flex-direction: column; gap: 4px; min-width: 70px; }
    .lbl { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; }
    .val { font-size: 0.88rem; }
    .form-control-sm { padding: 4px 8px; font-size: 0.85rem; max-width: 90px; }
  `]
})
export class BudgetComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private expenseService = inject(ExpenseService);
  private reportService = inject(ReportService);

  Math = Math;
  year = 2026;
  month = 9; // Sept 2026

  readonly loading = signal<boolean>(true);
  readonly overallBudget = signal<number>(30000);
  readonly overallSpent = signal<number>(22850);
  readonly overallRemaining = signal<number>(7150);
  readonly overallPct = signal<number>(76);

  readonly isEditingOverall = signal<boolean>(false);
  overallInput = 30000;

  readonly categoryBudgetsList = signal<CategoryBudgetProgress[]>([]);

  ngOnInit() {
    this.loadBudgetData();
  }

  async loadBudgetData() {
    this.loading.set(true);
    try {
      const budgetObj = await this.budgetService.loadMonthlyBudget(this.year, this.month);
      const catBudgets = await this.budgetService.loadCategoryBudgets(this.year, this.month);
      const categories = await this.categoryService.loadCategories();
      const exps = await this.expenseService.loadExpenses({ year: this.year, month: this.month });

      const spentTotal = exps.reduce((sum, e) => sum + Number(e.amount), 0);
      const budgetTotal = budgetObj?.amount || 30000;
      const remaining = budgetTotal - spentTotal;
      const pct = budgetTotal > 0 ? Math.round((spentTotal / budgetTotal) * 100) : 0;

      this.overallBudget.set(budgetTotal);
      this.overallInput = budgetTotal;
      this.overallSpent.set(spentTotal);
      this.overallRemaining.set(remaining);
      this.overallPct.set(pct);

      // Build Category Progress List
      const catProgressList: CategoryBudgetProgress[] = categories.map(c => {
        const foundCb = catBudgets.find(cb => cb.category_id === c.id);
        const bAmount = foundCb?.amount || 0;

        const catSpent = exps
          .filter(e => e.category_id === c.id)
          .reduce((sum, e) => sum + Number(e.amount), 0);

        const rem = bAmount - catSpent;
        const cPct = bAmount > 0 ? Math.round((catSpent / bAmount) * 100) : 0;

        return {
          category_id: c.id,
          category_name: c.name,
          color: c.color,
          budget_amount: bAmount,
          spent_amount: catSpent,
          remaining_amount: rem,
          percentage: cPct
        };
      });

      this.categoryBudgetsList.set(catProgressList);
    } finally {
      this.loading.set(false);
    }
  }

  async saveOverallBudget() {
    if (this.overallInput >= 0) {
      await this.budgetService.setMonthlyBudget(this.year, this.month, this.overallInput);
      this.isEditingOverall.set(false);
      await this.loadBudgetData();
    }
  }

  async saveCategoryBudget(item: CategoryBudgetProgress) {
    await this.budgetService.setCategoryBudget(item.category_id, this.year, this.month, item.budget_amount);
    await this.loadBudgetData();
  }
}
