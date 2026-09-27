import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Category } from '../models/app-models';

const DEFAULT_CATEGORIES: Partial<Category>[] = [
  { name: 'Food', icon: 'utensils', color: '#EF4444', is_active: true },
  { name: 'Transport', icon: 'car', color: '#3B82F6', is_active: true },
  { name: 'Rent', icon: 'home', color: '#8B5CF6', is_active: true },
  { name: 'Electricity', icon: 'zap', color: '#F59E0B', is_active: true },
  { name: 'Mobile & Internet', icon: 'wifi', color: '#06B6D4', is_active: true },
  { name: 'Shopping', icon: 'shopping-bag', color: '#EC4899', is_active: true },
  { name: 'Entertainment', icon: 'film', color: '#10B981', is_active: true },
  { name: 'Medical', icon: 'activity', color: '#14B8A6', is_active: true },
  { name: 'Education', icon: 'book-open', color: '#6366F1', is_active: true },
  { name: 'Travel', icon: 'compass', color: '#84CC16', is_active: true },
  { name: 'EMI / Loan', icon: 'credit-card', color: '#64748B', is_active: true },
  { name: 'Groceries', icon: 'shopping-cart', color: '#22C55E', is_active: true },
  { name: 'Other', icon: 'more-horizontal', color: '#94A3B8', is_active: true }
];

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private supabase = inject(SupabaseService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadCategories();
  }

  private getLocalStorageCategories(userId: string): Category[] {
    const key = `pem_categories_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try { return JSON.parse(raw); } catch { }
    }
    const defaults: Category[] = DEFAULT_CATEGORIES.map((c, i) => ({
      id: `cat-def-${i + 1}`,
      user_id: userId,
      name: c.name!,
      icon: c.icon,
      color: c.color,
      is_active: c.is_active ?? true,
      created_at: new Date().toISOString()
    }));
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }

  private saveLocalStorageCategories(userId: string, cats: Category[]) {
    localStorage.setItem(`pem_categories_${userId}`, JSON.stringify(cats));
    this.categories.set(cats);
  }

  async loadCategories(): Promise<Category[]> {
    this.loading.set(true);
    const user = this.supabase.currentUser();
    const userId = user?.id || 'demo-user-12345';

    if (this.supabase.isDemoMode()) {
      const cats = this.getLocalStorageCategories(userId);
      this.categories.set(cats);
      this.loading.set(false);
      return cats;
    }

    try {
      const { data, error } = await this.supabase.client
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Seed defaults for new user
        const seeded = await this.seedDefaultCategories(userId);
        this.categories.set(seeded);
        return seeded;
      }

      this.categories.set(data as Category[]);
      return data as Category[];
    } catch (err: any) {
      console.error('Error loading categories:', err);
      // Fallback
      const fallback = this.getLocalStorageCategories(userId);
      this.categories.set(fallback);
      return fallback;
    } finally {
      this.loading.set(false);
    }
  }

  private async seedDefaultCategories(userId: string): Promise<Category[]> {
    const toInsert = DEFAULT_CATEGORIES.map(c => ({
      user_id: userId,
      name: c.name!,
      icon: c.icon,
      color: c.color,
      is_active: true
    }));

    const { data } = await this.supabase.client
      .from('categories')
      .insert(toInsert)
      .select();

    return (data as Category[]) || [];
  }

  async addCategory(name: string, icon: string = 'tag', color: string = '#4F46E5'): Promise<Category | null> {
    const user = this.supabase.currentUser();
    const userId = user?.id || 'demo-user-12345';

    if (this.supabase.isDemoMode()) {
      const cats = this.getLocalStorageCategories(userId);
      const newCat: Category = {
        id: 'cat-custom-' + Date.now(),
        user_id: userId,
        name,
        icon,
        color,
        is_active: true,
        created_at: new Date().toISOString()
      };
      cats.push(newCat);
      this.saveLocalStorageCategories(userId, cats);
      return newCat;
    }

    try {
      const { data, error } = await this.supabase.client
        .from('categories')
        .insert([{ user_id: userId, name, icon, color, is_active: true }])
        .select()
        .single();

      if (error) throw error;
      await this.loadCategories();
      return data as Category;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to add category');
      return null;
    }
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<boolean> {
    const user = this.supabase.currentUser();
    const userId = user?.id || 'demo-user-12345';

    if (this.supabase.isDemoMode()) {
      const cats = this.getLocalStorageCategories(userId);
      const idx = cats.findIndex(c => c.id === id);
      if (idx !== -1) {
        cats[idx] = { ...cats[idx], ...updates, updated_at: new Date().toISOString() };
        this.saveLocalStorageCategories(userId, cats);
        return true;
      }
      return false;
    }

    try {
      const { error } = await this.supabase.client
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      await this.loadCategories();
      return true;
    } catch (err: any) {
      this.error.set(err.message);
      return false;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    const user = this.supabase.currentUser();
    const userId = user?.id || 'demo-user-12345';

    if (this.supabase.isDemoMode()) {
      let cats = this.getLocalStorageCategories(userId);
      cats = cats.filter(c => c.id !== id);
      this.saveLocalStorageCategories(userId, cats);
      return true;
    }

    try {
      const { error } = await this.supabase.client
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      await this.loadCategories();
      return true;
    } catch (err: any) {
      this.error.set(err.message);
      return false;
    }
  }
}
