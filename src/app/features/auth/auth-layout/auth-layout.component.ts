import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CardComponent } from '../../../shared/ui/card/card.component';

/**
 * Cadre commun des pages de connexion : marque ETEELO et carte centrée.
 * Sans encapsulation pour styler le contenu projeté (titre, paragraphes, alertes) une seule fois ;
 * toutes les règles restent préfixées par app-auth-layout.
 */
@Component({
  selector: 'app-auth-layout',
  imports: [CardComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {}
