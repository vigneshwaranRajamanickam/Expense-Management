import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecurringService } from '../../core/services/recurring.service';
import { CategoryService } from '../../core/services/category.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { RecurringExpense } from '../../core/models/app-models';

@Component({
  selector: 'app-recurring-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyInrPipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Recurring Expenses</h1>
          <p class="page-desc">Automate fixed monthly bills, rent, EMI, and subscriptions</p>
        </div>
        <div class="header-actions">
          <button (click)="processNow()" class="btn btn-secondary">
            ⚡ Process Due Bills Now
          </button>
          <button (click)="openModal()" class="btn btn-primary">
            + New Recurring Expense
          </button>
        </div>
      </div>

      <app-loading-spinner *ngIf="recurringService.loading()"></app-loading-spinner>

      <div *ngIf="!recurringService.loading()" class="glass-card table-card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Frequency</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of recurringService.recurringExpenses()">
                <td class="font-bold">{{ item.description }}</td>
                <td>
                  <span class="cat-pill" [style.background]="(item.categories?.color || '#6366F1') + '22'" [style.color]="item.categories?.color || '#6366F1'">
                    {{ item.categories?.name || 'Uncategorized' }}
                  </span>
                </td>
                <td>
                  <span class="freq-badge">{{ item.frequency }}</span>
                </td>
                <td>{{ item.payment_method }}</td>
                <td class="font-bold">{{ item.amount | currencyInr }}</td>
                <td>
                  <button (click)="toggleActive(item)" class="badge" [ngClass]="item.is_active ? 'badge-success' : 'badge-warning'" style="border:none; cursor:pointer;">
                    {{ item.is_active ? 'Active' : 'Paused' }}
                  </button>
                </td>
                <td style="text-align: right;">
                  <button (click)="deleteItem(item)" class="btn btn-danger btn-sm">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Form -->
      <div *ngIf="showModal()" class="modal-backdrop">
        <div class="glass-card modal-content">
          <div class="modal-header">
            <h3>Add Recurring Expense</h3>
            <button (click)="closeModal()" class="close-btn">&times;</button>
          </div>
          <form [formGroup]="recForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Description *</label>
              <input type="text" formControlName="description" class="form-control" placeholder="e.g. Netflix Subscription, House Rent" />
            </div>

            <div class="form-group">
              <label>Category *</label>
              <select formControlName="category_id" class="form-control">
                <option value="">-- Select Category --</option>
                <option *ngFor="let c of categoryService.categories()" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Amount (INR) *</label>
                <input type="number" formControlName="amount" class="form-control" placeholder="0.00" />
              </div>
              <div class="form-group flex-1">
                <label>Frequency *</label>
                <select formControlName="frequency" class="form-control">
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Start Date *</label>
                <input type="date" formControlName="start_date" class="form-control" />
              </div>
              <div class="form-group flex-1">
                <label>Payment Method</label>
                <select formControlName="payment_method" class="form-control">
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div class="modal-footer mt-3">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" [disabled]="recForm.invalid" class="btn btn-primary">Save Recurring Expense</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.6rem; font-weight: 800; color: var(--text-main); }
    .page-desc { font-size: 0.85rem; color: var(--text-muted); }
    .header-actions { display: flex; gap: 12px; }

    .table-card { padding: 0; overflow: hidden; }
    .font-bold { font-weight: 700; color: var(--text-main); }
    .cat-pill { padding: 4px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; }
    .freq-badge { font-size: 0.8rem; font-weight: 600; color: var(--primary-500); background: rgba(99, 102, 241, 0.12); padding: 3px 8px; border-radius: 6px; }

    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 200;
    }
    .modal-content { width: 100%; max-width: 480px; padding: 28px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; }
    .mt-3 { margin-top: 16px; }
  `]
})
export class RecurringExpensesComponent implements OnInit {
  recurringService = inject(RecurringService);
  categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  readonly showModal = signal<boolean>(false);

  recForm: FormGroup = this.fb.group({
    description: ['', [Validators.required]],
    category_id: ['', [Validators.required]],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    frequency: ['Monthly', [Validators.required]],
    payment_method: ['UPI'],
    start_date: [new Date().toISOString().substring(0, 10), [Validators.required]]
  });

  ngOnInit() {
    this.categoryService.loadCategories();
    this.recurringService.loadRecurringExpenses();
  }

  openModal() {
    this.recForm.reset({
      frequency: 'Monthly',
      payment_method: 'UPI',
      start_date: new Date().toISOString().substring(0, 10)
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async onSubmit() {
    if (this.recForm.invalid) return;
    await this.recurringService.addRecurringExpense({
      ...this.recForm.value,
      is_active: true
    });
    this.closeModal();
  }

  async toggleActive(item: RecurringExpense) {
    await this.recurringService.toggleActive(item.id, !item.is_active);
  }

  async deleteItem(item: RecurringExpense) {
    if (confirm(`Delete recurring expense "${item.description}"?`)) {
      await this.recurringService.deleteRecurringExpense(item.id);
    }
  }

  async processNow() {
    const created = await this.recurringService.processDueRecurringExpenses();
    alert(`Successfully processed recurring items! Created ${created} new expense records.`);
  }
}
