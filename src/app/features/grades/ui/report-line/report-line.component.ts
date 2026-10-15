import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { ReportCardLine } from '../../../../core/api/grades.contract';
import { gradeLevel } from '../../../../shared/ui/grade/grade.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { percentLabel } from '../../data-access/grade-formats';
import { AverageComponent } from '../average/average.component';

/**
 * ⑦ Ligne du bulletin : nom du cours, jauge de la moyenne (6 px, sans animation : une note
 * n'est pas une progression qu'on célèbre) et moyenne. Pas de dépliage : le bulletin résume,
 * la ligne ouvre Mes cours sur ce cours, même sélection.
 */
@Component({
  selector: 'app-report-line',
  imports: [AverageComponent, IconComponent, RouterLink],
  templateUrl: './report-line.component.html',
  styleUrl: './report-line.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportLineComponent {
  readonly line = input.required<ReportCardLine>();
  readonly link = input.required<readonly string[]>();
  readonly queryParams = input<Params>({});

  private readonly locale = inject(LOCALE_ID);

  protected readonly gauge = computed(() => {
    const average = this.line().average;
    if (!average) return null;
    return {
      width: `${Math.min(Math.max(average.percent, 0), 100)}%`,
      color: `var(--color-grade-${gradeLevel(average.percent, 100)})`,
    };
  });
  protected readonly spoken = computed(() => {
    const { label, average } = this.line();
    const value = average ? percentLabel(average.percent, this.locale) : 'pas encore de note';
    return `${label}, ${value}. Voir le détail dans Mes cours.`;
  });
}
