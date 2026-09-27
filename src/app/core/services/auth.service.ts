import { Injectable, computed, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/app-models';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);

  readonly user = computed(() => this.supabaseService.currentUser());
  readonly isAuthenticated = computed(() => !!this.user());
  readonly profile = signal<Profile | null>(null);
  readonly loading = signal<boolean>(false);
  readonly authError = signal<string | null>(null);

  constructor() {
    // Sync profile when user changes
    if (this.user()) {
      this.loadProfile();
    }
  }

  async loadProfile(): Promise<Profile | null> {
    const currentUser = this.user();
    if (!currentUser) return null;

    if (this.supabaseService.isDemoMode()) {
      const demoProfile: Profile = {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.['full_name'] || 'Professional User',
        email: currentUser.email || 'user@example.com',
        currency: 'INR'
      };
      this.profile.set(demoProfile);
      return demoProfile;
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch notice:', error.message);
      }

      if (data) {
        this.profile.set(data as Profile);
        return data as Profile;
      } else {
        // Automatically create missing profile for existing user
        const newProf: Profile = {
          id: currentUser.id,
          full_name: currentUser.user_metadata?.['full_name'] || currentUser.email?.split('@')[0] || 'User',
          email: currentUser.email || '',
          currency: 'INR'
        };
        await this.supabaseService.client.from('profiles').upsert(newProf);
        this.profile.set(newProf);
        return newProf;
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
    }
    return null;
  }

  async signUp(email: string, pass: string, fullName: string) {
    this.loading.set(true);
    this.authError.set(null);
    try {
      if (this.supabaseService.isDemoMode()) {
        const mockUser: User = {
          id: 'demo-user-' + Date.now(),
          app_metadata: {},
          user_metadata: { full_name: fullName },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: email
        };
        this.supabaseService.setStoredDemoUser(mockUser);
        await this.loadProfile();
        return { user: mockUser, error: null };
      }

      const { data, error } = await this.supabaseService.client.auth.signUp({
        email,
        password: pass,
        options: {
          data: { full_name: fullName }
        }
      });

      if (error) throw error;
      if (data.user) {
        await this.loadProfile();
      }
      return { user: data.user, error: null };
    } catch (err: any) {
      this.authError.set(err.message || 'Signup failed');
      return { user: null, error: err.message };
    } finally {
      this.loading.set(false);
    }
  }

  async signIn(email: string, pass: string) {
    this.loading.set(true);
    this.authError.set(null);
    try {
      if (this.supabaseService.isDemoMode()) {
        const mockUser: User = {
          id: 'demo-user-12345',
          app_metadata: {},
          user_metadata: { full_name: 'Demo Professional' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: email || 'demo@expense.com'
        };
        this.supabaseService.setStoredDemoUser(mockUser);
        await this.loadProfile();
        return { user: mockUser, error: null };
      }

      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password: pass
      });

      if (error) throw error;
      if (data.user) {
        await this.loadProfile();
      }
      return { user: data.user, error: null };
    } catch (err: any) {
      this.authError.set(err.message || 'Invalid login credentials');
      return { user: null, error: err.message };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Mobile Phone Number OTP Auth: Send SMS OTP
   */
  async sendPhoneOtp(phone: string) {
    this.loading.set(true);
    this.authError.set(null);
    try {
      if (this.supabaseService.isDemoMode()) {
        return { error: null, message: 'OTP sent to mobile number: 123456 (Demo Mode)' };
      }

      const { error } = await this.supabaseService.client.auth.signInWithOtp({
        phone: phone
      });

      if (error) throw error;
      return { error: null, message: 'OTP verification code sent to your mobile phone.' };
    } catch (err: any) {
      this.authError.set(err.message || 'Failed to send SMS OTP');
      return { error: err.message };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Mobile Phone Number OTP Auth: Verify 6-digit OTP Code
   */
  async verifyPhoneOtp(phone: string, token: string) {
    this.loading.set(true);
    this.authError.set(null);
    try {
      if (this.supabaseService.isDemoMode()) {
        if (token === '123456' || token.length === 6) {
          const mockUser: User = {
            id: 'demo-user-phone-' + Date.now(),
            app_metadata: {},
            user_metadata: { full_name: 'Mobile User (' + phone + ')' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            phone: phone,
            email: phone + '@mobile.user'
          };
          this.supabaseService.setStoredDemoUser(mockUser);
          await this.loadProfile();
          return { user: mockUser, error: null };
        } else {
          throw new Error('Invalid OTP code. Use 123456 for demo mode.');
        }
      }

      const { data, error } = await this.supabaseService.client.auth.verifyOtp({
        phone,
        token,
        type: 'sms'
      });

      if (error) throw error;
      if (data.user) {
        await this.loadProfile();
      }
      return { user: data.user, error: null };
    } catch (err: any) {
      this.authError.set(err.message || 'OTP Verification failed');
      return { user: null, error: err.message };
    } finally {
      this.loading.set(false);
    }
  }

  async signOut() {
    this.loading.set(true);
    try {
      if (this.supabaseService.isDemoMode()) {
        this.supabaseService.setStoredDemoUser(null);
        this.profile.set(null);
        return;
      }
      await this.supabaseService.client.auth.signOut();
      this.profile.set(null);
    } catch (err) {
      console.error('Signout error:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async resetPassword(email: string) {
    this.loading.set(true);
    this.authError.set(null);
    try {
      if (this.supabaseService.isDemoMode()) {
        return { error: null, message: 'Password reset link sent (Demo Mode)' };
      }

      const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      this.authError.set(err.message || 'Failed to send password reset email');
      return { error: err.message };
    } finally {
      this.loading.set(false);
    }
  }

  async updateProfile(fullName: string, currency: string = 'INR') {
    const u = this.user();
    if (!u) return;

    if (this.supabaseService.isDemoMode()) {
      const updatedProfile: Profile = {
        id: u.id,
        full_name: fullName,
        email: u.email || '',
        currency
      };
      this.profile.set(updatedProfile);
      return { error: null };
    }

    try {
      const { error } = await this.supabaseService.client
        .from('profiles')
        .upsert({
          id: u.id,
          full_name: fullName,
          email: u.email,
          currency,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      await this.loadProfile();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  }
}
