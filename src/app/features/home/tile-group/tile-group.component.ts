import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NavEntryId, NavGroup } from '../../../core/navigation/nav';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { TileComponent } from '../tile/tile.component';

let nextId = 0;

/** Un groupe de l'Accueil : section titrée, non cliquable ; seules ses tuiles le sont. */
@Component({
  selector: 'app-tile-group',
  imports: [CardComponent, TileComponent],
  templateUrl: './tile-group.component.html',
  styleUrl: './tile-group.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TileGroupComponent {
  readonly group = input.required<NavGroup>();
  readonly childId = input.required<string>();
  /** Nouveautés par destination (Mes messages). */
  readonly counts = input<Partial<Record<NavEntryId, number>>>({});

  protected readonly headingId = `tile-group-${nextId++}`;
}
