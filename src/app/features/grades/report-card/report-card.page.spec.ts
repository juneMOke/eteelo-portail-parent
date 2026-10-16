import { HttpErrorResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE } from '../../../../testing/bootstrap.fixture';
import { GRADE_PERIODS, TERM } from '../../../../testing/grades-terms.fixture';
import { COURSE } from '../../../../testing/grades-week.fixture';
import { REPORT_CARD_PDF, reportCardFixture } from '../../../../testing/report-card.fixture';
import { GradeQuery, ReportCard } from '../../../core/api/grades.contract';
import { ParentApi } from '../../../core/api/parent-api';
import ReportCardPage from './report-card.page';

registerLocaleData(localeFr);

describe('ReportCardPage', () => {
  async function render(
    inputs: { term?: string; part?: string } = {},
    reportCard: (childId: string, query: GradeQuery) => Observable<ReportCard> = (_, query) =>
      of(reportCardFixture(query)),
  ) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        {
          provide: ParentApi,
          useValue: { reportCard, gradePeriods: () => of([...GRADE_PERIODS]) },
        },
      ],
    });
    const fixture = TestBed.createComponent(ReportCardPage);
    fixture.componentRef.setInput('childId', GRACE.childId);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    await settle();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const published = (_: string, query: GradeQuery) => of(reportCardFixture(query, true));

  it('montre un bulletin provisoire, sans rang ni PDF', async () => {
    const el = await render();

    expect(el.querySelector('app-average-header .status')?.textContent?.trim()).toBe('Provisoire');
    expect(el.querySelector('app-term-picker ui-filter-menu .value-label')?.textContent).toBe(
      '1er trimestre',
    );
    expect(el.querySelector('.rank')).toBeNull();
    expect(el.querySelectorAll('app-report-line')).toHaveLength(8);
    expect(el.querySelector('app-report-document a')).toBeNull();
  });

  it('montre le bulletin officiel, son rang et son PDF scellé', async () => {
    const el = await render({}, published);
    const download = el.querySelector<HTMLAnchorElement>('app-report-document a')!;

    expect(el.querySelector('.rank-value')?.textContent).toBe('8e sur 32');
    expect(el.querySelector('app-report-document h2')?.textContent).toBe(
      'Bulletin du 1er trimestre',
    );
    expect(download.getAttribute('href')).toBe(REPORT_CARD_PDF);
  });

  it('ouvre Mes cours sur le cours d’une ligne, même sélection', async () => {
    const el = await render({ term: TERM.first }, published);
    const line = el.querySelectorAll('app-report-line a')[2];

    expect(line.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/grades/courses?term=${TERM.first}&part=ALL&course=${COURSE.geography}`,
    );
  });

  it('remplace l’en-tête et les lignes quand la période n’est pas encore cotée', async () => {
    const el = await render({ term: TERM.first, part: 'SECOND' });

    expect(el.querySelector('ui-empty-period h2')?.textContent).toBe(
      'Le bulletin de cette période sera publié par l’école en fin de période.',
    );
    expect(el.querySelector('app-average-header')).toBeNull();
    expect(el.querySelector('app-report-document p')?.textContent).toContain(
      'après sa publication',
    );
  });

  it('dit que le bulletin demande une connexion quand l’appel échoue', async () => {
    const el = await render({}, () => throwError(() => new HttpErrorResponse({ status: 0 })));

    expect(el.querySelector('ui-load-error h2')?.textContent).toBe(
      'Impossible d’afficher le bulletin',
    );
  });
});
