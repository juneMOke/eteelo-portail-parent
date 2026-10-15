import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AssignmentDocument, EvaluationDetail } from '../../../core/api/assignments.contract';
import { childLink, navEntry } from '../../../core/navigation/nav';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { statusView } from '../data-access/assignment-status';
import { durationLabel } from '../data-access/formats';
import { civilToDate } from '../../../shared/date/civil-date';
import { DocumentRowComponent } from '../ui/document-row/document-row.component';
import {
  BannerFact,
  IdentityBannerComponent,
} from '../ui/identity-banner/identity-banner.component';
import {
  InstructionItem,
  InstructionsBlockComponent,
} from '../ui/instructions-block/instructions-block.component';
import { ResultBlockComponent } from '../ui/result-block/result-block.component';
import { isNotFound } from '../data-access/not-found';
import { AssessmentsFacade } from './data-access/assessments.facade';

const TYPE_LABELS: Readonly<Record<string, string>> = {
  INTERRO: 'Interrogation',
  EXAMEN: 'Examen',
};

/** Ordre des blocs sous le bandeau : ce qui répond à la question du moment monte en premier. */
type Layout = 'result-first' | 'instructions-first';

/**
 * Fiche d'une épreuve. À venir : le programme, pour réviser. Corrigée : la note située et la
 * parole de l'enseignant, puis le corrigé. Absent : la marche à suivre. Les questions ne
 * descendent qu'une fois le corrigé publié (règle du serveur).
 */
@Component({
  selector: 'app-assessment-detail-page',
  imports: [
    DocumentRowComponent,
    EmptyStateComponent,
    IdentityBannerComponent,
    InstructionsBlockComponent,
    ResultBlockComponent,
    RouterLink,
    SkeletonComponent,
  ],
  templateUrl: './assessment-detail.page.html',
  styleUrl: './assessment-detail.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AssessmentDetailPage {
  readonly childId = input.required<string>();
  readonly evaluationId = input.required<string>();

  private readonly facade = inject(AssessmentsFacade);
  private readonly locale = inject(LOCALE_ID);

  protected readonly evaluation = this.facade.detailResource(() => ({
    childId: this.childId(),
    evaluationId: this.evaluationId(),
  }));
  protected readonly data = computed(() =>
    this.evaluation.hasValue() ? this.evaluation.value() : undefined,
  );
  protected readonly notFound = computed(() => isNotFound(this.evaluation.error()));

  protected readonly listLink = computed(() =>
    childLink(this.childId(), navEntry('assessments').path),
  );
  /** Mes cours sur le cours de cette évaluation, dès que le serveur le dit (lot P10). */
  protected readonly courseLink = computed(() =>
    this.data()?.courseId ? childLink(this.childId(), navEntry('courses').path) : null,
  );
  protected readonly attendanceLink = computed(() =>
    childLink(this.childId(), navEntry('attendance').path),
  );

  protected readonly status = computed(() => statusView(this.data()?.status ?? ''));

  protected readonly layout = computed<Layout>(() => {
    const status = this.data()?.status;
    return status === 'GRADED' || status === 'ABSENT' ? 'result-first' : 'instructions-first';
  });

  protected readonly subtitle = computed(() => {
    const evaluation = this.data();
    if (!evaluation) return '';
    return `${evaluation.subjectLabel} · ${TYPE_LABELS[evaluation.type] ?? 'Évaluation'}`;
  });

  protected readonly facts = computed(
    (): readonly [BannerFact, BannerFact, BannerFact, BannerFact] => {
      const evaluation = this.data();
      return [
        {
          label: 'Annoncée le',
          value: evaluation ? formatDate(evaluation.announcedAt, 'dd/MM/yyyy', this.locale) : null,
        },
        { label: 'Date', value: evaluation ? this.longDate(evaluation) : null },
        { label: 'Durée', value: durationLabel(evaluation?.durationMinutes ?? null) },
        // Salle et créneau horaire : hors V1 côté serveur.
        { label: 'Salle', value: null },
      ];
    },
  );

  /** Questions une fois le corrigé publié ; sinon le programme. */
  protected readonly instructions = computed(() => {
    const evaluation = this.data();
    const questions = evaluation?.questions ?? [];
    if (questions.length) {
      return {
        heading: 'Questions de l’épreuve',
        items: questions.map((q): InstructionItem => ({ text: q.statement, points: q.points })),
        empty: '',
      };
    }
    return {
      heading: 'Au programme',
      items: (evaluation?.programme ?? []).map((line): InstructionItem => ({ text: line })),
      empty: 'L’enseignant n’a pas détaillé le programme de cette épreuve.',
    };
  });

  protected readonly answerKeys = computed(() => this.documents('ANSWER_KEY', true));
  protected readonly otherDocuments = computed(() => this.documents('ANSWER_KEY', false));

  private documents(kind: string, keep: boolean): readonly AssignmentDocument[] {
    return (this.data()?.documents ?? []).filter((document) => (document.kind === kind) === keep);
  }

  private longDate(evaluation: EvaluationDetail): string {
    return formatDate(civilToDate(evaluation.date), 'EEEE dd/MM/yyyy', this.locale, 'UTC');
  }
}
