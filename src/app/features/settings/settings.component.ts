import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Application & Data Settings</h1>
          <p class="page-desc">Manage account profile, default currency, database maintenance, and data resets</p>
        </div>
      </div>

      <div class="settings-grid">
        <!-- Profile Card -->
        <div class="glass-card settings-card">
          <h3>User Profile Information</h3>
          <p class="sub">Update your personal account details</p>

          <div *ngIf="successMsg()" class="alert alert-success mt-2">
            {{ successMsg() }}
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()" class="mt-3">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" formControlName="fullName" class="form-control" />
            </div>

            <div class="form-group">
              <label>Email / Phone Identity</label>
              <input type="email" formControlName="email" class="form-control readonly" readonly />
            </div>

            <div class="form-group">
              <label>Default Currency</label>
              <select formControlName="currency" class="form-control">
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
              </select>
            </div>

            <button type="submit" [disabled]="profileForm.invalid" class="btn btn-primary mt-2">
              Save Profile Changes
            </button>
          </form>
        </div>

        <!-- Supabase Database Connection Status & Factory Reset -->
        <div class="glass-card settings-card">
          <h3>Database Maintenance & Clear Entries</h3>
          <p class="sub">Supabase PostgreSQL & Storage control panel</p>

          <div class="status-box mt-3" [ngClass]="supabaseService.isDemoMode() ? 'demo' : 'live'">
            <div class="status-indicator"></div>
            <div>
              <h4 class="status-title">
                {{ supabaseService.isDemoMode() ? 'Demo Local Storage Mode' : 'Live Supabase Cloud Database' }}
              </h4>
              <p class="status-desc">
                {{ supabaseService.isDemoMode() 
                  ? 'App is operating with local storage persistence. Configure SUPABASE_URL in environment.ts for cloud sync.' 
                  : 'Connected directly to Supabase PostgreSQL database with Row Level Security.' }}
              </p>
            </div>
          </div>

          <div class="info-list mt-3">
            <div class="info-item">
              <span class="lbl">Row Level Security (RLS)</span>
              <span class="badge badge-success">Enforced</span>
            </div>
            <div class="info-item">
              <span class="lbl">Biometric WebAuthn Support</span>
              <span class="badge badge-info">Active</span>
            </div>
            <div class="info-item">
              <span class="lbl">Mobile PWA Web App Manifest</span>
              <span class="badge badge-success">Enabled</span>
            </div>
          </div>

          <!-- Danger Zone: Reset Database -->
          <div class="danger-zone-card mt-4">
            <div class="danger-hdr">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <div>
                <h4 class="danger-title">Reset Database Entries</h4>
                <p class="danger-desc">Wipe all expenses, category budgets, monthly budgets, and recurring records</p>
              </div>
            </div>

            <div *ngIf="resetFeedback()" class="alert alert-success mt-2">
              {{ resetFeedback() }}
            </div>

            <button (click)="onClearAllData()" class="btn btn-danger btn-sm mt-3" style="width: 100%;">
              🔥 Clear Every Database Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.6rem; font-weight: 800; color: var(--text-main); }
    .page-desc { font-size: 0.85rem; color: var(--text-muted); }

    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 900px) { .settings-grid { grid-template-columns: 1fr; } }

    .settings-card { padding: 28px; display: flex; flex-direction: column; }
    .settings-card h3 { font-size: 1.15rem; font-weight: 700; color: var(--text-main); }
    .sub { font-size: 0.82rem; color: var(--text-muted); }

    .readonly { opacity: 0.7; cursor: not-allowed; }
    .mt-2 { margin-top: 12px; }
    .mt-3 { margin-top: 18px; }
    .mt-4 { margin-top: 24px; }

    .alert-success {
      padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.85rem;
      background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .status-box {
      display: flex; gap: 14px; padding: 16px; border-radius: var(--radius-md);
      &.demo { background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); }
      &.live { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); }
    }
    .status-indicator {
      width: 12px; height: 12px; border-radius: 50%; margin-top: 4px;
      .demo & { background: #F59E0B; box-shadow: 0 0 10px #F59E0B; }
      .live & { background: #10B981; box-shadow: 0 0 10px #10B981; }
    }
    .status-title { font-size: 0.95rem; font-weight: 700; color: var(--text-main); }
    .status-desc { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }

    .info-list { display: flex; flex-direction: column; gap: 12px; }
    .info-item {
      display: flex; justify-content: space-between; align-items: center; padding: 10px 12px;
      background: rgba(15, 23, 42, 0.4); border-radius: var(--radius-sm); border: 1px solid var(--border-color);
      [data-theme="light"] & { background: #F8FAFC; }
    }
    .lbl { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }

    .danger-zone-card {
      padding: 16px; border-radius: var(--radius-md);
      background: rgba(244, 63, 94, 0.08); border: 1px dashed rgba(244, 63, 94, 0.3);
    }
    .danger-hdr { display: flex; gap: 12px; align-items: flex-start; }
    .danger-title { font-size: 0.95rem; font-weight: 700; color: #F43F5E; }
    .danger-desc { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }
  `]
})
export class SettingsComponent implements OnInit {
  authService = inject(AuthService);
  supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);

  readonly successMsg = signal<string | null>(null);
  readonly resetFeedback = signal<string | null>(null);

  profileForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required]],
    email: [''],
    currency: ['INR']
  });

  async ngOnInit() {
    const prof = await this.authService.loadProfile();
    if (prof) {
      this.profileForm.patchValue({
        fullName: prof.full_name,
        email: prof.email,
        currency: prof.currency || 'INR'
      });
    }
  }

  async onUpdateProfile() {
    if (this.profileForm.invalid) return;
    const { fullName, currency } = this.profileForm.value;
    const res = await this.authService.updateProfile(fullName, currency);
    if (!res?.error) {
      this.successMsg.set('Profile information updated successfully!');
      setTimeout(() => this.successMsg.set(null), 3000);
    }
  }

  async onClearAllData() {
    if (confirm('⚠️ WARNING: Are you sure you want to clear every expense entry, budget record, and category from the database? This action cannot be undone!')) {
      const result = await this.supabaseService.clearAllDatabaseEntries();
      if (result.success) {
        this.resetFeedback.set(result.message);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        alert(result.message);
      }
    }
  }
}
