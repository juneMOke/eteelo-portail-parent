import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icons';

let nextId = 0;

/**
 * Carte de contenu à en-tête bleu brume (cartes du jour, de la semaine, des frais, d'un mois de
 * versements) : icône de 17 px, titre Lora, compteur en pilule blanche, à droite au-delà de
 * 600 px et sous le titre au téléphone. Le contenu se projette dessous. Avec `lift`, la carte
 * monte de 2 px au survol (une carte qui se lit, sans lignes qui bougent elles-mêmes).
 */
@Component({
  selector: 'ui-section-card',
  imports: [IconComponent],
  templateUrl: './section-card.component.html',
  styleUrl: './section-card.component.css',
  host: { '[class.lift]': 'lift()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCardComponent {
  readonly heading = input.required<string>();
  readonly icon = input.required<IconName>();
  /** « 4 frais · 1 en retard » ; null, pas de pilule. Lu après le titre. */
  readonly count = input<string | null>(null);
  /** Segment d'alerte de la pilule (« 1 en retard »), en terre cuite après le compteur. */
  readonly countAlert = input<string | null>(null);
  /** Niveau du titre dans la page. */
  readonly level = input<2 | 3>(2);
  readonly lift = input(false);

  protected readonly id = `section-card-${nextId++}`;
  /** « 4 frais · 1 en retard » : le point ne précède que le segment d'alerte. */
  protected readonly separator = computed(() => (this.countAlert() ? ' · ' : ''));
}
