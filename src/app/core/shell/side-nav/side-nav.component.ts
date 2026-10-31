import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Params, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { CounterComponent } from '../../../shared/ui/counter/counter.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { NavEntry, NavEntryId, childLink } from '../../navigation/nav';
import { NavigationProgress } from '../../navigation/navigation-progress';
import { sharedWeekParams } from '../../navigation/shared-week';
import { Child } from '../../session/bootstrap.schema';
import { childClass, childName, childPhoto } from '../../session/child-format';

/**
 * Menu latéral, au bureau uniquement (≥ 905 px) : choix de l'enfant et accès permanent à
 * toutes les pages — ce que l'Accueil fait seul au téléphone. L'entrée touchée se marque dès le
 * clic, sans attendre que la page soit chargée. Mes messages et chaque enfant portent leurs
 * annonces non lues. Mes devoirs, Mes évaluations et Mon emploi du temps se passent la semaine
 * affichée.
 */
@Component({
  selector: 'app-side-nav',
  imports: [AvatarComponent, CounterComponent, IconComponent, RouterLink, RouterLinkActive],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideNavComponent {
  readonly children = input.required<readonly Child[]>();
  readonly activeChildId = input.required<string>();
  readonly entries = input.required<readonly NavEntry[]>();
  /** Nouveautés par page, pour l'enfant affiché (Mes messages). */
  readonly counts = input<Partial<Record<NavEntryId, number>>>({});
  readonly childSelected = output<string>();

  protected readonly name = childName;
  protected readonly className = childClass;
  protected readonly photo = childPhoto;

  private readonly router = inject(Router);
  private readonly progress = inject(NavigationProgress);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.parseUrl(this.router.url)),
    ),
    { initialValue: this.router.parseUrl(this.router.url) },
  );
  /** Paramètres du lien de chaque entrée, par chemin. */
  protected readonly linkParams = computed<Record<string, Params>>(() =>
    Object.fromEntries(
      this.entries().map((entry) => [entry.path, sharedWeekParams(this.url(), entry.path)]),
    ),
  );

  protected link(path: string): string[] {
    return childLink(this.activeChildId(), path);
  }

  /** L'entrée vers laquelle la navigation est en cours. */
  protected pending(path: string): boolean {
    const pending = this.progress.pendingPath();
    return pending !== null && pending === this.router.createUrlTree(this.link(path)).toString();
  }
}
