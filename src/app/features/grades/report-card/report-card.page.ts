import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { GradeSelection } from '../../../core/api/grades.contract';
import { latestValue } from '../../../shared/resource/latest-value';
import { EmptyPeriodComponent } from '../../../shared/ui/empty-period/empty-period.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { selectionAnnouncement } from '../data-access/grade-formats';
import { gradesLink } from '../data-access/grade-links';
import { GradesFacade } from '../data-access/grades.facade';
import { injectTermSelection, selectionParams } from '../data-access/term-selection';
import { AverageHeaderComponent } from '../ui/average-header/average-header.component';
import { ReportDocumentComponent } from '../ui/report-document/report-document.component';
import { ReportLineComponent } from '../ui/report-line/report-line.component';
import { TermPickerComponent } from '../ui/term-picker/term-picker.component';

/**
 * Mon bulletin : « où en est-il ? ». La moyenne générale et d'où elle vient (officielle ou
 * provisoire), le rang s'il est publié, une ligne par cours qui ouvre Mes cours, et le PDF signé
 * de l'école. Le détail des évaluations n'y figure pas : c'est Mes cours.
 */
import { StaleNoticeComponent } from '../../../shared/ui/stale-notice/stale-notice.component';
import { RefreshHighlightDirective } from '../../../shared/resource/refresh-highlight.directive';
@Component({
  selector: 'app-report-card-page',
  imports: [
    AverageHeaderComponent,
    EmptyPeriodComponent,
    LoadErrorComponent,
    RefreshHighlightDirective,
    ReportDocumentComponent,
    ReportLineComponent,
    SkeletonComponent,
    StaleNoticeComponent,
    TermPickerComponent,
  ],
  templateUrl: './report-card.page.html',
  styleUrl: './report-card.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ReportCardPage {
  readonly childId = input.required<string>();
  readonly term = input<string>();
  readonly part = input<string>();

  private readonly facade = inject(GradesFacade);

  protected readonly selection = injectTermSelection({
    childId: this.childId,
    term: this.term,
    part: this.part,
  });
  protected readonly periodsResource = this.facade.periodsResource(this.childId);
  protected readonly periods = latestValue(this.periodsResource);
  protected readonly resource = this.facade.reportCardResource(() => ({
    childId: this.childId(),
    query: this.selection.query(),
  }));
  protected readonly report = latestValue(this.resource);
  protected readonly failed = computed(
    () => !!this.resource.error() || !!this.periodsResource.error(),
  );

  /** Période sans aucune note : l'état vide remplace l'en-tête et les lignes. */
  protected readonly ungraded = computed(() => {
    const report = this.report();
    return !!report && report.average === null && report.status !== 'OFFICIAL';
  });
  protected readonly coursesLink = computed(() => gradesLink(this.childId(), 'courses'));
  protected readonly documentTitle = computed(() => {
    const selection = this.report()?.selection;
    return selection ? `Bulletin du ${selection.label}` : 'Bulletin';
  });
  /** « 1er trimestre · 1re période, 8 cours. » */
  protected readonly announcement = computed(() => {
    const report = this.report();
    return report?.selection ? selectionAnnouncement(report.selection, report.lines.length) : '';
  });

  protected retry(): void {
    this.periodsResource.reload();
    this.resource.reload();
  }

  protected lineQueryParams(selection: GradeSelection | null, courseId: string) {
    return { ...selectionParams(selection), course: courseId };
  }
}
