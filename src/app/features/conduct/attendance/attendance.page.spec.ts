import { HttpEvent, HttpResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { settle } from '../../../../testing/async';
import {
  attendanceFixture,
  attendanceRangeFixture,
  emptyAttendanceFixture,
  withPendingJustification,
} from '../../../../testing/attendance.fixture';
import { GRACE } from '../../../../testing/bootstrap.fixture';
import { stubDialog } from '../../../../testing/dialog';
import {
  AbsenceJustification,
  AttendanceRange,
  ChildAttendance,
} from '../../../core/api/conduct.contract';
import { ParentApi } from '../../../core/api/parent-api';
import AttendancePage from './attendance.page';

registerLocaleData(localeFr);

describe('AttendancePage', () => {
  beforeAll(stubDialog);

  async function render(
    params: { month?: string; week?: string; date?: string } = {},
    attendance: () => Observable<ChildAttendance> = () => of(attendanceFixture()),
  ) {
    const justifyAbsence = vi.fn((): Observable<HttpEvent<AbsenceJustification>> =>
      of(new HttpResponse({ status: 201, body: {} as AbsenceJustification })),
    );
    // Avec une plage : le résumé de la semaine, comme le serveur.
    const api = {
      attendance: vi.fn((_: string, range?: AttendanceRange) =>
        range ? of(attendanceRangeFixture(attendanceFixture(), range)) : attendance(),
      ),
      justifyAbsence,
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ParentApi, useValue: api },
      ],
    });
    const fixture = TestBed.createComponent(AttendancePage);
    fixture.componentRef.setInput('childId', GRACE.childId);
    for (const [name, value] of Object.entries(params)) fixture.componentRef.setInput(name, value);
    await settle();
    await fixture.whenStable();
    return { fixture, api, el: fixture.nativeElement as HTMLElement };
  }

  const texts = (el: HTMLElement, selector: string) =>
    [...el.querySelectorAll(selector)].map((node) => node.textContent?.trim());

  it('met en haut ce qui attend le parent, puis le taux et le mois en cours', async () => {
    const { el } = await render();

    expect(texts(el, 'app-pending-absences .day')).toEqual(['Mardi 29/09', 'Vendredi 02/10']);
    expect(el.querySelector('app-pending-absences .more')?.textContent).toContain('et 1 autre');
    expect(el.querySelector('app-attendance-header .days')?.textContent).toBe(
      '20 jours présents sur 25',
    );
    expect(el.querySelector('app-month-navigator .title')?.textContent).toBe('Octobre 2026');
    expect(el.querySelector('app-month-navigator .meta')?.textContent).toBe(
      '3 jours d’école · 2 absences · aucun retard',
    );
  });

  it('montre la semaine en cours, jour par jour, avec le résumé que le serveur en fait', async () => {
    const { el, api } = await render();

    expect(texts(el, '.scale-title')).toEqual([
      'La semaine jour par jour',
      'Le mois vue calendrier',
    ]);
    expect(el.querySelector('.scale ui-week-banner .relative')?.textContent).toBe('cette sem.');
    expect(texts(el, 'app-week-days .visually-hidden')).toEqual([
      'Lundi 5 octobre, absent, justification envoyée',
      'Mardi 6 octobre, pas encore enregistrée',
      'Mercredi 7 octobre, à venir',
      'Jeudi 8 octobre, à venir',
      'Vendredi 9 octobre, à venir',
    ]);
    expect(api.attendance).toHaveBeenCalledWith(GRACE.childId, {
      from: '2026-10-05',
      to: '2026-10-06',
    });
    expect(el.querySelector('app-week-indicators .count')?.textContent).toBe(
      '0 jour présent sur 1 · aucun retard',
    );
  });

  it('montre la semaine de l’URL et ses quatre indicateurs', async () => {
    const { el } = await render({ week: '2026-09-16' });

    expect(el.querySelector('.scale ui-week-banner .title')?.textContent).toBe('14 – 18 sept.');
    expect(texts(el, 'app-week-days .word')).toEqual([
      'En retard',
      'Présent',
      'Absent · non justifié',
      'Présent',
      'En retard',
    ]);
    expect(texts(el, 'app-week-indicators dd')).toEqual(['80 %', '0', '1', '2']);
    expect(el.querySelector('app-week-indicators .count')?.textContent).toBe(
      '4 jours présents sur 5 · 2 retards',
    );
  });

  it('change de semaine par l’URL, sans toucher au mois', async () => {
    const { el } = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    el.querySelector<HTMLButtonElement>('[aria-label="Semaine précédente"]')!.click();

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { week: '2026-09-28', date: null },
        queryParamsHandling: 'merge',
      }),
    );
  });

  it('montre le mois de l’URL, sa grille et ses absences et retards', async () => {
    const { el } = await render({ month: '2026-09' });

    expect(el.querySelector('app-month-navigator .title')?.textContent).toBe('Septembre 2026');
    expect(
      el.querySelector('[aria-label="Mercredi 16 septembre, absent, non justifié."]'),
    ).not.toBeNull();
    expect(texts(el, 'app-absence-list .detail')).toContain('En retard · arrivé à 7 h 52');
    expect(el.querySelectorAll('app-absence-list li')).toHaveLength(6);
  });

  it('ouvre la fiche du jour ciblé, avec la suite disciplinaire', async () => {
    const { el } = await render({ date: '2026-09-16' });
    await settle();

    const sheet = el.querySelector('app-day-sheet dialog');
    expect(sheet?.hasAttribute('open')).toBe(true);
    expect(sheet?.textContent).toContain('Absent · non justifié');
    expect(sheet?.textContent).toContain('Le délai de justification est passé.');
    expect(sheet?.querySelector('a')?.getAttribute('href')).toContain(
      'conduct/discipline?term=a1000000-0000-4000-8000-000000000001&case=',
    );
  });

  it('change de mois par l’URL', async () => {
    const { el } = await render({ month: '2026-09' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    el.querySelector<HTMLButtonElement>('[aria-label="Mois suivant"]')!.click();

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { month: '2026-10', date: null }, replaceUrl: true }),
    );
  });

  it('justifie une absence, puis relit la présence', async () => {
    const pending = withPendingJustification(attendanceFixture(), '2026-10-02');
    const answers = [attendanceFixture(), pending];
    const { fixture, el, api } = await render({}, () => of(answers.shift() ?? pending));

    el.querySelector<HTMLButtonElement>(
      '[aria-label="Justifier l’absence du Vendredi 02/10"]',
    )!.click();
    await fixture.whenStable();
    const form = el.querySelector('app-justification-sheet form')!;
    [...form.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Maladie')!.click();
    await fixture.whenStable();
    form.dispatchEvent(new Event('submit'));
    await settle();
    await fixture.whenStable();

    expect(api.justifyAbsence).toHaveBeenCalledWith(
      GRACE.childId,
      '2026-10-02',
      expect.objectContaining({ reason: 'SICKNESS', note: '' }),
    );
    expect(api.attendance.mock.calls.filter(([, range]) => !range)).toHaveLength(2);
    expect(texts(el, 'app-pending-absences .detail')).toEqual([
      'À justifier jusqu’au 06/10',
      'Justification envoyée · en attente de l’école',
    ]);
  });

  it('dit quand la présence commence, en début d’année', async () => {
    const { el } = await render({}, () => of(emptyAttendanceFixture()));

    expect(el.querySelector('ui-empty-period')?.textContent).toContain(
      'La présence est enregistrée à partir du mardi 1 septembre.',
    );
    expect(el.querySelector('app-month-calendar')).toBeNull();
  });

  it('propose de réessayer quand la présence ne se charge pas', async () => {
    const { el } = await render({}, () => throwError(() => new Error('réseau')));

    expect(el.querySelector('ui-load-error')?.textContent).toContain(
      'Impossible d’afficher la présence',
    );
  });
});
