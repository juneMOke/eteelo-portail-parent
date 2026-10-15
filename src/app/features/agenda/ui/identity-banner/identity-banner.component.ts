import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { StatusView } from '../../data-access/assignment-status';

/** Une case de la grille ; une information inconnue s'écrit « — ». */
export interface BannerFact {
  readonly label: string;
  readonly value: string | null;
}

/**
 * ⑤ Bandeau d'identité de la fiche : titre, matière (· type), statut, enseignant, puis quatre
 * informations, ni plus ni moins. Seul aplat de couleur pleine de la page, réservé au statut.
 */
@Component({
  selector: 'app-identity-banner',
  imports: [BadgeComponent],
  templateUrl: './identity-banner.component.html',
  styleUrl: './identity-banner.component.css',
  host: { '[style.--tone]': "'var(--color-tone-' + status().tone + ')'" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentityBannerComponent {
  readonly heading = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly status = input.required<StatusView>();
  readonly teacher = input<string | null>(null);
  readonly facts = input.required<readonly [BannerFact, BannerFact, BannerFact, BannerFact]>();
}
