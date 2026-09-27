import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // Signals for Auth & DB Connectivity status
  readonly currentUser = signal<User | null>(null);
  readonly session = signal<Session | null>(null);
  readonly isInitialized = signal<boolean>(false);
  readonly isDemoMode = signal<boolean>(false);

  constructor() {
    // Check if valid URL exists
    const isValidConfig = environment.supabaseUrl && 
                          !environment.supabaseUrl.includes('xyzcompany') && 
                          environment.supabaseKey && 
                          !environment.supabaseKey.includes('placeholder_key');

    if (!isValidConfig) {
      console.warn('Supabase credentials not configured. Running in Demo Local Mode with full data persistence!');
      this.isDemoMode.set(true);
    }

    this.supabase = createClient(
      environment.supabaseUrl || 'https://placeholder.supabase.co',
      environment.supabaseKey || 'placeholder-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      }
    );

    this.initAuth();
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  private async initAuth() {
    try {
      if (!this.isDemoMode()) {
        const { data: { session } } = await this.supabase.auth.getSession();
        this.session.set(session);
        this.currentUser.set(session?.user ?? null);

        this.supabase.auth.onAuthStateChange((_event, session) => {
          this.session.set(session);
          this.currentUser.set(session?.user ?? null);
        });
      } else {
        // Mock demo user session for instant previewing
        const demoUser = this.getStoredDemoUser();
        if (demoUser) {
          this.currentUser.set(demoUser);
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      this.isInitialized.set(true);
    }
  }

  getStoredDemoUser(): User | null {
    const raw = localStorage.getItem('pem_demo_user');
    if (raw) {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  }

  setStoredDemoUser(user: User | null) {
    if (user) {
      localStorage.setItem('pem_demo_user', JSON.stringify(user));
      this.currentUser.set(user);
    } else {
      localStorage.removeItem('pem_demo_user');
      this.currentUser.set(null);
    }
  }

  /**
   * Reset / Clear all Database entries for expenses, budgets, categories, and recurring records
   */
  async clearAllDatabaseEntries(): Promise<{ success: boolean; message: string }> {
    if (this.isDemoMode()) {
      localStorage.removeItem('pem_expenses');
      localStorage.removeItem('pem_categories');
      localStorage.removeItem('pem_budgets');
      localStorage.removeItem('pem_category_budgets');
      localStorage.removeItem('pem_recurring');
      return { success: true, message: 'All local database entries cleared successfully!' };
    } else {
      try {
        const userId = this.currentUser()?.id;
        if (!userId) return { success: false, message: 'User not authenticated' };

        await this.supabase.from('expenses').delete().eq('user_id', userId);
        await this.supabase.from('recurring_expenses').delete().eq('user_id', userId);
        await this.supabase.from('category_budgets').delete().eq('user_id', userId);
        await this.supabase.from('budgets').delete().eq('user_id', userId);
        await this.supabase.from('categories').delete().eq('user_id', userId).eq('is_default', false);

        return { success: true, message: 'All cloud database entries cleared successfully!' };
      } catch (err: any) {
        return { success: false, message: err.message || 'Failed to clear database' };
      }
    }
  }
}
