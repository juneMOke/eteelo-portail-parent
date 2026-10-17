import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { latestValue } from '../../../shared/resource/latest-value';
import { EmptyPeriodComponent } from '../../../shared/ui/empty-period/empty-period.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { PillGroupComponent, PillOption } from '../../../shared/ui/pill-group/pill-group.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { ConductFacade } from '../data-access/conduct.facade';
import { disciplineSummary } from '../data-access/discipline-formats';
import { injectDisciplineTerm } from '../data-access/discipline-term';
import { CaseCardComponent } from '../ui/case-card/case-card.component';
import { DisciplineSummaryComponent } from '../ui/discipline-summary/discipline-summary.component';
import { SchoolContactComponent } from '../ui/school-contact/school-contact.component';

/**
 * Ma discipline : « que s'est-il passé ? ». Le trimestre (⑥), son bilan (⑦), puis chaque
 * fait consigné (⑧), le plus récent en haut, avec ce que l'école attend du parent (⑨). Un
 * seul curseur de temps : le trimestre, partagé avec Mes notes. Le fait ciblé (`?case=`,
 * depuis Ma présence) se place en tête.
 */
import { StaleNoticeComponent } from '../../../shared/ui/stale-notice/stale-notice.component';
import { RefreshHighlightDirective } from '../../../shared/resource/refresh-highlight.directive';
@Component({
  selector: 'app-discipline-page',
  imports: [
    CaseCardComponent,
    DisciplineSummaryComponent,
    EmptyPeriodComponent,
    LoadErrorComponent,
    PillGroupComponent,
    RefreshHighlightDirective,
    SchoolContactComponent,
    SkeletonComponent,
    StaleNoticeComponent,
  ],
  templateUrl: './discipline.page.html',
  styleUrl: './discipline.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DisciplinePage {
  readonly childId = input.required<string>();
  /** Trimestre (`?term=`) ; absent, le choix de la session ou le trimestre en cours. */
  readonly term = input<string>();
  /** Fait à placer en tête (`?case=`). */
  readonly case = input<string>();

  private readonly facade = inject(ConductFacade);

  protected readonly selection = injectDisciplineTerm({ childId: this.childId, term: this.term });
  protected readonly resource = this.facade.disciplineResource(() => ({
    childId: this.childId(),
    periodId: this.selection.periodId(),
  }));
  protected readonly data = latestValue(this.resource);
  protected readonly schoolPhone = this.facade.schoolPhone;

  protected readonly terms = computed<readonly PillOption[]>(() =>
    (this.data()?.periods ?? []).map((period) => ({
      id: period.id,
      label: period.label,
      available: true,
      hint: null,
    })),
  );
  protected readonly summary = computed(() => {
    const data = this.data();
    return data ? disciplineSummary(data) : '';
  });
  /** Le fait ciblé en tête, les autres dans l'ordre du serveur. */
  protected readonly cases = computed(() => {
    const cases = this.data()?.cases ?? [];
    const target = cases.find((item) => item.id === this.case());
    return target ? [target, ...cases.filter((item) => item !== target)] : cases;
  });

  protected pickTerm(periodId: string | null): void {
    if (periodId && periodId !== this.data()?.period.id) this.selection.select(periodId);
  }
}
