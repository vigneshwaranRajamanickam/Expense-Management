import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (_route, _state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // In demo mode or when authenticated, allow route access
  if (supabaseService.isDemoMode()) {
    if (!supabaseService.currentUser()) {
      // Auto assign demo user if not logged out
      supabaseService.setStoredDemoUser({
        id: 'demo-user-12345',
        app_metadata: {},
        user_metadata: { full_name: 'Demo Professional' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'demo@expense.com'
      });
    }
    return true;
  }

  const session = supabaseService.session();
  if (session && session.user) {
    return true;
  }

  // Check initial session asynchronously if needed
  const { data: { session: activeSession } } = await supabaseService.client.auth.getSession();
  if (activeSession) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
