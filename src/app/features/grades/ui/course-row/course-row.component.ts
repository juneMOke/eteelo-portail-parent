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
import { CourseGrades } from '../../../../core/api/grades.contract';
import { civilToDate } from '../../../../shared/date/civil-date';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { percentLabel, pointsLabel } from '../../data-access/grade-formats';
import { AverageComponent } from '../average/average.component';

let nextId = 0;

/**
 * ④ Ligne de cours de Mes cours : moyenne du cours et, déplié, ce qui la compose (les lignes ⑤,
 * projetées par la page). La mention de la dernière note dit la tendance sans déplier. Un cours
 * sans évaluation reste listé : un cours qui disparaît inquiète plus qu'un tiret.
 */
@Component({
  selector: 'app-course-row',
  imports: [AverageComponent, IconComponent],
  templateUrl: './course-row.component.html',
  styleUrl: './course-row.component.css',
  host: { '[class.expanded]': 'expanded()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseRowComponent {
  readonly course = input.required<CourseGrades>();
  readonly expanded = input(false);
  readonly toggle = output<void>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly panelId = `course-panel-${nextId++}`;

  /** « M. Ilunga · 4 évaluations, dernière 16,5/20 le 22/09 » ou « Pas encore d'évaluation ». */
  protected readonly summary = computed(() => {
    const { teacherLabel, evaluationCount, last } = this.course();
    if (evaluationCount === 0) {
      return [teacherLabel, 'Pas encore d’évaluation'].filter(Boolean).join(' · ');
    }
    const count = `${evaluationCount} ${evaluationCount > 1 ? 'évaluations' : 'évaluation'}`;
    const lastGrade = last
      ? `, dernière ${pointsLabel(last.points, last.maxPoints, this.locale)} le ${formatDate(civilToDate(last.date), 'dd/MM', this.locale, 'UTC')}`
      : '';
    return [teacherLabel, `${count}${lastGrade}`].filter(Boolean).join(' · ');
  });

  /** « Mathématiques, moyenne 75,0 %, 2 évaluations. » */
  protected readonly spoken = computed(() => {
    const { label, average, evaluationCount } = this.course();
    const mean = average
      ? `moyenne ${percentLabel(average.percent, this.locale)}`
      : 'pas de moyenne';
    const count = `${evaluationCount} ${evaluationCount > 1 ? 'évaluations' : 'évaluation'}`;
    return `${label}, ${mean}, ${count}.`;
  });
}
