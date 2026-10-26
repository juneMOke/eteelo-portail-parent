import { Injectable, Signal, computed, inject } from '@angular/core';
import { tap } from 'rxjs';
import { ParentAnnouncementList } from '../../../core/api/announcements.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { PushStore } from '../../../core/push/push.store';
import { DEFAULT_SCHOOL_TIME_ZONE } from '../../../core/session/bootstrap.schema';
import { SessionStore } from '../../../core/session/session.store';
import {
  SessionCache,
  SessionResource,
  sessionResource,
} from '../../../shared/resource/session-cache';

/**
 * Façade de Mes messages en lecture : les communiqués de l'école pour l'enfant, année en cours,
 * sans réponse possible (décision du 25/10/2026). La liste est relue à chaque ouverture et met à
 * jour le badge de l'enfant avec le compte du serveur. La lecture d'une annonce passe par
 * `AnnouncementReadStore`. Elle porte aussi les notifications de ce téléphone (`PushStore`).
 */
@Injectable({ providedIn: 'root' })
export class MessagesFacade {
  private readonly api = inject(ParentApi);
  private readonly cache = inject(SessionCache);
  private readonly session = inject(SessionStore);
  private readonly push = inject(PushStore);

  /** Fuseau de l'école : les dates d'envoi se lisent à son heure. */
  readonly timeZone: Signal<string> = computed(
    () => this.session.school()?.timeZone ?? DEFAULT_SCHOOL_TIME_ZONE,
  );

  /** Notifications de ce téléphone : proposées, activées, bloquées… */
  readonly pushStatus = this.push.status;
  readonly pushBusy = this.push.busy;
  readonly pushFailed = this.push.failed;
  /** La dernière annonce arrivée par notification pendant que le portail est ouvert. */
  readonly pushArrival = this.push.arrival;

  enablePush(): Promise<void> {
    return this.push.enable();
  }

  disablePush(): Promise<void> {
    return this.push.disable();
  }

  /** À créer dans un contexte d'injection (initialiseur de champ d'une page). */
  announcementsResource(childId: () => string): SessionResource<ParentAnnouncementList> {
    return sessionResource({
      cache: this.cache,
      name: 'communication.announcements',
      params: childId,
      stream: ({ params }) =>
        this.api
          .announcements(params)
          .pipe(tap((list) => this.session.setUnreadAnnouncements(params, list.unreadCount))),
    });
  }
}
