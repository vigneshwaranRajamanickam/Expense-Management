import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/app-models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Expense Categories</h1>
          <p class="page-desc">Organize and manage system and custom spending categories</p>
        </div>
        <button (click)="openAddModal()" class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New Category
        </button>
      </div>

      <app-loading-spinner *ngIf="categoryService.loading()"></app-loading-spinner>

      <div *ngIf="!categoryService.loading()" class="categories-grid">
        <div *ngFor="let cat of categoryService.categories()" class="glass-card category-card interactive">
          <div class="cat-header">
            <div class="cat-icon-badge" [style.background]="cat.color + '22'" [style.color]="cat.color">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path></svg>
            </div>
            <span class="badge" [ngClass]="cat.is_active ? 'badge-success' : 'badge-warning'">
              {{ cat.is_active ? 'Active' : 'Disabled' }}
            </span>
          </div>

          <div class="cat-body">
            <h3 class="cat-name">{{ cat.name }}</h3>
          </div>

          <div class="cat-actions">
            <button (click)="toggleActive(cat)" class="btn btn-secondary btn-sm">
              {{ cat.is_active ? 'Disable' : 'Enable' }}
            </button>
            <button (click)="deleteCat(cat)" class="btn btn-danger btn-sm">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Add Category Modal -->
      <div *ngIf="showModal()" class="modal-backdrop">
        <div class="glass-card modal-content">
          <div class="modal-header">
            <h3>Create Custom Category</h3>
            <button (click)="closeModal()" class="close-btn">&times;</button>
          </div>
          <form [formGroup]="catForm" (ngSubmit)="onSubmitCat()">
            <div class="form-group">
              <label>Category Name</label>
              <input type="text" formControlName="name" class="form-control" placeholder="e.g. Investment, Pets, Hobbies" />
            </div>

            <div class="form-group">
              <label>Accent Color</label>
              <input type="color" formControlName="color" class="color-picker" />
            </div>

            <div class="modal-footer mt-3">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" [disabled]="catForm.invalid" class="btn btn-primary">Save Category</button>
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

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 18px;
    }
    .category-card {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .cat-header { display: flex; align-items: center; justify-content: space-between; }
    .cat-icon-badge {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .cat-name { font-size: 1.05rem; font-weight: 700; color: var(--text-main); }
    .cat-actions { display: flex; gap: 8px; margin-top: auto; }

    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 200;
    }
    .modal-content { width: 100%; max-width: 400px; padding: 24px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
    .color-picker { width: 100%; height: 42px; border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; background: none; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; }
    .mt-3 { margin-top: 16px; }
  `]
})
export class CategoriesComponent implements OnInit {
  categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  readonly showModal = signal<boolean>(false);

  catForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    color: ['#6366F1']
  });

  ngOnInit() {
    this.categoryService.loadCategories();
  }

  openAddModal() {
    this.catForm.reset({ color: '#6366F1' });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async onSubmitCat() {
    if (this.catForm.invalid) return;
    const { name, color } = this.catForm.value;
    await this.categoryService.addCategory(name, 'tag', color);
    this.closeModal();
  }

  async toggleActive(cat: Category) {
    await this.categoryService.updateCategory(cat.id, { is_active: !cat.is_active });
  }

  async deleteCat(cat: Category) {
    if (confirm(`Delete category "${cat.name}"?`)) {
      await this.categoryService.deleteCategory(cat.id);
    }
  }
}
