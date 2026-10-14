import { DatePipe, formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { AssignmentResult } from '../../../../core/api/assignments.contract';
import { GradeComponent } from '../../../../shared/ui/grade/grade.component';

/**
 * ⑨ Résultat et appréciation : la note située (moyenne de la classe), puis la voix de
 * l'enseignant. Version alerte quand l'élève était absent : pas de note, pas de « 0 », une
 * phrase de fait et la marche à suivre. Jamais de rang ni de note d'un autre élève.
 */
@Component({
  selector: 'app-result-block',
  imports: [DatePipe, GradeComponent, RouterLink],
  templateUrl: './result-block.component.html',
  styleUrl: './result-block.component.css',
  host: { '[class.alert]': 'result().points === null' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultBlockComponent {
  readonly result = input.required<AssignmentResult>();
  /** Lien vers la présence du jour, montré pour une absence non justifiée. */
  readonly attendanceLink = input<readonly string[] | null>(null);
  readonly attendanceQueryParams = input<Params>({});

  private readonly locale = inject(LOCALE_ID);

  /** La note seule ; null pour une absence. */
  protected readonly grade = computed(() => {
    const { points, maxPoints } = this.result();
    return points === null ? null : { points, maxPoints };
  });
  protected readonly classAverage = computed(() => {
    const { classAverage, maxPoints } = this.result();
    if (classAverage === null) return null;
    return `${formatNumber(classAverage, this.locale, '1.0-2')}/${formatNumber(maxPoints, this.locale, '1.0-2')}`;
  });
  protected readonly classAverageSpoken = computed(() =>
    this.classAverage()?.replace('/', ' sur '),
  );
}
