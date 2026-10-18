import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { timetableFixture } from '../../../../../testing/timetable.fixture';
import { schoolClock } from './school-clock';
import { ReceivedTimetable } from './timetable.facade';

describe('schoolClock', () => {
  afterEach(() => vi.useRealTimers());

  it('avance l’heure du serveur du temps écoulé depuis la réception', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    const week = signal<ReceivedTimetable | undefined>(undefined);
    const clock = TestBed.runInInjectionContext(() => schoolClock(week));
    expect(clock()).toBeNull();

    // Le téléphone se croit en 2030 : seule la durée écoulée compte.
    week.set({ ...timetableFixture()!, receivedAt: Date.now() });
    expect(clock()).toEqual({ date: '2026-09-22', time: '10:30' });

    vi.advanceTimersByTime(46 * 60_000);
    expect(clock()).toEqual({ date: '2026-09-22', time: '11:16' });
  });
});
