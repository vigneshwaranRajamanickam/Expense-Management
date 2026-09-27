import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="app-header">
      <div class="header-left">
        <h1 class="page-title">FinPulse</h1>
        <span class="live-badge">Live</span>
      </div>

      <div class="header-right">
        <!-- Manual Sync Data Button -->
        <button 
          (click)="onSyncNow()" 
          [disabled]="isSyncing()" 
          class="sync-btn"
          [title]="'Synchronize all expense & budget data with cloud database'"
        >
          <svg [class.spinning]="isSyncing()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span class="sync-lbl">{{ isSyncing() ? 'Syncing...' : 'Sync' }}</span>
        </button>

        <!-- Theme Switcher Button -->
        <button 
          (click)="themeService.toggleTheme()" 
          class="theme-toggle-btn" 
          [title]="themeService.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <ng-container *ngIf="themeService.isDark(); else lightIcon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <span class="theme-btn-label">Light</span>
          </ng-container>

          <ng-template #lightIcon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            <span class="theme-btn-label">Dark</span>
          </ng-template>
        </button>

        <a routerLink="/expenses/add" class="btn btn-primary btn-sm desktop-add-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span class="add-btn-lbl">Add</span>
        </a>

        <div class="user-profile-badge" *ngIf="authService.profile() as userProfile">
          <div class="user-avatar">
            {{ userProfile.full_name ? userProfile.full_name[0].toUpperCase() : 'U' }}
          </div>
          <div class="user-details">
            <span class="user-name">{{ userProfile.full_name }}</span>
          </div>
        </div>

        <button (click)="logout()" class="btn btn-secondary btn-sm logout-btn" title="Sign Out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      height: 70px; padding: 0 32px; background: var(--bg-card); backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-color); display: flex; align-items: center;
      justify-content: space-between; position: sticky; top: 0; z-index: 90;
      transition: background 0.3s ease, border-color 0.3s ease;

      @media (max-width: 768px) {
        padding: 0 14px;
        height: 60px;
      }
    }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .page-title { 
      font-size: 1.15rem; font-weight: 800; color: var(--text-main); 
      @media (max-width: 500px) { font-size: 1rem; }
    }
    .live-badge {
      background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 3px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em;
      @media (max-width: 500px) { display: none; }
    }
    .header-right { display: flex; align-items: center; gap: 10px; }
    
    .sync-btn {
      display: flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: var(--radius-md);
      background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: #10B981;
      font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease;
      &:hover:not(:disabled) { background: rgba(16, 185, 129, 0.25); transform: translateY(-1px); }
      @media (max-width: 500px) { padding: 6px 8px; }
    }
    .sync-lbl { @media (max-width: 600px) { display: none; } }
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .theme-toggle-btn {
      display: flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: var(--radius-md);
      background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-main);
      font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
      &:hover { border-color: var(--primary-500); box-shadow: 0 0 12px var(--primary-glow); transform: translateY(-1px); }
      @media (max-width: 500px) { padding: 6px 8px; }
    }
    .theme-btn-label { @media (max-width: 600px) { display: none; } }

    .desktop-add-btn {
      @media (max-width: 768px) { display: none; }
    }

    .user-profile-badge {
      display: flex; align-items: center; gap: 8px; padding: 4px 10px;
      background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-color); border-radius: 999px;
    }
    .user-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-500) 0%, #8B5CF6 100%);
      color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.82rem;
    }
    .user-details { display: flex; flex-direction: column; @media (max-width: 600px) { display: none; } }
    .user-name { font-size: 0.8rem; font-weight: 700; color: var(--text-main); line-height: 1.1; }

    .logout-btn { padding: 6px 10px; }
  `]
})
export class HeaderComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  expenseService = inject(ExpenseService);
  categoryService = inject(CategoryService);
  private router = inject(Router);

  readonly isSyncing = signal<boolean>(false);

  async onSyncNow() {
    this.isSyncing.set(true);
    try {
      await this.categoryService.loadCategories();
      await this.expenseService.loadExpenses();
    } finally {
      setTimeout(() => this.isSyncing.set(false), 600);
    }
  }

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}
