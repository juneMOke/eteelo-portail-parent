import { TestBed } from '@angular/core/testing';
import { PeriodNavigatorComponent } from './period-navigator.component';

describe('PeriodNavigatorComponent', () => {
  async function render(inputs: { hasNext?: boolean; showCurrent?: boolean } = {}) {
    const fixture = TestBed.createComponent(PeriodNavigatorComponent);
    const set = (name: string, value: unknown) => fixture.componentRef.setInput(name, value);
    set('label', 'Semaine du 21 au 25 septembre');
    set('meta', '6 évaluations');
    set('previousLabel', 'Semaine précédente');
    set('nextLabel', 'Semaine suivante');
    set('hasPrevious', true);
    set('hasNext', inputs.hasNext ?? true);
    set('value', '2026-09-21');
    set('min', '2026-09-01');
    set('max', '2026-09-27');
    set('currentLabel', 'Cette semaine');
    set('showCurrent', inputs.showCurrent ?? true);
    set('announcement', 'Semaine du 21 au 25 septembre, 6 évaluations');
    const events: unknown[] = [];
    fixture.componentInstance.step.subscribe((d) => events.push(d));
    fixture.componentInstance.pick.subscribe((d) => events.push(d));
    fixture.componentInstance.current.subscribe(() => events.push('current'));
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = (name: string) => el.querySelector<HTMLButtonElement>(`[aria-label="${name}"]`)!;
    return { fixture, el, events, button };
  }

  it('affiche le libellé, le contexte et l’annonce', async () => {
    const { el } = await render();

    expect(el.querySelector('.date')?.textContent).toBe('Semaine du 21 au 25 septembre');
    expect(el.querySelector('.meta')?.textContent).toBe('6 évaluations');
    expect(el.querySelector('[aria-live]')?.textContent).toContain('6 évaluations');
  });

  it('émet le sens des flèches et désactive celle de la borne', async () => {
    const { events, button } = await render({ hasNext: false });

    button('Semaine précédente').click();
    expect(events).toEqual([-1]);
    expect(button('Semaine suivante').disabled).toBe(true);
  });

  it('refuse une date hors bornes et remet le champ', async () => {
    const { el, events } = await render();
    const field = el.querySelector<HTMLInputElement>('input[type="date"]')!;

    field.value = '2026-10-15';
    field.dispatchEvent(new Event('change'));
    expect(events).toEqual([]);
    expect(field.value).toBe('2026-09-21');

    field.value = '2026-09-10';
    field.dispatchEvent(new Event('change'));
    expect(events).toEqual(['2026-09-10']);
  });

  it('ramène à la période courante et rend le focus au libellé', async () => {
    const { fixture, el, events } = await render();

    el.querySelector<HTMLButtonElement>('.today')!.click();
    fixture.componentRef.setInput('showCurrent', false);
    await fixture.whenStable();

    expect(events).toEqual(['current']);
    expect(el.querySelector('.today')).toBeNull();
    expect(document.activeElement).toBe(el.querySelector('.date'));
  });
});
