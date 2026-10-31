import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CivilDate } from '../../../../../core/api/assignments.contract';
import { TimetableCourse } from '../../../../../core/api/timetable.contract';
import { childLink, navEntry } from '../../../../../core/navigation/nav';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { subjectInitials, subjectTone } from '../../../../../shared/ui/subject-tone';
import { durationLabel } from '../../../data-access/formats';
import { evaluationLabel } from '../../data-access/timetable-view';

/**
 * Carte d'un cours dans la journée (spec 04 · détail, D4 à D8, D10 à D12) : sigle et ton de la
 * matière, enseignant · salle, durée. Ne s'ouvre pas ; seule la ligne d'une épreuve mène à sa
 * fiche, qui ramène au même jour (`?from=timetable&date=`).
 */
@Component({
  selector: 'app-course-card',
  imports: [IconComponent, RouterLink],
  templateUrl: './course-card.component.html',
  styleUrl: './course-card.component.css',
  host: {
    '[class.cancelled]': 'cancelled()',
    '[class.now]': 'now()',
    '[class.with-exam]': '!!exam()',
    '[style.--subject]': 'tone().color',
    '[style.--subject-soft]': 'tone().soft',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseCardComponent {
  readonly childId = input.required<string>();
  readonly course = input.required<TimetableCourse>();
  readonly date = input.required<CivilDate>();
  /** Le cours a lieu en ce moment (D10). */
  readonly now = input(false);

  /** Le ton de la matière ; gris pour un cours annulé, bronze quand une épreuve s'y tient. */
  protected readonly tone = computed(() => {
    if (this.cancelled()) {
      return { color: 'var(--color-border-strong)', soft: 'var(--color-page)' };
    }
    if (this.course().evaluation) {
      return { color: 'var(--color-tone-pending)', soft: 'var(--color-tone-pending-soft)' };
    }
    return subjectTone(this.course().subjectCode);
  });
  protected readonly initials = computed(() => subjectInitials(this.course().subjectLabel));
  protected readonly cancelled = computed(() => this.course().status === 'CANCELLED');
  protected readonly duration = computed(() => durationLabel(this.course().durationMinutes));

  /** « Ilunga Mbuyi Jean · Salle 12 » : la partie inconnue part avec son point médian. */
  protected readonly meta = computed(() => {
    const course = this.course();
    const teacher = course.substituteTeacherLabel ?? course.teacherLabel;
    return [teacher, course.newRoom ?? course.room].filter(Boolean).join(' · ');
  });

  /** « Annulé · enseignante absente » ; « Remplacé par … · Déplacé en … » (D12). */
  protected readonly notice = computed(() => {
    const course = this.course();
    if (this.cancelled()) return ['Annulé', course.cancelReason].filter(Boolean).join(' · ');
    if (course.status !== 'CHANGED') return null;
    const changes = [
      course.substituteTeacherLabel ? `Remplacé par ${course.substituteTeacherLabel}` : null,
      course.newRoom ? `Déplacé en ${course.newRoom}` : null,
    ].filter(Boolean);
    return changes.length ? changes.join(' · ') : null;
  });

  protected readonly exam = computed(() => {
    const evaluation = this.course().evaluation;
    if (!evaluation || this.cancelled()) return null;
    return {
      label: `${evaluationLabel(evaluation)} — voir le programme`,
      link: [...childLink(this.childId(), navEntry('assessments').path), evaluation.id],
      queryParams: { from: 'timetable', date: this.date() },
    };
  });
}
