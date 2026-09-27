import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ExpenseService } from '../../../core/services/expense.service';
import { CategoryService } from '../../../core/services/category.service';
import { PaymentMethod } from '../../../core/models/app-models';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-wrapper">
      <div class="glass-card form-card">
        <div class="form-header">
          <h2 class="form-title">{{ isEditMode() ? 'Edit Expense Record' : 'Record New Expense' }}</h2>
          <p class="form-subtitle">Enter transaction details below</p>
        </div>

        <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group flex-1">
              <label for="date">Transaction Date *</label>
              <input type="date" id="date" formControlName="date" class="form-control" />
              <span *ngIf="expenseForm.get('date')?.touched && expenseForm.get('date')?.invalid" class="error-msg">
                Valid date is required
              </span>
            </div>

            <div class="form-group flex-1">
              <label for="category_id">Category *</label>
              <select id="category_id" formControlName="category_id" class="form-control">
                <option value="">-- Select Category --</option>
                <option *ngFor="let c of categoryService.categories()" [value]="c.id">{{ c.name }}</option>
              </select>
              <span *ngIf="expenseForm.get('category_id')?.touched && expenseForm.get('category_id')?.invalid" class="error-msg">
                Category is required
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description / Payee *</label>
            <input 
              type="text" 
              id="description" 
              formControlName="description" 
              class="form-control" 
              placeholder="e.g. Swiggy Lunch, Shell Petrol Refill, Rent"
            />
            <span *ngIf="expenseForm.get('description')?.touched && expenseForm.get('description')?.invalid" class="error-msg">
              Description is required
            </span>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="amount">Amount (INR ₹) *</label>
              <input 
                type="number" 
                id="amount" 
                formControlName="amount" 
                class="form-control" 
                placeholder="0.00" 
                step="0.01"
              />
              <span *ngIf="expenseForm.get('amount')?.touched && expenseForm.get('amount')?.invalid" class="error-msg">
                Amount must be greater than 0
              </span>
            </div>

            <div class="form-group flex-1">
              <label for="payment_method">Payment Method *</label>
              <select id="payment_method" formControlName="payment_method" class="form-control">
                <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer / NetBanking</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="notes">Additional Notes (Optional)</label>
            <textarea 
              id="notes" 
              formControlName="notes" 
              class="form-control textarea" 
              rows="3" 
              placeholder="Add warranty info, vendor names, or receipt details..."
            ></textarea>
          </div>

          <div class="form-actions mt-4">
            <a routerLink="/expenses" class="btn btn-secondary">Cancel</a>
            <button type="submit" [disabled]="expenseForm.invalid || expenseService.loading()" class="btn btn-primary">
              <span *ngIf="!expenseService.loading()">{{ isEditMode() ? 'Update Expense' : 'Save Expense' }}</span>
              <span *ngIf="expenseService.loading()">Saving...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-wrapper {
      display: flex; justify-content: center; align-items: center; padding: 10px 0; width: 100%;
    }
    .form-card {
      width: 100%; max-width: 620px; padding: 28px 32px;
      @media (max-width: 600px) {
        padding: 18px 16px;
      }
    }
    .form-header { margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 14px; }
    .form-title { font-size: clamp(1.2rem, 4vw, 1.4rem); font-weight: 800; color: var(--text-main); }
    .form-subtitle { font-size: 0.85rem; color: var(--text-muted); }
    
    .form-row {
      display: flex; gap: 16px;
      @media (max-width: 600px) {
        flex-direction: column;
        gap: 12px;
      }
    }
    .flex-1 { flex: 1; }
    .textarea { resize: vertical; }
    .error-msg { font-size: 0.75rem; color: #F43F5E; margin-top: 4px; }
    
    .form-actions {
      display: flex; justify-content: flex-end; gap: 12px;
      @media (max-width: 600px) {
        .btn { flex: 1; justify-content: center; text-align: center; }
      }
    }
    .mt-4 { margin-top: 24px; }
  `]
})
export class ExpenseFormComponent implements OnInit {
  expenseService = inject(ExpenseService);
  categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly isEditMode = signal<boolean>(false);
  private targetId: string | null = null;

  expenseForm: FormGroup = this.fb.group({
    date: [new Date().toISOString().substring(0, 10), [Validators.required]],
    category_id: ['', [Validators.required]],
    description: ['', [Validators.required]],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    payment_method: ['UPI', [Validators.required]],
    notes: ['']
  });

  async ngOnInit() {
    await this.categoryService.loadCategories();

    this.targetId = this.route.snapshot.paramMap.get('id');
    if (this.targetId) {
      this.isEditMode.set(true);
      const existing = await this.expenseService.getExpenseById(this.targetId);
      if (existing) {
        this.expenseForm.patchValue({
          date: existing.date,
          category_id: existing.category_id || '',
          description: existing.description,
          amount: existing.amount,
          payment_method: existing.payment_method,
          notes: existing.notes || ''
        });
      }
    }
  }

  async onSubmit() {
    if (this.expenseForm.invalid) return;

    const val = this.expenseForm.value;
    if (this.isEditMode() && this.targetId) {
      const ok = await this.expenseService.updateExpense(this.targetId, val);
      if (ok) this.router.navigate(['/expenses']);
    } else {
      const res = await this.expenseService.addExpense(val);
      if (res) this.router.navigate(['/expenses']);
    }
  }
}
