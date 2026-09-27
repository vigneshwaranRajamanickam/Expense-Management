import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CategoryService } from './category.service';
import { ExpenseService } from './expense.service';
import { RecurringExpense } from '../models/app-models';

@Injectable({
  providedIn: 'root'
})
export class RecurringService {
  private supabase = inject(SupabaseService);
  private categoryService = inject(CategoryService);
  private expenseService = inject(ExpenseService);

  readonly recurringExpenses = signal<RecurringExpense[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private getStoredKey(userId: string) { return `pem_recurring_${userId}`; }

  async loadRecurringExpenses(): Promise<RecurringExpense[]> {
    this.loading.set(true);
    const userId = this.supabase.currentUser()?.id || 'demo-user-12345';
    const categories = this.categoryService.categories();

    if (this.supabase.isDemoMode()) {
      const key = this.getStoredKey(userId);
      const raw = localStorage.getItem(key);
      let list: RecurringExpense[] = raw ? JSON.parse(raw) : [];

      if (list.length === 0) {
        const getCatId = (name: string) => categories.find(c => c.name === name)?.id;
        list = [
          {
            id: 'rec-1',
            user_id: userId,
            category_id: getCatId('Rent'),
            description: 'House Rent',
            amount: 12000.00,
            payment_method: 'Bank Transfer',
            frequency: 'Monthly',
            start_date: '2026-01-01',
            is_active: true
          },
          {
            id: 'rec-2',
            user_id: userId,
            category_id: getCatId('Mobile & Internet'),
            description: 'Airtel Broadband Postpaid',
            amount: 1199.00,
            payment_method: 'UPI',
            frequency: 'Monthly',
            start_date: '2026-01-01',
            is_active: true
          },
          {
            id: 'rec-3',
            user_id: userId,
            category_id: getCatId('EMI / Loan'),
            description: 'Car Loan EMI',
            amount: 4500.00,
            payment_method: 'Bank Transfer',
            frequency: 'Monthly',
            start_date: '2026-01-05',
            is_active: true
          }
        ];
        localStorage.setItem(key, JSON.stringify(list));
      }

      const withCats = list.map(item => ({
        ...item,
        categories: categories.find(c => c.id === item.category_id)
      }));

      this.recurringExpenses.set(withCats);
      this.loading.set(false);
      return withCats;
    }

    try {
      const { data, error } = await this.supabase.client
        .from('recurring_expenses')
        .select('*, categories(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const result = (data as RecurringExpense[]) || [];
      this.recurringExpenses.set(result);
      return result;
    } catch (err: any) {
      this.error.set(err.message);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async addRecurringExpense(item: Omit<RecurringExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<RecurringExpense | null> {
    const userId = this.supabase.currentUser()?.id || 'demo-user-12345';

    if (this.supabase.isDemoMode()) {
      const key = this.getStoredKey(userId);
      const raw = localStorage.getItem(key);
      const list: RecurringExpense[] = raw ? JSON.parse(raw) : [];

      const newItem: RecurringExpense = {
        ...item,
        id: 'rec-' + Date.now(),
        user_id: userId,
        created_at: new Date().toISOString()
      };
      list.push(newItem);
      localStorage.setItem(key, JSON.stringify(list));
      await this.loadRecurringExpenses();
      return newItem;
    }

    try {
      const { data, error } = await this.supabase.client
        .from('recurring_expenses')
        .insert([{ ...item, user_id: userId }])
        .select('*, categories(*)')
        .single();

      if (error) throw error;
      await this.loadRecurringExpenses();
      return data as RecurringExpense;
    } catch (err: any) {
      this.error.set(err.message);
      return null;
    }
  }

  async toggleActive(id: string, is_active: boolean): Promise<boolean> {
    const userId = this.supabase.currentUser()?.id || 'demo-user-12345';

    if (this.supabase.isDemoMode()) {
      const key = this.getStoredKey(userId);
      const raw = localStorage.getItem(key);
      let list: RecurringExpense[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx].is_active = is_active;
        localStorage.setItem(key, JSON.stringify(list));
        await this.loadRecurringExpenses();
        return true;
      }
      return false;
    }

    try {
      const { error } = await this.supabase.client
        .from('recurring_expenses')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      await this.loadRecurringExpenses();
      return true;
    } catch (err: any) {
      this.error.set(err.message);
      return false;
    }
  }

  async deleteRecurringExpense(id: string): Promise<boolean> {
    const userId = this.supabase.currentUser()?.id || 'demo-user-12345';

    if (this.supabase.isDemoMode()) {
      const key = this.getStoredKey(userId);
      const raw = localStorage.getItem(key);
      let list: RecurringExpense[] = raw ? JSON.parse(raw) : [];
      list = list.filter(r => r.id !== id);
      localStorage.setItem(key, JSON.stringify(list));
      await this.loadRecurringExpenses();
      return true;
    }

    try {
      const { error } = await this.supabase.client
        .from('recurring_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      await this.loadRecurringExpenses();
      return true;
    } catch (err: any) {
      this.error.set(err.message);
      return false;
    }
  }

  async processDueRecurringExpenses(): Promise<number> {
    const active = this.recurringExpenses().filter(r => r.is_active);
    let createdCount = 0;
    const todayStr = new Date().toISOString().substring(0, 10);

    for (const item of active) {
      // Create expense if not processed today
      if (item.last_processed_date !== todayStr) {
        await this.expenseService.addExpense({
          category_id: item.category_id,
          date: todayStr,
          description: `[Recurring] ${item.description}`,
          amount: item.amount,
          payment_method: item.payment_method || 'UPI',
          notes: `Auto-generated ${item.frequency} recurring expense`
        });
        createdCount++;
      }
    }
    return createdCount;
  }
}
