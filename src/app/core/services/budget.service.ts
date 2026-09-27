import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CategoryService } from './category.service';
import { Budget, CategoryBudget } from '../models/app-models';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private supabase = inject(SupabaseService);
  private categoryService = inject(CategoryService);

  readonly monthlyBudget = signal<Budget | null>(null);
  readonly categoryBudgets = signal<CategoryBudget[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private getStoredBudgetsKey(userId: string) { return `pem_budgets_${userId}`; }
  private getStoredCategoryBudgetsKey(userId: string) { return `pem_cat_budgets_${userId}`; }

  async loadMonthlyBudget(year: number, month: number): Promise<Budget | null> {
    this.loading.set(true);
    const userId = this.supabase.currentUser()?.id || 'demo-user-12345';

    if (this.supabase.isDemoMode()) {
      const key = this.getStoredBudgetsKey(userId);
      const raw = localStorage.getItem(key);
      let budgets: Budget[] = raw ? JSON.parse(raw) : [];
      let found = budgets.find(b => b.year === year && b.month === month);

      if (!found && year === 2026 && month === 9) {
        // Target default: ₹30,000 for Sept 2026
        found = { id: 'b-sept-2026', user_id: userId, year: 2026, month: 9, amount: 30000.00 };
        budgets.push(found);
        localStorage.setItem(key, JSON.stringify(budgets));
      }

      this.monthlyBudget.set(found || null);
      this.loading.set(false);
      return found || null;
    }

    try {
      const { data, error } = await this.supabase.client
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();

      if (error) throw error;
      this.monthlyBudget.set(data as Budget || null);
      return data as Budget || null;
    } catch (err: any) {
      this.error.set(err.message);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async setMonthlyBudget(year: number, month: number, amount: number): Promise<boolean> {
    const userId = this.supabase.currentUser()?.id || 'demo-user-12345';

    if (this.supabase.isDemoMode()) {
      const key = this.getStoredBudgetsKey(userId);
      const raw = localStorage.getItem(key);
      let budgets: Budget[] = raw ? JSON.parse(raw) : [];
      const idx = budgets.findIndex(b => b.year === year && b.month === month);

      if (idx !== -1) {
        budgets[idx].amount = amount;
        budgets[idx].updated_at = new Date().toISOString();
      } else {
        budgets.push({
          id: 'budget-' + Date.now(),
          user_id: userId,
          year,
          month,
          amount
        });
      }

      localStorage.setItem(key, JSON.stringify(budgets));
      await this.loadMonthlyBudget(year, month);
      return true;
    }

    try {
      const { error } = await this.supabase.client
        .from('budgets')
        .upsert({
          user_id: userId,
          year,
          month,
          amount,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,month,year' });

      if (error) throw error;
      await this.loadMonthlyBudget(year, month);
      return true;
    } catch (err: any) {
      this.error.set(err.message);
      return false;
    }
  }

  async loadCategoryBudgets(year: number, month: number): Promise<CategoryBudget[]> {
    this.loading.set(true);
    const userId = this.supabase.currentUser()?.id || 'demo-user-12345';
    const categories = this.categoryService.categories();

    if (this.supabase.isDemoMode()) {
      const key = this.getStoredCategoryBudgetsKey(userId);
      const raw = localStorage.getItem(key);
      let cbList: CategoryBudget[] = raw ? JSON.parse(raw) : [];

      if (cbList.length === 0 && year === 2026 && month === 9) {
        const foodCat = categories.find(c => c.name === 'Food');
        if (foodCat) {
          cbList.push({
            id: 'cb-food-sept',
            user_id: userId,
            category_id: foodCat.id,
            year: 2026,
            month: 9,
            amount: 8000.00
          });
          localStorage.setItem(key, JSON.stringify(cbList));
        }
      }

      const filtered = cbList.filter(cb => cb.year === year && cb.month === month).map(cb => ({
        ...cb,
        categories: categories.find(c => c.id === cb.category_id)
      }));

      this.categoryBudgets.set(filtered);
      this.loading.set(false);
      return filtered;
    }

    try {
      const { data, error } = await this.supabase.client
        .from('category_budgets')
        .select('*, categories(*)')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('month', month);

      if (error) throw error;
      const list = (data as CategoryBudget[]) || [];
      this.categoryBudgets.set(list);
      return list;
    } catch (err: any) {
      this.error.set(err.message);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async setCategoryBudget(categoryId: string, year: number, month: number, amount: number): Promise<boolean> {
    const userId = this.supabase.currentUser()?.id || 'demo-user-12345';

    if (this.supabase.isDemoMode()) {
      const key = this.getStoredCategoryBudgetsKey(userId);
      const raw = localStorage.getItem(key);
      let list: CategoryBudget[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(cb => cb.category_id === categoryId && cb.year === year && cb.month === month);

      if (idx !== -1) {
        if (amount <= 0) {
          list.splice(idx, 1);
        } else {
          list[idx].amount = amount;
        }
      } else if (amount > 0) {
        list.push({
          id: 'cb-' + Date.now(),
          user_id: userId,
          category_id: categoryId,
          year,
          month,
          amount
        });
      }

      localStorage.setItem(key, JSON.stringify(list));
      await this.loadCategoryBudgets(year, month);
      return true;
    }

    try {
      if (amount <= 0) {
        await this.supabase.client
          .from('category_budgets')
          .delete()
          .eq('user_id', userId)
          .eq('category_id', categoryId)
          .eq('year', year)
          .eq('month', month);
      } else {
        await this.supabase.client
          .from('category_budgets')
          .upsert({
            user_id: userId,
            category_id: categoryId,
            year,
            month,
            amount,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,category_id,month,year' });
      }

      await this.loadCategoryBudgets(year, month);
      return true;
    } catch (err: any) {
      this.error.set(err.message);
      return false;
    }
  }
}
