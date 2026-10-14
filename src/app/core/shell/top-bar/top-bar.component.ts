import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { HOME_ENTRY, childLink, navEntry } from '../../navigation/nav';
import { Child, School } from '../../session/bootstrap.schema';
import { childClass, childName } from '../../session/child-format';
import { ChildPillComponent } from '../child-pill/child-pill.component';

/**
 * Barre haute, collée en haut sur toutes les pages : école et enfant affiché, phrase d'aide,
 * titre de la page (titre principal du document), Messages et Notifications.
 * Sur toute page autre que l'Accueil, un bouton retour ramène à l'Accueil.
 */
@Component({
  selector: 'app-top-bar',
  imports: [ChildPillComponent, IconComponent, RouterLink, RouterLinkActive],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  readonly school = input.required<School>();
  readonly logoUrl = input<string | null>(null);
  readonly child = input.required<Child>();
  readonly interactive = input(true);
  readonly title = input<string | null>(null);
  readonly showBack = input(false);
  readonly changeChild = output<void>();

  protected readonly home = HOME_ENTRY;
  protected readonly actions = [navEntry('messages'), navEntry('notifications')];

  protected link(path?: string): string[] {
    return childLink(this.child().childId, path);
  }

  protected readonly crest = computed(() =>
    this.school()
      .name.split(/\s+/)
      .filter((word) => /^\p{Lu}/u.test(word))
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join(''),
  );

  protected readonly help = computed(() => {
    const child = this.child();
    const className = childClass(child);
    const shown = `Enfant affiché : ${childName(child)}${className ? ` (${className})` : ''}.`;
    return this.interactive()
      ? `${shown} Touchez le bouton clair en haut à droite pour basculer sur un autre enfant.`
      : shown;
  });
}
