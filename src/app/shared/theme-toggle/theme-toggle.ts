import { Component, computed, inject } from '@angular/core';
import { ThemeStore } from '../../core/theme-store';

const LABELS = { system: 'System', light: 'Light', dark: 'Dark' } as const;

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button type="button" class="btn" [attr.aria-label]="'Theme: ' + label() + '. Switch theme'" (click)="theme.cycle()">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        @switch (theme.preference()) {
          @case ('light') {
            <circle cx="8" cy="8" r="3.25" />
            <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
          }
          @case ('dark') {
            <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" />
          }
          @default {
            <rect x="1.5" y="3" width="13" height="9" rx="1.5" />
            <path d="M5.5 14.5h5" />
          }
        }
      </svg>
      <span>{{ label() }}</span>
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeStore);
  protected readonly label = computed(() => LABELS[this.theme.preference()]);
}
