import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  GEOGRAPHY_FAILED,
  MATHS_HOMEWORK_PASSED,
  PHYSICS_PENDING,
} from '../../../../testing/grades-week.fixture';
import { evaluationCard } from './evaluation-card';

registerLocaleData(localeFr);

describe('evaluationCard', () => {
  it('met une évaluation notée en mots, comme dans Mes évaluations', () => {
    expect(evaluationCard(MATHS_HOMEWORK_PASSED, 'fr')).toEqual({
      view: { label: 'Réussie', tone: 'success', icon: 'award' },
      heading: 'Devoir de Mathématiques — les fractions',
      when: 'Lundi 14/09',
      compactWhen: null,
      detail: 'Fractions équivalentes, PPCM',
      urgent: null,
      grade: { points: 15, maxPoints: 20 },
    });
  });

  it('ajoute la correction aux notions, et n’invente pas de note en attente', () => {
    expect(evaluationCard(GEOGRAPHY_FAILED, 'fr').detail).toMatch(/ · Note modifiée le 29\/09$/);
    const pending = evaluationCard(PHYSICS_PENDING, 'fr');
    expect(pending.grade).toBeNull();
    expect(pending.view).toEqual({ label: 'En attente', tone: 'neutral', icon: 'clipboard-check' });
  });
});
