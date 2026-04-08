import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-host" aria-live="polite" aria-atomic="true">
      <article
        *ngFor="let toast of toastService.toasts$ | async; trackBy: trackById"
        class="toast"
        [class.toast-success]="toast.type === 'success'"
        [class.toast-error]="toast.type === 'error'"
        [class.toast-info]="toast.type === 'info'"
      >
        <div class="toast-head">
          <strong>{{ toast.title }}</strong>
          <button type="button" (click)="toastService.dismiss(toast.id)">×</button>
        </div>
        <p>{{ toast.message }}</p>
      </article>
    </div>
  `,
  styles: [
    `
      .toast-host {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 1200;
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: min(360px, calc(100vw - 24px));
      }

      .toast {
        background: #fffdf8;
        border-radius: 10px;
        border-left: 5px solid #1a3d6b;
        border: 1px solid #ddd8cc;
        box-shadow: 0 10px 24px rgba(15, 14, 13, 0.14);
        padding: 10px 12px;
        animation: toast-in 180ms ease-out;
      }

      .toast-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
      }

      .toast-head button {
        border: 0;
        background: transparent;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
        color: #8a8278;
      }

      .toast p {
        margin: 0;
        font-size: 14px;
        line-height: 1.4;
      }

      .toast-success {
        border-left-color: #1a6b4a;
      }

      .toast-error {
        border-left-color: #d4501a;
      }

      .toast-info {
        border-left-color: #1a3d6b;
      }

      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  trackById(_: number, item: { id: number }) {
    return item.id;
  }
}
