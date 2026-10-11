import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SCHOOL_LOGO_URL } from '../api/parent-api';
import { NAV_ENTRIES } from '../navigation/nav';
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
  protected readonly hasSeveralChildren = computed(() => this.children().length > 1);
  protected readonly logoUrl = computed(() =>
    this.school()?.logoFingerprint ? SCHOOL_LOGO_URL : null,
  );
  protected readonly title = this.page.title;
  protected readonly isHome = this.page.isHome;

  /** Même page, autre enfant : seul le segment c/:childId de l'URL change. */
  protected selectChild(childId: string): void {
    void this.router.navigateByUrl(this.router.url.replace(/^\/c\/[^/?#]+/, `/c/${childId}`));
  }
}
