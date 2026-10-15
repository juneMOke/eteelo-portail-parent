import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gradeWeekFixture } from '../../../../../testing/grades-week.fixture';
import { WeekNavigatorComponent } from './week-navigator.component';

registerLocaleData(localeFr);

describe('WeekNavigatorComponent', () => {
  async function render(date?: string) {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(WeekNavigatorComponent);
    fixture.componentRef.setInput('week', gradeWeekFixture(date));
    const emitted: string[] = [];
    fixture.componentInstance.weekChange.subscribe((day) => emitted.push(day));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = (name: string) => el.querySelector<HTMLButtonElement>(`[aria-label="${name}"]`)!;
    return { el, emitted, button };
  }

  it('nomme la semaine et la résume', async () => {
    const { el } = await render('2026-09-16');

    expect(el.querySelector('.date')?.textContent).toBe('Semaine du 14 au 18 septembre');
    expect(el.querySelector('.meta')?.textContent).toBe('7 évaluations · 5 notées · 1 en attente');
  });

  it('avance d’une semaine et revient à la semaine en cours', async () => {
    const { el, emitted, button } = await render('2026-09-16');

    button('Semaine suivante').click();
    el.querySelector<HTMLButtonElement>('.today')!.click();

    expect(emitted).toEqual(['2026-09-21', '2026-09-21']);
  });

  it('s’arrête à la semaine en cours et à la rentrée', async () => {
    const current = await render();
    expect(current.button('Semaine suivante').disabled).toBe(true);
    expect(current.el.querySelector('.today')).toBeNull();

    TestBed.resetTestingModule();
    const first = await render('2026-09-08');
    expect(first.button('Semaine précédente').disabled).toBe(true);
    expect(first.el.querySelector('input')?.getAttribute('max')).toBe('2026-09-27');
  });
});
