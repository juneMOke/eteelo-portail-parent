import { formatNumber } from '@angular/common';
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
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { percentLabel } from '../../data-access/grade-formats';
import { averageColor } from '../../data-access/grade-state';
import { subjectTone } from '../../data-access/subject-tone';
import { AverageComponent } from '../average/average.component';

/**
 * ⑦ Ligne du bulletin : filet et sigle au ton de la matière, nom du cours, jauge de la moyenne
 * (6 px) et moyenne avec ses points. Quand la sélection change, la jauge glisse vers sa nouvelle
 * longueur ; à l'ouverture elle est déjà en place : une note n'est pas une progression qu'on
 * célèbre. Pas de dépliage : le bulletin résume, la ligne ouvre Mes cours sur ce cours.
 */
@Component({
  selector: 'app-report-line',
  imports: [AverageComponent, IconComponent, RouterLink],
  templateUrl: './report-line.component.html',
  styleUrl: './report-line.component.css',
  host: {
    '[style.--subject]': 'subject().color',
    '[style.--subject-soft]': 'subject().soft',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportLineComponent {
  readonly line = input.required<ReportCardLine>();
  readonly link = input.required<readonly string[]>();
  readonly queryParams = input<Params>({});

  private readonly locale = inject(LOCALE_ID);

  protected readonly subject = computed(() => subjectTone(this.line().subjectCode));
  /** « 41 pts sur 60 » : jamais une note sur 20, que le parent lirait comme une moyenne. */
  protected readonly points = computed(() => {
    const { obtained, max } = this.line();
    if (obtained === null || max === null) return null;
    const format = (value: number) => formatNumber(value, this.locale, '1.0-2');
    return `${format(obtained)} pts sur ${format(max)}`;
  });

  /** La moyenne du cours ; null tant qu'il n'a pas de note. */
  protected readonly average = computed(() => {
    const { percent, state } = this.line();
    return percent === null ? null : { percent, state: state ?? '' };
  });
  protected readonly gauge = computed(() => {
    const average = this.average();
    if (!average) return null;
    return {
      width: `${Math.min(Math.max(average.percent, 0), 100)}%`,
      color: averageColor(average.state),
    };
  });
  protected readonly spoken = computed(() => {
    const average = this.average();
    const value = average ? percentLabel(average.percent, this.locale) : 'pas encore de note';
    return `${this.line().subjectLabel}, ${value}. Voir le détail dans Mes cours.`;
  });
}
