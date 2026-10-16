import { formatDate } from '@angular/common';
import { GradeCard } from '../../../core/api/grades.contract';
import { dayLabel } from '../../../shared/format/day-labels';
import { AssignmentCardView } from '../../../shared/ui/assignment-card/assignment-card.component';
import { IconName } from '../../../shared/ui/icon/icons';
import { displayedScore, gradeStateView } from './grade-state';

/** Pastille d'icône de la carte, comme dans Mes évaluations : notée, attendue, absente. */
const ICONS: Readonly<Record<string, IconName>> = {
  PASSED: 'award',
  AVERAGE: 'award',
  FAILED: 'award',
  PENDING: 'clipboard-check',
  ABSENT_EXCUSED: 'alert-circle',
  ABSENT_UNEXCUSED: 'alert-circle',
};

/**
 * ⑤ Une évaluation de Mes cours, mise en mots pour la carte de Mes évaluations (spec 03 v2 ④) :
 * l'état et son ton, le titre, le jour, les notions (et la correction éventuelle), la note.
 */
export function evaluationCard(item: GradeCard, locale: string): AssignmentCardView {
  const state = gradeStateView(item.state);
  const revised = item.revisedAt
    ? `Note modifiée le ${formatDate(item.revisedAt, 'dd/MM', locale)}`
    : null;
  return {
    view: { label: state.word, tone: state.tone, icon: ICONS[item.state] ?? 'info' },
    heading: item.title,
    when: dayLabel(item.date, locale),
    compactWhen: null,
    detail: [item.topics.join(', '), revised].filter(Boolean).join(' · ') || null,
    urgent: null,
    grade: displayedScore(item),
  };
}
