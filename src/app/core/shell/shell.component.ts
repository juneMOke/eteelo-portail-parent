import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { schoolLogoUrl } from '../api/parent-api';
import { HOME_ENTRY, NAV_ENTRIES, childLink } from '../navigation/nav';
import { PageTitleStrategy } from '../navigation/page-title.strategy';
import { SessionStore } from '../session/session.store';
import { ChildPickerSheetComponent } from './child-picker-sheet/child-picker-sheet.component';
import { SideNavComponent } from './side-nav/side-nav.component';
import { TopBarComponent } from './top-bar/top-bar.component';

/**
 * Cadre des pages d'un enfant, monté sur la route c/:childId. Changer d'enfant ne change que
 * le paramètre : le composant est réutilisé, la barre ne se redessine pas.
 */
@Component({
  selector: 'app-shell',
  imports: [ChildPickerSheetComponent, RouterOutlet, SideNavComponent, TopBarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ShellComponent {
  readonly childId = input.required<string>();

  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly page = inject(PageTitleStrategy);

  protected readonly entries = NAV_ENTRIES;
  protected readonly children = this.session.children;
  protected readonly school = this.session.school;
  protected readonly child = computed(() => this.session.childById(this.childId()));
  /** Annonces non lues de l'enfant affiché, sur Mes messages. */
  protected readonly counts = computed(() => ({
    messages: this.child()?.unreadAnnouncements ?? 0,
  }));
  protected readonly hasSeveralChildren = computed(() => this.children().length > 1);
  protected readonly logoUrl = computed(() => {
    const fingerprint = this.school()?.logoFingerprint;
    return fingerprint ? schoolLogoUrl(fingerprint) : null;
  });
  protected readonly title = this.page.title;
  protected readonly isHome = this.page.isHome;
  protected readonly back = this.page.back;

  /**
   * Même page, autre enfant : seul le segment c/:childId de l'URL change. Depuis une fiche
   * (page imbriquée), on va à la liste de l'autre enfant : la fiche n'est pas la sienne.
   */
  protected selectChild(childId: string): void {
    const back = this.back().entry;
    if (back.id !== HOME_ENTRY.id) {
      void this.router.navigate(childLink(childId, back.path));
      return;
    }
    void this.router.navigateByUrl(this.router.url.replace(/^\/c\/[^/?#]+/, `/c/${childId}`));
  }
}
