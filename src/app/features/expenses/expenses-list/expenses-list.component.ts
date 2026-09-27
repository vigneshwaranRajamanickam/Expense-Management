import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ExpenseService } from '../../../core/services/expense.service';
import { CategoryService } from '../../../core/services/category.service';
import { ExportService } from '../../../core/services/export.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Expense, ExpenseFilter } from '../../../core/models/app-models';

@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CurrencyInrPipe, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Expense Transactions</h1>
          <p class="page-desc">Track, filter, and manage your daily spending records</p>
        </div>
        <div class="header-actions">
          <button (click)="exportExcel()" class="btn btn-secondary btn-sm">
            📊 Export Excel
          </button>
          <a routerLink="/expenses/add" class="btn btn-primary">
            + New Expense
          </a>
        </div>
      </div>

      <!-- Filters & Toolbar -->
      <div class="glass-card toolbar-card">
        <div class="filter-row">
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onFilterChange()" 
              placeholder="Search by description or notes..."
              class="search-input"
            />
          </div>

          <select [(ngModel)]="selectedCategory" (ngModelChange)="onFilterChange()" class="filter-select">
            <option value="">All Categories</option>
            <option *ngFor="let c of categoryService.categories()" [value]="c.id">{{ c.name }}</option>
          </select>

          <select [(ngModel)]="selectedPaymentMethod" (ngModelChange)="onFilterChange()" class="filter-select">
            <option value="">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </select>

          <select [(ngModel)]="selectedMonth" (ngModelChange)="onFilterChange()" class="filter-select">
            <option [ngValue]="0">All Months</option>
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

          <select [(ngModel)]="sortBy" (ngModelChange)="onFilterChange()" class="filter-select">
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="description">Sort by Description</option>
          </select>

          <button (click)="toggleSortOrder()" class="btn btn-secondary btn-sm sort-btn">
            {{ sortOrder === 'asc' ? '⬆ Asc' : '⬇ Desc' }}
          </button>
        </div>

        <div class="summary-strip">
          <span class="total-label">Filtered Total:</span>
          <span class="total-value">{{ expenseService.totalFilteredAmount() | currencyInr }}</span>
          <span class="count-badge">({{ expenseService.totalCount() }} Transactions)</span>
        </div>
      </div>

      <!-- Loading Spinner -->
      <app-loading-spinner *ngIf="expenseService.loading()"></app-loading-spinner>

      <!-- Empty State -->
      <app-empty-state 
        *ngIf="!expenseService.loading() && expenseService.expenses().length === 0"
        title="No Expense Records Found"
        description="Try clearing your filters or add a new daily expense transaction."
        actionLabel="+ Add First Expense"
        (action)="navigateToAdd()"
      ></app-empty-state>

      <!-- Transactions List Container -->
      <div *ngIf="!expenseService.loading() && expenseService.expenses().length > 0" class="glass-card table-card">
        
        <!-- Mobile Card View (<768px) -->
        <div class="mobile-tx-list">
          <div *ngFor="let item of expenseService.expenses()" class="mobile-tx-card">
            <div class="tx-main">
              <div class="tx-left">
                <span class="cat-dot" [style.background]="item.categories?.color || '#6366F1'"></span>
                <div class="tx-info">
                  <span class="tx-title">{{ item.description }}</span>
                  <div class="tx-meta">
                    <span class="cat-name" [style.color]="item.categories?.color || '#6366F1'">
                      {{ item.categories?.name || 'Uncategorized' }}
                    </span>
                    <span class="meta-sep">•</span>
                    <span class="tx-date">{{ item.date }}</span>
                    <span class="meta-sep">•</span>
                    <span class="tx-method">{{ item.payment_method }}</span>
                  </div>
                  <span *ngIf="item.notes" class="tx-notes">{{ item.notes }}</span>
                </div>
              </div>

              <div class="tx-right">
                <span class="tx-amount">{{ item.amount | currencyInr }}</span>
                <div class="tx-actions">
                  <button (click)="editExpense(item.id)" class="btn-icon text-indigo" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button (click)="deleteExpense(item)" class="btn-icon text-rose" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop Table View (>=768px) -->
        <div class="desktop-table-view table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of expenseService.expenses()">
                <td>
                  <span class="date-pill">{{ item.date }}</span>
                </td>
                <td>
                  <span class="cat-pill" [style.background]="(item.categories?.color || '#6366F1') + '22'" [style.color]="item.categories?.color || '#6366F1'">
                    {{ item.categories?.name || 'Uncategorized' }}
                  </span>
                </td>
                <td>
                  <div class="desc-box">
                    <span class="desc-main">{{ item.description }}</span>
                    <span *ngIf="item.notes" class="desc-notes">{{ item.notes }}</span>
                  </div>
                </td>
                <td>
                  <span class="method-badge">{{ item.payment_method }}</span>
                </td>
                <td>
                  <span class="amount-val">{{ item.amount | currencyInr }}</span>
                </td>
                <td style="text-align: right;">
                  <div class="table-actions">
                    <button (click)="editExpense(item.id)" class="btn-icon text-indigo" title="Edit">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button (click)="deleteExpense(item)" class="btn-icon text-rose" title="Delete">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div class="pagination-bar">
          <button [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)" class="btn btn-secondary btn-sm">
            Previous
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ maxPage }}</span>
          <button [disabled]="currentPage >= maxPage" (click)="setPage(currentPage + 1)" class="btn btn-secondary btn-sm">
            Next
          </button>
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
      gap: 14px;
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

    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;

      @media (max-width: 600px) {
        width: 100%;
        .btn {
          flex: 1;
          justify-content: center;
          text-align: center;
        }
      }
    }

    .toolbar-card {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
    }

    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      width: 100%;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 220px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 8px 14px;
      color: var(--text-muted);

      @media (max-width: 600px) {
        width: 100%;
        min-width: 100%;
      }
    }

    .search-input {
      background: none;
      border: none;
      outline: none;
      color: var(--text-main);
      width: 100%;
      font-size: 0.88rem;
    }

    .filter-select {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 9px 12px;
      color: var(--text-main);
      font-size: 0.85rem;
      outline: none;
      cursor: pointer;

      @media (max-width: 600px) {
        width: 100%;
      }
    }

    .sort-btn {
      @media (max-width: 600px) {
        width: 100%;
      }
    }

    .summary-strip {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding-top: 14px;
      border-top: 1px solid var(--border-color);
    }

    .total-label { font-size: 0.88rem; font-weight: 600; color: var(--text-muted); }
    .total-value { font-size: clamp(1.1rem, 4vw, 1.35rem); font-weight: 800; color: var(--primary-500); }
    .count-badge { font-size: 0.8rem; color: var(--text-subtle); }

    .table-card { padding: 0; overflow: hidden; width: 100%; }

    /* Mobile Card View (<768px) */
    .mobile-tx-list {
      display: none;
      flex-direction: column;

      @media (max-width: 767px) {
        display: flex;
      }
    }

    .mobile-tx-card {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-card);

      &:last-child {
        border-bottom: none;
      }
    }

    .tx-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .tx-left {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      flex: 1;
    }

    .cat-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-top: 5px;
      flex-shrink: 0;
    }

    .tx-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .tx-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.3;
    }

    .tx-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.76rem;
      flex-wrap: wrap;
    }

    .cat-name { font-weight: 700; }
    .meta-sep { color: var(--text-subtle); opacity: 0.6; }
    .tx-date { color: var(--text-muted); }
    .tx-method { color: var(--text-subtle); }
    .tx-notes { font-size: 0.74rem; color: var(--text-muted); margin-top: 2px; font-style: italic; }

    .tx-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }

    .tx-amount {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text-main);
      white-space: nowrap;
    }

    .tx-actions {
      display: flex;
      gap: 4px;
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

    .date-pill { font-size: 0.82rem; color: var(--text-muted); font-weight: 600; white-space: nowrap; }
    .cat-pill { padding: 4px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; display: inline-block; white-space: nowrap; }
    .desc-box { display: flex; flex-direction: column; min-width: 140px; }
    .desc-main { font-weight: 600; color: var(--text-main); font-size: 0.88rem; }
    .desc-notes { font-size: 0.75rem; color: var(--text-subtle); }
    .method-badge { font-size: 0.78rem; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: var(--bg-secondary); color: var(--text-muted); border: 1px solid var(--border-color); white-space: nowrap; }
    .amount-val { font-weight: 700; color: var(--text-main); font-size: 0.95rem; white-space: nowrap; }
    .table-actions { display: flex; justify-content: flex-end; gap: 8px; }

    .btn-icon {
      background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px;
      transition: background 0.2s;
      &:hover { background: rgba(255,255,255,0.1); }
      &.text-indigo { color: #818CF8; }
      &.text-rose { color: #F43F5E; }
    }

    .pagination-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-top: 1px solid var(--border-color); background: var(--bg-card);
      flex-wrap: wrap; gap: 10px;
    }
    
    .page-info { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
  `]
})
export class ExpensesListComponent implements OnInit {
  expenseService = inject(ExpenseService);
  categoryService = inject(CategoryService);
  private exportService = inject(ExportService);
  private router = inject(Router);

  searchQuery = '';
  selectedCategory = '';
  selectedPaymentMethod = '';
  selectedMonth = 0;
  sortBy: 'date' | 'amount' | 'description' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  currentPage = 1;
  pageSize = 10;

  get maxPage(): number {
    return Math.ceil(this.expenseService.totalCount() / this.pageSize) || 1;
  }

  ngOnInit() {
    this.categoryService.loadCategories();
    this.fetchExpenses();
  }

  fetchExpenses() {
    const filter: ExpenseFilter = {
      search: this.searchQuery,
      category_id: this.selectedCategory || undefined,
      payment_method: this.selectedPaymentMethod || undefined,
      year: 2026,
      month: this.selectedMonth > 0 ? this.selectedMonth : undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      page: this.currentPage,
      pageSize: this.pageSize
    };
    this.expenseService.loadExpenses(filter);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.fetchExpenses();
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.fetchExpenses();
  }

  setPage(p: number) {
    if (p >= 1 && p <= this.maxPage) {
      this.currentPage = p;
      this.fetchExpenses();
    }
  }

  navigateToAdd() {
    this.router.navigate(['/expenses/add']);
  }

  editExpense(id: string) {
    this.router.navigate(['/expenses', id, 'edit']);
  }

  async deleteExpense(exp: Expense) {
    if (confirm(`Delete expense "${exp.description}" (₹${exp.amount})?`)) {
      await this.expenseService.deleteExpense(exp.id);
    }
  }

  exportExcel() {
    this.exportService.exportExpensesToExcel(this.expenseService.expenses());
  }
}
