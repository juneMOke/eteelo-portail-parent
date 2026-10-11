import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NavGroup } from '../../../core/navigation/nav';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { TileComponent } from '../tile/tile.component';

let nextId = 0;

/** Un groupe de l'Accueil : section titrée, non cliquable ; seules ses tuiles le sont. */
@Component({
  selector: 'app-tile-group',
  imports: [CardComponent, TileComponent],
  template: `
    <section [attr.aria-labelledby]="headingId">
      <ui-card>
        <h2 [id]="headingId">{{ group().title }}</h2>
        <ul>
          @for (entry of group().entries; track entry.id) {
            <li><app-tile [entry]="entry" [childId]="childId()" /></li>
          }
        </ul>
      </ui-card>
    </section>
  `,
  styles: `
    h2 {
      color: var(--color-heading);
      font-family: var(--font-title);
      font-size: var(--text-base);
      font-weight: var(--weight-semibold);
      line-height: 1.3;
    }
    ul {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    @media (min-width: 600px) {
      ul {
        grid-template-columns: repeat(auto-fill, minmax(186px, 1fr));
      }
    }
    @media (min-width: 905px) {
      ul {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TileGroupComponent {
  readonly group = input.required<NavGroup>();
  readonly childId = input.required<string>();

  protected readonly headingId = `tile-group-${nextId++}`;
}
