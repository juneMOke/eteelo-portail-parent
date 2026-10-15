import { NgTemplateOutlet, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AssignmentDocument, HomeworkDetail } from '../../../core/api/assignments.contract';
import { childLink, navEntry } from '../../../core/navigation/nav';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { FileUploadComponent } from '../../../shared/ui/file-upload/file-upload.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { statusView } from '../data-access/assignment-status';
import { deliveryLabel } from '../data-access/formats';
import { isNotFound } from '../data-access/not-found';
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
import { HomeworkSubmissionStore } from './data-access/homework-submission.store';
import { HomeworkFacade } from './data-access/homework.facade';

/** Ordre des blocs sous le bandeau : ce qui répond à la question du moment monte en premier. */
type Layout = 'result-first' | 'submission-first' | 'instructions-first';

/** Ce que le serveur accepte pour une copie : PDF ou photos, 10 Mo pour tout le dépôt. */
const SUBMISSION_TYPES: readonly string[] = ['application/pdf', 'image/jpeg', 'image/png'];
const SUBMISSION_MAX_BYTES = 10 * 1024 * 1024;
const SUBMISSION_MAX_FILES = 20;

/**
 * Fiche d'un devoir. À rendre : les questions, puis le dépôt (en ligne) ou la façon de le
 * remettre, puis l'énoncé. Rendu : la copie déposée, puis les questions en rappel. Corrigé :
 * la note située et la parole de l'enseignant, puis le corrigé et la copie.
 */
@Component({
  selector: 'app-homework-detail-page',
  imports: [
    DocumentRowComponent,
    EmptyStateComponent,
    IdentityBannerComponent,
    FileUploadComponent,
    InstructionsBlockComponent,
    NgTemplateOutlet,
    ResultBlockComponent,
    RouterLink,
    SkeletonComponent,
  ],
  templateUrl: './homework-detail.page.html',
  styleUrl: './homework-detail.page.css',
  providers: [HomeworkSubmissionStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeworkDetailPage {
  readonly childId = input.required<string>();
  readonly evaluationId = input.required<string>();

  private readonly facade = inject(HomeworkFacade);
  protected readonly submission = inject(HomeworkSubmissionStore);
  private readonly locale = inject(LOCALE_ID);

  protected readonly submissionTypes = SUBMISSION_TYPES;
  protected readonly submissionMaxBytes = SUBMISSION_MAX_BYTES;
  protected readonly submissionMaxFiles = SUBMISSION_MAX_FILES;
  /** Fichiers choisis pour le dépôt, pas encore envoyés. */
  protected readonly files = signal<readonly File[]>([]);
  /** Confirmation brève, annoncée une fois la copie reçue par l'école. */
  protected readonly confirmation = signal<string | null>(null);

  protected readonly homework = this.facade.detailResource(() => ({
    childId: this.childId(),
    evaluationId: this.evaluationId(),
  }));
  protected readonly data = computed(() =>
    this.homework.hasValue() ? this.homework.value() : undefined,
  );
  protected readonly notFound = computed(() => isNotFound(this.homework.error()));

  protected readonly listLink = computed(() =>
    childLink(this.childId(), navEntry('homework').path),
  );
  protected readonly attendanceLink = computed(() =>
    childLink(this.childId(), navEntry('attendance').path),
  );

  protected readonly status = computed(() => statusView(this.data()?.status ?? ''));

  protected readonly layout = computed<Layout>(() => {
    const homework = this.data();
    const status = homework?.status;
    if (status === 'GRADED' || status === 'ABSENT') return 'result-first';
    if ((status === 'SUBMITTED' || status === 'AWAITING_GRADE') && homework?.submission) {
      return 'submission-first';
    }
    return 'instructions-first';
  });

  protected readonly subtitle = computed(() => {
    const homework = this.data();
    return homework ? `${homework.subjectLabel} · Devoir` : '';
  });

  protected readonly facts = computed(
    (): readonly [BannerFact, BannerFact, BannerFact, BannerFact] => {
      const homework = this.data();
      return [
        {
          label: 'Donné le',
          value: homework ? formatDate(homework.assignedAt, 'dd/MM/yyyy', this.locale) : null,
        },
        { label: 'À rendre le', value: homework ? this.longDate(homework) : null },
        { label: 'Heure limite', value: homework?.dueTime ?? null },
        { label: 'Remise', value: homework ? deliveryLabel(homework.deliveryMode) : null },
      ];
    },
  );

  /**
   * ⑦ Le dépôt, quand le statut rendu par le serveur le laisse ouvert : à rendre, rendu (la copie
   * se remplace jusqu'à l'échéance), ou non rendu sous dépôt tardif permis. Le serveur tranche
   * en dernier ressort (refus SUBMISSION_CLOSED).
   */
  protected readonly upload = computed(() => {
    const homework = this.data();
    if (!homework || homework.deliveryMode !== 'ONLINE' || homework.result) return null;
    if (homework.status === 'DUE' || homework.status === 'SUBMITTED') {
      const time = homework.dueTime ? `, avant ${homework.dueTime}` : '';
      const replace = homework.submission !== null;
      return {
        heading: replace ? 'Remplacer la copie' : 'Déposer le devoir',
        fact: `Dépôt ouvert jusqu’au ${this.longDate(homework)}${time}.`,
        choose: replace ? 'Choisir un autre fichier' : 'Choisir un fichier',
      };
    }
    if (homework.status === 'MISSED' && homework.lateSubmissionAllowed) {
      return {
        heading: 'Déposer le devoir',
        fact: 'La date de remise est passée. Un dépôt tardif reste possible.',
        choose: 'Choisir un fichier',
      };
    }
    return null;
  });

  /** ⑧ La copie déposée qui fait foi, page par page. */
  protected readonly submittedFiles = computed(() => {
    const files = this.data()?.submission?.files ?? [];
    return files.map((document, index) => ({
      document,
      heading:
        files.length > 1 ? `Copie déposée — page ${index + 1} sur ${files.length}` : 'Copie déposée',
    }));
  });

  /** Comment remettre le devoir, quand il n'y a ni dépôt ouvert ni copie à montrer. */
  protected readonly delivery = computed(() => {
    const homework = this.data();
    if (!homework || this.upload() || homework.submission) return null;
    switch (homework.deliveryMode) {
      case 'ONLINE':
        return {
          fact: 'À déposer en ligne avant l’échéance.',
          late: homework.lateSubmissionAllowed
            ? 'Un dépôt après l’échéance reste accepté.'
            : 'Aucun dépôt n’est accepté après l’échéance.',
        };
      case 'IN_CLASS':
        return { fact: 'À remettre en classe à l’enseignant.', late: null };
      default:
        return { fact: 'L’école n’a pas précisé comment remettre ce devoir.', late: null };
    }
  });

  /** Les questions ; à défaut le programme. */
  protected readonly instructions = computed(() => {
    const homework = this.data();
    const questions = homework?.questions ?? [];
    if (questions.length) {
      return {
        heading: 'Questions du devoir',
        items: questions.map((q): InstructionItem => ({ text: q.statement, points: q.points })),
        empty: '',
      };
    }
    return {
      heading: 'Au programme',
      items: (homework?.programme ?? []).map((line): InstructionItem => ({ text: line })),
      empty: 'L’enseignant n’a pas détaillé ce devoir.',
    };
  });

  protected readonly subjects = computed(() => this.documents((kind) => kind === 'SUBJECT'));
  protected readonly answerKeys = computed(() => this.documents((kind) => kind === 'ANSWER_KEY'));
  protected readonly otherDocuments = computed(() =>
    this.documents((kind) => kind !== 'SUBJECT' && kind !== 'ANSWER_KEY'),
  );

  protected async send(files: readonly File[]): Promise<void> {
    this.confirmation.set(null);
    const detail = await this.submission.submit(this.childId(), this.evaluationId(), files);
    if (!detail) return;
    this.homework.set(detail);
    this.files.set([]);
    this.confirmation.set('Copie reçue par l’école.');
  }

  protected filesChanged(): void {
    this.submission.clearFailure();
    this.confirmation.set(null);
  }

  private documents(keep: (kind: string) => boolean): readonly AssignmentDocument[] {
    return (this.data()?.documents ?? []).filter((document) => keep(document.kind));
  }

  private longDate(homework: HomeworkDetail): string {
    return formatDate(civilToDate(homework.dueDate), 'EEEE dd/MM/yyyy', this.locale, 'UTC');
  }
}
