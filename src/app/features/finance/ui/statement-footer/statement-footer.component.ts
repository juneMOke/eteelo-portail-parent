import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

/**
 * E Pied de Mes reçus : le relevé de l'année, tous les versements en un PDF, à télécharger.
 * Généré par l'école à chaque demande (un numéro de pièce chaque fois), gardé le temps de la
 * visite : le bouton ne sert qu'au geste.
 */
@Component({
  selector: 'app-statement-footer',
  imports: [IconComponent],
  templateUrl: './statement-footer.component.html',
  styleUrl: './statement-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatementFooterComponent {
  /** « 2026-2027 ». */
  readonly yearLabel = input.required<string>();
  /** Le relevé se génère. */
  readonly loading = input(false);
  readonly failure = input<string | null>(null);
  readonly download = output<void>();
}
