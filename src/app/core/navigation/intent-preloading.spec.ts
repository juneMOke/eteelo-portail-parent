import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Route } from '@angular/router';
import { of } from 'rxjs';
import { IntentPreloading, routeMatches } from './intent-preloading';

describe('routeMatches', () => {
  it('retrouve le chemin d’une route dans l’URL visée', () => {
    expect(routeMatches({ path: 'timetable' }, '/c/42/timetable')).toBe(true);
    expect(routeMatches({ path: 'c/:childId' }, '/c/42/grades/week')).toBe(true);
    expect(routeMatches({ path: 'week' }, '/c/42/grades/week?from=home')).toBe(true);
    expect(routeMatches({ path: 'timetable' }, '/c/42/homework')).toBe(false);
    expect(routeMatches({ path: 'login/:token' }, '/login')).toBe(false);
    expect(routeMatches({ path: '' }, '/c/42/homework')).toBe(true);
  });
});

describe('IntentPreloading', () => {
  function setup() {
    const strategy = TestBed.inject(IntentPreloading);
    const document = TestBed.inject(DOCUMENT);
    const link = document.createElement('a');
    link.href = '/c/42/timetable';
    document.body.append(link);
    const loads: string[] = [];
    const preload = (route: Route) =>
      strategy.preload(route, () => of(loads.push(route.path!))).subscribe();
    return { link, loads, preload };
  }

  afterEach(() => document.body.replaceChildren());

  it('ne charge rien sans intention', () => {
    const { loads, preload } = setup();

    preload({ path: 'timetable' });
    preload({ path: 'homework' });

    expect(loads).toEqual([]);
  });

  it('charge la page d’un lien survolé, touché ou atteint au clavier, et elle seule', () => {
    const { link, loads, preload } = setup();
    preload({ path: 'timetable' });
    preload({ path: 'homework' });

    link.dispatchEvent(new Event('pointerover', { bubbles: true }));
    link.dispatchEvent(new Event('touchstart', { bubbles: true }));

    expect(loads).toEqual(['timetable']);
  });

  it('charge les pages d’une feature arrivées après l’intention', () => {
    const { link, loads, preload } = setup();

    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    preload({ path: '' });

    expect(loads).toEqual(['']);
  });

  it('ignore un lien vers l’API (un reçu, un document)', () => {
    const { link, loads, preload } = setup();
    link.href = '/api/v1/parent/children/42/statement';
    preload({ path: 'statement' });

    link.dispatchEvent(new Event('pointerover', { bubbles: true }));

    expect(loads).toEqual([]);
  });
});
