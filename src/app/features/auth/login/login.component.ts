import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BiometricService } from '../../../core/services/biometric.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
    <div class="auth-wrapper">
      <div class="glass-card auth-card">
        <div class="auth-header">
          <div class="logo-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <h2 class="auth-title">FinPulse Sign In</h2>
          <p class="auth-subtitle">Secure access via Email, Mobile OTP, or Fingerprint</p>
        </div>

        <!-- Auth Method Selector Tabs -->
        <div class="auth-tabs">
          <button [class.active]="authMethod() === 'email'" (click)="authMethod.set('email')" class="tab-btn">
            📧 Email
          </button>
          <button [class.active]="authMethod() === 'phone'" (click)="authMethod.set('phone')" class="tab-btn">
            📱 Mobile OTP
          </button>
          <button [class.active]="authMethod() === 'biometric'" (click)="authMethod.set('biometric')" class="tab-btn">
            ☝️ Fingerprint
          </button>
        </div>

        <div *ngIf="authService.authError() || statusMsg()" class="alert" [ngClass]="authService.authError() ? 'alert-danger' : 'alert-success'">
          {{ authService.authError() || statusMsg() }}
        </div>

        <!-- 1. Email & Password Form -->
        <form *ngIf="authMethod() === 'email'" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
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

          <div class="form-group">
            <div class="label-row">
              <label for="password">Password</label>
              <a routerLink="/forgot-password" class="forgot-link">Forgot?</a>
            </div>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              class="form-control" 
              placeholder="••••••••"
            />
          </div>

          <button type="submit" [disabled]="loginForm.invalid || authService.loading()" class="btn btn-primary w-100 mt-2">
            <span *ngIf="!authService.loading()">Sign In with Email</span>
            <span *ngIf="authService.loading()">Authenticating...</span>
          </button>
        </form>

        <!-- 2. Mobile Phone Number OTP Form -->
        <div *ngIf="authMethod() === 'phone'" class="phone-auth-box">
          <div *ngIf="!otpSent()" class="form-group">
            <label>Mobile Phone Number</label>
            <input 
              type="tel" 
              [(ngModel)]="phoneNumber" 
              class="form-control" 
              placeholder="+91 98765 43210"
            />
            <button (click)="onSendOtp()" [disabled]="!phoneNumber || authService.loading()" class="btn btn-primary w-100 mt-3">
              Send SMS OTP Code
            </button>
          </div>

          <div *ngIf="otpSent()" class="form-group">
            <label>Enter 6-Digit Verification OTP Code</label>
            <input 
              type="text" 
              [(ngModel)]="otpToken" 
              maxlength="6"
              class="form-control otp-input" 
              placeholder="123456"
            />
            <button (click)="onVerifyOtp()" [disabled]="!otpToken || authService.loading()" class="btn btn-primary w-100 mt-3">
              Verify OTP & Sign In
            </button>
          </div>
        </div>

        <!-- 3. Fingerprint / Biometric WebAuthn Form -->
        <div *ngIf="authMethod() === 'biometric'" class="biometric-box">
          <div class="fingerprint-scanner-circle" (click)="onBiometricLogin()">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 12c0-3 2.5-5.5 5.5-5.5S23 9 23 12c0 4.5-3.5 9.5-8.5 11.5"></path>
              <path d="M17 12c0-1.7-1.3-3-3-3s-3 1.3-3 3c0 3-2 6-5.5 7.5"></path>
              <path d="M12 7c-2.8 0-5 2.2-5 5 0 3.5-2.5 7-5 8.5"></path>
              <path d="M7 12c0-.6.4-1 1-1s1 .4 1 1c0 2-1.5 4.5-3.5 6"></path>
            </svg>
          </div>
          <p class="bio-hint">Touch or scan your device fingerprint sensor</p>

          <button (click)="onBiometricLogin()" class="btn btn-primary w-100 mt-2">
            ☝️ Scan Fingerprint Now
          </button>
        </div>

        <div class="demo-quick-btn mt-3">
          <button (click)="useDemoAccount()" class="btn btn-secondary btn-sm w-100">
            ⚡ Instant Demo Access
          </button>
        </div>

        <div class="auth-footer">
          <span>Don't have an account?</span>
          <a routerLink="/register" class="auth-link">Create Account</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 40%),
                  radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.15), transparent 40%),
                  var(--bg-primary);
    }
    .auth-card { width: 100%; max-width: 440px; padding: 36px 32px; }
    .auth-header { text-align: center; margin-bottom: 24px; }
    .logo-box {
      width: 52px; height: 52px; margin: 0 auto 14px auto; border-radius: 16px;
      background: linear-gradient(135deg, var(--primary-500) 0%, #8B5CF6 100%);
      color: #FFFFFF; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    }
    .auth-title { font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px; }
    .auth-subtitle { font-size: 0.82rem; color: var(--text-muted); }

    .auth-tabs {
      display: flex; gap: 4px; padding: 4px; background: rgba(15, 23, 42, 0.5);
      border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 20px;
    }
    .tab-btn {
      flex: 1; padding: 8px 6px; font-size: 0.78rem; font-weight: 700; border: none; background: none;
      color: var(--text-muted); border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s;
      &.active { background: var(--primary-500); color: #FFFFFF; box-shadow: 0 4px 12px var(--primary-glow); }
    }

    .otp-input { letter-spacing: 0.3em; font-size: 1.2rem; text-align: center; font-weight: 800; }

    .biometric-box {
      display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; padding: 12px 0;
    }
    .fingerprint-scanner-circle {
      width: 80px; height: 80px; border-radius: 50%;
      background: rgba(99, 102, 241, 0.12); border: 2px dashed var(--primary-500);
      color: var(--primary-500); display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: transform 0.3s, box-shadow 0.3s;
      &:hover { transform: scale(1.08); box-shadow: 0 0 25px var(--primary-glow); }
    }
    .bio-hint { font-size: 0.82rem; color: var(--text-muted); }

    .label-row { display: flex; align-items: center; justify-content: space-between; }
    .forgot-link { font-size: 0.8rem; color: var(--primary-500); text-decoration: none; font-weight: 600; }
    
    .alert {
      padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.85rem; margin-bottom: 18px;
      &.alert-danger { background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #F43F5E; }
      &.alert-success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10B981; }
    }
    .w-100 { width: 100%; }
    .mt-2 { margin-top: 12px; }
    .mt-3 { margin-top: 16px; }
    .auth-footer { margin-top: 24px; text-align: center; font-size: 0.85rem; color: var(--text-muted); display: flex; justify-content: center; gap: 6px; }
    .auth-link { color: var(--primary-500); font-weight: 700; text-decoration: none; }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  biometricService = inject(BiometricService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  authMethod = signal<'email' | 'phone' | 'biometric'>('email');
  phoneNumber = '+91 98765 43210';
  otpToken = '123456';
  otpSent = signal<boolean>(false);
  statusMsg = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['demo@expense.com', [Validators.required, Validators.email]],
    password: ['password123', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit() {
    if (this.loginForm.invalid) return;
    const { email, password } = this.loginForm.value;
    const res = await this.authService.signIn(email, password);
    if (!res.error) {
      this.router.navigate(['/dashboard']);
    }
  }

  async onSendOtp() {
    if (!this.phoneNumber) return;
    const res = await this.authService.sendPhoneOtp(this.phoneNumber);
    if (!res.error) {
      this.otpSent.set(true);
      this.statusMsg.set(res.message || 'OTP code sent');
    }
  }

  async onVerifyOtp() {
    const res = await this.authService.verifyPhoneOtp(this.phoneNumber, this.otpToken);
    if (!res.error) {
      this.router.navigate(['/dashboard']);
    }
  }

  async onBiometricLogin() {
    const res = await this.biometricService.authenticateFingerprint();
    if (res.success) {
      this.statusMsg.set(res.message);
      await this.useDemoAccount();
    }
  }

  async useDemoAccount() {
    this.loginForm.patchValue({
      email: 'demo@expense.com',
      password: 'password123'
    });
    await this.onSubmit();
  }
}
