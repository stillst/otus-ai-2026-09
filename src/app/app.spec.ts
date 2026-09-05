import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(() => localStorage.clear());

  it('renders the shell with both panes and the empty state', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('viewer');
    expect(el.querySelector('[role="toolbar"]')).not.toBeNull();
    expect(el.querySelector('textarea#json-source')).not.toBeNull();
    expect(el.textContent).toContain('Paste JSON or drop a file to see its structure.');
  });
});
