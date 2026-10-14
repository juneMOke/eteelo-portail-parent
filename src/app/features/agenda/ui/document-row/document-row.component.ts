import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { AssignmentDocument } from '../../../../core/api/assignments.contract';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { fileSizeLabel, fileTypeLabel, middleEllipsis } from '../../data-access/formats';

/**
 * ⑧ Un document (copie, sujet) ou ⑩ le corrigé (fond vert pâle). Le poids est toujours
 * affiché : le parent paie ses données. « Consulter » ouvre la visionneuse de l'appareil.
 */
@Component({
  selector: 'app-document-row',
  imports: [DatePipe, IconComponent],
  templateUrl: './document-row.component.html',
  styleUrl: './document-row.component.css',
  host: { '[class.answer-key]': 'answerKey()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentRowComponent {
  readonly document = input.required<AssignmentDocument>();
  /** Titre du bloc, ex. « Corrigé de l'épreuve ». */
  readonly heading = input.required<string>();
  readonly answerKey = input(false);

  private readonly locale = inject(LOCALE_ID);

  protected readonly name = computed(() => middleEllipsis(this.document().fileName));
  protected readonly meta = computed(() => {
    const document = this.document();
    return `${fileTypeLabel(document.contentType)} · ${fileSizeLabel(document.sizeBytes, this.locale)}`;
  });
}
