import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-wrapper">
      <div class="glass-card auth-card">
        <div class="auth-header">
          <h2 class="auth-title">Create Account</h2>
          <p class="auth-subtitle">Start taking control of your daily financial spending</p>
        </div>

        <div *ngIf="authService.authError()" class="alert alert-danger">
          {{ authService.authError() }}
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input 
              type="text" 
              id="fullName" 
              formControlName="fullName" 
              class="form-control" 
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              class="form-control" 
              placeholder="e.g. rahul@company.com"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              class="form-control" 
              placeholder="Min 6 characters"
            />
          </div>

          <button type="submit" [disabled]="registerForm.invalid || authService.loading()" class="btn btn-primary w-100 mt-2">
            <span *ngIf="!authService.loading()">Sign Up</span>
            <span *ngIf="authService.loading()">Creating account...</span>
          </button>
        </form>

        <div class="auth-footer">
          <span>Already registered?</span>
          <a routerLink="/login" class="auth-link">Sign In</a>
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
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 40%),
                  radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.15), transparent 40%),
                  var(--bg-primary);
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
    .auth-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 6px;
    }
    .auth-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .alert {
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      margin-bottom: 18px;
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #F43F5E;
    }
    .w-100 { width: 100%; }
    .mt-2 { margin-top: 12px; }
    .auth-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .auth-link {
      color: var(--primary-500);
      font-weight: 700;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  `]
})
export class RegisterComponent {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit() {
    if (this.registerForm.invalid) return;
    const { email, password, fullName } = this.registerForm.value;
    const res = await this.authService.signUp(email, password, fullName);
    if (!res.error) {
      this.router.navigate(['/dashboard']);
    }
  }
}
