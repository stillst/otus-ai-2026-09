import { Service, signal } from '@angular/core';

/** A single short-lived status message announced through a live region. */
@Service()
export class ToastStore {
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly message = signal<string | null>(null);

  show(text: string, durationMs = 2000): void {
    clearTimeout(this.timer);
    this.message.set(text);
    this.timer = setTimeout(() => this.message.set(null), durationMs);
  }
}
