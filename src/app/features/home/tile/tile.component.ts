import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavEntry, childLink } from '../../../core/navigation/nav';
import { IconComponent } from '../../../shared/ui/icon/icon.component';

/** Une destination : icône neutre, titre sur une ligne, chevron. Toute la tuile est cible. */
@Component({
  selector: 'app-tile',
  imports: [IconComponent, RouterLink],
  template: `
    <a class="tile" [routerLink]="link()">
      <span class="icon"><ui-icon [name]="entry().icon" [size]="18" /></span>
      <span class="title">{{ entry().title }}</span>
      <ui-icon class="chevron" name="chevron-right" [size]="18" [strokeWidth]="2" />
    </a>
  `,
  styleUrl: './tile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TileComponent {
  readonly entry = input.required<NavEntry>();
  readonly childId = input.required<string>();

  protected readonly link = computed(() => childLink(this.childId(), this.entry().path));
}
