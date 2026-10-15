import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AssignmentWindow, CivilDate } from '../../../../core/api/assignments.contract';
import { DayNavigatorComponent } from './day-navigator.component';

registerLocaleData(localeFr);

const WINDOW: AssignmentWindow = {
  from: '2026-09-01',
  to: '2026-10-20',
  today: '2026-09-22',
  schoolDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
};

describe('DayNavigatorComponent', () => {
  async function render(day: CivilDate) {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(DayNavigatorComponent);
    fixture.componentRef.setInput('day', day);
    fixture.componentRef.setInput('window', WINDOW);
    fixture.componentRef.setInput('summary', '2 épreuves');
    const emitted: CivilDate[] = [];
    fixture.componentInstance.dayChange.subscribe((value) => emitted.push(value));
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = (name: string) => el.querySelector<HTMLButtonElement>(`[aria-label="${name}"]`)!;
    return { fixture, el, emitted, button };
  }

  it('dit le jour, sa position et son contenu, et l’annonce', async () => {
    const { el } = await render('2026-09-24');

    expect(el.querySelector('.date')?.textContent).toBe('jeudi 24 septembre 2026');
    expect(el.querySelector('.meta')?.textContent).toContain('dans 2 jours');
    expect(el.querySelector('[aria-live]')?.textContent).toBe('Jeudi 24 septembre, 2 épreuves');
  });

  it('saute le week-end', async () => {
    const { emitted, button } = await render('2026-09-25');

    button('Jour suivant').click();
    expect(emitted).toEqual(['2026-09-28']);
  });

  it('désactive la flèche à la borne et rend alors le focus à la date', async () => {
    const { fixture, el, emitted, button } = await render('2026-10-19');

    button('Jour suivant').focus();
    button('Jour suivant').click();
    fixture.componentRef.setInput('day', emitted[0]);
    await fixture.whenStable();

    expect(emitted).toEqual(['2026-10-20']);
    expect(button('Jour suivant').disabled).toBe(true);
    expect(document.activeElement).toBe(el.querySelector('.date'));
  });

  it("ramène à aujourd'hui, puis masque le bouton sans perdre le focus", async () => {
    const { fixture, el, emitted } = await render('2026-09-15');
    const today = el.querySelector<HTMLButtonElement>('.today')!;

    today.focus();
    today.click();
    fixture.componentRef.setInput('day', emitted[0]);
    await fixture.whenStable();

    expect(emitted).toEqual(['2026-09-22']);
    expect(el.querySelector('.today')).toBeNull();
    expect(document.activeElement).toBe(el.querySelector('.date'));
  });

  it('remet le champ sur le jour affiché quand la date choisie est refusée', async () => {
    const { el, emitted } = await render('2026-09-24');
    const input = el.querySelector<HTMLInputElement>('input[type="date"]')!;

    input.value = '2027-03-01';
    input.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([]);
    expect(input.value).toBe('2026-09-24');

    input.value = '2026-09-15';
    input.dispatchEvent(new Event('change'));
    expect(emitted).toEqual(['2026-09-15']);
  });
});
