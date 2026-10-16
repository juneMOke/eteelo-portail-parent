import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ATTENDANCE_TODAY, attendanceFixture } from '../../../../../testing/attendance.fixture';
import { calendarWeeks, daysByDate } from '../../data-access/attendance-view';
import { MonthCalendarComponent } from './month-calendar.component';

registerLocaleData(localeFr);

describe('MonthCalendarComponent', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(MonthCalendarComponent);
    const days = daysByDate(attendanceFixture().days);
    fixture.componentRef.setInput('weeks', calendarWeeks('2026-10', days, ATTENDANCE_TODAY));
    fixture.componentRef.setInput('legend', ['present', 'unexcused']);
    fixture.componentRef.setInput('caption', 'Octobre 2026');
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('nomme chaque jour avec son état, sans laisser la couleur seule', async () => {
    const { el } = await render();
    const absent = el.querySelector('[aria-label="Vendredi 2 octobre, absent, non justifié."]');

    expect(absent?.tagName).toBe('BUTTON');
    expect(absent?.querySelector('.glyph')).not.toBeNull();
    expect(el.querySelector('[aria-label="Jeudi 1 octobre, présent."]')?.tagName).toBe('SPAN');
  });

  it('cercle aujourd’hui et l’ouvre même avant l’appel', async () => {
    const { el, fixture } = await render();
    const opened = vi.fn();
    fixture.componentInstance.open.subscribe(opened);
    const today = el.querySelector<HTMLButtonElement>('.today')!;

    expect(today.getAttribute('aria-label')).toBe(
      'Mardi 6 octobre, aujourd’hui, présence pas encore enregistrée.',
    );
    today.click();
    expect(opened).toHaveBeenCalledWith(ATTENDANCE_TODAY);
  });

  it('limite la légende aux états du mois', async () => {
    const { el } = await render();

    expect([...el.querySelectorAll('.legend li')].map((li) => li.textContent?.trim())).toEqual([
      'Présent',
      'Absent · non justifié',
    ]);
  });
});
