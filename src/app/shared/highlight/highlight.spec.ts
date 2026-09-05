import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Highlight } from './highlight';

@Component({
  imports: [Highlight],
  template: `<app-highlight [text]="text()" [query]="query()" />`,
})
class Host {
  readonly text = signal('hello world');
  readonly query = signal('');
}

describe('Highlight', () => {
  it('marks matches and updates when the query changes', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('mark').length).toBe(0);
    expect(el.textContent).toBe('hello world');

    fixture.componentInstance.query.set('o');
    await fixture.whenStable();
    expect(Array.from(el.querySelectorAll('mark')).map((m) => m.textContent)).toEqual(['o', 'o']);
    expect(el.textContent).toBe('hello world');
  });
});
