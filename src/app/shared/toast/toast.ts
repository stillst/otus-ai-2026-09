import { Component, inject } from '@angular/core';
import { ToastStore } from './toast-store';

/** Always mounted so the live region exists before the first message. */
@Component({
  selector: 'app-toast',
  template: `<div class="toast" role="status" aria-live="polite" [class.visible]="store.message()">{{ store.message() }}</div>`,
  styles: `
    .toast {
      position: fixed;
      inset-inline: 0;
      bottom: 3.5rem;
      margin-inline: auto;
      width: max-content;
      max-width: calc(100vw - 2rem);
      padding: 0.5rem 0.875rem;
      border-radius: var(--radius);
      background: var(--ink);
      color: var(--surface);
      box-shadow: var(--shadow);
      opacity: 0;
      transform: translateY(0.5rem);
      transition: opacity 160ms ease, transform 160ms ease;
      pointer-events: none;
    }
    .toast.visible {
      opacity: 1;
      transform: none;
    }
  `,
})
export class Toast {
  protected readonly store = inject(ToastStore);
}
