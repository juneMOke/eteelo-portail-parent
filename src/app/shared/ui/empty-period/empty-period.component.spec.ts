import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmptyPeriodComponent } from './empty-period.component';

describe('EmptyPeriodComponent', () => {
  async function render(inputs: Record<string, unknown>) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(EmptyPeriodComponent);
    fixture.componentRef.setInput('heading', 'Aucune évaluation cette semaine');
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('mène à la donnée la plus proche', async () => {
    const { fixture, el } = await render({
      linkLabel: 'Dernière évaluation : jeudi 18/09',
      queryParams: { date: '2026-09-18' },
    });
    const clicked = vi.fn();
    fixture.componentInstance.linkClick.subscribe(clicked);
    const link = el.querySelector<HTMLAnchorElement>('a.next')!;

    expect(el.querySelector('h2')?.textContent).toBe('Aucune évaluation cette semaine');
    expect(link.textContent).toBe('Dernière évaluation : jeudi 18/09');
    expect(link.getAttribute('href')).toBe('/?date=2026-09-18');
    link.click();
    expect(clicked).toHaveBeenCalled();
  });

  it('dit un fait quand rien ne mène plus loin', async () => {
    const { el } = await render({ message: 'Rien n’est prévu.' });

    expect(el.querySelector('a')).toBeNull();
    expect(el.querySelector('p')?.textContent).toBe('Rien n’est prévu.');
  });
});
