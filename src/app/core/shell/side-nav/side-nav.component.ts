import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { NavEntry, childLink } from '../../navigation/nav';
import { NavigationProgress } from '../../navigation/navigation-progress';
import { Child } from '../../session/bootstrap.schema';
import { childClass, childName, childPhoto } from '../../session/child-format';

/**
 * Menu latéral, au bureau uniquement (≥ 905 px) : choix de l'enfant et accès permanent à
 * toutes les pages — ce que l'Accueil fait seul au téléphone. L'entrée touchée se marque dès le
 * clic, sans attendre que la page soit chargée.
 */
@Component({
  selector: 'app-side-nav',
  imports: [AvatarComponent, IconComponent, RouterLink, RouterLinkActive],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideNavComponent {
  readonly children = input.required<readonly Child[]>();
  readonly activeChildId = input.required<string>();
  readonly entries = input.required<readonly NavEntry[]>();
  readonly childSelected = output<string>();

  protected readonly name = childName;
  protected readonly className = childClass;
  protected readonly photo = childPhoto;

  private readonly router = inject(Router);
  private readonly progress = inject(NavigationProgress);

  protected link(path: string): string[] {
    return childLink(this.activeChildId(), path);
  }

  /** L'entrée vers laquelle la navigation est en cours. */
  protected pending(path: string): boolean {
    const pending = this.progress.pendingPath();
    return pending !== null && pending === this.router.createUrlTree(this.link(path)).toString();
  }
}
