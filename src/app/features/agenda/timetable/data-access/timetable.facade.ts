import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { ParentApi } from '../../../../core/api/parent-api';
import { TimetableWeek } from '../../../../core/api/timetable.contract';
import { addDays } from '../../../../shared/date/civil-date';
import {
  SessionCache,
  SessionResource,
  sessionResource,
} from '../../../../shared/resource/session-cache';
import { openingDay, schoolInstant } from './timetable-view';

export interface TimetableRequest {
  readonly childId: string;
  /** Un jour de la semaine voulue ; absent, la semaine d'ouverture. */
  readonly week?: string;
}

/** Une semaine reçue, et l'instant de sa réception : l'horloge de l'école s'en déduit. */
export interface ReceivedTimetable extends TimetableWeek {
  /** `Date.now()` à la réception, pour avancer `serverTime` sans relire le serveur. */
  readonly receivedAt: number;
}

/**
 * Façade de Mon emploi du temps (lecture seule, pas de store). Une semaine par appel, relue à
 * chaque changement de semaine et à chaque ouverture ; la dernière réponse reste en mémoire pour
 * la session (`sessionResource`), rien n'est stocké sur le téléphone (invariant 5). Blocs
 * fusionnés, pauses, compteurs et épreuves rattachées viennent du serveur.
 */
@Injectable({ providedIn: 'root' })
export class TimetableFacade {
  private readonly api = inject(ParentApi);
  private readonly cache = inject(SessionCache);

  /**
   * Sans semaine demandée, la semaine d'ouverture : celle du serveur, ou la suivante quand les
   * cours de la semaine sont finis (vendredi après le dernier cours → lundi suivant).
   */
  week(request: TimetableRequest): Observable<ReceivedTimetable> {
    const received = (week: TimetableWeek): ReceivedTimetable => ({
      ...week,
      receivedAt: Date.now(),
    });
    const { childId, week } = request;
    if (week) return this.api.timetable(childId, week).pipe(map(received));
    return this.api.timetable(childId).pipe(
      switchMap((current) => {
        const next = addDays(current.weekStart, 7);
        const finished = openingDay(current, schoolInstant(current.serverTime, current.timeZone));
        return finished === null && next <= current.window.to
          ? this.api.timetable(childId, next)
          : of(current);
      }),
      map(received),
    );
  }

  /** À créer dans un contexte d'injection (initialiseur de champ d'une page). */
  weekResource(request: () => TimetableRequest): SessionResource<ReceivedTimetable> {
    return sessionResource({
      cache: this.cache,
      name: 'timetable.week',
      params: request,
      stream: ({ params }) => this.week(params),
    });
  }
}
