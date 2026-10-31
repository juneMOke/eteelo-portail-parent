import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { formatDate } from '@angular/common';
import { GradeCourse } from '../../../../core/api/grades.contract';
import { civilToDate } from '../../../../shared/date/civil-date';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { percentLabel, pointsLabel } from '../../data-access/grade-formats';
import { subjectTone } from '../../../../shared/ui/subject-tone';
import { AverageComponent } from '../average/average.component';

let nextId = 0;

/**
 * ④ Carte de cours de Mes cours : moyenne du cours et, déplié, ce qui la compose (les cartes ⑤,
 * projetées par la page). Filet et sigle au ton de la matière, moyenne au ton de l'état. La
 * mention de la dernière note dit la tendance sans déplier. Un cours sans évaluation reste
 * listé : un cours qui disparaît inquiète plus qu'un tiret.
 */
@Component({
  selector: 'app-course-row',
  imports: [AverageComponent, IconComponent],
  templateUrl: './course-row.component.html',
  styleUrl: './course-row.component.css',
  host: {
    '[class.expanded]': 'expanded()',
    '[style.--subject]': 'subject().color',
    '[style.--subject-soft]': 'subject().soft',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseRowComponent {
  readonly course = input.required<GradeCourse>();
  readonly expanded = input(false);
  readonly toggled = output<void>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly panelId = `course-panel-${nextId++}`;
  protected readonly subject = computed(() => subjectTone(this.course().subjectCode));

  /** « M. Ilunga · 4 évaluations, dernière 16,5/20 le 22/09 » ou « Pas encore d'évaluation ». */
  protected readonly summary = computed(() => {
    const { teacherLabel, count, last } = this.course();
    if (count === 0) {
      return [teacherLabel, 'Pas encore d’évaluation'].filter(Boolean).join(' · ');
    }
    const counted = `${count} ${count > 1 ? 'évaluations' : 'évaluation'}`;
    const lastGrade = last
      ? `, dernière ${pointsLabel(last.points, last.maxPoints, this.locale)} le ${formatDate(civilToDate(last.date), 'dd/MM', this.locale, 'UTC')}`
      : '';
    return [teacherLabel, `${counted}${lastGrade}`].filter(Boolean).join(' · ');
  });

  /** « Mathématiques, moyenne 75,0 %, 2 évaluations. » */
  protected readonly spoken = computed(() => {
    const { subjectLabel, average, count } = this.course();
    const mean = average
      ? `moyenne ${percentLabel(average.percent, this.locale)}`
      : 'pas de moyenne';
    const counted = `${count} ${count > 1 ? 'évaluations' : 'évaluation'}`;
    return `${subjectLabel}, ${mean}, ${counted}.`;
  });
}
