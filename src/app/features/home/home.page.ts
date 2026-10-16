import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { childLink, navEntry } from '../../core/navigation/nav';
import { childClass, childFullName } from '../../core/session/child-format';
import { HomeFacade } from './data-access/home.facade';
import { GreetingComponent } from './greeting/greeting.component';
import { TileGroupComponent } from './tile-group/tile-group.component';

/**
 * Accueil : un sommaire. Salutation, puis les cinq groupes de tuiles qui mènent à toutes les
 * pages. Ne dépend d'aucun chargement : tout s'affiche dès que le bootstrap est en mémoire.
 */
@Component({
  selector: 'app-home-page',
  imports: [GreetingComponent, RouterLink, TileGroupComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomePage {
  readonly childId = input.required<string>();

  private readonly facade = inject(HomeFacade);

  protected readonly groups = this.facade.groups;
  protected readonly today = new Date();
  protected readonly parentName = computed(() => this.facade.greetingName(this.childId()));
  private readonly child = computed(() => this.facade.child(this.childId()));
  protected readonly childName = computed(() => {
    const child = this.child();
    return child ? childFullName(child) : '';
  });
  protected readonly childClass = computed(() => {
    const child = this.child();
    return child ? childClass(child) : null;
  });
  protected readonly messagesLink = computed(() =>
    childLink(this.childId(), navEntry('messages').path),
  );
}
