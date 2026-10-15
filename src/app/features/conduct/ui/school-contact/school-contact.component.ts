import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Pied de Ma discipline : une question sur un fait passe par l'école, humainement. Pas de
 * messagerie en V1 (arbitrage 8) : le téléphone du secrétariat, s'il est saisi.
 */
@Component({
  selector: 'app-school-contact',
  template: `
    <p class="question">Une question sur un fait ?</p>
    <a class="call" [href]="'tel:' + phone()">Appeler le secrétariat de l’école</a>
  `,
  styleUrl: './school-contact.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolContactComponent {
  /** Format international, ex. « +243998877665 ». */
  readonly phone = input.required<string>();
}
