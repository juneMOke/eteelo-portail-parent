import { ChangeDetectionStrategy, Component, LOCALE_ID, inject, input } from '@angular/core';
import { formatNumber } from '@angular/common';

export interface InstructionItem {
  readonly text: string;
  /** Points de la question, quand l'enseignant les a fixés. */
  readonly points?: number | null;
}

/**
 * ⑥ La consigne en texte, numérotée : questions du devoir, ou programme d'une épreuve. Rien
 * n'est replié, le texte de l'enseignant est rendu tel quel. Vide, le bloc reste et le dit.
 */
@Component({
  selector: 'app-instructions-block',
  templateUrl: './instructions-block.component.html',
  styleUrl: './instructions-block.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionsBlockComponent {
  readonly heading = input.required<string>();
  readonly items = input.required<readonly InstructionItem[]>();
  /** Consigne matérielle (« Calculatrice autorisée »), en pied de bloc. */
  readonly note = input<string | null>(null);
  readonly emptyMessage = input.required<string>();

  private readonly locale = inject(LOCALE_ID);

  protected pointsLabel(points: number): string {
    const value = formatNumber(points, this.locale, '1.0-2');
    return `${value} ${points > 1 ? 'points' : 'point'}`;
  }
}
