import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  LOCALE_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GradeCourses, GradedEvaluation } from '../../../core/api/grades.contract';
import { latestValue } from '../../../shared/resource/latest-value';
import { EmptyPeriodComponent } from '../../../shared/ui/empty-period/empty-period.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { dayLabel, selectionAnnouncement, selectionPhrase } from '../data-access/grade-formats';
import { evaluationLink, evaluationQueryParams, gradesLink } from '../data-access/grade-links';
import { GradesFacade } from '../data-access/grades.facade';
import { injectTermSelection, selectionParams } from '../data-access/term-selection';
import { CourseRowComponent } from '../ui/course-row/course-row.component';
import { ResultCardComponent } from '../ui/result-card/result-card.component';
import { TermPickerComponent } from '../ui/term-picker/term-picker.component';

/**
 * Mes cours : « c'est un accident ou une tendance ? ». La moyenne de chaque cours, dans l'ordre
 * du bulletin, et ce qui la compose une fois déplié. Ni moyenne générale ni rang : c'est Mon
 * bulletin. Tout est replié, sauf le cours ciblé (`?course=`, depuis une fiche ou une ligne du
 * bulletin), qui s'ouvre et vient à l'écran.
 */
@Component({
  selector: 'app-courses-page',
  imports: [
    CourseRowComponent,
    EmptyPeriodComponent,
    LoadErrorComponent,
    ResultCardComponent,
    RouterLink,
    SkeletonComponent,
    TermPickerComponent,
  ],
  templateUrl: './courses.page.html',
  styleUrl: './courses.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CoursesPage {
  readonly childId = input.required<string>();
  readonly term = input<string>();
  readonly period = input<string>();
  /** Cours à déplier et à amener à l'écran. */
  readonly course = input<string>();

  private readonly facade = inject(GradesFacade);
  private readonly locale = inject(LOCALE_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly selection = injectTermSelection({
    childId: this.childId,
    term: this.term,
    period: this.period,
  });
  protected readonly resource = this.facade.coursesResource(() => ({
    childId: this.childId(),
    query: this.selection.query(),
  }));
  protected readonly data = latestValue(this.resource);

  /** Cours ouverts ; un changement de cours ciblé (ou de sélection) repart de lui seul. */
  protected readonly expanded = linkedSignal<string | undefined, ReadonlySet<string>>({
    source: this.course,
    computation: (course) => new Set(course ? [course] : []),
  });
  protected readonly graded = computed(() =>
    (this.data()?.courses ?? []).some((course) => course.evaluationCount > 0),
  );
  protected readonly emptyHeading = computed(() => {
    const data = this.data();
    return data ? `Aucune évaluation pour ${selectionPhrase(data)}.` : '';
  });
  /** « 1er trimestre, 2e période, 5 cours. » */
  protected readonly announcement = computed(() => {
    const data = this.data();
    return data ? selectionAnnouncement(data.selection, data.courses.length) : '';
  });

  constructor() {
    // Le cours ciblé vient à l'écran une fois la liste affichée (effet de bord seulement).
    effect(() => {
      const target = this.course();
      if (!target || !this.data()) return;
      afterNextRender(
        () => this.host.nativeElement.querySelector(`#course-${target}`)?.scrollIntoView(),
        { injector: this.injector },
      );
    });
  }

  protected toggle(courseId: string): void {
    this.expanded.update((open) => {
      const next = new Set(open);
      if (!next.delete(courseId)) next.add(courseId);
      return next;
    });
  }

  protected cardLink(item: GradedEvaluation): string[] {
    return evaluationLink(this.childId(), item);
  }

  protected cardQueryParams(data: GradeCourses, courseId: string) {
    return evaluationQueryParams('courses', {
      ...selectionParams(data.selection),
      course: courseId,
    });
  }

  protected cardContext(item: GradedEvaluation): string {
    return dayLabel(item.date, this.locale);
  }

  protected reportCardLink(): string[] {
    return gradesLink(this.childId(), 'report-card');
  }
}
