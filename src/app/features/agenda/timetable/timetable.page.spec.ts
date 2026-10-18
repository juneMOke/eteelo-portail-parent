import { HttpErrorResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { settle } from '../../../../testing/async';
import { DAVID, GRACE } from '../../../../testing/bootstrap.fixture';
import { course, timetableFixture } from '../../../../testing/timetable.fixture';
import { ParentApi } from '../../../core/api/parent-api';
import { TimetableWeek } from '../../../core/api/timetable.contract';
import TimetablePage from './timetable.page';

registerLocaleData(localeFr);

/** Grand écran simulé : `mediaQuery` lit `matchMedia`, absent du rendu de test. */
function wideScreen(): void {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim();

describe('TimetablePage', () => {
  afterEach(() => vi.unstubAllGlobals());

  async function render(
    inputs: { date?: string; view?: string; childId?: string } = {},
    timetable: (childId: string, week?: string) => Observable<TimetableWeek> = (id, week) =>
      of(timetableFixture(week, id)!),
  ) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ParentApi, useValue: { timetable } },
      ],
    });
    const fixture = TestBed.createComponent(TimetablePage);
    fixture.componentRef.setInput('childId', inputs.childId ?? GRACE.childId);
    if (inputs.date) fixture.componentRef.setInput('date', inputs.date);
    if (inputs.view) fixture.componentRef.setInput('view', inputs.view);
    await settle();
    await fixture.whenStable();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    return { fixture, el: fixture.nativeElement as HTMLElement, navigate };
  }

  it('s’ouvre sur aujourd’hui, le cours en cours marqué « En ce moment »', async () => {
    const { el } = await render();

    expect(text(el.querySelector('.title'))).toBe('Mardi 22 septembre 2026');
    expect(text(el.querySelector('.summary'))).toBe('Aujourd’hui · 5 cours · 7 h 30 à 11 h 45');
    expect(el.querySelector('.current')).toBeNull();
    expect(text(el.querySelector('app-day-schedule .count'))).toBe('5 cours');
    const slots = el.querySelectorAll('.slot');
    expect(slots).toHaveLength(6);
    expect(text(slots[0].querySelector('.start'))).toBe('7 h 30');
    expect(text(slots[0].querySelector('.end'))).toBe('8 h 15');
    expect(text(slots[2].querySelector('.start'))).toBe('9 h 00');
    expect(text(slots[2].querySelector('.pause'))).toBe('Récréation');
    expect(slots[2].querySelector('.end')).toBeNull();
    const now = el.querySelector('.slot.now');
    expect(text(now?.querySelector('.subject'))).toBe('Mathématiques');
    expect(text(now?.querySelector('.now-pill'))).toBe('En ce moment');
    expect(text(now?.querySelector('.initials'))).toBe('MA');
    expect(text(now?.querySelector('.meta'))).toBe('Ilunga Mbuyi Jean · Salle 12');
  });

  it('montre la bande des jours, le jour choisi et le point d’aujourd’hui', async () => {
    const { el, navigate } = await render();
    const days = [...el.querySelectorAll<HTMLButtonElement>('.strip .day')];

    expect(days.map((day) => text(day.querySelector('.weekday')))).toEqual([
      'Lun',
      'Mar',
      'Mer',
      'Jeu',
      'Ven',
    ]);
    expect(text(days[1].querySelector('.number'))).toBe('22');
    expect(days[1].getAttribute('aria-label')).toBe('Mardi 22 septembre 2026');
    expect(days[1].getAttribute('aria-pressed')).toBe('true');
    expect(days[1].classList).toContain('today');

    days[3].click();
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { date: '2026-09-24' }, replaceUrl: true }),
    );
  });

  it('pose les épreuves dans leur cours, chacune vers sa fiche', async () => {
    const { el } = await render({ date: '2026-09-24' });

    expect(text(el.querySelector('.summary'))).toBe('4 cours · 7 h 30 à 11 h 45 · 2 épreuves');
    const exams = [...el.querySelectorAll<HTMLAnchorElement>('a.exam')];
    expect(exams.map((exam) => text(exam))).toEqual([
      'Interrogation · 45 min — voir le programme',
      'Examen · 2 h — voir le programme',
    ]);
    expect(exams[1].getAttribute('href')).toBe(
      `/c/${GRACE.childId}/assessments/41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a06?from=timetable&date=2026-09-24`,
    );
    expect(text(el.querySelector('.current'))).toBe('Revenir à aujourd’hui');
  });

  it('passe au jour voisin, et du vendredi au lundi suivant', async () => {
    const { el, navigate } = await render({ date: '2026-09-25' });

    el.querySelector<HTMLButtonElement>('[aria-label="Jour suivant"]')?.click();

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { date: '2026-09-28' } }),
    );
  });

  it('dit un jour sans cours et mène au prochain jour d’école', async () => {
    const { el } = await render({ date: '2026-10-02' });

    expect(text(el.querySelector('.summary'))).toBe('Aucun cours');
    expect(text(el.querySelector('app-day-schedule .count'))).toBe('aucun cours');
    expect(text(el.querySelector('.closed-title'))).toBe('Aucun cours ce jour');
    expect(text(el.querySelector('.next-day'))).toBe('Prochain jour d’école : lundi 05/10 ›');
  });

  it('dit un emploi du temps pas encore publié', async () => {
    const { el } = await render({ childId: DAVID.childId });

    expect(text(el.querySelector('.closed-title'))).toBe('Emploi du temps pas encore publié');
    expect(el.querySelector('.next-day')).toBeNull();
  });

  it('dit un cours annulé ou remplacé', async () => {
    const week = timetableFixture()!;
    const tuesday = week.days[1];
    const items = [
      course('french', '07:30', '08:15', {
        status: 'CANCELLED',
        cancelReason: 'enseignante absente',
      }),
      course('english', '08:15', '09:00', {
        status: 'CHANGED',
        substituteTeacherLabel: 'Kalala Mukendi Pierre',
      }),
    ];
    const { el } = await render({ date: '2026-09-22' }, () =>
      of({ ...week, days: [week.days[0], { ...tuesday, items }, ...week.days.slice(2)] }),
    );
    const [cancelled, changed] = el.querySelectorAll('app-course-card');

    expect(cancelled.classList).toContain('cancelled');
    expect(text(cancelled.querySelector('.notice'))).toBe('Annulé · enseignante absente');
    expect(cancelled.querySelector('.meta')).toBeNull();
    expect(text(changed.querySelector('.meta'))).toBe('Kalala Mukendi Pierre · Salle 8');
    expect(text(changed.querySelector('.notice'))).toBe('Remplacé par Kalala Mukendi Pierre');
  });

  it('montre la semaine en colonnes au grand écran', async () => {
    wideScreen();
    const { el } = await render({ view: 'week' });

    expect(text(el.querySelector('.title'))).toBe('Semaine du 21 au 25 septembre');
    expect(text(el.querySelector('.summary'))).toBe('Cette semaine · 21 cours');
    expect(el.querySelector('.strip')).toBeNull();
    const columns = el.querySelectorAll('app-week-schedule .column');
    expect(columns).toHaveLength(5);
    expect(columns[1].classList).toContain('today');
    const head = columns[1].querySelector('.column-head');
    expect(text(head?.querySelector('.weekday'))).toBe('Mardi');
    expect(text(head?.querySelector('.date'))).toBe('22 sept.');
    expect(text(head?.querySelector('.near'))).toBe('aujourd’hui');
    expect(text(columns[3].querySelector('.exam-line'))).toBe('Interrogation · 45 min');
    expect(columns[0].querySelector('.meta')).toBeNull();
  });

  it('ne reporte pas la vue semaine au téléphone', async () => {
    const { el } = await render({ view: 'week' });

    expect(el.querySelector('app-week-schedule')).toBeNull();
    expect(el.querySelector('app-day-schedule')).not.toBeNull();
    expect(el.querySelector('.views')).toBeNull();
  });

  it('propose de réessayer quand l’emploi du temps ne se charge pas', async () => {
    const { el } = await render({}, () => throwError(() => new HttpErrorResponse({ status: 500 })));

    expect(text(el.querySelector('ui-load-error'))).toContain(
      'Impossible d’afficher l’emploi du temps',
    );
  });
});
