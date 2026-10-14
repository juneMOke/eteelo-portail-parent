import { Injectable, inject } from '@angular/core';
import { NAV_GROUPS, NavGroup } from '../../../core/navigation/nav';
import { Child } from '../../../core/session/bootstrap.schema';
import { SessionStore } from '../../../core/session/session.store';
import { greeting } from './greeting';

/**
 * Façade de l'Accueil. Aucun appel réseau : tout vient du bootstrap déjà en mémoire.
 * Met en forme les données brutes (civilité) ; la navigation suit le catalogue unique.
 */
@Injectable({ providedIn: 'root' })
export class HomeFacade {
  private readonly session = inject(SessionStore);

  readonly groups: readonly NavGroup[] = NAV_GROUPS;

  child(childId: string): Child | undefined {
    return this.session.childById(childId);
  }

  greeting(childId: string): string {
    return greeting(this.session.parent()?.lastName, this.child(childId)?.relationshipType);
  }
}
