import { TestBed } from '@angular/core/testing';
import { Toast } from './toast';
import { ToastStore } from './toast-store';

describe('Toast', () => {
  it('announces messages through a live region that is always present', async () => {
    const fixture = TestBed.createComponent(Toast);
    await fixture.whenStable();
    const region = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(region).not.toBeNull();
    expect(region.textContent?.trim()).toBe('');

    TestBed.inject(ToastStore).show('Path copied', 20);
    await fixture.whenStable();
    expect(region.textContent?.trim()).toBe('Path copied');
    expect(region.classList.contains('visible')).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 40));
    await fixture.whenStable();
    expect(region.textContent?.trim()).toBe('');
  });
});
