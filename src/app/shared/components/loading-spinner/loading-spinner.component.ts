import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-container" [style.min-height]="height">
      <div class="glow-ring"></div>
      @if(message){
        <p class="loading-text">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      gap: 16px;
    }
    .glow-ring {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(99, 102, 241, 0.15);
      border-top-color: #6366F1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
    }
    .loading-text {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() height = '200px';
  @Input() message = 'Loading financial insights...';
}
