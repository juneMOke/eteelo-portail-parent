import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  FRENCH_EXCUSED,
  GEOGRAPHY_FAILED,
  HISTORY_UNEXCUSED,
  MATHS_HOMEWORK_PASSED,
  PHYSICS_PENDING,
} from '../../../../../testing/grades-week.fixture';
import { GradeCard } from '../../../../core/api/grades.contract';
import { ResultCardComponent } from './result-card.component';

registerLocaleData(localeFr);

describe('ResultCardComponent', () => {
  async function render(evaluation: GradeCard, showCode = false) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    });
    const fixture = TestBed.createComponent(ResultCardComponent);
    fixture.componentRef.setInput('evaluation', evaluation);
    fixture.componentRef.setInput('link', ['/c', 'c1', 'homework', evaluation.evaluationId]);
    fixture.componentRef.setInput('queryParams', { from: 'grades-week', date: evaluation.date });
    fixture.componentRef.setInput('context', evaluation.subjectLabel);
    fixture.componentRef.setInput('showCode', showCode);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return {
      el,
      link: el.querySelector('a')!,
      text: (s: string) => el.querySelector(s)?.textContent,
    };
  }

  it('dit ce qui a été évalué, la note, l’état, et mène à la fiche', async () => {
    const { el, link, text } = await render(MATHS_HOMEWORK_PASSED, true);

    expect(text('.code')).toBe('MATH');
    expect(text('.title')).toBe('Devoir de Mathématiques — les fractions');
    expect(text('.context')).toBe('Mathématiques · Fractions équivalentes, PPCM');
    expect(el.querySelector('ui-grade')?.textContent).toContain('15/20');
    expect(text('.word')).toBe('Réussie');
    expect(link.getAttribute('href')).toBe(
      `/c/c1/homework/${MATHS_HOMEWORK_PASSED.evaluationId}?from=grades-week&date=2026-09-14`,
    );
    expect(link.getAttribute('aria-label')).toBe(
      'Lundi 14 septembre, Mathématiques, Devoir de Mathématiques — les fractions, 15 sur 20, réussie.',
    );
  });

  it('masque le sigle hors de Ma semaine', async () => {
    const { el } = await render(MATHS_HOMEWORK_PASSED);

    expect(el.querySelector('.code')).toBeNull();
  });

  it('distingue l’attente, l’absence justifiée et le zéro d’une absence non justifiée', async () => {
    const pending = await render(PHYSICS_PENDING);
    expect(pending.text('.placeholder')).toBe('En attente');
    expect(pending.el.querySelector('.word')).toBeNull();
    expect(pending.link.getAttribute('aria-label')).toMatch(/les forces, en attente\.$/);

    TestBed.resetTestingModule();
    const excused = await render(FRENCH_EXCUSED);
    expect(excused.text('.placeholder')).toBe('Pas de note');
    expect(excused.text('.word')).toBe('Absent · justifié');

    TestBed.resetTestingModule();
    const unexcused = await render(HISTORY_UNEXCUSED);
    expect(unexcused.el.querySelector('ui-grade')?.textContent).toContain('0/20');
    expect(unexcused.text('.word')).toBe('Absent · non justifié');
  });

  it('signale une note modifiée après coup', async () => {
    const { text } = await render(GEOGRAPHY_FAILED);

    expect(text('.revised')).toBe('Note modifiée le 29/09');
    expect(text('.word')).toBe('En échec');
  });
});
