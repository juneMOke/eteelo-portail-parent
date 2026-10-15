import { TestBed } from '@angular/core/testing';
import { LoadErrorComponent } from './load-error.component';

describe('LoadErrorComponent', () => {
  it('dit ce qui manque et propose de réessayer', async () => {
    const fixture = TestBed.createComponent(LoadErrorComponent);
    fixture.componentRef.setInput('heading', 'Impossible d’afficher les notes');
    const retried = vi.fn();
    fixture.componentInstance.retry.subscribe(retried);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h2')?.textContent).toBe('Impossible d’afficher les notes');
    expect(el.querySelector('p')?.textContent).toBe('Vérifiez votre connexion, puis réessayez.');
    el.querySelector('button')!.click();
    expect(retried).toHaveBeenCalled();
  });
});
