import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state-box">
      <div class="icon-circle">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
      </div>
      <h3 class="title">{{ title }}</h3>
      <p class="description">{{ description }}</p>
      <button *ngIf="actionLabel" (click)="action.emit()" class="btn btn-primary btn-sm mt-3">
        {{ actionLabel }}
      </button>
    </div>
  `,
  styles: [`
    .empty-state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }
    .icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.1);
      color: #6366F1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    .title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 6px;
    }
    .description {
      font-size: 0.85rem;
      color: var(--text-muted);
      max-width: 360px;
    }
    .mt-3 {
      margin-top: 16px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() title = 'No data found';
  @Input() description = 'There are no records to display for the selected criteria.';
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
