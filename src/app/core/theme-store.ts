import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Service, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'json-viewer.theme';
const ORDER: readonly ThemePreference[] = ['system', 'light', 'dark'];

/** Theme preference with system fallback, persisted per browser. */
@Service()
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly systemDark = signal(false);

  readonly preference = signal<ThemePreference>(readStoredPreference());
  readonly effective = computed<'light' | 'dark'>(() => {
    const pref = this.preference();
    if (pref !== 'system') return pref;
    return this.systemDark() ? 'dark' : 'light';
  });

  constructor() {
    const media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    if (media) {
      this.systemDark.set(media.matches);
      media.addEventListener('change', (event) => this.systemDark.set(event.matches));
    }

    // Sync the preference to the DOM and to storage. Both are outside the signal graph.
    effect(() => {
      const pref = this.preference();
      const root = this.document.documentElement;
      if (pref === 'system') {
        delete root.dataset['theme'];
      } else {
        root.dataset['theme'] = pref;
      }
      writeStoredPreference(pref);
    });
  }

  set(preference: ThemePreference): void {
    this.preference.set(preference);
  }

  /** system -> light -> dark -> system */
  cycle(): void {
    const next = ORDER[(ORDER.indexOf(this.preference()) + 1) % ORDER.length];
    this.preference.set(next);
  }
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function writeStoredPreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } else {
      globalThis.localStorage?.setItem(STORAGE_KEY, preference);
    }
  } catch {
    // Storage is optional.
  }
}
