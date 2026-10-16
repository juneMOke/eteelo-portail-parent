import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, input } from '@angular/core';
import { AttendanceSummary } from '../../../../core/api/conduct.contract';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card.component';
import { weekIndicators, weekSummaryLabel } from '../../data-access/attendance-formats';

/**
 * ⑪ Les indicateurs de la semaine affichée, jamais ceux depuis la rentrée (①) : le résumé que
 * le serveur fait de la semaine, en pastille puis en quatre chiffres. « — » tant qu'il n'est pas
 * là, ou quand la semaine n'a aucun jour enregistré.
 */
@Component({
  selector: 'app-week-indicators',
  imports: [SectionCardComponent],
  templateUrl: './week-indicators.component.html',
  styleUrl: './week-indicators.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekIndicatorsComponent {
  /** Undefined pendant le premier chargement ou après un échec. */
  readonly summary = input<AttendanceSummary | undefined>(undefined);
  readonly failed = input(false);

  private readonly locale = inject(LOCALE_ID);

  protected readonly indicators = computed(() => weekIndicators(this.summary(), this.locale));
  protected readonly pill = computed(() => {
    const summary = this.summary();
    if (summary) return weekSummaryLabel(summary);
    return this.failed() ? 'Indicateurs indisponibles' : 'Chargement…';
  });
}
