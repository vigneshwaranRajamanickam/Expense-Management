import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { MobileNavComponent } from '../../shared/components/mobile-nav/mobile-nav.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent, MobileNavComponent],
  template: `
    <div class="layout-container">
      <app-sidebar class="desktop-sidebar"></app-sidebar>
      <div class="main-wrapper">
        <app-header></app-header>
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-mobile-nav></app-mobile-nav>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      min-height: 100vh;
      background: var(--bg-primary);
    }
    .desktop-sidebar {
      @media (max-width: 768px) {
        display: none;
      }
    }
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .content-area {
      flex: 1;
      padding: 32px;
      overflow-y: auto;
      @media (max-width: 768px) {
        padding: 16px;
        padding-bottom: 80px;
      }
    }
  `]
})
export class MainLayoutComponent {}
