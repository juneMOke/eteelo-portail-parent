import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Pied de Mes reçus : le relevé de l'année, tous les versements en un PDF. Généré par l'école
 * à chaque ouverture (un numéro de pièce chaque fois) : le bouton ne sert qu'au geste.
 */
@Component({
  selector: 'app-statement-footer',
  templateUrl: './statement-footer.component.html',
  styleUrl: './statement-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatementFooterComponent {
  /** « 2026-2027 ». */
  readonly yearLabel = input.required<string>();
  /** Le relevé se génère. */
  readonly opening = input(false);
  readonly failure = input<string | null>(null);
  readonly open = output<void>();
}
