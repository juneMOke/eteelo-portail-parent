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
  async function render(evaluation: GradeCard) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    });
    const fixture = TestBed.createComponent(ResultCardComponent);
    fixture.componentRef.setInput('evaluation', evaluation);
    fixture.componentRef.setInput('link', ['/c', 'c1', 'homework', evaluation.evaluationId]);
    fixture.componentRef.setInput('queryParams', { from: 'grades-week', date: evaluation.date });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return {
      el,
      link: el.querySelector('a')!,
      text: (s: string) => el.querySelector(s)?.textContent?.trim(),
      texts: (s: string) => [...el.querySelectorAll(s)].map((node) => node.textContent?.trim()),
    };
  }

  it('dit la matière, le titre tel quel, la note sur sa jauge, et mène à la fiche', async () => {
    const { el, link, text, texts } = await render(MATHS_HOMEWORK_PASSED);

    expect(text('.subject')).toBe('MATHMathématiques');
    expect(el.querySelector('.kind')).toBeNull();
    expect(text('.topic')).toBe('Devoir de Mathématiques — les fractions');
    expect(text('.value')).toBe('15/20');
    expect(el.querySelector<HTMLElement>('.fill')?.style.width).toBe('75%');
    expect(texts('.tag')).toEqual(['Fractions équivalentes', 'PPCM']);
    expect(text('.status')).toBe('Réussie');
    expect(link.getAttribute('href')).toBe(
      `/c/c1/homework/${MATHS_HOMEWORK_PASSED.evaluationId}?from=grades-week&date=2026-09-14`,
    );
    expect(link.getAttribute('aria-label')).toBe(
      'Lundi 14 septembre, Mathématiques, Devoir de Mathématiques — les fractions, 15 sur 20, réussie.',
    );
  });

  it('date l’épreuve sur la frise, sans arrivée tant qu’une note est rendue', async () => {
    const { el, text } = await render(MATHS_HOMEWORK_PASSED);

    expect(text('.step-label')).toBe('Évaluée le');
    expect(text('.step-date')).toBe('Lun. 14 sept.');
    expect(el.querySelector('.step.end')).toBeNull();
  });

  it('dit que les copies ne sont pas rendues, sans chiffre ni jauge', async () => {
    const { el, text, link } = await render(PHYSICS_PENDING);

    expect(el.querySelector('.value')).toBeNull();
    expect(el.querySelector('.gauge')).toBeNull();
    expect(text('.pill')).toBe('Pas encore noté');
    expect(text('.status')).toBe('En attente');
    expect(text('.step.end .step-date')).toBe('Copies non encore remises');
    expect(link.getAttribute('aria-label')).toMatch(/les forces, en attente\.$/);
  });

  it('distingue l’absence justifiée du zéro d’une absence non justifiée', async () => {
    const excused = await render(FRENCH_EXCUSED);
    expect(excused.text('.pill')).toBe('Pas de note');
    expect(excused.text('.status')).toBe('Absent · justifié');

    TestBed.resetTestingModule();
    const unexcused = await render(HISTORY_UNEXCUSED);
    expect(unexcused.text('.value')).toBe('0/20');
    expect(unexcused.text('.status')).toBe('Absent · non justifié');
  });

  it('signale une note modifiée après coup', async () => {
    const { text } = await render(GEOGRAPHY_FAILED);

    expect(text('.revised')).toBe('Note modifiée le 29/09');
    expect(text('.status')).toBe('En échec');
  });
});
