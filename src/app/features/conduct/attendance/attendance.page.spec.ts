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
  emptyAttendanceFixture,
  withPendingJustification,
} from '../../../../testing/attendance.fixture';
import { GRACE } from '../../../../testing/bootstrap.fixture';
import { stubDialog } from '../../../../testing/dialog';
import { AbsenceJustification, ChildAttendance } from '../../../core/api/conduct.contract';
import { ParentApi } from '../../../core/api/parent-api';
import AttendancePage from './attendance.page';

registerLocaleData(localeFr);

describe('AttendancePage', () => {
  beforeAll(stubDialog);

  async function render(
    params: { month?: string; date?: string } = {},
    attendance: () => Observable<ChildAttendance> = () => of(attendanceFixture()),
  ) {
    const justifyAbsence = vi.fn((): Observable<HttpEvent<AbsenceJustification>> =>
      of(new HttpResponse({ status: 201, body: {} as AbsenceJustification })),
    );
    const api = { attendance: vi.fn(attendance), justifyAbsence };
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
    expect(el.querySelector('app-attendance-header .days')?.textContent).toBe('20 jours sur 25');
    expect(el.querySelector('app-month-navigator .date')?.textContent).toBe('Octobre 2026');
    expect(el.querySelector('app-month-navigator .meta')?.textContent).toBe(
      '3 jours d’école · 2 absences · aucun retard',
    );
  });

  it('montre le mois de l’URL, sa grille et ses absences et retards', async () => {
    const { el } = await render({ month: '2026-09' });

    expect(el.querySelector('app-month-navigator .date')?.textContent).toBe('Septembre 2026');
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
    expect(api.attendance).toHaveBeenCalledTimes(2);
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
