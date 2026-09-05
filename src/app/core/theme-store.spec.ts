import { TestBed } from '@angular/core/testing';
import { ThemeStore } from './theme-store';

describe('ThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  it('defaults to the system preference', () => {
    const store = TestBed.inject(ThemeStore);
    expect(store.preference()).toBe('system');
    expect(store.effective()).toBe('light');
  });

  it('cycles system -> light -> dark -> system and mirrors to the DOM', async () => {
    const store = TestBed.inject(ThemeStore);
    store.cycle();
    await TestBed.inject(ApplicationRefShim).whenStable();
    expect(store.preference()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem('json-viewer.theme')).toBe('light');

    store.cycle();
    await TestBed.inject(ApplicationRefShim).whenStable();
    expect(document.documentElement.dataset['theme']).toBe('dark');

    store.cycle();
    await TestBed.inject(ApplicationRefShim).whenStable();
    expect(store.preference()).toBe('system');
    expect(document.documentElement.dataset['theme']).toBeUndefined();
    expect(localStorage.getItem('json-viewer.theme')).toBeNull();
  });

  it('restores a stored preference', () => {
    localStorage.setItem('json-viewer.theme', 'dark');
    const store = TestBed.inject(ThemeStore);
    expect(store.effective()).toBe('dark');
  });
});

import { ApplicationRef } from '@angular/core';
const ApplicationRefShim = ApplicationRef;
