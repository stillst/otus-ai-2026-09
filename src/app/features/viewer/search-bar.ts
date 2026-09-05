import { Component, computed, DestroyRef, inject } from '@angular/core';
import { SearchStore } from './search-store';

const SEARCH_DEBOUNCE_MS = 150;

@Component({
  selector: 'app-search-bar',
  template: `
    <div class="bar">
      <label class="visually-hidden" for="tree-search">Search keys and values</label>
      <input
        id="tree-search"
        type="search"
        placeholder="Search keys and values"
        autocomplete="off"
        [value]="search.query()"
        (input)="onInput($event)"
        (keydown.enter)="search.next()"
        (keydown.shift.enter)="search.prev()"
      />
      <span class="count" role="status" aria-live="polite">{{ summary() }}</span>
      <button type="button" class="btn btn-quiet btn-icon" aria-label="Previous match" [disabled]="!hasMatches()" (click)="search.prev()">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 10l5-5 5 5" /></svg>
      </button>
      <button type="button" class="btn btn-quiet btn-icon" aria-label="Next match" [disabled]="!hasMatches()" (click)="search.next()">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 6l5 5 5-5" /></svg>
      </button>
    </div>
  `,
  styles: `
    .bar {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--rail-soft);
    }
    input {
      flex: 1;
      min-width: 0;
      min-height: 2rem;
      padding: 0.25rem 0.625rem;
      border: 1px solid var(--rail);
      border-radius: var(--radius);
      background: var(--surface);
    }
    input::placeholder {
      color: var(--muted);
    }
    .count {
      min-width: 4.5rem;
      text-align: right;
      font-size: 12px;
      color: var(--muted);
      white-space: nowrap;
    }
  `,
})
export class SearchBar {
  protected readonly search = inject(SearchStore);
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly hasMatches = computed(() => this.search.matches().length > 0);
  protected readonly summary = computed(() => {
    if (!this.search.query().trim()) return '';
    const total = this.search.matches().length;
    return total ? `${this.search.activeIndex() + 1} of ${total}` : 'No matches';
  });

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.timer));
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.search.setQuery(value), SEARCH_DEBOUNCE_MS);
  }
}
