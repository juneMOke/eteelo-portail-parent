import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import { TALKING, disciplineFixture } from '../../../../testing/discipline.fixture';
import { TERM } from '../../../../testing/grades-terms.fixture';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import DisciplinePage from './discipline.page';

registerLocaleData(localeFr);

describe('DisciplinePage', () => {
  async function render(params: { term?: string; case?: string } = {}) {
    const api = {
      discipline: vi.fn((_: string, periodId?: string) => of(disciplineFixture(periodId))),
      bootstrap: vi.fn(() => of(bootstrapFixture())),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ParentApi, useValue: api },
      ],
    });
    await TestBed.inject(SessionStore).ensureLoaded();
    const fixture = TestBed.createComponent(DisciplinePage);
    fixture.componentRef.setInput('childId', GRACE.childId);
    for (const [name, value] of Object.entries(params)) fixture.componentRef.setInput(name, value);
    await settle();
    await fixture.whenStable();
    return { fixture, api, el: fixture.nativeElement as HTMLElement };
  }

  const titles = (el: HTMLElement) =>
    [...el.querySelectorAll('app-case-card h3')].map((title) => title.textContent);

  it('montre le trimestre en cours, son bilan et ses faits, le plus récent en haut', async () => {
    const { el, api } = await render();

    expect(api.discipline).toHaveBeenCalledWith(GRACE.childId, undefined);
    expect(el.querySelector('app-discipline-summary')?.textContent).toContain(
      '2 faits mineurs · 1 fait majeur · aucun fait grave',
    );
    expect(titles(el)).toEqual([
      'Retards répétés',
      'Absence non justifiée',
      'Bavardage en cours de chimie',
    ]);
  });

  it('sépare ce que l’école a fait de ce qu’elle attend du parent', async () => {
    const { el } = await render();
    const [lateness, absence] = el.querySelectorAll('app-case-card');

    expect(lateness.querySelector('.request')?.textContent).toBe(
      'L’école vous demande un entretien.',
    );
    expect(lateness.textContent).not.toContain('Suite donnée');
    expect(absence.querySelector('.follow-up')?.textContent).toContain('Avertissement écrit');
    expect(absence.querySelector('a')?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/conduct/attendance?month=2026-09&date=2026-09-16`,
    );
  });

  it('place en tête le fait ciblé', async () => {
    const { el } = await render({ case: TALKING.id });

    expect(titles(el)[0]).toBe('Bavardage en cours de chimie');
    expect(el.querySelector('app-case-card')?.classList).toContain('targeted');
  });

  it('change de trimestre par l’URL et dit un trimestre sans fait', async () => {
    const { el, fixture } = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    [...el.querySelectorAll('ui-pill-group button')]
      .find((button) => button.textContent?.trim() === '2e trimestre')!
      .dispatchEvent(new Event('click'));
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { term: TERM.second, case: null } }),
    );

    fixture.componentRef.setInput('term', TERM.second);
    await settle();
    await fixture.whenStable();
    expect(el.querySelector('ui-empty-period')?.textContent).toContain(
      'Aucun fait consigné ce trimestre.',
    );
  });

  it('renvoie au secrétariat de l’école pour une question', async () => {
    const { el } = await render();

    expect(el.querySelector('app-school-contact a')?.getAttribute('href')).toBe(
      'tel:+243998877665',
    );
  });
});
