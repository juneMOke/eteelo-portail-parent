import { DestroyRef, Signal, computed, inject, signal } from '@angular/core';
import { ReceivedTimetable } from './timetable.facade';
import { SchoolInstant, schoolInstant } from './timetable-view';

/** Assez souvent pour que « En ce moment » change à la minute près. */
const TICK_MS = 15_000;

/**
 * L'heure de l'école, à la minute : `serverTime` avancé du temps écoulé depuis la réception de la
 * semaine. L'horloge du téléphone ne sert qu'à mesurer ce temps écoulé, jamais à dire l'heure.
 * À créer dans un contexte d'injection.
 */
export function schoolClock(
  source: () => ReceivedTimetable | undefined,
): Signal<SchoolInstant | null> {
  const tick = signal(Date.now());
  const timer = setInterval(() => tick.set(Date.now()), TICK_MS);
  inject(DestroyRef).onDestroy(() => clearInterval(timer));
  return computed(
    () => {
      const week = source();
      if (!week) return null;
      const now = Date.parse(week.serverTime) + tick() - week.receivedAt;
      return schoolInstant(now, week.timeZone);
    },
    { equal: (a, b) => a?.date === b?.date && a?.time === b?.time },
  );
}
