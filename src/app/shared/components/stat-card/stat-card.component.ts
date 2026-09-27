import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe],
  template: `
    <div class="glass-card stat-card interactive">
      <div class="card-header">
        <span class="card-title">{{ title }}</span>
        <div class="icon-badge" [style.background]="bgGlow" [style.color]="accentColor">
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>
      <div class="card-body">
        <div class="value-row">
          <span class="stat-value">{{ value | currencyInr: showDecimals }}</span>
        </div>
        <div class="sub-row" *ngIf="badgeText || subtext">
          <span *ngIf="badgeText" class="badge" [ngClass]="badgeClass">
            {{ badgeText }}
          </span>
          <span *ngIf="subtext" class="subtext">{{ subtext }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .icon-badge {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-value {
      font-size: clamp(1.25rem, 5vw, 1.65rem);
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.02em;
      word-break: break-word;
    }
    .sub-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
    }
    .subtext {
      color: var(--text-subtle);
    }
  `]
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value = 0;
  @Input() showDecimals = true;
  @Input() accentColor = '#6366F1';
  @Input() bgGlow = 'rgba(99, 102, 241, 0.15)';
  @Input() badgeText?: string;
  @Input() badgeClass = 'badge-info';
  @Input() subtext?: string;
}
