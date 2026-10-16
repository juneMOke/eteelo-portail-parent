import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * ⑦ Le bilan du trimestre, en tête : la phrase des comptes du serveur, sans appréciation de
 * conduite (aucune n'est publiée en V1) ni tuiles qui la répètent.
 */
@Component({
  selector: 'app-discipline-summary',
  template: `
    <section aria-labelledby="discipline-summary-title">
      <h2 id="discipline-summary-title" class="band">{{ periodLabel() }}</h2>
      <p class="phrase">{{ phrase() }}</p>
    </section>
  `,
  styleUrl: './discipline-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisciplineSummaryComponent {
  /** « 1er trimestre ». */
  readonly periodLabel = input.required<string>();
  /** « 2 faits mineurs · 1 fait majeur · aucun fait grave ». */
  readonly phrase = input.required<string>();
}
