import { TestBed } from '@angular/core/testing';
import { StaleNoticeComponent } from './stale-notice.component';

describe('StaleNoticeComponent', () => {
  it('dit des données pas à jour et propose de réessayer', async () => {
    const fixture = TestBed.createComponent(StaleNoticeComponent);
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.getAttribute('role')).toBe('status');
    expect(el.querySelector('.text')?.textContent).toBe('Pas à jour');
    el.querySelector<HTMLButtonElement>('button')!.click();
    expect(retry).toHaveBeenCalledOnce();
  });
});
