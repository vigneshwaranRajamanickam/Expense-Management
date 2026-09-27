import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-wrapper">
      <div class="glass-card auth-card">
        <div class="auth-header">
          <h2 class="auth-title">Reset Password</h2>
          <p class="auth-subtitle">Enter your account email to receive a password reset link</p>
        </div>

        <div *ngIf="successMsg()" class="alert alert-success">
          {{ successMsg() }}
        </div>

        <div *ngIf="authService.authError()" class="alert alert-danger">
          {{ authService.authError() }}
        </div>

        <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              class="form-control" 
              placeholder="e.g. alex@company.com"
            />
          </div>

          <button type="submit" [disabled]="forgotForm.invalid || authService.loading()" class="btn btn-primary w-100 mt-2">
            <span *ngIf="!authService.loading()">Send Reset Link</span>
            <span *ngIf="authService.loading()">Sending...</span>
          </button>
        </form>

        <div class="auth-footer">
          <a routerLink="/login" class="auth-link">← Back to Sign In</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: var(--bg-primary);
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 36px 32px;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .auth-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 6px; }
    .auth-subtitle { font-size: 0.85rem; color: var(--text-muted); }
    .alert {
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      margin-bottom: 18px;
      &.alert-danger { background: rgba(244, 63, 94, 0.15); color: #F43F5E; }
      &.alert-success { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    }
    .w-100 { width: 100%; }
    .mt-2 { margin-top: 12px; }
    .auth-footer { margin-top: 24px; text-align: center; font-size: 0.85rem; }
    .auth-link { color: var(--primary-500); font-weight: 700; text-decoration: none; }
  `]
})
export class ForgotPasswordComponent {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  readonly successMsg = signal<string | null>(null);

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  async onSubmit() {
    if (this.forgotForm.invalid) return;
    this.successMsg.set(null);
    const { email } = this.forgotForm.value;
    const res = await this.authService.resetPassword(email);
    if (!res.error) {
      this.successMsg.set('Password reset link sent! Check your email inbox.');
    }
  }
}
