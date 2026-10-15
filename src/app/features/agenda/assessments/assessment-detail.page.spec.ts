import { HttpErrorResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  CHEMISTRY_GRADED,
  CHEMISTRY_UPCOMING,
  FRENCH_ABSENT,
  HISTORY_UPCOMING,
  evaluationDetailFixture,
} from '../../../../testing/assessments.fixture';
import { settle } from '../../../../testing/async';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import AssessmentDetailPage from './assessment-detail.page';

registerLocaleData(localeFr);

describe('AssessmentDetailPage', () => {
  async function render(evaluationId: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        {
          provide: ParentApi,
          useValue: {
            bootstrap: () => of(bootstrapFixture()),
            evaluation: (_: string, id: string) => {
              const detail = evaluationDetailFixture(id);
              return detail ? of(detail) : throwError(() => new HttpErrorResponse({ status: 404 }));
            },
          },
        },
      ],
    });
    await TestBed.inject(SessionStore).ensureLoaded();
    const fixture = TestBed.createComponent(AssessmentDetailPage);
    fixture.componentRef.setInput('childId', GRACE.childId);
    fixture.componentRef.setInput('evaluationId', evaluationId);
    await settle();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const blocks = (el: HTMLElement) =>
    [...el.children].map((child) => child.tagName.toLowerCase()).filter((tag) => tag !== 'p');

  it('présente une épreuve à venir : bandeau, grille, programme, pas de document', async () => {
    const el = await render(CHEMISTRY_UPCOMING.evaluationId);

    expect(el.querySelector('app-identity-banner h2')?.textContent).toBe(
      'Interrogation de Chimie — les bases',
    );
    expect(el.querySelector('.subtitle')?.textContent).toBe('Chimie · Interrogation');
    expect([...el.querySelectorAll('dd')].map((dd) => dd.textContent)).toEqual([
      '17/09/2026',
      'jeudi 24/09/2026',
      '45 min',
      '—',
    ]);
    expect(el.querySelector('app-instructions-block h3')?.textContent).toBe('Au programme');
    expect(el.querySelectorAll('app-instructions-block li')).toHaveLength(3);
    expect(el.querySelector('.note')?.textContent).toBe('Calculatrice autorisée.');
    expect(el.querySelector('.no-document')?.textContent).toContain('Aucun document déposé');
    expect(el.querySelector('app-result-block')).toBeNull();
  });

  it('met le résultat en tête une fois corrigée, puis le corrigé et les questions', async () => {
    const el = await render(CHEMISTRY_GRADED.evaluationId);

    expect(blocks(el)).toEqual([
      'app-identity-banner',
      'app-result-block',
      'app-document-row',
      'app-instructions-block',
    ]);
    expect(el.querySelector('app-result-block ui-grade')?.textContent).toContain('13,5/20');
    expect(el.querySelector('.context')?.textContent).toContain('moyenne de la classe 11,5/20');
    expect(el.querySelector('blockquote')?.textContent).toContain('Bonne maîtrise du pH');
    expect(el.querySelector('app-document-row .meta')?.textContent).toContain('PDF · 1,3 Mo');
    expect(el.querySelector('app-instructions-block h3')?.textContent).toBe(
      'Questions de l’épreuve',
    );
    expect(el.querySelector('.no-document')).toBeNull();
  });

  it('mène à toutes les notes du cours dans Mes cours', async () => {
    const el = await render(CHEMISTRY_GRADED.evaluationId);
    const link = [...el.querySelectorAll('app-result-block a')].find((a) =>
      a.textContent?.includes('Voir toutes les notes'),
    );

    expect(link?.textContent?.trim()).toBe('Voir toutes les notes de Chimie ›');
    expect(link?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/grades/courses?course=c0a1b2c3-0000-4000-8000-000000000003`,
    );
  });

  it('donne la marche à suivre pour une absence, sans note', async () => {
    const el = await render(FRENCH_ABSENT.evaluationId);
    const result = el.querySelector('app-result-block');

    expect(result?.querySelector('h3')?.textContent).toBe('Ce qu’il reste à faire');
    expect(result?.querySelector('ui-grade')).toBeNull();
    expect(result?.querySelector('blockquote')?.textContent).toBe(
      'Rattrapage prévu le vendredi 2 octobre en salle 4.',
    );
    expect(result?.textContent).not.toContain('0/');
    expect(result?.querySelector('a')?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/conduct/attendance?date=2026-09-17`,
    );
  });

  it("dit quand l'enseignant n'a pas détaillé le programme", async () => {
    const el = await render(HISTORY_UPCOMING.evaluationId);

    expect(el.querySelector('app-instructions-block .empty')?.textContent).toContain(
      'pas détaillé le programme',
    );
  });

  it('dit une épreuve introuvable et ramène à la liste', async () => {
    const el = await render('inconnue');

    expect(el.querySelector('ui-empty-state h2')?.textContent).toBe('Évaluation introuvable');
    expect(el.querySelector('ui-empty-state a')?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/assessments`,
    );
  });
});
