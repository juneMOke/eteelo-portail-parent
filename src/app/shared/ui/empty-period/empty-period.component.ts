import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

/**
 * Période sans contenu (un jour, une semaine, une période non cotée) : une surface Papier, un
 * titre de fait et, si possible, un lien vers la donnée la plus proche. Jamais de reproche
 * implicite, pas d'illustration.
 */
@Component({
  selector: 'ui-empty-period',
  imports: [RouterLink],
  template: `
    <h2>{{ heading() }}</h2>
    @if (linkLabel(); as label) {
      <a
        class="next"
        [routerLink]="link()"
        [queryParams]="queryParams()"
        replaceUrl
        (click)="linkClick.emit()"
        >{{ label }}</a
      >
    } @else if (message()) {
      <p>{{ message() }}</p>
    }
  `,
  styleUrl: './empty-period.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyPeriodComponent {
  readonly heading = input.required<string>();
  /** Phrase de fait, quand aucun lien ne mène plus loin. */
  readonly message = input<string | null>(null);
  /** Lien vers la donnée la plus proche, ex. « Dernière évaluation : jeudi 18/09 ». */
  readonly linkLabel = input<string | null>(null);
  /** Destination du lien ; par défaut la page courante, avec d'autres paramètres. */
  readonly link = input<readonly string[]>([]);
  readonly queryParams = input<Params>({});
  /** Le lien disparaît avec la période vide : la page peut déplacer le focus. */
  readonly linkClick = output<void>();
}
