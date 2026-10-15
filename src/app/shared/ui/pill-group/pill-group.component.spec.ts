import { TestBed } from '@angular/core/testing';
import { PillGroupComponent, PillOption } from './pill-group.component';

const OPTIONS: readonly PillOption[] = [
  { id: null, label: 'Tout le trimestre', available: true, hint: null },
  { id: 'p1', label: '1re période', available: true, hint: null },
  { id: 'exam', label: 'Examen', available: false, hint: 'Ouvre le 07/12' },
];

describe('PillGroupComponent', () => {
  async function render(checked: string | null | undefined) {
    const fixture = TestBed.createComponent(PillGroupComponent);
    fixture.componentRef.setInput('label', 'Période');
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('checked', checked);
    const picks: (string | null)[] = [];
    fixture.componentInstance.pick.subscribe((id) => picks.push(id));
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { el, picks, radios: [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')] };
  }

  it('nomme le groupe et coche l’option choisie, seule dans la tabulation', async () => {
    const { el, radios } = await render('p1');
    const group = el.querySelector('[role="radiogroup"]')!;

    expect(el.querySelector(`#${group.getAttribute('aria-labelledby')}`)?.textContent).toBe(
      'Période',
    );
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('sans option cochée, laisse entrer par la première active', async () => {
    const { radios } = await render(undefined);

    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });

  it('garde une option inactive visible, avec sa raison, sans l’émettre', async () => {
    const { picks, radios } = await render('p1');

    expect(radios[2].getAttribute('aria-disabled')).toBe('true');
    expect(radios[2].title).toBe('Ouvre le 07/12');
    expect(radios[2].getAttribute('aria-label')).toBe('Examen, Ouvre le 07/12');
    radios[2].click();
    radios[0].click();
    expect(picks).toEqual([null]);
  });

  it('parcourt aux flèches en sautant l’option inactive', async () => {
    const { radios } = await render('p1');

    radios[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

    expect(document.activeElement).toBe(radios[0]);
  });
});
