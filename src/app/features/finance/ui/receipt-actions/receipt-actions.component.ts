import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

/**
 * Ouvrir · Partager un reçu scellé, deux boutons ronds de 44 px ; en pilules avec leur
 * mot (`labelled`) au pied d'une fiche de versement. Ouvrir mène au PDF dans un
 * nouvel onglet, la page reste où elle est ; Partager passe par la feuille de partage du
 * téléphone (WhatsApp, courriel), ou télécharge à défaut.
 */
@Component({
  selector: 'app-receipt-actions',
  imports: [IconComponent],
  templateUrl: './receipt-actions.component.html',
  styleUrl: './receipt-actions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptActionsComponent {
  readonly href = input.required<string>();
  readonly receiptNumber = input.required<string>();
  /** Le reçu se charge pour être partagé. */
  readonly sharing = input(false);
  /** Pilules avec « Ouvrir » et « Partager » écrits. */
  readonly labelled = input(false, { transform: booleanAttribute });
  readonly share = output<void>();

  /** « reçu n° ETL-RC-2627-001042 ». */
  protected readonly name = computed(() => `reçu n° ${this.receiptNumber()}`);
}
