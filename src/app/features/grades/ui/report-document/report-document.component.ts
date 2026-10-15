import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { ReportCardDocument } from '../../../../core/api/grades.contract';
import { fileSizeLabel } from '../../../../shared/format/file-size';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

/**
 * ⑧ Bulletin officiel, en pied de page : le PDF signé de l'école, seul document qui fait foi,
 * jamais généré par l'application. Avant publication, la surface reste, sans bouton.
 * Le bouton « Télécharger » est le seul accent terre cuite de la page.
 */
@Component({
  selector: 'app-report-document',
  imports: [IconComponent],
  templateUrl: './report-document.component.html',
  styleUrl: './report-document.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDocumentComponent {
  /** « Bulletin du 1er trimestre ». */
  readonly title = input.required<string>();
  readonly document = input.required<ReportCardDocument | null>();
  readonly href = input<string | null>(null);

  private readonly locale = inject(LOCALE_ID);

  /** « PDF · 240 Ko · signé par la direction ». */
  protected readonly meta = computed(() => {
    const document = this.document();
    if (!document) return '';
    return `PDF · ${fileSizeLabel(document.sizeBytes, this.locale)} · signé par ${document.signedBy}`;
  });
}
